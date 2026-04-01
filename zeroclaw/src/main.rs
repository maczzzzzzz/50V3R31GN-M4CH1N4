use tracing_subscriber;

#[tokio::main]
async fn main() {
    tracing_subscriber::fmt::init();
    println!("ZeroClaw Rules Oracle Initializing...");
}
