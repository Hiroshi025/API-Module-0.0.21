import {
	ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, CacheType,
	ChatInputCommandInteraction, EmbedBuilder, Message, StringSelectMenuInteraction
} from "discord.js";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { ButtonOptions, PaginationOptions } from "@typings/index";

export class EmbedPagination {
  private interaction: ChatInputCommandInteraction | StringSelectMenuInteraction;
  private pages: EmbedBuilder[] = [];
  private pageIndex = 0;
  private collector: any = null;
  private message: Message | null = null;
  private options: PaginationOptions = {
      method: null,
      keepIndex: false,
      buttons: {
          first: { label: '≪', style: ButtonStyle.Primary },
          previous: { label: '⇐', style: ButtonStyle.Primary },
          index: { disabled: false, label: '[ {index} / {max} ]', style: ButtonStyle.Secondary },
          next: { label: '⇒', style: ButtonStyle.Primary },
          last: { label: '≫', style: ButtonStyle.Primary }
      }
  };

  constructor(interaction: ChatInputCommandInteraction | StringSelectMenuInteraction) {
      if (!(interaction instanceof ChatInputCommandInteraction) && !(interaction instanceof StringSelectMenuInteraction)) {
          throw new Error(
              'Invalid interaction instance provided. Ensure you pass a valid Discord.js Interaction.'
          );
      }
      this.interaction = interaction;
  }

  keepIndexCount(input: boolean): this {
      if (typeof input !== 'boolean') {
          throw new Error('Invalid Input: keepIndex only takes Boolean as input.');
      }
      this.options.keepIndex = input;
      return this;
  }

  hideIndexButton(input: boolean): this {
      if (typeof input !== 'boolean') {
          throw new Error('Invalid Input: disableIndexButton only takes Boolean as input.');
      }
      this.options.buttons.index.disabled = input;
      return this;
  }

  changeButton(
      type: 'first' | 'previous' | 'index' | 'next' | 'last',
      options: Partial<ButtonOptions>
  ): this {
      if (options.label) {
          this.options.buttons[type].label = options.label;
      }
      if (options.style) {
          this.options.buttons[type].style = options.style;
      }
      return this;
  }

  addPages(embedsArray: EmbedBuilder[]): this {
      if (!Array.isArray(embedsArray) || embedsArray.some(embed => !(embed instanceof EmbedBuilder))) {
          throw new Error('Invalid embeds array: Provide an array consisting only of EmbedBuilder instances.');
      }
      if (this.options.method && this.options.method !== 'addEmbeds') {
          throw new Error('Conflicting method usage: Cannot use addPages after createPages.');
      }
      this.options.method = 'addEmbeds';
      this.pages.push(...embedsArray);
      return this;
  }

  createPages(content: string[], embed: EmbedBuilder, max = 6): this {
      if (!Array.isArray(content) || content.some(c => typeof c !== 'string')) {
          throw new Error('Invalid content format: Provide an array of strings for pagination.');
      }
      if (max < 1 || max > 15 || isNaN(max)) {
          throw new Error('Invalid maximum value: "max" should be a number between 1 and 15.');
      }
      if (!(embed instanceof EmbedBuilder)) {
          throw new Error('Invalid embed instance: Provide a valid EmbedBuilder instance for embedding content.');
      }
      if (this.options.method && this.options.method !== 'createPages') {
          throw new Error('Conflicting method usage: Cannot use createPages after addPages.');
      }

      const maxPage = Math.ceil(content.length / max);

      this.pages = content.reduce<EmbedBuilder[]>((pages, _, i) => {
          if (i % max === 0) {
              const pageContent = [
                  embed.data.description,
                  ...content.slice(i, i + max)
              ]
                  .filter(Boolean)
                  .join('\n\n');
              const newEmbed = EmbedBuilder.from(embed)
                  .setDescription(pageContent)
                  .setFooter({
                      text: `Page ${Math.floor(i / max) + 1} out of ${maxPage}`
                  });
              pages.push(newEmbed);
          }
          return pages;
      }, []);

      this.options.method = 'createPages';
      return this;
  }

  async display(): Promise<this> {
      if (!this.pages.length) {
          throw new Error('Display error: No pages are available to display.');
      }

      this.pageIndex = this.options.keepIndex
          ? Math.min(this.pageIndex, this.pages.length - 1)
          : 0;

      if (this.collector) this.collector.stop();

      const response = {
          embeds: [this.pages[this.pageIndex]],
          components: this.pages.length > 1 ? [this.createButtons()] : []
      };

      try {
          await this.interaction.reply(response);
          this.message = await this.interaction.fetchReply();
      } catch {
          await this.interaction.editReply(response);
      }

      this.setupCollector();
      return this;
  }

  private createButtons(disabled = false): ActionRowBuilder<ButtonBuilder> {
      const { first, previous, index, next, last } = this.options.buttons;
      const formattedLabel = index.label.replace(/{index}|{max}/g, match =>
          match === '{index}'
              ? `${this.pageIndex + 1}`
              : `${this.pages.length}`
      );

      const row = new ActionRowBuilder<ButtonBuilder>()
          .addComponents(
              new ButtonBuilder()
                  .setCustomId('@pageFirst')
                  .setLabel(first.label)
                  .setStyle(first.style)
                  .setDisabled(disabled || this.pageIndex === 0),
              new ButtonBuilder()
                  .setCustomId('@pagePrev')
                  .setLabel(previous.label)
                  .setStyle(previous.style)
                  .setDisabled(disabled || this.pageIndex === 0)
          );

      if (!index.disabled) {
          row.addComponents(
              new ButtonBuilder()
                  .setCustomId('@pageIndex')
                  .setLabel(formattedLabel)
                  .setStyle(index.style)
                  .setDisabled(true)
          );
      }

      row.addComponents(
          new ButtonBuilder()
              .setCustomId('@pageNext')
              .setLabel(next.label)
              .setStyle(next.style)
              .setDisabled(disabled || this.pageIndex === this.pages.length - 1),
          new ButtonBuilder()
              .setCustomId('@pageLast')
              .setLabel(last.label)
              .setStyle(last.style)
              .setDisabled(disabled || this.pageIndex === this.pages.length - 1)
      );

      return row;
  }

  private setupCollector(): void {
      if (!this.message) return;

      this.collector = this.message.createMessageComponentCollector({ idle: 60000 });

      this.collector.on('collect', async (i: ButtonInteraction<CacheType>) => {
          if (!(i instanceof ButtonInteraction) || !i.customId.startsWith('@page')) return;
          if (i.user.id !== this.interaction.user.id) {
              return i.reply({ content: 'You do not have permission to use this button.', ephemeral: true });
          }

          switch (i.customId) {
              case '@pageFirst':
                  this.pageIndex = 0;
                  break;
              case '@pagePrev':
                  this.pageIndex = Math.max(this.pageIndex - 1, 0);
                  break;
              case '@pageNext':
                  this.pageIndex = Math.min(this.pageIndex + 1, this.pages.length - 1);
                  break;
              case '@pageLast':
                  this.pageIndex = this.pages.length - 1;
                  break;
          }

          await this.updatePagination(i);
      });

      this.collector.on('end', () => {
          this.interaction.editReply({ components: [] });
      });
  }

  private async updatePagination(interaction: ButtonInteraction): Promise<void> {
      if (!this.message) return;

      const buttons = this.createButtons();
      interaction.update({ embeds: [this.pages[this.pageIndex]], components: [buttons] });
  }
}
