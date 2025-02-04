import {
	ActionRowBuilder, Guild, MessageFlags, TextChannel, UserSelectMenuBuilder,
	UserSelectMenuInteraction
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Buttons } from "@typings/modules/component";

const REMOVEUSERTicket: Buttons = {
  id: "tickets:tools-remove:user",
  maintenance: false,
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    //primero checaremos que el canal donde se ejecuto el comando sea un canal de tickets
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

    const menu = new ActionRowBuilder<UserSelectMenuBuilder>().addComponents(
      new UserSelectMenuBuilder()
        .setCustomId("tickets:tools-add:user:select-remove")
        .setPlaceholder("Select a user")
    );

    const message = await interaction.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Ticket Panel (Tools)`,
            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
          })
          .setGuild(interaction.guild as Guild)
          .setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).success} **Remove User**`,
              `Please select a user to remove from the ticket panel.`,
            ].join("\n")
          ),
      ],
      components: [menu],
      flags: MessageFlags.Ephemeral,
    });

    const filter = (i: { customId: string; user: { id: string } }) =>
      i.customId === "tickets:tools-add:user:select-remove" && i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i: UserSelectMenuInteraction) => {
      //aqui se ejecutara el codigo para remover al usuario del ticket
      const userId = i.values[0];
      const member = interaction.guild?.members.cache.get(userId);

      //si el usuario elejido tiene el rol de staff no se le removera del ticket
      if (member?.roles.cache.has(data.roleId as string)) {
        await i.reply({
          embeds: [
            new Embed()
              .setAuthor({
                name: `${config.name} - Ticket Panel (Tools)`,
                iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
              })
              .setGuild(interaction.guild as Guild)
              .setDescription(
                [
                  `${client.getEmoji(interaction.guildId as string).error} **Remove User**`,
                  `The user has the staff role and cannot be removed from the ticket panel.`,
                ].join("\n")
              ),
          ],
          components: [],
          flags: MessageFlags.Ephemeral,
        });
        return;
      }

      await (interaction.channel as TextChannel).permissionOverwrites.edit(userId, {
        ViewChannel: false,
        SendMessages: false,
        ReadMessageHistory: false,
      });

      await i.update({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Tools)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild as Guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).success} **Remove User**`,
                `The user has been removed from the ticket panel.`,
              ].join("\n")
            ),
        ],
        components: [],
      });
    });
  },
};

export = REMOVEUSERTicket;
