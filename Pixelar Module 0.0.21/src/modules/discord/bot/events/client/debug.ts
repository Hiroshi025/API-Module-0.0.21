import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { Event } from "@modules/discord/class/builders";

export default new Event("debug", (info) => {
  if (config.bot.console !== true) return;
  logWithLabel("custom", info.toString(), "Debug");
});
