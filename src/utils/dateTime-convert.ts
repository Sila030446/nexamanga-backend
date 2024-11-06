import { format } from 'date-fns';
import { toZonedTime } from 'date-fns-tz';

export function formatDateToThaiTime(date: Date): string {
  const timeZone = 'Asia/Bangkok'; // Thai timezone
  const thaiTime = toZonedTime(date, timeZone); // Convert to Thai time
  return format(thaiTime, 'dd-MM-yyyy HH:mm:ss');
}
