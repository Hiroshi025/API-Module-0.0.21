import { EmbedBuilder, WebhookClient } from "discord.js";
import { inspect } from "util";

import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { BotClient } from "@modules/discord/class/client";

async function sendMessage(embed: EmbedBuilder) {
  const url = config.bot.webhooks.error;
  if (!url || url === "") return;

  const webhook = new WebhookClient({ url: url });
  await webhook.send({ embeds: [embed] });
}
export const ErrorHandler = (client: BotClient) => {
  const embed = new Embed().setColor("Red");
  client.on("error", async (err: Error) => {
    logWithLabel("error", [`name: ${err.name}`, `message: ${err.message}`, `stack: ${err.stack}`].join("\n"));

    embed
      .setTitle("Discord API Error")
      .setURL("https://discordjs.guide/popular-topics/errors.html#api-errors")
      .setDescription(`\`\`\`${inspect(err, { depth: 0 }).slice(0, 1000)}\`\`\``)
      .setTimestamp();

    await sendMessage(embed);
  });

  process.on("unhandledRejection", async (reason: unknown, promise: Promise<unknown>) => {
    logWithLabel("error", [`reason: ${reason}`, `promise: ${inspect(promise, { depth: 0 })}`].join("\n"));

    embed
      .setTitle("Unhandled Rejection/Catch")
      .setURL("https://nodejs.org/api/process.html#event-unhandledrejection")
      .addFields(
        { name: "Reason", value: `\`\`\`${inspect(reason, { depth: 0 }).slice(0, 1000)}\`\`\`` },
        { name: "Promise", value: `\`\`\`${inspect(promise, { depth: 0 }).slice(0, 1000)}\`\`\`` }
      )
      .setTimestamp();

    await sendMessage(embed);
  });

  process.on("uncaughtException", async (err: Error, origin: string) => {
    logWithLabel("error", [`err: ${err}`, `origin: ${inspect(origin, { depth: 0 })}`].join("\n"));

    embed
      .setTitle("Uncaught Exception/Catch")
      .setURL("https://nodejs.org/api/process.html#event-uncaughtexception")
      .addFields(
        { name: "Error", value: `\`\`\`${inspect(err, { depth: 0 }).slice(0, 1000)}\`\`\`` },
        { name: "Origin", value: `\`\`\`${inspect(origin, { depth: 0 }).slice(0, 1000)}\`\`\`` }
      )
      .setTimestamp();

    await sendMessage(embed);
  });

  process.on("uncaughtExceptionMonitor", async (err: Error, origin: string) => {
    logWithLabel("error", [`err: ${err}`, `origin: ${inspect(origin, { depth: 0 })}`].join("\n"));

    embed
      .setTitle("Uncaught Exception Monitor")
      .setURL("https://nodejs.org/api/process.html#event-uncaughtexceptionmonitor")
      .addFields(
        { name: "Error", value: `\`\`\`${inspect(err, { depth: 0 }).slice(0, 1000)}\`\`\`` },
        { name: "Origin", value: `\`\`\`${inspect(origin, { depth: 0 }).slice(0, 1000)}\`\`\`` }
      )
      .setTimestamp();

    await sendMessage(embed);
  });

  process.on("warning", async (warn: Error) => {
    logWithLabel("warn", [`warn: ${warn}`].join("\n"));

    embed
      .setTitle("Uncaught Exception Monitor Warning")
      .setURL("https://nodejs.org/api/process.html#event-warning")
      .addFields({
        name: "Warning",
        value: `\`\`\`${inspect(warn, { depth: 0 }).slice(0, 1000)}\`\`\``,
      })
      .setTimestamp();

    await sendMessage(embed);
  });

  //He visto algo similar suceder en dos casos:

  //El cliente se cierra demasiado pronto después de que se autentica escaneando códigos QR
  //El proceso se elimina sin cerrar el navegador correctamente.
  //Para el #2, recomendaría manejar las señales de terminación en su aplicación para limpiar las cosas correctamente.

  //Por ejemplo, PM2 emite un SIGINT (https://pm2.keymetrics.io/docs/usage/signals-clean-restart/). Esto también se emite cuando golpeas Ctrl + C para interrumpir el proceso. Podrías manejar esto con algo como esto:

  process.on("SIGINT", async () => {
    logWithLabel("custom", "SIGINT signal received.", "Host");
    process.exit(0);
  });
};
