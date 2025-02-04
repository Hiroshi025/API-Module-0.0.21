import { ChannelType } from "discord.js";

import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Precommand } from "@typings/index";

const leaveCommand: Precommand = {
  name: "leave",
  description: "Leave guild bot the manager",
  nsfw: false,
  owner: true,
  category: "dev",
  cooldown: 5,
  aliases: ["leave-guild"],
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const serverId = args[0];
    if (!serverId)
      return message.channel.send({
        embeds: [
          new ErrorEmbed(message.guild.id)
            .setTitle("Error Command Handler")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id).error} The command is missing arguments to execute!`,
                `> **Usage:** \`${prefix}leave <serverId>\``,
              ].join("\n")
            ),
        ],
      });

    const server = client.guilds.cache.get(serverId);
    server?.leave();
    message.channel.send({
      embeds: [
        new Embed()
          .setTitle("Leave Guild")
          .setDescription(
            [
              `${
                client.getEmoji(message.guild.id).correct
              } The bot has left the guild with the ID: \`${serverId}\``,
              `> **Note:** If you want to invite the bot again`,
            ].join("\n")
          )
          .setFields({
            name: "__Information Guild__",
            value: [
              `> **Name:** ${server?.name}`,
              `> **ID:** ${serverId}`,
              `> **Owner:** ${server?.ownerId}`,
              `> **Members:** ${server?.memberCount}`,
              `> **Channels:** ${server?.channels.cache.size}`,
            ].join("\n"),
          }),
      ],
    });
  },
};
export = leaveCommand;
