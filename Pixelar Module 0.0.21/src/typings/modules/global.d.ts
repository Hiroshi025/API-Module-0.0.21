import { AutocompleteInteraction, PermissionResolvable } from "discord.js";

import { config } from "@lib/utils/config";
import { BotClient } from "@modules/discord/class/client";

export interface CommandOptions {
  cooldown?: number; // Tiempo de cooldown en segundos
  owner?: boolean;
  autocomplete?: (
    client: BotClient,
    interaction: AutocompleteInteraction,
    configuration: typeof config
  ) => void;
}

export interface AddonConfig {
  name: string;
  description: string;
  author: string;
  version: string;
  bitfield: PermissionResolvable[];
}

export interface CryptoConfig {
  token: string;
  coinId: string;
  preferred: string;
  frequency: number;
  symbol: string;
  separator: string;
}

export interface IInvitesNumber {
  regular: number;
  bonus: number;
  fake: number;
  leave: number;
  total: number;
}

export interface IInvites {
  regular: string[];
  bonus: number;
  fake: string[];
  leave: string[];
}

export interface ButtonOptions {
  label: string;
  style: ButtonStyle;
}

export interface ButtonsConfig {
  first: ButtonOptions;
  previous: ButtonOptions;
  index: ButtonOptions & { disabled: boolean };
  next: ButtonOptions;
  last: ButtonOptions;
}

export interface PaginationOptions {
  method: "addEmbeds" | "createPages" | null;
  keepIndex: boolean;
  buttons: ButtonsConfig;
}
