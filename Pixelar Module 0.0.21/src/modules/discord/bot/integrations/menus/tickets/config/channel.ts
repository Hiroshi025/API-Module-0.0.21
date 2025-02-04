import { MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Menus } from "@typings/modules/component";

const CHTicket: Menus = {
  id: "tickets:create-panel:select-channel",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.member) return;
    const channelId = interaction.values[0];
    const guildId = interaction.guild.id;

    await manager.prisma.tickets.upsert({
      where: { guildId: guildId },
      update: {
        channelId: channelId,
      },
      create: {
        guildId: guildId,
        channelId: channelId,
      },
    });

    await interaction.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Ticket Panel (Channel)`,
            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
          })
          .setGuild(interaction.guild)
          .setDescription(
            [
              `${client.getEmoji(guildId).success} **Ticket Panel**`,
              `The ticket panel has been created successfully in <#${channelId}>.`,
            ].join("\n")
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = CHTicket;
