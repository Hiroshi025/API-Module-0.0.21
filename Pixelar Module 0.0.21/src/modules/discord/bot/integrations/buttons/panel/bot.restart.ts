import { MessageFlags } from "discord.js";

import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Buttons } from "@typings/modules/component";

const COMPTicket: Buttons = {
  id: "monitor:bot-restart",
  maintenance: false,
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const embed = new Embed()
      .setTitle("Bot Restart - Manager")
      .setDescription(
        [
          `${client.getEmoji(interaction.guildId as string).time} **Restarting...**`,
          `Please wait 5 minutes while we restart the application`,
        ].join("\n")
      );

    await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
    process.exit();
  },
};

export = COMPTicket;
