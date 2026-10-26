'use client';

import { useEffect, useId, useState } from 'react';
import { tasks, type StudentState } from '@/lib/model';
import { MONTHLY_BUDGET_FIELDS, compareBudgetScenario, groupBStorageKey, newBudgetScenario, readBudgetScenarios, type BudgetScenario, type ScenarioField } from '@/domain/group-b-budget';
import { readStudentReminders, reminderCalendar, reminderStatus, resolveReminderDeadline, type StudentReminder } from '@/domain/group-b-reminders';
import { GROUP_B_GLOSSARY, GROUP_B_SOURCES } from '@/data/group-b-content';
import styles from './group-b-tools.module.css';

const money = (cents: number | null) => cents === null ? 'Unknown' : (cents / 100).toLocaleString('en-US', { style: 'currency', currency: 'USD' });
const initialScenarios = () => [newBudgetScenario('scenario-1', 'Scenario 1'), newBudgetScenario('scenario-2', 'Scenario 2')];
const emptyReminders = (): StudentReminder[] => [];

function downloadText(name: string, content: string, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = name;
  document.body.appendChild(link); link.click(); link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function useOptInStorage<T>(accountId: string, feature: 'budget' | 'reminders', initialValue: () => T, read: (input: unknown) => T | null) {
  const [data, setData] = useState<T>(initialValue);
  const [enabled, setEnabled] = useState(false);
  const [ready, setReady] = useState(false);
  const [notice, setNotice] = useState('');
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(groupBStorageKey(accountId, window.location.hostname, feature));
      if (raw) {
        const stored = JSON.parse(raw);
        const parsed = stored?.schema === 1 && stored.optedIn === true ? read(stored.data) : null;
        if (parsed !== null) { setData(parsed); setEnabled(true); }
        else setNotice('The saved copy could not be read. You can replace or delete it below.');
      }
    } catch { setNotice('Browser storage is unavailable or the saved copy could not be read. You can still use these tools for this visit.'); }
    setReady(true);
  }, [accountId, feature, read]);
  useEffect(() => {
    if (!ready || !enabled) return;
    try {
      window.localStorage.setItem(groupBStorageKey(accountId, window.location.hostname, feature), JSON.stringify({ schema: 1, optedIn: true, data }));
      setNotice('Saved only in this browser for this account on this Group B site.');
    } catch { setNotice('Your changes could not be saved in this browser. Keep this page open or export what you need.'); }
  }, [data, enabled, ready, accountId, feature]);
  function disable(reset: boolean) {
    setEnabled(false);
    if (reset) setData(initialValue());
    try {
      window.localStorage.removeItem(groupBStorageKey(accountId, window.location.hostname, feature));
      setNotice(reset ? 'Saved copy deleted and entries cleared.' : 'Saved copy deleted. Current entries last only for this visit.');
    } catch { setNotice('Browser storage could not be cleared. Use your browser’s site-data controls to remove the saved copy.'); }
  }
  return { data, setData, enabled, setEnabled, ready, notice, disable };
}

