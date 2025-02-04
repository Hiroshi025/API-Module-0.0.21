import chalk from "chalk";
import {
	ButtonInteraction, ChannelSelectMenuInteraction, GuildMemberRoleManager, InteractionType,
	MessageFlags, ModalSubmitInteraction, PermissionsBitField, RoleSelectMenuInteraction,
	StringSelectMenuInteraction
} from "discord.js";

import { client, manager } from "@/index";
import { ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { Event } from "@modules/discord/class/builders";
import { Buttons, Menus, Modals } from "@typings/index";

export default new Event("interactionCreate", async (interaction) => {
  if (!interaction.guild || !interaction.channel || interaction.user.bot || !interaction.user) return;

  const lenguage = interaction.guild.preferredLocale; // esto es para obtener el idioma del servidor
  const { guild } = interaction;
  if (!guild) return;

  //Function to create a user and guild in the database if they do not exist.
  await client.utils.createUser(interaction.user.id, guild.id, client);
  await client.utils.createGuild(guild.id, client);

  switch (true) {
    case interaction.isChatInputCommand():
      {
        const command = client.commands.get(interaction.commandName);
        if (!command) return;

        if (command.options?.owner && !client.config.bot.owners.includes(interaction.user.id))
          return interaction.reply({
            embeds: [
              new ErrorEmbed(interaction.guild?.id as string).setDescription(
                [
                  `${client.getEmoji(guild.id).error} You do not have permission to use this command as it is reserved for the bot owner.`,
                  `If you believe this is a mistake, please contact the bot owner.`,
                ].join("\n")
              ),
            ],
            flags: MessageFlags.Ephemeral,
          });

        command.run(client, interaction, config);
        logWithLabel(
          "info",
          [
            `${chalk.cyanBright(`/${interaction.commandName}`)} -> ${chalk.grey(interaction.user.username ? interaction.user.username : "Unknown")} in ${chalk.grey(interaction.guild?.name)}`,
            `  ➜  ${chalk.grey("Ready:")} Yes ${new Date().toLocaleString()}`,
            `  ➜  ${chalk.grey("Command Name:")} ${interaction.commandName}`,
            `  ➜  ${chalk.grey("Interaction:")} Slash Command`,
          ].join("\n")
        );
      }
      break;

    case interaction.isButton():
      {
        const button = client.buttons.get(interaction.customId);
        if (!button || button === undefined) return;

        await InteractionOptions(button, interaction);
        button.execute(interaction, client, lenguage, config);
      }
      break;

    case interaction.isStringSelectMenu():
      {
        const menus = client.menus.get(interaction.customId);
        if (!menus || menus === undefined) return;

        await InteractionOptions(menus, interaction);
        menus.execute(interaction, client, lenguage, config);
      }
      break;

    case interaction.type === InteractionType.ModalSubmit:
      {
        const modals = client.modals.get(interaction.customId);
        if (!modals || modals === undefined) return;

        await InteractionOptions(modals, interaction);
        modals.execute(interaction, client, lenguage, config);
      }
      break;

    case interaction.isChannelSelectMenu():
      {
        const menus = client.menus.get(interaction.customId);
        if (!menus || menus === undefined) return;

        await InteractionOptions(menus, interaction);
        menus.execute(interaction, client, lenguage, config);
      }
      break;

    case interaction.isRoleSelectMenu(): {
      const menus = client.menus.get(interaction.customId);
      if (!menus || menus === undefined) return;

      await InteractionOptions(menus, interaction);
      menus.execute(interaction, client, lenguage, config);
    }
  }
});

/**
 *
 * The interaction options for the buttons, menus, and modals.
 * is used to check if the user has the required permissions to use the command.
 *
 * @param type
 * @param interaction
 * @returns
 */
async function InteractionOptions(
  type: Buttons | Menus | Modals,
  interaction:
    | ModalSubmitInteraction
    | ButtonInteraction
    | StringSelectMenuInteraction
    | ChannelSelectMenuInteraction
    | RoleSelectMenuInteraction
) {
  const { guild, member } = interaction;
  if (!guild || !member) return;

  if (type.owner && !client.config.bot.owners.includes(interaction.user.id))
    return interaction.reply({
      embeds: [
        new ErrorEmbed(guild.id as string).setDescription(
          [
            `${client.getEmoji(guild.id).error} You do not have permission to use this command as it is reserved for the bot owner.`,
            `If you believe this is a mistake, please contact the bot owner.`,
          ].join("\n")
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.permissions && !(member.permissions as PermissionsBitField).has(type.permissions))
    return interaction.reply({
      embeds: [
        new ErrorEmbed(guild.id as string).setDescription(
          [
            `${client.getEmoji(guild.id).error} You do not have permission to use this command.`,
            `If you believe this is a mistake, please contact the bot owner.`,
          ].join("\n")
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  if (type.botpermissions && !guild.members.me?.permissions.has(type.botpermissions))
    return interaction.reply({
      embeds: [
        new ErrorEmbed(guild.id as string).setDescription(
          [
            `${client.getEmoji(guild.id).error} I do not have permission to use this command.`,
            `If you believe this is a mistake, please contact the bot owner.`,
          ].join("\n")
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });

  const data = await manager.prisma.tickets.findUnique({ where: { guildId: guild.id } });
  if (type.tickets) {
    if (!data) {
      return interaction.reply({
        embeds: [
          new ErrorEmbed(guild.id as string).setDescription(
            [
              `${client.getEmoji(guild.id).error} This command is only available in ticket channels.`,
              `If you believe this is a mistake, please contact the bot owner.`,
            ].join("\n")
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
    }

    if (!(member.roles as GuildMemberRoleManager).cache.has(data?.roleId as string))
      return interaction.reply({
        embeds: [
          new ErrorEmbed(guild.id as string).setDescription(
            [
              `${client.getEmoji(guild.id).error} You do not have permission to use this command.`,
              `If you believe this is a mistake, please contact the bot owner.`,
            ].join("\n")
          ),
        ],
        flags: MessageFlags.Ephemeral,
      });
  }

  if (type.maintenance) {
    await interaction.reply({
      embeds: [
        new ErrorEmbed(guild.id as string).setDescription(
          [
            `${client.getEmoji(guild.id).error} This command is currently disabled due to maintenance.`,
            `Please try again later or contact the bot owner for more information.`,
          ].join("\n")
        ),
      ],
      flags: MessageFlags.Ephemeral,
    });
  }
}
