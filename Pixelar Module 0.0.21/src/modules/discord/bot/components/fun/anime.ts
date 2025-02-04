/* eslint-disable @typescript-eslint/no-explicit-any */
import { stripIndent } from "common-tags";
import { ChannelType, EmbedBuilder } from "discord.js";
import { Anime, Manga } from "eternal-support";

import emojis from "@config/json/emojis.json";
import { Precommand } from "@typings/modules/component";

const AnimeCommand: Precommand = {
  name: "anime",
  description: "Search anime list by name on MyAnimeList",
  aliases: ["search-anime-list"],
  category: "fun",
  nsfw: false,
  owner: false,
  cooldown: 5,
  botpermissions: ["SendMessages"],
  subcommands: [
    "anime anime random: Get a random anime from MyAnimeList",
    "anime anime search <uuid>: Search anime list by name on MyAnimeList",
    "anime manga search <uuid>: Search manga list by name on MyAnimeList",
    "anime manga random: Get a random manga from MyAnimeList",
  ],
  examples: [
    "anime anime random",
    "anime anime search 1131-2958-3018-3750",
    "anime anime image 'image'",
    "anime manga search 1023-2846-0194-5910",
    "anime manga random",
  ],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const subcommand = args[0];
    switch (subcommand) {
      case "anime":
        {
          const choice = args[1];
          switch (choice) {
            case "random":
              {
                const response: any = await Anime.random();
                if (!response)
                  return message.channel.send({
                    embeds: [
                      client.embed({
                        description: [
                          `${emojis.error} | An error occurred while trying to get the data, try again later.`,
                          `please the contact support server`,
                        ].join("\n"),
                        color: "Red",
                      }),
                    ],
                  });

                const data = response.data.data;
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: data.title ? data.title : data.title_japanese,
                    iconURL: data.images.jpg.image_url
                      ? data.images.jpg.image_url
                      : data.images.webp.image_url,
                  })
                  .setDescription(data.synopsis ? data.synopsis : "No description available.")
                  .setURL(data.url)
                  .setThumbnail(
                    data.images.jpg.image_url ? data.images.jpg.image_url : data.images.webp.image_url
                  )
                  .addFields(
                    {
                      name: "Information - Anime",
                      value: stripIndent`
                              > **ID:** ${data.mal_id}
                              > **Title:** ${data.title ? data.title : data.title_japanese}
                              > **Status:** ${data.status}
                              > **Episodes:** ${data.episodes}
                              > **Duration:** ${data.duration}
                           `,
                      inline: true,
                    },
                    {
                      name: "Information - MoreInfo",
                      value: stripIndent`
                              > **Title Japanese:** ${data.title_japanese}
                              > **Year:** ${data.year ? data.year : "Unknown"}
                              > **Popularity:** ${data.popularity}
                              > **Rank:** ${data.rank} 
                              > **Rating:** ${data.rating}
                              `,
                      inline: true,
                    },
                    {
                      name: "Information - Genres",
                      value: data.genres.map((g: any) => `[${g.name}](${g.url}) - ${g.mal_id}`).join("\n"),
                      inline: false,
                    }
                  );

                message.channel.send({ embeds: [embed] });
              }
              break;
            case "search":
              {
                const id = args[2];
                if (!id)
                  return message.channel.send({
                    embeds: [
                      client.embed({
                        description: [
                          `${emojis.error} | You need to provide an ID to search for.`,
                          `**Usage:** \`${prefix}animelist anime search <id>\``,
                        ].join("\n"),
                        color: "Red",
                      }),
                    ],
                  });

                const response: any = await Anime.search(id as any);

                if (!response)
                  return message.channel.send({
                    embeds: [
                      client.embed({
                        description: [
                          `${emojis.error} | An error occurred while trying to get the data, try again later.`,
                          `please the contact support server`,
                        ].join("\n"),
                        color: "Red",
                      }),
                    ],
                  });

                const data = response.data.data;
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: data.title ? data.title : data.title_japanese,
                    iconURL: data.images.jpg.image_url
                      ? data.images.jpg.image_url
                      : data.images.webp.image_url,
                  })
                  .setDescription(data.synopsis ? data.synopsis : "No description available.")
                  .setURL(data.url)
                  .setThumbnail(
                    data.images.jpg.image_url ? data.images.jpg.image_url : data.images.webp.image_url
                  )
                  .addFields(
                    {
                      name: "Information - Anime",
                      value: stripIndent`
                              > **ID:** ${data.mal_id}
                              > **Title:** ${data.title ? data.title : data.title_japanese}
                              > **Status:** ${data.status}
                              > **Episodes:** ${data.episodes}
                              > **Duration:** ${data.duration}
                           `,
                      inline: true,
                    },
                    {
                      name: "Information - MoreInfo",
                      value: stripIndent`
                              > **Title Japanese:** ${data.title_japanese}
                              > **Year:** ${data.year ? data.year : "Unknown"}
                              > **Popularity:** ${data.popularity}
                              > **Rank:** ${data.rank} 
                              > **Rating:** ${data.rating}
                              `,
                      inline: true,
                    },
                    {
                      name: "Information - Genres",
                      value: data.genres.map((g: any) => `[${g.name}](${g.url}) - ${g.mal_id}`).join("\n"),
                      inline: false,
                    }
                  );

                message.channel.send({ embeds: [embed] });
              }
              break;
            default:
              {
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: "AnimeList - Help",
                    iconURL: message.author.avatarURL({ forceStatic: true })!,
                  })
                  .setDescription(
                    [
                      `${emojis.error} | You need to provide a subcommand to use this command.`,
                      `**Subcommands:**`,
                      `> \`random\`: Get a random anime from MyAnimeList`,
                      `> \`search\`: Search anime list by name on MyAnimeList`,
                    ].join("\n")
                  )
                  .setColor("Random");

                message.channel.send({ embeds: [embed] });
              }
              break;
          }
        }
        break;
      case "manga":
        {
          const choice = args[1];
          switch (choice) {
            case "search":
              {
                const id = args[2];
                if (!id)
                  return message.channel.send({
                    embeds: [
                      client.embed({
                        description: [
                          `${emojis.error} | You need to provide an ID to search for.`,
                          `**Usage:** \`${prefix}animelist manga search <id>\``,
                        ].join("\n"),
                        color: "Red",
                      }),
                    ],
                  });

                const response: any = await Manga.search(id as any);

                if (!response)
                  return message.channel.send({
                    embeds: [
                      client.embed({
                        description: [
                          `${emojis.error} | An error occurred while trying to get the data, try again later.`,
                          `please the contact support server`,
                        ].join("\n"),
                        color: "Red",
                      }),
                    ],
                  });

                const data = response.data.data;
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: data.title ? data.title : data.title_japanese,
                    iconURL: data.images.jpg.image_url
                      ? data.images.jpg.image_url
                      : data.images.webp.image_url,
                  })
                  .setDescription(data.synopsis ? data.synopsis : "No description available.")
                  .setURL(data.url)
                  .setFields(
                    {
                      name: "Information - Background",
                      value: data.background ? data.background : "No background available.",
                      inline: false,
                    },
                    {
                      name: "Information - Manga",
                      value: stripIndent`
                                    > **ID:** ${data.mal_id}
                                    > **Title:** ${data.title ? data.title : data.title_japanese}
                                    > **Status:** ${data.status}
                                    > **Volumes:** ${data.volumes}
                                    > **Chapters:** ${data.chapters}
                                 `,
                      inline: true,
                    },
                    {
                      name: "Information - MoreInfo",
                      value: stripIndent`
                                    > **Title Japanese:** ${data.title_japanese}
                                    > **Publisher:** ${data.published.from ? data.published.from : "Unknown"}
                                    > **Popularity:** ${data.popularity}
                                    > **Rank:** ${data.rank ? data.rank : "Unknown"}
                                    > **Favorites:** ${data.favorites}
                                 `,
                      inline: true,
                    },
                    {
                      name: "Information - Authors",
                      value: data.authors.map((a: any) => `[${a.name}](${a.url}) - ${a.mal_id}`).join("\n"),
                      inline: false,
                    },
                    {
                      name: "Information - Genres",
                      value: data.genres.map((g: any) => `[${g.name}](${g.url}) - ${g.mal_id}`).join("\n"),
                      inline: false,
                    }
                  )
                  .setThumbnail(
                    data.images.jpg.image_url ? data.images.jpg.image_url : data.images.webp.image_url
                  );

                message.channel.send({ embeds: [embed] });
              }
              break;
            case "random":
              {
                const response: any = await Manga.random();
                if (!response)
                  return message.channel.send({
                    embeds: [
                      client.embed({
                        description: [
                          `${emojis.error} | An error occurred while trying to get the data, try again later.`,
                          `please the contact support server`,
                        ].join("\n"),
                        color: "Red",
                      }),
                    ],
                  });

                const data = response.data.data;
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: data.title ? data.title : data.title_japanese,
                    iconURL: data.images.jpg.image_url
                      ? data.images.jpg.image_url
                      : data.images.webp.image_url,
                  })
                  .setDescription(data.synopsis ? data.synopsis : "No description available.")
                  .setURL(data.url)
                  .setFields(
                    {
                      name: "Information - Background",
                      value: data.background ? data.background : "No background available.",
                      inline: false,
                    },
                    {
                      name: "Information - Manga",
                      value: stripIndent`
                                    > **ID:** ${data.mal_id}
                                    > **Title:** ${data.title ? data.title : data.title_japanese}
                                    > **Status:** ${data.status}
                                    > **Volumes:** ${data.volumes}
                                    > **Chapters:** ${data.chapters}
                                 `,
                      inline: true,
                    },
                    {
                      name: "Information - MoreInfo",
                      value: stripIndent`
                                    > **Title Japanese:** ${data.title_japanese}
                                    > **Publisher:** ${data.published.from ? data.published.from : "Unknown"}
                                    > **Popularity:** ${data.popularity}
                                    > **Rank:** ${data.rank ? data.rank : "Unknown"}
                                    > **Favorites:** ${data.favorites}
                                 `,
                      inline: true,
                    },
                    {
                      name: "Information - Authors",
                      value: data.authors.map((a: any) => `[${a.name}](${a.url}) - ${a.mal_id}`).join("\n"),
                      inline: false,
                    },
                    {
                      name: "Information - Genres",
                      value: data.genres.map((g: any) => `[${g.name}](${g.url}) - ${g.mal_id}`).join("\n"),
                      inline: false,
                    }
                  )
                  .setThumbnail(
                    data.images.jpg.image_url ? data.images.jpg.image_url : data.images.webp.image_url
                  );

                message.channel.send({ embeds: [embed] });
              }
              break;
          }
        }
        break;
      default:
        {
          const embed = new EmbedBuilder()
            .setAuthor({
              name: "AnimeList - Help",
              iconURL: message.author.avatarURL({ forceStatic: true })!,
            })
            .setDescription(
              [
                `${emojis.error} | You need to provide a subcommand to use this command.`,
                `**Subcommands:**`,
                `> \`anime\`: Search anime list by name on MyAnimeList`,
                `> \`manga\`: Search manga list by name on MyAnimeList`,
              ].join("\n")
            )
            .setColor("Random");

          message.channel.send({ embeds: [embed] });
        }
        break;
    }
  },
};

export = AnimeCommand;
