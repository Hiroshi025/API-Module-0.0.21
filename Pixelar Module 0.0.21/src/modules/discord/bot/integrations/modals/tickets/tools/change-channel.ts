import { Guild, MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Modals } from "@typings/index";

const ChangeChannelName: Modals = {
  id: "tickets:tools-name:channel:change:form",
  maintenance: false,
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const format = interaction.fields.getTextInputValue("tickets:tools-name:channel:change:1");
    const embed = new Embed()
      .setAuthor({
        name: `${config.name} - Ticket Panel (Tools)`,
        iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
      })
      .setGuild(interaction.guild as Guild);

    const data = await manager.prisma.tickets.findUnique({
      where: {
        guildId: interaction.guildId as string,
      },
    });

    if (!data || data.options.length === 0) {
      await interaction.reply({
        embeds: [
          embed.setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).error} **Ticket Panel**`,
              `The ticket panel has not been created successfully with the options.`,
            ].join("\n")
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await manager.prisma.tickets.update({
      where: {
        guildId: interaction.guildId as string,
      },
      data: {
        ticketformat: format,
      },
    });

    await interaction.reply({
      embeds: [
        embed.setDescription(
          [
            `${client.getEmoji(interaction.guildId as string).success} **Ticket Panel**`,
            `The ticket panel has been updated successfully with the new format.`,
          ].join("\n")
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = ChangeChannelName;
