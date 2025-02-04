/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	AttachmentBuilder, ChannelType, GuildMember, PermissionFlagsBits, roleMention, User
} from "discord.js";

import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Precommand } from "@typings/modules/component";

const infoCommand: Precommand = {
  name: "info",
  description: "Discord application information, bots, server, etc.",
  examples: ["info user"],
  nsfw: false,
  category: "public",
  owner: false,
  cooldown: 5,
  aliases: ["bot", "discord"],
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  subcommands: ["info user <@user>"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const guild = message.guild;
    const subcoomands = args[0];
    switch (subcoomands) {
      case "user":
        {
          const user = message.mentions.users.first() || message.author;
          const member = message.guild.members.cache.get(user.id);
          if (!member) return;

          const embed = new Embed()
            .setTitle(`Informations about ${user.username}`)
            .setDescription(
              [
                `> **Tag:** ${user.tag} (\`${user.id}\`)`,
                `> **Bot:** ${user.bot ? "Yes" : "No"}`,
                `> **Created:** <t:${Math.floor(user.createdTimestamp / 1000)}:R>`,
                `> **Joined:** ${member ? `<t:${Math.floor(member.joinedTimestamp! / 1000)}:R>` : "No Member"}`,
              ].join("\n")
            )
            .setThumbnail(user.displayAvatarURL({ forceStatic: true }))
            .setImage("attachment://user-card.png")
            .setFields(
              {
                name: `__Network__`,
                value: [
                  `> **Activity:** ${
                    member.presence?.activities
                      ? member.presence.activities.map((activity: { name: any }) => activity.name).join(", ")
                      : "No Activity"
                  }`,
                  `> **Device:** ${member.presence?.clientStatus?.desktop || "No Device"}`,
                ].join("\n"),
                inline: true,
              },
              {
                name: `__Security__`,
                value: [
                  `> **Roles:** ${member?.roles.cache.size || "No Roles"}`,
                  `> **System:** ${user.system ? "Yes" : "No"}`,
                ].join("\n"),
                inline: true,
              },
              {
                name: "\u200b",
                value: "\u200b",
                inline: false,
              },
              {
                name: `__Images__`,
                value: [
                  `> **Avatar:** ${
                    user.displayAvatarURL({ forceStatic: true })
                      ? `[Click Here](${user.displayAvatarURL({ forceStatic: true })})`
                      : "No Avatar"
                  }`,
                  `> **Banner:** ${user.bannerURL() ? `[Click Here](${user.bannerURL()})` : "No Banner"}`,
                  `> **Icon:** ${user.displayAvatarURL() ? `[Click Here](${user.displayAvatarURL()})` : "No Icon"}`,
                ].join("\n"),
                inline: true,
              },
              {
                name: `__Adittional Information__`,
                value: [
                  `> **Owner Server:** ${member.permissions.has(PermissionFlagsBits.Administrator) ? "Yes" : "No"}`,
                  `> **Kickable:** ${member.kickable ? "Yes" : "No"}`,
                  `> **Bannable:** ${member.bannable ? "Yes" : "No"}`,
                ].join("\n"),
                inline: true,
              },
              {
                name: `__Roles__`,
                value: member.roles.cache
                  .map((role: { id: any }) => roleMention(role.id))
                  .join(", ")
                  .substring(0, 1024),
                inline: false,
              }
            );

          const attachment = await createUserCard(user, member);
          await message.channel.send({ files: [attachment], embeds: [embed] });
        }
        break;
      case "role":
        {
          const role = message.mentions.roles.first() || message.guild.roles.cache.get(args[1]);
          if (!role)
            return message.reply({
              embeds: [
                new ErrorEmbed(guild.id).setDescription(
                  [
                    `${client.getEmoji(guild.id).error} Role not found in the server`,
                    `> **Usage:** \`${prefix}${this.name} role <@role>\``,
                  ].join("\n")
                ),
              ],
            });

          const embed = new Embed()
            .setTitle(`Informations about ${role.name}`)
            .setDescription(
              [
                `> **Name:** ${role.name}`,
                `> **ID:** ${role.id}`,
                `> **Color:** ${role.hexColor}`,
                `> **Created:** <t:${Math.floor(role.createdTimestamp / 1000)}:R>`,
              ].join("\n")
            )
            .setFields(
              {
                name: `__Permissions__`,
                value: role.permissions.toArray().join(", "),
                inline: false,
              },
              {
                name: `__Adittional Information__`,
                value: [
                  `> **Hoist:** ${role.hoist ? "Yes" : "No"}`,
                  `> **Managed:** ${role.managed ? "Yes" : "No"}`,
                  `> **Mentionable:** ${role.mentionable ? "Yes" : "No"}`,
                ].join("\n"),
                inline: true,
              }
            )
            .setThumbnail(
              `https://dummyimage.com/128/${role.hexColor.slice(1)}/ffffff&text=${encodeURIComponent(role.name)}`
            );

          await message.channel.send({ embeds: [embed] });
        }
        break;
    }

    async function createUserCard(user: User, member: GuildMember) {
      const canvas = createCanvas(800, 400);
      const ctx = canvas.getContext("2d");

      // Fondo oscuro
      ctx.fillStyle = "#0a0a0a"; // Negro suave
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Añadir bordes redondeados
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(20, 0);
      ctx.arcTo(canvas.width, 0, canvas.width, canvas.height, 20);
      ctx.arcTo(canvas.width, canvas.height, 0, canvas.height, 20);
      ctx.arcTo(0, canvas.height, 0, 0, 20);
      ctx.arcTo(0, 0, canvas.width, 0, 20);
      ctx.closePath();
      ctx.clip();

      // Fondo de contenido con degradado oscuro claro
      const contentGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      contentGradient.addColorStop(0, "#1f1f1f"); // Gris oscuro
      contentGradient.addColorStop(1, "#333333"); // Gris más claro

      ctx.fillStyle = contentGradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Avatar del usuario con borde blanco
      const avatar = await loadImage(user.displayAvatarURL({ extension: "png", size: 128 }));
      const avatarX = 30;
      const avatarY = 30;
      const avatarSize = 128;

      ctx.save();
      ctx.beginPath();
      ctx.arc(avatarX + avatarSize / 2, avatarY + avatarSize / 2, avatarSize / 2 + 5, 0, Math.PI * 2, true);
      ctx.fillStyle = "#ffffff";
      ctx.fill();
      ctx.clip();

      ctx.drawImage(avatar, avatarX, avatarY, avatarSize, avatarSize);
      ctx.restore();

      // Marca de agua diagonal
      ctx.save();
      ctx.font = "bold 30px Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.2)";
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-Math.PI / 4);
      ctx.textAlign = "center";
      ctx.fillText("PIXEL STUDIO", 0, 0);
      ctx.restore();

      // Información del usuario
      ctx.fillStyle = "#f5f6fa";
      ctx.font = "28px Arial";
      ctx.fillText(`${user.username}`, 180, 60);
      ctx.font = "22px Arial";
      ctx.fillText(`#${user.discriminator}`, 180, 90);

      ctx.font = "18px Arial";
      ctx.fillText(`ID: ${user.id}`, 180, 120);
      ctx.fillText(`Bot: ${user.bot ? "Yes" : "No"}`, 180, 150);
      ctx.fillText(`Created: ${new Date(user.createdTimestamp).toLocaleDateString("es-ES")}`, 180, 180);
      ctx.fillText(
        `Joined: ${member ? new Date(member.joinedTimestamp as number).toLocaleDateString("es-ES") : "No Member"}`,
        180,
        210
      );

      // Información adicional
      ctx.fillText(`Network`, 30, 250);
      ctx.fillText(
        `Activity: ${
          member.presence?.activities
            ? member.presence.activities.map((activity) => activity.name).join(", ")
            : "No Activity"
        }`,
        30,
        280
      );
      ctx.fillText(`Device: ${member.presence?.clientStatus?.desktop || "No Device"}`, 30, 310);

      ctx.fillText(`Security`, 400, 250);
      ctx.fillText(`Roles: ${member?.roles.cache.size || "No Roles"}`, 400, 280);
      ctx.fillText(`System: ${user.system ? "Yes" : "No"}`, 400, 310);

      ctx.fillText(`Roles`, 30, 350);
      const rolesText = member.roles.cache.map((role) => role.name).join(", ");
      ctx.fillText(rolesText.substring(0, 64), 30, 380);

      // Pie de página con derechos de autor
      ctx.fillStyle = "#f5f6fa";
      ctx.font = "16px Arial";
      //ctx.fillText('Studio: Pixel Studio Panel', 30, canvas.height - 30);
      ctx.fillText("© 2024 Pixel Studio. All rights reserved.", canvas.width - 300, canvas.height - 30);

      const attachment = new AttachmentBuilder(canvas.toBuffer("image/png"), { name: "user-card.png" });
      return attachment;
    }
  },
};
export = infoCommand;
