import fs from "fs";
import qrcode from "qrcode-terminal";
import { Client, LocalAuth, Message, MessageContent } from "whatsapp-web.js";

import { manager } from "@/index";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";

import { historial } from "./utils/history";

/**
 * @name WhatsApp
 * @description The class WhatsApp is responsible for managing the WhatsApp service
 * @alias WHATSAPP_MODE
 * @access public
 * 
 * @example
 * import { WhatsApp } from "@/modules/whatsapp/whatsapp";
 * const whatsapp = new WhatsApp();
 * whatsapp.start();
 */
export class WhatsApp {
  private client!: Client;
  constructor() {}

  private withOutSession = async () => {
    this.client = new Client({
      authStrategy: new LocalAuth({
        dataPath: `${config.paths.whatsapp}/session`,
      }),
      puppeteer: {
        headless: true,
        args: ["--no-sandbox"],
      },
    });

    this.client.on("qr", (qr) => {
      logWithLabel("custom", "QR RECEIVED. PLEASE SCAN", "WhatsApp");
      qrcode.generate(qr, { small: true });
    });

    this.client.on("ready", () => {
      logWithLabel("custom", "Client is ready!", "WhatsApp");
      this.listenMessage();
    });

    this.client.on("authenticated", () => {
      logWithLabel("custom", "AUTHENTICATED the session is ready to be used Client", "WhatsApp");
      logWithLabel("custom", "Registered Client on the Web", "WhatsApp");
    });

    this.client.on("auth_failure", () => {
      logWithLabel("custom", "AUTHENTICATION FAILURE", "WhatsApp");
      logWithLabel("custom", "The session has expired or is invalid", "WhatsApp");
    });

    this.client.initialize();
  };

  private findResponse = async (message: string) => {
    const dataMSG = await manager.prisma.messageWhatsapp.findMany();
    if (!dataMSG) return false;

    const foundItem = dataMSG.find((item) => message.toLowerCase().includes(item.message.toLowerCase()));

    const response = foundItem ? foundItem.response : false;
    return response;
  };

  private sendMessage = (to: string, message: MessageContent) => {
    this.client.sendMessage(to, message);
  };

  private listenMessage = async () => {
    this.client.on("message", async (message) => {
      const { from, to, body } = message as Message;
      const response = await this.findResponse(body);
      historial(to, from, body);

      if (response) {
        this.sendMessage(from, response);
      } else if (message.hasMedia) {
        //const media = message.downloadMedia();
        logWithLabel("custom", `Media received from ${from} to ${to}`, "WhatsApp");
        const download = message.downloadMedia();
        download.then((m) => {
          const path = `${config.paths.whatsapp}/media/from/${m.filename}`;
          fs.writeFileSync(path, m.data, { encoding: "base64" });
        });
      }

      //from = es el numero de la persona que envia el mensaje
      //to = es el numero de la persona a la que se le envia
      logWithLabel("custom", `Message received from ${from} to ${to}`, "WhatsApp");
    });

    //HACK: Guardo mis propios mensajes multimedia
    this.client.on("message_create", (message) => {
      if (message.hasMedia) {
        //const media = message.downloadMedia();
        const download = message.downloadMedia();
        download.then((m) => {
          const path = `${config.paths.whatsapp}/media/to/${m.filename}`;
          fs.writeFileSync(path, m.data, { encoding: "base64" });
          logWithLabel("custom", `Media downloaded from ${message.from}`, "WhatsApp");
        });
      }
    });
  };

  public start = () => {
    if (process.env.WHATSAPP_MODE !== "true") {
      logWithLabel(
        "custom",
        [
          "The WhatsApp service is disabled in the .env file",
          "  ➜  Please set the variable WHATSAPP_MODE to true",
        ].join("\n"),
        "WhatsApp"
      );
      return;
    }
    this.withOutSession();
  };
}
