// Big weekends shown on /listings/big-dates. Edit this list to add or change events.
//   group    Section the event appears under (sections show in the order first used below)
//   name     Card title
//   date     The day of the event (YYYY-MM-DD) for the date badge; leave '' to show the stay dates
//   arrival  Check-in date searched when a guest clicks "See open homes"
//   departure Check-out date searched
// Events disappear from the page automatically once their date has passed.

export const EVENT_GROUPS = {
  'Notre Dame Football 2026': 'Make game day unforgettable with spacious homes, outdoor gathering areas, and easy access to campus.',
  'Graduation Weekend 2027': 'Make graduation weekend even more memorable with a home that gives everyone space to relax, reconnect, and celebrate every milestone together.',
  'Notre Dame Football 2027': 'Make game day unforgettable with spacious homes, outdoor gathering areas, and easy access to campus.',
};

export const EVENTS = [
  { group: 'Notre Dame Football 2026', name: 'Notre Dame vs. Miami', date: '2026-11-07', arrival: '2026-11-06', departure: '2026-11-08' },
  { group: 'Notre Dame Football 2026', name: 'Notre Dame vs. Boston College', date: '2026-11-14', arrival: '2026-11-13', departure: '2026-11-15' },
  { group: 'Notre Dame Football 2026', name: 'Notre Dame vs. SMU', date: '2026-11-21', arrival: '2026-11-20', departure: '2026-11-22' },
  { group: 'Graduation Weekend 2027', name: 'Notre Dame Graduation Weekend', date: '', arrival: '2027-05-13', departure: '2027-05-16' },
  { group: 'Notre Dame Football 2027', name: 'Notre Dame vs. Purdue', date: '2027-09-04', arrival: '2027-09-03', departure: '2027-09-05' },
  { group: 'Notre Dame Football 2027', name: 'Notre Dame vs. Auburn', date: '2027-09-25', arrival: '2027-09-24', departure: '2027-09-26' },
  { group: 'Notre Dame Football 2027', name: 'Notre Dame vs. Kent State', date: '2027-10-02', arrival: '2027-10-01', departure: '2027-10-03' },
];
