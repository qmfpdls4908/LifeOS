import { RoutineBlock } from '../models/RoutineBlock.js';
import { generateId } from '../utils/idGenerator.js';

export class RoutineService {
  #repo;
  #STORE_KEY = 'routines_v4';
  #routines = {};

  constructor(repository) {
    this.#repo = repository;
    let data = this.#repo.load(this.#STORE_KEY);

    if (!data || Object.keys(data).length === 0) {
      // Try migration from v3
      const v3Data = this.#repo.load('routines_v3');
      if (v3Data && Object.keys(v3Data).length > 0) {
        data = this.#migrateFromV3(v3Data);
        this.#repo.save(this.#STORE_KEY, data);
      } else {
        data = {};
      }
    }
    this.#routines = data;
  }

  // dateStr format: 'YYYY-MM-DD'
  getAll(dateStr) {
    // If not exists, auto-populate with default template
    if (!this.#routines[dateStr]) {
      this.#routines[dateStr] = this.#getBaseRoutineForDate(dateStr).map(b => ({ ...b, id: generateId() }));
      this.#save();
    }
    
    let needsSave = false;
    this.#routines[dateStr] = this.#routines[dateStr].map(b => {
      if (!b.id) {
        needsSave = true;
        return { ...b, id: generateId() };
      }
      return b;
    });
    if (needsSave) this.#save();

    return this.#routines[dateStr].map(b => new RoutineBlock(b)).sort((a, b) => a.startTime.localeCompare(b.startTime));
  }

  addBlock(dateStr, data) {
    const block = new RoutineBlock(data);
    if (!this.#routines[dateStr]) this.getAll(dateStr); // initialize if empty
    this.#routines[dateStr].push(block);
    this.#save();
  }

  updateBlock(dateStr, id, data) {
    if (!this.#routines[dateStr]) return;
    const idx = this.#routines[dateStr].findIndex(b => b.id === id);
    if (idx !== -1) {
      this.#routines[dateStr][idx] = { ...this.#routines[dateStr][idx], ...data, id };
      this.#save();
    }
  }

  removeBlock(dateStr, id) {
    if (!this.#routines[dateStr]) return;
    this.#routines[dateStr] = this.#routines[dateStr].filter(b => b.id !== id);
    this.#save();
  }

  // newRoutinesObj format: { '2026-05-04': [...], '2026-05-05': [...] }
  overwriteAllRoutines(newRoutinesObj) {
    Object.keys(newRoutinesObj).forEach(dateStr => {
      this.#routines[dateStr] = newRoutinesObj[dateStr].map(b => ({
        ...b,
        id: b.id || generateId()
      }));
    });
    this.#save();
  }

  getCurrentDateString() {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  }

  #save() {
    this.#repo.save(this.#STORE_KEY, this.#routines);
  }

  #migrateFromV3(v3Data) {
    const routines = {};
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.getTime());
    monday.setDate(diff);

    const keys = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime());
      d.setDate(monday.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = `${yyyy}-${mm}-${dd}`;
      
      const v3Key = keys[i];
      if (v3Data[v3Key]) {
        routines[dateStr] = v3Data[v3Key];
      }
    }
    return routines;
  }

  #getBaseRoutineForDate(dateStr) {
    // Play x4 출장 기간 특별 루틴 (2026-05-19 ~ 2026-05-24)
    if (dateStr === '2026-05-19') {
      return [
        { label: '수면', startTime: '00:00', endTime: '06:30', color: '#1e293b', category: 'sleep' },
        { label: '기상 및 출근 준비', startTime: '06:30', endTime: '07:00', color: '#3b82f6', category: 'routine' },
        { label: '이동 (출근)', startTime: '07:00', endTime: '08:00', color: '#0f172a', category: 'routine' },
        { label: '오전 업무', startTime: '08:00', endTime: '12:00', color: '#ef4444', category: 'work' },
        { label: '점심 식사', startTime: '12:00', endTime: '13:00', color: '#10b981', category: 'routine' },
        { label: '오후 업무', startTime: '13:00', endTime: '16:00', color: '#ef4444', category: 'work' },
        { label: '업무 정리 및 출장 준비', startTime: '16:00', endTime: '17:00', color: '#3b82f6', category: 'routine' },
        { label: '경남대 → 김해 MBC 아카데미 이동', startTime: '17:00', endTime: '18:00', color: '#0f172a', category: 'routine' },
        { label: '🚌 팀 집결 (김해 MBC 아카데미 18:00)', startTime: '18:00', endTime: '19:00', color: '#f59e0b', category: 'work' },
        { label: '서울 이동 (버스/차량)', startTime: '19:00', endTime: '22:00', color: '#0f172a', category: 'routine' },
        { label: '숙소 도착 및 정리', startTime: '22:00', endTime: '23:00', color: '#3b82f6', category: 'routine' },
        { label: '취침', startTime: '23:00', endTime: '24:00', color: '#1e293b', category: 'sleep' }
      ];
    }
    if (dateStr === '2026-05-20' || dateStr === '2026-05-21' || dateStr === '2026-05-22' || dateStr === '2026-05-23') {
      return [
        { label: '수면', startTime: '00:00', endTime: '06:30', color: '#1e293b', category: 'sleep' },
        { label: '기상 및 준비', startTime: '06:30', endTime: '07:00', color: '#3b82f6', category: 'routine' },
        { label: '아침 식사 (숙소)', startTime: '07:00', endTime: '07:30', color: '#10b981', category: 'routine' },
        { label: '숙소 → 행사장 이동', startTime: '07:30', endTime: '08:30', color: '#0f172a', category: 'routine' },
        { label: '🎮 Play x4 행사 준비 (셋업)', startTime: '08:30', endTime: '09:00', color: '#8b5cf6', category: 'work' },
        { label: '🎮 Play x4 행사 운영 (오전)', startTime: '09:00', endTime: '12:00', color: '#ef4444', category: 'work' },
        { label: '점심 식사', startTime: '12:00', endTime: '13:00', color: '#10b981', category: 'routine' },
        { label: '🎮 Play x4 행사 운영 (오후)', startTime: '13:00', endTime: '18:00', color: '#ef4444', category: 'work' },
        { label: '저녁 식사', startTime: '18:00', endTime: '19:00', color: '#10b981', category: 'routine' },
        { label: '행사 정리 / 리뷰', startTime: '19:00', endTime: '20:30', color: '#3b82f6', category: 'work' },
        { label: '행사장 → 숙소 이동', startTime: '20:30', endTime: '21:00', color: '#0f172a', category: 'routine' },
        { label: '자율 시간 (숙소)', startTime: '21:00', endTime: '23:00', color: '#8b5cf6', category: 'free' },
        { label: '취침 준비', startTime: '23:00', endTime: '23:30', color: '#3b82f6', category: 'routine' },
        { label: '취침', startTime: '23:30', endTime: '24:00', color: '#1e293b', category: 'sleep' }
      ];
    }
    if (dateStr === '2026-05-24') {
      return [
        { label: '수면', startTime: '00:00', endTime: '07:00', color: '#1e293b', category: 'sleep' },
        { label: '기상 및 숙소 정리', startTime: '07:00', endTime: '08:00', color: '#3b82f6', category: 'routine' },
        { label: '아침 식사', startTime: '08:00', endTime: '09:00', color: '#10b981', category: 'routine' },
        { label: '체크아웃 및 짐 정리', startTime: '09:00', endTime: '10:00', color: '#3b82f6', category: 'routine' },
        { label: '자율 시간 (서울)', startTime: '10:00', endTime: '12:00', color: '#8b5cf6', category: 'free' },
        { label: '점심 식사', startTime: '12:00', endTime: '13:00', color: '#10b981', category: 'routine' },
        { label: '자율 시간 (서울)', startTime: '13:00', endTime: '17:00', color: '#8b5cf6', category: 'free' },
        { label: '🏠 김해 복귀 이동', startTime: '17:00', endTime: '21:00', color: '#0f172a', category: 'routine' },
        { label: '집 도착 및 정리', startTime: '21:00', endTime: '22:00', color: '#3b82f6', category: 'routine' },
        { label: '자율 시간', startTime: '22:00', endTime: '23:00', color: '#8b5cf6', category: 'free' },
        { label: '취침 준비', startTime: '23:00', endTime: '23:30', color: '#3b82f6', category: 'routine' },
        { label: '취침', startTime: '23:30', endTime: '24:00', color: '#1e293b', category: 'sleep' }
      ];
    }

    const d = new Date(dateStr);
    const day = d.getDay();
    const isWeekend = (day === 0 || day === 6);
    
    if (isWeekend) {
      return [
        { label: '수면', startTime: '00:00', endTime: '08:00', color: '#1e293b', category: 'sleep' },
        { label: '기상 및 아침 식사', startTime: '08:00', endTime: '09:00', color: '#3b82f6', category: 'routine' },
        { label: '오전 자율 시간 (독서)', startTime: '09:00', endTime: '12:00', color: '#8b5cf6', category: 'free' },
        { label: '점심 식사', startTime: '12:00', endTime: '13:00', color: '#10b981', category: 'routine' },
        { label: '오후 자율 (게임/창작 집중)', startTime: '13:00', endTime: '18:00', color: '#8b5cf6', category: 'free' },
        { label: '저녁 식사', startTime: '18:00', endTime: '19:00', color: '#10b981', category: 'routine' },
        { label: '저녁 자율 시간', startTime: '19:00', endTime: '22:30', color: '#8b5cf6', category: 'free' },
        { label: '주간 회고 및 취침 준비', startTime: '22:30', endTime: '23:30', color: '#3b82f6', category: 'routine' },
        { label: '취침', startTime: '23:30', endTime: '24:00', color: '#1e293b', category: 'sleep' }
      ];
    } else if (day === 3) {
      // 수요일: 경남대 리얼리티랩 출근 (통학버스 07:25 탑승 기준)
      return [
        { label: '수면', startTime: '00:00', endTime: '06:15', color: '#1e293b', category: 'sleep' },
        { label: '기상 및 출근 준비', startTime: '06:15', endTime: '07:00', color: '#3b82f6', category: 'routine' },
        { label: '집 ➔ 김해시청 이동 (여유 포함)', startTime: '07:00', endTime: '07:25', color: '#0f172a', category: 'routine' },
        { label: '통학버스 (김해시청 ➔ 경남대)', startTime: '07:25', endTime: '08:30', color: '#0f172a', category: 'routine' },
        { label: '학교 도착 및 업무 준비', startTime: '08:30', endTime: '09:00', color: '#3b82f6', category: 'routine' },
        { label: '오전 업무 (리얼리티랩)', startTime: '09:00', endTime: '12:00', color: '#ef4444', category: 'work' },
        { label: '점심 식사', startTime: '12:00', endTime: '13:00', color: '#10b981', category: 'routine' },
        { label: '오후 업무 (리얼리티랩)', startTime: '13:00', endTime: '18:00', color: '#ef4444', category: 'work' },
        { label: '퇴근 및 이동', startTime: '18:00', endTime: '19:30', color: '#0f172a', category: 'routine' },
        { label: '저녁 식사', startTime: '19:30', endTime: '20:30', color: '#10b981', category: 'routine' },
        { label: '자율 시간', startTime: '20:30', endTime: '23:00', color: '#8b5cf6', category: 'free' },
        { label: '취침 준비', startTime: '23:00', endTime: '23:30', color: '#3b82f6', category: 'routine' },
        { label: '취침', startTime: '23:30', endTime: '24:00', color: '#1e293b', category: 'sleep' }
      ];
    } else {
      return [
        { label: '수면', startTime: '00:00', endTime: '06:30', color: '#1e293b', category: 'sleep' },
        { label: '수면 기상', startTime: '06:30', endTime: '07:00', color: '#3b82f6', category: 'routine' },
        { label: '출근 준비', startTime: '07:00', endTime: '08:00', color: '#3b82f6', category: 'routine' },
        { label: '이동 (출근)', startTime: '08:00', endTime: '09:00', color: '#0f172a', category: 'routine' },
        { label: '오전 업무', startTime: '09:00', endTime: '12:00', color: '#ef4444', category: 'work' },
        { label: '점심 식사', startTime: '12:00', endTime: '13:00', color: '#10b981', category: 'routine' },
        { label: '오후 업무', startTime: '13:00', endTime: '18:00', color: '#ef4444', category: 'work' },
        { label: '이동 (퇴근)', startTime: '18:00', endTime: '19:00', color: '#0f172a', category: 'routine' },
        { label: '저녁 식사', startTime: '19:00', endTime: '20:00', color: '#10b981', category: 'routine' },
        { label: '자율 시간', startTime: '20:00', endTime: '23:00', color: '#8b5cf6', category: 'free' },
        { label: '취침 준비', startTime: '23:00', endTime: '23:30', color: '#3b82f6', category: 'routine' },
        { label: '취침', startTime: '23:30', endTime: '24:00', color: '#1e293b', category: 'sleep' }
      ];
    }
  }
}
