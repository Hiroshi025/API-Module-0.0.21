import { Request, Response } from "express";

import { manager } from "@/index";
import { OrderService } from "@backend/domain/service/utils.service";

export class OrdersCtrl {
  static GetOrder = async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const data = await manager.prisma.order.findUnique({ where: { id: id } });
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: "Order not found",
            date: new Date(),
          },
        });
      }

      return res.status(200).json({
        data: {
          order: data,
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
  static GetOrders = async (req: Request, res: Response) => {
    try {
      const reviced = JSON.parse(manager.cache.get("orders") || "[]");
      if (reviced) {
        return res.status(200).json({
          data: {
            acount: reviced.length,
            orders: reviced,
          },
          errors: null,
        });
      }

      const data = await manager.prisma.order.findMany();
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: "Orders not found",
            date: new Date(),
          },
        });
      }

      manager.cache.set("orders", JSON.stringify(data), 60 * 60);
      return res.status(200).json({
        data: {
          acount: data.length,
          orders: data,
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
  static EditOrder = async (req: Request, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;
    try {
      const data = await manager.prisma.order.findUnique({ where: { id: id } });
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: "Order not found",
            date: new Date(),
          },
        });
      }

      const approved = ["pending", "approved", "rejected"];
      await manager.prisma.order.update({
        where: { id: id },
        data: {
          status: approved.includes(status) ? status : "pending",
        },
      });

      return res.status(200).json({
        data: {
          message: "Order updated",
          order: data,
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
  static DeleteOrder = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const data = await manager.prisma.order.findUnique({ where: { id: id } });
      if (!data) {
        return res.status(404).json({
          data: null,
          errors: {
            message: "Order not found",
            date: new Date(),
          },
        });
      }

      await manager.prisma.order.delete({ where: { id: id } });
      return res.status(200).json({
        data: {
          message: "Order deleted",
          order: data,
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
  static CreateOrder = async (req: Request, res: Response) => {
    const { name, image, price, type, payment, info, status, userId } = req.body;
    const data = await OrderService({ name, image, price, type, payment, info, status, userId });
    switch (data.code) {
      case 200: {
        return res.status(200).json({ message: data.code, data: data.data });
      }
      case 400: {
        return res.status(400).json({ error: data.errors });
      }
      default: {
        return res.status(500).json({ error: data.errors });
      }
    }
  };
}
