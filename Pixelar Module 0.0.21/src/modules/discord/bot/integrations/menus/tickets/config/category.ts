import { MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Menus } from "@typings/modules/component";

const CATicket: Menus = {
  id: "tickets:create-panel:select-category",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.member) return;
    const categoryId = interaction.values[0];
    const guildId = interaction.guild.id;

    await manager.prisma.tickets.upsert({
      where: { guildId: guildId },
      update: {
        categoryId: categoryId,
      },
      create: {
        guildId: guildId,
        categoryId: categoryId,
      },
    });

    await interaction.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Ticket Panel (Category)`,
            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
          })
          .setGuild(interaction.guild)
          .setDescription(
            [
              `${client.getEmoji(guildId).success} **Ticket Panel**`,
              `The ticket panel has been created successfully in <#${categoryId}>.`,
            ].join("\n")
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = CATicket;
