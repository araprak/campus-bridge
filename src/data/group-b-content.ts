export const GROUP_B_SOURCES = [
  { title: 'UT Dallas housing options', publisher: 'UT Dallas University Housing', url: 'https://housing.utdallas.edu/housing-options/', purpose: 'Official descriptions of on-campus housing options and links to their details.', checkedOn: '2026-10-25' },
  { title: 'Comet Cruiser', publisher: 'UT Dallas Auxiliary Services', url: 'https://services.utdallas.edu/transit/cruiser/', purpose: 'Official neighborhood bus information, routes and schedules to check before travel.', checkedOn: '2026-10-25' },
  { title: 'International Student Orientation', publisher: 'UT Dallas Intercultural Programs', url: 'https://icp.utdallas.edu/students/international-student-orientation/', purpose: 'Official orientation instructions, pre-arrival resources and support contacts.', checkedOn: '2026-10-25' },
] as const;

export const GROUP_B_GLOSSARY = [
  { term: 'Lease', meaning: 'The written agreement that explains the conditions for renting a home, including its dates, rent and responsibilities.', hi: 'किराये का लिखित समझौता।', ko: '집을 빌리는 조건을 적은 계약서.' },
  { term: 'Refundable deposit', meaning: 'Money paid upfront that may be returned if the agreement’s conditions are met. It is still cash you need at move-in; return is not guaranteed.', hi: 'शर्तें पूरी होने पर वापस मिल सकने वाली जमा राशि।', ko: '조건을 충족하면 돌려받을 수 있는 보증금.' },
  { term: 'Utility', meaning: 'A home service such as electricity or water. Check exactly which services are included in your rent and which you must arrange.', hi: 'बिजली या पानी जैसी घरेलू सेवा।', ko: '전기나 수도 같은 생활 서비스.' },
  { term: 'Deadline', meaning: 'The last date or time for completing something. Check the time zone and the official source before setting your reminder.', hi: 'किसी काम को पूरा करने की अंतिम तारीख या समय।', ko: '일을 마쳐야 하는 마지막 날짜나 시간.' },
  { term: 'Recurring monthly cost', meaning: 'A charge that repeats each month, such as your share of rent. Keep it separate from charges paid only once.' },
  { term: 'One-time fee', meaning: 'A charge you expect to pay once. Enter nonrefundable move-in charges here and deposits separately so you do not count them twice.' },
  { term: 'Per-person cost', meaning: 'Your share of a cost. A whole apartment’s rent can be different from the amount that one roommate pays.' },
  { term: 'Included', meaning: 'Already covered by another amount you entered. Use an explicit zero for a separate line only after confirming there is no extra charge.' },
  { term: 'Unknown cost', meaning: 'An amount you have not confirmed. Leaving a line blank keeps it unknown; it does not mean the cost is zero.' },
  { term: 'IANA time zone', meaning: 'A place-based time zone name, such as America/Chicago for Dallas. It accounts for the daylight-saving rules that apply on your chosen date.' },
  { term: 'Calendar file (.ics)', meaning: 'A file you can import into a calendar app. The app controls its notifications; downloading a file does not by itself set an alert.' },
  { term: 'Official source', meaning: 'A page published by the organization responsible for that service or requirement. Read its current instructions when you act.' },
];
