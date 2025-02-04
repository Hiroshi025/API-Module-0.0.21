import { ActionRowBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } from "discord.js";

import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { ClientError } from "@lib/extenders/error.extend";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("product")
    .setNameLocalizations({
      "es-ES": "producto",
    })
    .setDescription("👀 Get, Post, Put and Delete the product information")
    .setDescriptionLocalizations({
      "es-ES": "👀 Obtener, Publicar, Actualizar y Eliminar la información del producto",
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setNameLocalizations({
          "es-ES": "crear",
        })
        .setDescription("👀 Create a new product")
        .setDescriptionLocalizations({
          "es-ES": "👀 Crear un nuevo producto",
        })
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "create":
        {
          const a = new TextInputBuilder()
            .setCustomId("product:create-name")
            .setLabel("Name")
            .setMaxLength(1000)
            .setMinLength(10)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const d = new TextInputBuilder()
            .setCustomId("product:create-description")
            .setLabel("Description")
            .setMaxLength(1000)
            .setMinLength(10)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const b = new TextInputBuilder()
            .setCustomId("product:create-image")
            .setLabel("URL Image")
            .setMaxLength(1000)
            .setMinLength(10)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const c = new TextInputBuilder()
            .setCustomId("product:create-download")
            .setLabel("URL Download")
            .setMaxLength(1000)
            .setMinLength(10)
            .setStyle(TextInputStyle.Short)
            .setRequired(true);

          const f = new ActionRowBuilder<TextInputBuilder>().addComponents(a);
          const g = new ActionRowBuilder<TextInputBuilder>().addComponents(d);
          const h = new ActionRowBuilder<TextInputBuilder>().addComponents(b);
          const i = new ActionRowBuilder<TextInputBuilder>().addComponents(c);

          const modal = new ModalBuilder()
            .setCustomId("product:create")
            .setTitle("Create Product")
            .addComponents(f)
            .addComponents(g)
            .addComponents(h)
            .addComponents(i);

          await interaction.showModal(modal).catch(async () => {
            throw new ClientError("An error occurred while trying to show the modal");
          });
        }
        break;
    }
  },
  {
    owner: true,
  }
);
