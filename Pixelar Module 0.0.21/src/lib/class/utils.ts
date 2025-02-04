/* eslint-disable no-useless-escape */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChannelType, Guild, GuildMember, Message } from "discord.js";
import { lstatSync, readdirSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { client, manager } from "@/index";
import { BotClient } from "@modules/discord/class/client";

/**
 * @name Utils
 * @description The `Utils` class contains utility methods for various purposes.
 * @author MikaboshiDevs
 * @version 0.0.2
 *
 * @alias Util
 * @class
 */
export class Utils {
  public client: BotClient;
  constructor(client: BotClient) {
    this.client = client;
  }

  /**
   * The function `createUser` creates a new user in a database if the user does not already exist.
   * @param {string} userId - The `userId` parameter in the `createUser` function represents the unique
   * identifier of the user for whom you want to create a record in the database. It is typically a
   * string that uniquely identifies a user within a specific context or system.
   * @param {string} guildId - The `guildId` parameter in the `createUser` function represents the unique
   * identifier of the guild (server) to which the user belongs. It is used to associate the user with a
   * specific guild in the database when creating a new user entry.
   * @param {BotClient} client - The `client` parameter in the `createUser` function is an instance of
   * the `BotClient` class. It is used to interact with the Discord API and perform operations related to
   * the bot, such as accessing user information from the cache.
   * @returns If the `data` variable is truthy (not null or undefined), the function will return nothing.
   * If the `user` variable is falsy (null or undefined), the function will return nothing. If the user
   * is successfully created in the database, the function will return `true`.
   */
  public async createUser(userId: string, guildId: string, client: BotClient) {
    const data = await manager.prisma.user.findUnique({ where: { userId: userId, guildId: guildId } });
    if (data) return;

    const user = client.users.cache.get(userId);
    if (!user) return;

    await manager.prisma.user.create({
      data: {
        userId: userId,
        username: user.username,
        guildId: guildId,
        tickets: [],
        warns: [],
      },
    });

    return true;
  }

  /**
   * The function `createGuild` creates a new guild entry in a database if it does not already exist.
   * @param {string} guildId - The `guildId` parameter is a string that represents the unique identifier
   * of a guild in a Discord server. It is used to identify and interact with a specific guild within the
   * Discord ecosystem.
   * @param {BotClient} client - The `client` parameter in the `createGuild` function is of type
   * `BotClient`. It is used to access the Discord client instance and interact with the Discord API,
   * such as fetching guild information using `client.guilds.cache.get(guildId)`.
   * @returns If the `data` variable is truthy (not null or undefined), the function will return early.
   * If the `guild` variable is falsy (null or undefined), the function will also return early. If
   * neither of these conditions are met, the function will create a new guild entry in the database and
   * return `true`.
   */
  public async createGuild(guildId: string, client: BotClient) {
    const data = await manager.prisma.guild.findUnique({ where: { guildId: guildId } });
    if (data) return;

    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;

    await manager.prisma.guild.create({
      data: {
        guildId: guildId,
        guildName: guild.name,
      },
    });

    return true;
  }

  public async getUser(userId: string) {
    const user = client.users.cache.get(userId);
    if (!user) return false;
    return user;
  }

  public async getChannel(channelId: string) {
    const channel = client.channels.cache.get(channelId);
    if (!channel) return false;
    return channel;
  }

  public async getMessage(channelId: string, messageId: string) {
    const channel = client.channels.cache.get(channelId);
    if (!channel || channel.type !== ChannelType.GuildText) return false;

    const message: Message = await channel.messages.fetch(messageId);
    if (!message) return false;
    return message;
  }

  public async Uptime() {
    const totalSeconds = client.uptime ? Math.floor(client.uptime / 1000) : 0;
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    return `\`${days}\` days, \`${hours}\` hours, \`${minutes}\` minutes and \`${seconds}\` seconds`;
  }

  public async getStats() {
    const ram = process.memoryUsage().heapUsed / 1024 / 1024; //devolvera algo como 50.23
    const cpu = process.cpuUsage().system / 1000000; //devolvera algo como 0.5
    const machine = process.platform;
    const version = process.version;

    const type = os.type();
    const release = os.release();

    const totalMemory = (os.totalmem() / 1024 / 1024 / 1024).toFixed(2); // Convertir a GB
    const freeMemory = (os.freemem() / 1024 / 1024 / 1024).toFixed(2); // Convertir a GB

    return {
      ram: Math.round(ram * 100) / 100,
      cpu: Math.round(cpu * 100) / 100,
      totalMemory: totalMemory,
      freeMemory: freeMemory,
      machine: machine,
      version: version,
      release: release,
      type: type,
    };
  }

  //NHENTAI METHODS
  base64(text: string, mode = "encode") {
    if (mode === "encode") return Buffer.from(text).toString("base64");
    if (mode === "decode") return Buffer.from(text, "base64").toString("utf8") || null;
    throw new TypeError(`${mode} is not a supported base64 mode.`);
  }

  chunkify<T>(a: T[], chunk: number) {
    return Array.from(Array(Math.ceil(a.length / chunk)), (_, i) => a.slice(i * chunk, i * chunk + chunk));
  }

  formatMilliseconds(ms: number) {
    let x = Math.floor(ms / 1000);
    const s = x % 60;

    x = Math.floor(x / 60);
    const m = x % 60;

    x = Math.floor(x / 60);
    const h = x % 24;

    const d = Math.floor(x / 24);

    const seconds = `${"0".repeat(2 - s.toString().length)}${s}`;
    const minutes = `${"0".repeat(2 - m.toString().length)}${m}`;
    const hours = `${"0".repeat(2 - h.toString().length)}${h}`;
    const days = `${"0".repeat(Math.max(0, 2 - d.toString().length))}${d}`;

    return `${days === "00" ? "" : `${days}:`}${hours}:${minutes}:${seconds}`;
  }

  capitalize(text: string) {
    return text.replace(/([^\W_]+[^\s-]*) */g, function (txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    });
  }

  compareObject(object1: any, object2: any, first = true) {
    if (!object1 || !object2) return;

    const keys1: any = Object.keys(object1);
    const keys2: any = Object.keys(object2);
    const keys = first ? keys1.filter((key: any) => keys2.includes(key)) : keys1;
    for (const key of keys) {
      const val1 = object1 ? object1[key] : null;
      const val2 = object2 ? object2[key] : null;
      const areObjects = this.isObject(val1) && this.isObject(val2);
      if ((areObjects && !this.compareObject(val1, val2, false)) || (!areObjects && val1 !== val2)) {
        return false;
      }
    }
    return true;
  }

  escapeMarkdown(text: string) {
    const unescaped = text.replace(/\\(\*|_|`|~|\\)/g, "$1");
    const escaped = unescaped.replace(/(\*|_|`|~|\\)/g, "\\$1");
    return escaped;
  }

  escapeRegExp(text: string) {
    return text.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
  }

  gshorten(tags: Array<string>, split = " ", maxLen = 1024) {
    const text = tags.join(split);
    if (text.length <= maxLen) return text;
    return text.substring(0, text.lastIndexOf(split, maxLen - 4) + 1) + "...";
  }

  hasCommon<T>(texts: T[], keywords: T[]) {
    return [...new Set(texts)].some((x) => new Set(keywords).has(x));
  }

  indefiniteArticle(phrase: string) {
    // Getting the first word
    const match = /\w+/.exec(phrase);
    let word = "an";
    if (match) word = match[0];
    else return word;

    const l_word = word.toLowerCase();
    // Specific start of words that should be preceeded by 'an'
    const alt_cases = ["honest", "hour", "hono"];
    for (const i in alt_cases) {
      if (l_word.indexOf(alt_cases[i]) === 0) return "an";
    }

    // Single letter word which should be preceeded by 'an'
    if (l_word.length === 1) {
      if ("aedhilmnorsx".indexOf(l_word) >= 0) return "an";
      else return "a";
    }

    // Capital words which should likely be preceeded by 'an'
    if (
      word.match(
        /(?!FJO|[HLMNS]Y.|RY[EO]|SQU|(F[LR]?|[HL]|MN?|N|RH?|S[CHKLMNPTVW]?|X(YL)?)[AEIOU])[FHLMNRSX][A-Z]/
      )
    ) {
      return "an";
    }

    // Special cases where a word that begins with a vowel should be preceeded by 'a'
    const regexes = [/^e[uw]/, /^onc?e\b/, /^uni([^nmd]|mo)/, /^u[bcfhjkqrst][aeiou]/];
    for (const i in regexes) {
      if (l_word.match(regexes[i])) return "a";
    }

    // Special capital words (UK, UN)
    if (word.match(/^U[NK][AIEO]/)) {
      return "a";
    } else if (word === word.toUpperCase()) {
      if ("aedhilmnorsx".indexOf(l_word[0]) >= 0) return "an";
      else return "a";
    }

    // Basic method of words that begin with a vowel being preceeded by 'an'
    if ("aeiou".indexOf(l_word[0]) >= 0) return "an";

    // Instances where y follwed by specific letters is preceeded by 'an'
    if (l_word.match(/^y(b[lor]|cl[ea]|fere|gg|p[ios]|rou|tt)/)) return "an";

    return "a";
  }

  isBetween(num: number, min: number, max: number) {
    return num >= min && num <= max;
  }

  isObject(object: any) {
    return object != null && typeof object === "object";
  }

  pad(text: string, width: number, char = "0") {
    return String(text).length >= width
      ? String(text)
      : new Array(width - String(text).length + 1).join(char) + String(text);
  }

  random<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }

  shorten(text: string, split = " ", maxLen = 4090) {
    if (text.length <= maxLen) return text;
    return text.substring(0, text.lastIndexOf(split, maxLen) + 1) + "`...`";
  }

  shuffle<T>(array: T[]): T[] {
    for (let i = array.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
  }

  splitWithQuotes(text: string) {
    if (!text) return;
    return text.match(/\\?.|^$/g)?.reduce(
      (p, c) => {
        if (c === '"') {
          p.quote ^= 1;
        } else if (!p.quote && c === " ") {
          p.a.push("");
        } else {
          p.a[p.a.length - 1] += c.replace(/\\(.)/, "$1");
        }
        return p;
      },
      { a: [""], quote: 0 }
    ).a;
  }

  resolvePerm(text: string) {
    return text
      .toLowerCase()
      .replace(/guild/g, "Server")
      .replace(/_/g, " ")
      .replace(/\b[a-z]/g, (t) => t.toUpperCase());
  }

  parse = (content: string, member: GuildMember, guild: Guild) => {
    return content
      .replaceAll(/\\n/g, "\n")
      .replaceAll(/{server}/g, member.guild.name)
      .replaceAll(/{member:id}/g, member.id)
      .replaceAll(/{member:name}/g, member.displayName)
      .replaceAll(/{member:mention}/g, member.toString())
      .replaceAll(/{guils:name}/g, guild.name)
      .replaceAll(/{member:tag}/g, member.user.tag);
  };

  /**
   * Finds the command file in the specified directory.
   * @param dir - The directory to search.
   * @param commandName - The name of the command to find.
   * @returns The path to the command file or `null` if not found.
   * @private
   *
   * @example
   * ```ts
   * const commandFile = findCommandFile('src/apps/commands', 'ping');
   * ```
   */
  findCommandFile(dir: string, commandName: string): string | null {
    const files = readdirSync(dir);
    for (const file of files) {
      const fullPath = path.join(dir, file);
      const stat = lstatSync(fullPath);
      if (stat.isDirectory()) {
        const result = this.findCommandFile(fullPath, commandName);
        if (result) {
          return result;
        }
      } else if (file === `${commandName}.js` || file === `${commandName}.ts`) {
        return fullPath;
      }
    }
    return null;
  }

  getGuild(guildId: string) {
    const guild = client.guilds.cache.get(guildId);
    if (!guild) return;
    return guild;
  }
}
