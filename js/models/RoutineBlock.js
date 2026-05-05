import { generateId } from '../utils/idGenerator.js';

export class RoutineBlock {
  constructor({ id, label, startTime, endTime, color, category, habitId }) {
    this.id = id ?? generateId();
    this.label = label;
    this.startTime = startTime; // 'HH:MM'
    this.endTime = endTime;
    this.color = color;
    this.category = category;   // 'work' | 'free' | 'sleep' | 'routine'
    this.habitId = habitId ?? null;
  }
}
