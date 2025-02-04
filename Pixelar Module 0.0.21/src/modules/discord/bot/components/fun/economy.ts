import { BalanceCommand } from "@modules/discord/utils/economy/commands/balance";
import { InventoryCommand } from "@modules/discord/utils/economy/commands/inventory";
import { RobCommand } from "@modules/discord/utils/economy/commands/rob";
import { Precommand } from "@typings/index";

const economyCommand: Precommand = {
  name: "economy",
  description: "economy commaands for the bot",
  examples: ["economy <text>"],
  nsfw: false,
  category: "fun",
  owner: false,
  cooldown: 30,
  aliases: ["eco"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  subcommands: [
    "economy balance <user>: Get the balance of a user",
    "economy inventory view <page>: View the inventory of a user",
    "economy inventory use_item <identifier>: Use an item from your inventory",
    "economy rob <user>: Rob a user",
  ],
  async execute(client, message, args) {
    const subcommand = args[0];
    switch (subcommand) {
      case "balance":
        {
          await BalanceCommand.Message(message, client);
        }
        break;
      case "inventory":
        {
          await InventoryCommand.Message(message, client, args);
        }
        break;
      case "rob":
        {
          await RobCommand.Message(message, client, args);
        }
        break;
    }
  },
};

export = economyCommand;
