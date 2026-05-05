import { Component } from '../core/Component.js';
import { CATEGORIES } from '../config/categories.js';

export class FinanceView extends Component {
  #service;
  #bus;
  
  constructor(financeService, eventBus) {
    super();
    this.#service = financeService;
    this.#bus = eventBus;
    this.handleUpdate = () => this.refreshList();
  }

  render() {
    return `
      <div class="finance-container" style="display: grid; grid-template-columns: 1fr 2fr; gap: 2rem; height: 100%;">
        <div class="glass-card">
          <h3 style="margin-bottom: 1.5rem;">새 거래 내역 추가</h3>
          <form id="finance-form">
            <div class="input-group">
              <label>유형</label>
              <select id="tx-type" class="glass-input" required>
                <option value="expense">지출</option>
                <option value="income">수입</option>
              </select>
            </div>
            <div class="input-group">
              <label>카테고리</label>
              <select id="tx-category" class="glass-input" required>
                ${CATEGORIES.expense.map(c => `<option value="${c}">${c}</option>`).join('')}
              </select>
            </div>
            <div class="input-group">
              <label>금액 (원)</label>
              <input type="number" id="tx-amount" class="glass-input" required min="0">
            </div>
            <div class="input-group">
              <label>내용</label>
              <input type="text" id="tx-memo" class="glass-input" placeholder="어디에 쓰셨나요?">
            </div>
            <div class="input-group">
              <label>날짜</label>
              <input type="date" id="tx-date" class="glass-input" required value="${new Date().toISOString().slice(0, 10)}">
            </div>
            <button type="submit" class="btn-primary" style="width: 100%; margin-top: 1rem;">추가하기</button>
          </form>
          
          <div style="margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--glass-border);">
            <h4>부채 상환 관리</h4>
            <div id="debt-list" style="font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.5rem; margin-bottom: 0.5rem; display: flex; flex-direction: column; gap: 0.2rem;">
            </div>
            <div style="display: flex; gap: 0.5rem; margin-bottom: 0.5rem;">
              <input type="text" id="debt-creditor" class="glass-input" placeholder="채권자 (예: 학자금, 은행)" style="flex: 2; padding: 0.4rem 0.6rem; font-size: 0.85rem;">
              <input type="number" id="debt-amount" class="glass-input" placeholder="금액" min="0" style="flex: 1; padding: 0.4rem 0.6rem; font-size: 0.85rem;">
              <button id="btn-add-debt" class="btn-primary" style="padding: 0.4rem 0.8rem; font-size: 0.85rem; white-space: nowrap;">추가</button>
            </div>
            <div style="margin-top: 1rem;">
               <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:0.5rem;">
                 <span>진행률</span>
                 <span id="debt-percent">0%</span>
               </div>
               <div style="background: rgba(255,255,255,0.1); height: 12px; border-radius: 6px; overflow: hidden;">
                 <div id="debt-bar" style="background: var(--accent-gradient); width: 0%; height: 100%; transition: width 0.5s ease;"></div>
               </div>
            </div>
          </div>
        </div>
        
        <div class="glass-card" style="display: flex; flex-direction: column;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <h3>최근 거래 내역</h3>
            <h3 id="total-balance" style="color: var(--accent-purple);">잔액: 0원</h3>
          </div>
          <div id="tx-list" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 0.8rem;">
            <!-- 거래 내역 아이템 -->
          </div>
        </div>
      </div>
    `;
  }

