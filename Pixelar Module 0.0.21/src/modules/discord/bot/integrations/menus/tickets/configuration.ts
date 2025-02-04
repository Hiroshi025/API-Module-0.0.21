import { ButtonStyle, ChannelType, RoleSelectMenuBuilder, TextInputStyle } from "discord.js";

import {
	ActionRowBuilder, ButtonBuilder, ChannelSelectMenuBuilder, ModalBuilder, TextInputBuilder
} from "@discordjs/builders";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { Menus } from "@typings/modules/component";

const configuration: Menus = {
  id: "tickets:create-panel",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.member) return;
    const guildId = interaction.guild.id;
    if (interaction.values.includes("one_option")) {
      //CANAL
      const embed = new Embed()
        .setAuthor({
          name: `${config.name} - Ticket Panel`,
          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
        })
        .setGuild(interaction.guild)
        .setDescription(
          [
            `${client.getEmoji(guildId).time} **Ticket Panel**`,
            `The ticket panel is a simple way to create a ticket channel for your server.`,
          ].join("\n")
        );

      const menu = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("tickets:create-panel:select-channel")
          .setPlaceholder("Select a channel")
          .setMaxValues(1)
          .addChannelTypes(ChannelType.GuildText)
      );

      await interaction.reply({ embeds: [embed], components: [menu], flags: "Ephemeral" });
    } else if (interaction.values.includes("two_option")) {
      //CATEGORIA
      const embed = new Embed()
        .setAuthor({
          name: `${config.name} - Ticket Panel`,
          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
        })
        .setGuild(interaction.guild)
        .setDescription(
          [
            `${client.getEmoji(guildId).time} **Ticket Panel**`,
            `The ticket panel is a simple way to create a ticket category for your server.`,
          ].join("\n")
        );

      const menu = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("tickets:create-panel:select-category")
          .setPlaceholder("Select a category")
          .setMaxValues(1)
          .addChannelTypes(ChannelType.GuildCategory)
      );

      await interaction.reply({ embeds: [embed], components: [menu], flags: "Ephemeral" });
    } else if (interaction.values.includes("three_option")) {
      //ROL
      const embed = new Embed()
        .setAuthor({
          name: `${config.name} - Ticket Panel`,
          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
        })
        .setGuild(interaction.guild)
        .setDescription(
          [
            `${client.getEmoji(guildId).time} **Ticket Panel**`,
            `The ticket panel is a simple way to create a ticket role for your server.`,
          ].join("\n")
        );

      const menu = new ActionRowBuilder<RoleSelectMenuBuilder>().addComponents(
        new RoleSelectMenuBuilder()
          .setCustomId("tickets:create-panel:select-role")
          .setPlaceholder("Select a role")
          .setMaxValues(1)
      );

      await interaction.reply({ embeds: [embed], components: [menu], flags: "Ephemeral" });
    } else if (interaction.values.includes("four_option")) {
      //TRANSCRIPT
      const embed = new Embed()
        .setAuthor({
          name: `${config.name} - Ticket Panel`,
          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
        })
        .setGuild(interaction.guild)
        .setDescription(
          [
            `${client.getEmoji(guildId).time} **Ticket Panel**`,
            `The ticket panel is a simple way to create a ticket transcript for your server.`,
          ].join("\n")
        );

      const menu = new ActionRowBuilder<ChannelSelectMenuBuilder>().addComponents(
        new ChannelSelectMenuBuilder()
          .setCustomId("tickets:create-panel:select-transcript")
          .setPlaceholder("Select a transcript")
          .setMaxValues(1)
          .addChannelTypes(ChannelType.GuildText)
      );

      await interaction.reply({ embeds: [embed], components: [menu], flags: "Ephemeral" });
    } else if (interaction.values.includes("five_option")) {
      //MESSAGE CONTENT
      try {
        const a = new TextInputBuilder()
          .setCustomId("tickets:create-panel:select-message:content")
          .setLabel("Message content for the ticket.")
          .setMaxLength(1000)
          .setMinLength(10)
          .setStyle(TextInputStyle.Short)
          .setRequired(false);

        const c = new ActionRowBuilder<TextInputBuilder>().addComponents(a);
        const modal = new ModalBuilder()
          .setCustomId("tickets:create-panel:select-message")
          .setTitle("Message Ticket")
          .addComponents(c);

        await interaction.showModal(modal).catch(() => {});
      } catch (err) {
        logWithLabel("error", `Error executing command: ${err}`);
        console.error(err);
      }
    } else if (interaction.values.includes("six_option")) {
      //OPTIONS
      const embed = new Embed()
        .setGuild(interaction.guild)
        .setAuthor({
          name: `${config.name} - Ticket Panel`,
          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
        })
        .setDescription(
          [
            `${client.getEmoji(guildId).time} **Ticket Panel**`,
            `Provides the options within the menu as specified below:`,
            `\`Note:\` remember that you can only add 4 options as maximum`,
            "",
            "__Example of use:__",
            `🤖, Support, Support about the server`,
          ].join("\n")
        );

      const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setCustomId("tickets:create-panel:select-options:open")
          .setLabel("Set")
          .setEmoji({ name: client.getEmoji(guildId).loading })
          .setStyle(ButtonStyle.Primary)
      );

      await interaction.reply({ embeds: [embed], components: [button], flags: "Ephemeral" });
    }
  },
};

export = configuration;
