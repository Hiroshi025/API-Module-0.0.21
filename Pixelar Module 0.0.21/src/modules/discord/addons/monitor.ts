import axios from "axios";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ClientUser } from "discord.js";
import os from "os";

import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { Addons } from "@modules/discord/class/addons";
import { ConfigGit } from "@modules/gitbook/config";
import { GitBook } from "@modules/gitbook/gitbook";

import _package from "../../../../package.json";

const configuration = {
  enabled: false,
  timeout: 60000,
  website: "",
  messageId: "",
  channelId: "",
  emojis: {
    database: "📊",
    bot: "🤖",
    delete: "🗑️",
    web: "🌐",
    docs: "📚",
  },
};

export default new Addons(
  {
    name: "Monitor",
    description: "monitoring the web site, bot, and more",
    author: "Mika",
    version: "0.0.1",
    bitfield: ["SendMessages"],
  },
  async (client) => {
    setInterval(async () => {
      if (configuration.enabled === false) return;
      logWithLabel("custom", "Monitor Addon is running RUN.", "Addons");
      await Monitor();
    }, configuration.timeout);
    async function Monitor() {
      let status;
      const res = await axios.get(configuration.website);
      if (res.status === 200) status = true;
      else if (res.status === 404) status = false;

      const timestamp = `<t:${Math.floor((client.user as ClientUser).createdTimestamp / 1000)}:R>`;
      const stats = await client.utils.getStats();
      const uptime = await client.utils.Uptime();

      const embed = new Embed()
        .setAuthor({
          name: `Monitor Manager - ${config.name}`,
          iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
        })
        .setTitle("Monitor Addon - 0.0.1")
        .setDescription(
          [
            `**Name Proyect:** ${_package.name} v${_package.version}`,
            `**Author:** ${_package.author}`,
            `**Created Bot:** ${client.user ? timestamp : "Unknown"}`,
          ].join("\n")
        )
        .setFields(
          {
            name: "__Website Status__",
            value: [
              `> **URL:** [Click Here](${configuration.website})`,
              `> **Status:** ${status ? "🟢 Online" : "🔴 Offline"}`,
            ].join("\n"),
            inline: true,
          },
          {
            name: "__Machine Info__",
            value: [
              `> **Machine:** \`${stats.machine}\` - \`${os.platform()}\``,
              `> **Version:** \`${stats.version}\` - \`${os.release()}\``,
            ].join("\n"),
            inline: true,
          },
          {
            name: "__Memory Usage__",
            value: [
              `> **Memory Usage Extends:*** \`${stats.totalMemory}\` GB - \`${stats.freeMemory}\` GB`,
              `> **Memory Usage Heap:** \`${stats.ram}\` MB`,
            ].join("\n"),
            inline: false,
          },
          {
            name: "__Uptime__",
            value: [`> **Uptime:** ${uptime}`].join("\n"),
          },
          {
            name: "__Bot Components__",
            value: [
              `> **Precommands:** \`${client.precommands.size}\``,
              `> **Commands:** \`${client.commands.size}\``,
              `> **Menus:** \`${client.menus.size}\``,
            ].join("\n"),
            inline: true,
          },
          {
            name: "__Bot Integrations__",
            value: [
              `> **Buttons:** \`${client.buttons.size}\``,
              `> **Modals:** \`${client.modals.size}\``,
              `> **Addons:** \`${client.addons.size}\``,
            ].join("\n"),
            inline: true,
          }
        );

      const Mbutton = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji(configuration.emojis.delete)
          .setCustomId("monitor:database-delete")
          .setLabel("Delete DB"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setCustomId("monitor:database-restart")
          .setEmoji(configuration.emojis.database)
          .setLabel("Restart DB"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Primary)
          .setEmoji(configuration.emojis.bot)
          .setCustomId("monitor:bot-restart")
          .setLabel("Restart Bot")
      );

      const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setEmoji(configuration.emojis.web)
          .setURL(process.env.WEB as string)
          .setLabel("Website"),
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setEmoji(configuration.emojis.docs)
          .setURL(process.env.DOCS as string)
          .setLabel("Documentation")
      );

      const message = await client.utils.getMessage(configuration.channelId, configuration.messageId);
      if (!message) return;

      //******** Gitbook Documentation ********//

      const documentation = new GitBook();
      const space = await documentation.SpaceDocs(ConfigGit.spaceId);
      if (space) {
        const embed_gitbook = new Embed()
          .setTitle("Gitbook - Documentation")
          .setDescription(
            [
              `> **Created At:** <t:${Math.floor(new Date(space.createdAt).getTime() / 1000)}:R>`,
              `> **ID:** ${space.id}`,
              `> **Creator:** ${space.creator.username}`,
            ].join("\n")
          )
          .setURL(space.header.url)
          .setFields(
            {
              name: "__Description Documentation__",
              value: space.header.description.slice(0, 500).concat("..."),
              inline: false,
            },
            {
              name: "__Pages__",
              value: [
                `> **Total Pages:** ${space.pages.length}`,
                `> **First Page:** [${space.pages[0].title}](${space.pages[0].url})`,
              ].join("\n"),
              inline: true,
            }
          );

        message.edit({ embeds: [embed, embed_gitbook], components: [Mbutton, buttons] }).catch((err) => {
          logWithLabel("error", err, "Monitor");
          return;
        });

        //******** Gitbook Documentation ********//
      } else {
        message.edit({ embeds: [embed], components: [Mbutton, buttons] }).catch((err) => {
          logWithLabel("error", err, "Monitor");
          return;
        });
      }
    }
  }
);
