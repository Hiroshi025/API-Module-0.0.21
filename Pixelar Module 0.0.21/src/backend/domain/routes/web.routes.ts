import { TextChannel } from "discord.js";
import { Request, Response } from "express";
import os from "os";

import { client, manager } from "@/index";
import { AuthWeb } from "@backend/domain/middleware/auth";
import { RoleAdmin } from "@backend/domain/middleware/permissions";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { TRoutesInput, User } from "@typings/api/express";

import { name } from "../../../../package.json";

const format = (str: string): string => `/web${str}`;
export default ({ app }: TRoutesInput) => {
  //Home
  app.get(format("/home"), (req: Request, res: Response) => {
    res.render("pages/home/home.ejs", {
      botname: client.user ? client.user.username : name,
      user: req.user,
    });
  });

  //Welcome
  app.get(format("/welcome"), (req: Request, res: Response) => {
    res.render("pages/home/welcome.ejs", {
      botname: client.user ? client.user.username : name,
      user: req.user,
    });
  });

  app.get(format("/error-404"), (req: Request, res: Response) => {
    res.render("pages/errors/error-404.ejs", {
      botname: client.user ? client.user.username : name,
      error: "Page not found",
      user: req.user,
    });
  });

  app.get(format("/error-500"), (req: Request, res: Response) => {
    res.render("pages/errors/error-500.ejs", {
      botname: client.user ? client.user.username : name,
      user: req.user,
    });
  });

  app.get(format("/sources/view/:id"), async (req: Request, res: Response) => {
    const id = req.params.id;

    const data = await manager.prisma.sourceBin.findUnique({ where: { id } });
    if (!data) {
      res.render("pages/errors/error-404.ejs", {
        error: "Source not found",
        botname: client.user ? client.user.username : name,
        user: req.user,
      });
      return;
    }

    const codeSource = {
      userId: data.userId,
      title: data.title,
      content: data.content,
      lenguage: data.lenguage,
    };
    
    res.render("pages/home/source.ejs", {
      botname: client.user ? client.user.username : name,
      codeSource,
      user: req.user,
      id,
    });
  });

  app.get(format("/sources/view"), async (req: Request, res: Response) => {
    res.render("pages/home/source.ejs", {
      botname: client.user ? client.user.username : name,
      codeSource: {},
      user: req.user,
    });
  });

  app.get(format("/dashboard"), AuthWeb, async (req: Request, res: Response) => {
    try {
    //const dataUser = await manager.prisma.user.findUnique({ where: { userId: (req.user as User).id } });
    //if (!dataUser) res.redirect("/auth/logout");

    //Obtendremos los 5 ultimos mensajes de un canal de discord y sacaremos el avatar, name, hora de envio y contenido
    const channel = client.channels.cache.get(config.express.website.channel);
    if (!channel) {
      res.render("pages/errors/error-404.ejs", {
        error: "Channel config not found discord server",
        botname: client.user ? client.user.username : name,
        user: req.user,
      });
      return;
    }

    const messages = await (channel as TextChannel).messages.fetch({ limit: 5 });
    const messagesArray = messages.map((m) => {
      return {
        avatar: m.author.displayAvatarURL({ forceStatic: true }),
        name: m.author.username,
        time: m.createdAt.toLocaleString(),
        content: m.content.length > 30 ? m.content.slice(0, 30) + "..." : m.content,
      };
    });

    //obtendremos el uso de la ram, nombre de la maquina y version de node
    const ram = os.totalmem() - os.freemem();
    const ramUsage = Math.round((ram / os.totalmem()) * 100);
    const machine = os.hostname();
    const nodeVersion = process.version;

    //cantidad de cntidad de servidores, el dia y hora actual fromato
    const guilds = client.guilds.cache.size;
    const date = new Date().toLocaleString();
    const day = new Date().getDay();
    const bots = client.guilds.cache.filter((g) => g.members.me?.user.bot).size;

    //obtenemos las tareas guardadas dentro de la base de datos
    const dataTasks = await manager.prisma.tasks.findMany();
    const tasksArray = dataTasks.map((t) => {
      return {
        id: t.id,
        content: t.content,
      };
    });

    //obtendremos la cantidad de usuarios total, hace cuanto se inicio el bot y la cantidad de comandos
    const usersAmount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const uptime = client.uptime;
    const commands = client.commands.size;

    //obtenemos los productos guardados filtrando los que el user a pedido
    const dataProduct = await manager.prisma.order.findMany({ where: { userId: (req.user as User).id } });
    const productsArray = dataProduct.map((p) => {
      return {
        id: p.id,
        name: p.name,
        image: p.image,
        number: p.number,
        price: p.price,
        quantity: p.quantity,
        metode: p.metode,
        status: p.status,
        date: p.date,
      };
    });

    res.render("dashboard.ejs", {
      botname: client.user ? client.user.username : name,
      messages: messagesArray,
      user: req.user,
      tasks: tasksArray,
      orders: productsArray,
      _client: client,
      machine: {
        ram: ramUsage,
        machine,
        nodeVersion,
      },
      server: {
        guilds,
        date,
        day,
        bots,
      },
      bot: {
        usersAmount,
        uptime,
        commands,
      },
    });
    } catch (error) {
      logWithLabel("custom", [
        `Error: ${error}`
      ].join("\n"), "Web")
      res.render("pages/errors/error-500.ejs", {
        botname: client.user ? client.user.username : name,
        user: req.user,
      });
    }
  });

  app.get(format("/dashboard/admins/:id"), AuthWeb, RoleAdmin, async (req: Request, res: Response) => {
    const ram = Math.round(((process.memoryUsage().heapUsed / 1024 / 1024) * 100) / 100);
    const cpu = Math.round(((process.cpuUsage().system / 1000) * 100) / 100); // CPU en GB
    const keyUtils = config.express.keys.utils;

    //obtendremos la cantidad de usuarios total, hace cuanto se inicio el bot y la cantidad de comandos
    const usersAmount = client.guilds.cache.reduce((acc, guild) => acc + guild.memberCount, 0);
    const uptime = client.uptime;
    const commands = client.commands.size;

    //cantidad de cntidad de servidores, el dia y hora actual fromato
    const guilds = client.guilds.cache.size;
    const date = new Date().toLocaleString();
    const day = new Date().getDay();
    const bots = client.guilds.cache.filter((g) => g.members.me?.user.bot).size;

    const dataProduct = await manager.prisma.order.findMany();
    const productsArray = dataProduct.map((p) => {
      return {
        id: p.id,
        name: p.name,
        image: p.image,
        number: p.number,
        price: p.price,
        quantity: p.quantity,
        metode: p.metode,
        status: p.status,
        date: p.date,
      };
    });


    res.render("administrator.ejs", {
      botname: client.user ? client.user.username : name,
      _client: client,
      user: req.user,
      userId: req.params.id,
      username: client.users.cache.get(req.params.id)?.username,
      keys: keyUtils,
      orders: productsArray,
      machine: {
        ram,
        cpu,
      },
      bot: {
        usersAmount,
        uptime,
        commands,
      },
      server: {
        guilds,
        date,
        day,
        bots,
      },
      usersapi: await manager.prisma.auth.findMany(),
    });
  });


  app.get(format("/dashboard/profile/:id"), AuthWeb, async (req: Request, res: Response) => {
    res.render("profile.ejs", {
      botname: client.user ? client.user.username : name,
      _client: client,
      user: req.user,
    });
  });

  app.get(format("/dashboard/downloads"), AuthWeb, async (req: Request, res: Response) => {
    const products = await manager.prisma.freeProduct.findMany();
    const productsArray = products.map((p) => {
        return {
            id: p.id,
            name: p.productname,
            image: p.image,
            description: p.description,
            url: p.url,
        };
    });

    res.render("downloads.ejs", {
      botname: client.user ? client.user.username : name,
      productsArray,
      _client: client,
      user: req.user,
    });
  });
};
