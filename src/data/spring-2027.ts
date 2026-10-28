/** Official navigation facts checked on October 27, 2026. Personal requirements
 * and appointment times belong to the university; do not collect health records
 * or immigration document numbers to decide whether a task applies. */
export type SpringEligibility = 'all' | 'f1' | 'under22' | 'international' | 'new-graduate-exchange' | 'outside-us';

export interface SpringSource {
  id: string;
  title: string;
  publisher: string;
  url: string;
  checkedOn: string;
  purpose: string;
}

export const SPRING_2027_SOURCES: readonly SpringSource[] = [
  { id: 'orientation', title: 'Spring 2027 International Student Orientation', publisher: 'UT Dallas Intercultural Programs', url: 'https://icp.utdallas.edu/students/international-student-orientation/', checkedOn: '2026-10-27', purpose: 'Registration, pre-arrival modules, January 13 check-in and orientation, and the attendance fee.' },
  { id: 'isso-arrival', title: 'ISSO pre/post-arrival resources', publisher: 'UT Dallas International Students and Scholars Office', url: 'https://isso.utdallas.edu/joining-ut-dallas/pre-post-arrival-resources/', checkedOn: '2026-10-27', purpose: 'Immigration check-in, understanding the I-20 and the official port-of-entry video.' },
  { id: 'international-checklist', title: 'New International Student Checklist', publisher: 'UT Dallas Intercultural Programs', url: 'https://icp.utdallas.edu/resources/checklist/', checkedOn: '2026-10-27', purpose: 'University account setup, SEVIS fee navigation, orientation and pre/post-arrival assignments.' },
  { id: 'institutional-requirements', title: 'Institutional requirements', publisher: 'UT Dallas Intercultural Programs', url: 'https://icp.utdallas.edu/students/post-arrival-resources/institutional-requirements/', checkedOn: '2026-10-27', purpose: 'TB screening eligibility, the conditional T-Spot fee, registration holds and insurance requirements.' },
  { id: 'meningitis', title: 'Bacterial meningitis vaccination requirement', publisher: 'UT Dallas Office of the Registrar', url: 'https://registrar.utdallas.edu/legislative-policies/vaccine/', checkedOn: '2026-10-27', purpose: 'Spring 2027 vaccination window, document submission and exemption instructions.' },
  { id: 'travel-guide', title: 'International student travel guide', publisher: 'UT Dallas Intercultural Programs', url: 'https://icp.utdallas.edu/resources/travel-guide/', checkedOn: '2026-10-27', purpose: 'Airport arrival, Silver Line planning figures, Big Howdy pickup and carrying immigration documents.' },
  { id: 'i20-entry', title: 'Students and the Form I-20', publisher: 'U.S. Department of Homeland Security, Study in the States', url: 'https://studyinthestates.dhs.gov/students/prepare/students-and-the-form-i-20', checkedOn: '2026-10-27', purpose: 'The Form I-20, SEVIS and initial entry up to 30 days before the program start date printed on the form.' },
  { id: 'classes-begin', title: 'Spring 2027 classes begin: full-term session', publisher: 'UT Dallas Office of the Registrar', url: 'https://calendar.utdallas.edu/event/spring-2027-classes-begin-full-term-session', checkedOn: '2026-10-27', purpose: 'January 19, 2027 full-term class start; individual class times come from the student schedule.' },
  { id: 'academic-calendar', title: 'UT Dallas academic calendar', publisher: 'UT Dallas Office of the Registrar', url: 'https://utdallas.edu/academics/calendar/', checkedOn: '2026-10-27', purpose: 'Official term calendar and the distinction between full-term and eight-week session dates. Verify the Spring 2027 full calendar before using Census Day.' },
  { id: 'insurance-rates', title: '2026–2027 UT SHIP policy costs', publisher: 'UT Dallas Student Health Insurance', url: 'https://insurance.utdallas.edu/policies/', checkedOn: '2026-10-27', purpose: 'Spring 2027 student medical premium of $1,534 for January 1–May 31; dependent and optional coverages are separate.' },
  { id: 'insurance-requirements', title: 'Health insurance for international students', publisher: 'UT Dallas Student Health Insurance', url: 'https://insurance.utdallas.edu/policies/international/', checkedOn: '2026-10-27', purpose: 'F-1/F-2/J-1/J-2 insurance requirements, automatic UT SHIP enrollment and comparable-coverage waiver eligibility.' },
  { id: 'insurance-waiver', title: 'Spring 2027 international student insurance waiver', publisher: 'UT Dallas Student Health Insurance', url: 'https://insurance.utdallas.edu/waiver/', checkedOn: '2026-10-27', purpose: 'Published waiver window of December 7, 2026–February 3, 2027, eligibility, documentation and approval process.' },
  { id: 'dart-pass', title: 'DART Access Pass', publisher: 'UT Dallas Parking and Transportation', url: 'https://services.utdallas.edu/transit/dart/', checkedOn: '2026-10-27', purpose: 'GoPass access and student eligibility: valid Comet Card, current registration and paid student fees; apply on or after the first class day.' },
];

