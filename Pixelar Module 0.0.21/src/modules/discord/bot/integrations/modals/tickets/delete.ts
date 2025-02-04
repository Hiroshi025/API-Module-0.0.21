import { stripIndents } from "common-tags";
import { createTranscript } from "discord-html-transcripts";
import {
	ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonStyle, MessageFlags, TextChannel,
	userMention
} from "discord.js";
import fs from "fs";
import path from "path";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Modals } from "@typings/modules/component";

const modalTicketDelete: Modals = {
  id: "tickets:create-send:select-menu:menu-send-delete",
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const razon = interaction.fields.getTextInputValue(
      `${modalTicketDelete.id}:content`
    );
    if (!interaction.guild || !interaction.channel) return;
    const channel = interaction.channel;

    const tickets = await manager.prisma.tickets.findUnique({
      where: { guildId: interaction.guild?.id },
    });
    if (!tickets || tickets.channelId === null || tickets.transcriptId === null)
      return interaction.reply({
        embeds: [
          client.embed({
            description: [
              `${client.getEmoji(interaction.guild.id).error} **Deleted Ticket**`,
              `An error occurred while deleting the ticket for ${interaction.user.tag}.`,
              `The ticket system has not been configured correctly.`,
            ].join("\n"),
            color: "Red",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });

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

    const transcript = await createTranscript(interaction.channel!, {
      limit: -1,
      filename: `transcript-${interaction.channel?.id}.html`,
      poweredBy: true,
    });

    //********************** SAVE LOCAL FILE *******************************//

    const dir = path.join(__dirname, "../../../../../", "config", "transcripts");
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    if (transcript instanceof AttachmentBuilder) {
      const buffer = transcript.attachment as Buffer;
      const filePath = path.join(dir, `transcript-${interaction.channel?.id}.html`);
      fs.writeFileSync(filePath, buffer);
    }

    //********************** SAVE LOCAL FILE *******************************//

    const embed = new Embed()
      .setAuthor({
        name: "Ticket Closed - Manager",
        iconURL: client.user?.displayAvatarURL() as string,
      })
      .setThumbnail(interaction.guild?.iconURL({ forceStatic: true }) as string)
      .setFields({
        name: "Ticket - Information",
        value: stripIndents`
					> **Moderator:** ${client.user} (\`${client.user?.id}\`)
					> **Creator Ticket:** ${userMention(ticket.userId)} (\`${ticket.userId}\`)
          > **Channel Ticket:** ${channel.toString()} (\`${channel.id}\`)
				`,
        inline: false,
      });

    const transcripts = interaction.guild?.channels.cache.get(tickets.transcriptId!);
    if (!transcripts)
      return interaction.reply({
        embeds: [
          client.embed({
            description: [
              `${client.getEmoji(interaction.guild.id).error} **Deleted Ticket**`,
              `An error occurred while deleting the ticket for ${interaction.user.tag}.`,
            ].join("\n"),
            color: "Red",
          }),
        ],
        flags: MessageFlags.Ephemeral,
      });

    let URL;
    if (process.env.HOST === "localhost") {
      URL = `http://${process.env.HOST}:${process.env.PORT}/utils/dashboard/tickets/transcript-${interaction.channel?.id}.html`;
    } else {
      URL = `https://${process.env.HOST}/utils/dashboard/tickets/transcript-${interaction.channel?.id}.html`;
    }

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setURL(URL).setLabel("View Transcript")
    );

    (transcripts as TextChannel)
      .send({
        content: razon ? `**Reason:** ${razon}` : "",
        embeds: [embed],
        components: [button],
      })
      .then(async () => {
        const user = interaction.guild?.members.cache.get(ticket.userId);
        if (!user) return;

        user
          .send({
            content: razon ? `**Reason:** ${razon}` : "",
            embeds: [embed],
            components: [button],
          })
          .catch(() => {});
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

        if (!interaction.guild) return;
        await interaction.reply({
          embeds: [
            client.embed({
              description: [
                `${client.getEmoji(interaction.guild.id).correct} **Deleted Ticket**`,
                `The ticket for ${interaction.user.tag} has been successfully deleted.`,
              ].join("\n"),
              color: "Green",
            }),
          ],
          flags: MessageFlags.Ephemeral,
        });
      });

    setInterval(() => {
      interaction.channel?.delete().catch(() => {});
    }, 5000);
  },
};
export = modalTicketDelete;
