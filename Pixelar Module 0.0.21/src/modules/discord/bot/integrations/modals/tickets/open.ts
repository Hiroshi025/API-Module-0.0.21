import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, Message, MessageFlags,
	PermissionResolvable, roleMention, StringSelectMenuBuilder, TextChannel, userMention
} from "discord.js";

import { manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { logWithLabel } from "@lib/utils/log";
import { Modals } from "@typings/modules/component";

const OPTTicket: Modals = {
  id: "tickets:create-send:select-menu:form",
  tickets: false,
  owner: false,
  permissions: ["ManageChannels"],
  botpermissions: ["SendMessages"],
  async execute(interaction, client, lang, config) {
    const reason = interaction.fields.getTextInputValue(`${OPTTicket.id}-reason`);
    const links = interaction.fields.getTextInputValue(`${OPTTicket.id}-links`);
    if (!interaction.guild || !interaction.member || !reason) return;
    const ticket = config.bot.tickets;

    // Obtenemos los datos de la base de datos de los tickets
    const data = await manager.prisma.tickets.findUnique({
      where: { guildId: interaction.guild.id },
    });
    if (!data || data.options.length === 0 || data.channelId === null) {
      await interaction.reply({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Open)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).error} **Ticket Panel**`,
                `The ticket panel has not been created successfully with the options.`,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Obtenemos el usuario de la base de datos
    const user = await manager.prisma.user.findUnique({ where: { userId: interaction.user.id } });
    if (!user) {
      await interaction.reply({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Open)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).error} **Ticket Panel**`,
                `The user has not been created successfully with the options.`,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Checamos si el usuario ya tiene un ticket abierto
    const tickets = user.tickets.filter((t) => t.closed === false);
    if (tickets.length > ticket.options["max-ticket-amout"]) {
      await interaction.reply({
        embeds: [
          new Embed()
            .setAuthor({
              name: `${config.name} - Ticket Panel (Open)`,
              iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
            })
            .setGuild(interaction.guild)
            .setDescription(
              [
                `${client.getEmoji(interaction.guildId as string).error} **Ticket Panel**`,
                `You already have an open ticket, please close it before opening a new one.`,
              ].join("\n")
            ),
        ],
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // Checamos si el valor o valores agregados en links si son URL
    const math = links.match(/(https?:\/\/[^\s]+)/g);
    if (math) {
      if (math.length > 0) {
        const linksArray = math.map((l) => l);
        if (linksArray.length > 0) {
          const linksString = linksArray.join("\n");
          if (linksString.length > 1024) {
            await interaction.reply({
              embeds: [
                new Embed()
                  .setAuthor({
                    name: `${config.name} - Ticket Panel (Open)`,
                    iconURL: client.user?.displayAvatarURL({ forceStatic: true }),
                  })
                  .setGuild(interaction.guild)
                  .setDescription(
                    [
                      `${client.getEmoji(interaction.guildId as string).error} **Ticket Panel**`,
                      `The links are too long, please try again.`,
                    ].join("\n")
                  ),
              ],
              flags: MessageFlags.Ephemeral,
            });
            return;
          }
        }
      }
    }

    const namechannel = data.ticketformat ? data.ticketformat : "ticket-{user}-{ticket}";
    const createTicket = new Date().getHours();
    await interaction.guild.channels
      .create({
        name: namechannel
          .replace(/{user}/g, interaction.user.username)
          .replace(/{ticket}/g, `${user.tickets.length + 1}`)
          .replace(/{userId}/g, interaction.user.id)
          .replace(/{ticketcount}/g, `${user.tickets.length + 1}`),
        type: ChannelType.GuildText,
        parent: data.categoryId,
        permissionOverwrites: [
          {
            id: interaction.user.id,
            allow: ticket.permissions.user as PermissionResolvable[],
          },
          {
            id: data.roleId as string,
            allow: ticket.permissions.role as PermissionResolvable[],
          },
          {
            id: interaction.guild.roles.everyone.id as string,
            deny: ["ViewChannel"],
          },
        ],
      })
      .then(async (channel: TextChannel) => {
        if (!interaction.guild || !interaction.channel) return;
        await manager.prisma.user.update({
          where: { userId: interaction.user.id },
          data: {
            tickets: {
              push: {
                id: user.tickets.length + 1,
                userId: interaction.user.id,
                channelId: channel.id,
                guildId: interaction.guildId as string,
                createdAt: new Date(),
                reason: reason.slice(0, 500),
              },
            },
          },
        });

        channel.setRateLimitPerUser(5);
        const menu = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(
          new StringSelectMenuBuilder()
            .setPlaceholder("Select menu tools for the ticket")
            .setCustomId("tickets:create-send:select-menu:menu-send")
            .setMinValues(1)
            .addOptions([
              {
                label: "Delete Ticket",
                description: "Delete the ticket in the server",
                emoji: client.getEmoji(interaction.guildId as string).tickets.delete,
                value: "first_option",
              },
              /*               
              {
                label: "Open Ticket",
                description: "Open the ticket in the server",
                emoji: client.getEmoji(interaction.guildId as string).tickets.open,
                value: "second_option",
              }, 
              */
              {
                label: "Close Ticket",
                description: "Close the ticket in the server",
                emoji: client.getEmoji(interaction.guildId as string).tickets.closed,
                value: "third_option",
              },
            ])
        );

        const dbticket = await manager.prisma.user.findFirst({
          where: {
            userId: interaction.user.id,
            guildId: interaction.guild.id,
            tickets: {
              some: {
                channelId: channel.id,
              },
            },
          },
        });

        const mode_chatgot = dbticket ? dbticket.tickets[0].iamoderation : false;

        const buttons = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel("Claim")
            .setEmoji(client.getEmoji(interaction.guildId as string).tickets.claim)
            .setCustomId("tickets:create-send:select-menu:button:claim-send"),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel("Renunce")
            .setEmoji(client.getEmoji(interaction.guildId as string).tickets.unclaim)
            .setCustomId("tickets:create-send:select-menu:button:renunce-send"),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Secondary)
            .setLabel("Chat GPT")
            .setCustomId("tickets:create-send:select-menu:button:chatgpt")
            .setDisabled(mode_chatgot)
        );

        const buttons_tools = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setCustomId("tickets:tools-add:user")
            .setLabel("Add User")
            .setEmoji(client.getEmoji(interaction.guildId as string).tickets.add)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("tickets:tools-remove:user")
            .setLabel("Remove User")
            .setEmoji(client.getEmoji(interaction.guildId as string).tickets.remove)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("tickets:tools-rename")
            .setLabel("Rename Ticket")
            .setEmoji(client.getEmoji(interaction.guildId as string).tickets.rename)
            .setStyle(ButtonStyle.Secondary),
          new ButtonBuilder()
            .setCustomId("tickets:tools-name:channel")
            .setLabel("Channel Format")
            .setEmoji(client.getEmoji(interaction.guildId as string).channelname)
        );

        const embed = new Embed()
          .setAuthor({
            name: `Ticket ${interaction.user.username}`,
            iconURL: interaction.user.displayAvatarURL({ forceStatic: true }),
          })
          .setTitle(ticket.message.embed.title ? ticket.message.embed.title : "Ticket System - Manager")
          .setGuild(interaction.guild)
          .setDescription(
            ticket.message.embed.description
              ? ticket.message.embed.description
              : [
                  `${client.getEmoji(interaction.guildId as string).tickets.open} **Ticket Opened**`,
                  `> Ticket opened by ${interaction.user.toString()} (\`${interaction.user.tag}\`)`,
                  `> Ticket created at ${createTicket}:00`,
                ].join("\n")
          )
          .setFields(
            {
              name: "__Reason__",
              value: `> ${reason.slice(0, 500).replace(/`/g, "")}`,
            },
            {
              name: "__Links__",
              value: links
                ? `> ${links.replace(/`/g, "")}`
                : `> ${client.getEmoji(interaction.guildId as string).error} No links provided`,
            }
          );

        await interaction.deferReply({ ephemeral: true });
        await channel
          .send({
            content: `Hello! Thank you for opening a ticket with us: ${roleMention(data.roleId as string)} ${userMention(interaction.user.id)}`,
            embeds: [embed],
            components: [menu, buttons, buttons_tools],
          })
          .then(async (msg: Message) => {
            if (!interaction.guild) return;
            msg.pin(`New Ticket - ${interaction.user.tag}`).catch(() => {});
            //si el ticket se crear en un horario de 11pm a 6 de la mañana se manda un mensaje de que
            //el ticket esta en suspencion debido a que el staff esta offline
            if (
              createTicket >= ticket.options.times["time-1"] ||
              createTicket < ticket.options.times["time-2"]
            ) {
              const restHoursMessage = new Embed()
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).time} Support is currently disabled during these off hours.`,
                    `It will resume after 6 AM Mexican time. Thank you for your patience.`,
                    `**Hours:** \`11:00 PM - 6:00 AM (UTC -6)\``,
                  ].join("\n")
                )
                .setFields({
                  name: "__**Time Zone**__",
                  value: "Mexico City, Mexico",
                  inline: true,
                })
                .setAuthor({
                  name: "Manager - Ticket System",
                  iconURL: interaction.guild?.iconURL({
                    forceStatic: true,
                  }) as string,
                })
                .setGuild(interaction.guild);

              const waitTime = 2000;
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              await channel
                .send({
                  embeds: [restHoursMessage],
                })
                .catch((err) => {
                  logWithLabel("error", `Error the ticket system: ${err}`);
                  console.error(err);
                });
            } else {
              const restHoursMessage = new Embed()
                .setDescription(
                  [
                    `${client.getEmoji(interaction.guild.id).time} Support is currently available.`,
                    `Please wait for a staff member to assist you.`,
                  ].join("\n")
                )
                .setAuthor({
                  name: "Manager - Ticket System",
                  iconURL: interaction.guild?.iconURL({
                    forceStatic: true,
                  }) as string,
                })
                .setGuild(interaction.guild);

              const waitTime = 2000;
              await new Promise((resolve) => setTimeout(resolve, waitTime));
              await channel
                .send({
                  embeds: [restHoursMessage],
                })
                .catch((err) => {
                  logWithLabel("error", `Error the ticket system: ${err}`);
                  console.error(err);
                });
            }
          });

        /*
        const nodemeiler = new NodeMeiler(process.env.EMAIL_OWNER as string)
        await nodemeiler.SendNotification([
          `Hello Creator, Please attend to the ticket that has just been created within the control system\n`,
          `Ticket Opened by: ${interaction.user.username} (${interaction.user.id})`,
          `Ticket created at: ${createTicket}:00\n`,
          `Link Channel: ${channel.url}`,
          `Reason: ${reason.slice(0, 500)}`,
        ].join("\n")) 
        */

        const embedResponse = new Embed()
          .setColor("Green")
          .setTitle("New Ticket - Manager")
          .setDescription(`Ticket has been created in: ${channel}`);

        const buttonLink = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder().setStyle(ButtonStyle.Link).setLabel("Ticket Open").setURL(channel.url)
        );

        await interaction.editReply({
          embeds: [embedResponse],
          components: [buttonLink],
        });
      });
  },
};

export = OPTTicket;
