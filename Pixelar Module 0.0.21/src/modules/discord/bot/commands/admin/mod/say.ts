import {
	ActionRowBuilder, ChannelType, ModalBuilder, PermissionFlagsBits, TextChannel, TextInputBuilder,
	TextInputStyle
} from "discord.js";

import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("say")
    .setNameLocalizations({
      "es-ES": "decir",
    })
    .setDescription("🐲 Says something by the bot")
    .setDescriptionLocalizations({
      "es-ES": "🐲 Dice algo por el bot",
    })
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addChannelOption((options) =>
      options
        .setName("channel")
        .setNameLocalizations({
          "es-ES": "canal",
        })
        .setDescription("🐲 THe channel you want to send the message")
        .setDescriptionLocalizations({
          "es-ES": "🐲 El canal donde quieres enviar el mensaje",
        })
        .addChannelTypes(ChannelType.GuildText)
        .setRequired(false)
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const channel = interaction.options.getChannel("channel") || interaction.channel;

    const saymodal = new ModalBuilder().setCustomId("say").setTitle("Say something through the bot");

    const sayquestion = new TextInputBuilder()
      .setCustomId("say")
      .setLabel("Say something")
      .setPlaceholder("Type something...")
      .setStyle(TextInputStyle.Paragraph)
      .setRequired(true);

    const sayembed = new TextInputBuilder()
      .setCustomId("embed")
      .setLabel("Embed mode on/off?")
      .setPlaceholder("on/off")
      .setStyle(TextInputStyle.Short)
      .setRequired(false);

    const say = new ActionRowBuilder<TextInputBuilder>().addComponents(sayquestion);
    const sayemb = new ActionRowBuilder<TextInputBuilder>().addComponents(sayembed);

    saymodal.addComponents(say, sayemb);

    await interaction.showModal(saymodal);

    try {
      const response = await interaction.awaitModalSubmit({ time: 300000 });
      const message = response.fields.getTextInputValue("say");
      const embedsay = response.fields.getTextInputValue("embed");

      const embed = new Embed().setDescription(message).setColor("Blue");

      if (embedsay === "on" || embedsay === "On") {
        await (channel as TextChannel).send({ embeds: [embed] });
      } else {
        await (channel as TextChannel).send(message);
      }

      await response.reply({
        embeds: [
          new Embed().setDescription(
            [
              `${client.getEmoji(interaction.guild.id as string).correct} Message sent to ${channel.toString()}`,
              `> **Message:** ${message}`,
              `> **Embed:** ${embedsay}`,
            ].join("\n")
          ),
        ],
      });
    } catch (error) {
      console.error(error);
      return;
    }
  }
);
