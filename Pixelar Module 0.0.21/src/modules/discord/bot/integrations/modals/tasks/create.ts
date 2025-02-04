import { MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Modals } from "@typings/modules/component";

const TASKCREATETickets: Modals = {
  id: "tasks:menu-create:modal",
  maintenance: false,
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const content = interaction.fields.getTextInputValue(`${TASKCREATETickets.id}:content`);
    const guildId = interaction.guild?.id;
    if (!guildId || !content) return;

    const data = await manager.prisma.tasks.findMany({ where: { guildId } });
    await manager.prisma.tasks.create({
      data: {
        userId: interaction.user.id,
        guildId: guildId,
        taskId: data.length + 1,
        content: content,
      },
    });

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
              `${client.getEmoji(guildId).tasks.create} Task created successfully`,
              `> **Content:**`,
              `> ${content}`,
            ].join("\n")
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = TASKCREATETickets;
