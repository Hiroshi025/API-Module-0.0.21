import { Guild, MessageFlags, TextChannel } from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Buttons } from "@typings/modules/component";

const RENAMETicket: Buttons = {
  id: "tickets:tools-rename",
  maintenance: false,
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const data = await manager.prisma.tickets.findUnique({
      where: {
        guildId: interaction.guildId as string,
      },
    });

    if (!data || data.options.length === 0) {
      await interaction.reply({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Tools)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild as Guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).error} **Ticket Panel**`,
                `The ticket panel has not been created successfully with the options.`,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const tickets = await manager.prisma.tickets.findMany({
      where: { guildId: interaction.guildId as string },
    });
    const check = tickets.find((t) => t.channelId === interaction.channelId);
    if (!check) {
      await interaction.reply({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Tools)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild as Guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).error} **Channel not Exists**`,
                `The channel does not exist in the user's tickets.`,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [
        new Embed()
          .setGuild(interaction.guild as Guild)
          .setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).success} **Channel Rename**`,
              "",
              `You can rename the channel by sending the new name in the chat.`,
              `The channel name must contain the prefix 🎟️-ticket and a maximum of 30 characters.`,
            ].join("\n")
          ),
      ],
      flags: MessageFlags.Ephemeral,
    });

    //el usuario mandara en un mensaje el nuevo nombre del canal
    const filter = (m: { author: { id: string } }) => m.author.id === interaction.user.id;
    const collector = (interaction.channel as TextChannel).createMessageCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (m) => {
      const name = m.content;
      //el nuevo nombre debe de tener el prefijo 🎟️-ticket y un limite de caracteres
      if (name.length > 30) {
        await interaction.reply({
          embeds: [
            new Embed()
              .setAuthor({
                name: `${config.name} - Ticket Panel (Tools)`,
                iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
              })
              .setGuild(interaction.guild as Guild)
              .setDescription(
                [
                  `${client.getEmoji(interaction.guildId as string).error} **Limit Exceeded**`,
                  `The limit of characters in the name exceeds the limit of 100 characters.`,
                ].join("\n")
              ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      if (!name.includes("🎟️-ticket")) {
        await interaction.reply({
          embeds: [
            new Embed()
              .setAuthor({
                name: `${config.name} - Ticket Panel (Tools)`,
                iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
              })
              .setGuild(interaction.guild as Guild)
              .setDescription(
                [
                  `${client.getEmoji(interaction.guildId as string).error} **Invalid Name**`,
                  `The name must contain the prefix 🎟️-ticket.`,
                ].join("\n")
              ),
          ],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      //se renombra el canal con el nuevo nombre
      await interaction.guild?.channels.cache
        .get(interaction.channelId)
        ?.setName(name)
        .then(async () => {
          await interaction.reply({
            embeds: [
              new Embed()
                .setAuthor({
                  name: `${config.name} - Ticket Panel (Tools)`,
                  iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                })
                .setGuild(interaction.guild as Guild)
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string).success} **Channel Renamed**`,
                    `The channel has been renamed to ${name}.`,
                  ].join("\n")
                ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        });
    });

    collector.on("end", async () => {
      await interaction.followUp({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Tools)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild as Guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).error} **Time Out**`,
                `The time to rename the channel has expired.`,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    });
  },
};

export = RENAMETicket;
