/*Dojot Logger Library*/

import winston = require("winston");
const { combine, timestamp, colorize} = winston.format;

/* Levels of debug */
const debugLevels = ["debug", "info", "warn", "error"];

function formatParams(info: any) {
    const { tstamp, level, message, ...args } = info;
    const ts = tstamp.slice(0, 19).replace("T", " ");

    const filename = Object.keys(args).length ? args.filename : "";

    return `<${ts}> -- |${filename}| -- ${level}: ${message}`;
}

const logger = winston.createLogger({
    exitOnError: false,
    format: combine(
        winston.format((info: any) => {
            info.level = info.level.toUpperCase();
            return info;
        })(),
        timestamp({format: "HH:mm:ss DD/MM/YYYY"}),
        colorize({all: true}),
        winston.format.printf(formatParams),
    ),
    transports: [
        new winston.transports.Console({
            handleExceptions: true,
            level: "debug",
        }),
    ],
});

export { logger, debugLevels };
