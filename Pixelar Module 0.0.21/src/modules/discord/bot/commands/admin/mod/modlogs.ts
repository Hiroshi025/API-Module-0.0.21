import { channelMention, ChannelType, MessageFlags, PermissionFlagsBits } from "discord.js";

import { manager } from "@/index";
import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("modlogs")
    .setNameLocalizations({
      "es-ES": "modlogs",
    })
    .setDescription("😠 Setup or edit the modlogs.")
    .setDescriptionLocalizations({
      "es-ES": "😠 Configura o edita los modlogs.",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("setup")
        .setNameLocalizations({
          "es-ES": "configurar",
        })
        .setDescription("😠 Setup the modlogs.")
        .setDescriptionLocalizations({
          "es-ES": "😠 Configura los modlogs.",
        })
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setNameLocalizations({
              "es-ES": "canal",
            })
            .setDescription("😠 Channel to send the message to.")
            .setDescriptionLocalizations({
              "es-ES": "😠 Canal para enviar el mensaje.",
            })
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand
        .setName("replace_channel")
        .setNameLocalizations({
          "es-ES": "reemplazar_canal",
        })
        .setDescription("😠 Replace the channel for the modlogs.")
        .setDescriptionLocalizations({
          "es-ES": "😠 Reemplaza el canal para los modlogs.",
        })
        .addChannelOption((option) =>
          option
            .setName("channel")
            .setNameLocalizations({
              "es-ES": "canal",
            })
            .setDescription("😠 Channel to send the message to.")
            .setDescriptionLocalizations({
              "es-ES": "😠 Canal para enviar el mensaje.",
            })
            .addChannelTypes(ChannelType.GuildText)
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("delete").setDescription("😠 Deletes config for the modlogs.")
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    switch (interaction.options.getSubcommand()) {
      case "setup":
        {
          const { options } = interaction;
          const channel = options.getChannel("channel");
          if (!channel) {
            return interaction.reply({
              embeds: [
                new ErrorEmbed(interaction.guild.id as string).setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string).error} Please provide a channel to setup modlogs.`,
                    `To setup run \`/modlogs setup\``,
                  ].join("\n")
                ),
              ],
            });
          }
          const modSys = await manager.prisma.serverModlogs.findFirst({
            where: { guildId: interaction.guild.id },
          });

          if (modSys?.guildId === interaction.guild.id) {
            interaction.reply({
              embeds: [
                new Embed().setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string).correct} Modlogs already setup!`,
                    `To replace the channel run \`/modlogs replace_channel\``,
                  ].join("\n")
                ),
              ],
            });
            return;
          }

          await manager.prisma.serverModlogs.create({
            data: {
              guildId: interaction.guild.id,
              channelId: channel.id,
            },
          });

          await interaction
            .reply({
              embeds: [
                new Embed()
                  .setTitle("Modlogs setup!")
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guildId as string).correct} Modlogs have been successfully setup!`,
                      `Channel: ${channelMention(channel.id)}`,
                    ].join("\n")
                  )
                  .setColor(0x00ff00),
              ],
              flags: MessageFlags.Ephemeral,
            })
            .catch((err) => console.log(err));
        }

        break;

      case "replace_channel":
        {
          const { options } = interaction;
          const channel = options.getChannel("channel");
          if (!channel) {
            return interaction.reply({
              embeds: [
                new ErrorEmbed(interaction.guild.id as string).setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string).error} Please provide a channel to replace modlogs.`,
                    `To setup run \`/modlogs setup\``,
                  ].join("\n")
                ),
              ],
            });
          }

          const modlogs = await manager.prisma.serverModlogs.findFirst({
            where: { guildId: interaction.guild.id },
          });
          if (!modlogs) {
            return interaction.reply({
              embeds: [
                new ErrorEmbed(interaction.guild.id as string).setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string).error} Modlogs are not setup!`,
                    `To setup run \`/modlogs setup\``,
                  ].join("\n")
                ),
              ],
            });
          }

          await manager.prisma.serverModlogs.update({
            where: { guildId: interaction.guild.id },
            data: {
              channelId: channel.id,
            },
          });

          await interaction
            .reply({
              embeds: [
                new Embed()
                  .setTitle("Modlogs channel replaced!")
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guildId as string).correct} Modlogs channel has been successfully replaced!`,
                      `New channel: ${channelMention(channel.id)}`,
                    ].join("\n")
                  )
                  .setColor(0x00ff00),
              ],
              flags: MessageFlags.Ephemeral,
            })
            .catch((err) => console.log(err));
        }

        break;

      case "delete":
        {
          const modlogs = await manager.prisma.serverModlogs.findFirst({
            where: { guildId: interaction.guild.id },
          });

          if (!modlogs) {
            return interaction.reply({
              embeds: [
                new ErrorEmbed(interaction.guild.id as string).setDescription(
                  [
                    `${client.getEmoji(interaction.guildId as string).error} Modlogs are not setup!`,
                    `To setup run \`/modlogs setup\``,
                  ].join("\n")
                ),
              ],
            });
          }

          await manager.prisma.serverModlogs.delete({ where: { guildId: interaction.guild.id } });
          await interaction
            .reply({
              embeds: [
                new Embed()
                  .setTitle("Modlogs Deleted")
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guildId as string).correct} Modlogs have been successfully deleted!`,
                      `To setup run \`/modlogs setup\``,
                    ].join("\n")
                  ),
              ],
              flags: MessageFlags.Ephemeral,
            })
            .catch((err) => console.log(err));
        }
        break;
    }
  }
);
