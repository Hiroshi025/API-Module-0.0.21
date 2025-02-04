import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Buttons } from "@typings/modules/component";

const DBRTicket: Buttons = {
  id: "monitor:database-restart",
  maintenance: false,
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    await manager.prisma.$disconnect();
    await manager.prisma.$connect();
    return interaction.reply({
      embeds: [
        new Embed()
          .setTitle("Databse Manager - Restarted")
          .setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).correct} The database has been restarted.`,
              `> **Collections:** ${manager.prisma.$disconnect()}`,
            ].join("\n")
          ),
      ],
    });
  },
};

export = DBRTicket;
