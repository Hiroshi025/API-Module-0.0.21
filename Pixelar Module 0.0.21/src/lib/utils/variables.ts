import chalk from "chalk";

import { Labels } from "@typings/types/types";

/**
 * List of files that have been loaded. This array keeps track of all the files
 * that have been successfully loaded into the bot's system. Each entry is
 * either a string (file path) or `undefined` if a file wasn't loaded.
 *
 * @type {(string | undefined)[]}
 */
export const filesLoaded: (string | undefined)[] = [];

/**
 * cooldowns for commands in the bot.
 * This map stores the cooldowns for each command in the bot.
 *
 */
export const cooldowns = new Map<string, number>();

/* --- Define colors for log labels --- */
export const labelColors: Record<Labels, chalk.Chalk> = {
  error: chalk.redBright,
  success: chalk.greenBright,
  debug: chalk.magentaBright,
  info: chalk.blueBright,
  maintenance: chalk.hex("#FFA500"),
  shards: chalk.hex("#FFA500"),
  warn: chalk.yellowBright,
  cache: chalk.hex("#5c143b"),
  PM2: chalk.grey,
};

/* --- Define labels for log messages --- */
export const labelNames: Record<Labels, string> = {
  error: "Error",
  success: "Success",
  debug: "Debug",
  info: "Info",
  maintenance: "Maintenance",
  shards: "Shards",
  warn: "Warn",
  cache: "Cache",
  PM2: "PM2",
};