import { Component } from '../core/Component.js';

export class DashboardView extends Component {
  #financeService;
  #routineService;
  #habitService;
  
  constructor(financeService, routineService, habitService) {
    super();
    this.#financeService = financeService;
    this.#routineService = routineService;
    this.#habitService = habitService;
  }

  render() {
    const balance = this.#financeService.getBalance();
    const debtProgress = this.#financeService.getDebtProgress();
    const habits = this.#habitService.getAll();
    const today = new Date().toISOString().slice(0, 10);
    
    // Get current routine block
    const now = new Date();
    const timeStr = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const dateStr = this.#routineService.getCurrentDateString();
    const blocks = this.#routineService.getAll(dateStr);
    let currentBlock = blocks.find(b => b.startTime <= timeStr && b.endTime > timeStr) || blocks[0];

    return `
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; max-width: 1200px; margin: 0 auto;">
        
        <!-- Finance Summary Widget -->
        <div class="glass-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 1rem;">
          <h3 style="color: var(--text-secondary);">현재 잔액</h3>
          <div style="font-size: 2.5rem; font-weight: 700; background: var(--accent-gradient); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">
            ${balance.toLocaleString()}원
          </div>
          <div style="width: 100%; margin-top: 1rem;">
            <div style="display:flex; justify-content:space-between; font-size:0.9rem; margin-bottom:0.5rem;">
              <span>부채 상환 진행률</span>
              <span>${debtProgress.percent}%</span>
            </div>
            <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
              <div style="background: var(--success); width: ${debtProgress.percent}%; height: 100%;"></div>
            </div>
          </div>
        </div>

        <!-- Current Routine Widget -->
        <div class="glass-card" style="display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; gap: 1rem; border: 2px solid ${currentBlock?.color || 'var(--glass-border)'}55;">
          <h3 style="color: var(--text-secondary);">현재 진행 중인 루틴</h3>
          <div style="font-size: 2rem; font-weight: 700; color: var(--text-primary);">
            ${currentBlock?.label || '없음'}
          </div>
          <div style="font-size: 1.1rem; color: ${currentBlock?.color || 'var(--text-secondary)'};">
            ${currentBlock?.startTime || ''} ~ ${currentBlock?.endTime || ''}
          </div>
        </div>

        <!-- Habits Summary Widget -->
        <div class="glass-card" style="grid-column: 1 / -1;">
          <h3 style="margin-bottom: 1.5rem;">오늘의 취미 계획 vs 실적</h3>
          <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1rem;">
            ${habits.map(h => {
              const todayBlocks = blocks.filter(b => b.habitId === h.id);
              let plannedMins = 0;
              todayBlocks.forEach(b => {
                const [sh, sm] = b.startTime.split(':').map(Number);
                const [eh, em] = b.endTime.split(':').map(Number);
                plannedMins += (eh * 60 + em) - (sh * 60 + sm);
              });
              
              const todayVal = h.logs[today] ? h.logs[today].value : 0;
              const percent = plannedMins > 0 ? Math.min(100, Math.round((todayVal / plannedMins) * 100)) : (todayVal > 0 ? 100 : 0);
              const formatMins = (m) => m >= 60 ? Math.floor(m/60) + '시간 ' + (m%60 > 0 ? m%60 + '분' : '') : m + '분';
              
              return `
                <div style="background: rgba(255,255,255,0.03); padding: 1.2rem; border-radius: 12px; display: flex; flex-direction: column; gap: 0.8rem; border-left: 4px solid ${percent >= 100 ? 'var(--success)' : (plannedMins > 0 ? 'var(--accent-purple)' : 'var(--text-secondary)')};">
                  <div style="display: flex; align-items: center; gap: 0.8rem;">
                    <span style="font-size: 1.8rem; opacity: ${(percent > 0 || plannedMins > 0) ? 1 : 0.5};">${h.icon}</span>
                    <span style="font-weight: 600; font-size: 1.1rem; color: ${(percent > 0 || plannedMins > 0) ? 'var(--text-primary)' : 'var(--text-secondary)'};">${h.name}</span>
                  </div>
                  <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: var(--text-secondary);">
                    <span>계획: <strong style="color: var(--text-primary);">${plannedMins > 0 ? formatMins(plannedMins) : '미배정'}</strong></span>
                    <span>실적: <strong style="color: ${percent >= 100 ? 'var(--success)' : 'var(--text-primary)'};">${todayVal > 0 ? formatMins(todayVal) : '0분'}</strong></span>
                  </div>
                  ${plannedMins > 0 ? `
                  <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden; margin-top: 0.3rem;">
                    <div style="background: ${percent >= 100 ? 'var(--success)' : 'var(--accent-gradient)'}; width: ${percent}%; height: 100%; transition: width 0.4s ease;"></div>
                  </div>
                  ` : ''}
                </div>
              `;
            }).join('')}
          </div>
        </div>
      </div>
    `;
  }

  onMounted() {
    document.getElementById('topbar-title').textContent = 'Dashboard';
  }
}
