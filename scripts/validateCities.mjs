import { CURATED_CITIES } from '../src/services/curatedCities.js';

const REQUIRED = [
  'Housing', 'Cost of Living', 'Startups', 'Venture Capital',
  'Travel Connectivity', 'Commute', 'Business Freedom', 'Safety',
  'Healthcare', 'Education', 'Environmental Quality', 'Economy',
  'Taxation', 'Internet Access', 'Leisure & Culture', 'Tolerance', 'Outdoors',
];

let problems = 0;
const ids = new Set();

for (const c of CURATED_CITIES) {
  if (ids.has(c.id)) { console.error(`${c.id}: duplicate id`); problems++; }
  ids.add(c.id);
  for (const m of REQUIRED) {
    const v = c.scores?.[m];
    if (typeof v !== 'number' || v < 0 || v > 10) {
      console.error(`${c.id}: "${m}" missing or outside 0-10 (${v})`);
      problems++;
    }
  }
  if (!c.scoreSource) { console.error(`${c.id}: missing scoreSource`); problems++; }
}

console.log(problems ? `${problems} problem(s)` : `OK: ${CURATED_CITIES.length} cities valid`);
process.exit(problems ? 1 : 0);