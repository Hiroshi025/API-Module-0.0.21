import { EmbedBuilder, TextChannel } from "discord.js";

import { client } from "@/index";
import { logWithLabel } from "@lib/utils/log";
import { PrismaClient } from "@prisma/client";
import { AiringSchedule, TitleFormat } from "@typings/types/types";

import { SCHEDULE_QUERY, STREAMING_SITES } from "../types/constants";

const announcementTimouts: NodeJS.Timeout[] = [];
let queuedIds: number[] = [];

export async function initScheduler(prisma: PrismaClient) {
  // Clear any remaining announcements since we're about to remake them all
  // The only ones that should be left are any made when adding a new show to watch
  announcementTimouts.forEach(clearTimeout);

  // Current time in ms + 24 hours worth of ms
  const endTime = Date.now() + 24 * 60 * 60 * 1000;

  const uniqueIds = await client.animelist.getUniqueMediaIds(prisma);

  // Grab all the necessary announcements over the next 24 hours and schedule our own channel announcements
  await scheduleAnnouncements(uniqueIds, prisma, Date.now(), endTime);

  // Re-initialize the scheduler 1 minute before the end of the last tracked time window
  setTimeout(() => initScheduler(prisma), endTime - Date.now() - 60 * 1000);
}

export async function scheduleAnnouncements(
  mediaIds: number[],
  prisma: PrismaClient,
  startTime: number = Date.now(),
  endTime: number = Date.now() + 24 * 60 * 60 * 1000
) {
  const upcomingEpisodes = await getUpcomingEpisodes(mediaIds, startTime, endTime);
  upcomingEpisodes.forEach((e) => {
    logWithLabel(
      "info",
      `Scheduling announcement for ${e.media.title.english || e.media.title.romaji || e.media.title.native} episode ${
        e.episode
      } in ${client.animelist.formatTime(e.timeUntilAiring)}`
    );
    const timeout = setTimeout(() => sendAnnouncement(prisma, e), e.timeUntilAiring * 1000);
    announcementTimouts.push(timeout);
    queuedIds.push(e.media.id);
  });
}

export async function getUpcomingEpisodes(
  mediaIds: number[],
  startTime: number,
  endTime: number,
  pageInfo?: { page: number; perPage: number }
): Promise<AiringSchedule[]> {
  startTime = Math.floor(startTime / 1000);
  endTime = Math.floor(endTime / 1000);

  const upcomingEpisodes: AiringSchedule[] = [];

  async function fetchSchedule(page: number = 1) {
    const response = (
      await client.animelist.query(SCHEDULE_QUERY, {
        page: pageInfo ? pageInfo.page : page,
        amount: pageInfo ? pageInfo.perPage : undefined,
        ids: mediaIds,
        dateStart: startTime,
        nextDay: endTime,
      })
    ).data.Page;

    upcomingEpisodes.push(...(response.airingSchedules as AiringSchedule[]));

    if (!pageInfo && response.pageInfo.hasNextPage) await fetchSchedule(page + 1);
  }

  await fetchSchedule();
  return upcomingEpisodes;
}

export async function sendAnnouncement(prisma: PrismaClient, airing: AiringSchedule) {
  if (!queuedIds.includes(airing.media.id)) {
    logWithLabel("error", `Media ${airing.media.id} was not found in the queue. Skipping...`);
    return;
  }

  const announcements = await prisma.watchConfig.findMany({
    where: {
      anilistId: airing.media.id,
    },
    distinct: ["channelId", "anilistId"],
  });

  if (announcements.length === 0) {
    logWithLabel("error", `No announcements found for ${airing.media.id}. Skipping...`);
    return;
  }

  for (const announcement of announcements) {
    const channel = (await client.channels.fetch(announcement.channelId)) as TextChannel;
    if (!channel) {
      logWithLabel("error", `Failed to fetch channel ${announcement.channelId}`);
      continue;
    }

    const serverConfig = await prisma.serverConfig.findFirst({
      where: {
        serverId: channel.guildId,
      },
    });

    if (!serverConfig) {
      logWithLabel("error", `Failed to fetch server config for ${channel.guildId}`);
      continue;
    }

    const roleMention = announcement.pingRole ? await channel.guild.roles.fetch(announcement.pingRole) : null;
    const message = await channel.send({
      content: roleMention ? `<@&${roleMention.id}>` : undefined,
      embeds: [createAnnouncementEmbed(airing, serverConfig.titleFormat as TitleFormat)],
    });
    logWithLabel("info", `Sent announcement for ${airing.media.id} in ${channel.id}`);
    try {
      if (announcement.createThreads) {
        message.startThread({
          name: `${client.animelist.getTitle(airing.media.title, serverConfig.titleFormat as TitleFormat)} Episode ${
            airing.episode
          } Discussion`,
          autoArchiveDuration: announcement.threadArchiveTime,
        });
      }
    } catch (e) {
      logWithLabel("error", `Failed to create thread for ${airing.media.id} in ${channel.id} ` + e);
    }
  }

  // Remove the AniList ID from the queue to prevent duplicate announcements
  queuedIds = queuedIds.filter((id) => id !== airing.media.id);

  // If this is the finale, set it as completed
  if (airing.media.episodes === airing.episode) {
    await prisma.watchConfig.updateMany({
      where: {
        anilistId: airing.media.id,
      },
      data: {
        completed: true,
      },
    });
    logWithLabel("info", `Marked media ${airing.media.id} as completed`);
  }
}

export function createAnnouncementEmbed(airing: AiringSchedule, titleFormat: TitleFormat): EmbedBuilder {
  const embed = new EmbedBuilder()
    .setAuthor({
      name: "AniList",
      iconURL: "https://anilist.co/img/logo_al.png",
      url: "https://anilist.co/",
    })
    .setColor(airing.media.coverImage.color || 43775)
    .setDescription(
      `Episode ${airing.episode} of [${client.animelist.getTitle(airing.media.title, titleFormat)}](${
        airing.media.siteUrl
      }) has just aired.${airing.media.episodes === airing.episode ? " This is the season finale." : ""}`
    )
    .setTimestamp(airing.airingAt * 1000)
    .setFooter({
      text: [
        airing.media.episodes ? `${airing.media.episodes} Episodes` : "",
        `Format: ${client.animelist.readableFormat(airing.media.format)}`,
      ]
        .filter((s) => s.length > 0)
        .join(" • "),
    })
    .setThumbnail(airing.media.coverImage.large);

  const allowedExternalLinks = airing.media.externalLinks.filter((l) => {
    const streamingsite = STREAMING_SITES.find((s) => s.name === l.site);
    return streamingsite && (!streamingsite.filter || streamingsite.filter(l));
  });
  if (allowedExternalLinks.length > 0) {
    embed.addFields({
      name: "Streams",
      value: allowedExternalLinks
        .map((l) => {
          const streamSite = STREAMING_SITES.find((s) => s.name === l.site);
          return `${streamSite?.icon ? streamSite.icon : ""} [${l.site}](${l.url})`;
        })
        .join(" | "),
    });
    embed.addFields({
      name: "Notice",
      value: "It may take some time for this episode to appear on the above streaming service(s).",
    });
  } else embed.addFields({ name: "Streams", value: "No licensed streaming links available" });

  return embed;
}
