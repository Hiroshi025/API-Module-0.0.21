/*
# Discord Server: http://discord.night-support.xyz/
# Github: https://github.com/MikaboshiDev
# Docs: https://docs.night-support.xyz/
# Dashboard: http://api.night-support.xyz/

# Created by: MikaboshiDev
# Version: 1.0.3
# Discord: azazel_hla

# This file is the main configuration file for the bot.
# Inside this file you will find all the settings you need to configure the bot.
# If you have any questions, please contact us on our discord server.
# If you want to know more about the bot, you can visit our website.
*/

import {
	ChatInputCommandInteraction, ClientEvents, ContextMenuCommandBuilder, SlashCommandBuilder,
	SlashCommandOptionsOnlyBuilder, SlashCommandSubcommandsOnlyBuilder
} from "discord.js";

import { CommandOptions } from "@/typings";
import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { config } from "@lib/utils/config";
import { cooldowns } from "@lib/utils/variables";
import { BotClient } from "@modules/discord/class/client";

/**
 * @name Command
 * @description A class that represents a command in the bot system.
 * @version 0.0.3
 * @author MikaboshiDev
 *
 * @alias Command
 * @class
 */
export class Command {
  /**
   * The structure defining the command, which can be a Slash Command, Context Menu Command,
   * or other specific command builders from `discord.js`.
   *
   * @type {SlashCommandBuilder | ContextMenuCommandBuilder | SlashCommandOptionsOnlyBuilder | SlashCommandSubcommandsOnlyBuilder | Omit<SlashCommandBuilder, 'addSubcommand' | 'addSubcommandGroup | CommandBuilder'>}
   * @readonly
   */
  readonly structure:
    | CommandBuilder
    | SlashCommandBuilder
    | ContextMenuCommandBuilder
    | SlashCommandOptionsOnlyBuilder
    | SlashCommandSubcommandsOnlyBuilder
    | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">;

  /**
   * The function that runs the command when invoked.
   * It receives the `BotCore` client, the command interaction, and the configuration object.
   *
   * @type {(client: BotCore, interaction: ChatInputCommandInteraction, configuration: typeof config) => void}
   * @readonly
   */
  readonly run: (
    client: BotClient,
    interaction: ChatInputCommandInteraction,
    configuration: typeof config
  ) => void;

  /**
   * Optional configuration options for the command, such as cooldown or permissions.
   *
   * @type {CommandOptions | undefined}
   * @readonly
   */
  readonly options: CommandOptions | undefined;

  /**
   * The cooldown time for the command in seconds.
   *
   * @type {number}
   */

  /**
   * Creates an instance of Command.
   *
   * @param structure - The command structure, which can be a Slash Command, Context Menu Command, or other supported command builders.
   * @param run - The function that runs when the command is executed, receiving the bot client, the interaction, and configuration.
   * @param options - Optional settings for the command, such as cooldown and other command-related options.
   */
  constructor(
    structure:
      | CommandBuilder
      | SlashCommandBuilder
      | ContextMenuCommandBuilder
      | SlashCommandOptionsOnlyBuilder
      | SlashCommandSubcommandsOnlyBuilder
      | Omit<SlashCommandBuilder, "addSubcommand" | "addSubcommandGroup">,
    run: (client: BotClient, interaction: ChatInputCommandInteraction, configuration: typeof config) => void,
    options?: CommandOptions
  ) {
    this.structure = structure;
    this.run = run;
    this.options = options;
  }

  checkCooldown(userId: string): boolean {
    const cooldown = (this.structure as CommandBuilder).cooldown || 0;
    if (cooldown === 0) return false;

    const now = Date.now();
    const lastUsed = cooldowns.get(userId) || 0;
    if (now - lastUsed < cooldown * 1000) {
      return true; // El usuario está en cooldown
    }

    // Actualizamos el timestamp si ya pasó el cooldown
    cooldowns.set(userId, now);
    return false;
  }

  getCooldownTime(userId: string): number {
    const cooldown = (this.structure as CommandBuilder).cooldown || 0;
    const now = Date.now();
    const lastUsed = cooldowns.get(userId) || 0;
    const timeLeft = cooldown - Math.floor((now - lastUsed) / 1000);
    return timeLeft;
  }
}

/**
 * Class representing an event in the bot system.
 * This class defines the event name, the execution logic for the event, and whether it runs only once.
 *
 * @example
 * const event = new Event('messageCreate', (message) => {
 *   console.log(`Message received: ${message.content}`);
 * });
 *
 * @template K - A key from `ClientEvents`, representing the event name.
 * @class
 */
export class Event<K extends keyof ClientEvents> {
  /**
   * The name of the event, which corresponds to a key in `ClientEvents`.
   *
   * @type {K}
   * @readonly
   */
  readonly event: K;

  /**
   * The function that runs when the event is triggered.
   * It receives arguments based on the event type.
   *
   * @type {(...args: ClientEvents[K]) => void}
   * @readonly
   */
  readonly run: (...args: ClientEvents[K]) => void;

  /**
   * Whether the event should only run once. If `true`, the event listener is removed after the first execution.
   *
   * @type {boolean | undefined}
   * @readonly
   */
  readonly once?: boolean;

  /**
   * Creates an instance of Event.
   *
   * @param event - The name of the event, which corresponds to a key in `ClientEvents`.
   * @param run - The function that executes when the event is triggered. It receives the arguments expected for that event.
   * @param once - Optional. Whether the event should run only once. Defaults to `false`.
   */
  constructor(event: K, run: (...args: ClientEvents[K]) => void, once?: boolean) {
    this.event = event;
    this.run = run;
    this.once = once;
  }
}
