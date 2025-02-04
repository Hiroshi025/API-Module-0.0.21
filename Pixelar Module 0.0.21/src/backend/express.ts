/* eslint-disable @typescript-eslint/no-require-imports */
/* eslint-disable @typescript-eslint/no-explicit-any */

import chalk from "chalk";
import cors from "cors";
import express, { Application } from "express";
import session from "express-session";
import helmet from "helmet";
import { debug } from "node:console";
import { createServer } from "node:http";
import path from "node:path";
import { Server } from "socket.io";
import SwaggerParser from "swagger-parser";
import swStats from "swagger-stats";
import swaggerUi from "swagger-ui-express";

import { i18nMiddleware } from "@/i18n-lang";
import { config } from "@lib/utils/config";
import { logWithLabel } from "@lib/utils/log";
import { HostURL } from "@utils/functions";

import { passport } from "./shared/passport";
import { router } from "./shared/routes";
import swaggerSetup from "./shared/swagger";

/**
 * @name APIClient
 * @description The `APIClient` class is responsible for setting up an Express application, configuring middleware,
 * @method setMiddleware - The `setMiddleware` function configures various middleware for an Express application, including body
 * @method start - The `start` function listens on a specified port and logs server information upon successful start.
 * @method setupRoutes - The `setupRoutes` function configures the routes for an Express application, including session
 *
 */
export class APIClient {
  public app: Application;
  public server: any;
  public io: Server;
  constructor() {
    this.app = express();

    this.server = createServer(this.app);
    this.io = new Server(this.server);

    this.setupRoutes();
    this.setMiddleware();
  }

  /**
   * The setMiddleware function configures various middleware for an Express application, including body
   * parsing, session management, view engine setup, and route handling.
   */
  private async setMiddleware() {
    this.app.use(express.urlencoded({ extended: true }));
    this.app.use(passport.initialize());
    this.app.set("view engine", "ejs");
    this.app.use(passport.session());
    this.app.disable("x-powered-by");
    this.app.set("trust proxy", 1);
    this.app.use(express.json());
    this.app.use(i18nMiddleware);
    this.app.use(router);
    this.app.use(cors());

    this.app.use(config.express.swagger.docs, swaggerUi.serve, swaggerUi.setup(swaggerSetup));
    this.app.use(helmet({ contentSecurityPolicy: false }));

    //************* SWAGGER ROUTES API *****************//

    const specLocation = config.paths.swagger;
    const swagger = config.express.swagger;
    let swaggerSpec = null;
    const app = this.app;
    SwaggerParser.prototype.validate(specLocation, function (err, api) {
      if (!err) {
        logWithLabel("custom", `Swagger API: ${api?.info.title} v${api?.info.version}`, "Api");
        swaggerSpec = api;
        app.use(
          swStats.getMiddleware({
            name: swagger.name,
            version: swagger.version,
            hostname: HostURL(),
            timelineBucketDuration: 60000,
            swaggerSpec: swaggerSpec,
            uriPath: swagger.url,
            durationBuckets: [50, 100, 200, 500, 1000, 5000],
            requestSizeBuckets: [500, 5000, 15000, 50000],
            responseSizeBuckets: [600, 6000, 6000, 60000],
            apdexThreshold: 50,
            onResponseFinish: function (req, res, rrr) {
              debug("onResponseFinish: %s", JSON.stringify(rrr));
            },
            authentication: true,
            onAuthenticate(req, username, password) {
              return username === swagger.auth.name && password === swagger.auth.password;
            },
          })
        );
      } else {
        logWithLabel("custom", `Swagger API: ${err}`, "Api");
        return;
      }
    });

    //************* SWAGGER ROUTES API *****************//
  }

  /**
   * The `start` function listens on a specified port and logs server information upon successful start.
   * port number on which the server will listen for incoming connections. This port number is used to
   * identify different services running on the same server.
   */
  public start(port: number): void {
    this.server.listen(port, () => {
      logWithLabel(
        "custom",
        [
          `Server Listening on Port Configuration: ${port}`,
          chalk.grey(`✅ Server Started at ${HostURL()}`),
        ].join("\n"),
        "Api"
      );
    });
  }

  /**
   * The `setupRoutes` function configures the routes for an Express application, including session
   * management, static file serving, and socket.io connection handling.
   *
   * The `session` middleware is used to create a session object that is stored in the request object.
   * The `secret` option is used to sign the session ID cookie, while the `resave` and `saveUninitialized`
   */
  private setupRoutes() {
    this.app.use(
      session({
        secret: process.env.SESSION_SECRET as string,
        resave: false,
        saveUninitialized: false,
        cookie: { maxAge: 3600000 / 2 }, // esto es para que la sesion dure 30 minutos
        rolling: true, // esto es para que la sesion se renueve cada vez que se haga una peticion
        store: new (require("connect-sqlite3")(session))({
          db: "sessions.sqlite",
          dir: `${config.paths.database}/temp/`,
        }),
      })
    );

    /*this.app.use((req: Request, res: Response, next: NextFunction) => {
      const start = Date.now();
      let requestBodySize = 0;

      req.on("data", (chunk) => {
        requestBodySize += chunk.length;
      });

      res.on("finish", () => {
        const duration = Date.now() - start;

        // Log request information
        logWithLabel(
          "custom",
          [
            `${chalk.cyanBright("Request")} -> ${chalk.grey(req.method)} ${chalk.grey(req.path)}`,
            `  ➜  ${chalk.grey("Status:")} ${res.statusCode}`,
            `  ➜  ${chalk.grey("Size:")} ${Math.round(requestBodySize / 1000)} KB`,
            `  ➜  ${chalk.grey("Duration:")} ${duration}ms`,
          ].join("\n"),
          "Api"
        );
      });
      next();
    });*/

    this.io.on("connection", (socket) => {
      logWithLabel(
        "custom",
        [
          `Socket Connection Established: ${socket.id}`,
          `  ➜  ${chalk.grey("Socket Connected")}`,
          `  ➜  ${chalk.grey("Socket ID:")} ${socket.id}`,
        ].join("\n"),
        "Express"
      );
    });

    /* This part of the code is setting up static file serving for different directories like css, js, img,
      assets, and json. Here's a breakdown of what it does: */
    this.app.set("views", path.join(__dirname, "view"));
    const publicDir = path.join(__dirname, "view", "public");
    //const staticDirs = ["css", "js", "assets", "vendor", "fonts", "images", "scss"];
    config.express["static-dirs"].forEach((dir): void => {
      const staticPath = path.join(publicDir, dir);
      this.app.use(
        `/${dir}`,
        express.static(staticPath, {
          setHeaders: (res, filePath) => {
            if (filePath.endsWith(".js")) {
              res.setHeader("Content-Type", "application/javascript");
            }
          },
        })
      );
    });
  }
}
