import { Request, Response } from "express";

import { manager } from "@/index";

export class CryptoCtrl {
  static GetApp = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await manager.prisma.botCrypto.findUnique({ where: { id: id } });
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: "Bot not found",
            date: new Date(),
          },
        });
      }

      return res.status(200).json({
        data: {
          bot: data,
        },
        errors: null,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        errors: {
          message: error,
          date: new Date(),
        },
      });
    }
  };
  static GetApps = async (req: Request, res: Response) => {
    try {
      const reviced = JSON.parse(manager.cache.get("cryptos") || "[]");
      if (reviced) {
        return res.status(200).json({
          data: {
            acount: reviced.length,
            cryptos: reviced,
          },
          errors: null,
        });
      }

      const data = await manager.prisma.botCrypto.findMany();
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: "Bots not found",
            date: new Date(),
          },
        });
      }

      manager.cache.set("cryptos", JSON.stringify(data), 60 * 60);
      return res.status(200).json({
        data: {
          acount: data.length,
          bots: data,
        },
        errors: null,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        errors: {
          message: error,
          date: new Date(),
        },
      });
    }
  };
  static EditApp = async (req: Request, res: Response) => {
    const { token } = req.params;
    const { enabled } = req.body;
    try {
      const data = await manager.prisma.botCrypto.findUnique({ where: { token: token } });
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: "Bot not found",
            date: new Date(),
          },
        });
      }

      const enableds = [true, false];
      await manager.prisma.botCrypto.update({
        where: { token: token },
        data: {
          enabled: enableds.includes(enabled) ? enabled : false,
        },
      });

      return res.status(200).json({
        data: {
          message: "Bot updated",
          bot: data,
        },
        errors: null,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        errors: {
          message: error,
          date: new Date(),
        },
      });
    }
  };
  static DeleteApp = async (req: Request, res: Response) => {
    const { token } = req.params;
    try {
      const data = await manager.prisma.botCrypto.findUnique({ where: { token: token } });
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: "Bot not found",
            date: new Date(),
          },
        });
      }

      await manager.prisma.botCrypto.delete({ where: { token: token } });
      return res.status(200).json({
        data: {
          message: "Bot deleted",
          bot: data,
        },
        errors: null,
      });
    } catch (error) {
      return res.status(500).json({
        data: null,
        errors: {
          message: error,
          date: new Date(),
        },
      });
    }
  };
}
