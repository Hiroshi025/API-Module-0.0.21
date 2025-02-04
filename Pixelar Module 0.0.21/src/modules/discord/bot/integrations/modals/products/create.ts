import { MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Modals } from "@typings/modules/component";

const PRODCreate: Modals = {
  id: "product:create",
  maintenance: false,
  tickets: false,
  owner: false,
  permissions: ["ManageGuild"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const name = interaction.fields.getTextInputValue(`${PRODCreate.id}-name`);
    const description = interaction.fields.getTextInputValue(`${PRODCreate.id}-description`);
    const image = interaction.fields.getTextInputValue(`${PRODCreate.id}-image`);
    const download = interaction.fields.getTextInputValue(`${PRODCreate.id}-download`);

    //validamos que image si sea un url de imagen
    const regex = /^(https?:\/\/[^\s$.?#].[^\s]*)$/i;
    if (!regex.test(image)) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed(interaction.guildId as string).setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).error} The image URL is not valid.`,
              `Please enter a valid image URL and try again.`,
            ].join("\n")
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    // verificamos que donwload sea un url valido solamente se admite cualquier url
    if (!regex.test(download)) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed(interaction.guildId as string).setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).error} The download URL is not valid.`,
              `Please enter a valid download URL and try again.`,
            ].join("\n")
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    const data = await manager.prisma.freeProduct.findMany();

    await manager.prisma.freeProduct.create({
      data: {
        productname: name,
        description: description,
        image: image,
        url: download,
        productId: `${data.length + 1}`,
        userId: interaction.user.id,
      },
    });

    await interaction.reply({
      embeds: [
        new Embed().setDescription(
          [
            `${client.getEmoji(interaction.guildId as string).success} The product has been created successfully.`,
            `**Name:** ${name}`,
            `**Image:** [Click here](${image})`,
            `**Download:** [Click here](${download})`,
          ].join("\n")
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = PRODCreate;
