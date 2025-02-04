import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, roleMention, TextChannel
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Addons } from "@modules/discord/class/addons";

/* This code snippet is exporting a new instance of an Addons class with specific configuration
settings for a Modmail system in a Discord bot. Here's a breakdown of what the code is doing: */
export default new Addons(
  {
    name: "Modmail",
    description: "A modmail system for your discord server.",
    author: "Assistent",
    version: "0.0.2",
    bitfield: ["ManageMessages"],
  },
  async (client, config) => {
    client.on("messageCreate", async (message) => {
      if (message.channel.type !== ChannelType.DM) return;
      if (message.author.bot || !message.guild) return;

      const data = await manager.prisma.modmail.findFirst({
        where: { guildId: config.express.website.guild },
      });
      if (!data) return;

      if (data.enabled === false) return;

      const guild = client.guilds.cache.get(config.express.website.guild);
      if (!guild) return;

      const channel: TextChannel = client.channels.cache.get(data.channelId) as TextChannel;
      if (!channel || channel.type !== ChannelType.GuildText) return;

      const embed = new Embed()
        .setTitle("Modmail Manager")
        .setDescription(
          [
            `${client.getEmoji(message.guild.id).modmail.open} A new ticket has been created via modmail`,
            `> **User:** ${message.author.tag} (\`${message.author.id}\`)`,
            `> **Message:** ${message.content}`,
          ].join("\n")
        )
        .setFields({
          name: "Actions",
          value: [
            `> ${client.getEmoji(message.guild.id).modmail.open} Accept the ticket`,
            `> ${client.getEmoji(message.guild.id).modmail.close} Close the ticket`,
          ].join("\n"),
        });

      await channel
        .send({
          content: message.author.id,
          embeds: [embed],
          components: [
            new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setStyle(ButtonStyle.Danger)
                .setEmoji(client.getEmoji(message.guild.id).modmail.delete)
                .setLabel("Remove User")
                .setCustomId("modmail-removed")
            ),
          ],
        })
        .then(async (msg) => {
          if (!message.guild) return;
          await channel.permissionOverwrites.edit(message.author.id, {
            ViewChannel: true,
            SendMessages: true,
          });

          const thread = await channel.threads.create({
            name: `Modmail - ${message.author.id}`,
            autoArchiveDuration: 1440,
            type: ChannelType.PrivateThread,
            startMessage: msg,
          });

          await thread.send({
            content: [
              `${client.getEmoji(message.guild.id).modmail.open} Thank you very much for opening a ticket with us, we will attend to you shortly.`,
              `> **User:** ${message.author.tag} (\`${message.author.id}\`)`,
              `> **Moderator:** ${roleMention(data.moderatorId)}`,
            ].join("\n"),
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setStyle(ButtonStyle.Danger)
                  .setEmoji(client.getEmoji(message.guild.id).modmail.close)
                  .setLabel("Closed")
                  .setCustomId("modmail-closed")
              ),
            ],
          });

          await thread.members.add(message.author.id, `Creator of the thread`);
          const role = guild.roles.cache.get(data.moderatorId);
          if (!role) return;

          for (const member of role.members) {
            await thread.members.add(member[0], `Moderator of the thread`);
          }

          await message.reply({
            embeds: [
              new Embed()
                .setTitle("Modmail Manager - New Message")
                .setURL(thread.url)
                .setDescription(
                  [
                    `${client.getEmoji(message.guild.id).modmail.open} A new ticket has been created via modmail`,
                    `> **User:** ${message.author.tag} (\`${message.author.id}\`)`,
                    `> **Message:** ${message.content}`,
                  ].join("\n")
                ),
            ],
          });
        });
    });
  }
);
