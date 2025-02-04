import { Message } from "discord.js";

import { manager } from "@/index";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { BotClient } from "@modules/discord/class/client";

import { EconomyUtils } from "../utils";

export const RobCommand = {
  Message: async (message: Message, client: BotClient, args: string[]) => {
    if (!message.guild || !message.channel || !message.member) return;
    const user = message.mentions.users.first() || message.guild.members.cache.get(args[0])?.user;
    if (!user) {
      return message.reply({
        embeds: [new ErrorEmbed(message.guild.id).setDescription("Please mention a user to rob!")],
      });
    }

    const userBalance = await EconomyUtils.fetchBalance(user?.id as string, message.guild.id);

    const robChance = Math.floor(Math.random() * 100) + 1;
    const robAmount = Math.floor(Math.random() * userBalance.balance) + 1;

    if (robChance > 50) {
      await manager.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: userBalance.balance - robAmount },
      });
      await manager.prisma.userEconomy.update({
        where: { id: userBalance.id },
        data: { balance: userBalance.balance + robAmount },
      });

      return message.reply({
        embeds: [
          new Embed().setDescription(
            [
              `${client.getEmoji(message.guild.id).success} You successfully robbed ${user}!`,
              `You stole $${robAmount} from them.`,
            ].join("\n")
          ),
        ],
      });
    } else {
      return message.reply({
        embeds: [
          new ErrorEmbed(message.guild.id).setDescription(
            [
              `${client.getEmoji(message.guild.id).error} You failed to rob ${user}!`,
              `You lost $${robAmount} in the process.`,
            ].join("\n")
          ),
        ],
      });
    }
  },
};
