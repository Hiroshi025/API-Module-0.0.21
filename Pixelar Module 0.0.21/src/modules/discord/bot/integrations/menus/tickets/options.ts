import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { Menus } from "@typings/modules/component";

const OPOTicket: Menus = {
  id: "tickets:create-send:select-menu:menu-send",
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction) {
    if (!interaction.guild || !interaction.member) return;
    if (interaction.values.includes("first_option")) {
      const e = new TextInputBuilder()
        .setCustomId("tickets:create-send:select-menu:menu-send-delete:content")
        .setLabel("Reason for deleting this ticket.")
        .setMaxLength(1000)
        .setMinLength(2)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const f = new ActionRowBuilder<TextInputBuilder>().addComponents(e);

      const modal = new ModalBuilder()
        .setCustomId("tickets:create-send:select-menu:menu-send-delete")
        .setTitle("Ticket Closure Reason")
        .addComponents(f);
      await interaction.showModal(modal).catch((e) => {
        console.error(e);
      });
    } else if (interaction.values.includes("second_option")) {
      //TODO: De momento en espera esta opcion por modificaciones generales
    } else if (interaction.values.includes("third_option")) {
      const e = new TextInputBuilder()
        .setCustomId("tickets:create-send:select-menu:menu-send-close:content")
        .setLabel("Reason for closing this ticket.")
        .setMaxLength(1000)
        .setMinLength(10)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const f = new ActionRowBuilder<TextInputBuilder>().addComponents(e);

      const modal = new ModalBuilder()
        .setCustomId("tickets:create-send:select-menu:menu-send-close")
        .setTitle("Ticket Closure Reason")
        .addComponents(f);

      await interaction.showModal(modal).catch(() => {});
    }
  },
};

export = OPOTicket;
