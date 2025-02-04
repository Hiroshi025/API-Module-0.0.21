import chalk from "chalk";
import { ActivityType } from "discord.js";

import { logWithLabel } from "@lib/utils/log";
import { Event } from "@modules/discord/class/builders";

import _package from "../../../../../../package.json";

export default new Event("ready", (client) => {
  logWithLabel(
    "success",
    [
      `${chalk.grey(`Logged in as:`)} ${chalk.greenBright(`${client.user?.tag}`)}`,
      `  ➜  ${chalk.grey(`ID:`)} ${chalk.greenBright(`${client.user?.id}`)}`,
    ].join("\n")
  );

  client.user.setActivity({
    name: `Asistent ${_package.version} - ${client.ws.ping}ms`,
    type: ActivityType.Competing,
  });
});
