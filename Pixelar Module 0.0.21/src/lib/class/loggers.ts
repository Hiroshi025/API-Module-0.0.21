/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-unsafe-optional-chaining */
import { stripIndent } from "common-tags";
import {
	APIEmbed, ChannelType, codeBlock, ColorResolvable, EmbedBuilder, Events, GuildBasedChannel,
	GuildChannel, JSONEncodable, roleMention, TextChannel, userMention, VoiceBasedChannel,
	VoiceState
} from "discord.js";
import moment from "moment";

import { client, manager } from "@/index";
import emojis from "@config/json/emojis.json";
import { ClientError } from "@lib/extenders/error.extend";
import { BotClient } from "@modules/discord/class/client";

/**
 * The class `DiscordLogger` is a class that allows you to log events in the Discord.js library.
 * is a class that allows you to log events in the Discord.js library.
 */

const EVENT_COLORS: Record<string, string> = {
  JOIN: "Blurple",
  LEAVE: "Blurple",
  UPDATE: "Blurple",
};

const EVENT_TITLES: Record<string, string> = {
  JOIN: "Log System - Joined Voice Channel",
  LEAVE: "Log System - Left Voice Channel",
  UPDATE: "Log System - Voice Channel Update",
};

const sendLogMessage = (channel: GuildBasedChannel, embed: APIEmbed | JSONEncodable<APIEmbed>) => {
  if (channel instanceof TextChannel) {
    channel.send({ embeds: [embed] });
  }
};

const generateVoiceStateMessage = (state: VoiceState, channel: VoiceBasedChannel, action: string) => {
  const embed = new EmbedBuilder()
    .setColor(EVENT_COLORS[action] as ColorResolvable)
    .setTitle(EVENT_TITLES[action])
    .setThumbnail(client.user?.displayAvatarURL({ forceStatic: true }) as string)
    .setFooter({
      text: `Logs Voice ID: ${channel.id}`,
      iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
    })
    .setTimestamp();

  switch (action) {
    case "JOIN":
      embed.addFields(
        { name: "User Joined", value: `${state.member} (\`${state.member?.id}\`)`, inline: false },
        { name: "Channel Joined", value: `${state.channel} (\`${channel.id}\`)`, inline: false },
        {
          name: "Voice Status",
          value: [
            `**Deaf:** ${state.deaf ? emojis.correct : emojis.error}`,
            `**Self Deaf:** ${state.selfDeaf ? emojis.correct : emojis.error}`,
            `**Streaming:** ${state.streaming ? emojis.correct : emojis.error}`,
            `**Server Mute:** ${state.serverMute ? emojis.correct : emojis.error}`,
          ].join("\n"),
          inline: false,
        }
      );
      break;

    case "LEAVE":
      embed.addFields(
        { name: "User Left", value: `${state.member} (\`${state.member?.id}\`)`, inline: false },
        { name: "Channel Left", value: `${state.channel} (\`${channel.id}\`)`, inline: false },
        {
          name: "Day Left",
          value: `${moment().format("dddd")} - ${moment().format("LL")}`,
          inline: false,
        }
      );
      break;

    case "UPDATE":
      embed.addFields(
        { name: "Old State", value: `${state.channel}\n(\`${state.channel?.id}\`)`, inline: true },
        { name: "New State", value: `${channel}\n(\`${channel.id}\`)`, inline: true },
        {
          name: "Day",
          value: `${moment().format("dddd")} - ${moment().format("LL")}`,
          inline: false,
        },
        {
          name: "Channel Link",
          value: `[Click Here](https://discord.com/channels/${state.guild.id}/${channel.id})`,
          inline: true,
        },
        { name: "User", value: `${state.member}\n(\`${state.member?.id}\`)`, inline: true }
      );
      break;

    default:
      break;
  }

  return embed;
};

/**
 * @name DiscordLogger
 * @description the `DiscordLogger` class event logs discord bot
 * @author MikaboshiDevs
 * @version 0.0.2
 * 
 * @alias Logger
 * @class
 */