function BudgetScenarios({ accountId }: { accountId: string }) {
  const id = useId();
  const saved = useOptInStorage(accountId, 'budget', initialScenarios, readBudgetScenarios);
  function change(scenarioId: string, key: ScenarioField, value: string) {
    saved.setData(current => current.map(scenario => scenario.id === scenarioId ? { ...scenario, amounts: { ...scenario.amounts, [key]: value } } : scenario));
  }
  function addScenario() {
    saved.setData(current => current.length >= 3 ? current : [...current, newBudgetScenario(crypto.randomUUID(), `Scenario ${current.length + 1}`)]);
  }
  return <section className={styles.section} aria-labelledby={`${id}-title`}>
    <p className={styles.kicker}>Feature 6 · Expenses and budgeting</p>
    <h2 id={`${id}-title`}>Compare your move-in budgets</h2>
    <p>Compare up to three situations using your own amounts in US dollars. Enter only your share of each cost. Leave an unconfirmed amount blank; enter 0 only when you know there is no extra charge.</p>
    <div className={styles.controls}>
      <label className={styles.check}><input type="checkbox" checked={saved.enabled} disabled={!saved.ready} onChange={event => event.target.checked ? saved.setEnabled(true) : saved.disable(false)}/>Save my scenarios on this browser</label>
      <button type="button" onClick={() => saved.disable(true)}>Delete saved scenarios and clear entries</button>
    </div>
    <p className={styles.note}>Saving is optional. These amounts are kept on this device and this subdomain for your account; they do not sync to other devices. Anyone using this browser profile may be able to read its stored data.</p>
    {saved.notice && <p className={styles.notice} role="status">{saved.notice}</p>}
    <div className={styles.scenarios}>
      {saved.data.map((scenario, index) => {
        const estimate = compareBudgetScenario(scenario);
        return <article className={styles.scenario} key={scenario.id} aria-label={`Budget scenario ${index + 1}`}>
          <label className={styles.field} htmlFor={`${id}-${scenario.id}-name`}>Scenario name<input id={`${id}-${scenario.id}-name`} value={scenario.name} maxLength={60} onChange={event => saved.setData(current => current.map(row => row.id === scenario.id ? { ...row, name: event.target.value } : row))}/></label>
          <fieldset><legend>Recurring monthly costs · USD</legend>
            {MONTHLY_BUDGET_FIELDS.map(field => <label className={styles.field} key={field.id} htmlFor={`${id}-${scenario.id}-${field.id}`}>{field.label}<input id={`${id}-${scenario.id}-${field.id}`} inputMode="decimal" placeholder="Unknown" maxLength={32} value={scenario.amounts[field.id] ?? ''} aria-invalid={estimate.invalid.includes(field.id)} onChange={event => change(scenario.id, field.id, event.target.value)}/></label>)}
          </fieldset>
          <fieldset><legend>Separate move-in costs · USD</legend>
            <label className={styles.field} htmlFor={`${id}-${scenario.id}-oneTime`}>Nonrefundable one-time costs<input id={`${id}-${scenario.id}-oneTime`} inputMode="decimal" placeholder="Unknown" maxLength={32} value={scenario.amounts.oneTime ?? ''} aria-invalid={estimate.invalid.includes('oneTime')} onChange={event => change(scenario.id, 'oneTime', event.target.value)}/></label>
            <label className={styles.field} htmlFor={`${id}-${scenario.id}-refundable`}>Refundable deposits<input id={`${id}-${scenario.id}-refundable`} inputMode="decimal" placeholder="Unknown" maxLength={32} value={scenario.amounts.refundable ?? ''} aria-invalid={estimate.invalid.includes('refundable')} onChange={event => change(scenario.id, 'refundable', event.target.value)}/></label>
          </fieldset>
          {estimate.invalid.length > 0 && <p className={styles.error} role="alert">Use a number from 0 to 1,000,000 with at most two decimal places, without $ signs or commas. Invalid entries stay unknown.</p>}
          <dl className={styles.totals} aria-live="polite" aria-atomic="true">
            <div><dt>{estimate.monthlyComplete ? 'Entered monthly total' : 'Known monthly subtotal'}</dt><dd>{money(estimate.monthlySubtotalCents)}</dd></div>
            <div><dt>One-time nonrefundable costs</dt><dd>{money(estimate.oneTimeCents)}</dd></div>
            <div><dt>Refundable cash needed upfront</dt><dd>{money(estimate.refundableCents)}</dd></div>
            <div><dt>{estimate.complete ? 'Entered move-in cash total' : 'Known move-in cash subtotal'}</dt><dd>{money(estimate.moveInSubtotalCents)}</dd></div>
          </dl>
          <p className={styles.note}>{estimate.unknownMonthlyCount} monthly {estimate.unknownMonthlyCount === 1 ? 'line is' : 'lines are'} unknown. Move-in cash adds one month of entered costs, one-time charges and deposits. {estimate.complete ? 'All listed lines have amounts; other costs may apply.' : 'This is incomplete until every listed cost is confirmed.'}</p>
          <button type="button" disabled={saved.data.length === 1} aria-label={`Remove ${scenario.name || `scenario ${index + 1}`}`} onClick={() => saved.setData(current => current.filter(row => row.id !== scenario.id))}>Remove scenario</button>
        </article>;
      })}
    </div>
    <button type="button" disabled={saved.data.length >= 3} onClick={addScenario}>Add another scenario</button>
    <p className={styles.note}>These are planning calculations from your entries, not provider quotes. Confirm fees and deposit-return conditions in the actual agreement. A refundable deposit still needs upfront cash and is not counted as a recurring charge.</p>
  </section>;
}

