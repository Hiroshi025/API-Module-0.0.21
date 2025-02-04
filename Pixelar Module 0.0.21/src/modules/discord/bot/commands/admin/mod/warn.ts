import { MessageFlags, PermissionFlagsBits, TextChannel, time } from "discord.js";

import { manager } from "@/index";
import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .setName("warn")
    .setNameLocalizations({ "es-ES": "advertencia" })
    .setDescription("😠 Warn a user or remove a warn")
    .setDescriptionLocalizations({ "es-ES": "😠 Advertir a un usuario o eliminar una advertencia" })
    .addSubcommand((subCmd) =>
      subCmd
        .setName("add")
        .setNameLocalizations({ "es-ES": "añadir" })
        .setDescription("😠 Warn a user")
        .setDescriptionLocalizations({ "es-ES": "😠 Advertir a un usuario" })
        .addUserOption((option) => {
          return option
            .setName("user")
            .setNameLocalizations({
              "es-ES": "usuario",
            })
            .setDescription("😠 The user to warn")
            .setDescriptionLocalizations({
              "es-ES": "😠 El usuario a advertir",
            })
            .setRequired(true);
        })
        .addStringOption((option) => {
          return option
            .setName("reason")
            .setNameLocalizations({ "es-ES": "razón" })
            .setDescription("😠 The reason for the warn")
            .setDescriptionLocalizations({ "es-ES": "😠 La razón de la advertencia" })
            .setRequired(true)
            .setMinLength(5)
            .setMaxLength(500);
        })
    )
    .addSubcommand((subCmd) =>
      subCmd
        .setName("remove")
        .setNameLocalizations({ "es-ES": "eliminar" })
        .setDescription("😠 Remove a warn from a user")
        .setDescriptionLocalizations({ "es-ES": "😠 Eliminar una advertencia de un usuario" })
        .addStringOption((option) => {
          return option
            .setName("warn_id")
            .setNameLocalizations({
              "es-ES": "id",
            })
            .setDescription("😠 The id of the warn to remove")
            .setDescriptionLocalizations({
              "es-ES": "😠 El id de la advertencia a eliminar",
            })
            .setRequired(true);
        })
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    switch (interaction.options.getSubcommand()) {
      case "add":
        {
          const { options, guild, member } = interaction;
          const user = options.getUser("user");
          const reason = options.getString("reason");
          const warnTime = time();

          if (!user) return;

          const userdb = await manager.prisma.user.findUnique({ where: { userId: user.id } });
          if (!userdb)
            return interaction.reply({
              embeds: [
                new ErrorEmbed(interaction.guildId as string)
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guildId as string).error} I couldn't find the user in the database`,
                      `Please make sure the user is in the database`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            });

          await manager.prisma.user.update({
            where: { userId: user.id },
            data: {
              warns: {
                set: {
                  warnId: (userdb.warns.length + 1).toString(),
                  warnReason: reason as string,
                  moderator: member.user.id,
                  warnDate: warnTime,
                },
              },
            },
          });

          await interaction.reply({
            embeds: [
              new Embed()
                .setTitle("User Warned!")
                .setDescription(
                  [
                    `User: ${user}`,
                    `Warned by: ${member.user}`,
                    `Warned at: ${warnTime}`,
                    `Warn Reason: ${reason}`,
                  ].join("\n")
                )
                .setColor("Red"),
            ],
            flags: MessageFlags.Ephemeral,
          });

          const modData = await manager.prisma.serverModlogs.findFirst({
            where: { guildId: interaction.guild.id },
          });

          const data = await manager.prisma.user.findFirst({
            where: { userId: user.id, guildId: guild.id },
          });

          if (!data || !modData) return;
          const channel: TextChannel = (await client.utils.getChannel(modData.channelId)) as TextChannel;
          if (!channel) return;

          if (modData) {
            channel.send({
              embeds: [
                new Embed().setTitle("New User Warned").addFields(
                  {
                    name: "User warned",
                    value: `<@${user.id}>`,
                    inline: true,
                  },
                  {
                    name: "Warned by",
                    value: `<@${member.user.id}>`,
                    inline: true,
                  },
                  {
                    name: "Warned at",
                    value: `${warnTime}`,
                    inline: true,
                  },
                  {
                    name: "Warn ID",
                    value: `\`${data.id}\``,
                    inline: true,
                  },
                  {
                    name: "Warn Reason",
                    value: `\`\`\`${reason}\`\`\``,
                  }
                ),
              ],
            });
          }

          user
            .send({
              embeds: [
                new Embed()
                  .setTitle(`You have been warned in: ${guild.name}`)
                  .addFields(
                    {
                      name: "Warned for",
                      value: `\`${reason}\``,
                      inline: true,
                    },
                    {
                      name: "Warned at",
                      value: `${warnTime}`,
                      inline: true,
                    }
                  )
                  .setColor("#2f3136"),
              ],
            })
            .catch(async (err) => {
              console.log(err);
              await interaction.followUp({
                embeds: [
                  new ErrorEmbed(interaction.guildId as string)
                    .setDescription(
                      [
                        `I couldn't send a DM to ${user}`,
                        `Warned for: ${reason}`,
                        `Warned at: ${warnTime}`,
                      ].join("\n")
                    )
                    .setColor("Red"),
                ],
              });
            });
        }
        break;

      case "remove": {
        const warnId = interaction.options.getString("warn_id");

        const data = await manager.prisma.user.findFirst({
          where: {
            warns: {
              some: {
                warnId: warnId as string,
              },
            },
          },
        });

        const err = new ErrorEmbed(interaction.guildId as string)
          .setTitle("Remove Infraction")
          .setDescription(
            [
              `${client.getEmoji(interaction.guildId as string).error} I couldn't find a warn with the ID matching ${warnId}`,
              `Please make sure you're using the correct warn ID`,
            ].join("\n")
          );

        if (!data) return await interaction.reply({ embeds: [err] });

        await manager.prisma.user.update({
          where: { id: data.id, guildId: interaction.guildId as string },
          data: {
            warns: {
              deleteMany: {
                where: { warnId: warnId as string },
              },
            },
          },
        });
        
        const embed = new Embed()
          .setTitle("Remove Infraction")
          .setDescription(`Successfully removed the warn with the ID matching ${warnId}`);
        return await interaction.reply({ embeds: [embed] });
      }
    }
  }
);
