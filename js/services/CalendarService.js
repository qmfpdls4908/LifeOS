import { CalendarEvent } from '../models/CalendarEvent.js';

export class CalendarService {
  #repo;
  #bus;
  #STORE_KEY = 'calendar_events';
  #events = [];
  #holidays = [];

  constructor(repository, eventBus) {
    this.#repo = repository;
    this.#bus = eventBus;
    this.#initHolidays();
    const data = this.#repo.load(this.#STORE_KEY);
    this.#events = data.map(e => new CalendarEvent(e));
    this.#seedBusinessTripEvents();
  }

  // 2026 Korean public holidays (hardcoded for simplicity)
  #initHolidays() {
    const holidays2026 = [
      { date: '2026-01-01', title: '신정' },
      { date: '2026-02-16', endDate: '2026-02-18', title: '설날 연휴' },
      { date: '2026-03-01', title: '3·1절' },
      { date: '2026-03-02', title: '대체공휴일' },
      { date: '2026-05-05', title: '어린이날' },
      { date: '2026-05-24', title: '부처님오신날' },
      { date: '2026-05-25', title: '대체공휴일' },
      { date: '2026-06-06', title: '현충일' },
      { date: '2026-08-15', title: '광복절' },
      { date: '2026-09-24', endDate: '2026-09-26', title: '추석 연휴' },
      { date: '2026-10-03', title: '개천절' },
      { date: '2026-10-09', title: '한글날' },
      { date: '2026-12-25', title: '기독탄신일' }
    ];
    this.#holidays = holidays2026.map(h => new CalendarEvent({
      ...h,
      type: 'holiday',
      color: 'var(--danger)'
    }));
  }

  #seedBusinessTripEvents() {
    if (this.#events.some(e => e.title && e.title.includes('Play x4'))) return;
    const businessTripEvents = [
      { date: '2026-05-19', endDate: '2026-05-19', title: '🚌 경남대→김해 MBC 아카데미 집결 (18:00) → 서울 이동', type: 'personal', color: '#f59e0b' },
      { date: '2026-05-20', endDate: '2026-05-23', title: '🎮 Play x4 행사 운영 (서울)', type: 'personal', color: '#8b5cf6' },
      { date: '2026-05-24', endDate: '2026-05-24', title: '🏠 김해 복귀 (저녁)', type: 'personal', color: '#10b981' }
    ];
    businessTripEvents.forEach(ev => {
      this.#events.push(new CalendarEvent(ev));
    });
    this.#save();
  }

  getAllEvents() {
    return [...this.#holidays, ...this.#events];
  }

  addPersonalEvent(date, endDate, title) {
    const newEvent = new CalendarEvent({ date, endDate, title, type: 'personal' });
    this.#events.push(newEvent);
    this.#save();
    return newEvent;
  }

  removePersonalEvent(id) {
    this.#events = this.#events.filter(e => e.id !== id);
    this.#save();
  }

  #save() {
    this.#repo.save(this.#STORE_KEY, this.#events);
    this.#bus.emit('calendar:updated');
  }
}
