import { AttachmentBuilder, ChannelType, codeBlock } from "discord.js";
import { inspect } from "util";

import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { logWithLabel } from "@lib/utils/log";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Precommand } from "@typings/modules/component";

const EvalCommand: Precommand = {
  name: "eval",
  description: "Evaluates a JavaScript code",
  examples: ["eval 1 + 1"],
  nsfw: false,
  category: "owner",
  owner: true,
  permissions: ["SendMessages"],
  cooldown: 10,
  aliases: ["e"],
  botpermissions: ["SendMessages"],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const code = args.join(" ");
    if (!code)
      return message.channel.send({
        embeds: [
          new ErrorEmbed(message.guild.id)
            .setTitle("Error Command Handler")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id).error} The command is missing arguments to execute!`,
                `> **Usage:** \`${prefix}eval <code>\``,
              ].join("\n")
            ),
        ],
      });

    try {
      const start = process.hrtime();
      const evaluated = await eval(code);

      let output = inspect(evaluated);
      let attachment;
      if (output.length > 1000) {
        attachment = new AttachmentBuilder(Buffer.from(output), {
          name: "output.txt",
        });
        output = `Check the attachment for the output!`;
      }

      const stop = process.hrtime(start);

      const response = new Embed().setTitle("Code Evaluator - Tools").addFields(
        {
          name: "__Input Code__",
          value: codeBlock("js", code),
        },
        {
          name: "__Output Result__",
          value: codeBlock("js", output),
        },
        {
          name: "__Execution Time__",
          value: codeBlock("js", `[${(stop[0] * 1e9 + stop[1]) / 1e6}ms] ${stop[0]}.${stop[1]} seconds`),
        }
      );

      message.channel.send({
        embeds: [response],
        files: attachment ? [attachment] : [],
      });
    } catch (e: any) {
      logWithLabel("error", `Error in eval command: ${e}`);
      console.log(e);

      message.channel.send({
        embeds: [
          new ErrorEmbed(message.guild.id)
            .setTitle("Error Command Handler")
            .setDescription(
              [
                `${client.getEmoji(message.guild.id).error} The command is missing arguments to execute!`,
                `> **Usage:** \`${prefix}eval <code>\``,
              ].join("\n")
            )
            .setStackTrace(e.stack),
        ],
      });
    }
  },
};

export = EvalCommand;
