import { ChannelType } from "discord.js";
import { Request, Response } from "express";

import { client, manager } from "@/index";
import { getServerConfig } from "@modules/animelist/graphql/functions";
import { scheduleAnnouncements } from "@modules/animelist/graphql/scheduler";
import { ThreadArchiveTime, TitleFormat } from "@typings/types/types";

export class NekoCtrl {
  static AnimelistPost = async (req: Request, res: Response) => {
    const { url, channelId, roleId, createThread, guildId } = req.body;
    if (!url || !channelId || !roleId || !createThread || !guildId)
      return res.status(400).json({
        errors: req.t("api:controllers.nekos.animelist.400.notfoundfields"),
        data: null,
      });

    const anilistId = await client.animelist.getMediaId(url);
    if (!anilistId)
      return res.status(400).json({
        errors: req.t("api:controllers.nekos.animelist.400.invalidurl"),
        data: null,
      });

    const channel = await client.utils.getChannel(channelId);
    if (!channel || channel.type === ChannelType.GuildVoice)
      return res.status(400).json({
        errors: req.t("api:controllers.nekos.animelist.400.invalidchannel"),
        data: null,
      });

    const existing = await manager.prisma.watchConfig.findFirst({
      where: {
        AND: [{ anilistId }, { channelId: channel.id }],
      },
    });
    if (existing)
      return res.status(400).json({
        errors: req.t("api:controllers.nekos.animelist.400.alreadyexists", {
          channelid: channel.id,
        }),
        data: null,
      });

    const serverConfig = await getServerConfig(manager.prisma, guildId);
    const media = (
      await client.animelist.query(
        "query($id: Int!) { Media(id: $id) { id status title { native romaji english } } }",
        {
          id: anilistId,
        }
      )
    ).data.Media;
    if (!["NOT_YET_RELEASED", "RELEASING"].includes(media.status))
      return res.status(400).json({
        errors: `${client.animelist.getTitle(
          media.title,
          serverConfig.titleFormat as TitleFormat
        )} is not an upcoming or currently airing anime.`,
        data: null,
      });

    const data = await manager.prisma.watchConfig.create({
      data: {
        anilistId,
        channelId: channel.id,
        pingRole: roleId ? roleId : null,
        createThreads: createThread,
        threadArchiveTime: ThreadArchiveTime.ONE_DAY,
      },
    });

    await scheduleAnnouncements([anilistId], manager.prisma);
    return res.status(200).json({
      errors: null,
      data: {
        message: req.t("api:controllers.nekos.animelist.200.success", {
          datafound: client.animelist.getTitle(media.title, serverConfig.titleFormat as TitleFormat),
          linkfound: `https://anilist.co/anime/${media.id}`,
          channel: channel.toString(),
        }),
        data: data,
      },
    });
  };
}
