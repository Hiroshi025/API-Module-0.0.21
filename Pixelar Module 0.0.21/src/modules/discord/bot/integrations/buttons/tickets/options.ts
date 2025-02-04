import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { logWithLabel } from "@lib/utils/log";
import { Buttons } from "@typings/modules/component";

const OPTicket: Buttons = {
  id: "tickets:create-panel:select-options:open",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction) {
    try {
      const a = new TextInputBuilder()
        .setCustomId("tickets:create-panel:select-options:1")
        .setLabel("Please provide the first option")
        .setMaxLength(100)
        .setMinLength(10)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const b = new TextInputBuilder()
        .setCustomId("tickets:create-panel:select-options:2")
        .setLabel("Please provide the second option")
        .setMaxLength(100)
        .setMinLength(10)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const c = new TextInputBuilder()
        .setCustomId("tickets:create-panel:select-options:3")
        .setLabel("Please provide the third option")
        .setMaxLength(100)
        .setMinLength(10)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const d = new TextInputBuilder()
        .setCustomId("tickets:create-panel:select-options:4")
        .setLabel("Please provide the fourth option")
        .setMaxLength(100)
        .setMinLength(10)
        .setStyle(TextInputStyle.Short)
        .setRequired(false);

      const e = new ActionRowBuilder<TextInputBuilder>().addComponents(a);
      const f = new ActionRowBuilder<TextInputBuilder>().addComponents(b);
      const g = new ActionRowBuilder<TextInputBuilder>().addComponents(c);
      const h = new ActionRowBuilder<TextInputBuilder>().addComponents(d);

      const modal = new ModalBuilder()
        .setCustomId("tickets:create-panel:select-options:form")
        .setTitle("Options Ticket")
        .addComponents(e)
        .addComponents(f)
        .addComponents(g)
        .addComponents(h);

      await interaction.showModal(modal).catch(() => {});
    } catch (err) {
      logWithLabel("error", `Error executing command: ${err}`);
      console.error(err);
    }
  },
};

export = OPTicket;