function StudentReminders({ accountId, state }: { accountId: string; state: StudentState }) {
  const id = useId();
  const saved = useOptInStorage(accountId, 'reminders', emptyReminders, readStudentReminders);
  const [title, setTitle] = useState('');
  const [localDateTime, setLocalDateTime] = useState('');
  const [timeZone, setTimeZone] = useState('America/Chicago');
  const [error, setError] = useState('');
  const [now, setNow] = useState<number | null>(null);
  const [exportNotice, setExportNotice] = useState('');
  const [requestAlerts, setRequestAlerts] = useState<Record<string, boolean>>({});
  useEffect(() => { setNow(Date.now()); const timer = window.setInterval(() => setNow(Date.now()), 60_000); return () => window.clearInterval(timer); }, []);
  function addReminder(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!saved.enabled) { setError('Enable browser reminders first.'); return; }
    if (!title.trim() || title.trim().length > 120) { setError('Enter a reminder title of up to 120 characters.'); return; }
    if (saved.data.length >= 30) { setError('Remove an existing reminder before adding more than 30.'); return; }
    const deadline = resolveReminderDeadline(localDateTime, timeZone.trim());
    if (!deadline.ok) { setError(deadline.message); return; }
    saved.setData(current => [...current, { id: crypto.randomUUID(), title: title.trim(), localDateTime, timeZone: timeZone.trim(), utcISO: deadline.iso, done: false }]);
    setTitle(''); setLocalDateTime(''); setError(''); setNow(Date.now());
  }
  function exportReminder(reminder: StudentReminder) {
    try { downloadText('campusbridge-reminder.ics', reminderCalendar(reminder, new Date(), requestAlerts[reminder.id] ? { alarmMinutes: 15 } : {}), 'text/calendar;charset=utf-8'); setExportNotice(requestAlerts[reminder.id] ? 'Calendar file prepared with a requested 15-minute alert. Import it and check your calendar’s alert settings; delivery depends on your calendar app.' : 'Calendar file prepared without an alert request. Import it in your calendar and check its notification settings.'); }
    catch { setExportNotice('The calendar file could not be prepared. Check the reminder date and time.'); }
  }
  return <section className={styles.section} aria-labelledby={`${id}-title`}>
    <p className={styles.kicker}>Feature 8 · Reminders and nudges</p>
    <h2 id={`${id}-title`}>Set your own next-step reminders</h2>
    <p>Choose the deadline and time zone yourself after checking the official requirement. Due and upcoming labels update while this page is open. CampusBridge does not send email, text messages or background notifications.</p>
    <label className={styles.check}><input type="checkbox" checked={saved.enabled} disabled={!saved.ready} onChange={event => { if (event.target.checked) saved.setEnabled(true); else { saved.disable(true); setRequestAlerts({}); setError(''); } }}/>Enable reminders and save them on this browser</label>
    <p className={styles.note}>Off by default. Enabling stores your reminder titles and deadlines for this account on this device and this subdomain. Turning it off deletes that saved copy and clears these reminders. Calendar files you already imported must be removed from your calendar separately.</p>
    {saved.notice && <p className={styles.notice} role="status">{saved.notice}</p>}
    <form onSubmit={addReminder} className={styles.reminderForm}>
      <fieldset disabled={!saved.enabled}><legend>Add a personal reminder</legend>
        <label className={styles.field} htmlFor={`${id}-name`}>Task or deadline<input id={`${id}-name`} required maxLength={120} list={`${id}-tasks`} value={title} onChange={event => setTitle(event.target.value)} placeholder="Choose a task or write your own"/></label>
        <datalist id={`${id}-tasks`}>{tasks.filter(task => !state.progress[task.id]?.completedAt && !state.progress[task.id]?.notApplicableAt).map(task => <option value={task.title} key={task.id}/>)}</datalist>
        <div className={styles.formRow}>
          <label className={styles.field} htmlFor={`${id}-date`}>Date and time<input id={`${id}-date`} type="datetime-local" required min="2000-01-01T00:00" max="2100-12-31T23:59" value={localDateTime} onChange={event => setLocalDateTime(event.target.value)}/></label>
          <label className={styles.field} htmlFor={`${id}-zone`}>Time zone<input id={`${id}-zone`} list={`${id}-zones`} required maxLength={80} value={timeZone} onChange={event => setTimeZone(event.target.value)}/></label>
        </div>
        <datalist id={`${id}-zones`}>{['America/Chicago', 'America/New_York', 'America/Los_Angeles', 'Asia/Kolkata', 'Asia/Seoul', 'UTC'].map(zone => <option value={zone} key={zone}/>)}</datalist>
        <p className={styles.note}>Dallas uses America/Chicago. Repeated or skipped daylight-saving times must be changed before saving.</p>
        <button type="submit">Add reminder</button>
      </fieldset>
    </form>
    {error && <p className={styles.error} role="alert">{error}</p>}
    {saved.enabled && saved.data.length === 0 && <p>No reminders yet. Add only the deadlines you want to keep here.</p>}
    {saved.data.length > 0 && <ul className={styles.reminders}>{[...saved.data].sort((a, b) => a.utcISO.localeCompare(b.utcISO)).map(reminder => <li key={reminder.id}>
      <div><strong>{reminder.title}</strong><span className={styles.badge}>{now === null ? 'Checking time' : reminderStatus(reminder, now)}</span></div>
      <p><time dateTime={reminder.utcISO}>{reminder.localDateTime.replace('T', ' ')}</time> · {reminder.timeZone}</p>
      <label className={styles.check}><input type="checkbox" checked={requestAlerts[reminder.id] ?? false} onChange={event => setRequestAlerts(current => ({ ...current, [reminder.id]: event.target.checked }))}/>Request a calendar alert 15 minutes before</label>
      <div className={styles.actions}><button type="button" onClick={() => saved.setData(current => current.map(row => row.id === reminder.id ? { ...row, done: !row.done } : row))}>{reminder.done ? 'Mark pending' : 'Mark done'}</button><button type="button" onClick={() => exportReminder(reminder)}>Download calendar file (.ics)</button><button type="button" aria-label={`Delete reminder ${reminder.title}`} onClick={() => saved.setData(current => current.filter(row => row.id !== reminder.id))}>Delete</button></div>
    </li>)}</ul>}
    {exportNotice && <p className={styles.notice} role="status">{exportNotice}</p>}
    <p className={styles.note}>Calendar export preserves the chosen time-zone deadline as a fixed instant. The alert request is optional and off by default for each reminder. Importing, permissions and actual alert delivery are handled by your calendar app; downloading a file alone does not schedule a notification.</p>
  </section>;
}

