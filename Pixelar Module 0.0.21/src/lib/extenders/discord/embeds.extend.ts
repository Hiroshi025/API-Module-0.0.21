import { EmbedBuilder, Guild } from "discord.js";

import { client } from "@/index";
import { config } from "@lib/utils/config";

/**
 * Class representing a custom error embed for Discord.
 * Extends the `EmbedBuilder` class from `discord.js` to handle application error messages.
 *
 * @example
 * const errorEmbed = new ErrorEmbed('guildId');
 * errorEmbed.setErrorCode('404').setStackTrace('Error stack trace');
 *
 * @extends EmbedBuilder
 */
export class ErrorEmbed extends EmbedBuilder {
  /**
   * The guild object where the error occurred.
   * @readonly
   */
  readonly guild: Guild;

  /**
   * Creates an instance of ErrorEmbed.
   *
   * @param guildId - The ID of the guild where the error occurred.
   */
  constructor(guildId: string) {
    super();
    this.guild = client.guilds.cache.get(guildId) as Guild;
    this.setTitle(`${config.name} - Error`);
    this.setAuthor({
      name: `${this.guild.name} - Application Error`,
      iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
    });
    this.setFooter({
      text: `Guild ID: \`${guildId}\` - Error`,
      iconURL: this.guild.iconURL({ forceStatic: true }) as string,
    });
    this.setColor("Red");
    this.setTimestamp();
  }

  /**
   * Adds a field to the embed with the specified name and value.
   *
   * @param name - The name of the field.
   * @param value - The value of the field.
   * @returns The updated ErrorEmbed instance.
   */
  addField(name: string, value: string): this {
    this.addFields({ name, value });
    return this;
  }

  /**
   * Adds an error code field to the embed.
   *
   * @param code - The error code to display.
   * @returns The updated ErrorEmbed instance.
   */
  setErrorCode(code: string): this {
    this.addFields({ name: "Error Code", value: code });
    return this;
  }

  /**
   * Adds the stack trace of the error to the embed.
   *
   * @param stack - The error stack trace to display. Only the first 1024 characters will be shown.
   * @returns The updated ErrorEmbed instance.
   */
  setStackTrace(stack: string): this {
    this.addFields({
      name: "Stack Trace",
      value: `\`\`\`${stack.substring(0, 1024)}\`\`\``,
    });
    return this;
  }
}

/**
 * @class Embed
 * @extends {EmbedBuilder}
 *
 * This class extends the `EmbedBuilder` from Discord.js to create customized embedded messages.
 * It provides methods to set the author and footer with dynamic information about the client and the guild.
 */
export class Embed extends EmbedBuilder {
  /**
   * Creates a new instance of the `Embed` class.
   * It sets a default color, a timestamp, the author, and a footer with client information.
   */
  constructor() {
    super();

    // Initial embed configuration
    this.setColor("Yellow");
    this.setTimestamp();

    // Set the author with the client's name and avatar
    this.setAuthor({
      name: `${config.name} - Administrator`,
      iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
    });

    // Set the footer with the time of the last interaction
    this.setFooter({
      text: `Time Last Interaction: ${new Date().toLocaleString()}`,
      iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
    });
  }

  /**
   * Sets custom author and footer information based on a given guild (server).
   *
   * @param {Guild} guild - The Discord server instance used to configure the embed.
   * @returns {Embed} Returns the current `Embed` instance for method chaining.
   */
  setGuild(guild: Guild): Embed {
    // Update the author with the guild's name and icon
    this.setAuthor({
      name: `${guild.name} - Administrator`,
      iconURL: guild.iconURL({ forceStatic: true }) as string,
    });

    // Update the footer with the guild's ID
    this.setFooter({
      text: `Guild ID: \`${guild.id}\` - Administrator`,
      iconURL: guild.iconURL({ forceStatic: true }) as string,
    });

    // Return the current instance for method chaining
    return this;
  }
}
