/**
 * @file Main entry point for the application, responsible for initializing the AppManager and Discord BotClient.
 * Loads environment variables, sets up the application manager, and logs the startup message.
 */

import { logWithLabel } from "@lib/utils/log";
import { BotClient } from "@modules/discord/class/client";

import { AppManager } from "./application";

// Load environment variables from the .env file with debug mode enabled
process.loadEnvFile();

/**
 * The main application manager instance, responsible for managing app modules and their lifecycle.
 * @type {AppManager}
 */
export const manager: AppManager = new AppManager();

/**
 * The Discord bot client instance. This will be initialized once the application is fully loaded.
 * @type {BotClient}
 */
export let client: BotClient;

/**
 * Initializes the application and logs the startup message.
 * @returns {Promise<void>} Resolves when the application is fully started and the bot client is set.
 */
export const aplication = manager.apps().then(async (data) => {
  logWithLabel(
    "custom",
    [
      `The application controller has just started`,
      `Please if you have any questions visit ${process.env.DOCS}`,
    ].join("\n"),
    "App"
  );

  // Assign the initialized bot client to the `client` variable
  client = data;
});
