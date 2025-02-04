import {
	ButtonInteraction, ChannelSelectMenuInteraction, Message, ModalSubmitInteraction,
	PermissionResolvable, RoleSelectMenuInteraction, StringSelectMenuInteraction
} from "discord.js";

import { config } from "@lib/utils/config";
import { BotClient } from "@modules/discord/class/client";

export interface componentData {
  id: string;
  tickets: boolean;
  owner: boolean;
  maintenance?: boolean;
  permissions: PermissionResolvable[];
  botpermissions: PermissionResolvable[];
}

export interface Buttons extends componentData {
  execute: (
    interaction: ButtonInteraction,
    client: BotClient,
    language: string,
    configuration: typeof config
  ) => void;
}
export interface Menus extends componentData {
  execute: (
    interaction: StringSelectMenuInteraction | ChannelSelectMenuInteraction | RoleSelectMenuInteraction,
    client: BotClient,
    language: string,
    configuration: typeof config
  ) => void;
}

export interface Modals extends componentData {
  execute: (
    interaction: ModalSubmitInteraction,
    client: BotClient,
    language: string,
    configuration: typeof config
  ) => void;
}

export interface Precommand {
  name: string;
  aliases?: string[];
  description: string;
  permissions: PermissionResolvable[];
  botpermissions: PermissionResolvable[];
  owner?: boolean;
  nsfw?: boolean;
  cooldown?: number;
  cooldownType?: CooldawnType;
  category: Category;
  subcommands?: string[];
  usage?: string;
  examples?: string[];
  execute: (
    client: BotClient,
    message: Message,
    args: string[],
    prefix: string,
    language: string,
    configuration: typeof config
  ) => void;
}
