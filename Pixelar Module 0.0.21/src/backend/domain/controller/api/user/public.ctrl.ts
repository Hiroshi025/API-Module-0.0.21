import { Request, Response } from "express";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { config } from "@lib/utils/config";

export class UserCtrl {
  static Health = async (req: Request, res: Response) => {
    //obtendremos datos de memoria, ram, cpu, puerto, etc
    //uso de cpu, ram, etc
    try {
      const { env } = process;
      const data = {
        port: env.PORT || null,
        platform: process.platform,
        ram: process.memoryUsage().rss / 1024 / 1024, //bytes
        cpu: process.cpuUsage(), //microsegundos
        uptime: process.uptime(),
      };

      return res.status(200).json({
        data: {
          message: req.t("api:controllers.public.health.200"),
          client: data,
          errors: null,
        },
      });
    } catch (error: any) {
      return res.status(500).json({
        data: null,
        errors: {
          message: req.t("api:controllers.public.health.500"),
          details: error.message,
        },
      });
    }
  };
  static RoleApiList = async (req: Request, res: Response) => {
    const roles = config.express.roles;
    return res.status(200).json({
      data: {
        message: req.t("api:controllers.public.rolelist.200"),
        data: roles,
      },
      errors: null,
    });
  };
}
