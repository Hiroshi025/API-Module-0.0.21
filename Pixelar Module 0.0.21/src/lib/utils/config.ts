import fs from "fs";
import path from "path";
import YAML from "yaml";

import { BotConfig } from "@/typings";

import { logWithLabel } from "./log";

/**
 * Reads a YAML configuration file and returns its parsed contents.
 * @param {string} filename - The name of the configuration file to read.
 * @returns The parsed contents of the configuration file as type `T`.
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

// Determina el archivo de configuración según NODE_ENV
const env = process.env.NODE_ENV || "development";
const configFile = `config.${env}.yml`;

const config = readConfigFile<BotConfig>(configFile);

export { config, readConfigFile };
