import { manager } from "@/index";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Buttons } from "@typings/index";
import { config } from "@utils/config";

const iamoderationbutton: Buttons = {
  id: "tickets:create-send:select-menu:button:chatgpt",
  maintenance: false,
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    if (!interaction.channel || !interaction.guild || !interaction.member) return;
    const { channel, guild, member } = interaction;

    const db = await manager.prisma.user.findFirst({
      where: {
        userId: member.user.id,
        guildId: guild.id,
        tickets: {
          some: {
            channelId: channel.id,
          },
        },
      },
    });

    if (!db)
      return interaction.reply({
        embeds: [
          new ErrorEmbed(guild.id).setDescription(
            [
              `${client.getEmoji(guild.id).error} The user ticket system is not enabled.`,
              `To enable it, use the command \`${client.config.bot.prefix}ticket\`.`,
            ].join("\n")
          ),
        ],
        flags: "Ephemeral",
      });

    await manager.prisma.user.update({
      where: {
        id: db?.id,
      },
      data: {
        tickets: {
          updateMany: {
            where: {
              channelId: channel.id,
            },
            data: {
              iamoderation: true,
            },
          },
        },
      },
    });

    await interaction.reply({
      embeds: [
        new Embed().setDescription(
          [
            `${client.getEmoji(guild.id).correct} The ticket system \`iamoderation\` has been enabled.`,
            `Please send messages within the ticket and they will be answered by the AI`,
            `> **Limit Messages:** ${config.bot.tickets.options["max-iamoderation-ticket"]}`,
          ].join("\n")
        ),
      ],
      flags: "Ephemeral",
    });
  },
};

export = iamoderationbutton;
