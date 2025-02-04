import { Request, Response } from "express";

import { client } from "@/index";
import { TRoutesInput } from "@typings/api/express";

import { passport } from "../../shared/passport";

const format = (str: string): string => `/auth${str}`;
export default ({ app }: TRoutesInput) => {
  //Auth
  app.get(format("/"), (req: Request, res: Response) => {
    res.render("pages/auth/login.ejs", {
      botname: client.user?.username,
      user: req.user,
    });
  });

  //Register
  app.get(format("/register"), (req: Request, res: Response) => {
    res.render("pages/auth/register.ejs", {
      botname: client.user?.username,
      user: req.user,
    });
  });

  //Login
  app.get(
    format("/login"),
    passport.authenticate("discord", {
      failureRedirect: "/auth/logout",
      successRedirect: "/web/dashboard",
    }),
    async (req: Request, res: Response) => {
      res.redirect("/web/dashboard");
    }
  );

  //Logout
  app.get(format("/logout"), async (req: Request, res: Response) => {
    res.render("pages/auth/logout.ejs", {
      botname: client.user?.username,
      user: req.user,
    });
  });
};
