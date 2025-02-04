import { ChannelType, ChatInputCommandInteraction, Message } from "discord.js";

import { Embed } from "@lib/extenders/discord/embeds.extend";
import { BotClient } from "@modules/discord/class/client";

import { EconomyUtils } from "../utils";

export const BalanceCommand = {
  Interaction: async (interaction: ChatInputCommandInteraction, client: BotClient) => {
    if (!interaction.guild || !interaction.channel) return;
    const user = interaction.options.getUser("user") || interaction.user;
    const dbBalance = await EconomyUtils.getBalance(user.id, interaction.guild.id);

    if (!dbBalance) {
      return await interaction.reply({
        embeds: [
          new Embed().setDescription(
            [
              `${client.getEmoji(interaction.guild.id).error} **${user.username}** does not have an account yet!`,
              `Use \`/register\` to create an account!`,
            ].join("\n")
          ),
        ],
        ephemeral: true,
      });
    }

    await interaction.reply({
      embeds: [
        new Embed()
          .setTitle(`${user.username}'s Balance`)
          .setDescription(`**User has $${dbBalance.balance}**`),
      ],
    });
  },
  Message: async (message: Message, client: BotClient) => {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const user = message.mentions.users.first() || message.author;
    const dbBalance = await EconomyUtils.getBalance(user.id, message.guild.id);

    if (!dbBalance) {
      return await message.channel.send({
        embeds: [
          new Embed().setDescription(
            [
              `${client.getEmoji(message.guild.id).error} **${user.username}** does not have an account yet!`,
              `Use \`/register\` to create an account!`,
            ].join("\n")
          ),
        ],
      });
    }

    await message.channel.send({
      embeds: [
        new Embed()
          .setTitle(`${user.username}'s Balance`)
          .setDescription(`**User has $${dbBalance.balance}**`),
      ],
    });
  },
};
