import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Buttons } from "@typings/modules/component";

const DButton: Buttons = {
  id: "monitor:database-delete",
  maintenance: false,
  tickets: false,
  owner: true,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    //se eleminaran todas las colecciones dentro de la base de datos
    await manager.prisma.$runCommandRaw({ dropAll: true });
    return interaction.reply({
      embeds: [
        new Embed()
          .setTitle("Databse Manager - Deleted")
          .setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).correct} All collections have been deleted.`,
              `> **Collections:** ${manager.prisma.$disconnect()}`,
            ].join("\n")
          ),
      ],
    });
  },
};

export = DButton;
