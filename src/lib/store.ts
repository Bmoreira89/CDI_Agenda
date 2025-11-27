import { promises as fs } from 'fs';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data');
const CITIES_FILE = path.join(DATA_DIR, 'cities.json');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');

async function ensureFiles() {
  await fs.mkdir(DATA_DIR, { recursive: true });
  for (const f of [CITIES_FILE, EVENTS_FILE]) {
    try { await fs.access(f); } catch { await fs.writeFile(f, '[]', 'utf8'); }
  }
}

export type City = { id: string; name: string; color?: string };
export type EventItem = {
  id: string; title: string; start: string; end?: string;
  city?: string; color?: string; allDay?: boolean;
};

export async function readCities(): Promise<City[]> {
  await ensureFiles();
  return JSON.parse(await fs.readFile(CITIES_FILE, 'utf8') || '[]');
}
export async function writeCities(rows: City[]) {
  await ensureFiles();
  await fs.writeFile(CITIES_FILE, JSON.stringify(rows, null, 2), 'utf8');
}
export async function readEvents(): Promise<EventItem[]> {
  await ensureFiles();
  return JSON.parse(await fs.readFile(EVENTS_FILE, 'utf8') || '[]');
}
export async function writeEvents(rows: EventItem[]) {
  await ensureFiles();
  await fs.writeFile(EVENTS_FILE, JSON.stringify(rows, null, 2), 'utf8');
}
