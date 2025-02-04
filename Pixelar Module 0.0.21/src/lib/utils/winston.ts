import winston, { format } from "winston";

/**
 * 
 * @name WinstonFile
 * @description Create a log file with winston library 
 * 
 * @param path 
 * @returns 
 */
export async function WinstonFile(path: string) {
  const date = `-${new Date().getFullYear()}-${new Date().getMonth() + 1}-${new Date().getDate()}`;
  const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
      format.timestamp({
        format: "YYYY-MM-DD HH:mm:ss",
      }),
      format.printf((log): string => `${log.timestamp} ${log.level}: ${log.message}`)
    ),
    defaultMeta: { service: "user-service" },
    transports: [
      new winston.transports.File({
        filename: `${path}/proyect-${date}.log`,
        level: "info",
      }),
    ],
  });

  return logger;
}