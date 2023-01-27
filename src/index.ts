import "dotenv/config";

import { init } from "app";
import logger from "logger";

import "dotenv/config";

init().then(
  () => {
    logger.info("Server running");
  },
  (err: any) => {
    logger.error("Error running server", err);
  }
);
