import { Message } from "discord.js";

import { manager } from "@/index";

export async function Economy(message: Message) {
  if (message.author.bot || !message.guild) return;

  const randomAmount = Math.random() * (0.7 - 0.3) + 0.3;
  const dbBalance = await EconomyUtils.fetchBalance(message.author.id, message.guild.id);

  console.log(await ToolUtils.toFixedNumber(dbBalance.balance + randomAmount));

  await manager.prisma.userEconomy.updateMany({
    where: { userId: message.author.id },
    data: {
      balance: await ToolUtils.toFixedNumber(dbBalance.balance + randomAmount),
    },
  });
}

/**
 * Utility functions for various common tasks.
 */
export const ToolUtils = {
  /**
   * Rounds a number to a fixed number of decimal places.
   * @param {number} number - The number to be rounded.
   * @param {number} [places=2] - The number of decimal places to round to.
   * @returns {Promise<number>} The rounded number.
   */
  async toFixedNumber(number: number, places = 2) {
    const offset = Number(`1e${places}`);
    return Math.floor(number * offset) / offset;
  },

  /**
   * Generates a random alphanumeric token of the specified length.
   * @param {number} [length=16] - The length of the token to generate.
   * @returns {Promise<string>} The generated token.
   */
  async generateToken(length = 16) {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let token = "";
    for (let i = 0; i < length; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return token;
  },
};

/**
 * Utility functions for managing user economy data.
 */
export const EconomyUtils = {
  /**
   * Retrieves the balance of a user in a specific guild from the database.
   * @param {string} userId - The ID of the user.
   * @param {string} guildId - The ID of the guild.
   * @returns {Promise<object | false>} The user's balance object or false if not found.
   */
  async getBalance(userId: string, guildId: string) {
    const dbBalance = await manager.prisma.userEconomy.findFirst({ where: { userId, guildId } });

    if (!dbBalance) return false;
    return dbBalance;
  },

  /**
   * Fetches the balance of a user in a specific guild, creating a new entry if none exists.
   * @param {string} userId - The ID of the user.
   * @param {string} guildId - The ID of the guild.
   * @returns {Promise<object>} The user's balance object.
   */
  async fetchBalance(userId: string, guildId: string) {
    let dbBalance = await manager.prisma.userEconomy.findFirst({ where: { userId, guildId } });

    if (!dbBalance) {
      dbBalance = await manager.prisma.userEconomy.create({
        data: {
          userId,
          guildId,
        },
      });
      return dbBalance;
    }

    return dbBalance;
  },
};
