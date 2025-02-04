import { stripIndent } from "common-tags";
import { ChannelType, Guild, MessageFlags, PermissionFlagsBits } from "discord.js";

import { manager } from "@/index";
import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("logs")
    .setDescription("📚 Set the logs channel for the server.")
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels)
    .setDescriptionLocalizations({
      "es-ES": "📚 Establece el canal de logs para el servidor.",
    })
    .addSubcommand((subcommand) =>
      subcommand
        .setName("set")
        .setNameLocalizations({
          "es-ES": "establecer",
        })
        .setDescription("📚 Set the logs channel for the server.")
        .setDescriptionLocalizations({
          "es-ES": "📚 Establece el canal de logs para el servidor.",
        })
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setDescription("📚 The channel to set the logs.")
            .setDescriptionLocalizations({
              "es-ES": "📚 El canal para establecer los logs.",
            })
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subCmd) =>
      subCmd
        .setName("warns")
        .setNameLocalizations({ "es-ES": "advertencias" })
        .setDescription("📚 Get the warns of a user")
        .setDescriptionLocalizations({ "es-ES": "📚 Obtener las advertencias de un usuario" })
        .addUserOption((option) => {
          return option
            .setName("user")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("📚 User to get the warn logs for")
            .setDescriptionLocalizations({
              "es-ES": "📚 Usuario para obtener los registros de advertencias",
            })
            .setRequired(true);
        })
        .addIntegerOption((option) => {
          return option
            .setName("page")
            .setNameLocalizations({
              "es-ES": "página",
            })
            .setDescription("📚 The page to display if there are more than 1")
            .setDescriptionLocalizations({
              "es-ES": "📚 La página a mostrar si hay más de 1",
            })
            .setMinValue(2)
            .setMaxValue(20);
        })
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("remove")
        .setNameLocalizations({
          "es-ES": "remover",
        })
        .setDescription("📚 Remove the logs channel for the server.")
        .setDescriptionLocalizations({
          "es-ES": "📚 Remueve el canal de logs para el servidor.",
        })
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const subcommand = interaction.options.getSubcommand();
    const guildId = interaction.guild.id;

    switch (subcommand) {
      case "set":
        {
          const channel = interaction.options.getChannel("channel", true);
          const channelId = channel.id;

          await manager.prisma.logs.upsert({
            where: { guildId },
            update: {
              channelId,
            },
            create: {
              guildId,
              channelId,
            },
          });

          await interaction.reply({
            embeds: [
              new Embed()
                .setAuthor({
                  name: `${config.name} - Logs Panel`,
                  iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                })
                .setGuild(interaction.guild as Guild)
                .setDescription(
                  [
                    `The logs channel has been set to ${channel} (\`${channelId}\`).`,
                    `**Note:** If you want to remove the logs channel, use the \`/logs remove\` command.`,
                  ].join("\n")
                ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
      case "remove":
        {
          await manager.prisma.logs.delete({
            where: { guildId },
          });

          await interaction.reply({
            embeds: [
              new Embed()
                .setAuthor({
                  name: `${config.name} - Logs Panel`,
                  iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                })
                .setGuild(interaction.guild as Guild)
                .setDescription(
                  [
                    `The logs channel has been removed.`,
                    `**Note:** If you want to set the logs channel, use the \`/logs set\` command.`,
                  ].join("\n")
                ),
            ],
            flags: MessageFlags.Ephemeral,
          });
        }
        break;
      case "warns":
        {
          const user = interaction.options.getUser("user");
          const page = interaction.options.getInteger("page");

          const userdb = await manager.prisma.user.findFirst({
            where: { userId: user?.id as string, guildId },
          });
          if (!userdb)
            return interaction.reply({
              embeds: [
                new ErrorEmbed(guildId)
                  .setTitle("User Warn Logs")
                  .setDescription(`${user} has no warn logs`)
                  .setColor("Red"),
              ],
            });

          if (!userdb.warns.length)
            return interaction.reply({
              embeds: [
                new Embed()
                  .setTitle("User Warn Logs")
                  .setDescription(`${user} has no warn logs`)
                  .setColor("Red"),
              ],
            });

          const embed = new Embed().setTitle(`${user?.tag}'s warn logs`).setColor("#2f3136");

          if (page) {
            const pageNum = 5 * page - 5;

            if (userdb.warns.length >= 6) {
              embed.setFooter({
                text: `page ${page} of ${Math.ceil(userdb.warns.length / 5)}`,
              });
            }

            for (const warnings of userdb.warns.splice(pageNum, 5)) {
              const moderator = interaction.guild.members.cache.get(warnings.moderator);

              embed.addFields({
                name: `id: ${warnings.warnId}`,
                value: stripIndent`
                  Moderator: ${moderator || "Moderator left"}
                  User: ${userdb.userId}
                  Reason: \`${warnings.warnReason}\`
                  Date: ${warnings.warnDate}
                  `,
              });
            }

            return await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
          }

          if (userdb.warns.length >= 6) {
            embed.setFooter({
              text: `page 1 of ${Math.ceil(userdb.warns.length / 5)}`,
            });
          }

          for (const warns of userdb.warns.slice(0, 5)) {
            const moderator = interaction.guild.members.cache.get(warns.moderator);

            embed.addFields({
              name: `id: ${warns.warnId}`,
              value: stripIndent`
                Moderator: ${moderator || "Moderator left"}
                User: ${userdb.userId}
                Reason: \`${warns.warnReason}\`
                Date: ${warns.warnDate}
              `,
            });
          }

          await interaction.reply({ embeds: [embed], flags: MessageFlags.Ephemeral });
        }
        break;
    }
  }
);
