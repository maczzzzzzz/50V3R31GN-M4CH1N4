https://github.com/cocoindex-io/cocoindex
https://cocoindex.io/blogs/csv-to-kafka-live/

CocoIndex just got a Kafka target connector. You can now declare Kafka topics as a target of your pipeline the same way you’d declare a Postgres table or a vector index, and CocoIndex will incrementally produce messages as your source data changes — no producer loop, no bookkeeping, no “did I already publish this row?” logic. 
Try it
bash
git clone https://github.com/cocoindex-io/cocoindex
cd cocoindex/examples/csv_to_kafka
cp .env.example .env  # fill in your Kafka bootstrap + SASL creds
pip install -e .
cocoindex update -L main.py

From static knowledge to streaming signals
Many agent stacks today are built around periodic snapshots of their knowledge sources. The wiki is re-indexed overnight, the codebase is re-embedded on a cron, the CRM is re-pulled on a schedule, and agents read those snapshots over and over, hoping to detect when something has changed. For long-running agents that may execute for hours at a time, a snapshot captured at the start of the run quickly drifts out of sync with the underlying data.
A common next step is to wire sources directly to consumers via point-to-point webhooks, but this approach has well-known limitations once more than one consumer is involved. There is no shared path for replay or backfill, no buffer to absorb bursts when many changes arrive at once, and no common schema describing what a “change” looks like across systems. Teams that go down this path tend to end up reimplementing pieces of a durable log, separately, in each integration.
The combination of CocoIndex and Kafka takes a different approach: it treats the knowledge layer the same way operational data has been handled for years — as a stream of change events rather than a snapshot to be re-read. Drives, repos, design files, wikis, PDFs, and file shares — the unstructured data that has traditionally lived outside the streaming world — can be published to the same event backbone that already carries orders, clicks, and CDC traffic. The benefits show up in several places:

More efficient AI workloads. Embeddings, retrievals, and agent context are refreshed only when something has actually changed, which reduces redundant work and improves freshness at the same time.
A single change reaches every consumer. A commit, a renamed Drive document, or a Notion edit can update the vector index, notify an agent, update search, feed a Flink job, and land in a BI tile — without any of those systems needing to know about each other.
Easier extensibility. A new agent, a rebuilt RAG layer, or a compliance tool can be added as another subscriber to the topic, with the log providing replay so it sees historical changes the same way it sees new ones.
Better auditability. Each change consumed by an agent is durably recorded with offsets and timestamps, which makes it possible to answer questions like “did the agent see the updated policy before it acted?” with concrete evidence.
A stable contract over time. The change-event schema on the topic provides a stable interface between sources and consumers. Detectors, sources, and models can evolve independently while the wire format stays consistent.
Kafka: message in, message out — now from the unstructured world
Kafka’s contract is famously simple: a message goes in, a message comes out. That single shape is what makes the rest of the streaming ecosystem composable — Flink, ksqlDB, vector stores, OLAP sinks, search backends, microservices, agent runtimes. Anything downstream gets a real-time, replayable, fan-out-by-default view of the world by just reading a topic.
The catch is that the messages going in have historically been the structured kind: orders, clicks, IoT telemetry, Debezium CDC off Postgres or MySQL. The other half of the business — meeting notes, codebases, design files, PDFs, file shares, wikis — has lived in a parallel universe of vendor-specific webhooks, nightly batch jobs, and one-off ETL scripts no one wants to own.

CocoIndex closes that gap. It treats dynamically-changing unstructured assets as first-class CDC sources and emits clean key/value change events into Kafka, with upsert / delete / no-op semantics described later in this post.
Partnership with StreamNative
We’re partnering with StreamNative to bring real-time data infrastructure to AI workloads. The two halves fit cleanly because they answer different questions: CocoIndex looks at noisy, dynamic, unstructured sources and produces a precise answer to “what’s different since last time?” StreamNative’s Ursa-powered Kafka service makes sure that answer reaches every system that cares — reliably, at scale, with history intact. With Kafka in the middle, sources don’t have to behave like streams and agents don’t have to behave like database clients; the topic absorbs the impedance mismatch and lets each side evolve on its own schedule.

The example: CSV files → JSON messages
To make all of this concrete, we’ll build the smallest end-to-end pipeline that exercises the new connector: a local data/ folder of CSV files, watched in real time, with each row published as a JSON message to a Kafka topic on StreamNative. Edit a cell, and within a second exactly one message — for that one row — appears on the topic. Add a row, get one new message. Delete a file, and every row from it is tombstoned. The whole thing is around sixty lines of Python.

The full example lives in the CocoIndex repo. Here’s the shape of it.
https://github.com/cocoindex-io/cocoindex/tree/main/examples/csv_to_kafka

The pipeline
First, the Kafka producer is set up once at app startup using a lifespan hook, and stashed in a ContextKey so the rest of the pipeline can grab it without passing it around:

python
import cocoindex as coco
from cocoindex.connectors import kafka, localfs
from confluent_kafka.aio import AIOProducer