function TrustAndLanguage({ supportEmail }: { supportEmail?: string }) {
  const id = useId();
  const [query, setQuery] = useState('');
  const [language, setLanguage] = useState<'en' | 'hi' | 'ko'>('en');
  const [reportPage, setReportPage] = useState('');
  const [reportDetail, setReportDetail] = useState('');
  const [reportNotice, setReportNotice] = useState('');
  const glossary = GROUP_B_GLOSSARY.filter(item => `${item.term} ${item.meaning} ${'hi' in item ? item.hi : ''} ${'ko' in item ? item.ko : ''}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const safeSupport = supportEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supportEmail) ? supportEmail : null;
  function reportText() { return `CampusBridge outdated-information report draft\nPage or resource: ${reportPage.trim() || 'Not specified'}\n\nWhat may need updating:\n${reportDetail.trim()}\n\nPrepared locally. This report has not been submitted.\n`; }
  const canReport = reportDetail.trim().length > 0;
  const mailto = safeSupport ? `mailto:${safeSupport}?subject=${encodeURIComponent('CampusBridge information update report')}&body=${encodeURIComponent(reportText())}` : null;
  return <section className={styles.section} aria-labelledby={`${id}-title`}>
    <p className={styles.kicker}>Feature 9 · Accessibility and trust</p>
    <h2 id={`${id}-title`}>Understand the terms and check the source</h2>
    <div className={styles.formRow}>
      <label className={styles.field} htmlFor={`${id}-search`}>Search the plain-language glossary<input type="search" id={`${id}-search`} value={query} onChange={event => setQuery(event.target.value)} placeholder="Try deposit, lease or deadline"/></label>
      <label className={styles.field} htmlFor={`${id}-language`}>Term explanation pilot<select id={`${id}-language`} value={language} onChange={event => setLanguage(event.target.value as typeof language)}><option value="en">English</option><option value="hi">English + हिन्दी (Hindi)</option><option value="ko">English + 한국어 (Korean)</option></select></label>
    </div>
    <p className={styles.note}>The Hindi and Korean pilot covers four everyday terms. These short explanations have not had professional language review and do not translate the full site or official instructions. Confirm important requirements with the responsible office.</p>
    <p role="status">{glossary.length} glossary {glossary.length === 1 ? 'term' : 'terms'} shown.</p>
    <dl className={styles.glossary}>{glossary.map(item => <div key={item.term}><dt>{item.term}</dt><dd>{item.meaning}{language === 'hi' && 'hi' in item && <p lang="hi">{item.hi}</p>}{language === 'ko' && 'ko' in item && <p lang="ko">{item.ko}</p>}</dd></div>)}</dl>
    <h3>Official resources</h3>
    <p className={styles.note}>The linked pages and these short descriptions were reviewed on October 25, 2026. This date applies to these three resource cards. It does not certify current prices, schedules, availability or every page in CampusBridge.</p>
    <ul className={styles.sources}>{GROUP_B_SOURCES.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title} <span className={styles.linkHint}>(opens a new tab)</span></a><p>{source.purpose}</p><small>Publisher: {source.publisher} · Reviewed <time dateTime={source.checkedOn}>October 25, 2026</time></small></li>)}</ul>
    <h3>Report outdated information</h3>
    <p>Prepare a report with the page and what seems wrong. This form stays in this tab and sends nothing automatically. Leave out passwords, account details and other sensitive information.</p>
    <label className={styles.field} htmlFor={`${id}-report-page`}>Page or resource name / link<input id={`${id}-report-page`} maxLength={300} value={reportPage} onChange={event => setReportPage(event.target.value)}/></label>
    <label className={styles.field} htmlFor={`${id}-report-detail`}>What needs checking?<textarea id={`${id}-report-detail`} maxLength={1500} rows={4} value={reportDetail} onChange={event => setReportDetail(event.target.value)}/></label>
    <div className={styles.actions}><button type="button" disabled={!canReport} onClick={() => { downloadText('campusbridge-information-report.txt', reportText(), 'text/plain;charset=utf-8'); setReportNotice('Report draft prepared for download. It has not been sent.'); }}>Download report draft</button>{mailto && canReport && <a href={mailto}>Open report in my email app</a>}<button type="button" disabled={!reportPage && !reportDetail} onClick={() => { setReportPage(''); setReportDetail(''); setReportNotice('Report draft cleared.'); }}>Clear draft</button></div>
    {mailto && <p className={styles.note}>Your email app opens a draft to {safeSupport}. Review it and choose Send yourself.</p>}
    {reportNotice && <p className={styles.notice} role="status">{reportNotice}</p>}
  </section>;
}

function GroupBContent({ state, accountId, supportEmail }: { state: StudentState; accountId: string; supportEmail?: string }) {
  return <div className={styles.tools}>
    <header className={styles.intro}><p className={styles.kicker}>Group B</p><h1>Your budget, reminders and trusted guidance</h1><p>Use these optional tools alongside your CampusBridge plan. You choose what to enter and save.</p><nav aria-label="Group B tools"><a href="#group-b-budget">Budgets</a><a href="#group-b-reminders">Reminders</a><a href="#group-b-trust">Terms and sources</a></nav></header>
    <div id="group-b-budget"><BudgetScenarios accountId={accountId}/></div>
    <div id="group-b-reminders"><StudentReminders accountId={accountId} state={state}/></div>
    <div id="group-b-trust"><TrustAndLanguage supportEmail={supportEmail}/></div>
  </div>;
}

export function GroupBTools(props: { state: StudentState; accountId: string; supportEmail?: string }) {
  return <GroupBContent key={props.accountId} {...props}/>;
}
