import axios from "axios";
import { stripIndent } from "common-tags";
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, EmbedBuilder
} from "discord.js";

import { Precommand } from "@typings/modules/component";

const githubInfo: Precommand = {
  name: "github",
  description: "Get information about the bot's github repository",
  examples: ["github <repository>"],
  nsfw: false,
  category: "public",
  owner: false,
  cooldown: 10,
  aliases: ["gh"],
  subcommands: ["github get <URL of the repository> - Get information about the repository"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const subcommand = args[0];
    switch (subcommand) {
      case "get":
        {
          const repo = args[0];
          if (!repo)
            return message.channel.send({
              embeds: [
                client.embed({
                  description: [
                    `${client.getEmoji(message.guild.id).error} You need to provide a repository name to get information!`,
                    `Usage: \`${prefix}github-info <repository>\``,
                  ].join("\n"),
                  color: "Red",
                }),
              ],
            });

          const regex = /https:\/\/github\.com\/([^\\/]+)\/([^\\/]+)(\/|$)/;
          const match = repo.match(regex);
          if (!match) return;

          const username = match[1];
          const repository = match[2];

          console.log(username, repository);
          if (!username || !repository)
            return message.channel.send({
              embeds: [
                client.embed({
                  description: [
                    `${client.getEmoji(message.guild.id).error} The repository provided is invalid or does not exist!`,
                    `Usage: \`${prefix}github-info <repository>\``,
                  ].join("\n"),
                  color: "Red",
                }),
              ],
            });

          const res = await axios
            .get(`https://api.github.com/repos/${username}/${repository}`)
            .catch(() => null);
          if (!res) {
            return message.channel.send({
              embeds: [
                client.embed({
                  description: [
                    `${client.getEmoji(message.guild.id).error} The repository provided is invalid or does not exist!`,
                    `The error occurred in the axios request to the Github API`,
                  ].join("\n"),
                  color: "Red",
                }),
              ],
            });
          }

          const body = res.data;
          const size =
            body.size <= 1024
              ? `${body.size} KB`
              : Math.floor(body.size / 1024) > 1024
                ? `${(body.size / 1024 / 1024).toFixed(2)} GB`
                : `${(body.size / 1024).toFixed(2)} MB`;
          const license =
            body.license && body.license.name && body.license.url
              ? `[${body.license.name}](${body.license.url})`
              : (body.license && body.license.name) || "None";
          const footer = [];
          if (body.fork) footer.push(`❯ **Forked** from [${body.parent.full_name}](${body.parent.html_url})`);
          if (body.archived) footer.push("❯ This repository is **Archived**");

          const embed = new EmbedBuilder()
            .setAuthor({
              name: `Github Repository - ${body.full_name}`,
              iconURL: message.author.displayAvatarURL(),
            })
            .setFields(
              {
                name: "__**Repository Information**__",
                value: stripIndent`
                > **Id:** ${body.id}
                > **Size:** ${size}
                > **License:** ${license}
                > **Fork:** ${body.fork ? "Yes" : "No"}
                > **Archived:** ${body.archived ? "Yes" : "No"}
                > **Created At:** ${new Date(body.created_at).toDateString()}
              `,
                inline: false,
              },
              {
                name: "__**Information about the Owner**__",
                value: stripIndent`
                > **Name:** ${body.owner.login}
                > **Type:** ${body.owner.type}
                > **Site Admin:** ${body.owner.site_admin ? "Yes" : "No"}
                > **Url:** [Link](${body.owner.html_url})
                > **Avatar:** [Link](${body.owner.avatar_url})
                > **Id:** ${body.owner.id}
              `,
                inline: false,
              },
              {
                name: "__**Links**__",
                value: stripIndent`
                > **Repository:** [Link](${body.html_url})
                > **Issues:** [Link](${body.html_url}/issues)
                > **Pull Requests:** [Link](${body.html_url}/pulls)
                > **Commits:** [Link](${body.html_url}/commits)
                > **Releases:** [Link](${body.html_url}/releases)
              `,
                inline: false,
              }
            )
            .setColor("Blurple")
            .setFooter({
              text: `Requested by ${message.author.tag} - ${message.author.id}`,
              iconURL: message.author.displayAvatarURL(),
            });

          const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
            new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Repository").setURL(body.html_url),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel("Issues")
              .setURL(`${body.html_url}/issues`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel("Pull Requests")
              .setURL(`${body.html_url}/pulls`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel("Commits")
              .setURL(`${body.html_url}/commits`),
            new ButtonBuilder()
              .setStyle(ButtonStyle.Link)
              .setLabel("Releases")
              .setURL(`${body.html_url}/releases`)
          );

          return message.channel.send({
            embeds: [embed],
            components: [button],
            content: [
              `> **Author:** ${body.name} (${body.full_name})`,
              `> **Description:** ${body.description || "No description provided"}`,
              `> **Information:** ${footer.join("\n") || "None"}`,
            ].join("\n"),
          });
        }
        break;
    }
  },
};
export = githubInfo;
