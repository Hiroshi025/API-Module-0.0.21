/* eslint-disable @typescript-eslint/no-explicit-any */
import { PermissionFlagsBits } from "discord.js";

import { manager } from "@/index";
import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("verification")
    .setNameLocalizations({
      "es-ES": "verificacion",
    })
    .setDescription("🧶 Manage the verification module")
    .setDescriptionLocalizations({
      "es-ES": "🧶 Administra el módulo de verificación",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((subcommand) =>
      subcommand
        .setName("configure")
        .setNameLocalizations({
          "es-ES": "configurar",
        })
        .setDescription("🧶 Configure the verification module")
        .setDescriptionLocalizations({
          "es-ES": "🧶 Configura el módulo de verificación",
        })
        .addBooleanOption((options) =>
          options
            .setName("enable")
            .setNameLocalizations({
              "es-ES": "activar",
            })
            .setDescription("🧶 Enable or disable the verification system")
            .setDescriptionLocalizations({
              "es-ES": "🧶 Habilita o deshabilita el sistema de verificación",
            })
            .setRequired(true)
        )
        .addRoleOption((options) =>
          options
            .setName("role")
            .setNameLocalizations({
              "es-ES": "rol",
            })
            .setDescription("🧶 Choose a role to give to verifiers")
            .setDescriptionLocalizations({
              "es-ES": "🧶 Elige un rol para dar a los verificadores",
            })
            .setRequired(true)
        )
    )
    .addSubcommand((subcommand) =>
      subcommand.setName("delete").setDescription("🧶 Delete the verification data.")
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const subcommand = interaction.options.getSubcommand();
    switch (subcommand) {
      case "configure":
        {
          const { options, guild } = interaction;
          const isVerificationEnabled = options.getBoolean("enable") ?? false;
          const verificationdRole = options.getRole("role")?.id ?? "";
          const guildId = guild?.id ?? "";

          try {
            const settings = await manager.prisma.guild.findUnique({
              where: { id: guildId },
              select: { id: true, captcha: true },
            });
            if (settings) {
              await manager.prisma.captcha.update({
                where: { id: guildId },
                data: { isEnabled: isVerificationEnabled, role: verificationdRole },
              });
            } else {
              await manager.prisma.guild.create({
                data: {
                  guildId: guildId,
                  guildName: interaction.guild.name,
                  captcha: {
                    create: {
                      isEnabled: isVerificationEnabled,
                      role: verificationdRole,
                    },
                  },
                },
              });
            }

            interaction.reply({
              embeds: [
                new Embed().setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).error} The verification module has been updated successfully.`,
                    `**Enabled:** ${isVerificationEnabled ? "Yes" : "No"}`,
                  ].join("\n")
                ),
              ],
              ephemeral: true,
            });
          } catch (error: any) {
            console.log(error);
            interaction.reply({
              embeds: [
                new ErrorEmbed(interaction.guild.id)
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guild.id).error} An error occurred while updating the verification module.`,
                      `**Error:** ${error.message}`,
                    ].join("\n")
                  )
                  .setStackTrace(error.stack),
              ],
              ephemeral: true,
            });
          }
        }
        break;
      case "delete":
        {
          const guildId = interaction.guild.id;

          try {
            await manager.prisma.captcha.deleteMany({
              where: { guild: { id: guildId } },
            });

            await manager.prisma.guild.delete({
              where: { id: guildId },
            });

            interaction.reply({
              embeds: [
                new Embed().setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).correct} The data has been deleted successfully.`,
                    `**Guild:** ${interaction.guild.name} (\`${interaction.guild.id}\`)`,
                  ].join("\n")
                ),
              ],
              ephemeral: true,
            });
          } catch (error: any) {
            interaction.reply({
              embeds: [
                new ErrorEmbed(interaction.guild.id)
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guild.id).error} An error occurred while deleting the data.`,
                      `**Error:** ${error.message}`,
                    ].join("\n")
                  )
                  .setStackTrace(error.stack),
              ],
              ephemeral: true,
            });
          }
        }
        break;
    }
  }
);
