import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, StringSelectMenuBuilder, User
} from "discord.js";

import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
  .setName("unban")
  .setNameLocalizations({
    "es-ES": "desbanear"
  })
  .setDescription("🐲 Unban a member from the server")
  .setDescriptionLocalizations({
    "es-ES": "🐲 Desbanea a un miembro del servidor"
  })
  .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member || !client.user) return;
    const { guild } = interaction;
    let members: User;

    const fetchBan = await guild.bans.fetch({ limit: 25 });

    const noBanEmbed = new Embed()
      .setColor("Blue")
      .setTitle("Unban Commands")
      .setDescription(`No banned user detected on this server!`);

    if (fetchBan.size == 0)
      return interaction.reply({
        embeds: [noBanEmbed],
        components: [],
        ephemeral: true,
      });

    const memberList: { label: string; value: string; }[] = [];
    fetchBan.forEach((member) => {
      memberList.push({ label: member.user.username, value: member.user.id });
    });

    const choicesEmbed = new Embed()
      .setColor('Blue')
      .setTitle("Unban Commands")
      .setDescription("Choose a member to unban from drop-down menu below");

    const selectMenu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
      new StringSelectMenuBuilder()
        .setCustomId("unban:selectMenu")
        .setPlaceholder("Select a user")
        .addOptions(memberList)
        .setMinValues(1)
        .setMaxValues(1),
    );

    interaction
      .reply({
        embeds: [choicesEmbed],
        components: [selectMenu],
        ephemeral: true,
      })
      .then(async (msg) => {
        const collector = await msg.createMessageComponentCollector({
          idle: 10000,
        });

        collector.on("collect", async (i) => {
          if (i.isStringSelectMenu() && i.customId == "unban:selectMenu") {
            members = await client.users.fetch(i.values[0]);

            const confirmationEmbed = new Embed()
              .setColor("Blue")
              .setTitle("Unban Commands")
              .setDescription(
                `Are you sure wanted to Unban ${members}?`,
              );

            const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
              new ButtonBuilder()
                .setCustomId("unban:confirm")
                .setLabel("Confirm")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("unban:cancel")
                .setLabel("Cancel")
                .setStyle(ButtonStyle.Secondary),
            );

            await i.update({
              embeds: [confirmationEmbed],
              components: [buttons],
            });
          } else if (i.isButton() && i.customId == "unban:confirm") {
            const processEmbed = new Embed()
              .setColor("Blue")
              .setTitle("Unban Commands")
              .setDescription(`Unbanning status...`);

            await i.update({
              embeds: [processEmbed],
              components: [],
            });

            await guild.members.unban(members.id);

            const finishedEmbed = new Embed()
              .setColor("Blue")
              .setTitle("Unban Commands")
              .setDescription(`${members} has been Unbanned!`);

            msg.edit({
              embeds: [finishedEmbed],
              components: [],
            });
          } else if (i.isButton() && i.customId == "unban:cancel") {
            const canceledEmbed = new Embed()
              .setColor("Blue")
              .setTitle("Unban Commands")
              .setDescription(`Unban Canceled.`);

            i.update({
              embeds: [canceledEmbed],
              components: [],
            });
          }
        });

        collector.on("end", async () => {
          const msgC = await interaction.fetchReply();
          if (!msg) return;
          if (!msgC.components.length) return;

          const noInteractionEmbed = new Embed()
            .setColor("Blue")
            .setTitle("Unban Commands")
            .setDescription(
              `No interaction received in the span of 10 seconds. Unban cancelled!`,
            );

          msg.edit({
            embeds: [noInteractionEmbed],
            components: [],
          });
        });
      });
  }
);