import { ChannelType } from "discord.js";

import { manager } from "@/index";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Precommand } from "@typings/modules/component";

const modmailDevs: Precommand = {
  name: "modmail",
  description: "Enable or disable the modmail system for your discord server.",
  examples: ["modmail enabled #modmail #moderator", "modmail disabled"],
  nsfw: false,
  category: "admin",
  owner: false,
  cooldown: 15,
  aliases: ["set-modmail"],
  botpermissions: ["ManageGuild"],
  permissions: ["ManageGuild"],
  subcommands: ["modmail enabled <#channel> <@role>", "modmail disabled"],
  async execute(client, message, args, prefix) {
    if (!message.channel || !message.guild || message.channel.type !== ChannelType.GuildText) return;
    const subcoomands = args[0];
    switch (subcoomands) {
      case "enabled":
        {
          const channel = message.mentions.channels.first() || message.guild.channels.cache.get(args[1]);
          if (!channel)
            return message.channel.send({
              embeds: [
                new ErrorEmbed(message.guild.id)
                  .setTitle("Modmail - Error")
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id).error} Please provide a valid channel to set as the modmail channel.`,
                      `> **Usage:** \`${prefix}modmail enabled <#channel>\``,
                    ].join("\n")
                  ),
              ],
            });

          if (channel.type !== ChannelType.GuildText)
            return message.channel.send({
              embeds: [
                new ErrorEmbed(message.guild.id)
                  .setTitle("Modmail - Error")
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id).error} The channel provided is not a text channel.`,
                      `> **Usage:** \`${prefix}modmail enabled <#channel>\``,
                    ].join("\n")
                  ),
              ],
            });

          const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[2]);
          if (!role)
            return message.channel.send({
              embeds: [
                new ErrorEmbed(message.guild.id)
                  .setTitle("Modmail - Error")
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id).error} Please provide a valid role to set as the modmail moderator role.`,
                      `> **Usage:** \`${prefix}modmail enabled <#channel> <@role>\``,
                    ].join("\n")
                  ),
              ],
            });

          const data = await manager.prisma.modmail.findFirst({
            where: { guildId: message.guild.id },
          });
          if (data) {
            await manager.prisma.modmail.update({
              where: { id: data.id },
              data: {
                channelId: channel.id,
                moderatorId: role.id,
                enabled: true,
              },
            });

            return message.channel.send({
              embeds: [
                new Embed()
                  .setTitle("Modmail - Success")
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id).correct} Modmail has been enabled successfully.`,
                      `> **Channel:** ${channel} (\`${channel.id}\`)`,
                      `> **Role:** ${role}`,
                    ].join("\n")
                  ),
              ],
            });
          }

          await manager.prisma.modmail.create({
            data: {
              guildId: message.guild.id,
              channelId: channel.id,
              moderatorId: role.id,
              enabled: true,
            },
          });

          message.channel.send({
            embeds: [
              new Embed()
                .setTitle("Modmail - Success")
                .setDescription(
                  [
                    `${client.getEmoji(message.guild.id).correct} Modmail has been enabled successfully.`,
                    `> **Channel:** ${channel} (\`${channel.id}\`)`,
                    `> **Role:** ${role}`,
                  ].join("\n")
                ),
            ],
          });
        }
        break;
      case "disabled":
        {
          const data = await manager.prisma.modmail.findFirst({
            where: { guildId: message.guild.id },
          });
          if (!data || data.enabled === false) {
            return message.channel.send({
              embeds: [
                new ErrorEmbed(message.guild.id)
                  .setTitle("Modmail - Error")
                  .setDescription(
                    [
                      `${client.getEmoji(message.guild.id).error} Modmail is already disabled.`,
                      `> **Usage:** \`${prefix}modmail enabled <#channel> <@role>\``,
                    ].join("\n")
                  ),
              ],
            });
          }

          await manager.prisma.modmail.update({
            where: { id: data.id },
            data: {
              enabled: false,
            },
          });

          message.channel.send({
            embeds: [
              new Embed()
                .setTitle("Modmail - Success")
                .setDescription(
                  [
                    `${client.getEmoji(message.guild.id).correct} Modmail has been disabled successfully.`,
                    `> **Channel:** ${data.channelId} (\`${data.channelId}\`)`,
                    `> **Role:** ${data.moderatorId}`,
                  ].join("\n")
                ),
            ],
          });
        }
        break;
    }
  },
};
export = modmailDevs;
