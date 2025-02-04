import { logWithLabel } from "@lib/utils/log";
import { Event } from "@modules/discord/class/builders";

export default new Event("warn", async (info) => {
  logWithLabel("warn", info);
});
