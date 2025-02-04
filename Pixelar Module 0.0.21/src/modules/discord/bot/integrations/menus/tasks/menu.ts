import {
	ActionRowBuilder, MessageFlags, ModalBuilder, StringSelectMenuInteraction, TextInputBuilder,
	TextInputStyle
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { EmbedPagination } from "@modules/discord/utils/pages";
import { Menus } from "@typings/modules/component";

const MENUTasks: Menus = {
  id: "tasks:menu",
  maintenance: false,
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const guildId = interaction.guild.id;

    if (interaction.values.includes("one_options")) {
      const e = new TextInputBuilder()
        .setCustomId("tasks:menu-create:modal:content")
        .setLabel("Content of the task.")
        .setMaxLength(1000)
        .setMinLength(2)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const f = new ActionRowBuilder<TextInputBuilder>().addComponents(e);

      const modal = new ModalBuilder()
        .setCustomId("tasks:menu-create:modal")
        .setTitle("Task Creation")
        .addComponents(f);
      await interaction.showModal(modal).catch((e) => {
        console.error(e);
      });
    } else if (interaction.values.includes("two_options")) {
      const e = new TextInputBuilder()
        .setCustomId("tasks:menu-delete:modal:id")
        .setLabel("Id of the task to delete.")
        .setMaxLength(1000)
        .setMinLength(2)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const f = new ActionRowBuilder<TextInputBuilder>().addComponents(e);

      const modal = new ModalBuilder()
        .setCustomId("tasks:menu-delete:modal")
        .setTitle("Task Deletion")
        .addComponents(f);
      await interaction.showModal(modal).catch((e) => {
        console.error(e);
      });
    } else if (interaction.values.includes("three_options")) {
      const tasks = await manager.prisma.tasks.findMany({ where: { guildId } });
      if (!tasks || tasks.length === 0) {
        return interaction.reply({
          embeds: [
            new Embed()
              .setAuthor({
                name: `${config.name} - Tasks Panel`,
                iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
              })
              .setGuild(interaction.guild)
              .setDescription(
                [
                  `${client.getEmoji(guildId).error} There are no tasks created within the database`,
                  "Please create one using the menu",
                ].join("\n")
              ),
          ],
          flags: MessageFlags.Ephemeral,
        });
      }

      const pagination = new EmbedPagination(interaction as StringSelectMenuInteraction);
      pagination.addPages(
        tasks.map((task) =>
          new Embed()
            .setTitle(`Task Information ${task.taskId}`)
            .setDescription(
              [
                `> **Task Id:** ${task.id} (\`${task.taskId}\`)`,
                `> **Creator:** ${task.userId} (\`${task.userId}\`)`,
                `> **Progress:** ${task.status === true ? `${client.getEmoji(interaction.guild?.id as string).correct} Completed` : `${client.getEmoji(interaction.guild?.id as string).error} In Progress`}`,
              ].join("\n")
            )
            .setFields({
              name: "__Content__",
              value: task.content
                ? task.content
                : `${client.getEmoji(interaction.guild?.id as string).error} No content provided.`,
            })
        )
      );
      pagination.hideIndexButton(true);
      pagination.keepIndexCount(true);

      await pagination.display();
    }
  },
};

export = MENUTasks;
