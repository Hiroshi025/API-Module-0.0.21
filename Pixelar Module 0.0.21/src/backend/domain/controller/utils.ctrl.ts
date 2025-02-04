/* eslint-disable @typescript-eslint/no-explicit-any */
import {
	ActionRowBuilder, ButtonBuilder, ButtonStyle, userMention, WebhookClient
} from "discord.js";
import { Request, Response } from "express";

import { client } from "@/index";
import {
	CryptoService, OrderService, ProductService, TicketService, UpdateRoleService, WhatsappService
} from "@backend/domain/service/utils.service";
import { ErrorExpress } from "@backend/shared/handlers";
import { Embed } from "@lib/extenders/discord/embeds.extend";
import { logWithLabel } from "@lib/utils/log";
import { HostURL } from "@utils/functions";

export const AdminTranscripts = async (req: Request, res: Response) => {
  try {
    const file = await TicketService(req.params.file);
    if (!file) return res.redirect("/web/error-404");
    return res.sendFile(file);
  } catch (error) {
    logWithLabel("error", `Error: ${error}`);
    ErrorExpress(res, 500, "Internal Server Error");
  }
};

export const AdminUpdateRoleUser = async (req: Request, res: Response) => {
  try {
    const { userId, role } = req.body;
    if (!userId || !role) return res.status(400).json({ error: "Missing fields" });

    const data = await UpdateRoleService(userId, role);
    switch (data) {
      case "User not found":
        return res.status(404).json({ errors: "User not found" });
      case "Role updated":
        return res.status(200).json({ message: "Role updated" });
    }
  } catch (error: any) {
    logWithLabel("error", error);
    ErrorExpress(res, 500, error.message);
  }
};

export const AdminRegisterOrder = async (req: Request, res: Response) => {
  try {
    // Validación de los campos
    const { name, image, price, type, payment, info, status, userId } = req.body;
    const data = await OrderService({ name, image, price, type, payment, info, status, userId });
    switch (data.code) {
      case 200: {
        const user = client.users.cache.get(userId);
        const embed = new Embed()
          .setTitle("Order Create - Bot Asistent")
          .setDescription(
            [
              `${client.getEmoji(userId).info} **${user ? user.tag : "Unknown User"}**`,
              `Your order has been created within our services with the following information:\n`,
              "> **Order Name:** " + name,
              "> **Order Price:** " + price,
            ].join("\n")
          )
          .setFields(
            { name: "Order Type", value: `> **${type}**`, inline: true },
            { name: "Payment Method", value: `> **${payment}**`, inline: true },
            { name: "Order Status", value: `> **${status}**`, inline: true },
            { name: "Order Info", value: `> **${info}**` }
          );

        const button = new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setURL(`${HostURL()}/web/welcome`)
            .setLabel("View Transcript")
        );

        if (user) {
          await user
            .send({
              embeds: [embed],
              components: [button],
            })
            .catch(() => {});
        } else {
          const webhook = new WebhookClient({ url: client.config.bot.webhooks.paypal });
          if (!webhook) {
            throw new Error("Failed to initialize WebhookClient");
          }

          await webhook.send({
            embeds: [embed],
            components: [button],
            content: client.config.bot.owners.map((id) => userMention(id)).join(" "),
          });
        }

        return res.status(200).json({ message: "Order created" });
      }
      default: {
        logWithLabel("custom", `${data.errors}`, "Orders");
        return res.status(500).json({ error: data.errors });
      }
    }
  } catch (error: any) {
    console.error(error);
    return res.status(500).json({ error: "Internal Server Error", message: error.message });
  }
};

export const AdminWhatsapp = async (req: Request, res: Response) => {
  try {
    const { response, message, userId, username } = req.body;
    const data = await WhatsappService({ response, message, userId, username });
    switch (data.code) {
      case 200:
        return res.status(200).json({ message: data.message, data: data.data });
      case 400:
        return res.status(400).json({ error: data.errors });
    }
  } catch (error: any) {
    logWithLabel("error", error);
    ErrorExpress(res, 500, error.message);
  }
};

export const AdminRegisterBotCrypto = async (req: Request, res: Response) => {
  try {
    const { enabled, token, coinId, preferred, symbol, separator } = req.body;
    const data = await CryptoService({ enabled, token, coinId, preferred, symbol, separator });
    switch (data.code) {
      case 200:
        return res.status(200).json({ message: data.message, data: data.data });
      case 400:
        return res.status(400).json({ error: data.errors });
    }
  } catch (error) {
    logWithLabel("error", `Error: ${error}`);
    ErrorExpress(res, 500, "Internal Server Error");
  }
};

export const CreateProduct = async (req: Request, res: Response) => {
  try {
    const { name, description, image, url, userId } = req.body;
    const data = await ProductService({ name, description, image, url, userId });
    switch (data.code) {
      case 200:
        return res.status(200).json({ message: data.message, data: data.data });
      case 400:
        return res.status(400).json({ error: data.errors });
    }
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
