import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild, MessageFlags, ModalBuilder,
	TextInputBuilder, TextInputStyle
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Buttons } from "@typings/index";

const channelNameTicket: Buttons = {
  id: "tickets:tools-name:channel",
  maintenance: false,
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
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

    const tickets = await manager.prisma.tickets.findMany({
      where: { guildId: interaction.guildId as string },
    });
    const check = tickets.find((t) => t.channelId === interaction.channelId);
    if (!check) {
      await interaction.reply({
        embeds: [
          embed.setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).error} **Channel not Exists**`,
              `The channel does not exist in the user's tickets.`,
            ].join("\n")
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    embed.setDescription(
      [
        `${client.getEmoji(interaction.guildId as string).success} **Channel Name**`,
        `Hello, these are the acceptable formats for the name when creating the ticket`,
        `**Current Format:** ${data.ticketformat ? data.ticketformat : "🎟️-ticket-{ticket}"}\n`,
        `> \`{user}\`: The user's name`,
        `> \`{ticket}\`: The ticket number`,
        `> \`{userId}\`: The user's ID`,
        `> \`{ticketcount}\`: The number of tickets`,
      ].join("\n")
    );

    const message = await interaction.reply({
      embeds: [embed],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setLabel("Change Channel Name")
            .setStyle(ButtonStyle.Primary)
            .setCustomId("tickets:tools-name:channel:change")
        ),
      ],
      flags: "Ephemeral",
    });

    const filter = (i: { customId: string; user: { id: string } }) =>
      i.customId === "tickets:tools-name:channel:change" && i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i) => {
      const a = new TextInputBuilder()
        .setCustomId("tickets:tools-name:channel:change:1")
        .setLabel("Please provide the new channel name")
        .setMaxLength(100)
        .setMinLength(10)
        .setStyle(TextInputStyle.Short)
        .setRequired(true);

      const b = new ActionRowBuilder<TextInputBuilder>().addComponents(a);
      const c = new ModalBuilder()
        .setCustomId("tickets:tools-name:channel:change:form")
        .setTitle("Change Channel Name")
        .addComponents(b);

      await i.showModal(c).catch(() => {});
    });
  },
};

export = channelNameTicket;
