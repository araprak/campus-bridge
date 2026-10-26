import test from 'node:test';
import assert from 'node:assert/strict';
import { escapeCalendarText, readStudentReminders, reminderCalendar, reminderStatus, resolveReminderDeadline, type StudentReminder } from '../src/domain/group-b-reminders.ts';

test('deadline conversion honors Dallas winter/summer and fractional time-zone offsets', () => {
  assert.deepEqual(resolveReminderDeadline('2026-01-20T09:00', 'America/Chicago'), { ok: true, iso: '2026-01-20T15:00:00.000Z' });
  assert.deepEqual(resolveReminderDeadline('2026-07-20T09:00', 'America/Chicago'), { ok: true, iso: '2026-07-20T14:00:00.000Z' });
  assert.deepEqual(resolveReminderDeadline('2026-10-25T09:00', 'Asia/Kolkata'), { ok: true, iso: '2026-10-25T03:30:00.000Z' });
  assert.deepEqual(resolveReminderDeadline('2026-10-25T00:00', 'Asia/Seoul'), { ok: true, iso: '2026-10-24T15:00:00.000Z' });
});

test('DST skipped and repeated times are rejected instead of silently changed', () => {
  const skipped = resolveReminderDeadline('2026-03-08T02:30', 'America/Chicago');
  const repeated = resolveReminderDeadline('2026-11-01T01:30', 'America/Chicago');
  assert.equal(skipped.ok, false);
  assert.equal(repeated.ok, false);
  if (!skipped.ok) assert.match(skipped.message, /skipped/);
  if (!repeated.ok) assert.match(repeated.message, /twice/);
  assert.deepEqual(resolveReminderDeadline('2026-11-01T02:30', 'America/Chicago'), { ok: true, iso: '2026-11-01T08:30:00.000Z' });
});

test('invalid dates, malformed times, unsupported ranges and unknown zones are rejected', () => {
  for (const local of ['2026-02-29T12:00', '2026-04-31T12:00', '2026-13-01T12:00', '2026-10-25T24:00', '2026-10-25T12:60', '12/10/2026 10:00', '1999-12-31T12:00', '2101-01-01T12:00']) assert.equal(resolveReminderDeadline(local, 'America/Chicago').ok, false, local);
  assert.equal(resolveReminderDeadline('2026-10-25T12:00', 'Wrong/Zone').ok, false);
  assert.equal(resolveReminderDeadline('2026-10-25T12:00', '').ok, false);
  assert.equal(resolveReminderDeadline('2026-10-25T12:00', '+05:30').ok, false);
  assert.equal(resolveReminderDeadline('2028-02-29T12:00', 'UTC').ok, true);
});

const reminder: StudentReminder = { id: 'reminder-1', title: 'Check lease', localDateTime: '2026-10-25T09:00', timeZone: 'America/Chicago', utcISO: '2026-10-25T14:00:00.000Z', done: false };

test('reminder statuses distinguish due, the 48-hour window, later and done', () => {
  const deadline = Date.parse(reminder.utcISO);
  assert.equal(reminderStatus(reminder, deadline), 'Due');
  assert.equal(reminderStatus(reminder, deadline - 48 * 3_600_000), 'Due within 48 hours');
  assert.equal(reminderStatus(reminder, deadline - 48 * 3_600_000 - 1), 'Scheduled');
  assert.equal(reminderStatus({ ...reminder, done: true }, deadline + 1), 'Done');
});

test('calendar export escapes text, uses the resolved UTC instant, and does not claim a scheduled alert', () => {
  const output = reminderCalendar({ ...reminder, title: 'Rent, lease; check\\note\nNext line' }, new Date('2026-10-24T12:34:56Z'));
  assert.match(output, /DTSTART:20261025T140000Z\r\n/);
  assert.match(output, /DTSTAMP:20261024T123456Z\r\n/);
  assert.match(output, /SUMMARY:Rent\\, lease\\; check\\\\note\\nNext line\r\n/);
  assert.match(output.replace(/\r\n /g, ''), /America\/Chicago/);
  assert.doesNotMatch(output, /BEGIN:VALARM|ATTENDEE|ORGANIZER/);
  assert.equal(escapeCalendarText('a\r\nb\rc'), 'a\\nb\\nc');
  assert.ok(output.endsWith('END:VCALENDAR\r\n'));
});

test('calendar folding uses at most 75 UTF-8 bytes per line without splitting Unicode characters', () => {
  const title = '준비 موعد याद दिलाना '.repeat(5);
  const output = reminderCalendar({ ...reminder, title }, new Date('2026-10-24T12:00:00Z'));
  for (const line of output.split('\r\n')) assert.ok(Buffer.byteLength(line, 'utf8') <= 75, line);
  const unfolded = output.replace(/\r\n /g, '');
  assert.ok(unfolded.includes(`SUMMARY:${title}`));
});

test('calendar alert is explicit, limited to 15 minutes and escapes its display text', () => {
  const generatedAt = new Date('2026-10-24T12:00:00Z');
  const output = reminderCalendar({ ...reminder, title: 'Lease, deposit; check\nBefore signing' }, generatedAt, { alarmMinutes: 15 });
  assert.match(output, /BEGIN:VALARM\r\nTRIGGER:-PT15M\r\nACTION:DISPLAY\r\n/);
  assert.match(output, /DESCRIPTION:Lease\\, deposit\\; check\\nBefore signing\r\nEND:VALARM/);
  assert.equal((output.match(/BEGIN:VALARM/g) ?? []).length, 1);
  assert.doesNotMatch(reminderCalendar(reminder, generatedAt), /VALARM/);
  for (const alarmMinutes of [0, -15, 5, 60, NaN, Infinity]) assert.throws(() => reminderCalendar(reminder, generatedAt, { alarmMinutes }), /15-minute/);
});

test('saved reminders validate IDs, titles, actual timezone conversion and count', () => {
  assert.deepEqual(readStudentReminders([reminder]), [reminder]);
  assert.equal(readStudentReminders([{ ...reminder, utcISO: '2026-10-25T15:00:00.000Z' }]), null);
  assert.equal(readStudentReminders([{ ...reminder, id: 'a\r\nATTENDEE:someone' }]), null);
  assert.equal(readStudentReminders([{ ...reminder, title: ' ' }]), null);
  assert.equal(readStudentReminders([reminder, reminder]), null);
  assert.equal(readStudentReminders(Array.from({ length: 31 }, (_, index) => ({ ...reminder, id: `reminder-${index}` }))), null);
  assert.throws(() => reminderCalendar({ ...reminder, utcISO: 'invalid' }), /could not be exported/);
});
