Don't wrap the LLM. Don't wrap its tools either.
All you need is a SKILL.md and some Python helpers. The LLM has complete freedom. If something's missing, it writes it.
The learning
A few months ago we wrote The Bitter Lesson of Agent Frameworks. The argument: don't wrap the LLM in abstractions. Maximal action space, then restrict.
We were still wrapping its tools.
Every click(), type(), scroll() helper is an abstraction you decided the model needs. Every one of them is a constraint the RL'd model has to fight around.
Why raw CDP
When we built the first version of Browser Use, we shipped thousands of lines of element extractors, DOM indexers, click wrappers.
LLMs know CDP. They were trained on millions of tokens of Page.navigate, DOM.querySelector, Runtime.evaluate.
CDP is the lowest level Chrome exposes. Give it directly to the model:
Cross-origin iframes. Attach to the target directly, no frame abstraction to fight.
Shadow DOM. Walk shadowRoot.querySelectorAll like the model has seen ten thousand times.
Anti-bot injection. It's Chrome talking to itself.
What we got wrong
A few months ago on this blog we wrote Closer to the Metal: Leaving Playwright for CDP. The conclusion of that post: "Our agents shouldn't have to know the nuances of CDP Targets in order to Get Stuff Done."
Turns out we were wrong.
That post listed ten ways a Chrome tab can crash. We built watchdog services to catch each one - tab crashes, target detach, renderer OOM, zygote death, GPU process crash. Each got a handler. Each handler had to be kept in sync with Chrome's internals.
Give the LLM direct CDP access and the ability to edit its own harness, and it handles all of that itself. Pages dying, targets wrongly attached, Chrome stalling - the agent reads the error, reattaches to a fresh target, retries. It doesn't need a watchdog. It's read ten thousand threads about Chrome crashes. It already knows what to do.
The "complexities of CDP" we were trying to hide weren't something to hide. They were something to let the model see.
Four files
That's the whole harness:
run.py (13 lines) - runs plain Python with helpers preloaded
helpers.py (192 lines) - thin wrappers around CDP, and the agent edits them
daemon.py (220 lines) - keeps the CDP websocket alive
SKILL.md - tells the agent how to use the above
~600 lines total.
The agent writes Python. The Python imports helpers. The helpers speak CDP. Chrome does what it's told. Everything above Chrome is rewriteable.
The self-heal loop
Here's what happens when a tool is missing.
When a helper is missing, the agent does what any Claude Code user would do: greps helpers.py, adds the function, reruns.
We didn't tell it to do this. We gave it Claude Code's normal Read/Edit/Write plus CDP access. Coding agents already know how to fix a missing import.
The key: the agent isn't writing new code from first principles. It's writing the one function that was missing, the same way it'd fix a missing import on any codebase.
Magical moments
Upload. We forgot to add upload_file(). Mid-task, the agent hit a file input, grepped helpers.py, saw nothing, wrote the function using raw DOM.setFileInputFiles, and uploaded the file. We found out when we read the git diff.
Chunked upload. After writing upload_file, the agent tried to upload a 12MB file. CDP websocket payloads cap around 10MB. It hit the limit, read the error, switched to a chunked upload pattern.
Gusto to calendar. Task: put every employee's birthday in our shared calendar. Required navigating Gusto's employee tab, extracting dates from the DOM, then creating Google Calendar events.
Azure admin roles. Azure's admin portal is a pile of blades inside iframes. Raw CDP, via coordinate-level Input.dispatchMouseEvent, passes through at the compositor level.