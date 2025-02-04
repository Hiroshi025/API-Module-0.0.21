import fs from "fs";
import path from "path";

/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { GoogleGenerativeAI } from "@google/generative-ai";
import { ServerError } from "@lib/extenders/error.extend";
import { BotClient } from "@modules/discord/class/client";

import { manager } from "../..";

export async function getMemoryUsage() {
  const memoryUsage = process.memoryUsage().heapUsed / (1024 * 1024);
  return memoryUsage.toFixed(1);
}

export const getFiles = (
  requestedPath: string,
  allowedExtensions: string[] = [".js", ".mjs", ".cjs", ".ts"]
): string[] => {
  if (typeof allowedExtensions === "string") {
    allowedExtensions = [allowedExtensions];
  }

  requestedPath ??= path.resolve(requestedPath);
  let res: string[] = [];

  for (let itemInDir of fs.readdirSync(requestedPath)) {
    itemInDir = path.resolve(requestedPath, itemInDir);
    const stat = fs.statSync(itemInDir);

    if (stat.isDirectory()) {
      res = res.concat(getFiles(itemInDir, allowedExtensions));
    }

    if (
      stat.isFile() &&
      allowedExtensions.find((ext) => itemInDir.endsWith(ext)) &&
      !itemInDir.slice(itemInDir.lastIndexOf(path.sep) + 1, itemInDir.length).startsWith(".")
    ) {
      res.push(itemInDir);
    }
  }

  return res;
};

/**
 *
 * The function returns the channel where the logs are sent.
 * is used in the command handler to send logs to the channel.
 *
 * @param guildId
 * @param client
 * @returns
 */
export async function LogsChannel(guildId: string, client: BotClient) {
  const data = await manager.prisma.logs.findUnique({
    where: {
      guildId: guildId,
    },
  });
  if (!data) return;

  const channelId = data.channelId;
  if (!channelId || channelId === null) return;

  const guild = client.guilds.cache.get(guildId);
  if (!guild) return;

  const channel = guild.channels.cache.get(channelId);
  if (!channel) return;

  return channel;
}

export const HostURL = (): string => {
  let URL;
  if (process.env.HOST === "localhost") {
    URL = `http://${process.env.HOST}:${process.env.PORT}`;
  } else {
    URL = `https://${process.env.HOST}`;
  }

  return URL;
};

export async function IAConfig(prompt: string) {
  const configuration = new GoogleGenerativeAI(process.env.API_KEY as string).getGenerativeModel({
    model: process.env.MODEL as string,
    systemInstruction: process.env.CONFIGSYSTEM,
  });
  const conversationContext: any[][] = [];
  const currentMessages = [];
  try {
    for (const [inputText, responseText] of conversationContext) {
      currentMessages.push({ role: "user", parts: inputText });
      currentMessages.push({ role: "model", parts: responseText });
    }

    const chat = configuration.startChat({
      history: currentMessages,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.1,
      },
      tools: [
        {
          codeExecution: {},
        },
      ],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Stores the conversation
    conversationContext.push([prompt, responseText]);
    return {
      response: responseText,
    };
  } catch (err) {
    throw new ServerError("An error occurred while generating the response.");
  }
}
