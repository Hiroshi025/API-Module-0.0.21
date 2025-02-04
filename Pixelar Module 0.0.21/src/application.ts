import chalk from "chalk";
import NodeCache from "node-cache";

import { APIClient } from "@backend/express";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { BotClient } from "@modules/discord/class/client";
import { WhatsApp } from "@modules/whatsapp/whatsapp";
import { PrismaClient } from "@prisma/client";

/**
 * @name AppManager
 * @description The class AppManager is responsible for managing the discord bot, express server and WhatsApp client
 * @alias Manager
 * @class
 * 
 * @example
 * import { AppManager } from "@/application";
 * const manager = new AppManager();
 * manager.apps();
 * 
 */
export class AppManager {

  //*****************************
  private discord: BotClient;
  private whatsapp: WhatsApp;
  private backend: APIClient;
  //*****************************

  //*****************************
  public config: typeof config;
  public prisma: PrismaClient;
  public cache: NodeCache;
  //*****************************

  constructor() {
    //***********************************************//
    this.discord = new BotClient();
    this.whatsapp = new WhatsApp();
    this.cache = new NodeCache();
    this.config = config;
    //***********************************************//

    this.backend = new APIClient();
    this.prisma = new PrismaClient({
      log: ["query", "info", "warn", "error"],
    });
  }

  /**
   * @name login
   * @description Logs the bot into discord
   * @returns {Promise<BotClient>}
   */
  public async login(): Promise<BotClient> {
    this.discord._login().then(async () => {
      if (this.config.bot.console !== true) return;
      logWithLabel(
        "custom",
        [
          `Time the application was recorded within discord`,
          `🤖 ${chalk.magenta(new Date().toLocaleString() + " UTC")}`,
        ].join("\n"),
        "App"
      );
    });

    return this.discord;
  }

  public async apps(): Promise<BotClient> {
    this.backend.start(Number(process.env.PORT) || 3000);
    this.whatsapp.start();
    this.login();

    // Return the discord client
    return this.discord;
  }
}
