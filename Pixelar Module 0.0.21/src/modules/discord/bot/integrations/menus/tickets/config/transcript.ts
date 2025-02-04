import { MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Menus } from "@typings/modules/component";

const TRATicket: Menus = {
  id: "tickets:create-panel:select-transcript",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.member) return;
    const transcriptId = interaction.values[0];
    const guildId = interaction.guild.id;

    await manager.prisma.tickets.upsert({
      where: { guildId: guildId },
      update: {
        transcriptId: transcriptId,
      },
      create: {
        guildId: guildId,
        transcriptId: transcriptId,
      },
    });

    await interaction.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Ticket Panel (Transcript)`,
            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
          })
          .setGuild(interaction.guild)
          .setDescription(
            [
              `${client.getEmoji(guildId).success} **Ticket Panel**`,
              `The ticket panel has been created successfully in <#${transcriptId}>.`,
            ].join("\n")
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = TRATicket;
