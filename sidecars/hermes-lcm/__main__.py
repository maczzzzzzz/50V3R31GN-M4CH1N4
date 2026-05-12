"""
Hermes-LCM Entry Point
Runs the Lossless Context Management provider as a service
"""

import argparse
import logging
import sys
import os
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from hermes_lcm_provider import HermesLCMProvider, IdeaBlock, register_plugin


def main():
    parser = argparse.ArgumentParser(description="Hermes-LCM: Lossless Context Management Provider")
    parser.add_argument(
        "--db-path",
        type=str,
        default=os.getenv("HERMES_LCM_DB_PATH", "/var/lib/hermes-lcm/memory.db"),
        help="Path to the SQLite database"
    )
    parser.add_argument(
        "--log-level",
        type=str,
        default=os.getenv("HERMES_LCM_LOG_LEVEL", "INFO"),
        choices=["DEBUG", "INFO", "WARNING", "ERROR"],
        help="Logging level"
    )
    parser.add_argument(
        "--test",
        action="store_true",
        help="Run in test mode (store and retrieve a sample block)"
    )
    parser.add_argument(
        "--register",
        action="store_true",
        help="Register as Tenacity plugin and exit"
    )

    args = parser.parse_args()

    # Configure logging
    log_handlers = [logging.StreamHandler(sys.stdout)]

    # Try to add file handler if log directory exists
    logger = logging.getLogger(__name__)
    log_file = "/var/log/hermes-lcm/service.log"
    if os.path.exists("/var/log/hermes-lcm") or args.test:
        if args.test:
            log_file = "/tmp/hermes-lcm-test.log"
            try:
                os.makedirs(os.path.dirname(log_file), exist_ok=True)
            except (OSError, IOError) as e:
                logger.warning(f"Failed to create log directory: {e}. Using stdout only.")
                log_file = None
        else:
            try:
                os.makedirs(os.path.dirname(log_file), exist_ok=True)
            except (OSError, IOError) as e:
                logger.warning(f"Failed to create log directory: {e}. Using stdout only.")
                log_file = None

        if log_file:
            try:
                log_handlers.append(logging.FileHandler(log_file, mode="a"))
            except (OSError, IOError) as e:
                logger.warning(f"Failed to open log file {log_file}: {e}. Using stdout only.")

    logging.basicConfig(
        level=getattr(logging, args.log_level),
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        handlers=log_handlers
    )


    # Initialize provider
    logger.info(f"Initializing Hermes-LCM with database: {args.db_path}")
    provider = HermesLCMProvider(args.db_path)

    # Test mode
    if args.test:
        logger.info("Running in test mode...")
        import uuid
        test_block = IdeaBlock(
            block_id=str(uuid.uuid4()),
            semantic="Hermes-LCM test block",
            context="Testing Node A persistence and Tailnet sync",
            relations=[{"type": "test", "target": "hermes-lcm"}],
            metadata={"source": "test", "node": "local"}
        )
        provider.store_block(test_block)
        logger.info(f"Stored test block: {test_block.block_id}")

        retrieved = provider.retrieve_block(test_block.block_id)
        if retrieved:
            logger.info(f"Successfully retrieved test block")
            print(retrieved.to_xml())
        else:
            logger.error("Failed to retrieve test block")
            sys.exit(1)
        return

    # Register plugin mode
    if args.register:
        logger.info("Registering Hermes-LCM as Tenacity plugin...")
        if register_plugin():
            logger.info("✓ Plugin registered successfully")
            sys.exit(0)
        else:
            logger.error("✗ Plugin registration failed")
            sys.exit(1)

    # Service mode (keep alive)
    logger.info("Hermes-LCM service running...")
    logger.info(f"Database path: {args.db_path}")
    logger.info(f"Primary node: {os.getenv('HERMES_LCM_IS_PRIMARY', 'false')}")

    try:
        # Keep the service alive
        import time
        while True:
            time.sleep(60)
            # Perform health checks or periodic tasks here
            logger.debug("Hermes-LCM service heartbeat")
    except KeyboardInterrupt:
        logger.info("Hermes-LCM service shutting down...")
        sys.exit(0)


if __name__ == "__main__":
    main()
