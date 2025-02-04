import { profileImage } from "discord-arts";
import {
	AttachmentBuilder, GuildChannel, Message, PermissionFlagsBits, TextChannel
} from "discord.js";

import { manager } from "@/index";
import { logWithLabel } from "@lib/utils/log";

import { BotClient } from "../class/client";

const cooldown = new Set<string>();

export async function Ranking(message: Message, client: BotClient) {
  if (!message.guild || !message.channel || message.author.bot || !client.user) return;

  const guildId = message.guild.id;
  const userId = message.author.id;

  // Cooldown check
  if (cooldown.has(userId)) {
    logWithLabel("custom", `User: ${message.author.tag} | Cooldown activated.`, "Ranking");
    return;
  }

  // Fetch ranking channel configuration from the database
  let rankingChannel = await manager.prisma.levelConfig.findFirst({
    where: { guildId, status: true },
  });

  // If no configuration exists, create a default one
  if (!rankingChannel) {
    rankingChannel = await manager.prisma.levelConfig.create({
      data: { guildId, channelId: null, status: true },
    });
  }

  // Skip if the ranking system is disabled
  if (!rankingChannel.status) return;

  // Generate random XP and fetch user data from the database
  const xpAmount = Math.floor(Math.random() * (25 - 15 + 1) + 15);
  let user = await manager.prisma.userLevel.findFirst({
    where: { guildId, userId },
  });

  // Update or create user data
  user = await manager.prisma.userLevel.upsert({
    where: {
      guildId_userId: {
        guildId: guildId,
        userId: userId,
      },
    },
    update: {
      xp: { increment: xpAmount },
    },
    create: {
      guildId: guildId,
      userId: userId,
      xp: xpAmount,
      level: 0,
    },
  });

  let { xp, level } = user;

  logWithLabel(
    "custom",
    `User talking: ${message.author.tag} | XP: ${xp} | Level: ${level} and earned ${xpAmount} XP.`,
    "Ranking"
  );

  // Check for level-up
  if (xp >= level * 100) {
    level++;
    xp = 0;

    let notificationChannel: GuildChannel | null = null;

    // Fetch the notification channel if configured
    if (rankingChannel.channelId) {
      try {
        notificationChannel = (await client.channels.fetch(rankingChannel.channelId)) as GuildChannel;
      } catch (err) {
        console.error(err);
      }
    }

    // Use the current channel if no notification channel is set
    if (!notificationChannel) {
      notificationChannel = message.channel as GuildChannel;
    }

    // Check for permission to send messages
    if (notificationChannel.permissionsFor(client.user)?.has(PermissionFlagsBits.SendMessages)) {
      const buffer = await profileImage(userId, {
        customTag: `You leveled up to: ${level}!`,
      });

      const attachment = new AttachmentBuilder(buffer, { name: "profile.png" });

      (notificationChannel as TextChannel).send({ files: [attachment] });
    } else {
      // Send a DM if the bot can't send messages in the channel
      const buffer = await profileImage(userId, {
        customTag: `You leveled up to: ${level}!`,
      });

      await message.author.send({
        content: `You leveled up to: ${level}!`,
        files: [new AttachmentBuilder(buffer, { name: "profile.png" })],
      });
    }

    // Update the user's level in the database
    await manager.prisma.userLevel.update({
      where: { id: user.id },
      data: { xp, level },
    });

    // Set cooldown to prevent spam
    cooldown.add(userId);
    setTimeout(() => cooldown.delete(userId), 60000);
  }
}
