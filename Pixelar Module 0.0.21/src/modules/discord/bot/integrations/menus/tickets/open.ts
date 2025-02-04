import {
	ActionRowBuilder, MessageFlags, ModalBuilder, TextInputBuilder, TextInputStyle
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { Menus } from "@typings/modules/component";

const OPTicket: Menus = {
  id: "tickets:create-send:select-menu",
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages", "ViewChannel"],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.member) return;

    const data = await manager.prisma.tickets.findUnique({
      where: { guildId: interaction.guild.id },
    });
    if (!data || data.options.length === 0) {
      await interaction.reply({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Open)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild)
            .setDescription(
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

    //obtener el nombre de la opcion seleccionada dentro del menu
    const value = interaction.values[0];
    const option = data.options.find((option) => option.value === value);
    if (!option) return;

    try {
      const a = new TextInputBuilder()
        .setCustomId("tickets:create-send:select-menu:form-reason")
        .setLabel("Reason for the Ticket")
        .setMaxLength(1000)
        .setMinLength(10)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const b = new TextInputBuilder()
        .setCustomId("tickets:create-send:select-menu:form-links")
        .setLabel("Links for the Ticket")
        .setMaxLength(1000)
        .setMinLength(10)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const c = new ActionRowBuilder<TextInputBuilder>().addComponents(a);
      const d = new ActionRowBuilder<TextInputBuilder>().addComponents(b);

      const modal = new ModalBuilder()
        .setCustomId("tickets:create-send:select-menu:form")
        .setTitle(option.name)
        .addComponents(c)
        .addComponents(d);

      await interaction.showModal(modal).catch(() => {});
    } catch (err) {
      logWithLabel("error", `Error executing command: ${err}`);
      console.error(err);
    }
  },
};

export = OPTicket;
