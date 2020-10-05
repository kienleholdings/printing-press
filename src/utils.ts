export const logError = (message: string): void => {
  // eslint-disable-next-line no-console
  console.error('\x1b[31m%s\x1b[0m', message);
};

export const logFatalError = (message: string, code = 1): void => {
  logError(message);
  process.exit(code);
};
