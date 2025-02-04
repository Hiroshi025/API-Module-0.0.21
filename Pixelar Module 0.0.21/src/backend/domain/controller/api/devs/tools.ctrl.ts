import { Request, Response } from "express";
import fetch from "node-fetch";

import { manager } from "@/index";
import { HostURL } from "@utils/functions";

export class ToolsCtrl {
  static GetSources = async (req: Request, res: Response) => {
    try {
      const reviced = JSON.parse(manager.cache.get("sources") || "[]");
      if (reviced) {
        return res.status(200).json({
          data: {
            acount: reviced.length,
            sources: reviced,
          },
          errors: null,
        });
      }

      const data = await manager.prisma.sourceBin.findMany();
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: req.t("api:controllers.getsource.404.sourcenotfound"),
            date: new Date(),
          },
        });
      }

      manager.cache.set("sources", JSON.stringify(data), 60 * 60);
      return res.status(200).json({
        data: {
          acount: data.length,
          sources: data,
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
  static GetTasks = async (req: Request, res: Response) => {
    try {
      const tasks = await manager.prisma.tasks.findMany();
      if (!tasks)
        return res.status(400).json({
          errors: req.t("api:controllers.gettasks.400.tasksnotfound"),
          data: null,
        });

      return res.status(200).json({
        errors: null,
        data: {
          acount: tasks.length,
          tasks,
        },
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
  static GetStats = async (req: Request, res: Response) => {
    try {
      const response = await fetch(`${HostURL}/swagger-stats/stats`);
      return res.status(200).json(await response.json());
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
