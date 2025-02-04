import { CaptchaGenerator } from "captcha-canvas";
import { AttachmentBuilder, Message } from "discord.js";

import { client, manager } from "@/index";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { Event } from "@modules/discord/class/builders";

export default new Event("guildMemberAdd", async (member) => {
  const { guild, id } = member;
  if (!guild) return;

  const messages = {
    success: `${client.getEmoji(member.guild.id).correct} Thanks for joining **${guild.name}**! You have now gained access to the server.`,
    failed: `${client.getEmoji(member.guild.id).error} Oh no! You failed the verification stage. Please try again.`,
    timedout: `${client.getEmoji(member.guild.id).error} Oh no! You failed! Next time, be a little faster.`,
    wrongCode: `${client.getEmoji(member.guild.id).error} Oh no! You sent me the wrong captcha. Please try again.`,
    dmDisabled: `${client.getEmoji(member.guild.id).error} Oh no! Your DMs are disabled.`,
    roleInvalid: `${client.getEmoji(member.guild.id).error} Oh no! I couldn't find the verification role. Please contact a staff member.`,
    description: `Please type the captcha below to be able to access **${guild.name}**.`,
    notes: [
      `1. Type out the traced colored characters from left to right.`,
      `2. Ignore the decoy characters spread-around.`,
      `3. You don't have to respect characters cases (upper/lower case)!`,
    ].join("\n"),
  };

  const settings = await manager.prisma.guild.findUnique({
    where: { id: guild.id },
    select: { captcha: true },
  });

  if (!settings) return;
  if (!settings.captcha) return;
  if (!settings.captcha.isEnabled) return;
  if (!member.kickable) return;
  if (member.user.bot) return;

  const captcha = new CaptchaGenerator()
    .setDimension(150, 450)
    .setCaptcha({
      size: 60,
      color: "#5865f2",
    })
    .setDecoy({ opacity: 0.5 })
    .setTrace({ color: "#5865f2" });
  const attachment = new AttachmentBuilder(captcha.generateSync(), {
    name: "captcha.png",
    description: "Captcha verification image.",
  });

  await member
    .send({
      embeds: [
        new Embed()
          .setTitle("Verification Capcha")
          .setDescription(messages.description)
          .addFields({ name: `Additional Notes:`, value: messages.notes })
          .setImage(`attachment://captcha.png`),
      ],
      files: [attachment],
    })
    .catch(() => {
      member.kick(messages.dmDisabled);
    });

  const filter = (msg: Message) => msg.author.id === id;
  const collector = member.dmChannel?.createMessageCollector({
    filter,
    time: 120000,
    max: 3,
  });

  let attempts = 0;
  collector?.on("collect", (msg) => {
    attempts++;
    const memberInput = msg.content.toLowerCase();

    if (memberInput === captcha.text?.toLowerCase()) {
      const role = guild.roles.cache.find((r) => r.id === settings.captcha?.role);
      if (role) {
        member.roles.add(role);
        member.send({
          embeds: [new Embed().setDescription(messages.success)],
        });
        if (attempts <= 2) {
          collector.stop();
        }
      } else {
        member.send({
          embeds: [new Embed().setDescription(messages.roleInvalid)],
        });
      }
    } else {
      if (attempts >= 3) {
        member.kick(messages.failed);
        member.send({
          embeds: [new Embed().setDescription(messages.failed)],
        });
      } else {
        member.send({
          embeds: [new Embed().setDescription(messages.wrongCode)],
        });
      }
    }
  });

  collector?.on("end", (collected, reason) => {
    if (reason === "time") {
      member.kick(messages.failed);
      member.send({
        embeds: [new Embed().setDescription(messages.timedout)],
      });
    }
  });
});
