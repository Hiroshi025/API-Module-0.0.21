import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder, Guild, MessageFlags,
	PermissionFlagsBits, StringSelectMenuBuilder
} from "discord.js";

import { manager } from "@/index";
import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("tickets")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDescription("🎫 Set the ticket system inside the server")
    .setDescriptionLocalizations({
      "es-ES": "🎫 Establece el sistema de tickets dentro del servidor",
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("delete")
        .setNameLocalizations({
          "es-ES": "eliminar",
        })
        .setDescription("🎫 Delete the ticket system")
        .setDescriptionLocalizations({
          "es-ES": "🎫 Elimina el sistema de tickets",
        })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("view")
        .setNameLocalizations({
          "es-ES": "ver",
        })
        .setDescription("🎫 View the ticket system")
        .setDescriptionLocalizations({
          "es-ES": "🎫 Mira el sistema de tickets",
        })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("create")
        .setNameLocalizations({
          "es-ES": "crear",
        })
        .setDescription("🎫 Create the ticket system")
        .setDescriptionLocalizations({
          "es-ES": "🎫 Crea el sistema de tickets",
        })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("tools")
        .setNameLocalizations({
          "es-ES": "herramientas",
        })
        .setDescription("🎫 the tools ticket system (plus)")
        .setDescriptionLocalizations({
          "es-ES": "🎫 las herramientas de los tickets (plus)",
        })
    ),
  async (client, interaction) => {
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guildId as string;
    switch (subcommand) {
      case "delete":
        {
          const message = await interaction.reply({
            embeds: [
              new EmbedBuilder()
                .setAuthor({
                  name: `${config.name} - Ticket Panel`,
                  iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                })
                .setDescription(
                  [
                    `${client.getEmoji(guildId).time} Hello! \`${interaction.user.username}\` Are you sure you want to remove the ticket system?`,
                    "",
                    `${client.getEmoji(guildId).warning} ** Warning!**`,
                    "By removing the ticket system, all tickets will be removed and cannot be retrieved.",
                  ].join("\n")
                )
                .setColor("DarkGold")
                .setFooter({
                  text: `Time Last Interaction: ${new Date().toLocaleString()}`,
                  iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                })
                .setTimestamp(),
            ],
            components: [
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId("tickets:delete-confirm")
                  .setLabel("Confirm")
                  .setEmoji(client.getEmoji(guildId).correct)
                  .setStyle(ButtonStyle.Success),
                new ButtonBuilder()
                  .setCustomId("tickets:delete-cancel")
                  .setLabel("Cancel")
                  .setEmoji(client.getEmoji(guildId).error)
                  .setStyle(ButtonStyle.Danger)
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });

          const filter = (i: { user: { id: string } }) => i.user.id === interaction.user.id;
          const collector = message.createMessageComponentCollector({ filter, time: 15000 });

          collector.on("collect", async (i) => {
            switch (i.customId) {
              case "tickets:delete-confirm":
                {
                  const data = await manager.prisma.tickets.findMany({
                    where: { guildId: guildId },
                  });

                  if (!data) {
                    return await i.update({
                      embeds: [
                        new Embed()
                          .setAuthor({
                            name: `${config.name} - Ticket Panel`,
                            iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                          })
                          .setDescription(
                            [
                              `${client.getEmoji(guildId).error} The ticket system has not been found in the database.`,
                              `\`Note:\` If you want to remove the ticket system, you can use the command again.`,
                            ].join("\n")
                          )
                          .setGuild(interaction.guild as Guild),
                      ],
                      components: [],
                    });
                  }

                  if (data.length > 0) {
                    for (let i = 0; i < data.length; i++) {
                      await manager.prisma.tickets.delete({ where: { id: data[i].id } });
                    }
                  }

                  await i.update({
                    embeds: [
                      new Embed()
                        .setAuthor({
                          name: `${config.name} - Ticket Panel`,
                          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                        })
                        .setDescription(
                          [
                            `${client.getEmoji(guildId).loading} Removing the ticket system...`,
                            `\`Note:\` This process may take a few seconds.`,
                          ].join("\n")
                        )
                        .setGuild(interaction.guild as Guild),
                    ],
                    components: [],
                  });
                }
                break;
              case "tickets:delete-cancel":
                {
                  await i.update({
                    embeds: [
                      new Embed()
                        .setAuthor({
                          name: `${config.name} - Ticket Panel`,
                          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                        })
                        .setDescription(
                          [
                            `${client.getEmoji(guildId).success} The ticket system has not been removed.`,
                            `\`Note:\` If you want to remove the ticket system, you can use the command again.`,
                          ].join("\n")
                        )
                        .setGuild(interaction.guild as Guild),
                    ],
                    components: [],
                  });
                }
                break;
            }
          });

          collector.on("end", async () => {
            await message.edit({
              content: "This interaction has expired, Please use the command again.",
              components: [],
            });
          });
        }
        break;
      case "view":
        {
          const data = await manager.prisma.tickets.findUnique({ where: { guildId: guildId } });
          if (!data) {
            return await interaction.reply({
              embeds: [
                new Embed()
                  .setAuthor({
                    name: `${config.name} - Ticket Panel`,
                    iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                  })
                  .setDescription(
                    [
                      `${client.getEmoji(guildId).error} The ticket system has not been found in the database.`,
                      `\`Note:\` If you want to create the ticket system, you can use the command again.`,
                    ].join("\n")
                  )
                  .setGuild(interaction.guild as Guild),
              ],
              flags: MessageFlags.Ephemeral,
            });
          }

          const embeds = new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setDescription(
              [
                `${client.getEmoji(guildId).info} **Ticket System Information**`,
                "",
                `> **Channel:** ${data.channelId ? `<#${data.channelId}> (\`${data.channelId}\`)` : "Disabled"}`,
                `> **Category:** ${data.categoryId ? `<#${data.categoryId}> (\`${data.categoryId}\`)` : "Disabled"}`,
                `> **Transcript:** ${data.transcriptId ? "Enabled" : "Disabled"}`,
              ].join("\n")
            )
            .setFields({
              name: "__**Ticket System Settings**__",
              value: [
                `> **Ticket Role:** ${data.roleId ? `<@&${data.roleId}>` : "Disabled"}`,
                `> **Ticket Format:** ${data.ticketformat ? `\`${data.ticketformat}\`` : "Disabled"}`,
                `> **Ticket Hours:** \`${client.config.bot.tickets.options.times["time-2"]}:00 - ${client.config.bot.tickets.options.times["time-1"]}:00\``,
                `> **Created At:** ${new Date(data.createdAt).toLocaleString()}`,
              ].join("\n"),
            })
            .setGuild(interaction.guild as Guild);

          await interaction.reply({ embeds: [embeds], flags: MessageFlags.Ephemeral });
        }
        break;
      case "create":
        {
          //FIX: Create the ticket system inside the server
          const message = await interaction.reply({
            embeds: [
              new Embed()
                .setAuthor({
                  name: `${config.name} - Ticket Panel`,
                  iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                })
                .setDescription(
                  [
                    `${client.getEmoji(guildId).time} Hello! \`${interaction.user.username}\` Are you sure you want to create the ticket system?`,
                    "",
                    `${client.getEmoji(guildId).warning} ** Warning!**`,
                    "By creating the ticket system, all tickets will be created and cannot be retrieved.",
                  ].join("\n")
                )
                .setGuild(interaction.guild as Guild),
            ],
            components: [
              new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
                new StringSelectMenuBuilder()
                  .setCustomId("tickets:create-panel")
                  .setPlaceholder("Configure the system tickets options")
                  .addOptions(
                    {
                      label: "Select a channel",
                      value: "one_option",
                      emoji: client.getEmoji(guildId).tickets.options.channel,
                      description: "Select a channel to create the ticket system",
                    },
                    {
                      label: "Select a category",
                      value: "two_option",
                      emoji: client.getEmoji(guildId).tickets.options.category,
                      description: "Select a category to create the ticket system",
                    },
                    {
                      label: "Select a role",
                      value: "three_option",
                      emoji: client.getEmoji(guildId).tickets.options.role,
                      description: "Select a role to create the ticket system",
                    },
                    {
                      label: "Enable transcript",
                      value: "four_option",
                      emoji: client.getEmoji(guildId).tickets.options.transcript,
                      description: "Enable the transcript to create the ticket system",
                    },
                    {
                      label: "Message to send",
                      value: "five_option",
                      emoji: client.getEmoji(guildId).tickets.options.message,
                      description: "Message to send to create the ticket system",
                    },
                    {
                      label: "Options the menu",
                      value: "six_option",
                      emoji: client.getEmoji(guildId).tickets.options.options,
                      description: "Create the ticket system",
                    }
                  )
              ),
              new ActionRowBuilder<ButtonBuilder>().addComponents(
                new ButtonBuilder()
                  .setCustomId("tickets:create-cancel")
                  .setLabel("Cancel")
                  .setEmoji(client.getEmoji(guildId).error)
                  .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                  .setCustomId("tickets:create-send")
                  .setLabel("Send")
                  .setEmoji(client.getEmoji(guildId).send)
                  .setStyle(ButtonStyle.Success)
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });

          const filter = (i: { user: { id: string } }) => i.user.id === interaction.user.id;
          const collector = message.createMessageComponentCollector({
            filter,
            time: client.config.bot.tickets.time,
          });

          collector.on("collect", async (i) => {
            if (i.customId === "tickets:create-cancel") {
              await i.update({
                embeds: [
                  new Embed()
                    .setAuthor({
                      name: `${config.name} - Ticket Panel`,
                      iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                    })
                    .setDescription(
                      [
                        `${client.getEmoji(guildId).correct} The ticket system has not been created.`,
                        `\`Note:\` If you want to create the ticket system, you can use the command again.`,
                      ].join("\n")
                    )
                    .setGuild(interaction.guild as Guild),
                ],
                components: [],
              });
            }
          });

          collector?.on("end", async () => {
            await message.edit({
              content: "This interaction has expired, Please use the command again.",
              components: [],
            });
          });
        }
        break;
      case "tools":
        {
          const embed = new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setDescription(
              [
                `${client.getEmoji(guildId).info} **Ticket System Tools**`,
                "",
                "> **Ticket System Tools**",
                "Below you will have all the tools of the ticket system",
                "If you have any suggestions, please feel free to comment.",
              ].join("\n")
            )
            .setGuild(interaction.guild as Guild);

          const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder()
              .setCustomId("tickets:tools-add:user")
              .setLabel("Add User")
              .setEmoji(client.getEmoji(guildId).tickets.add)
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("tickets:tools-remove:user")
              .setLabel("Remove User")
              .setEmoji(client.getEmoji(guildId).tickets.remove)
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("tickets:tools-rename")
              .setLabel("Rename Ticket")
              .setEmoji(client.getEmoji(guildId).tickets.rename)
              .setStyle(ButtonStyle.Secondary),
            new ButtonBuilder()
              .setCustomId("tickets:tools-name:channel")
              .setLabel("Channel Format")
              .setEmoji(client.getEmoji(guildId).channelname)
          );

          await interaction.reply({ embeds: [embed], components: [buttons], flags: MessageFlags.Ephemeral });
        }
        break;
    }
  }
);
