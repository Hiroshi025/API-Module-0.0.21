import { Guild, MessageFlags } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Modals } from "@typings/modules/component";

const MODTicket: Modals = {
  id: "tickets:create-panel:select-options:form",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const option1 = interaction.fields.getTextInputValue("tickets:create-panel:select-options:1");
    const option2 = interaction.fields.getTextInputValue("tickets:create-panel:select-options:2");
    const option3 = interaction.fields.getTextInputValue("tickets:create-panel:select-options:3");
    const option4 = interaction.fields.getTextInputValue("tickets:create-panel:select-options:4");

    //si el contenido de las opciones es vacio o no sigue el formato, se envia un mensaje de error
    //formato: emoji, name, description
    const isValidOption = (option: string) => {
      const parts = option.split(",");
      return parts.length === 3 && parts.every((part) => part.trim().length > 0);
    };

    if (![option1, option2, option3, option4].every(isValidOption)) {
      await interaction.reply({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Options)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild as Guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).error} **Ticket Panel**`,
                `The ticket panel has not been created successfully with the options.`,
              ].join("\n")
            )
            .setFields({
              name: "__Error__",
              value: `The options are empty or do not follow the format. Please try again.`,
            }),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    //value debera tomar los valores de option_1, option_2, option_3, option_4
    const parseOption = (option: string, index: number) => {
      const [emoji, name, description] = option.split(",");
      const value = `option_${index + 1}`;

      //return { emoji: emoji.trim(), name: name.trim(), description: description.trim(), value };
      return { emoji, name, description, value };
    };

    const options = [option1, option2, option3, option4].map(parseOption);

    await manager.prisma.tickets.upsert({
      where: { guildId: interaction.guildId as string },
      update: {
        options: {
          set: options,
        },
      },
      create: {
        guildId: interaction.guildId as string,
        options: options,
        // ...other fields...
      },
    });

    await interaction.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Ticket Panel (Options)`,
            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
          })
          .setGuild(interaction.guild as Guild)
          .setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).success} **Ticket Panel**`,
              `The ticket panel has been created successfully with the options.`,
            ].join("\n")
          )
          .setFields({
            name: "__Options List__",
            value: options
              .map((option, index) => `**${index + 1}.** ${option.emoji} ${option.name}`)
              .join("\n"),
          }),
      ],
      flags: MessageFlags.Ephemeral,
    });
  },
};

export = MODTicket;
