import { Request, Response } from "express";

/* eslint-disable @typescript-eslint/no-explicit-any */
import { manager } from "@/index";

export class SourceCtrl {
  static Get = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const db = await manager.prisma.sourceBin.findUnique({
        where: {
          id: id,
        },
      });

      return res.status(200).json({
        data: {
          message: req.t("api:controllers.source.get.200.sourcecodefound"),
          data: db,
        },
        errors: null,
      });
    } catch (error: any) {
      return res.status(500).json({
        data: null,
        errors: {
          message: req.t("api:controllers.source.get.500.failedtogetsourcecode"),
          details: error.message,
        },
      });
    }
  };
  static Create = async (req: Request, res: Response) => {
    try {
      const { userId, title, content, lenguage } = req.body;

      // checar si los campos requeridos estan presentes
      if (!userId || !title || !content || !lenguage) {
        return res.status(400).json({
          data: null,
          errors: {
            message: req.t("api:controllers.source.create.400.notfoundfields"),
          },
        });
      }

      const db = await manager.prisma.sourceBin.create({
        data: {
          userId,
          title,
          content,
          lenguage,
        },
      });

      return res.status(200).json({
        data: {
          message: req.t("api:controllers.source.create.200.sourcecodesaved"),
          url: "/api/v1/sources/" + db.id,
          data: db,
        },
        errors: null,
      });
    } catch (error: any) {
      return res.status(500).json({
        data: null,
        errors: {
          message: req.t("api:controllers.source.create.500.failedtosavesourcecode"),
          details: error.message,
        },
      });
    }
  };
  static Delete = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const db = await manager.prisma.sourceBin.delete({
        where: {
          id: id,
        },
      });

      return res.status(200).json({
        data: {
          message: req.t("api:controllers.source.delete.200.sourcecodedeleted"),
          data: db,
        },
        errors: null,
      });
    } catch (error: any) {
      return res.status(500).json({
        data: null,
        errors: {
          message: req.t("api:controllers.source.delete.500.failedtodeletesourcecode"),
          details: error.message,
        },
      });
    }
  }
  static Update = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { userId, title, content, lenguage } = req.body;

      const db = await manager.prisma.sourceBin.update({
        where: {
          id: id,
        },
        data: {
          userId,
          title,
          content,
          lenguage,
        },
      });

      return res.status(200).json({
        data: {
          message: req.t("api:controllers.source.update.200.sourcecodeupdated"),
          data: db,
        },
        errors: null,
      });
    } catch (error: any) {
      return res.status(500).json({
        data: null,
        errors: {
          message: req.t("api:controllers.source.update.500.failedtoupdatesourcecode"),
          details: error.message,
        },
      });
    }
  }
}
