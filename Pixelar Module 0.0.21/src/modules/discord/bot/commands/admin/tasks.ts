import {
	ActionRowBuilder, Guild, MessageFlags, PermissionFlagsBits, StringSelectMenuBuilder
} from "discord.js";

import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("tasks")
    .setNameLocalizations({
      "es-ES": "tareas",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .setDescription("📝 panel tasks manager, create, delete and info")
    .setDescriptionLocalizations({
      "es-ES": "📝 panel de administración de tareas, crear, eliminar e información",
    }),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const guildId = interaction.guild.id;
    const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("tasks:menu")
        .setPlaceholder("Select a toosl for tasks")
        .addOptions([
          {
            label: "Create",
            value: "one_options",
            description: "Create a new task",
            emoji: client.getEmoji(guildId).tasks.create,
          },
          {
            label: "Delete",
            value: "two_options",
            description: "Delete a task",
            emoji: client.getEmoji(guildId).tasks.delete,
          },
          {
            label: "Info",
            value: "three_options",
            description: "Get info about a task",
            emoji: client.getEmoji(guildId).tasks.info,
          },
        ])
    );

    const embed = new Embed()
      .setAuthor({
        name: `${config.name} - Tasks Panel`,
        iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
      })
      .setGuild(interaction.guild as Guild)
      .setDescription(
        [
          `${client.getEmoji(guildId).tasks.welcome} Welcome to the tasks panel, here you can manage all the tasks in the server`,
          "Please select an option from the menu below",
        ].join("\n")
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], components: [menu], flags: MessageFlags.Ephemeral });
  }
);
