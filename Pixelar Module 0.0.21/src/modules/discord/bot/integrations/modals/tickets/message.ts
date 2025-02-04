import { Guild, MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Modals } from "@typings/modules/component";

const MSGTicket: Modals = {
  id: "tickets:create-panel:select-message",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const message = interaction.fields.getTextInputValue(`${MSGTicket.id}:content`);
    if (!interaction.guild || !interaction.channel || !interaction.user) return;

    await manager.prisma.tickets.upsert({
      where: { guildId: interaction.guild.id },
      update: {
        message: message,
      },
      create: {
        guildId: interaction.guild.id,
        message: message,
      },
    });

    await interaction.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Ticket Panel (Message)`,
            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
          })
          .setGuild(interaction.guild as Guild)
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id).success} **Ticket Panel**`,
              `The ticket panel has been created successfully with the message.`,
            ].join("\n")
          )
          .setFields({
            name: "__Message Content__",
            value: message.length > 1024 ? `${message.slice(0, 1021)}...` : message,
          }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = MSGTicket;