  setupEvents() {
    const form = this.element.querySelector('#finance-form');
    const typeSelect = this.element.querySelector('#tx-type');
    const categorySelect = this.element.querySelector('#tx-category');

    typeSelect.addEventListener('change', (e) => {
      const type = e.target.value;
      categorySelect.innerHTML = CATEGORIES[type].map(c => `<option value="${c}">${c}</option>`).join('');
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const type = typeSelect.value;
      const category = categorySelect.value;
      const amount = this.element.querySelector('#tx-amount').value;
      const memo = this.element.querySelector('#tx-memo').value;
      const date = this.element.querySelector('#tx-date').value;

      this.#service.add({ type, category, amount, memo, date });
      form.reset();
      this.element.querySelector('#tx-date').value = new Date().toISOString().slice(0, 10);
    });

    this.element.addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-delete')) {
        const id = e.target.dataset.id;
        this.#service.remove(id);
      }
      if (e.target.classList.contains('btn-delete-debt')) {
        const index = parseInt(e.target.dataset.index);
        this.#service.removeDebt(index);
        this.refreshDebtList();
      }
    });

    this.element.querySelector('#btn-add-debt').addEventListener('click', () => {
      const creditor = this.element.querySelector('#debt-creditor').value.trim();
      const amount = this.element.querySelector('#debt-amount').value;
      if (!creditor || !amount) {
        alert('채권자 이름과 금액을 모두 입력해주세요.');
        return;
      }
      this.#service.addDebt(creditor, amount);
      this.element.querySelector('#debt-creditor').value = '';
      this.element.querySelector('#debt-amount').value = '';
      this.refreshDebtList();
    });
  }

  onMounted() {
    this.#bus.on('finance:updated', this.handleUpdate);
    this.#bus.on('debts:updated', () => this.refreshDebtList());
    document.getElementById('topbar-title').textContent = 'Finance';
    this.refreshList();
    this.refreshDebtList();
  }
  
  destroy() {
    this.#bus.off('finance:updated', this.handleUpdate);
    this.#bus.off('debts:updated', () => this.refreshDebtList());
    super.destroy();
  }

  refreshDebtList() {
    const debts = this.#service.getDebts();
    const totalDebt = this.#service.getTotalDebt();
    const listEl = this.element.querySelector('#debt-list');

    if (debts.length === 0) {
      listEl.innerHTML = '<div style="color: var(--text-secondary); padding: 0.5rem 0;">등록된 부채가 없습니다.</div>';
    } else {
      listEl.innerHTML = debts.map((d, i) =>
        '<div style="display: flex; justify-content: space-between; align-items: center;">' +
          '<span>' + d.creditor + '</span>' +
          '<span>' + d.amount.toLocaleString() + '원 ' +
            '<button class="btn-delete-debt" data-index="' + i + '" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); border-radius: 3px; padding: 0 0.3rem; cursor: pointer; font-size: 0.7rem; margin-left: 0.3rem;">✕</button>' +
          '</span>' +
        '</div>'
      ).join('') +
      '<div style="display: flex; justify-content: space-between; margin-top: 0.3rem; color: var(--accent-blue); font-weight: bold; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 0.3rem;">' +
        '<span>총 상환 목표</span><span>' + totalDebt.toLocaleString() + '원</span>' +
      '</div>';
    }

    const debtProgress = this.#service.getDebtProgress();
    this.element.querySelector('#debt-percent').textContent = debtProgress.percent + '%';
    this.element.querySelector('#debt-bar').style.width = debtProgress.percent + '%';
  }

  refreshList() {
    const txs = this.#service.getAll();
    const listEl = this.element.querySelector('#tx-list');
    
    if (txs.length === 0) {
      listEl.innerHTML = '<p style="color: var(--text-secondary); text-align: center; padding: 2rem;">거래 내역이 없습니다.</p>';
    } else {
      listEl.innerHTML = txs.map(t => `
        <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center;">
          <div>
            <div style="font-size: 0.8rem; color: var(--text-secondary); margin-bottom: 0.2rem;">${t.date} · ${t.category}</div>
            <div style="font-weight: 500;">${t.memo || '내용 없음'}</div>
          </div>
          <div style="display: flex; align-items: center; gap: 1rem;">
            <div style="font-weight: 600; color: ${t.type === 'income' ? 'var(--success)' : 'var(--danger)'};">
              ${t.type === 'income' ? '+' : '-'}${t.amount.toLocaleString()}원
            </div>
            <button class="btn-delete" data-id="${t.id}" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); border-radius: 4px; padding: 0.2rem 0.5rem; cursor: pointer;">삭제</button>
          </div>
        </div>
      `).join('');
    }

    const balance = this.#service.getBalance();
    this.element.querySelector('#total-balance').textContent = `잔액: ${balance.toLocaleString()}원`;
  }
}
