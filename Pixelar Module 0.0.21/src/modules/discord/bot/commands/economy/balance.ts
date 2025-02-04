import { CommandBuilder } from "@lib/extenders/discord/command.extend";
import { Command } from "@modules/discord/class/builders";
import { BalanceCommand } from "@modules/discord/utils/economy/commands/balance";

export default new Command(
  new CommandBuilder()
    .setName("balance")
    .setNameLocalizations({
      "es-ES": "balance",
    })
    .setDescription("🛒 Returns the balance of a user")
    .setDescriptionLocalizations({
      "es-ES": "🛒 Devuelve el saldo de un usuario",
    })
    .addUserOption((option) =>
      option
        .setName("user")
        .setNameLocalizations({
          "es-ES": "usuario",
        })
        .setDescription("🛒 Select a user to get the balance of")
        .setDescriptionLocalizations({
          "es-ES": "🛒 Selecciona un usuario para obtener su saldo",
        })
    ),
  async (client, interaction) => {
    if (!interaction.guild || !interaction.channel || !interaction.member) return;
    await BalanceCommand.Interaction(interaction, client);
  }
);
