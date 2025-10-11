const DEV = import.meta.env?.DEV ?? false;

export const log = {
  debug: (...a: any[]) => { if (DEV) console.log(...a); },
  info:  (...a: any[]) => { if (DEV) console.info(...a); },
  warn:  (...a: any[]) => { if (DEV) console.warn(...a); },
  error: (...a: any[]) => console.error(...a), // keep errors always
};