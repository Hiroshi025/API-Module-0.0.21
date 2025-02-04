/* eslint-disable @typescript-eslint/no-require-imports */
import chalk from "chalk";
import { ClientEvents, REST, Routes } from "discord.js";
import { Discord } from "eternal-support";
import fs from "fs";
import path from "path";

import { ClientError } from "@lib/extenders/error.extend";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { filesLoaded } from "@lib/utils/variables";
import { BotClient } from "@modules/discord/class/client";
import { FileType } from "@typings/types/types";
import { getFiles } from "@utils/functions";

import { Addons } from "../class/addons";
import { Command, Event } from "../class/builders";

export class Handlers {
  client: BotClient;
  constructor(client: BotClient) {
    this.client = client;
  }

  /**
   * Loads commands, events, and addons from their respective directories and initializes them.
   *
   * - Loads command modules from the `pathCommands` directory.
   * - Loads event modules from the `pathEvents` directory.
   * - Loads addons from the `addonsPath` directory.
   *
   * Logs the loading status of each module.
   */
  public async _load() {
    for (const dir of fs.readdirSync(`${config.paths.discord}/bot/commands/`)) {
      this.client.categories.set(dir, []);

      const files = getFiles(
        `${config.paths.discord}/bot/commands/` + dir,
        this.client.config.bot["bot-extensions"]
      );
      for (const file of files) {
        const module: Command = require(file).default;
        this.client.commands.set(module.structure.name, module);
        const data = this.client.categories.get(dir);
        data?.push(module.structure.name);
        this.client.categories.set(dir, data!);
      }
    }

    for (const dir of fs.readdirSync(`${config.paths.discord}/bot/events/`)) {
      const files = getFiles(
        `${config.paths.discord}/bot/events/` + dir,
        this.client.config.bot["bot-extensions"]
      );
      for (const file of files) {
        const module: Event<keyof ClientEvents> = require(file).default;
        filesLoaded.push(file.split("\\").pop());
        if (module.once) {
          this.client.once(module.event, (...args): void => module.run(...args));
        } else {
          this.client.on(module.event, (...args): void => module.run(...args));
        }
      }
    }

    const addonFiles = getFiles(`${config.paths.discord}/addons`, this.client.config.bot["addon-extensions"]);

    for (const file of addonFiles) {
      const addonModule = require(file).default;
      if (addonModule instanceof Addons) {
        this.client.addons.set(addonModule.structure.name, addonModule);
        await addonModule.initialize(this.client, config);
      }
    }

    logWithLabel(
      "custom",
      [
        "loaded the Addons-Client\n",
        chalk.grey(`✅ Finished Loading the Addons Module`),
        chalk.grey(`🟢 Addon-Loaded Successfully: ${addonFiles.length}`),
      ].join("\n"),
      "Addons"
    );
  }

  /**
   * Deploys slash commands to the Discord API and logs the process.
   *
   * - Sends all commands to the Discord API via REST.
   * - Logs details of the deployment such as time taken and number of commands deployed.
   *
   * @throws {Error} If there is an issue deploying the commands.
   */
  async deploy() {
    try {
      const startTime = performance.now();
      const rest = new REST({ version: "10" }).setToken(process.env.TOKEN!);

      //INFO - Eventos de control de la API
      rest.on("rateLimited", (info) => {
        logWithLabel(
          "custom",
          [
            `Method: ${info.method}`,
            `Limit: ${info.limit}`,
            `Time: ${info.timeToReset}`,
            `Url: ${info.url}`,
          ].join("\n"),
          "RateLimit"
        );
      });

      rest.on("restDebug", (info) => {
        logWithLabel("custom", info, "RestDebug");
      });

      rest.on("invalidRequestWarning", (info) => {
        logWithLabel(
          "custom",
          [`Method: ${info.count}`, `Time: ${info.remainingTime}`].join("\n"),
          "Invalid Request"
        );
      });

      const commands = [...this.client.commands.values()];
      await rest.put(Routes.applicationCommands(process.env.CLIENTID as string), {
        body: commands.map((s) => s.structure),
      });

      const endTime = performance.now();

      logWithLabel(
        "info",
        [
          `loading Bot-Events:\n`,
          filesLoaded.map((file): string => chalk.grey(`✅ Templete-Typescript-Loaded: ${file}`)).join("\n"),
        ].join("\n")
      );

      logWithLabel(
        "info",
        [
          `loaded the Slash-Commands:\n`,
          chalk.grey(`✅ Finished Loading the Slash-Commands`),
          chalk.grey(`🟢 Slash-Loaded Successfully: ${commands.length}`),
          chalk.grey(`🕛 Took: ${Math.round((endTime - startTime) / 100)}s`),
        ].join("\n")
      );

      logWithLabel("info", `${chalk.greenBright("[FINISHED]")} The started bot templete is ready to use!`);
    } catch (e) {
      throw new ClientError(`Error deploying commands: ${e}`);
    }
  }

