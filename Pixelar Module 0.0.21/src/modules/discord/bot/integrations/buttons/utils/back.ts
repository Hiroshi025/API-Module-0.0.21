import { ActionRowBuilder, ButtonBuilder, ButtonStyle } from "discord.js";

import { Buttons } from "@typings/modules/component";

const goBack: Buttons = {
  id: "manager_systems_back",
  tickets: false,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.guild) return;
    await interaction.update({
      embeds: [
        client.embed({
          description: [
            `${client.getEmoji(interaction.guild.id).correct} Hello, thank you very much for using my functions that I can provide`,
            `I am here to help you, if you need help, just type \`/help\` or \`/commands\``,
          ].join("\n"),
          color: "Red",
        }),
      ],
      components: [
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Dashboard")
            .setURL(process.env.CALLBACK_URL as string)
        ),
      ],
    });
  },
};
export = goBack;
