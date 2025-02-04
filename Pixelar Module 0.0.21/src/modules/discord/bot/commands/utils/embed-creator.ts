import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder, PermissionFlagsBits,
	StringSelectMenuBuilder, StringSelectMenuOptionBuilder, TextChannel
} from "discord.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Command } from "@modules/discord/class/builders";

export default new Command(
  new CommandBuilder()
    .setName("embed-creator")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
    .setNameLocalizations({
      "es-ES": "creador-de-embeds",
    })
    .setDescription("🪚 Create custom embeds")
    .setDescriptionLocalizations({
      "es-ES": "🪚 Crea embeds personalizados",
    })
    .addChannelOption((opt) =>
      opt
        .setName("channel")
        .setNameLocalizations({
          "es-ES": "canal",
        })
        .addChannelTypes(ChannelType.GuildText)
        .setDescription("🪚 Send the embed to a different channel")
        .setDescriptionLocalizations({
          "es-ES": "🪚 Envía el embed a un canal diferente",
        })
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    const options = interaction.options;
    const member = interaction.member;
    const channel: TextChannel =
      (options.getChannel("channel") as TextChannel) || (interaction.channel as TextChannel);

    const previewEmbed = new EmbedBuilder().setDescription("Preview Embeds. Start editing to see changes~");
    const setupEmbed = new EmbedBuilder()
      .setColor("#7700ff")
      .setTitle("Settings")
      .setDescription("Use Select Menu below to edit preview");

    const buttons = {
      send: createButton("@Send", "Send", ButtonStyle.Success),
      cancel: createButton("@Cancel", "Cancel", ButtonStyle.Danger),
      return: createButton("@fieldReturn", "Return", ButtonStyle.Secondary),
      addField: createButton("@addField", "Add", ButtonStyle.Success),
      removeField: createButton("@remField", "Remove", ButtonStyle.Danger),
    };

    const menu = new StringSelectMenuBuilder()
      .setCustomId("@Menu")
      .setPlaceholder("Edit Preview")
      .setMaxValues(1)
      .setMinValues(1)
      .setOptions(getMenuOptions());

    const setupComponent = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(menu);
    const buttonComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.cancel, buttons.send);
    const fieldSetupComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(
      buttons.removeField,
      buttons.addField
    );
    const fieldMenuComponent = new ActionRowBuilder<ButtonBuilder>().addComponents(buttons.return);

    const replies = await interaction.reply({
      embeds: [previewEmbed, setupEmbed],
      components: [setupComponent, buttonComponent],
    });

    const filter = (i: any) => i.user.id === member?.user.id;
    const collector = replies.createMessageComponentCollector({
      filter,
      idle: 1000 * 60 * 10,
    });

    let forceStop = false;

    collector.on("collect", async (i: any) => {
      if (forceStop) return;

      const embeds = i.message.embeds[0];
      const setup = i.message.embeds[1];

      switch (i.customId) {
        case "@Cancel":
          forceStop = true;
          return collector.stop();
        case "@Send":
          if (embeds.data.description === "Preview Embeds. Start editing to see changes~") {
            return i.reply({
              content: "Cannot send empty embed or without description!",
              ephemeral: true,
            });
          }
          await channel?.send({ embeds: [embeds] });
          await i.reply({ content: "Embed Sent!", ephemeral: true });
          forceStop = true;
          return collector.stop();
        case "@fieldReturn":
          enableComponents(setupComponent, buttonComponent);
          await i.update({
            embeds: [embeds, setupEmbed],
            components: [setupComponent, buttonComponent],
          });
          break;
        case "@remField":
          if (!embeds.data.fields || embeds.data.fields.length === 0) {
            return i.reply({ content: "No Fields Detected", ephemeral: true });
          }
          embeds.data.fields.pop();
          await i.update({
            embeds: [embeds, setup],
            components: [fieldSetupComponent, fieldMenuComponent],
          });
          break;
        case "@addField": {
          setup.data.description = "Input Fields.\nSend field Name > Value > Inline: true | false";
          disableComponents(fieldSetupComponent, fieldMenuComponent);
          await i.update({
            embeds: [embeds, setup],
            components: [fieldSetupComponent, fieldMenuComponent],
          });

          const msgArr = (
            await i.channel.awaitMessages({
              filter: (m: any) => m.author.id === i.user.id,
              max: 3,
            })
          ).first(3);
          if (msgArr.length < 3) return;

          const fields = {
            name: msgArr[0].content,
            value: msgArr[1].content,
            inline: msgArr[2].content === "true",
          };

          if (!embeds.data.fields) {
            embeds.data.fields = [fields];
          } else {
            embeds.data.fields.push(fields);
          }

          enableComponents(fieldSetupComponent, fieldMenuComponent);
          setup.data.description = "Use the button below to add or remove fields";
          await replies.edit({
            embeds: [embeds, setup],
            components: [fieldSetupComponent, fieldMenuComponent],
          });

          msgArr.forEach((m: { delete: () => any }) => m.delete());
          break;
        }
        case "@Menu": {
          setupComponent.components[0].setDisabled(true);
          buttonComponent.components[1].setDisabled(true);
          const selectedOption = i.values[0];
          if (selectedOption === "timestamp") {
            embeds.data.timestamp = embeds.data.timestamp ? undefined : new Date(Date.now()).toISOString();
            i.update({
              embeds: [embeds, setupEmbed],
            });
          } else {
            setup.data.description =
              "Modify by sending message to the channel\n-# For image you can upload image directly or use direct url";

            await i.update({
              embeds: [embeds, setup],
              components: [setupComponent, buttonComponent],
            });
            const msg = (
              await i.channel.awaitMessages({
                filter: (m: any) => m.author.id === i.user.id,
                max: 1,
              })
            ).first();
            if (!msg) return;

            const attachment = msg.attachments.first();
            updateEmbedField(embeds, selectedOption, msg.content, attachment);

            setupComponent.components[0].setDisabled(false);
            buttonComponent.components[1].setDisabled(false);
            await replies.edit({
              embeds: [embeds, setupEmbed],
              components: [setupComponent, buttonComponent],
            });
            setTimeout(() => msg.delete(), 2500);
          }
          break;
        }
      }
    });

    collector.on("end", () => {
      if (!forceStop && replies) {
        interaction.followUp({
          content: "Embed Editor closed due to inactivity.",
          ephemeral: true,
        });
      }
      replies.delete();
    });
  }
);

