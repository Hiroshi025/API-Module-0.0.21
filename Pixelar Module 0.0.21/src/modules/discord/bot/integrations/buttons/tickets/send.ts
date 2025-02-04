import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, Guild, MessageFlags, StringSelectMenuBuilder,
	TextChannel
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { logWithLabel } from "@lib/utils/log";
import { Buttons } from "@typings/modules/component";

const SNDTicket: Buttons = {
  id: "tickets:create-send",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client) {
    const ticket = client.config.bot.tickets;
    if (!interaction.guildId) return;
    try {
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
                name: `${client.config.name} - Ticket Panel (Send)`,
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

      //TODO: Falta crear el creado del ticket, herramientas y comandos de administrador y usuario
      const options = data.options.map((option, index) => {
        //first_option, second_option, third_option, fourth_option
        return {
          label: option.name,
          value: `option_${index + 1}`, //option_1, option_2, option_3, option_4
          description: option.description,
          emoji: option.emoji,
        };
      });

      const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
        new StringSelectMenuBuilder()
          .setCustomId("tickets:create-send:select-menu")
          .setPlaceholder("Select a ticket option")
          .addOptions(options)
      );

      const embed = new Embed()
        .setAuthor({
          name: `${client.config.name} - Ticket Panel`,
          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
        })
        .setGuild(interaction.guild as Guild)
        .setDescription(
          data.message ? data.message : "> Please select a ticket option from the dropdown menu."
        );

      const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setURL(ticket.options.button.url ? ticket.options.button.url : (process.env.DOCS as string))
          .setLabel(ticket.options.button.label ? ticket.options.button.label : "Documentation")
      );

      const channel = await client.channels.fetch(data.channelId as string);
      await (channel as TextChannel).send({
        embeds: [embed],
        components: [menu, button],
      });

      await interaction.reply({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${client.config.name} - Ticket Panel (Send)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild as Guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).success} **Ticket Panel**`,
                `The ticket panel has been sent successfully to the channel.`,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    } catch (err) {
      logWithLabel("error", `Error executing command: ${err}`);
      console.error(err);
    }
  },
};

export = SNDTicket;
