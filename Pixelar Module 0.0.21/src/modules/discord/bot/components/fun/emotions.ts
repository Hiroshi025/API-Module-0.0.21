import axios from "axios";
import { AttachmentBuilder, ChannelType, EmbedBuilder, TextChannel } from "discord.js";
import { NekoClient } from "eternal-support";

import emojis from "@config/json/emojis.json";
import { ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { logWithLabel } from "@lib/utils/log";
import { Precommand } from "@typings/modules/component";

async function animeApi(action: string) {
  try {
    const res = await axios.get(`https://api.waifu.pics/sfw/${action}`);
    return res.data.url;
  } catch (err) {
    logWithLabel("error", `Error in animeApi: ${err}`);
  }
}

const emotionsCommand: Precommand = {
  name: "emotions",
  description: "Get a list of emotions",
  examples: [
    "emotions baka",
    "emotions eightball",
    "emotions slap",
    "emotions kiss",
    `anime alert [text]`,
    `anime biden [text]`,
    `anime cringe`,
    `anime facts [text]`,
    `anime handhold [user]`,
    `anime waifu`,
  ],
  subcommands: [
    "emotions baka [user]: Baka someone",
    "emotions eightball [text]: 8Ball",
    "emotions slap [user]: Slap someone",
    "emotions kiss [user]: Kiss someone",
    "emotions tickle [user]: Tickle someone",
    "anime alert [text]",
    "anime biden [text]",
    "anime cringe",
    "anime facts [text]",
    "anime handhold [user]",
    "anime waifu",
  ],
  nsfw: false,
  category: "fun",
  owner: false,
  cooldown: 2,
  aliases: ["emoticons"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const nekoclient = new NekoClient();
    const subcommand = args[0];
    switch (subcommand) {
      case "eightball":
        {
          const text = args.join(" ");
          if (!text)
            return message.channel.send({
              embeds: [
                new ErrorEmbed(message.guild.id as string).setDescription(
                  [
                    `${emojis.error} **${message.author.username}**, You need to provide a text!`,
                    `> **Usage:** \`${prefix}8ball [text]\``,
                  ].join("\n")
                ),
              ],
            });

          await nekoclient
            .eightBall({ text: text })
            .then((result: { response: string | null; url: string }) => {
              const embed = new EmbedBuilder()
                .setTitle(`8Ball ${message.author.username}`)
                .setColor("Random")
                .setFooter({
                  text: `Requested by ${message.author.username}`,
                  iconURL: message.author.displayAvatarURL(),
                })
                .setDescription(result.response)
                .setImage(result.url as string);
              (message.channel as TextChannel).send({ embeds: [embed] });
            });
        }
        break;
      case "slap":
        {
          try {
            const user = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
              .setTitle("Emotions Commands")
              .setDescription(`${message.author} A slapped *${user}* hard`)
              .setImage((await nekoclient.slap()).url);
            message.channel.send({ embeds: [embed] });
          } catch (error) {
            logWithLabel("error", `Error in slap: ${error}`);
            message.channel.send({
              embeds: [
                new ErrorEmbed(message.guild.id as string).setDescription(
                  [
                    `${emojis.error} **${message.author.username}**, You need to provide a text!`,
                    `> **Usage:** \`${prefix}slap [text]\``,
                  ].join("\n")
                ),
              ],
            });
          }
        }
        break;
      case "kiss":
        {
          try {
            const user = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
              .setTitle("Emotions Commands")
              .setDescription(`${message.author} A kissed *${user}*`)
              .setImage((await nekoclient.kiss()).url);
            message.channel.send({ embeds: [embed] });
          } catch (error) {
            logWithLabel("error", `Error in kiss: ${error}`);
            message.channel.send({
              content: [
                `${emojis.error} **${message.author.username}**, You need to provide a text!`,
                `> **Usage:** \`${prefix}kiss [text]\``,
              ].join("\n"),
            });
          }
        }
        break;
      case "tickle":
        {
          try {
            const user = message.mentions.users.first() || message.author;
            const embed = new EmbedBuilder()
              .setTitle("Emotions Commands")
              .setDescription(`${message.author} He is tickling *${user}*`)
              .setImage((await nekoclient.kiss()).url);
            message.channel.send({ embeds: [embed] });
          } catch (error) {
            logWithLabel("error", `Error in tickle: ${error}`);
            message.channel.send({
              content: [
                `${emojis.error} **${message.author.username}**, You need to provide a text!`,
                `> **Usage:** \`${prefix}tickle [text]\``,
              ].join("\n"),
            });
          }
        }
        break;
      case "alert":
        {
          const texto = args.slice(1).join(" ");
          if (!texto)
            return message.channel.send(
              [
                `${emojis.error} You must enter a text to generate the image`,
                `Example: \`${prefix}anime alert Hello World\``,
              ].join("\n")
            );

          const attachment = new AttachmentBuilder(
            `https://api.popcat.xyz/alert?text=${encodeURIComponent(texto)}`,
            {
              name: "image.png",
            }
          );

          message.channel.send({ files: [attachment] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} An error occurred while executing the command, try again later`,
                `plase report this error to the support server.`,
              ].join("\n"),
            });
          });
        }
        break;
      case "biden":
        {
          const texto = args.slice(1).join(" ");
          if (!texto)
            return message.reply(
              [
                `${emojis.error} You must enter a text to generate the image`,
                `Example: \`${prefix}anime biden Hello World\``,
              ].join("\n")
            );

          const attachment = new AttachmentBuilder(
            `https://api.popcat.xyz/biden?text=${encodeURIComponent(texto)}`,
            {
              name: "image.png",
            }
          );

          message.channel.send({ files: [attachment] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} An error occurred while executing the command, try again later`,
                `plase report this error to the support server.`,
              ].join("\n"),
            });
          });
        }
        break;
      case "cringe":
        {
          const data = await animeApi("cringe");
          const prettyCringe = new EmbedBuilder()
            .setColor("Grey")
            .setAuthor({
              name: `${message.author.username} thinks that's pretty embarrassing.`,
              iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
            })
            .setImage(data)
            .setTimestamp();
          message.reply({ embeds: [prettyCringe] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} An error occurred while executing the command, try again later`,
                `plase report this error to the support server.`,
              ].join("\n"),
            });
          });
        }
        break;
      case "facts":
        {
          const texto = args.slice(1).join(" ");
          if (texto)
            return message.reply(
              [
                `${emojis.error} You must enter a text to generate the image`,
                `Example: \`${prefix}anime facts Hello World\``,
              ].join("\n")
            );

          const attachment = new AttachmentBuilder(
            `https://api.popcat.xyz/facts?text=${encodeURIComponent(texto)}`,
            {
              name: "image.png",
            }
          );

          message.channel.send({ files: [attachment] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} An error occurred while executing the command, try again later`,
                `plase report this error to the support server.`,
              ].join("\n"),
            });
          });
        }
        break;
      case "handhold":
        {
          const data = await animeApi("handhold");
          const user = message.mentions.users.first();
          if (!user)
            return message.channel.send(
              [
                `${emojis.error} You must mention a user to interact with.`,
                `Example: \`${prefix}anime handhold @user\``,
              ].join("\n")
            );

          if (user.id === message.author.id)
            return message.channel.send(
              [
                `${emojis.error} You can't interact with yourself.`,
                `Example: \`${prefix}anime handhold @user\``,
              ].join("\n")
            );

          if (user.id === client.user?.id)
            return message.channel.send(
              [
                `${emojis.error} You can't interact with me that's too sad.`,
                `Example: \`${prefix}anime handhold @user\``,
              ].join("\n")
            );

          if (user.bot)
            return message.channel.send(
              [
                `${emojis.error} You can't interact with bots.`,
                `Example: \`${prefix}anime handhold @user\``,
              ].join("\n")
            );

          const lonerhld = new EmbedBuilder()
            .setColor("Grey")
            .setAuthor({
              name: `${message.author.username} is holding hands with ${client.user?.username}!`,
              iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
            })
            .setImage(data)
            .setTimestamp();

          if (user.id === message.author.id)
            return message.reply({ embeds: [lonerhld] }).catch(() => {
              message.reply({
                content: [
                  ` ${emojis.error} An error occurred while executing the command, try again later`,
                  `plase report this error to the support server.`,
                ].join("\n"),
              });
            });

          const handholdEmbed = new EmbedBuilder()
            .setColor("Grey")
            .setAuthor({
              name: `${message.author.username} is holding hands with ${user.username}!`,
              iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
            })
            .setImage(data)
            .setTimestamp();
          message.reply({ embeds: [handholdEmbed] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} An error occurred while executing the command, try again later`,
                `plase report this error to the support server.`,
              ].join("\n"),
            });
          });
        }
        break;
      case "waifu":
        {
          const data = await animeApi("waifu");
          const prettyCringe = new EmbedBuilder()
            .setColor("Grey")
            .setAuthor({
              name: `${message.author.username} here is a cute waifu with you`,
              iconURL: `${message.author.avatarURL({ forceStatic: true })}`,
            })
            .setImage(data)
            .setTimestamp();
          message.reply({ embeds: [prettyCringe] }).catch(() => {
            message.reply({
              content: [
                ` ${emojis.error} An error occurred while executing the command, try again later`,
                `plase report this error to the support server.`,
              ].join("\n"),
            });
          });
        }
        break;
    }
  },
};
export = emotionsCommand;
