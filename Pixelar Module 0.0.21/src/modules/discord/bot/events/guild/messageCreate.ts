/* eslint-disable @typescript-eslint/no-explicit-any */
import { client, manager } from "@/index";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { Embed, ErrorEmbed } from "@lib/extenders/discord/embeds.extend";
import { Event } from "@modules/discord/class/builders";
import { config } from "@utils/config";

export default new Event("messageCreate", async (message) => {
  const { guild, author, channel } = message;
  if (!guild) return;

  const data = await manager.prisma.tickets.findFirst({ where: { guildId: guild.id } });
  if (!data) return;
  const ticket = config.bot.tickets;

  const userdb = await manager.prisma.user.findFirst({
    where: {
      guildId: guild.id,
      userId: author.id,
      tickets: {
        some: {
          iamoderation: true,
          channelId: message.channel.id,
          closed: false,
        },
      },
    },
  });

  if (!userdb) return;

  //checar que la cantidad de mensajes de la IA no supere el limite establecido y si ya lo supero mandar un mensaje de ello y desabilitar el sistema
  const message_bot_amount = channel.messages.cache.filter((m) => m.author.id === client.user?.id).size;
  const amount_limit = ticket.options["max-iamoderation-ticket"];

  if (message_bot_amount >= amount_limit) {
    await manager.prisma.user.updateMany({
      where: {
        guildId: guild.id,
        userId: author.id,
        tickets: {
          some: {
            channelId: message.channel.id,
            iamoderation: true,
            closed: false,
          },
        },
      },
      data: {
        tickets: {
          updateMany: {
            where: {
              channelId: message.channel.id,
              iamoderation: true,
              closed: false,
            },
            data: {
              iamoderation: false,
            },
          },
        },
      },
    });

    return message.reply({
      embeds: [
        new ErrorEmbed(guild.id).setDescription(
          [
            `${client.getEmoji(guild.id).error} The AI system has reached the maximum number of messages allowed.`,
            `Please try again later.`,
          ].join("\n")
        ),
      ],
    });
  }

  //*******************************************************************************************************************************
  const configuration = new GoogleGenerativeAI(process.env.API_KEY as string).getGenerativeModel({
    model: process.env.MODEL as string,
    systemInstruction: process.env.CONFIGSYSTEM,
  });
  const conversationContext: any[][] = [];
  const currentMessages = [];
  try {
    const prompt = message.content;
    for (const [inputText, responseText] of conversationContext) {
      currentMessages.push({ role: "user", parts: inputText });
      currentMessages.push({ role: "model", parts: responseText });
    }

    const chat = configuration.startChat({
      history: currentMessages,
      generationConfig: {
        maxOutputTokens: 1000,
        temperature: 0.1,
      },
      tools: [
        {
          codeExecution: {},
        },
      ],
    });

    const result = await chat.sendMessage(prompt);
    const response = await result.response;
    const responseText = response.text();

    // Stores the conversation
    conversationContext.push([prompt, responseText]);
    return message.reply({
      embeds: [
        new Embed()
          .setAuthor({
            name: `${config.name} - Gemini`,
            iconURL: author.displayAvatarURL({ forceStatic: true }),
          })
          .setTitle("Gemini AI")
          .setDescription(responseText.length > 2048 ? `${responseText.slice(0, 2048)}...` : responseText)
          .setFooter({
            text: `Gemini AI - Time Left: ${ticket.options.times["time-2"]}:00 - ${ticket.options.times["time-1"]}:00`,
            iconURL: guild.iconURL({ forceStatic: true })
              ? (guild.iconURL({ forceStatic: true }) as string)
              : author.displayAvatarURL({ forceStatic: true }),
          }),
      ],
    });
    //*******************************************************************************************************************************
  } catch (err: any) {
    return message.reply({
      embeds: [
        new ErrorEmbed(guild.id)
          .setDescription(
            [
              `${client.getEmoji(guild.id).error} An error occurred while trying to generate the response.`,
              `Please try again later.`,
            ].join("\n")
          )
          .setStackTrace(err.stack),
      ],
    });
  }
});
