export const envToLogger = {
    development: {
      transport: {
        target: 'pino-pretty',
        options: {
          colorize: true,
          ignore: 'pid,hostname',
        },
      },
    },
    production: {
        transport: {
            target: "pino/file",
            options: {
                destination: "logs/production.log",
            },
        },
    },
    test: false,
  }