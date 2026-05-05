import { Component } from '../core/Component.js';

export class ReviewView extends Component {
  #service;
  
  constructor(reviewService) {
    super();
    this.#service = reviewService;
  }

  // Simple ISO week calculator
  getWeekString(date) {
    const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
    const dayNum = d.getUTCDay() || 7;
    d.setUTCDate(d.getUTCDate() + 4 - dayNum);
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(),0,1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1)/7);
    return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, '0')}`;
  }

  render() {
    const currentWeek = this.getWeekString(new Date());
    const reviews = this.#service.getAll();
    const currentReview = reviews.find(r => r.weekOf === currentWeek) || { keep: '', problem: '', tryNext: '' };

    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 1000px; margin: 0 auto; height: 100%;">
        <div class="glass-card" style="display: flex; flex-direction: column;">
          <h3 style="margin-bottom: 1.5rem; color: var(--success);">이번 주 KPT 회고 (${currentWeek})</h3>
          <form id="review-form" style="display: flex; flex-direction: column; gap: 1rem; flex: 1;">
            <div class="input-group" style="flex: 1; display: flex; flex-direction: column;">
              <label>K - Keep (잘해서 유지할 점)</label>
              <textarea id="kpt-keep" class="glass-input" style="flex: 1; resize: none;">${currentReview.keep}</textarea>
            </div>
            <div class="input-group" style="flex: 1; display: flex; flex-direction: column;">
              <label>P - Problem (문제점)</label>
              <textarea id="kpt-problem" class="glass-input" style="flex: 1; resize: none;">${currentReview.problem}</textarea>
            </div>
            <div class="input-group" style="flex: 1; display: flex; flex-direction: column;">
              <label>T - Try (다음 주에 시도할 점)</label>
              <textarea id="kpt-try" class="glass-input" style="flex: 1; resize: none;">${currentReview.tryNext}</textarea>
            </div>
            <button type="submit" class="btn-primary">회고 저장하기</button>
          </form>
        </div>
        
        <div class="glass-card" style="overflow-y: auto;">
          <h3 style="margin-bottom: 1.5rem;">과거 회고 기록</h3>
          <div style="display: flex; flex-direction: column; gap: 1rem;">
            ${reviews.filter(r => r.weekOf !== currentWeek).length === 0 ? '<p style="color: var(--text-secondary);">과거 기록이 없습니다.</p>' : ''}
            ${reviews.filter(r => r.weekOf !== currentWeek).map(r => `
              <div style="background: rgba(255,255,255,0.03); padding: 1rem; border-radius: 8px;">
                <h4 style="color: var(--accent-blue); margin-bottom: 0.8rem;">${r.weekOf}</h4>
                <div style="font-size: 0.9rem; display: flex; flex-direction: column; gap: 0.5rem;">
                  <div><strong style="color: var(--success);">K:</strong> ${r.keep}</div>
                  <div><strong style="color: var(--danger);">P:</strong> ${r.problem}</div>
                  <div><strong style="color: var(--warning);">T:</strong> ${r.tryNext}</div>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  }

  setupEvents() {
    const form = this.element.querySelector('#review-form');
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const keep = this.element.querySelector('#kpt-keep').value;
      const problem = this.element.querySelector('#kpt-problem').value;
      const tryNext = this.element.querySelector('#kpt-try').value;
      const weekOf = this.getWeekString(new Date());

      this.#service.saveReview({ weekOf, keep, problem, tryNext });
      
      // Visual feedback
      const btn = form.querySelector('button');
      const oldText = btn.textContent;
      btn.textContent = '저장되었습니다!';
      btn.style.background = 'var(--success)';
      setTimeout(() => {
        btn.textContent = oldText;
        btn.style.background = '';
      }, 2000);
    });
  }

  onMounted() {
    document.getElementById('topbar-title').textContent = 'Review';
  }
}
