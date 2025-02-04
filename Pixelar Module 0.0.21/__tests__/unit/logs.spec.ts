import { logWithLabel } from "../../src/lib/utils/log"; // Ajusta la ruta según tu proyecto
import { WinstonFile } from "../../src/lib/utils/winston";

// Mock de WinstonFile
jest.mock("../../src/utils/winston", () => ({
  WinstonFile: jest.fn().mockResolvedValue({
    info: jest.fn(),
    error: jest.fn(),
  }),
}));

// Mock de WebhookClient
jest.mock("discord.js", () => ({
  WebhookClient: jest.fn().mockImplementation(() => ({
    send: jest.fn(),
  })),
}));

describe("logWithLabel", () => {
  const mockLogger = {
    info: jest.fn(),
    error: jest.fn(),
  };

  beforeEach(() => {
    (WinstonFile as jest.Mock).mockResolvedValue(mockLogger);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should throw ValidationError when using 'custom' label without customName", async () => {
    await expect(logWithLabel("custom", "Test message")).rejects.toThrow(
      "Custom label name must be provided when using the custom label type."
    );
  });

  it("should log an info message correctly", async () => {
    await logWithLabel("info", "Test info message");

    expect(mockLogger.info).toHaveBeenCalledWith("Test info message");
  });

  it("should log an error message correctly", async () => {
    await logWithLabel("error", "Test error message");

    expect(mockLogger.error).toHaveBeenCalledWith("Test error message");
  });
});