export class DiscordLogger {
  private events: Array<keyof typeof Events>;
  private client: BotClient;
  /**
   * The constructor function takes an array of event types and a BotCore client as parameters.
   * @param events - The `events` parameter is an array containing keys of the `Events` type.
   * @param {BotCore} client - The `client` parameter in the constructor is an instance of the `BotCore`
   * class. It is likely used to interact with the bot core functionalities and services within the class
   * where this constructor is defined.
   */
  constructor(events: Array<keyof typeof Events>, client: BotClient) {
    this.events = events;
    this.client = client;
  }

  /**
   * The function initializes event listeners for various actions and logs the corresponding information
   * in a structured format.
   */
  public init(): any {
    if (this.events.length === 0) throw new ClientError("No events provided.");
    for (const event of this.events) {
      switch (event) {
        case "AutoModerationActionExecution":
          {
            this.client.on(Events.AutoModerationActionExecution, async (action) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "AutoModeration Action - Log System",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setFields(
                  {
                    name: "AutoModeration Action - Information",
                    value: stripIndent`
                      > **Type Rule:** ${action.ruleTriggerType}
                      > **Rule ID:** ${action.ruleId}
                      > **User:** ${action.user?.tag} (${action.user?.id})
                      > **User ID:** ${action.userId}
                    `,
                    inline: false,
                  },
                  {
                    name: "AutoModeration Action - Message",
                    value: stripIndent`
                      > **Message:** ${action.matchedContent}
                      > **Channel:** ${action.channel?.name} (${action.channel?.id})
                      > **Link:** [Click here](https://discord.com/channels/${action.guild.id}/${action.channel?.id}/${action.messageId})
                    `,
                    inline: false,
                  },
                  {
                    name: "AutoModeration Action - Guild",
                    value: stripIndent`
                      > **Guild:** ${action.guild.name} (${action.guild.id})
                      > **Owner:** ${userMention(action.guild.ownerId)} (${action.guild.ownerId})
                    `,
                    inline: false,
                  },
                  {
                    name: "AutoModeration Action - Date",
                    value: stripIndent`
                      > **Date:** ${new Date().toLocaleString()}
                      > **Timezone:** ${Intl.DateTimeFormat().resolvedOptions().timeZone}
                      > **Timestamp:** ${Date.now()}
                      > **Action ID:** ${action.alertSystemMessageId}
                    `,
                    inline: false,
                  },
                  {
                    name: "AutoModeration Action - Content",
                    value: stripIndent`
                      > **Content:** 
                       ${codeBlock("js", action.content)}
                    `,
                    inline: false,
                  }
                );

              const channel = await LogsChannel(action.guild.id, this.client);
              if (!channel) return;
              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "MessageUpdate":
          {
            this.client.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
              if (!oldMessage.guild || !newMessage.guild || !oldMessage.channel || !newMessage.channel)
                return;
              if (oldMessage.author?.bot || newMessage.author?.bot) return;
              if (oldMessage.content === newMessage.content) return;

              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Message Update - Logs Systems",
                  iconURL: newMessage.author?.displayAvatarURL({
                    forceStatic: true,
                  }),
                })
                .setFooter({
                  text: `Author: ${newMessage.author?.tag} | Id: ${newMessage.author?.id}`,
                  iconURL: newMessage.author?.displayAvatarURL({
                    forceStatic: true,
                  }),
                })
                .addFields(
                  {
                    name: "Author - Information",
                    value: stripIndent`
                      > **Username:** ${newMessage.author?.username}
                      > **Tag:** ${newMessage.author?.tag}
                      > **Id:** ${newMessage.author?.id}
                      > **Joined At:** ${newMessage.author?.createdAt.toLocaleString()}
                    `,
                    inline: true,
                  },
                  {
                    name: "Message - Information",
                    value: stripIndent`
                      > **Channel:** ${newMessage.channel}
                      > **Message Link:** [Click Here](${newMessage.url})
                      > **Date:** ${newMessage.createdAt.toLocaleString()}
                      > **Event:** messageUpdate
                    `,
                    inline: true,
                  },
                  {
                    name: "Content - Original",
                    value: `\`\`\`\n${
                      // limitar el contenido a 1024 caracteres
                      oldMessage.content
                        ? oldMessage.content.slice(0, 1024).replace(/`/g, "'")
                        : "UNKNOWN CONTENT"
                    }\n\`\`\``,
                    inline: false,
                  },
                  {
                    name: "Content - New",
                    value: `\`\`\`\n${newMessage.content ? newMessage.content.slice(0, 1024).replace(/`/g, "'") : "UNKNOWN CONTENT"}\n\`\`\``,
                    inline: false,
                  },
                  {
                    name: "Attachments - URL(s)",
                    value: `>>> ${
                      [...newMessage.attachments?.values()].map((x) => x.proxyURL).join("\n\n")
                        ? [...newMessage.attachments?.values()].map((x) => x.proxyURL).join("\n\n")
                        : `${emojis.error} No Attachments`
                    }`,
                    inline: false,
                  }
                );

