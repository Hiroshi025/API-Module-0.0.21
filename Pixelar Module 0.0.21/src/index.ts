import dotenvFlow from "dotenv-flow";

import { logWithLabel } from "@lib/utils/log";
import { BotClient } from "@modules/discord/class/client";
import { config } from "@utils/config";

import { AppManager } from "./application";

// Load environment variables from the .env file with debug mode enabled
dotenvFlow.config({
  node_env: config.node_env === "development" ? "development" : "production",
  debug: true,
  default_node_env: "development",
  purge_dotenv: true,
  silent: true,
});

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

  dotenvFlow.listFiles().forEach((file) => {
    logWithLabel("custom", `Loaded environment file: ${file}`, "Env");
  });

  // Assign the initialized bot client to the `client` variable
  client = data;
});
