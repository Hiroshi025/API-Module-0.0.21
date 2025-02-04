import { ColorResolvable, GuildMember, Snowflake, User } from "discord.js";
import { ZodIssue } from "zod";

import { IInvites, IInvitesNumber } from "@typings/modules/global";

type JoinType = "permissions" | "normal" | "vanity" | "unknown";
export type inviterType = User | "vanity" | "unknown";

export declare enum InviteType {
  regular = "regular",
  bonus = "bonus",
  fake = "fake",
  leave = "leave",
}

export type ExtendedGuildMember = GuildMember & {
  invites: IInvitesNumber;
  invitesUsers: IInvites;
  invitedBy: "vanity" | User | "unknown";
};

export type Labels =
  | "error"
  | "success"
  | "debug"
  | "info"
  | "shards"
  | "warn"
  | "PM2"
  | "cache"
  | "maintenance";

export type FileType = "buttons" | "modals" | "menus";
export type ResponseType = { errors: ZodIssue[]; data: null };
export type EmbedResolver = { description: string; color: ColorResolvable };

export interface InvitesTracker {
  on(event: "cacheFetched", listener: () => void): this;
  on(event: "guildMemberAdd", listener: (member: ExtendedGuildMember, joinType: JoinType) => void): this;
  on(event: "guildMemberRemove", listener: (member: ExtendedGuildMember) => void): this;
}

export type RateLimitConfig = {
  maxRequests: number; // Máximo número de peticiones permitidas
  windowMs: number; // Ventana de tiempo en milisegundos
  cooldownMs: number; // Tiempo de enfriamiento en milisegundos
};

export type RateLimitState = {
  requests: number;
  lastRequest: number;
  cooldownUntil?: number;
};

export enum ThreadArchiveTime {
  ONE_HOUR = 60,
  ONE_DAY = 1440,
  THREE_DAYS = 4320,
  SEVEN_DAYS = 10080,
}

// TODO Remove later. Only used for data.json conversion
export type ServerConfigLegacy = {
  permission: PermissionType;
  permissionRoleId: Snowflake;
  titleFormat: TitleFormat;
  watching: Array<{
    channelId: Snowflake;
    anilistId: number;
    pingRole?: Snowflake;
    createThreads: boolean;
    threadArchiveTime: ThreadArchiveTime;
  }>;
};

export type PermissionType = "ANY" | "ROLE" | "OWNER";

export type TitleFormat = "NATIVE" | "ROMAJI" | "ENGLISH";

export type Media = {
  id: number;
  siteUrl: `https://anilist.co/anime/${number}`;
  title: MediaTitle;
  duration: number;
  episodes?: number;
  format: MediaFormat;
  coverImage: {
    large: string;
    color: `#${string}`;
  };
  externalLinks: {
    site: string;
    url: string;
  }[];
};

export type MediaFormat = "TV" | "TV_SHORT" | "MOVIE" | "SPECIAL" | "OVA" | "ONA";

export type MediaTitle = {
  native: string;
  romaji: string;
  english?: string;
};

export type AiringSchedule = {
  id: number;
  media: Media;
  episode: number;
  airingAt: number;
  timeUntilAiring: number;
};

export type StreamSite = {
  name: string;
  icon: string;
  filter?: (externalLink: { site: string; url: string }) => boolean;
};
