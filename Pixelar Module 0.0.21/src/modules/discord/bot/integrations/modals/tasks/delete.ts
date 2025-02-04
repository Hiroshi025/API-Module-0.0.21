import { MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Modals } from "@typings/modules/component";

const TASKDELETETasks: Modals = {
  id: "tasks:menu-delete:modal",
  maintenance: false,
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const id = interaction.fields.getTextInputValue(`${TASKDELETETasks.id}:id`);
    const guildId = interaction.guild?.id;
    if (!guildId || !id) return;

    const task = await manager.prisma.tasks.findFirst({ where: { guildId, taskId: parseInt(id) } });
    if (!task) {
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
                `${client.getEmoji(guildId).tasks.delete} Task not found`,
                `the task with the id ${id} was not found in the database`,
                `> **Id:** \`${id}\``,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    await manager.prisma.tasks.delete({ where: { guildId, taskId: parseInt(id) } });
    await interaction.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Tasks Panel`,
            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
          })
          .setGuild(interaction.guild)
          .setDescription(
            [
              `${client.getEmoji(guildId).tasks.delete} Task deleted successfully`,
              `> **Id:** \`${id}\``,
              `> **Content:**`,
              `> ${task.content}`,
            ].join("\n")
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = TASKDELETETasks;
