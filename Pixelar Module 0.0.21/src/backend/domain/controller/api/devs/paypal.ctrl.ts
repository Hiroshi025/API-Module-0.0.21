import axios from "axios";
import { WebhookClient } from "discord.js";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Request, Response } from "express";

import { Embed } from "@lib/extenders/discord/embeds.extend";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { Links, Order } from "@typings/api/paypal";
import { HostURL } from "@utils/functions";

export class PayPalCtrl {
  static CreateOrder = async (req: Request, res: Response) => {
    try {
      const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API } = process.env;
      const { value, description, company } = req.body as Order;

      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !PAYPAL_API) {
        throw new Error("Missing PayPal environment variables");
      }

      const order = {
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: "USD",
              value: value,
            },
            description: description,
          },
        ],
        application_context: {
          brand_name: company.name,
          landing_page: "LOGIN",
          user_action: "PAY_NOW",
          return_url: `${HostURL()}/api/v1/devs/paypal/capture-order`,
          cancel_url: `${HostURL()}/api/v1/devs/paypal/cancel-order`,
        },
      };

      // Obtener el access token
      const {
        data: { access_token },
      } = await axios({
        method: "POST",
        url: `${PAYPAL_API}/v1/oauth2/token`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_CLIENT_SECRET,
        },
        params: new URLSearchParams({ grant_type: "client_credentials" }),
      });

      // Crear la orden
      const {
        data: { links },
      } = await axios({
        method: "POST",
        url: `${PAYPAL_API}/v2/checkout/orders`,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_CLIENT_SECRET,
        },
        data: order,
      });

      const approved = links.find((link: Links) => link.rel === "approve");
      if (!approved) {
        throw new Error("No approval link found in PayPal response");
      }

      logWithLabel(
        "custom",
        [`Order created for ${company.name}`, `> **Order ID:** ${approved.href}`].join("\n"),
        "Paypal"
      );

      return res.status(200).json({
        link: approved.href,
      });
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        logWithLabel("error", error.response?.data || "Unknown Axios error", "Paypal");
      } else {
        logWithLabel("error", error.message, "Paypal");
      }

      console.error(error);
      return res.status(500).json({
        error: error.message || "Internal Server Error",
      });
    }
  };
  static CaptureOrder = async (req: Request, res: Response) => {
    try {
      // Validar variables de entorno
      const { PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_API, DISCORD } = process.env;
      if (!PAYPAL_CLIENT_ID || !PAYPAL_CLIENT_SECRET || !PAYPAL_API || !DISCORD) {
        throw new Error("Missing PayPal or Discord environment variables");
      }

      // Validar el token en la URL
      const { token } = req.query;
      if (!token) {
        return res.status(400).json({ error: "Missing token in the query parameters" });
      }

      // Obtener el access token de PayPal
      const params = new URLSearchParams();
      params.append("grant_type", "client_credentials");

      const {
        data: { access_token },
      } = await axios({
        method: "POST",
        url: `${PAYPAL_API}/v1/oauth2/token`,
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        auth: {
          username: PAYPAL_CLIENT_ID,
          password: PAYPAL_CLIENT_SECRET,
        },
        params: params,
      });

      // Capturar la orden de PayPal
      const { data } = await axios({
        method: "POST",
        url: `${PAYPAL_API}/v2/checkout/orders/${token}/capture`,
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      });

      // Enviar el webhook a Discord
      const webhook = new WebhookClient({ url: config.bot.webhooks.paypal });
      if (!webhook) {
        throw new Error("Failed to initialize WebhookClient");
      }

      const embed = new Embed().setTitle("PayPal Order - Capture Log").setFields(
        {
          name: "__Client Information",
          value: [
            `> **User:** ${data.payer.name.given_name} ${data.payer.name.surname}`,
            `> **Email:** ${data.payer.email_address}`,
            `> **Country:** ${data.payer.address.country_code}`,
          ].join("\n"),
          inline: false,
        },
        {
          name: "__Order Information",
          value: [
            `> **Order ID:** ${data.id}`,
            `> **Status:** ${data.status}`,
            `> **Amount:** ${data.purchase_units[0].amount.value} ${data.purchase_units[0].amount.currency_code}`,
          ].join("\n"),
          inline: false,
        }
      );

      await webhook.send({ embeds: [embed] });

      // Redireccionar a Discord
      return res.redirect(DISCORD);
    } catch (error: any) {
      // Manejar errores de Axios
      if (axios.isAxiosError(error)) {
        logWithLabel("error", error.response?.data || "Unknown Axios error", "Paypal");
      } else {
        logWithLabel("error", error.message, "Paypal");
      }

      console.error(error);
      return res.status(500).json({
        error: error.message || "Internal Server Error",
      });
    }
  };
  static RefundOrder = async (req: Request, res: Response) => {
    return res.redirect(process.env.WEB as string);
  };
}