              const channel = await LogsChannel(newMessage.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "AutoModerationRuleCreate":
          {
            this.client.on(Events.AutoModerationRuleCreate, async (rule) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "AutoModeration Create - Log System",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setFields(
                  {
                    name: "AutoModeration Rule - Information",
                    value: stripIndent`
                      > **Name:** ${rule.name}
                      > **ID:** ${rule.id}
                      > **Type Rule:** ${rule.eventType}
                      > **Action:** ${rule.actions.join(", ")}
                      > **Enabled:** ${rule.enabled ? emojis.correct : emojis.error}
                      __**Channels and Roles Exceptions**__\n
                      > **Channels:** ${rule.exemptChannels.map((channel) => `<#${channel}>`).join(", ") || "None"}
                      > **Roles:** ${rule.exemptRoles.map((role) => `<@&${role}>`).join(", ") || "None"}
                    `,
                    inline: false,
                  },
                  {
                    name: "Author - Information",
                    value: stripIndent`
                      > **Name:** ${rule.guild.members.cache.get(rule.creatorId)?.user.username}
                      > **ID:** ${rule.creatorId}
                      > **Permissions:** ${rule.guild.members.cache.get(rule.creatorId)?.permissions.toArray().join(", ") || "None"}
                      > **Roles:** ${
                        rule.guild.members.cache
                          .get(rule.creatorId)
                          ?.roles.cache.map((role) => `<@&${role.id}>`)
                          .join(", ") || "None"
                      }
                    `,
                    inline: false,
                  }
                );

              const channel = await LogsChannel(rule.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "GuildMemberRemove":
          {
            this.client.on(Events.GuildMemberRemove, async (member) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Member Leave - Log Systems",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setFooter({
                  text: `Events - Member Leave | Asistent Logs`,
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setThumbnail(member.user.displayAvatarURL({ forceStatic: true }) as string)
                .setTimestamp()
                .addFields({
                  name: "Member - Information",
                  value: stripIndent`
                    > **Username:** ${member.user.username}
                    > **ID:** ${member.id}
                    > **Joined At:** <t:${Math.floor(member.joinedTimestamp ? member.joinedTimestamp / 1000 : Date.now() / 1000)}:R>
                    > **Created At:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>
                    > **Left At:** <t:${Math.floor(Date.now() / 1000)}:R>
                    > **Time Spent:** ${Math.floor((Date.now() - (member.joinedTimestamp ? member.joinedTimestamp : Date.now())) / 1000 / 60 / 60 / 24)} days
                    > **Avatar:** [Click Here](${member.user.displayAvatarURL({ forceStatic: true, extension: "png" })})
                    > **Administrator:** ${member.permissions.has("Administrator") ? emojis.correct : emojis.error}
                  `,
                  inline: false,
                });

              const channel = await LogsChannel(member.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "GuildMemberAdd":
          {
            this.client.on(Events.GuildMemberAdd, async (member) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: `Member Joined | ${member.user.tag}`,
                  iconURL: member.user.displayAvatarURL({ forceStatic: true }) || undefined,
                })
                .addFields(
                  {
                    name: "Guild Join - Info",
                    value: stripIndent`
                      > **Members:** ${member.guild.memberCount}
                      > **Added By:** ${member.user.bot ? "Bot" : "User"}
                      > **Owner:** ${member.guild.ownerId === member.user.id ? "Yes" : "No"}
                      > **Inviter:** ${member.guild.ownerId === member.user.id ? "N/A" : "Unknown"}
                      > **Date Join:** <t:${Math.floor(member.joinedTimestamp! / 1000)}:R>
                `,
                    inline: true,
                  },
                  {
                    name: "Member - Info",
                    value: stripIndent`
                      > **Created At:** <t:${Math.floor(member.user.createdTimestamp / 1000)}:R>
                      > **Joined At:** <t:${Math.floor(member.joinedTimestamp! / 1000)}:R>
                      > **ID:** ${member.user.id}
                      > **Tag:** ${member.user.tag}
                      > **Roles:** ${member.roles.cache.size} roles
                `,
                  }
                )
                .setThumbnail(member.user.displayAvatarURL({ forceStatic: true }))
                .setFooter({
                  text: `ID: ${member.user.id}`,
                  iconURL: member.user.displayAvatarURL({ forceStatic: true }) || undefined,
                })
                .setColor("Random")
                .setTimestamp();

              const channel = await LogsChannel(member.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "ChannelDelete":
          {
            this.client.on(Events.ChannelDelete, async (_channel) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Channel Delete - Log Systems",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .addFields(
                  {
                    name: "Channel - Information",
                    value: stripIndent`
                      > **Name:** ${(_channel as GuildChannel).name}
                      > **Type:** ${_channel.type}
                      > **ID:** ${_channel.id}
               `,
                    inline: true,
                  },
                  {
                    name: "Channel - Permissions",
                    value: stripIndent`
                      > **Viewable:** ${(_channel as GuildChannel).viewable ? emojis.correct : emojis.error}
                      > **Manageable:** ${(_channel as GuildChannel).manageable ? emojis.correct : emojis.error}
                      > **Permissions Locked:** ${(_channel as GuildChannel).permissionsLocked ? emojis.correct : emojis.error}
                      > **NSFW:** ${(_channel as TextChannel).nsfw ? emojis.correct : emojis.error}
               `,
                  }
                )
                .setFooter({
                  text: `Events - Channel Delete | Asistent Logs`,
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setTimestamp();

              if (_channel.type === ChannelType.DM) return;
              const channel = await LogsChannel(_channel.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "ChannelCreate":
          {
            this.client.on(Events.ChannelCreate, async (_channel) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Channel Create - Log Systems",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .addFields(
                  {
                    name: "Channel - Information",
                    value: stripIndent`
                  > **Name:** ${_channel.name}
                  > **Type:** ${_channel.type}
                  > **ID:** ${_channel.id}
                  > **Created At:** <t:${Math.floor(_channel.createdTimestamp / 1000)}:R>
               `,
                    inline: true,
                  },
                  {
                    name: "Channel - Permissions",
                    value: stripIndent`
                  > **Viewable:** ${_channel.viewable ? emojis.correct : emojis.error}
                  > **Manageable:** ${_channel.manageable ? emojis.correct : emojis.error}
                  > **Permissions Locked:** ${_channel.permissionsLocked ? emojis.correct : emojis.error}
                  > **NSFW:** ${(_channel as TextChannel).nsfw ? emojis.correct : emojis.error}
               `,
                  }
                )
                .setFooter({
                  text: `Events - Channel Create | Asistent Logs`,
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setTimestamp();

              const channel = await LogsChannel(_channel.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "GuildEmojiCreate":
          {
            this.client.on(Events.GuildEmojiCreate, async (emoji) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Emoji Create - Log Systems",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .addFields(
                  {
                    name: "Emoji - Information",
                    value: stripIndent`
                  > **Name:** ${emoji.name}
                  > **ID:** ${emoji.id}
                  > **Created At:** <t:${Math.floor(emoji.createdTimestamp / 1000)}:R>
                  > **Identifier:** ${emoji.identifier}
               `,
                    inline: true,
                  },
                  {
                    name: "Emoji - Permissions",
                    value: stripIndent`
                  > **Animated:** ${emoji.animated ? emojis.correct : emojis.error}
                  > **Managed:** ${emoji.managed ? emojis.correct : emojis.error}
                  > **Requires Colons:** ${emoji.requiresColons ? emojis.correct : emojis.error}
                  > **URL:** [Click Here](${emoji.imageURL({ extension: "png" })})
               `,
                  }
                )
                .setFooter({
                  text: `Events - Emoji Create | Asistent Logs`,
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setTimestamp();

              const channel = await LogsChannel(emoji.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "GuildRoleCreate":
          {
            this.client.on(Events.GuildRoleCreate, async (role) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Role Create - Log Systems",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .addFields(
                  {
                    name: "Role - Information",
                    value: stripIndent`
                  > **Name:** ${role.name}
                  > **ID:** ${role.id}
                  > **Created At:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>
                  > **Position:** ${role.position} / ${role.guild.roles.cache.size}
               `,
                    inline: true,
                  },
                  {
                    name: "Role - Permissions",
                    value: stripIndent`
                  > **Managed:** ${role.managed ? emojis.correct : emojis.error}
                  > **Mentionable:** ${role.mentionable ? emojis.correct : emojis.error}
                  > **Hoisted:** ${role.hoist ? emojis.correct : emojis.error}
                  > **Hex Color:** ${role.hexColor}
               `,
                  }
                )
                .setFooter({
                  text: `Event - roleCreate | Asistent Logs`,
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setTimestamp();

              const channel = await LogsChannel(role.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "GuildRoleDelete":
          {
            this.client.on(Events.GuildRoleDelete, async (role) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Role Delete - Log Systems",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .addFields(
                  {
                    name: "Role - Information",
                    value: stripIndent`
                  > **Name:** ${role.name}
                  > **ID:** ${role.id}
                  > **Created At:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>
               `,
                    inline: true,
                  },
                  {
                    name: "Member - Executable",
                    value: stripIndent`
                  > **Members:** ${role.members.size}
                  > **Position:** ${role.position}
                  > **Color:** ${role.hexColor}
               `,
                  }
                )
                .setFooter({
                  text: `Event roleDelete | Asistent Logs`,
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setTimestamp();

              const channel = await LogsChannel(role.guild.id, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "GuildRoleUpdate":
          {
            this.client.on(Events.GuildRoleUpdate, async (oldRole, newRole) => {
              if (newRole.color !== oldRole.color) {
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: "Role Update - Log System",
                    iconURL: newRole.guild.iconURL() as string,
                  })
                  .setDescription(
                    `${emojis.correct} The color of the role **${newRole.name}** has been updated`
                  )
                  .setFields(
                    {
                      name: "**__Information About The Role__**",
                      value: stripIndent`
                    > **Role ID:** ${roleMention(newRole.id as string)} ${newRole.id}
                    > **Role New Color:** ${newRole.hexColor}
                    > **Role Old Color:** ${oldRole.hexColor}
                    `,
                      inline: false,
                    },
                    {
                      name: "**__Information About The Guild__**",
                      value: stripIndent`
                    > **Guild Name:** ${newRole.guild.name}
                    > **Guild ID:** ${newRole.guild.id}
                    > **Guild Owner:** ${userMention(newRole.guild.ownerId)}
                    `,
                      inline: false,
                    }
                  )
                  .setFooter({
                    text: `Event Role Update - Asistent Logs`,
                    iconURL: newRole.guild.iconURL() as string,
                  });

                const channel = await LogsChannel(newRole.guild.id, this.client);
                if (!channel) return;

                (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
              }

              if (newRole.permissions.bitfield > oldRole.permissions.bitfield) {
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: "Role Update - Log System",
                    iconURL: newRole.guild.iconURL() as string,
                  })
                  .setDescription(
                    `${emojis.correct} The role **${newRole.name}** has been removed permissions`
                  )
                  .setFields(
                    {
                      name: "**__Information About The Role__**",
                      value: stripIndent`
                    > **Role ID:** ${roleMention(newRole.id as string)} ${newRole.id}
                    > **Role Position:** ${newRole.position}
                    `,
                      inline: false,
                    },
                    {
                      name: "**__Information About The Guild__**",
                      value: stripIndent`
                    > **Guild Name:** ${newRole.guild.name}
                    > **Guild ID:** ${newRole.guild.id}
                    `,
                      inline: false,
                    },
                    {
                      name: "**__Permissions Removed__**",
                      value: newRole.permissions
                        .toArray()
                        .map((perm, index) => `> \`No.${index + 1}\` - ${perm}`)
                        .join("\n"),
                      inline: false,
                    }
                  )
                  .setFooter({
                    text: `Event Role Update - Asistent Logs`,
                    iconURL: newRole.guild.iconURL() as string,
                  });

                const channel = await LogsChannel(newRole.guild.id, this.client);
                if (!channel) return;

                (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
              }

              if (newRole.permissions.bitfield < oldRole.permissions.bitfield) {
                const embed = new EmbedBuilder()
                  .setAuthor({
                    name: "Role Update - Log System",
                    iconURL: newRole.guild.iconURL() as string,
                  })
                  .setDescription(`${emojis.error} The role **${newRole.name}** has been added permissions`)
                  .setFields(
                    {
                      name: "**__Information About The Role__**",
                      value: stripIndent`
                    > **Role ID:** ${roleMention(newRole.id as string)} ${newRole.id}
                    > **Role Position:** ${newRole.position}
                    `,
                      inline: false,
                    },
                    {
                      name: "**__Information About The Guild__**",
                      value: stripIndent`
                    > **Guild Name:** ${newRole.guild.name}
                    > **Guild ID:** ${newRole.guild.id}
                    `,
                      inline: false,
                    },
                    {
                      name: "**__Permissions Added__**",
                      value: oldRole.permissions
                        .toArray()
                        .map((perm, index) => `> \`No.${index + 1}\` - ${perm}`)
                        .join("\n"),
                      inline: false,
                    }
                  )
                  .setFooter({
                    text: `Event Role Update - Asistent Logs`,
                    iconURL: newRole.guild.iconURL() as string,
                  });

                const channel = await LogsChannel(newRole.guild.id, this.client);
                if (!channel) return;

                (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
              }
            });
          }
          break;
        case "InviteCreate":
          {
            this.client.on(Events.InviteCreate, async (invite) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Invite Create - Manager Logs",
                  iconURL: invite.guild?.iconURL({
                    forceStatic: true,
                  }) as string,
                })
                .addFields(
                  {
                    name: "General - Information",
                    value: stripIndent`
					      > **Creator:** ${invite.inviter?.tag} (\`${invite.inviter?.id}\`)
					      > **Channel:** ${invite.channel?.toString()} (\`${invite.channel?.id}\`)
					      > **Code:** ${invite.code}
				        `,
                    inline: true,
                  },
                  {
                    name: "Invite - Information",
                    value: stripIndent`
					      > **URL:** [Click Here](${invite.url})
					      > **Created At:** ${typeof invite.createdAt === "number" ? `<t:${Math.floor(Number(invite.createdAt) / 1000)}:R>` : "Unknown"}
					      > **Expires At:** ${typeof invite.expiresAt === "number" ? `<t:${Math.floor(Number(invite.expiresAt) / 1000)}:R>` : "Unknown"}
                `,
                  }
                );

