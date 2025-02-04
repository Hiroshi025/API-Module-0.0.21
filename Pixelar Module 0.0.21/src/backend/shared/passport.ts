import passport from "passport";
import { Strategy } from "passport-discord";

import { config } from "@lib/utils/config";

const { CLIENTID, CLIENTSECRET, CALLBACK_URL } = process.env;
passport.serializeUser((user, done) => {
  done(null, user);
});

passport.deserializeUser((obj: Express.User, done) => {
  done(null, obj);
});

passport.use(
  new Strategy(
    {
      clientID: CLIENTID ? CLIENTID : config.express.client_id,
      clientSecret: CLIENTSECRET ? CLIENTSECRET : config.express.client_secret,
      callbackURL: CALLBACK_URL ? CALLBACK_URL : config.express.callback,
      scope: ["identify", "guilds"],
    },
    async (accessToken, refreshToken, profile, done) => {
      return done(null, profile);
    }
  )
);

export { passport };