function createButton(customId: string, label: string, style: ButtonStyle) {
  return new ButtonBuilder().setCustomId(customId).setLabel(label).setStyle(style);
}

function getMenuOptions() {
  return [
    createMenuOption("Author", "Author section of the embeds", "author"),
    createMenuOption("Author Icon", "Icon of the author section of the embeds", "author-icon"),
    createMenuOption("Title", "Title of the embeds", "title"),
    createMenuOption("Title Url", "Url of the title of the embeds", "title-url"),
    createMenuOption("Description", "Description of the embeds", "description"),
    createMenuOption("Color", "Color of the embeds", "color"),
    createMenuOption("Attachment", "Attachment of the embeds", "image"),
    createMenuOption("Thumbnail", "Thumbnail of the embeds", "thumbnail"),
    createMenuOption("Footer", "Footer of the embeds", "footer"),
    createMenuOption("Footer Icon", "Icon of the Footer of the embeds", "footer-icon"),
    createMenuOption("Timestamp", "Toggle timestamp on the embeds", "timestamp"),
    createMenuOption("Field Settings", "Add or Remove a Fields section to the embeds", "fields"),
  ];
}

function createMenuOption(label: string, description: string, value: string) {
  return new StringSelectMenuOptionBuilder().setLabel(label).setDescription(description).setValue(value);
}

function updateEmbedField(embeds: any, option: string, content: string, attachment: any) {
  switch (option) {
    case "author":
      embeds.data.author = { ...embeds.data.author, name: content };
      break;
    case "author-icon":
      embeds.data.author = { ...embeds.data.author, icon_url: validateImage(attachment, content) };
      break;
    case "title":
      embeds.data.title = content;
      break;
    case "title-url":
      if (content.startsWith("https://")) embeds.data.url = content;
      break;
    case "description":
      embeds.data.description = content;
      break;
    case "color":
      if (/^#?([a-fA-F0-9]{6}|[a-fA-F0-9]{3})$/i.test(content)) {
        embeds.data.color = hexToInt(content);
      }
      break;
    case "image":
      embeds.data.image = { url: validateImage(attachment, content) };
      break;
    case "thumbnail":
      embeds.data.thumbnail = { url: validateImage(attachment, content) };
      break;
    case "footer":
      embeds.data.footer = { ...embeds.data.footer, text: content };
      break;
    case "footer-icon":
      embeds.data.footer = { ...embeds.data.footer, icon_url: validateImage(attachment, content) };
      break;
  }
}

function validateImage(attachment: any, content: string) {
  if (attachment && attachment.contentType.includes("image")) return attachment.url;
  if (content.startsWith("https://")) return content;
  return "";
}

function disableComponents(...components: any[]) {
  components.forEach((component) => component.components.forEach((c: any) => c.setDisabled(true)));
}

function enableComponents(...components: any[]) {
  components.forEach((component) => component.components.forEach((c: any) => c.setDisabled(false)));
}

function hexToInt(input: string) {
  return parseInt(input.replace(/^#([\da-f])([\da-f])([\da-f])$/i, "#$1$1$2$2$3$3").substring(1), 16);
}
