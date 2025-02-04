import fs from "fs";
import path from "path";
import YAML from "yaml";

import { BotConfig } from "@/typings";

import { logWithLabel } from "./log";

/**
 * The function `readConfigFile` reads a YAML configuration file from a specified directory path and
 * returns its contents as a generic type.
 * @param {string} filename - The `filename` parameter is a string that represents the name of the
 * configuration file that you want to read.
 * @returns The function `readConfigFile` returns the parsed contents of the specified configuration
 * file as type `T`.
 */
const configDir = path.resolve(__dirname, "..", "..", "..", "config");
function readConfigFile<T>(filename: string): T {
  const filePath = path.join(configDir, filename);
  try {
    const fileContents = fs.readFileSync(filePath, "utf8");
    return YAML.parse(fileContents) as T;
  } catch (error) {
    logWithLabel("error", `Error reading ${filename}: ${error}`);
    process.exit(1);
  }
}

/* The code snippet is reading two YAML configuration files, `dashboard.yml` and `config.yml`, using
the `readConfigFile` function. */
const config = readConfigFile<BotConfig>("config.yml");
export { config, readConfigFile };
