import { generateId } from '../utils/idGenerator.js';

export class Transaction {
  constructor({ id, type, amount, category, memo, date }) {
    this.id = id ?? generateId();
    this.type = type;           // 'income' | 'expense'
    this.amount = Number(amount);
    this.category = category;
    this.memo = memo ?? '';
    this.date = date ?? new Date().toISOString().slice(0, 10);
  }
}
