import { ActionRowBuilder, ButtonBuilder, ButtonStyle, TextChannel } from "discord.js";

import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName(`avatar`)
    .setNameLocalizations({
      "es-ES": `avatar`,
    })
    .setDescription(`🐲 Get anybody's Profile Picture / Banner.`)
    .setDescriptionLocalizations({
      "es-ES": `🐲 Obten la foto de perfil / banner de cualquier`,
    })
    .addUserOption((option) =>
      option
        .setName(`user`)
        .setNameLocalizations({
          "es-ES": `usuario`,
        })
        .setDescription(`🐲 Select a user`)
        .setDescriptionLocalizations({
          "es-ES": `🐲 Selecciona un usuario`,
        })
        .setRequired(false)
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const usermention = interaction.options.getUser(`user`) || interaction.user;
    const avatar = usermention.displayAvatarURL({ size: 1024, extension: "png" });
    const banner = await (
      await client.users.fetch(usermention.id, { force: true })
    ).bannerURL({ size: 4096 });
    await (interaction.channel as TextChannel).sendTyping();

    const cmp = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Avatar`)
        .setCustomId(`avatar`)
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder().setLabel(`Banner`).setCustomId(`banner`).setStyle(ButtonStyle.Secondary),

      new ButtonBuilder().setLabel(`Delete`).setCustomId(`delete`).setStyle(ButtonStyle.Danger)
    );

    const cmp2 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setLabel(`Avatar`).setCustomId(`avatar`).setStyle(ButtonStyle.Secondary),

      new ButtonBuilder()
        .setLabel(`Banner`)
        .setCustomId(`banner`)
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder().setLabel(`Delete`).setCustomId(`delete`).setStyle(ButtonStyle.Danger)
    );

    const cmp3 = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setLabel(`Avatar`)
        .setCustomId(`avatar`)
        .setDisabled(true)
        .setStyle(ButtonStyle.Secondary),

      new ButtonBuilder().setLabel(`Delete`).setCustomId(`delete`).setStyle(ButtonStyle.Danger)
    );

    const embed = new Embed()
      .setAuthor({ name: `${usermention.tag}, avatar`, iconURL: `${usermention.displayAvatarURL()}` })
      .setTitle(`Download`)
      .setURL(avatar)
      .setImage(avatar);

    const embed2 = new Embed()
      .setAuthor({ name: `${usermention.tag}, banner`, iconURL: `${usermention.displayAvatarURL()}` })
      .setTitle(`Download`)
      .setURL(banner || avatar)
      .setImage(banner || avatar);

    if (!banner) {
      //checking if the user does not have a banner, so it will send profile icon.
      const message2 = await interaction.reply({ embeds: [embed], components: [cmp3] });
      const collector = await message2.createMessageComponentCollector();
      collector.on(`collect`, async (c) => {
        if (c.customId === "delete") {
          if (c.user.id !== interaction.user.id) {
            return await c.reply({
              embeds: [
                new ErrorEmbed(interaction.guild?.id as string).setDescription(
                  [
                    `${client.getEmoji(interaction.guild?.id as string).error} Only ${interaction.user.tag} can interact with the buttons!`,
                    `please try again later or contact the developer.`,
                  ].join("\n")
                ),
              ],
              flags: "Ephemeral",
            });
          }

          interaction.deleteReply();
        }
      });
      return;
    }

    // sending embed with both profile icons, banner and avatar.
    const message = await interaction.reply({ embeds: [embed], components: [cmp] });
    const collector = await message.createMessageComponentCollector();

    collector.on(`collect`, async (c) => {
      if (c.customId === "avatar") {
        if (c.user.id !== interaction.user.id) {
          return await c.reply({
            embeds: [
              new ErrorEmbed(interaction.guild?.id as string).setDescription(
                [
                  `${client.getEmoji(interaction.guild?.id as string).error} Only ${interaction.user.tag} can interact with the buttons!`,
                  `please try again later or contact the developer.`,
                ].join("\n")
              ),
            ],
            flags: "Ephemeral",
          });
        }

        await c.update({ embeds: [embed], components: [cmp] });
      }

      if (c.customId === "banner") {
        if (c.user.id !== interaction.user.id) {
          return await c.reply({
            embeds: [
              new ErrorEmbed(interaction.guild?.id as string).setDescription(
                [
                  `${client.getEmoji(interaction.guild?.id as string).error} Only ${interaction.user.tag} can interact with the buttons!`,
                  `please try again later or contact the developer.`,
                ].join("\n")
              ),
            ],
            flags: "Ephemeral",
          });
        }

        await c.update({ embeds: [embed2], components: [cmp2] });
      }

      if (c.customId === "delete") {
        if (c.user.id !== interaction.user.id) {
          return await c.reply({
            embeds: [
              new ErrorEmbed(interaction.guild?.id as string).setDescription(
                [
                  `${client.getEmoji(interaction.guild?.id as string).error} Only ${interaction.user.tag} can interact with the buttons!`,
                  `please try again later or contact the developer.`,
                ].join("\n")
              ),
            ],
            flags: "Ephemeral",
          });
        }

        interaction.deleteReply();
      }
    });
  }
);
