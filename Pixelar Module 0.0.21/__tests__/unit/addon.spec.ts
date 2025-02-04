import { config } from "../../src/lib/utils/config";
import { Addons } from "../../src/modules/discord/class/addons";
import { BotClient } from "../../src/modules/discord/class/client";

jest.mock("@modules/discord/class/client", () => {
  return {
    BotClient: jest.fn().mockImplementation(() => {
      return {
        on: jest.fn(),
        login: jest.fn(),
      };
    }),
  };
});

describe("Addons Class", () => {
  let addon: Addons;
  const mockInitialize = jest.fn();
  beforeEach(() => {
    addon = new Addons({
      name: "example",
      description: "example description",
      author: "Assistent",
      version: "0.0.2",
      bitfield: ["SendMessages"]
    }, mockInitialize);
  });

  it("should initialize correctly with structure and initialize function", () => {
    expect(addon.structure).toEqual({
      name: "example",
      description: "example description",
      author: "Assistent",
      version: "0.0.2",
      bitfield: ["SendMessages"]
    });
    expect(typeof addon.initialize).toBe("function");
  });

  it("should call initialize with the correct parameters", () => {
    const mockClient = new BotClient();
    const mockConfig = config;

    addon.initialize(mockClient, mockConfig);
    expect(mockInitialize).toHaveBeenCalledWith(mockClient, mockConfig);
    expect(mockInitialize).toHaveBeenCalledTimes(1);
  });
});
