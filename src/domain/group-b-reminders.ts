import { SPRING_2027_DEADLINES, SPRING_2027_SOURCES } from '../data/spring-2027.ts';
export type StudentReminder = { id: string; title: string; localDateTime: string; timeZone: string; utcISO: string; done: boolean; sourceId?: string; templateId?: string };
export type DeadlineResult = { ok: true; iso: string } | { ok: false; message: string };

function wallTime(instant: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(instant);
  const part = (type: string) => parts.find(p => p.type === type)!.value;
  return `${part('year')}-${part('month')}-${part('day')}T${part('hour')}:${part('minute')}`;
}

/** Rejects nonexistent and repeated DST wall times rather than silently shifting a deadline. */
export function resolveReminderDeadline(localDateTime: string, timeZone: string): DeadlineResult {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(localDateTime)) return { ok: false, message: 'Enter a valid date and time.' };
  const [year, month, day, hour, minute] = localDateTime.split(/[-T:]/).map(Number);
  if (year < 2000 || year > 2100 || month < 1 || month > 12 || day < 1 || hour > 23 || minute > 59) return { ok: false, message: 'Use a valid date between 2000 and 2100.' };
  const naive = Date.UTC(year, month - 1, day, hour, minute);
  if (new Date(naive).toISOString().slice(0, 16) !== localDateTime) return { ok: false, message: 'This calendar date does not exist.' };
  if (!timeZone || timeZone.length > 80 || !/^[A-Za-z][A-Za-z0-9_+-]*(?:\/[A-Za-z0-9_+-]+)*$/.test(timeZone)) return { ok: false, message: 'Enter an IANA time zone, such as America/Chicago.' };
  const offsets = new Set<number>();
  try {
    for (let h = -48; h <= 48; h += 6) {
      const instant = naive + h * 3_600_000;
      offsets.add(Date.parse(`${wallTime(instant, timeZone)}:00Z`) - instant);
    }
    const matches = [...offsets].map(offset => naive - offset).filter(instant => wallTime(instant, timeZone) === localDateTime);
    if (matches.length === 0) return { ok: false, message: 'This time is skipped by a daylight-saving change. Choose another time.' };
    if (matches.length > 1) return { ok: false, message: 'This time occurs twice during a daylight-saving change. Choose a time outside the repeated hour.' };
    return { ok: true, iso: new Date(matches[0]).toISOString() };
  } catch {
    return { ok: false, message: 'Enter a recognized IANA time zone, such as America/Chicago or Asia/Kolkata.' };
  }
}

export function reminderStatus(reminder: StudentReminder, now = Date.now()) {
  if (reminder.done) return 'Done';
  const remaining = Date.parse(reminder.utcISO) - now;
  if (remaining <= 0) return 'Due';
  return remaining <= 48 * 3_600_000 ? 'Due within 48 hours' : 'Scheduled';
}

export function readStudentReminders(value: unknown): StudentReminder[] | null {
  if (!Array.isArray(value) || value.length > 30) return null;
  const ids = new Set<string>();
  const result: StudentReminder[] = [];
  for (const row of value) {
    if (!row || typeof row !== 'object' || typeof row.id !== 'string' || !/^[a-zA-Z0-9-]{1,80}$/.test(row.id) || ids.has(row.id)
      || typeof row.title !== 'string' || !row.title.trim() || row.title.length > 120 || typeof row.localDateTime !== 'string'
      || typeof row.timeZone !== 'string' || typeof row.done !== 'boolean') return null;
    const deadline = resolveReminderDeadline(row.localDateTime, row.timeZone);
    if (!deadline.ok || row.utcISO !== deadline.iso) return null;
    if (row.sourceId !== undefined && !SPRING_2027_SOURCES.some(source => source.id === row.sourceId)) return null;
    if (row.templateId !== undefined && row.templateId !== 'arrival' && !SPRING_2027_DEADLINES.some(template => template.id === row.templateId)) return null;
    if (row.templateId && row.templateId !== 'arrival' && SPRING_2027_DEADLINES.find(template => template.id === row.templateId)?.sourceId !== row.sourceId) return null;
    ids.add(row.id);
    result.push({ id: row.id, title: row.title.trim(), localDateTime: row.localDateTime, timeZone: row.timeZone, utcISO: deadline.iso, done: row.done, ...(row.sourceId ? {sourceId:row.sourceId}:{}), ...(row.templateId ? {templateId:row.templateId}:{}) });
  }
  return result;
}

export function escapeCalendarText(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
}

/** iCalendar lines are folded by UTF-8 octets, preserving multilingual titles. */
function foldCalendarLine(line: string) {
  const encoder = new TextEncoder();
  let result = '', current = '', bytes = 0;
  for (const character of line) {
    const size = encoder.encode(character).length;
    if (bytes + size > 75) { result += `${current}\r\n`; current = ' '; bytes = 1; }
    current += character; bytes += size;
  }
  return result + current;
}

export function reminderCalendar(reminder: StudentReminder, generatedAt = new Date(), options: { alarmMinutes?: number } = {}) {
  const verified = readStudentReminders([reminder]);
  if (!verified || !Number.isFinite(generatedAt.getTime())) throw new Error('This reminder could not be exported.');
  if (options.alarmMinutes !== undefined && options.alarmMinutes !== 15) throw new Error('Only an optional 15-minute calendar alert is supported.');
  const utcStamp = (iso: string) => iso.replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
  const source = SPRING_2027_SOURCES.find(item => item.id === reminder.sourceId);
  const description = `${source ? `Official reference: ${source.url}. Checked ${source.checkedOn}. ` : ''}Personal CampusBridge reminder. Original deadline: ${reminder.localDateTime.replace('T', ' ')} (${reminder.timeZone}). Check the official requirement yourself. Calendar notifications depend on your calendar settings.`;
  const alarm = options.alarmMinutes === 15 ? ['BEGIN:VALARM', 'TRIGGER:-PT15M', 'ACTION:DISPLAY', `DESCRIPTION:${escapeCalendarText(reminder.title)}`, 'END:VALARM'] : [];
  return ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//CampusBridge//Group B Reminders//EN', 'CALSCALE:GREGORIAN', 'BEGIN:VEVENT',
    `UID:${reminder.id}@reminders.campusbridgeguide.com`, `DTSTAMP:${utcStamp(generatedAt.toISOString())}`, `DTSTART:${utcStamp(reminder.utcISO)}`,
    `SUMMARY:${escapeCalendarText(reminder.title)}`, `DESCRIPTION:${escapeCalendarText(description)}`, 'TRANSP:TRANSPARENT', ...alarm, 'END:VEVENT', 'END:VCALENDAR']
    .map(foldCalendarLine).join('\r\n') + '\r\n';
}

export type GroupBReminderDocument = {schema:2;enabled:boolean;reminders:StudentReminder[]};
export function readGroupBReminderDocument(value:unknown):GroupBReminderDocument|null {
 if(!value||typeof value!=='object'||!('schema'in value)||value.schema!==2||!('enabled'in value)||typeof value.enabled!=='boolean'||!('reminders'in value))return null;
 const reminders=readStudentReminders(value.reminders);return reminders?{schema:2,enabled:value.enabled,reminders}:null;
}
