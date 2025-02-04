import { Buttons } from "@typings/modules/component";

const CLAIMTicket: Buttons = {
  id: "tickets:create-send:select-menu:button:claim-send",
  maintenance: true,
  tickets: true,
  owner: false,
  permissions: ["SendMessages"],
  botpermissions: ["SendMessages"],
  async execute() {
    // Code here
  },
};

export = CLAIMTicket;
