import { Buttons } from "@typings/modules/component";

const UNCLAIMTicket: Buttons = {
  id: "tickets:create-send:select-menu:button:renunce-send",
  maintenance: true,
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute() {
    // Code here
  },
};

export = UNCLAIMTicket;
