import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, OAuth2Scopes, PermissionFlagsBits
} from "discord.js";

import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Precommand } from "@typings/index";

const invCommand: Precommand = {
  name: "invite",
  description: "Sends the invite link of the bot",
  examples: ["invite"],
  nsfw: false,
  category: "public",
  owner: false,
  cooldown: 50,
  cooldownType: "server",
  aliases: ["inv"],
  botpermissions: ["SendMessages"],
  permissions: ["SendMessages"],
  async execute(client, message) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const inviteURL = client.generateInvite({
      scopes: [OAuth2Scopes.Bot, OAuth2Scopes.ApplicationsCommands],
      permissions: [PermissionFlagsBits.Administrator, PermissionFlagsBits.ManageGuildExpressions],
    });
    const embed = new Embed().setTitle("Invite Me").setDescription(`[Click here](${inviteURL})`);

    const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Invite Me").setURL(inviteURL)
    );

    message.channel.send({ embeds: [embed], components: [button] });
  },
};

export = invCommand;
