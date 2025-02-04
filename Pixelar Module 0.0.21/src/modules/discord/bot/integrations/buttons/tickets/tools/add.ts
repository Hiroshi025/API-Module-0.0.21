import {
	ActionRowBuilder, Guild, MessageFlags, TextChannel, UserSelectMenuBuilder,
	UserSelectMenuInteraction
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Buttons } from "@typings/modules/component";

const ADDUSERTicket: Buttons = {
  id: "tickets:tools-add:user",
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

    /*     const user = await manager.prisma.user.findUnique({ where: { userId: interaction.user.id } });
    const channelId = interaction.channelId;

    if (!user) {
      await interaction.reply({
        embeds: [
          new EmbedBuilder()
            .setAuthor({
              name: "${config.name} - Ticket Panel (Tools)",
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setColor("DarkGold")
            .setFooter({
              text: `Time Last Interaction: ${new Date().toLocaleString()}`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setTimestamp()
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).error} **User Not Found**`,
                `The user was not found in the database.`,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    } */

    //checamos si la id del canal esta en user.tickets en el apartado de channelId
    //recuerda user.tickets es un [] de datos que contiene la id del canal y el id del mensaje

    //si el canal tiene en su nombre 🎟️-ticket entonces es un ticket
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
        .setCustomId("tickets:tools-add:user:select-add")
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
              `${client.getEmoji(interaction.guildId as string).success} **Add User**`,
              `Please select a user to add to the ticket panel.`,
            ].join("\n")
          ),
      ],
      components: [menu],
      flags: MessageFlags.Ephemeral,
    });

    const filter = (i: { customId: string; user: { id: string } }) =>
      i.customId === "tickets:tools-add:user:select-add" && i.user.id === interaction.user.id;
    const collector = message.createMessageComponentCollector({ filter, time: 60000 });

    collector.on("collect", async (i: UserSelectMenuInteraction) => {
      const userId = i.values[0];
      await (interaction.channel as TextChannel).permissionOverwrites.edit(userId, {
        ViewChannel: true,
        SendMessages: true,
        ReadMessageHistory: true,
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
                `${client.getEmoji(interaction.guildId as string).success} **Add User**`,
                `The user has been added to the ticket panel ${interaction.guild?.members.cache.get(userId)?.user.tag} (\`${userId}\`).`,
              ].join("\n")
            ),
        ],
        components: [],
      });
    });
  },
};

export = ADDUSERTicket;
