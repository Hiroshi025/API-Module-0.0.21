import axios from "axios";
import { Client, GatewayIntentBits } from "discord.js";

import { manager } from "@/index";
import { logWithLabel } from "@lib/utils/log";
import { Addons } from "@modules/discord/class/addons";
import { CryptoConfig } from "@typings/modules/global";

/* This code snippet is exporting an instance of an `Addons` class that represents a Crypto Currency
module. The module sets up a bot to fetch and display cryptocurrency price information based on the
provided configuration. Here's a breakdown of what the code does: */
export default new Addons(
  {
    name: "Crypto Currency",
    description: "Cryptocurrency module, update via applications",
    author: "Mika",
    version: "0.0.1-alpha",
    bitfield: ["ManageChannels"],
  },
  async () => {
    const data = await manager.prisma.botCrypto.findMany();
    if (!data) return;

    data.forEach((bot) => {
      if (bot.enabled === false) return;
      if (bot.token === "") return;
      createCryptoBot(bot);
    });

    /**
     * The function `createCryptoBot` is an asynchronous function that sets up a bot to fetch and display
     * cryptocurrency price information based on the provided configuration.
     * @returns The `createCryptoBot` function is being returned.
     */
    async function createCryptoBot(cryptoConfig: CryptoConfig) {
      if (!cryptoConfig.token) return;

      const client = new Client({
        intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
      });

      async function getPrices() {
        if (!client.user) return;

        const res = await axios({
          method: "GET",
          url: `https://api.coingecko.com/api/v3/coins/markets?vs_currency=${cryptoConfig.preferred}&ids=${cryptoConfig.coinId}&price_change_percentage=1h,24h,7d,14d,30d`,
        }).catch(() => {});

        if (!res) return;
        if (!res.data || res.status !== 200) return;

        if (res.data && res.data[0].current_price && res.data[0].price_change_percentage_24h) {
          const avatar = res.data[0].image || "";
          const currentPrice = res.data[0].current_price || 0;
          const priceChange = res.data[0].price_change_percentage_24h || 0;
          const priceChange1h = res.data[0].price_change_percentage_1h_in_currency || 0;
          const priceChange7d = res.data[0].price_change_percentage_7d_in_currency || 0;
          const priceChange30d = res.data[0].price_change_percentage_30d_in_currency || 0;
          const symbol = res.data[0].symbol || "?";
          const marketCap = res.data[0].market_cap || 0;
          const priceSymbol = (priceChange: number) => (priceChange >= 0 ? "+" : "");
          const arrow = (priceChange: number) => (priceChange >= 0 ? "▲" : "▼");
          const numberWithCommas = (number: number) =>
            number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, cryptoConfig.separator);

          client.user.setPresence({
            activities: [
              {
                name: `${cryptoConfig.coinId.toUpperCase()} ${priceSymbol(priceChange)}${priceChange.toFixed(2)}%  ${arrow(priceChange)} `,
                type: 3,
              },
            ],
            status: "online",
          });

          if (runOnce === 0) {
            client.user.setAvatar(avatar);
            runOnce = 1;
          }

          client.guilds.cache.forEach((guild) => {
            const nickname = process.env.CURRENCY_BEFORE
              ? `${cryptoConfig.symbol}${numberWithCommas(currentPrice)}`
              : `${numberWithCommas(currentPrice)}${cryptoConfig.symbol}`;
            guild.members.me?.setNickname(nickname);
          });

          client.application?.edit({
            description: `**${
              cryptoConfig.coinId.charAt(0).toUpperCase() + cryptoConfig.coinId.slice(1)
            }** (${symbol}) price changes.\n${priceSymbol(priceChange1h)}${priceChange1h.toFixed(2)}% (1h) ${arrow(
              priceChange1h
            )}\n${priceSymbol(priceChange)}${priceChange.toFixed(2)}% (24h) ${arrow(priceChange)}\n${priceSymbol(
              priceChange7d
            )}${priceChange7d.toFixed(2)}% (7d) ${arrow(priceChange7d)}\n${priceSymbol(priceChange30d)}${priceChange30d.toFixed(2)}% (1m) ${arrow(priceChange30d)}\nMarket cap: ${numberWithCommas(
              marketCap
            )} ${cryptoConfig.preferred.toUpperCase()}`,
          });
        }
      }

      let runOnce = 0;

      client.on("ready", async () => {
        logWithLabel(
          "custom",
          [
            `The cryptocurrency module for ${cryptoConfig.coinId.toUpperCase()} has started.`,
            `In case of error, please contact the administration.`,
          ].join("\n"),
          "Currency"
        );
        getPrices();
        setInterval(getPrices, Math.max(1, cryptoConfig.frequency || 1) * 60 * 1000); //
      });

      client.login(cryptoConfig.token);
    }
  }
);
