import { generateId } from '../utils/idGenerator.js';

export class Habit {
  constructor({ id, name, icon, unit, monthlyGoals, logs }) {
    this.id = id ?? generateId();
    this.name = name;
    this.icon = icon;
    this.unit = unit ?? 'minutes';        // 'minutes' | 'pages' | 'commits'
    this.monthlyGoals = monthlyGoals ?? {}; // { '2026-05': { target: 1200, label: '...' } }
    this.logs = logs ?? {};                // { '2026-05-03': { done: true, value: 45, memo: '' } }
  }
}
