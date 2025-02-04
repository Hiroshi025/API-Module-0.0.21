import { manager } from "@/index";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Buttons } from "@typings/index";

const setRoomsDisabled: Buttons = {
  id: 'rooms:button-disabled',
  tickets: false,
  owner: false,
  permissions: ['ManageChannels'],
  botpermissions: ['SendMessages'],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const data = await manager.prisma.guild.findUnique({
      where: { id: interaction.guild.id },
    });
    if (!data)
      return interaction.reply({
        embeds: [
          new ErrorEmbed(interaction.guild.id)
            .setTitle('Error Rooms - Systems')
            .setDescription(
              [
                `${
                  client.getEmoji(interaction.guild.id).error
                } An error occurred while trying to disable the rooms system.`,
                `Please try again later or contact the support team.`,
              ].join('\n')
            ),
        ],
        ephemeral: true,
      });

    if (data.rooms === null)
      return interaction.reply({
        embeds: [
          new ErrorEmbed(interaction.guild.id)
            .setTitle('Error Rooms - Systems')
            .setDescription(
              [
                `${client.getEmoji(interaction.guild.id).error} The rooms system is already disabled.`,
                `**Usage:** \`${process.env.PREFIX}rooms enabled <channel_id>\``,
              ].join('\n')
            ),
        ],
        ephemeral: true,
      });

    await manager.prisma.guild.update({
      where: { id: interaction.guild.id },
      data: {
        rooms: {
          channelId: null
        }
      },
    });

    interaction.reply({
      embeds: [
        new Embed()
          .setTitle('Rooms System - Disabled')
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id).correct} The rooms system has been disabled successfully.`,
              `**Usage:** \`${process.env.PREFIX}rooms enabled <channel_id>\``,
            ].join('\n')
          ),
      ],
      ephemeral: true,
    });
  },
};
export = setRoomsDisabled;
