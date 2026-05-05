import { Habit } from '../models/Habit.js';

export class HabitService {
  #repo;
  #STORE_KEY = 'habits_v2';
  #habits = [];

  constructor(repository) {
    this.#repo = repository;
    let data = this.#repo.load(this.#STORE_KEY);

    // Migration from v1 (array-based logs)
    if (!data || data.length === 0) {
      const v1 = this.#repo.load('habits');
      if (v1 && v1.length > 0) {
        data = v1.map(h => this.#migrateV1(h));
        this.#repo.save(this.#STORE_KEY, data);
      }
    }

    if (!data || data.length === 0) {
      this.#habits = [
        new Habit({ name: '독서', icon: '📚', unit: 'minutes' }),
        new Habit({ name: '게임', icon: '🎮', unit: 'minutes' }),
        new Habit({ name: '게임 창작', icon: '💻', unit: 'minutes' })
      ];
      this.#save();
    } else {
      this.#habits = data.map(h => new Habit(h));
    }
  }

  #migrateV1(old) {
    const newLogs = {};
    if (Array.isArray(old.logs)) {
      old.logs.forEach(dateStr => {
        newLogs[dateStr] = { done: true, value: 0, memo: '' };
      });
    }
    return {
      id: old.id,
      name: old.name,
      icon: old.icon,
      unit: 'minutes',
      monthlyGoals: {},
      logs: newLogs
    };
  }

  getAll() {
    return this.#habits;
  }

  // Log activity for a specific date
  logActivity(id, dateStr, { value = 0, memo = '' } = {}) {
    const habit = this.#habits.find(h => h.id === id);
    if (!habit) return;

    if (habit.logs[dateStr]) {
      // Update existing log
      habit.logs[dateStr].value = value;
      habit.logs[dateStr].memo = memo;
      habit.logs[dateStr].done = true;
    } else {
      habit.logs[dateStr] = { done: true, value, memo };
    }
    this.#save();
  }

  // Toggle done status (quick check)
  toggleLog(id, dateStr) {
    const habit = this.#habits.find(h => h.id === id);
    if (!habit) return;

    if (habit.logs[dateStr]) {
      delete habit.logs[dateStr];
    } else {
      habit.logs[dateStr] = { done: true, value: 0, memo: '' };
    }
    this.#save();
  }

  // Check if done today
  isDone(id, dateStr) {
    const habit = this.#habits.find(h => h.id === id);
    return habit && habit.logs[dateStr] && habit.logs[dateStr].done;
  }

  // Get log for a date
  getLog(id, dateStr) {
    const habit = this.#habits.find(h => h.id === id);
    if (!habit) return null;
    return habit.logs[dateStr] || null;
  }

  // Set monthly goal
  setMonthlyGoal(id, monthStr, target, label) {
    const habit = this.#habits.find(h => h.id === id);
    if (!habit) return;
    habit.monthlyGoals[monthStr] = { target, label };
    this.#save();
  }

  // Get monthly goal
  getMonthlyGoal(id, monthStr) {
    const habit = this.#habits.find(h => h.id === id);
    if (!habit) return null;
    return habit.monthlyGoals[monthStr] || null;
  }

  // Calculate monthly progress (total value for the month)
  getMonthlyProgress(id, monthStr) {
    const habit = this.#habits.find(h => h.id === id);
    if (!habit) return { total: 0, target: 0, percent: 0 };

    let total = 0;
    Object.keys(habit.logs).forEach(dateStr => {
      if (dateStr.startsWith(monthStr)) {
        total += habit.logs[dateStr].value || 0;
      }
    });

    const goal = habit.monthlyGoals[monthStr];
    const target = goal ? goal.target : 0;
    const percent = target > 0 ? Math.min(100, Math.round((total / target) * 100)) : 0;

    return { total, target, percent };
  }

  // Calculate weekly total
  getWeeklyTotal(id, weekStartDate) {
    const habit = this.#habits.find(h => h.id === id);
    if (!habit) return 0;

    let total = 0;
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStartDate.getTime());
      d.setDate(weekStartDate.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      const dateStr = yyyy + '-' + mm + '-' + dd;
      if (habit.logs[dateStr]) {
        total += habit.logs[dateStr].value || 0;
      }
    }
    return total;
  }

  // Calculate current streak
  getStreak(id) {
    const habit = this.#habits.find(h => h.id === id);
    if (!habit) return 0;

    const dates = Object.keys(habit.logs).filter(d => habit.logs[d].done).sort().reverse();
    if (dates.length === 0) return 0;

    let streak = 0;
    let current = new Date();
    current.setHours(0, 0, 0, 0);

    for (const log of dates) {
      const d = new Date(log);
      d.setHours(0, 0, 0, 0);
      const diffDays = Math.round((current - d) / (1000 * 60 * 60 * 24));

      if (diffDays === 0 || diffDays === 1) {
        streak++;
        current = d;
      } else if (diffDays > 1 && streak > 0) {
        break;
      }
    }
    return streak;
  }

  #save() {
    this.#repo.save(this.#STORE_KEY, this.#habits);
  }
}
