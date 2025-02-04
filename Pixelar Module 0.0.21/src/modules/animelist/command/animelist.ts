/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	ButtonStyle, ChannelType, ChatInputCommandInteraction, GuildMember, MessageFlags
} from "discord.js";
import { version } from "process";

import { manager } from "@/index";
import { ActionRowBuilder, ButtonBuilder, StringSelectMenuBuilder } from "@discordjs/builders";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { getServerConfig } from "@modules/animelist/graphql/functions";
import {
	createAnnouncementEmbed, getUpcomingEpisodes, scheduleAnnouncements
} from "@modules/animelist/graphql/scheduler";
import { BotClient } from "@modules/discord/class/client";
import { ThreadArchiveTime, TitleFormat } from "@typings/types/types";

const startedAt = Math.floor(Date.now() / 1000);
const watchingQuery = `query($ids: [Int]!, $page: Int) {
  Page(page: $page) {
    pageInfo {
      hasNextPage
    }
    media(id_in: $ids) {
      siteUrl
      status
      title {
        native
        romaji
        english
      }
      nextAiringEpisode {
        timeUntilAiring
      }
    }
  }
}`.trim();

function createEmbed(description: string) {
  return [
    {
      title: "Current Announcements",
      color: 4044018,
      author: {
        name: "AniList",
        url: "https://anilist.co",
        icon_url: "https://anilist.co/img/logo_al.png",
      },
      description,
    },
  ];
}

