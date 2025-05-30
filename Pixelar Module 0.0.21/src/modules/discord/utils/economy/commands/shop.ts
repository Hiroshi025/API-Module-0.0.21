import { ChatInputCommandInteraction, PermissionFlagsBits, PermissionsBitField } from "discord.js";

import { manager } from "@/index";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { BotClient } from "@modules/discord/class/client";

import { EconomyUtils, ToolUtils } from "../utils";

export async function ShopEconomy(interaction: ChatInputCommandInteraction, client: BotClient) {
  if (!interaction.guild || !interaction.channel || !interaction.user || !interaction.member) return;
  const tokenItem = await ToolUtils.generateToken(5);
  const { options } = interaction;

  switch (options.getSubcommand()) {
    case "add":
      {
        const itemName = options.getString("name");
        const itemDescription = options.getString("description");
        const itemPrice = options.getNumber("price");
        const roleOption = interaction.options.getRole("role");
        const itemIdentifier = options.getString("identifier") || tokenItem;

        if (!itemName || !itemDescription || !itemPrice)
          return interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id).setDescription(
                [
                  `${client.getEmoji(interaction.guild.id).error} Please provide all the required fields!`,
                  `**Usage:** /shop add --name <name> --description <description> --price <price> --identifier <identifier> --role <role> --money <money>`,
                ].join("\n")
              ),
            ],
          });

        if (!itemIdentifier) {
          return interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id).setDescription(
                [
                  `${client.getEmoji(interaction.guild.id).error} Please provide a valid identifier!`,
                  `**Usage:** /shop add --name <name> --description <description> --price <price> --identifier <identifier> --role <role> --money <money>`,
                ].join("\n")
              ),
            ],
          });
        }

        const money = options.getNumber("money") || null;
        let role = null;
        if (interaction.options.getRole("role")) role = roleOption?.id;

        if (!(interaction.member.permissions as PermissionsBitField).has(PermissionFlagsBits.ManageGuild))
          return await interaction.reply({
            content: "You do not have enough permissions to use this command!",
          });

        await manager.prisma.shop.create({
          data: {
            guildId: interaction.guild.id,
            itemName: itemName,
            itemDescription: itemDescription,
            itemPrice: itemPrice,
            itemIdentifier: itemIdentifier,
            role: role,
            money: money,
          },
        });

        await interaction.reply({
          embeds: [
            new Embed()
              .setTitle("New Item Added!")
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id).correct} Successfully added a new item to the shop!`,
                  `**Item Name:** ${itemName}`,
                ].join("\n")
              )
              .addFields(
                {
                  name: "Item Name",
                  value: itemName,
                },
                {
                  name: "Item Description",
                  value: itemDescription,
                },
                {
                  name: "Item Price",
                  value: `$${itemPrice}`,
                },
                {
                  name: "Item Identifier",
                  value: `\`${itemIdentifier}\``,
                },
                {
                  name: "Money given when claimed",
                  value: `\`${money}\``,
                },
                {
                  name: "Role given when claimed",
                  value: `\`${role}\``,
                }
              ),
          ],
        });
      }
      break;
    case "view":
      {
        const page = options.getNumber("page");

        const shopData = await manager.prisma.shop.findMany({
          where: {
            guildId: interaction.guild.id,
          },
        });

        if (!shopData)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id)
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).error} There are no items in the shop!`,
                    `**Usage:** /shop add --name <name> --description <description> --price <price> --identifier <identifier> --role <role> --money <money>`,
                  ].join("\n")
                )
                .setColor("Red"),
            ],
          });

        const embed = new Embed()
          .setTitle(`Server Shop`)
          .setDescription("to buy an item please use `/shop buy`!")
          .setColor("Random");

        if (page) {
          const pageNum = 5 * page - 5;

          if (shopData.length >= 6) {
            embed.setFooter({
              text: `page ${page} of ${Math.ceil(shopData.length / 5)}`,
            });
          }

          for (const item of shopData.splice(pageNum, 5)) {
            embed.addFields({
              name: `${item.itemName}  <->  $${item.itemPrice}`,
              value: `> Identifier: \`${item.itemIdentifier}\`\n> Description: ${item.itemDescription}\n> Given Role: ${item.role}\n> Given Money: ${item.money}\n`,
            });
          }

          return await interaction.reply({ embeds: [embed] });
        }

        if (shopData.length >= 6) {
          embed.setFooter({
            text: `page 1 of ${Math.ceil(shopData.length / 5)}`,
          });
        }

        for (const item of shopData.slice(0, 5)) {
          embed.addFields({
            name: `${item.itemName}  <->  $${item.itemPrice}`,
            value: `> Identifier: \`${item.itemIdentifier}\`\n> Description: ${item.itemDescription}\n> Given Role: ${item.role}\n> Given Money: ${item.money}\n`,
          });
        }

        await interaction.reply({ embeds: [embed] });
      }
      break;

    case "buy":
      {
        const identifier = interaction.options.getString("identifier");

        const itemShopData = await manager.prisma.shop.findFirst({
          where: {
            guildId: interaction.guild.id,
          },
        });

        if (!itemShopData)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id)
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).error} There are no items in the shop!`,
                    `**Usage:** /shop add --name <name> --description <description> --price <price> --identifier <identifier> --role <role> --money <money>`,
                  ].join("\n")
                )
                .setColor("Red"),
            ],
          });

        const userBalance = await EconomyUtils.fetchBalance(interaction.user.id, interaction.guild.id);

        const InvData = await manager.prisma.inventory.findFirst({
          where: {
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            itemIdentifier: identifier as string,
          },
        });

        if (InvData)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id)
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).error} You already have this item in your inventory!`,
                    `**Usage:** /shop buy --identifier <identifier>`,
                  ].join("\n")
                )
                .setColor("Red"),
            ],
          });

        if (itemShopData.itemIdentifier !== identifier)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id)
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).error} That item does not exist in the shop!`,
                    `**Usage:** /shop buy --identifier <identifier>`,
                  ].join("\n")
                )
                .setColor("Red"),
            ],
          });

        const item = await manager.prisma.shop.findFirst({
          where: {
            guildId: interaction.guild.id,
            itemIdentifier: identifier,
          },
        });

        if (!item)
          return interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id)
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).error} That item does not exist in the shop!`,
                    `**Usage:** /shop buy --identifier <identifier>`,
                  ].join("\n")
                )
                .setColor("Red"),
            ],
          });

        if (item.itemPrice > userBalance.balance)
          return await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id).setDescription(
                [
                  `${client.getEmoji(interaction.guild.id).error} You do not have enough money to buy this item!`,
                  `**Usage:** /shop buy --identifier <identifier>`,
                ].join("\n")
              ),
            ],
          });

        const balanceFixed = await ToolUtils.toFixedNumber(userBalance.balance - item.itemPrice);

        await manager.prisma.userEconomy.update({
          where: { id: userBalance.id },
          data: {
            balance: balanceFixed,
          },
        });

        await manager.prisma.inventory.create({
          data: {
            guildId: interaction.guild.id,
            userId: interaction.user.id,
            itemIdentifier: identifier,
            itemName: item.itemName,
            itemPrice: item.itemPrice,
            itemDescription: item.itemDescription,
            role: item.role as string,
            money: item.money as number,
          },
        });

        await interaction.reply({
          embeds: [
            new Embed().setDescription(
              `You have bought ${item.itemName} for $${item.itemPrice}! This item has been moved into your inventory.`
            ),
          ],
        });
      }

      break;
    case "remove":
      {
        if (!(interaction.member.permissions as PermissionsBitField).has(PermissionFlagsBits.ManageGuild)) {
          return await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id)
                .setDescription(
                  `${client.getEmoji(interaction.guild.id).error} You do not have enough permissions to use this command!`
                )
                .setColor("Red"),
            ],
          });
        }

        const ID = interaction.options.getString("identifier");
        if (!ID) {
          return await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id)
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).error} Please provide a valid identifier!`,
                    `**Usage:** /shop remove --identifier <identifier>`,
                  ].join("\n")
                )
                .setColor("Red"),
            ],
            ephemeral: true,
          });
        }

        const findShop = await manager.prisma.shop.findFirst({
          where: {
            guildId: interaction.guild.id,
            itemIdentifier: ID,
          },
        });

        if (!findShop) {
          return await interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild.id)
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).error} That item does not exist in the shop!`,
                    `**Usage:** /shop remove --identifier <identifier>`,
                  ].join("\n")
                )
                .setColor("Red"),
            ],
            ephemeral: true,
          });
        }

        await manager.prisma.shop.deleteMany({
          where: {
            guildId: interaction.guild.id,
            itemIdentifier: ID,
          },
        });

        return await interaction.reply({
          embeds: [
            new Embed()
              .setDescription(
                [
                  `${client.getEmoji(interaction.guild.id).correct} Successfully removed the item from the shop!`,
                  `**Item Name:** ${findShop.itemName}`,
                ].join("\n")
              )
              .setColor("Red"),
          ],
          ephemeral: true,
        });
      }
      break;
    default:
      break;
  }
}
