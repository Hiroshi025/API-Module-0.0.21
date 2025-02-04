import { MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Menus } from "@typings/modules/component";

const ROLTicket: Menus = {
  id: "tickets:create-panel:select-role",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.member) return;
    const roleId = interaction.values[0];
    const guildId = interaction.guild.id;

    await manager.prisma.tickets.upsert({
      where: { guildId: guildId },
      update: {
        roleId: roleId,
      },
      create: {
        guildId: guildId,
        roleId: roleId,
      },
    });

    await interaction.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Ticket Panel (Role)`,
            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
          })
          .setGuild(interaction.guild)
          .setDescription(
            [
              `${client.getEmoji(guildId).success} **Ticket Panel**`,
              `The ticket panel has been created successfully in <#${roleId}>.`,
            ].join("\n")
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = ROLTicket;
