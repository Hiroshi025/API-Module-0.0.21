import { Request, Response } from "express";

import { client } from "@/index";
import { config } from "@lib/utils/config";

export class OwnerCtrl {
  static ReloadApps = async (req: Request, res: Response) => {
    const { bot } = req.params;
    if (!bot) {
      return res.status(400).json({
        errors: "Missing bot",
        data: null,
      });
    }

    if (!config.apps.includes(bot)) {
      return res.status(400).json({
        errors: "Invalid bot",
        data: config.apps,
      });
    }

    switch (bot) {
      case "discord": {
        await client.destroy();
        await client.login(process.env.TOKEN);

        return res.status(200).json({
          errors: null,
          data: "Discord bot reloaded",
        });
      }
      default: {
        return res.status(400).json({
          errors: "Invalid bot",
          data: null,
        });
      }
    }
  };
}