export interface SpringDeadline {
  id: string;
  title: string;
  date: string | null;
  time?: string;
  timeZone: 'America/Chicago';
  eligibility: SpringEligibility;
  note: string;
  sourceId: string;
}

export const SPRING_2027_DEADLINES: readonly SpringDeadline[] = [
  { id: 'orientation-registration', title: 'Orientation registration opens', date: '2026-10-28', timeZone: 'America/Chicago', eligibility: 'new-graduate-exchange', sourceId: 'orientation', note: 'Register through Galaxy. ICP publishes 10 a.m. “CST”; Dallas observes daylight time on October 28. This template keeps the verified date without converting that ambiguous time. Check ICP before acting. Mandatory for new F/J graduate and exchange students; undergraduates follow their orientation instructions.' },
  { id: 'modules-open', title: 'Pre-arrival modules become available', date: '2026-10-28', timeZone: 'America/Chicago', eligibility: 'new-graduate-exchange', sourceId: 'orientation', note: 'Access eLearning with your NetID. ICP publishes an opening time of 10 a.m. “CST”; confirm the opening time with ICP because Dallas is on daylight time that day. Each quiz requires 100% before advancing.' },
  { id: 'modules-complete', title: 'Complete pre-arrival modules before orientation', date: '2027-01-12', timeZone: 'America/Chicago', eligibility: 'new-graduate-exchange', sourceId: 'orientation', note: 'ICP requires completion one day before your in-person orientation. January 12 is the date before the published January 13 session; no exact cutoff time is published. Complete early and follow your assigned session.' },
  { id: 'big-howdy', title: 'Check Big Howdy spring airport pickup requests', date: null, timeZone: 'America/Chicago', eligibility: 'international', sourceId: 'travel-guide', note: 'UTD says spring request forms become available beginning mid-November. An exact opening date is not published. Pick a date to check the program; availability and a submitted request do not guarantee a confirmed pickup.' },
  { id: 'tb-appointments', title: 'Check spring TB appointment availability', date: '2026-12-01', timeZone: 'America/Chicago', eligibility: 'outside-us', sourceId: 'orientation', note: 'ICP says the spring appointment link is activated December 1. This is an appointment-opening date, not a screening deadline. Follow Student Health Center instructions if you were born outside the United States.' },
  { id: 'meningitis', title: 'Meningitis vaccine cutoff, if required', date: '2027-01-09', timeZone: 'America/Chicago', eligibility: 'under22', sourceId: 'meningitis', note: 'For entering students under 22, the Registrar lists a vaccination window of January 19, 2022–January 9, 2027. Submit the required form and documentation through the Registrar; exemptions may apply. This is the vaccine administration cutoff, not a reminder that uploading any document alone fulfills the requirement.' },
  { id: 'orientation', title: 'International Student Orientation check-in', date: '2027-01-13', time: '12:30', timeZone: 'America/Chicago', eligibility: 'new-graduate-exchange', sourceId: 'orientation', note: 'Check-in is 12:30–1:30 p.m.; the orientation runs 2–7 p.m. at ATC Lecture Hall. Complete pre-arrival modules first and register through Galaxy. Follow the university’s current instructions for your student category.' },
  { id: 'classes-begin', title: 'Spring 2027 full-term classes begin', date: '2027-01-19', timeZone: 'America/Chicago', eligibility: 'all', sourceId: 'classes-begin', note: 'This is the full-term start date. Check Galaxy for your own class times and session; eight-week sessions can have different deadlines.' },
  { id: 'insurance-waiver-opens', title: 'UT SHIP waiver application period opens', date: '2026-12-07', timeZone: 'America/Chicago', eligibility: 'international', sourceId: 'insurance-waiver', note: 'Only if you meet the official waiver criteria and have acceptable alternative coverage. Apply through the electronic waiver system; a request is not approval and coverage remains required.' },
  { id: 'insurance-waiver-closes', title: 'UT SHIP waiver documents due, if eligible', date: '2027-02-03', timeZone: 'America/Chicago', eligibility: 'international', sourceId: 'insurance-waiver', note: 'UTD publishes February 3, 2027 at 11:59 p.m.; the page does not specify a time zone, so this template retains the date without inventing a converted instant. Confirm the deadline in the waiver system and submit early. Approval requires eligible comparable coverage for January 1–May 31; a new application is needed each semester.' },
  { id: 'tb-screening', title: 'Complete required TB screening before classes', date: null, timeZone: 'America/Chicago', eligibility: 'outside-us', sourceId: 'institutional-requirements', note: 'Required for people born outside the United States. UTD requires an acceptable U.S.-administered and interpreted IGRA/T-Spot test no more than six months before classes, and appropriate documentation before registration/classes. Choose your appointment date with the Student Health Center; do not treat December 1 as the due date.' },
  { id: 'immigration-check-in', title: 'Complete New Student Immigration Check-In', date: null, timeZone: 'America/Chicago', eligibility: 'f1', sourceId: 'isso-arrival', note: 'Follow ISSO’s New Student Check-In instructions after arrival and any due date in your own iComet instructions. This template does not invent a universal deadline or collect your immigration documents.' },
  { id: 'census-day', title: 'Verify your session’s Census Day', date: null, timeZone: 'America/Chicago', eligibility: 'all', sourceId: 'academic-calendar', note: 'Choose a reminder only after checking the official Spring 2027 calendar for your session. The full-term date has not been verified here; January 26 on a first eight-week event must not be substituted for full-term Census Day.' },
  { id: 'entry-window', title: 'Check your initial F-1 entry window', date: null, timeZone: 'America/Chicago', eligibility: 'f1', sourceId: 'i20-entry', note: 'For initial entry, DHS says you may arrive up to 30 days before the program start date printed on your Form I-20. Use that date and ISSO instructions; do not calculate an entry date from January 19 classes or assume this rule covers every continuing student.' },
];

