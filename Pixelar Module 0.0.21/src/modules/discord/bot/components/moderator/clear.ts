import { ChannelType, TextChannel } from "discord.js";

import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Precommand } from "@typings/index";

const clclear: Precommand = {
  name: "clear",
  description: "clear messages in the channel server",
  aliases: ["clear", "purge", "delete", "clean", "cleanse", "nuke", "wipe", "prune"],
  nsfw: false,
  category: "moderator",
  owner: false,
  cooldown: 30,
  cooldownType: "server",
  botpermissions: ["ManageMessages"],
  permissions: ["ManageMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.author.bot) return;
    const channel =
      message.mentions.channels.first() || message.guild.channels.cache.get(args[0]) || message.channel;
    const amount = parseInt(args[1]);

    const channelTypes = [ChannelType.GuildText, ChannelType.PublicThread, ChannelType.PrivateThread];
    if (!channelTypes.includes(channel.type))
      return message.reply({
        embeds: [
          new ErrorEmbed(message.guild.id).setDescription(
            [
              `${client.getEmoji(message.guild.id).error} I can't delete messages in this channel.`,
              `Please use this command in a text channel.`,
              `> **Usage:** \`${prefix}clear <channel> <amount>\``,
            ].join("\n")
          ),
        ],
      });

    if (isNaN(amount))
      return message.reply({
        embeds: [
          new ErrorEmbed(message.guild.id).setDescription(
            [
              `${client.getEmoji(message.guild.id).error} Please provide a valid number of messages to delete.`,
              `> **Usage:** \`${prefix}clear <channel> <amount>\``,
            ].join("\n")
          ),
        ],
      });

    if (amount < 1 || amount > 100) {
      return message.reply({
        embeds: [
          new ErrorEmbed(message.guild.id).setDescription(
            [
              `${client.getEmoji(message.guild.id).error} Please provide a number between 1 and 100.`,
              `> **Usage:** \`${prefix}clear <channel> <amount>\``,
            ].join("\n")
          ),
        ],
      });
    }

    const messages = await (channel as TextChannel).messages.fetch({ limit: amount });
    await (channel as TextChannel)
      .bulkDelete(messages, true)
      .then((deleted) => {
        message.reply({
          embeds: [
            new Embed().setDescription(
              [
                `${client.getEmoji(message.guild?.id as string).correct} Successfully deleted \`${deleted.size}\` messages.`,
                `> **Channel:** ${channel} (\`${channel.id}\`)`,
                `> **Amount:** ${deleted.size}`,
              ].join("\n")
            ),
          ],
        });
      })
      .catch((error) => {
        message.reply({
          embeds: [
            new ErrorEmbed(message.guild?.id as string)
              .setDescription(
                [
                  `${client.getEmoji(message.guild?.id as string).error} An error occurred while trying to delete messages.`,
                  `Please try again later or contact the bot owner.`,
                ].join("\n")
              )
              .setStackTrace(error.stack as string),
          ],
        });
      });
  },
};

export = clclear;
