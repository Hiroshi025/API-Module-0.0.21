import { ChannelType, EmbedBuilder, Message } from "discord.js";

import { manager } from "@/index";
import { config } from "@lib/utils/config";

//HACK: HAY que mejorar el sistema de tickets controlados
export async function TicketManager(message: Message) {
  const { guild, author, channel } = message;
  if (!guild) return;

  const data = await manager.prisma.tickets.findFirst({ where: { guildId: guild.id } });
  if (!data || data.options.length === 0) return;

  const time = new Date().getHours();
  const ticket = config.bot.tickets;

  const userdb = await manager.prisma.user.findFirst({
    where: {
      guildId: guild.id,
      userId: author.id,
      tickets: {
        some: {
          channelId: message.channel.id,
          closed: false,
        },
      },
    },
  });

  if (!userdb) return;
  if (time >= ticket.options.times["time-1"] || time < ticket.options.times["time-2"]) {
    const embed = new EmbedBuilder()
      .setAuthor({
        name: `${config.name} - Ticket Manager`,
        iconURL: author.displayAvatarURL({ forceStatic: true }),
      })
      .setTitle("Service Unavailable")
      .setDescription(
        [
          `Hello, ${author} the ticket system is currently unavailable at this time.`,
          `Please try again later.`,
          `Hours of Attention: \`${ticket.options.times["time-2"]}:00 - ${ticket.options.times["time-1"]}:00\``,
        ].join("\n")
      )
      .setFooter({
        text: "Service Unavailable - Ticket Manager",
        iconURL: guild.iconURL({ forceStatic: true })
          ? (guild.iconURL({ forceStatic: true }) as string)
          : author.displayAvatarURL({ forceStatic: true }),
      });

    if (channel.type === ChannelType.GuildText) {
      await channel.send({ embeds: [embed] });
    } else {
      author.send({ embeds: [embed] }).catch(() => {});
    }
  }
}
