import { manager } from "@/index";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Menus } from "@typings/index";

const setMenuRoom: Menus = {
  id: 'rooms:menu-config',
  tickets: false,
  owner: false,
  permissions: ['ManageChannels'],
  botpermissions: ['SendMessages'],
  async execute(interaction, client) {
    if (!interaction.guild || !interaction.channel) return;
    const channelId = interaction.values[0];
    const channel = interaction.guild.channels.cache.get(channelId);
    if (!channel)
      return interaction.reply({
        embeds: [
          new ErrorEmbed(interaction.guild.id)
            .setTitle('Error Rooms - Systems')
            .setDescription(
              [
                `${
                  client.getEmoji(interaction.guild.id).error
                } An error occurred while trying to set the rooms system.`,
                `Please try again later or contact the support team.`,
              ].join('\n')
            ),
        ], ephemeral: true
      });

    await manager.prisma.guild.update({
      where: { id: interaction.guild.id },
      data: {
        rooms: {
          channelId
        }
      },
    });

    interaction.reply({
      embeds: [
        new Embed()
          .setTitle('Rooms System - Enabled')
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id).correct} The rooms system has been enabled successfully.`,
              `**Channel:** <#${channelId}>`,
              `**Usage:**`,
              `• \`${process.env.PREFIX}rooms disabled\``,
              `• \`${process.env.PREFIX}rooms enabled <channel_id>\``,
            ].join('\n')
          ),
      ], ephemeral: true
    });
  },
};
export = setMenuRoom;
