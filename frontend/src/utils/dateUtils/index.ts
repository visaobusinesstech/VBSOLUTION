// Utilitários de data para substituir date-fns temporariamente
// Esta é uma solução temporária para resolver problemas de build

export const format = (date: Date, formatStr: string): string => {
  // Implementação básica de formatação de data
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');

  return formatStr
    .replace('yyyy', String(year))
    .replace('MM', month)
    .replace('dd', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
    .replace('dd/MM/yyyy', `${day}/${month}/${year}`)
    .replace('dd/MM', `${day}/${month}`)
    .replace('HH:mm', `${hours}:${minutes}`);
};

export const isAfter = (date: Date, dateToCompare: Date): boolean => {
  return date.getTime() > dateToCompare.getTime();
};

export const isBefore = (date: Date, dateToCompare: Date): boolean => {
  return date.getTime() < dateToCompare.getTime();
};

export const startOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const endOfDay = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

export const addDays = (date: Date, amount: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + amount);
  return newDate;
};

export const subDays = (date: Date, amount: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() - amount);
  return newDate;
};

export const parse = (dateString: string, formatStr: string, referenceDate?: Date): Date => {
  // Implementação básica de parsing de data
  if (formatStr === 'dd/MM/yyyy') {
    const [day, month, year] = dateString.split('/');
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  return new Date(dateString);
};

// Funções adicionais que podem ser necessárias para react-day-picker
export const startOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setDate(1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const endOfMonth = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + 1, 0);
  newDate.setHours(23, 59, 59, 999);
  return newDate;
};

export const addMonths = (date: Date, amount: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + amount);
  return newDate;
};

export const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

export const isSameMonth = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth();
};

export const isValid = (date: Date): boolean => {
  return date instanceof Date && !isNaN(date.getTime());
};

export const isSameYear = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear();
};

export const setMonth = (date: Date, month: number): Date => {
  const newDate = new Date(date);
  newDate.setMonth(month);
  return newDate;
};

export const setYear = (date: Date, year: number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(year);
  return newDate;
};

export const startOfYear = (date: Date): Date => {
  const newDate = new Date(date);
  newDate.setMonth(0, 1);
  newDate.setHours(0, 0, 0, 0);
  return newDate;
};

export const differenceInCalendarDays = (dateLeft: Date, dateRight: Date): number => {
  const utcLeft = Date.UTC(dateLeft.getFullYear(), dateLeft.getMonth(), dateLeft.getDate());
  const utcRight = Date.UTC(dateRight.getFullYear(), dateRight.getMonth(), dateRight.getDate());
  return Math.floor((utcLeft - utcRight) / (1000 * 60 * 60 * 24));
};

export const differenceInCalendarMonths = (dateLeft: Date, dateRight: Date): number => {
  return (dateLeft.getFullYear() - dateRight.getFullYear()) * 12 + dateLeft.getMonth() - dateRight.getMonth();
};

export const getDaysInMonth = (date: Date): number => {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
};

export const getWeek = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 1);
  const diff = date.getTime() - start.getTime();
  const oneWeek = 1000 * 60 * 60 * 24 * 7;
  return Math.floor(diff / oneWeek) + 1;
};

