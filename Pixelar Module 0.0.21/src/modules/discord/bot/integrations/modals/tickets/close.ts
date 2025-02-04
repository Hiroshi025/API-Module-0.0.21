import { MessageFlags, TextChannel } from "discord.js";

import { manager } from "@/index";
import { Modals } from "@typings/modules/component";

const modalTicketClose: Modals = {
  id: "tickets:create-send:select-menu:menu-send-close",
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const channel = interaction.channel;
    const razon = interaction.fields.getTextInputValue(
      `${modalTicketClose.id}:content`
    );

    //ususarios = manager.prisma.user
    //buscar el ticket en toodos los usuarios que tengan tickets

    //si no existe el ticket
    //devolver un error

    const data = await manager.prisma.user.findMany({
      where: { tickets: { some: { channelId: channel.id } } },
    });

    const ticket = data.find((t) => t.tickets.find((t) => t.channelId === channel.id));
    if (!ticket)
      return interaction.reply({
        embeds: [
          client.embed({
            description: [
              `${client.getEmoji(interaction.guild.id).error} **Closed Ticket**`,
              `An error occurred while closing the ticket for ${interaction.user.tag}.`,
              `the ticket does not exist in the database.`,
            ].join("\n"),
            color: "Red",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });

    const userTicket = ticket.tickets.find((t) => t.channelId === channel.id);
    if (userTicket?.closed) {
      return interaction.reply({
        embeds: [
          client.embed({
            description: [
              `${client.getEmoji(interaction.guild.id).error} **Closed Ticket**`,
              `The ticket for ${interaction.user.tag} is already closed.`,
              `the ticket closed status is already set to true.`,
            ].join("\n"),
            color: "Red",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    await manager.prisma.user.updateMany({
      where: { tickets: { some: { channelId: channel.id } } },
      data: {
        tickets: {
          updateMany: {
            where: { channelId: channel.id },
            data: { closed: true },
          },
        },
      },
    });

    const creatorId = ticket.id;
    (interaction.channel as TextChannel).permissionOverwrites.edit(creatorId, {
      ViewChannel: false,
    });

    await interaction.reply({
      embeds: [
        client.embed({
          description: [
            `${client.getEmoji(interaction.guild.id).correct} **Close Ticket**`,
            `The ticket for ${interaction.user.tag} has been successfully closed.`,
            `The ticket will be archived in the ticket system.\n`,
            `> **Ticket ID**: ${ticket.id}`,
            `> **Ticket Reason**: ${razon}`,
          ].join("\n"),
          color: "Green",
        }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = modalTicketClose;