export interface SpringCharge {
  id: 'utship' | 'tb-test' | 'orientation';
  title: string;
  lowCents: number | null;
  highCents: number | null;
  basis: 'one-time' | 'semester';
  months?: number;
  eligibility: SpringEligibility;
  note: string;
  sourceId: string;
}

export const SPRING_2027_CHARGES: readonly SpringCharge[] = [
  { id: 'utship', title: 'UT SHIP student medical premium', lowCents: 153400, highCents: 153400, basis: 'semester', months: 5, eligibility: 'international', sourceId: 'insurance-rates', note: 'Published Spring 2027 student premium for January 1–May 31: $1,534, or $306.80 per month as a budgeting allocation. It is billed to the student account, not as a monthly subscription. Automatic enrollment applies to F-1/F-2/J-1/J-2 international students; an approved comparable-coverage waiver can change the amount. Dependents and optional dental/vision are extra. Repatriation/evacuation is already included in UT SHIP.' },
  { id: 'tb-test', title: 'T-Spot test, if not covered by insurance', lowCents: 15000, highCents: 15000, basis: 'one-time', eligibility: 'outside-us', sourceId: 'institutional-requirements', note: 'UTD lists $150 at the Student Health Center if not covered by Student Health Insurance. Screening eligibility is based on being born outside the United States, not F-1 status alone. Confirm coverage and timing before using $0 or $150; this is a conditional planning cost, not a charge for every student.' },
  { id: 'orientation', title: 'International Student Orientation attendance fee', lowCents: 5000, highCents: 5000, basis: 'one-time', eligibility: 'new-graduate-exchange', sourceId: 'orientation', note: 'UTD applies $50 to the student account upon attendance. International orientation is mandatory for new F/J graduate and exchange students; undergraduates have their own orientation instructions. Include the fee only when this session applies.' },
];

export interface SpringGlossaryTerm { term: string; meaning: string; sourceId: string }

export const SPRING_2027_GLOSSARY: readonly SpringGlossaryTerm[] = [
  { term: 'I-20', meaning: 'The school-issued Certificate of Eligibility for Nonimmigrant Student Status used by F/M students. Check its program start date for your initial entry window and keep the signed form with you when traveling.', sourceId: 'i20-entry' },
  { term: 'SEVIS', meaning: 'The Student and Exchange Visitor Information System. Your I-20 includes a SEVIS identification number; the separate I-901 fee is an immigration step. Use the official instructions and never enter that number into CampusBridge.', sourceId: 'i20-entry' },
  { term: 'Port of entry', meaning: 'The U.S. arrival point where a Customs and Border Protection officer inspects your documents and decides admission. Have your signed I-20 available rather than packed in checked luggage.', sourceId: 'i20-entry' },
  { term: 'Census Day', meaning: 'A session-specific academic reporting date shown in the Registrar’s calendar, associated with registration and drop rules. Full-term and eight-week sessions can have different dates; check your session.', sourceId: 'academic-calendar' },
  { term: 'Registration hold', meaning: 'A restriction on your university account that can prevent class registration. View the hold in Galaxy/Orion and contact the department that placed it for removal instructions.', sourceId: 'orientation' },
  { term: 'GoPass', meaning: 'DART’s phone app for transit passes and trip resources. UTD’s student DART Access Pass has eligibility and application requirements; do not assume a free pass is active when you first arrive.', sourceId: 'dart-pass' },
  { term: 'T-Spot', meaning: 'An IGRA blood test used for UTD’s TB screening requirement. UTD requires an acceptable test administered and interpreted in the United States; the Student Health Center decides documentation and coverage questions.', sourceId: 'institutional-requirements' },
  { term: 'NetID', meaning: 'Your UT Dallas university account identifier, used with your password to access university systems such as eLearning. CampusBridge has a separate account and does not need your NetID password.', sourceId: 'orientation' },
  { term: 'Galaxy', meaning: 'The UT Dallas portal used to reach student services such as Orion, orientation registration and account holds. Use the university portal directly for official records and submissions.', sourceId: 'orientation' },
  { term: 'UT SHIP', meaning: 'The UT Student Health Insurance Plan. Eligible international students are automatically enrolled each semester; an approved waiver requires comparable coverage. Check your student account and the official insurance office for your actual charge.', sourceId: 'insurance-requirements' },
];
