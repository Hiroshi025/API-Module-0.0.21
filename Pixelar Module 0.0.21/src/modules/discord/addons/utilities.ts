/* eslint-disable @typescript-eslint/no-explicit-any */
import emojis from "@config/json/emojis.json";
import { ServerError } from "@lib/extenders/error.extend";
import { Addons } from "@modules/discord/class/addons";

export default new Addons(
  {
    name: "Utilities",
    description: "Client environment variables within the project",
    author: "Mika",
    version: "0.0.3",
    bitfield: ["SendMessages"],
  },
  async (client) => {
    type Emojis = typeof emojis;
    client.getEmoji = (guildId: string): Emojis => {
      const guild = client.guilds.cache.get(guildId);
      if (!guild) return emojis;

      const traverseEmojis = (obj: Emojis): Emojis => {
        return new Proxy(obj, {
          get(target, prop: string | symbol) {
            if (prop in target) {
              return (target as any)[prop];
            } else {
              throw new ServerError(`Emoji not found for ${String(prop)}`);
            }
          },
        }) as Emojis;
      };

      return traverseEmojis(emojis);
    };
  }
);
