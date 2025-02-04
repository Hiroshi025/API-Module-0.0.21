/* eslint-disable @typescript-eslint/no-explicit-any */
import axios from "axios";
import { existsSync, readFileSync, renameSync } from "fs";

import { logWithLabel } from "@lib/utils/log";
import { PrismaClient } from "@prisma/client";
import {
	MediaFormat, MediaTitle, ServerConfigLegacy, ThreadArchiveTime, TitleFormat
} from "@typings/types/types";

import { DATA_PATH } from "./types/constants";

const alIdRegex = /anilist\.co\/anime\/(.\d*)/;
const malIdRegex = /myanimelist\.net\/anime\/(.\d*)/;
export class AnimeList {
  constructor() {}
  async query(query: string, variables?: any): Promise<any> {
    return axios("https://graphql.anilist.co", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      data: JSON.stringify({
        query,
        variables,
      }),
    }).then((res) => res.data);
  }
  async getMediaId(input: string): Promise<number | null> {
    // First we try directly parsing the input in case it's the standalone ID
    const output = parseInt(input);
    if (output) return output;

    // If that fails, we try parsing it with regex to pull the ID from an AniList link
    let match = alIdRegex.exec(input);
    // If there's a match, parse it and return that
    if (match) return parseInt(match[1]);

    // If that fails, we try parsing it with another regex to get an ID from a MAL link
    match = malIdRegex.exec(input);
    // If we can't find a MAL ID in the URL, just return null;
    if (!match) return null;

    return await this.query("query($malId: Int) { Media(idMal: $malId) { id } }", { malId: match[1] }).then(
      (res: any) => {
        if (res.errors) {
          logWithLabel("error", `AniList API error: ${res.errors[0].message}`);
          return;
        }

        return res.data.Media.id;
      }
    );
  }
  getTitle(title: MediaTitle, wanted: TitleFormat) {
    switch (wanted) {
      case "NATIVE":
        return title.native;
      case "ROMAJI":
        return title.romaji;
      case "ENGLISH":
        return title.english || title.romaji;
      default:
        return title.romaji;
    }
  }
  async readableFormat(format: MediaFormat) {
    switch (format) {
      case "MOVIE":
        return "Movie";
      case "SPECIAL":
        return "Special";
      case "TV_SHORT":
        return "TV Short";
      default:
        return format;
    }
  }
  async getUniqueMediaIds(prisma: PrismaClient): Promise<number[]> {
    return (
      await prisma.watchConfig.findMany({
        where: {
          completed: false,
        },
        select: {
          anilistId: true,
        },
        distinct: ["anilistId"],
      })
    ).map((r) => r.anilistId);
  }
  parseTime(seconds: number) {
    const weeks = Math.floor(seconds / (3600 * 24 * 7));
    seconds -= weeks * 3600 * 24 * 7;
    const days = Math.floor(seconds / (3600 * 24));
    seconds -= days * 3600 * 24;
    const hours = Math.floor(seconds / 3600);
    seconds -= hours * 3600;
    const minutes = Math.floor(seconds / 60);
    seconds -= minutes * 60;

    return { weeks, days, hours, minutes, seconds };
  }
  async formatTime(seconds: number, appendSeconds?: boolean) {
    const time = this.parseTime(seconds);

    let ret = "";
    if (time.weeks > 0) ret += time.weeks + "w";
    if (time.days > 0) ret += (ret.length === 0 ? "" : " ") + time.days + "d";
    if (time.hours > 0) ret += (ret.length === 0 ? "" : " ") + time.hours + "h";
    if (time.minutes > 0) ret += (ret.length === 0 ? "" : " ") + time.minutes + "m";

    if (appendSeconds && time.seconds > 0) ret += (ret.length === 0 ? "" : " ") + time.seconds + "s";

    return ret;
  }
  async convertDataJson(prisma: PrismaClient) {
    if (!existsSync(DATA_PATH)) {
      return;
    }

    const data = JSON.parse(readFileSync(DATA_PATH, "utf-8")) as Record<string, ServerConfigLegacy>;
    for (const [serverId, serverConfig] of Object.entries(data)) {
      await prisma.serverConfig.create({
        data: {
          serverId,
          titleFormat: serverConfig.titleFormat,
          permission: serverConfig.permission,
          permissionRoleId: serverConfig.permissionRoleId,
        },
      });
      logWithLabel("info", `Converted server config for server ID ${serverId}`);

      for (const watchConfig of serverConfig.watching) {
        try {
          await prisma.watchConfig.create({
            data: {
              anilistId: watchConfig.anilistId,
              channelId: watchConfig.channelId,
              createThreads: watchConfig.createThreads || false,
              pingRole: watchConfig.pingRole,
              threadArchiveTime: watchConfig.threadArchiveTime || ThreadArchiveTime.ONE_DAY,
            },
          });
          logWithLabel(
            "info",
            `Converted watch config for media ${watchConfig.anilistId} in channel id ${watchConfig.channelId}`
          );
        } catch (e) {
          logWithLabel(
            "error",
            `Failed to convert watch config for media ${watchConfig.anilistId} in channel id ${watchConfig.channelId} ` +
              e
          );
        }
      }
    }

    renameSync(DATA_PATH, `${DATA_PATH}.old`);
    await this.checkCompletion(prisma);
  }
  async checkCompletion(prisma: PrismaClient, page: number = 1) {
    const ids = (
      await prisma.watchConfig.findMany({
        where: {
          completed: false,
        },
        select: {
          anilistId: true,
        },
        distinct: ["anilistId"],
      })
    ).map((r) => r.anilistId);
    const result = await this.query(
      "query ($page: Int, $ids: [Int!]) { Page(page: $page) { pageInfo { hasNextPage } media(id_in: $ids) { id status } } }",
      {
        page,
        ids: ids,
      }
    ).then((res: any) => res.data.Page);

    const media: { id: number; status: string }[] = result.media;

    for (const m of media) {
      if (m.status === "FINISHED" || m.status === "CANCELLED") {
        const updated = await prisma.watchConfig.updateMany({
          where: {
            anilistId: m.id,
          },
          data: {
            completed: true,
          },
        });
        logWithLabel("info", `Marked ${updated.count} watch configs as completed for media ID ${m.id}`);
      }
    }

    if (result.pageInfo.hasNextPage) await this.checkCompletion(prisma, page + 1);
  }
}
