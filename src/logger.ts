import config from "config";
import bunyan = require("bunyan");
import type Logger from "bunyan";

import bformat from "bunyan-format";

const formatOut = bformat({ outputMode: "short" });
const formatErr = bformat({ outputMode: "short" }, process.stderr);

const streams: Record<string, unknown>[] = [
  {
    stream: formatOut,
    level: config.get("logger.level") || "debug",
  },
  {
    stream: formatErr,
    level: "warn",
  },
];

if (config.get("logger.toFile")) {
  streams.push({
    level: config.get("logger.level") || "debug",
    path: config.get("logger.dirLogFile"),
  });
}

const logger: Logger = bunyan.createLogger({
  name: config.get("logger.name"),
  src: true,
  streams,
});

export default logger;
