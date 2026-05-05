import { generateId } from '../utils/idGenerator.js';

export class CalendarEvent {
  constructor({ id, date, endDate, title, type, color }) {
    this.id = id ?? generateId();
    this.date = date;       // 'YYYY-MM-DD'
    this.endDate = endDate || date; // 'YYYY-MM-DD'
    this.title = title;
    this.type = type;       // 'holiday' | 'personal'
    this.color = color ?? 'var(--accent-blue)';
  }
}