export const startOfISOWeek = (date: Date): Date => {
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  const result = new Date(date);
  result.setDate(diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfISOWeek = (date: Date): Date => {
  const start = startOfISOWeek(date);
  const result = new Date(start);
  result.setDate(start.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const getDay = (date: Date): number => {
  return date.getDay();
};

export const getDate = (date: Date): number => {
  return date.getDate();
};

export const getMonth = (date: Date): number => {
  return date.getMonth();
};

export const getYear = (date: Date): number => {
  return date.getFullYear();
};

export const addWeeks = (date: Date, amount: number): Date => {
  return addDays(date, amount * 7);
};

export const addYears = (date: Date, amount: number): Date => {
  const newDate = new Date(date);
  newDate.setFullYear(newDate.getFullYear() + amount);
  return newDate;
};

export const subMonths = (date: Date, amount: number): Date => {
  return addMonths(date, -amount);
};

export const subYears = (date: Date, amount: number): Date => {
  return addYears(date, -amount);
};

export const isEqual = (date1: Date, date2: Date): boolean => {
  return date1.getTime() === date2.getTime();
};

export const max = (...dates: Date[]): Date => {
  return new Date(Math.max(...dates.map(d => d.getTime())));
};

export const min = (...dates: Date[]): Date => {
  return new Date(Math.min(...dates.map(d => d.getTime())));
};

export const startOfWeek = (date: Date, options?: { weekStartsOn?: number }): Date => {
  const weekStartsOn = options?.weekStartsOn ?? 0; // Sunday = 0
  const day = date.getDay();
  const diff = day - weekStartsOn;
  const result = new Date(date);
  result.setDate(date.getDate() - diff);
  result.setHours(0, 0, 0, 0);
  return result;
};

export const endOfWeek = (date: Date, options?: { weekStartsOn?: number }): Date => {
  const start = startOfWeek(date, options);
  const result = new Date(start);
  result.setDate(start.getDate() + 6);
  result.setHours(23, 59, 59, 999);
  return result;
};

export const getISOWeek = (date: Date): number => {
  const target = new Date(date.valueOf());
  const dayNr = (date.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7);
  }
  return 1 + Math.ceil((firstThursday - target.valueOf()) / 604800000);
};

export const lastDayOfMonth = (date: Date): Date => {
  return endOfMonth(date);
};

export const eachDayOfInterval = (interval: { start: Date; end: Date }): Date[] => {
  const { start, end } = interval;
  const days: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

export const eachWeekOfInterval = (interval: { start: Date; end: Date }): Date[] => {
  const { start, end } = interval;
  const weeks: Date[] = [];
  const current = startOfWeek(start);
  
  while (current <= end) {
    weeks.push(new Date(current));
    current.setDate(current.getDate() + 7);
  }
  
  return weeks;
};

export const eachMonthOfInterval = (interval: { start: Date; end: Date }): Date[] => {
  const { start, end } = interval;
  const months: Date[] = [];
  const current = new Date(start);
  
  while (current <= end) {
    months.push(new Date(current));
    current.setMonth(current.getMonth() + 1);
  }
  
  return months;
};

export const isDate = (value: any): value is Date => {
  return value instanceof Date && !isNaN(value.getTime());
};

export const parseISO = (dateString: string): Date => {
  return new Date(dateString);
};

export const formatISO = (date: Date): string => {
  return date.toISOString();
};

export const toDate = (value: any): Date => {
  if (value instanceof Date) return value;
  if (typeof value === 'string' || typeof value === 'number') return new Date(value);
  throw new Error('Cannot convert to date');
};

export const compareAsc = (dateLeft: Date, dateRight: Date): number => {
  const diff = dateLeft.getTime() - dateRight.getTime();
  if (diff < 0) return -1;
  if (diff > 0) return 1;
  return 0;
};

export const compareDesc = (dateLeft: Date, dateRight: Date): number => {
  return -compareAsc(dateLeft, dateRight);
};

export const closestTo = (dateToCompare: Date, datesArray: Date[]): Date => {
  if (datesArray.length === 0) throw new Error('Array is empty');
  
  let closest = datesArray[0];
  let closestDistance = Math.abs(dateToCompare.getTime() - closest.getTime());
  
  for (const date of datesArray) {
    const distance = Math.abs(dateToCompare.getTime() - date.getTime());
    if (distance < closestDistance) {
      closest = date;
      closestDistance = distance;
    }
  }
  
  return closest;
};

export const getUnixTime = (date: Date): number => {
  return Math.floor(date.getTime() / 1000);
};

export const fromUnixTime = (unixTime: number): Date => {
  return new Date(unixTime * 1000);
};

export const getTime = (date: Date): number => {
  return date.getTime();
};

export const differenceInDays = (dateLeft: Date, dateRight: Date): number => {
  const diffTime = Math.abs(dateLeft.getTime() - dateRight.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

export const differenceInWeeks = (dateLeft: Date, dateRight: Date): number => {
  return Math.floor(differenceInDays(dateLeft, dateRight) / 7);
};

export const differenceInMonths = (dateLeft: Date, dateRight: Date): number => {
  return (dateLeft.getFullYear() - dateRight.getFullYear()) * 12 + dateLeft.getMonth() - dateRight.getMonth();
};

export const differenceInYears = (dateLeft: Date, dateRight: Date): number => {
  return dateLeft.getFullYear() - dateRight.getFullYear();
};

export const isToday = (date: Date): boolean => {
  return isSameDay(date, new Date());
};

export const isTomorrow = (date: Date): boolean => {
  const tomorrow = addDays(new Date(), 1);
  return isSameDay(date, tomorrow);
};

export const isYesterday = (date: Date): boolean => {
  const yesterday = subDays(new Date(), 1);
  return isSameDay(date, yesterday);
};

export const isThisWeek = (date: Date): boolean => {
  const now = new Date();
  const startWeek = startOfWeek(now);
  const endWeek = endOfWeek(now);
  return date >= startWeek && date <= endWeek;
};

export const isThisMonth = (date: Date): boolean => {
  return isSameMonth(date, new Date());
};

export const isThisYear = (date: Date): boolean => {
  return isSameYear(date, new Date());
};

export const getWeeksInMonth = (date: Date): number => {
  const start = startOfMonth(date);
  const end = endOfMonth(date);
  const startWeek = startOfWeek(start);
  const endWeek = endOfWeek(end);
  
  return Math.ceil(differenceInDays(endWeek, startWeek) / 7);
};

export const setDate = (date: Date, dayOfMonth: number): Date => {
  const newDate = new Date(date);
  newDate.setDate(dayOfMonth);
  return newDate;
};

export const setDay = (date: Date, day: number): Date => {
  const newDate = new Date(date);
  const currentDay = newDate.getDay();
  const diff = day - currentDay;
  newDate.setDate(newDate.getDate() + diff);
  return newDate;
};

export const setHours = (date: Date, hours: number): Date => {
  const newDate = new Date(date);
  newDate.setHours(hours);
  return newDate;
};

export const setMinutes = (date: Date, minutes: number): Date => {
  const newDate = new Date(date);
  newDate.setMinutes(minutes);
  return newDate;
};

export const setSeconds = (date: Date, seconds: number): Date => {
  const newDate = new Date(date);
  newDate.setSeconds(seconds);
  return newDate;
};

export const setMilliseconds = (date: Date, milliseconds: number): Date => {
  const newDate = new Date(date);
  newDate.setMilliseconds(milliseconds);
  return newDate;
};

export const getHours = (date: Date): number => {
  return date.getHours();
};

export const getMinutes = (date: Date): number => {
  return date.getMinutes();
};

export const getSeconds = (date: Date): number => {
  return date.getSeconds();
};

export const getMilliseconds = (date: Date): number => {
  return date.getMilliseconds();
};

// Função formatDistanceToNow para compatibilidade
export const formatDistanceToNow = (date: Date, options?: { addSuffix?: boolean; locale?: any }): string => {
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);
  const diffInYears = Math.floor(diffInDays / 365);

  const addSuffix = options?.addSuffix || false;
  const suffix = addSuffix ? ' atrás' : '';

  if (diffInYears > 0) {
    return `${diffInYears} ${diffInYears === 1 ? 'ano' : 'anos'}${suffix}`;
  } else if (diffInMonths > 0) {
    return `${diffInMonths} ${diffInMonths === 1 ? 'mês' : 'meses'}${suffix}`;
  } else if (diffInDays > 0) {
    return `${diffInDays} ${diffInDays === 1 ? 'dia' : 'dias'}${suffix}`;
  } else if (diffInHours > 0) {
    return `${diffInHours} ${diffInHours === 1 ? 'hora' : 'horas'}${suffix}`;
  } else if (diffInMinutes > 0) {
    return `${diffInMinutes} ${diffInMinutes === 1 ? 'minuto' : 'minutos'}${suffix}`;
  } else {
    return `agora${suffix}`;
  }
};

// Locale em português brasileiro
export const ptBR = {
  code: 'pt-BR',
  formatLong: {
    date: 'dd/MM/yyyy',
    time: 'HH:mm',
    dateTime: 'dd/MM/yyyy HH:mm'
  }
};

// Export default para compatibilidade
export default {
  format,
  formatDistanceToNow,
  isAfter,
  isBefore,
  startOfDay,
  endOfDay,
  addDays,
  subDays,
  parse,
  startOfMonth,
  endOfMonth,
  addMonths,
  isSameDay,
  isSameMonth,
  isValid,
  isSameYear,
  setMonth,
  setYear,
  startOfYear,
  differenceInCalendarDays,
  differenceInCalendarMonths,
  getDaysInMonth,
  getWeek,
  startOfISOWeek,
  endOfISOWeek,
  getDay,
  getDate,
  getMonth,
  getYear,
  addWeeks,
  addYears,
  subMonths,
  subYears,
  isEqual,
  max,
  min,
  startOfWeek,
  endOfWeek,
  getISOWeek,
  lastDayOfMonth,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  isDate,
  parseISO,
  formatISO,
  toDate,
  compareAsc,
  compareDesc,
  closestTo,
  getUnixTime,
  fromUnixTime,
  getTime,
  differenceInDays,
  differenceInWeeks,
  differenceInMonths,
  differenceInYears,
  isToday,
  isTomorrow,
  isYesterday,
  isThisWeek,
  isThisMonth,
  isThisYear,
  getWeeksInMonth,
  setDate,
  setDay,
  setHours,
  setMinutes,
  setSeconds,
  setMilliseconds,
  getHours,
  getMinutes,
  getSeconds,
  getMilliseconds,
  ptBR
};
