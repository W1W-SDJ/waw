// Inspect the auto-click test dump: did the mascot reach the singing state?
import { readFileSync } from 'node:fs';

const file = process.argv[2];
const html = readFileSync(file, 'utf8');

const figureClass = (html.match(/<figure class="([^"]*)"[^>]*data-mascot/) ?? [])[1] ?? '(not found)';
const bubble = (html.match(/<p class="whale-say"[^>]*>([^<]*)</) ?? [])[1] ?? '(not found)';
const notes = /class="mascot-hearts"/.test(html);

console.log('figure class :', figureClass);
console.log('bubble text  :', JSON.stringify(bubble));
console.log('notes spawned:', notes);
console.log('singing?     :', figureClass.includes('is-singing') ? 'YES ✓' : 'no');
