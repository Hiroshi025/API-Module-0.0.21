/* eslint-disable @typescript-eslint/no-explicit-any */
import { EmbedBuilder } from "discord.js";
import { STATUS_CODES } from "http";

import { ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Precommand } from "@typings/modules/component";

const httpCommand: Precommand = {
  name: "https",
  description: "Show httpstatus with a meme image and description",
  examples: ["httpsstatus [status]", "httpsstatus [params] 200"],
  nsfw: false,
  category: "public",
  owner: false,
  cooldown: 5,
  aliases: ["httpstatuscode", "httpstatuscodes", "httpstatuscodes", "httpstatuscode"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    try {
      if (!message.guild) return;
      const status = args[0];
      if (!status)
        return message.reply({
          embeds: [
            new EmbedBuilder()
              .setColor("Red")
              .setFooter({
                text: `Requested by: ${message.author.tag}`,
                iconURL: message.author.displayAvatarURL(),
              })
              .setDescription(
                [
                  `${client.getEmoji(message.guild.id).error} You did not provide a status code to lookup for a meme!`,
                  `Usage: \`${prefix}httpstatus <status>\``,
                ].join("\n")
              ),
          ],
        });

      if (status !== "599" && !STATUS_CODES[status])
        return message.reply({
          content: [
            `${client.getEmoji(message.guild.id).error} The status code is invalid or not provided (100-599) or (599)`,
            `Usage: \`${prefix}httpstatus <status>\``,
          ].join("\n"),
        });

      return message.reply({
        content: `https://http.cat/${status}.jpg`,
      });
    } catch (e: any) {
      return message.reply({
        embeds: [
          new ErrorEmbed(message.guildId as string)
            .setFooter({
              text: `Requested by: ${message.author.tag}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setDescription(
              [
                `${client.getEmoji(message.guildId as string).error} An error occurred while executing this command!`,
                `please try again later or join our support server for help!`,
              ].join("\n")
            )
            .setStackTrace(e.stack),
        ],
      });
    }
  },
};

export = httpCommand;
