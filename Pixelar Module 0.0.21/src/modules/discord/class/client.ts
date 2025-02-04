/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	Client, Collection, ColorResolvable, EmbedBuilder, GatewayIntentBits, Options, Partials
} from "discord.js";

import { manager } from "@/index";
import { DiscordLogger } from "@lib/class/loggers";
import { Utils } from "@lib/class/utils";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { AnimeList } from "@modules/animelist/animelist";
import { initScheduler } from "@modules/animelist/graphql/scheduler";
import { Command } from "@modules/discord/class/builders";
import { EmbedResolver } from "@typings/types/types";
import { ErrorHandler } from "@utils/errors";

import { Buttons, Menus, Modals } from "../../../typings";
import { Handlers } from "../handlers/handler";

/**
 * @name BotClient
 * @description A class that extends the Discord.js Client class and adds additional
 * @version 0.0.8
 * @author MikaboshiDevs
 * @license MIT
 */
export class BotClient extends Client {
  /**
   * A method to create and return an embedded message.
   * @param {EmbedResolver} params - The parameters for the embed, including the description and color.
   * @param {string} params.description - The description to be displayed in the embed.
   * @param {string} params.color - The color of the embed (typically in hexadecimal format).
   * @returns {EmbedBuilder} An EmbedBuilder instance representing the embed message.
   */
  public embed!: ({ description, color }: EmbedResolver) => EmbedBuilder;

  /**
   * A collection that holds categories, where the key is a string identifier
   * (e.g., category name) and the value is an array of strings representing
   * the items in that category.
   *
   * @type {Collection<string, string[]>}
   */
  public categories: Collection<string, string[]> = new Collection();

  /**
   * A collection of commands, where the key is the command name and the value
   * is the command object (typically an instance of a Command class).
   *
   * @type {Collection<string, Command>}
   */
  public commands: Collection<string, Command> = new Collection();

  /**
   * A collection of buttons, where the key is a string identifier for the button
   * (e.g., button name) and the value is the button object.
   *
   * @type {Collection<string, Buttons>}
   */
  public buttons: Collection<string, Buttons> = new Collection();

  /**
   * A collection of modals, where the key is a string identifier for the modal
   * and the value is the modal object.
   *
   * @type {Collection<string, Modals>}
   */
  public modals: Collection<string, Modals> = new Collection();

  /**
   * Collection of preloaded commands.
   *
   * @type {Collection<string, unknown>}
   * @public
   */
  public precommands: Collection<string, unknown>;

  /**
   * Collection of command aliases.
   *
   * @type {Collection<string, string>}
   * @public
   */
  public aliases: Collection<string, string>;

  /**
   * A collection of menus, where the key is a string identifier for the menu
   * and the value is the menu object.
   *
   * @type {Collection<string, Menus>}
   */
  public menus: Collection<string, Menus> = new Collection();

  /**
   * A collection for addons that is not yet typed specifically.
   * The key and value are unknown and can be dynamically determined.
   *
   * @type {Collection<unknown, unknown>}
   */
  public addons: Collection<unknown, unknown>;

  /**
   * A method to retrieve an emoji from a specific guild by its ID.
   * @param {string} guildId - The ID of the guild (server) from which the emoji is to be fetched.
   * @returns {any} The emoji or an emoji-related object retrieved from the guild.
   */
  public getEmoji!: (guildId: string) => any;

  /**
   * A property that holds a set of handlers for various events or actions.
   * The exact type of handlers is unspecified, but it may include things like
   * event listeners or command handlers.
   *
   * @type {Handlers}
   */
  public handlers: Handlers;
  public utils: Utils;

  /**
   * Map of active cooldowns for commands.
   *
   * @type {Map<string, number>}
   * @public
   */
  public cooldown: Map<string, number>;

  //**************************************************
  public animelist: AnimeList;
  //**************************************************

  /**
   * Voice generator for voice-related features.
   *
   * @type {any}
   * @public
   */
  public voiceGenerator: any;
  public config: typeof config;
  constructor() {
    super({
      makeCache: Options.cacheWithLimits({
        ...Options.DefaultMakeCacheSettings,
        ReactionManager: 0,
        AutoModerationRuleManager: 0,
        PresenceManager: 0,
        GuildBanManager: 0,
        GuildStickerManager: 0,
      }),
      sweepers: {
        ...Options.DefaultSweeperSettings,
        messages: {
          interval: 3_600, // Every hour.
          lifetime: 1_800, // Remove messages older than 30 minutes.
        },
      },
      intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildIntegrations,
        GatewayIntentBits.GuildWebhooks,
        GatewayIntentBits.GuildInvites,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.DirectMessages,
      ],
      partials: [
        Partials.GuildMember,
        Partials.Message,
        Partials.User,
        Partials.Channel,
        Partials.ThreadMember,
        Partials.GuildScheduledEvent,
      ],
    });

    this.precommands = new Collection();
    this.aliases = new Collection();

    this.categories = new Collection();
    this.commands = new Collection();
    this.addons = new Collection();

    this.cooldown = new Collection();
    this.buttons = new Collection();
    this.modals = new Collection();
    this.menus = new Collection();

    this.handlers = new Handlers(this);
    this.config = config;

    //**************************************************
    this.voiceGenerator = new Collection();
    this.animelist = new AnimeList();
    this.utils = new Utils(this);
    //**************************************************

    this._load();
  }

  /**
   * Logs into the Discord client and records the time when the application
   * connects to the service.
   * @private
   */
  public async _login() {
    try {
      await super.login(process.env.TOKEN!);

      //**************************************************
      await this.animelist.convertDataJson(manager.prisma);
      await initScheduler(manager.prisma);
      //**************************************************

      /**
       * Starts the Express server on the specified port (or 3000 by default).
       * @param {number} [port=3000] - The port number on which the server will listen for incoming connections.
       * @returns {void}
       */
      this.handlers._load();
      ErrorHandler(this);

      try {
        await Promise.all([
          this.handlers.loadAndSet(this, "buttons"),
          this.handlers.loadAndSet(this, "modals"),
          this.handlers.loadAndSet(this, "menus"),
          this.handlers.components(this),
          this.handlers.deploy(),
        ]);

        if (this.config.bot.console === true) {
          logWithLabel(
            "custom",
            [
              `The bot is now online and ready to accept commands.`,
              `Please visit the following link to access the application: ${config.express.website.channel}`,
            ].join("\n"),
            "Discord"
          );
        }
      } catch (error) {
        logWithLabel("error", `An error occurred while loading components: ${error}`);
        console.error(error);
      }
    } catch (error) {
      logWithLabel("error", `An error occurred while logging in: ${error}`);
      console.error(error);
    }
  }

  /**
   * Creates a new instance of the EmbedBuilder class and sets the author, title,
   * color, description, and footer of the embed.
   * @private
   *
   * @example
   * this.embed({ description: "Hello, World!", color: "RED" });
   */
  private async _load() {
    this.embed = ({ description, color }: EmbedResolver): EmbedBuilder => {
      return new EmbedBuilder()
        .setAuthor({
          name: config.name,
          iconURL: this.user?.displayAvatarURL() || "",
        })
        .setColor(color as ColorResolvable)
        .setDescription(description)
        .setFooter({
          text: `Time Loop: ${new Date().toLocaleTimeString() || ""} - ${config.name}`,
          iconURL: this.user?.displayAvatarURL() || "",
        });
    };

    const events = this.config.bot.logs as any;
    const logger = new DiscordLogger(events, this);
    this.setMaxListeners(0);
    logger.init();
  }
}