  /**
   * Loads and sets interactive components (e.g., buttons, modals, menus) into the client.
   *
   * - Loads files from the corresponding folder depending on the component type (`buttons`, `modals`, or `menus`).
   * - Sets each loaded component in the respective client map.
   *
   * @param client - The BotCore instance.
   * @param fileType - The type of file to load (`buttons`, `modals`, `menus`).
   * @throws {InternalError} If there is an issue loading the components.
   */
  async loadAndSet(client: BotClient, fileType: FileType) {
    const folderPath = `${config.paths.discord}/bot/integrations/${fileType}`;
    const files = await Discord.loadFiles(folderPath);
    try {
      files.forEach(async (file: string) => {
        const item = (await import(file)).default;
        if (!item.id) return;
        switch (fileType) {
          case "buttons":
            client.buttons.set(item.id, item);
            break;
          case "modals":
            client.modals.set(item.id, item);
            break;
          case "menus":
            client.menus.set(item.id, item);
            break;
          default:
            break;
        }
      });
    } catch (e) {
      throw new ClientError(`Error loading ${fileType}: ${e}`);
    }
  }

  /**
   * Recursively loads and sets command components (prefix-based) into the client.
   *
   * - Reads the components from the specified directory and its subdirectories.
   * - Ensures each component has a valid `name` and `execute` function before loading.
   *
   * Logs the process of loading and the number of components successfully loaded.
   *
   * @param client - The BotCore instance.
   * @throws {InternalError} If there is an issue loading the components.
   */
  async components(client: BotClient) {
    const startTime = performance.now();

    function readComponentsRecursively(directory: string) {
      const filesAndFolders = fs.readdirSync(directory);
      for (const item of filesAndFolders) {
        const fullPath = path.join(directory, item);
        if (fs.statSync(fullPath).isDirectory()) {
          readComponentsRecursively(fullPath);
        } else if (item.endsWith(".ts") || item.endsWith(".js")) {
          try {
            const commandModule = require(fullPath);
            if (commandModule.name && commandModule.execute) {
              commandModule.path = fullPath;
              client.precommands.set(commandModule.name, commandModule);
              if (commandModule.aliases && Array.isArray(commandModule.aliases)) {
                commandModule.aliases.forEach((alias: string): void => {
                  client.aliases.set(alias, commandModule.name);
                });
              }
            } else {
              logWithLabel("error", `Error loading component ${item}: missing name or execute function`);
            }
          } catch (error) {
            logWithLabel("error", `Error loading component ${item}: ${error}`);
          }
        }
      }
    }

    try {
      const componentsDir = path.resolve(`${config.paths.discord}/bot/components/`);
      await readComponentsRecursively(componentsDir);
    } catch (error) {
      throw new ClientError(`Error loading components: ${error}`);
    }

    const endTime = performance.now();
    logWithLabel(
      "info",
      [
        `Loaded the Prefix-Commands:\n`,
        `${chalk.grey(`✅ Finished Loading the Prefix-Commands`)}`,
        `${chalk.grey(`🟢 Prefix-Loaded Successfully: ${client.precommands.size}`)}`,
        `${chalk.grey(`🕛 Took: ${Math.round((endTime - startTime) / 1000)}s`)}`,
      ].join("\n")
    );
  }
}