              const channel = await LogsChannel(invite.guild?.id as string, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "CacheSweep":
          {
            this.client.on(Events.CacheSweep, async (info) => {
              const embed = new EmbedBuilder()
                .setAuthor({
                  name: "Cache Sweep - Log Systems",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setFooter({
                  text: "Event - Cache Sweep | Asistent Logs",
                  iconURL: this.client.user?.displayAvatarURL({
                    forceStatic: true,
                  }) as string,
                })
                .setDescription(
                  stripIndent`
                ${emojis.correct} The cache has been sweeped successfully.
                > **Collected:** ${info}
              `
                )
                .setTimestamp();

              const channel = await LogsChannel(this.client.user?.id as string, this.client);
              if (!channel) return;

              (channel as TextChannel).send({ embeds: [embed] }).catch(() => {});
            });
          }
          break;
        case "VoiceStateUpdate":
          {
            this.client.on(Events.VoiceStateUpdate, async (oldState, newState) => {
              const channel = await LogsChannel(oldState.guild.id, this.client);
              if (!channel) return;

              const oldChannel = oldState.channel;
              const newChannel = newState.channel;

              if (oldChannel === null && newChannel !== null) {
                const message = generateVoiceStateMessage(newState, newChannel, "JOIN");
                sendLogMessage(channel, message);
              }

              if (newChannel === null && oldChannel !== null) {
                const message = generateVoiceStateMessage(oldState, oldChannel, "LEAVE");
                sendLogMessage(channel, message);
              }

              if (oldChannel !== null && newChannel !== null && oldChannel.id !== newChannel.id) {
                const message = generateVoiceStateMessage(newState, newChannel, "UPDATE");
                sendLogMessage(channel, message);
              }
            });
          }
          break;
      }
    }
  }
}

/**
 * The function `LogsChannel` asynchronously logs the channel in TypeScript.
 */
async function LogsChannel(guildId: string, client: BotClient) {
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
