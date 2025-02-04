export interface BotConfig {
  name: string;
  apps: string[];
  bot: BotOptions;
  express: ExpressOptions;
  paths:Paths;
  apis: APIS;
}

interface APIS {
  pokedex: string;
}

interface Paths {
  database: string;
  discord: string;
  swagger: string;
  logs:string;
  whatsapp: string;
}

interface BotOptions {
  console: boolean;
  prefix: string;
  owners: string[];
  logs: string[];
  "addon-extensions": string[];
  "bot-extensions": string[];
  webhooks: BotWebhooks;
  tickets: BotTickets;
}

interface BotWebhooks {
  error: string;
  console: string;
  paypal: string;
}

interface BotTickets {
  permissions: {
    user: string[];
    role: string[];
  };
  time: number;
  message: {
    embed: {
      title: string;
      description: string;
    };
  };
  options: {
    "max-ticket-amout": number;
    times: {
      "time-1": number;
      "time-2": number;
    };
    button: {
      url: string;
      label: string;
    };
  };
}

interface ExpressOptions {
  host: string;
  port: number;
  callback: string;
  client_secret: string;
  client_id: string;
  "static-dirs": string[];
  prefix: string;
  website: ExpressWebsite;
  keys: ExpressKeys;
  swagger: {
    name: string;
    version: string;
    url: string;
    docs: string;
    auth: {
      name: string;
      password: string;
    }
  };
  roles: string[];
}

interface ExpressWebsite {
  channel: string;
  role: string;
  guild: string;
}

interface ExpressKeys {
  utils: string;
  clients: string;
  development: string;
}
