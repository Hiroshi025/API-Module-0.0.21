import { ChatInputCommandInteraction } from "discord.js";

import { manager } from "@/index";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { BotClient } from "@modules/discord/class/client";

import { EconomyUtils, ToolUtils } from "../utils";

export async function PayEconomy(interaction: ChatInputCommandInteraction, client: BotClient) {
  if (!interaction.guild || !interaction.channel || !interaction.member) return;
  const user = interaction.options.getUser("user") || interaction.user;

  const userBalance = await EconomyUtils.fetchBalance(interaction.user.id, interaction.guild.id);

  let amount = interaction.options.getNumber("amount");
  if (!amount)
    return {
      embeds: [
        new Embed().setDescription(
          [
            `${client.getEmoji(interaction.guild.id).error} You need to specify an amount to pay!`,
            `Example: \`/pay @user 100\``,
          ].join("\n")
        ),
      ],
      ephemeral: true,
    };

  if (user.bot || user.id === interaction.user.id)
    return await interaction.reply({
      embeds: [
        new Embed()
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id).error} You cannot pay a bot or yourself!`,
              `Please mention a valid user to pay.`,
            ].join("\n")
          )
          .setColor("Red"),
      ],
      ephemeral: true,
    });

  if (amount > userBalance.balance)
    return await interaction.reply({
      embeds: [
        new Embed()
          .setDescription(
            [
              `${client.getEmoji(interaction.guild.id).error} You do not have enough balance to pay this amount!`,
              `Your current balance is $${userBalance.balance}.`,
            ].join("\n")
          )
          .setColor("Red"),
      ],
    });

  const selectedUserBalance = await EconomyUtils.fetchBalance(user.id, interaction.guild.id);

  amount = await ToolUtils.toFixedNumber(amount);

  const balanceFixed = await ToolUtils.toFixedNumber(userBalance.balance - amount);
  await manager.prisma.userEconomy.update({
    where: { id: userBalance.id },
    data: { balance: balanceFixed },
  });

  const userBalanceFixed = await ToolUtils.toFixedNumber(selectedUserBalance.balance + amount);
  await manager.prisma.userEconomy.update({
    where: { id: selectedUserBalance.id },
    data: { balance: userBalanceFixed },
  });

  await interaction.reply({
    embeds: [
      new Embed()
        .setDescription(
          [
            `${client.getEmoji(interaction.guild.id).correct} You have successfully paid ${amount} to ${user}!`,
            `Your current balance is $${balanceFixed}.`,
          ].join("\n")
        )
        .setColor("Green"),
    ],
    ephemeral: true,
  });

  const userGet = client.users.cache.get(user.id);
  if (!userGet)
    return {
      embeds: [
        new ErrorEmbed(interaction.guild.id).setDescription(
          [
            `${client.getEmoji(interaction.guild.id).error} The user you are trying to pay is not in the server!`,
            `Please make sure the user is in the server and try again.`,
          ].join("\n")
        ),
      ],
    };

  await userGet.send({
    embeds: [
      new Embed()
        .setDescription(
          `You have received a total of ${amount} from ${
            interaction.user
          }! This amount has been deposited to your balance and you total now is $${
            selectedUserBalance.balance + amount
          }`
        )
        .setColor("Green")
        .setImage(
          "https://cdn.discordapp.com/attachments/1098838797229236315/1098864088639078481/money-banner.png"
        ),
    ],
  });
}
