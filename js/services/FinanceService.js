import { Transaction } from '../models/Transaction.js';
import { DEFAULT_DEBTS } from '../config/debts.js';

export class FinanceService {
  #repo;
  #bus;
  #STORE_KEY = 'transactions';
  #DEBT_STORE_KEY = 'lifeos_debts';
  #transactions = [];
  #debts = [];

  constructor(repository, eventBus) {
    this.#repo = repository;
    this.#bus = eventBus;
    this.#transactions = this.#repo.load(this.#STORE_KEY).map(t => new Transaction(t));
    this.#debts = this.#loadDebts();
  }

  // ── 부채 설정 관리 ──

  #loadDebts() {
    const data = this.#repo.load(this.#DEBT_STORE_KEY);
    if (!data || data.length === 0) {
      // 시드 데이터로 초기화
      const seed = JSON.parse(JSON.stringify(DEFAULT_DEBTS));
      this.#repo.save(this.#DEBT_STORE_KEY, seed);
      return seed;
    }
    return data;
  }

  getDebts() {
    return [...this.#debts];
  }

  getTotalDebt() {
    return this.#debts.reduce((sum, d) => sum + d.amount, 0);
  }

  addDebt(creditor, amount) {
    this.#debts.push({ creditor: creditor.trim(), amount: Number(amount) });
    this.#saveDebts();
  }

  updateDebt(index, creditor, amount) {
    if (index < 0 || index >= this.#debts.length) throw new Error('Invalid debt index');
    this.#debts[index] = { creditor: creditor.trim(), amount: Number(amount) };
    this.#saveDebts();
  }

  removeDebt(index) {
    if (index < 0 || index >= this.#debts.length) throw new Error('Invalid debt index');
    this.#debts.splice(index, 1);
    this.#saveDebts();
  }

  #saveDebts() {
    this.#repo.save(this.#DEBT_STORE_KEY, this.#debts);
    this.#bus.emit('debts:updated', this.getDebts());
  }

  // ── 거래 관리 ──

  add(data) {
    const tx = new Transaction(data);
    this.#transactions.push(tx);
    this.#save();
    return tx;
  }

  remove(id) {
    this.#transactions = this.#transactions.filter(t => t.id !== id);
    this.#save();
  }

  getAll() {
    return [...this.#transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
  }

  #save() {
    this.#repo.save(this.#STORE_KEY, this.#transactions);
    this.#bus.emit('finance:updated', this.getAll());
  }
  
  getBalance() {
    return this.#transactions.reduce((acc, t) => {
      return t.type === 'income' ? acc + t.amount : acc - t.amount;
    }, 0);
  }
  
  getDebtProgress() {
    const totalDebt = this.getTotalDebt();
    const debtPaid = this.#transactions
      .filter(t => t.type === 'expense' && t.category === '부채상환')
      .reduce((acc, t) => acc + t.amount, 0);
    return { paid: debtPaid, total: totalDebt, percent: totalDebt > 0 ? Math.min(100, Math.round((debtPaid / totalDebt) * 100)) : 0 };
  }
}
