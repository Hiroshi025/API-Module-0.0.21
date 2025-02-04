import { ChannelType } from "discord.js";

import { client, manager } from "@/index";
import { ClientError } from "@lib/extenders/error.extend";
import { Event } from "@modules/discord/class/builders";

export default new Event('voiceStateUpdate', async (oldState, newState) => {
  const { member, guild } = newState;
  const oldChannel = oldState.channel;
  const newChannel = newState.channel;

  const data = await manager.prisma.guild.findUnique({ where: { id: guild.id } });
  if (!data) return;

  const joinToCreate = data.rooms?.channelId;
  const user = member?.user;

  if (!joinToCreate || joinToCreate === '') return;
  if (!user) return;

  if (oldChannel !== newChannel && newChannel && newChannel.id === joinToCreate) {
    const voiceChannel = await guild.channels.create({
      name: user.username + user.discriminator,
      type: ChannelType.GuildVoice,
      parent: newChannel.parent,
    }).catch(() => {
      throw new ClientError('Failed to create the channel');
    });

    client.voiceGenerator.set(member?.id, voiceChannel.id);
    return setTimeout(() => member?.voice.setChannel(voiceChannel), 500);
  }
  const ownedChannel = client.voiceGenerator.get(member?.id);
  if (ownedChannel && oldChannel?.id == ownedChannel && (!newChannel || newChannel.id !== ownedChannel)) {
    client.voiceGenerator.set(member?.id, '');
    oldChannel?.delete().catch(() => {
      throw new ClientError('Failed to delete the channel');
    });
  }
});
