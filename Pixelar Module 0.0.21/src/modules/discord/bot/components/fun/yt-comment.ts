import { AttachmentBuilder, ChannelType } from "discord.js";

import { Embed } from "@lib/extenders/discord/embeds.extend";
import { createCanvas, loadImage } from "@napi-rs/canvas";
import { Precommand } from "@typings/index";

const ytCommand: Precommand = {
  name: 'yt-comment',
  description: 'Create a YouTube comment image with a custom comment.',
  examples: ['yt-comment @User I love this image!', 'yt-comment @User I hate this image!'],
  nsfw: false,
  category: 'fun',
  owner: false,
  cooldown: 5,
  aliases: ['yt-comment', 'youtube-comment', 'ytcomment'],
  botpermissions: ['SendMessages'],
  permissions: ['SendMessages'],
  async execute(client, message, args, prefix) {
    if (!message.guild || !message.channel || message.channel.type !== ChannelType.GuildText) return;
    const user = message.mentions.users.first() || message.author;
    const comment = args.slice(1).join(' ');
    if (!comment)
      return message.channel.send({
        embeds: [
          client.embed({
            description: [
              `${client.getEmoji(message.guild.id).error} You need to provide a comment to be displayed on the image!`,
              `**Usage:** \`${prefix}yt-comment <user> <comment>\``,
            ].join('\n'),
            color: 'Red',
          }),
        ],
      });

    const image = user.displayAvatarURL({
      size: 128,
      extension: 'png',
      forceStatic: true,
    });

    const targetImage = await loadImage(image.split('?')[0]);
    const background = await loadImage('./assets/discord/yt-comment.png');

    const canvas = createCanvas(background.width, background.height);
    const context = canvas.getContext('2d');

    context.drawImage(background, 0, 0, canvas.width, canvas.height);

    context.imageSmoothingEnabled = true;

    context.translate(0, 10);
    context.save();
    context.beginPath();
    context.arc(61, 35, 25, 0, Math.PI * 2, true);
    context.closePath();
    context.clip();

    context.drawImage(targetImage, 36, 35 - 25, 50, 50);

    context.restore();

    context.translate(105, 10);

    context.font = 'semibold 19px Arial';
    context.fillStyle = '#f1f1f1';

    const usernameWidth = context.measureText(`@${user.username}`).width;

    context.fillText(`@${user.username}`, 0, 15);

    context.font = '18px Arial';
    context.fillStyle = '#aaaaaa';
    context.fillText('26 minutes ago', usernameWidth + 10, 15);

    context.font = '20px Arial';
    context.fillStyle = '#f1f1f1';
    context.fillText(comment, 0, 50);

    const file = new AttachmentBuilder(canvas.toBuffer('image/png'), {
      name: 'yt-comment.png',
    });

    const embed = new Embed()
      .setImage('attachment://yt-comment.png')
      .setColor('Random')
      .setTitle('PH Comment - Image')
      .setTimestamp();

    await message.delete();
    message.channel.send({ embeds: [embed], files: [file] });
  },
};
export = ytCommand;