KAFKA_PRODUCER = coco.ContextKey[AIOProducer]("kafka_producer", tracked=False)

@coco.lifespan
async def coco_lifespan(builder: coco.EnvironmentBuilder):
    config = {
        "bootstrap.servers": KAFKA_BOOTSTRAP_SERVERS,
        "sasl.mechanism": "PLAIN",
        "security.protocol": "SASL_SSL",
        "sasl.username": KAFKA_SASL_USERNAME,
        "sasl.password": KAFKA_SASL_PASSWORD,
    }
    producer = AIOProducer(config)
    builder.provide(KAFKA_PRODUCER, producer)
    yield
Next, the per-file processor. This is where the new Kafka API shows up:

python
@coco.fn(memo=True)
async def process_csv(file: FileLike, topic_target: kafka.KafkaTopicTarget) -> None:
    text = await file.read_text()
    reader = csv.DictReader(io.StringIO(text))

    headers = reader.fieldnames
    if not headers:
        return
    first_col = headers[0]

    for row in reader:
        key_value = row.get(first_col)
        if key_value is not None:
            value = json.dumps(row)
            topic_target.declare_target_state(key=key_value, value=value)
Declare states, not messages
topic_target.declare_target_state(key=key, value=value)
CocoIndex is a state-driven data framework. The mental model is the same one you’d use for a spreadsheet, a React component tree, or a SQL materialized view: you describe what the target should look like as a function of the source, and the framework figures out the transitions. You don’t compute deltas. You don’t track “what did I send last time.” You don’t handle insert vs. update vs. delete as separate code paths. You just say, “given this CSV row, the target state for key SKU001 is this JSON blob,” and that’s it.
Kafka makes that distinction unusually visible because Kafka’s wire model is the opposite: a topic is a log of events, not a snapshot. Producers send change events; consumers (or compacted topics) reconstruct state from the log. So the question is: who’s responsible for the gap between “I have desired states” and “the broker needs to receive change events”?

Messages are derived from state transitions. You only ever talk about states. This is exactly the same pattern as the Postgres target (declare_target_state → INSERT / UPDATE / DELETE) and the vector index targets — the wire-level operations differ, but the user-facing API is the same shape, because the semantics are the same.
The reason this matters in practice: it means the same process_csv function works correctly the first time you run it, every subsequent time you run it, when a row is edited, when a row is removed, when a file is deleted, when the whole pipeline crashes and restarts. There is no separate “initial load” code path versus “incremental update” code path. There’s just “given the source, here’s what the target should look like,” and that statement is true whether the target is empty, half-populated, or already in sync.


python
@coco.fn
async def app_main() -> None:
    topic_target = await kafka.mount_kafka_topic_target(KAFKA_PRODUCER, KAFKA_TOPIC)

    files = localfs.walk_dir(
        localfs.FilePath(path="./data"),
        path_matcher=PatternFilePathMatcher(included_patterns=["**/*.csv"]),
        live=True,
    )
    await coco.mount_each(process_csv, files.items(), topic_target)

app = coco.App(coco.AppConfig(name="CsvToKafka"), app_main)
Live mode: one flag, everything else is the same
So far we’ve described what happens on a single run. But in reality, source files get edited, rows get added and removed, and you usually want the topic to keep up. The same process_csv runs as a catch-up run — scan once, reconcile everything that’s changed since last time, exit — or as a continuously-running pipeline that keeps watching for changes. The diff between the two is one keyword argument and one CLI flag:

Catch-up run:
python
files = localfs.walk_dir(
    localfs.FilePath(path="./data"),
    path_matcher=PatternFilePathMatcher(included_patterns=["**/*.csv"]),
)
await coco.mount_each(process_csv, files.items(), topic_target)
python
cocoindex update main.py
Live:
python
files = localfs.walk_dir(
    localfs.FilePath(path="./data"),
    path_matcher=PatternFilePathMatcher(included_patterns=["**/*.csv"]),
    live=True,                 # ← +1 line
)
await coco.mount_each(process_csv, files.items(), topic_target)
That’s the entire diff. process_csv doesn’t change. The Kafka target doesn’t change. There’s no separate “streaming” code path to maintain.
Run the live version:
python
cocoindex update -L main.py
CocoIndex does a full scan first, publishes one message per row, then sits there watching data/:
Edit one cell in products.csv — exactly one Kafka message is produced for that one row (modulo broker retries; the producer is at-least-once by default). The other four rows are silent.
Add a new row — one new message.
Delete a row — one delete message (no value, since this example doesn’t supply a deletion_value_fn).
Add a brand new CSV file — process_csv runs once for that file, publishing its rows.
Delete a CSV file — every row from that file gets a delete message.


Looking at the topic
We pointed this at a Kafka cluster on StreamNative Cloud — it gave us a real SASL_SSL endpoint in one click, with a hosted console for inspecting messages without writing a consumer. (Plain localhost:9092 works too if you skip the SASL fields in the producer config.)
Here’s what shows up in the console for the cocoindex-csv-rows topic after running the example:
