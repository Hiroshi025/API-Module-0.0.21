/* eslint-disable @typescript-eslint/no-explicit-any */
import chalk from "chalk";
import { ChannelType, TextChannel } from "discord.js";

import { client, manager } from "@/index";
import { ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { Event } from "@modules/discord/class/builders";
import { Economy } from "@modules/discord/utils/economy/utils";
import { Ranking } from "@modules/discord/utils/ranking";
import { TicketManager } from "@modules/discord/utils/ticket-manager";
import { Precommand } from "@typings/modules/component";

export default new Event("messageCreate", async (message) => {
  if (!message.guild?.members.me?.permissions.has("SendMessages")) return;
  if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText || message.author.bot) return;

  //***************************************************************************
  await client.utils.createUser(message.author.id, message.guild.id, client);
  await client.utils.createGuild(message.guild.id, client);
  await Ranking(message, client);
  await TicketManager(message);
  await Economy(message);
  //************************************************************************

  const data = await manager.prisma.guild.findUnique({
    where: { guildId: message.guild.id },
  });
  if (!data) return;

  if (!message.content.startsWith(data.prefix)) return;
  const args = message.content.slice(data.prefix?.length).trim().split(/ +/g);

  const cmd = args.shift()?.toLowerCase();
  const command: Precommand =
    (client.precommands.get(cmd ?? "") as Precommand) ||
    (client.precommands.find((c: any) => c?.aliases?.includes(cmd ?? "")) as Precommand);

  if (!command) return;

  //HACK: CUanta la cantidad de mensajes enviados por el usuario
  await manager.prisma.user.update({
    where: { userId: message.author.id },
    data: { messages: { increment: 1 } },
  });

  if (command.owner && !client.config.bot.owners.includes(message.author.id))
    return message.channel.send({
      embeds: [
        new ErrorEmbed(message.guild.id).setDescription(
          [
            `${client.getEmoji(message.guild.id).error} You do not have permission to use this command as it is reserved for the bot owner.`,
            `If you believe this is a mistake, please contact the bot owner.`,
          ].join("\n")
        ),
      ],
    });

  const language = message.guild.preferredLocale;
  if (command.nsfw && !(message.channel as TextChannel).nsfw)
    return message.channel.send({
      embeds: [
        new ErrorEmbed(message.guild.id)
          .setTitle("Pixel Web - Bot Core")
          .setDescription(
            [
              `${client.getEmoji(message.guild.id).error} You can only use this command in a NSFW channel.`,
              `If you believe this is a mistake, please contact the server staff.`,
            ].join("\n")
          ),
      ],
    });

  if (command.permissions && !message.member?.permissions.has(command.permissions))
    return message.channel.send({
      embeds: [
        new ErrorEmbed(message.guild.id)
          .setTitle("Pixel Web - Bot Core")
          .setDescription(
            [
              `${client.getEmoji(message.guild.id).error} You do not have permission to use this command.`,
              `If you believe this is a mistake, please contact the server staff.`,
            ].join("\n")
          ),
      ],
    });

  if (command.botpermissions && !message.guild.members.me?.permissions.has(command.botpermissions))
    return message.channel.send({
      embeds: [
        new ErrorEmbed(message.guild.id)
          .setTitle("Pixel Web - Bot Core")
          .setDescription(
            [
              `${client.getEmoji(message.guild.id).error} I do not have permission to execute this command.`,
              `If you believe this is a mistake, please contact the server staff.`,
            ].join("\n")
          ),
      ],
    });

  if (command.cooldown) {
    const cooldownType = command.cooldownType || "user";
    const cooldownKey =
      cooldownType === "server"
        ? `${message.guild.id}${command.name}`
        : `${message.author.id}${command.name}`;
    const cooldownDuration = command.cooldown * 1000;

    const currentTimestamp = Date.now();
    const cooldownTimestamp = client.cooldown.get(cooldownKey);

    if (cooldownTimestamp && currentTimestamp < cooldownTimestamp + cooldownDuration) {
      const expirationTime = cooldownTimestamp + cooldownDuration;
      const timeLeft = Math.floor(expirationTime / 1000);

      return message.channel.send({
        embeds: [
          new ErrorEmbed(message.guild.id)
            .setTitle("Pixel Web - Bot Core")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id).error} You are on cooldown for this command.`,
                `Please wait <t:${timeLeft}:R> before using this command again.`,
              ].join("\n")
            ),
        ],
      });
    }

    client.cooldown.set(cooldownKey, currentTimestamp);
    setTimeout(() => {
      client.cooldown.delete(cooldownKey);
    }, cooldownDuration);
  }

  command.execute(client, message, args, data.prefix, language, config);
  logWithLabel(
    "info",
    [
      `${chalk.cyanBright(`${data.prefix}${command.name}`)} -> ${chalk.grey(message.author.username)} in ${chalk.grey(message.guild.name)}`,
      `  ➜  ${chalk.grey("Ready:")} Yes ${new Date().toLocaleString()}`,
      `  ➜  ${chalk.grey("Command:")} ${command.name}`,
      `  ➜  ${chalk.grey("Interaction:")} Prefix-Cmd`,
    ].join("\n")
  );
});