export async function Animelist(interaction: ChatInputCommandInteraction, client: BotClient) {
  const group = interaction.options.getSubcommandGroup();
  const subcommand = interaction.options.getSubcommand();

  switch (group) {
    case "tools":
      {
        switch (subcommand) {
          case "titleformat":
            {
              const serverConfig = await getServerConfig(manager.prisma, interaction.guildId as string);
              const { value: format } = interaction.options.get("format") as { value: string };
              await manager.prisma.serverConfig.update({
                where: {
                  id: serverConfig.id,
                },
                data: {
                  titleFormat: format.toUpperCase() as TitleFormat,
                },
              });

              interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                  new Embed()
                    .setTitle("Title Format")
                    .setDescription(
                      [
                        `${
                          client.getEmoji(interaction.guildId as string).correct
                        } The title format has been updated to ${format}`,
                        `From now on, media titles will use the ${format} format`,
                      ].join("\n")
                    ),
                ],
              });
            }
            break;
          case "watching":
            {
              const serverConfig = await getServerConfig(manager.prisma, interaction.guildId as string);
              const channel = interaction.options.getChannel("channel") || interaction.channel;
              if (!channel || !interaction.guildId || !interaction.guild) return;
              const watching = (
                await manager.prisma.watchConfig.findMany({
                  where: {
                    channelId: channel.id,
                  },
                })
              ).map((r) => r.anilistId);
              let description = "";
              const otherChannel = channel.id !== interaction.channelId;

              let watchingMedia = (await client.animelist.query(watchingQuery, { ids: watching })).data.Page
                .media as any[];
              watchingMedia = watchingMedia
                .filter((m) => m.status !== "FINISHED" && m.status !== "CANCELLED")
                .sort(
                  (m1, m2) => m1.nextAiringEpisode?.timeUntilAiring - m2.nextAiringEpisode?.timeUntilAiring
                );

              for (const m of watchingMedia) {
                const nextLine = `\n• [${client.animelist.getTitle(
                  m.title,
                  serverConfig.titleFormat as TitleFormat
                )}](${m.siteUrl})${
                  m.nextAiringEpisode
                    ? ` (~${client.animelist.formatTime(m.nextAiringEpisode.timeUntilAiring)})`
                    : ""
                }`;
                if (1000 - description.length < nextLine.length) {
                  if (interaction.replied)
                    await interaction.followUp({
                      embeds: createEmbed(description),
                      ephemeral: otherChannel,
                    });
                  else await interaction.reply({ embeds: createEmbed(description), ephemeral: otherChannel });
                  description = "";
                }

                description += nextLine;
              }

              if (description.length > 0) {
                if (interaction.replied)
                  await interaction.followUp({ embeds: createEmbed(description), ephemeral: otherChannel });
                else await interaction.reply({ embeds: createEmbed(description), ephemeral: otherChannel });
              } else if (!interaction.replied) {
                await interaction.reply({
                  embeds: [
                    new ErrorEmbed(interaction.guildId as string)
                      .setTitle("No Announcements")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guildId).error
                          } There are no upcoming or currently airing anime in ${channel.toString()}`,
                          `Use \`/watch\` to start watching a show.`,
                        ].join("\n")
                      ),
                  ],
                  ephemeral: otherChannel,
                });
              }
            }
            break;
        }
      }
      break;
    case "info":
      {
        switch (subcommand) {
          case "about":
            {
              if (!interaction.guild || !client.user) return;
              await interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                  new Embed()
                    .setTitle(`${client.user.username} v${version}`)
                    .setAuthor({ name: client.user.username, iconURL: client.user.avatarURL() as string })
                    .setColor(43775)
                    .setDescription(
                      "Anime episode airing announcements based on the **[AniList](https://anilist.co)** airing schedule."
                    )
                    .setFooter({
                      text: `Uptime: ${client.animelist.formatTime(Math.floor(Date.now() / 1000) - startedAt, true)}`,
                    }),
                ],
                components: [
                  new ActionRowBuilder<ButtonBuilder>().addComponents(
                    new ButtonBuilder()
                      .setStyle(ButtonStyle.Link)
                      .setLabel("Author")
                      .setURL("https://anilist.co/user/42069")
                  ),
                ],
              });
            }
            break;
        }
      }
      break;
    case "config":
      {
        switch (subcommand) {
          case "edit":
            {
              const channel = interaction.options.getChannel("channel") || interaction.channel;
              const threadArchiveTime = interaction.options.getInteger("thread_archive");
              const createThreads = interaction.options.getBoolean("create_threads");
              const removePing = interaction.options.getRole("remove_mention");
              const role = interaction.options.getRole("mention_role");
              const value = interaction.options.getString("anime");
              if (!interaction.guild || !channel) return;

              if (!(interaction.member as GuildMember).permissions.has("ManageChannels")) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guild.id)
                      .setTitle("Error Edit - Animelist")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guild.id).error
                          } You need the \`Manage Channels\` permission to edit announcements.`,
                          `**Channel:** ${channel.toString()}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              const anilistId = await client.animelist.getMediaId(value as string);
              if (!anilistId) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guild.id)
                      .setTitle("Error Edit - Animelist")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guild.id).error
                          } We couldn't find that anime! Please check your input and try again`,
                          `**Input:** ${value}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              if (channel.type === ChannelType.GuildVoice) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guild.id)
                      .setTitle("Error Edit - Animelist")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guild.id).error
                          } Announcements cannot be made in voice channels.`,
                          `**Channel:** ${channel.toString()}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              const watchConfig = await manager.prisma.watchConfig.findFirst({
                where: {
                  anilistId,
                  channelId: channel.id,
                },
              });

              if (!watchConfig) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guild.id)
                      .setTitle("Error Edit - Animelist")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guild.id).error
                          } We couldn't find an announcement for that anime in ${channel.toString()}.`,
                          `**Anime:** ${value}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              if (role) watchConfig.pingRole = role.id;
              if (removePing) watchConfig.pingRole = null;
              if (createThreads !== null) watchConfig.createThreads = createThreads;
              if (threadArchiveTime !== null) watchConfig.threadArchiveTime = threadArchiveTime;
              await manager.prisma.watchConfig.updateMany({
                where: {
                  anilistId: watchConfig.anilistId,
                  channelId: watchConfig.channelId,
                },
                data: watchConfig,
              });

              interaction.reply({
                flags: MessageFlags.Ephemeral,
                embeds: [
                  new Embed()
                    .setTitle("Edit - Animelist")
                    .setDescription(
                      [
                        `${
                          client.getEmoji(interaction.guild.id).correct
                        } Successfully updated the announcement for ${value} in ${channel.toString()}`,
                        `> **Channel:** ${channel.toString()}`,
                        `> **Anime:** ${value}`,
                        `> **Create Threads:** ${createThreads ? "Yes" : "No"}`,
                        `> **Thread Archive Time:** ${threadArchiveTime ? `${threadArchiveTime} days` : "None"}`,
                        `> **Ping Role:** ${role ? role.toString() : "None"}`,
                      ].join("\n")
                    ),
                ],
              });
            }
            break;
          case "unwatch":
            {
              const channel = interaction.options.getChannel("channel") || interaction.channel;
              const value = interaction.options.getString("anime");
              if (!channel || !interaction.guildId) return;

              if (!(interaction.member as GuildMember).permissions.has("ManageGuild")) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Error Unwatch - Animelist")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guildId).error
                          } You need the \`Manage Guild\` permission to unwatch announcements.`,
                          `**Channel:** ${channel.toString()}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              const anilistId = await client.animelist.getMediaId(value as string);
              if (!anilistId) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Anime Not Found")
                      .setDescription(
                        [
                          `${client.getEmoji(interaction.guildId).error} We couldn't find that anime!`,
                          `Please check your input and try again`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              if (channel.type === ChannelType.GuildVoice) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Invalid Channel")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guildId).error
                          } Announcements cannot be made in voice channels.`,
                          `Please select a text channel instead.`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              const serverConfig = await getServerConfig(manager.prisma, interaction.guildId);
              await manager.prisma.watchConfig.deleteMany({
                where: {
                  anilistId,
                  channelId: channel.id,
                },
              });

              const media = (
                await client.animelist.query("query($id: Int!) { Media(id: $id) { id title { romaji } } }", {
                  id: anilistId,
                })
              ).data.Media;
              interaction.reply({
                embeds: [
                  new Embed()
                    .setTitle("Anime Unwatched")
                    .setDescription(
                      [
                        `${
                          client.getEmoji(interaction.guildId).correct
                        } You will no longer receive announcements for [${client.animelist.getTitle(
                          media.title,
                          serverConfig.titleFormat as TitleFormat
                        )}](https://anilist.co/anime/${media.id}) in ${channel.toString()}.`,
                        `If you want to start watching it again, use the \`watch\` command.`,
                      ].join("\n")
                    ),
                ],
                flags: MessageFlags.Ephemeral,
              });
            }
            break;
          case "upcoming":
            {
              const serverConfig = await getServerConfig(manager.prisma, interaction.guildId as string);
              if (!interaction.guildId || !client.user || !interaction.channel) return;

              if (!(interaction.member as GuildMember).permissions.has("ManageGuild")) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Error Upcoming - Animelist")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guildId).error
                          } You need the \`Manage Channels\` permission to get upcoming episodes.`,
                          `**Channel:** ${interaction.channel.toString()}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              const startTime = Date.now();
              let days = interaction.options.getInteger("days") || 1;
              if (days > 7) days = 7;

              const endTime = startTime + days * 24 * 60 * 60 * 1000;
              const channelSeries = (
                await manager.prisma.watchConfig.findMany({
                  where: {
                    channelId: interaction.channelId,
                  },
                })
              ).map((r) => r.anilistId);
              const upcoming = await getUpcomingEpisodes(channelSeries, startTime, endTime);
              if (upcoming.length === 0) {
                interaction.reply({
                  content: `Nothing upcoming in the next ${days} day(s)`,
                  flags: MessageFlags.Ephemeral,
                });
                return false;
              }

              const actionRow = new ActionRowBuilder<StringSelectMenuBuilder>();
              if (upcoming.length > 1) {
                const selector = new StringSelectMenuBuilder()
                  .setCustomId("upcoming:episode-selector")
                  .setPlaceholder("Check another upcoming episode");
                upcoming.forEach((a) => {
                  let title = client.animelist.getTitle(
                    a.media.title,
                    serverConfig.titleFormat as TitleFormat
                  );
                  if (title.length > 25) title = title.substring(0, 22) + "...";

                  selector.addOptions([
                    {
                      label: title,
                      value: a.id.toString(),
                      description: `Episode ${a.episode} - ${client.animelist.formatTime(a.timeUntilAiring)}`,
                    },
                  ]);
                });

                actionRow.addComponents([selector]);
              }

              try {
                const embed = createAnnouncementEmbed(upcoming[0], serverConfig.titleFormat as TitleFormat);
                embed.setDescription(
                  `Episode ${upcoming[0].episode} of [${client.animelist.getTitle(
                    upcoming[0].media.title,
                    serverConfig.titleFormat as TitleFormat
                  )}](${upcoming[0].media.siteUrl}) will air in ${client.animelist.formatTime(
                    upcoming[0].timeUntilAiring
                  )}.`
                );

                await interaction.reply({
                  embeds: [embed],
                  components: actionRow.components.length > 0 ? [actionRow] : undefined,
                  flags: MessageFlags.Ephemeral,
                });
              } catch (e) {
                console.log(e);
              }
            }
            break;
          case "watch":
            {
              const value = interaction.options.getString("anime");
              const channel = interaction.options.getChannel("channel") || interaction.channel;
              const role = interaction.options.getRole("mention_role");
              const createThreads = interaction.options.getBoolean("create_threads") || false;
              const threadArchiveTime: ThreadArchiveTime =
                interaction.options.getInteger("thread_archive") || ThreadArchiveTime.ONE_DAY;

              if (!channel || !interaction.guildId || !client.user || !interaction.guild) return;

              if (!(interaction.member as GuildMember).permissions.has("ManageGuild")) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Error Watch - Animelist")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guildId).error
                          } You need the \`Manage Channels\` permission to start watching announcements.`,
                          `**Channel:** ${channel.toString()}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              const anilistId = await client.animelist.getMediaId(value as string);
              if (!anilistId) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Anime not found")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guildId).error
                          } We couldn't find that anime! Please check your input and try again`,
                          `**Input:** ${value}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              if (channel.type === ChannelType.GuildVoice) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Invalid channel")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guildId).error
                          } Announcements cannot be made in voice channels.`,
                          `Please select a text channel.`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              const existing = await manager.prisma.watchConfig.findFirst({
                where: {
                  AND: [{ anilistId }, { channelId: channel.id }],
                },
              });
              if (existing) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Already watching")
                      .setDescription(
                        [
                          `${
                            client.getEmoji(interaction.guildId).error
                          } That show is already being announced in ${channel.toString()}`,
                          `**Anime:** [${existing.anilistId}](https://anilist.co/anime/${existing.anilistId})`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              const serverConfig = await getServerConfig(manager.prisma, interaction.guildId);
              const media = (
                await client.animelist.query(
                  "query($id: Int!) { Media(id: $id) { id status title { native romaji english } } }",
                  {
                    id: anilistId,
                  }
                )
              ).data.Media;
              if (!["NOT_YET_RELEASED", "RELEASING"].includes(media.status)) {
                interaction.reply({
                  flags: MessageFlags.Ephemeral,
                  embeds: [
                    new ErrorEmbed(interaction.guildId)
                      .setTitle("Invalid anime")
                      .setDescription(
                        [
                          `${client.getEmoji(interaction.guildId).error} ${client.animelist.getTitle(
                            media.title,
                            serverConfig.titleFormat as TitleFormat
                          )} is not an upcoming or currently airing anime.`,
                          `**Status:** ${media.status}`,
                        ].join("\n")
                      ),
                  ],
                });
                return false;
              }

              await manager.prisma.watchConfig.create({
                data: {
                  anilistId,
                  channelId: channel.id,
                  pingRole: role ? role.id : null,
                  createThreads,
                  threadArchiveTime,
                },
              });

              await scheduleAnnouncements([anilistId], manager.prisma);
              interaction.reply({
                embeds: [
                  new Embed()
                    .setTitle("Watching")
                    .setDescription(
                      [
                        `${client.getEmoji(interaction.guildId).correct} Announcements will now be made for [${client.animelist.getTitle(media.title, serverConfig.titleFormat as TitleFormat)}](https://anilist.co/anime/${media.id}) in ${channel.toString()}.`,
                        role ? `**Role:** ${role.toString()}` : "",
                        `**Threads:** ${createThreads ? "Enabled" : "Disabled"}`,
                        `**Thread Archive Time:** ${threadArchiveTime}`,
                      ].join("\n")
                    ),
                ],
              });
            }
            break;
        }
      }
      break;
  }
}
