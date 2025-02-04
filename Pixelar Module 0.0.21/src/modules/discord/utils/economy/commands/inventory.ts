import {
	ChannelType, ChatInputCommandInteraction, GuildMemberRoleManager, Message
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { BotClient } from "@modules/discord/class/client";

import { EconomyUtils, ToolUtils } from "../utils";

export const InventoryCommand = {
  Interaction: async (interaction: ChatInputCommandInteraction, client: BotClient) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    switch (interaction.options.getSubcommand()) {
      case "view":
        {
          const page = interaction.options.getNumber("page");
  
          const inventoryData = await manager.prisma.inventory.findMany({
            where: {
              userId: interaction.user.id,
              guildId: interaction.guild.id,
            },
          });
  
          if (!inventoryData?.length)
            return interaction.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guild.id).error} You do not have any items in your inventory!`,
                      `Use \`/shop\` to buy some items!`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            });
  
          const embed = new Embed().setTitle(`${interaction.user.username}'s inventory`).setColor(0x2f3136);
  
          // if the user selected a page
          if (page) {
            const pageNum = 5 * page - 5;
  
            if (inventoryData.length >= 6) {
              embed.setFooter({
                text: `page ${page} of ${Math.ceil(inventoryData.length / 5)}`,
              });
            }
  
            for (const item of inventoryData.splice(pageNum, 5)) {
              embed.addFields({
                name: `${client.getEmoji(interaction.guild.id).info}  ${item.id}`,
                value: [
                  `> Name: ${item.itemName}`,
                  `> Description: ${item.itemDescription}`,
                  `> Given Role: ${item.role ? interaction.guild.roles.cache.get(item.role)?.name : "None"}`,
                  `> Given Money: $${item.money}`,
                ].join("\n"),
              });
            }
  
            return await interaction.reply({ embeds: [embed], flags: "Ephemeral" });
          }
  
          if (inventoryData.length >= 6) {
            embed.setFooter({
              text: `page 1 of ${Math.ceil(inventoryData.length / 5)}`,
            });
          }
  
          for (const item of inventoryData.slice(0, 5)) {
            embed.addFields({
              name: `${item.itemName}  <->  $${item.itemPrice}`,
              value: `> Identifier: \`${item.itemIdentifier}\`\n> Description: ${item.itemDescription}\n> Given Role: ${item.role}\n> Given Money: ${item.money}\n`,
            });
          }
  
          await interaction.reply({ embeds: [embed] });
        }
        break;
      case "use_item":
        {
          const identifier = interaction.options.getString("identifier");
          const invSchema = await manager.prisma.inventory.findFirst({
            where: {
              guildId: interaction.guild.id,
              userId: interaction.user.id,
            },
          });
  
          if (!invSchema || invSchema.itemIdentifier !== identifier) {
            return interaction.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guild.id).error} You do not have that item in your inventory!`,
                      `Use \`/inventory view\` to view your items!`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            });
          }
  
          const item = await manager.prisma.inventory.findFirst({
            where: {
              guildId: interaction.guild.id,
              userId: interaction.user.id,
              itemIdentifier: identifier,
            },
          });
  
          if (!item)
            return {
              embeds: [
                new Embed()
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guild.id).error} That item does not exist!`,
                      `Use \`/inventory view\` to view your items!`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            };
          if (!item.role && !item.money)
            return await interaction.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guild.id).error} That item does not have any use!`,
                      `Use \`/inventory view\` to view your items!`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            });
  
          if (item.role) {
            await (interaction.member.roles as GuildMemberRoleManager).add(item.role).catch((err) => {
              interaction.reply({
                embeds: [
                  new Embed()
                    .setDescription(
                      [
                        `${client.getEmoji(interaction.guild?.id as string).error} I was unable to give you the role: ${interaction.guild?.roles.cache.get(item.role)}`,
                        `Please contact a staff member for assistance!`,
                      ].join("\n")
                    )
                    .setColor("Red"),
                ],
              });
  
              return console.log(err);
            });
  
            await manager.prisma.inventory.delete({ where: { id: item.id } });
            return interaction.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    `${client.getEmoji(interaction.guild.id as string).correct} The role: ${interaction.guild.roles.cache.get(
                      item.role
                    )} has been given to you!`
                  )
                  .setColor("Green"),
              ],
              ephemeral: true,
            });
          }
  
          if (item.money) {
            const selectedUserBalance = await EconomyUtils.fetchBalance(
              interaction.user.id,
              interaction.guild.id
            );
  
            const balanceFixed = await ToolUtils.toFixedNumber(selectedUserBalance.balance + item.money);
  
            await manager.prisma.userEconomy.update({
              where: { id: selectedUserBalance.id },
              data: {
                balance: balanceFixed,
              },
            });
  
            await manager.prisma.inventory.delete({ where: { id: item.id } });
  
            return interaction.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    `${client.getEmoji(interaction.guild.id as string).correct} $${item.money} has been added to your balance!`
                  )
                  .setColor("Green"),
              ],
              ephemeral: true,
            });
          }
        }
        break;
  
      default:
        break;
    }
  },
  Message: async (message: Message, client: BotClient, args: string[]) => {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const guild = message.guild;
    const user = message.author;

    const subcommands = args[0];
    switch (subcommands) {
      case "view":
        {
          const page = parseInt(args[1]);
  
          const inventoryData = await manager.prisma.inventory.findMany({
            where: {
              userId: user.id,
              guildId: guild.id,
            },
          });
  
          if (!inventoryData?.length)
            return message.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    [
                      `${client.getEmoji(guild.id).error} You do not have any items in your inventory!`,
                      `Use \`/shop\` to buy some items!`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            });
  
          const embed = new Embed().setTitle(`${user.username}'s inventory`).setColor(0x2f3136);
  
          // if the user selected a page
          if (page) {
            const pageNum = 5 * page - 5;
  
            if (inventoryData.length >= 6) {
              embed.setFooter({
                text: `page ${page} of ${Math.ceil(inventoryData.length / 5)}`,
              });
            }
  
            for (const item of inventoryData.splice(pageNum, 5)) {
              embed.addFields({
                name: `${client.getEmoji(guild.id).info}  ${item.id}`,
                value: [
                  `> Name: ${item.itemName}`,
                  `> Description: ${item.itemDescription}`,
                  `> Given Role: ${item.role ? guild.roles.cache.get(item.role)?.name : "None"}`,
                  `> Given Money: $${item.money}`,
                ].join("\n"),
              });
            }
  
            return await message.reply({ embeds: [embed] });
          }
  
          if (inventoryData.length >= 6) {
            embed.setFooter({
              text: `page 1 of ${Math.ceil(inventoryData.length / 5)}`,
            });
          }
  
          for (const item of inventoryData.slice(0, 5)) {
            embed.addFields({
              name: `${item.itemName}  <->  $${item.itemPrice}`,
              value: `> Identifier: \`${item.itemIdentifier}\`\n> Description: ${item.itemDescription}\n> Given Role: ${item.role}\n> Given Money: ${item.money}\n`,
            });
          }
  
          await message.reply({ embeds: [embed] });
        }
        break;
      case "use_item":
        {
          const identifier = args[1];
          const invSchema = await manager.prisma.inventory.findFirst({
            where: {
              guildId: guild.id,
              userId: user.id,
            },
          });
  
          if (!invSchema || invSchema.itemIdentifier !== identifier) {
            return message.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    [
                      `${client.getEmoji(guild.id).error} You do not have that item in your inventory!`,
                      `Use \`/inventory view\` to view your items!`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            });
          }
  
          const item = await manager.prisma.inventory.findFirst({
            where: {
              guildId: guild.id,
              userId: user.id,
              itemIdentifier: identifier,
            },
          });
  
          if (!item)
            return {
              embeds: [
                new Embed()
                  .setDescription(
                    [
                      `${client.getEmoji(guild.id).error} That item does not exist!`,
                      `Use \`/inventory view\` to view your items!`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            };
          if (!item.role && !item.money)
            return await message.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    [
                      `${client.getEmoji(guild.id).error} That item does not have any use!`,
                      `Use \`/inventory view\` to view your items!`,
                    ].join("\n")
                  )
                  .setColor("Red"),
              ],
            });
  
          if (item.role) {
            await (message.member?.roles as GuildMemberRoleManager).add(item.role).catch((err) => {
              message.reply({
                embeds: [
                  new Embed()
                    .setDescription(
                      [
                        `${client.getEmoji(guild?.id as string).error} I was unable to give you the role: ${guild?.roles.cache.get(item.role)}`,
                        `Please contact a staff member for assistance!`,
                      ].join("\n")
                    )
                    .setColor("Red"),
                ],
              });
  
              return console.log(err);
            });
  
            await manager.prisma.inventory.delete({ where: { id: item.id } });
            return message.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    `${client.getEmoji(guild.id as string).correct} The role: ${guild.roles.cache.get(
                      item.role
                    )} has been given to you!`
                  )
                  .setColor("Green"),
              ]
            });
          }
  
          if (item.money) {
            const selectedUserBalance = await EconomyUtils.fetchBalance(
              user.id,
              guild.id
            );
  
            const balanceFixed = await ToolUtils.toFixedNumber(selectedUserBalance.balance + item.money);
  
            await manager.prisma.userEconomy.update({
              where: { id: selectedUserBalance.id },
              data: {
                balance: balanceFixed,
              },
            });
  
            await manager.prisma.inventory.delete({ where: { id: item.id } });
  
            return message.reply({
              embeds: [
                new Embed()
                  .setDescription(
                    `${client.getEmoji(guild.id as string).correct} $${item.money} has been added to your balance!`
                  )
                  .setColor("Green"),
              ]
            });
          }
        }
        break;
  
      default:
        break;
    }
  }
}
