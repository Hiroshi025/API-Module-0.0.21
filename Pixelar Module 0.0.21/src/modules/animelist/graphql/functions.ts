import { Snowflake } from "discord.js";

import { PrismaClient, ServerConfig } from "@prisma/client";

export async function getServerConfig(prisma: PrismaClient, serverId: Snowflake): Promise<ServerConfig> {
  let serverConfig = await prisma.serverConfig.findFirst({
    where: {
      serverId,
    },
  });
  if (!serverConfig) {
    serverConfig = await prisma.serverConfig.create({
      data: {
        serverId,
        permission: 'OWNER',
        titleFormat: 'ROMAJI',
      },
    });
  }

  return serverConfig;
}
