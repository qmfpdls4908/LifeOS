import { Component } from '../core/Component.js';

export class HabitView extends Component {
  #service;
  
  constructor(habitService) {
    super();
    this.#service = habitService;
  }

  render() {
    return `
      <div style="max-width: 900px; margin: 0 auto; display: flex; flex-direction: column; gap: 2rem;">
        <h3 style="color: var(--accent-purple); text-align: center;">습관 플래너</h3>
        <div id="habit-list" style="display: grid; gap: 1.5rem; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));"></div>

        <!-- Activity Log Modal -->
        <div id="log-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
          <form id="log-form" class="glass-card" style="width: 400px; display: flex; flex-direction: column; gap: 1rem;">
            <h3 id="log-modal-title">활동 기록하기</h3>
            <input type="hidden" id="log-habit-id">
            <div class="input-group">
              <label>투자 시간 (분)</label>
              <input type="number" id="log-value" class="glass-input" min="0" value="30" required>
            </div>
            <div class="input-group">
              <label>메모 (선택)</label>
              <input type="text" id="log-memo" class="glass-input" placeholder="오늘 무엇을 했나요?">
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
              <button type="button" id="btn-log-cancel" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-primary); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">취소</button>
              <button type="submit" class="btn-primary" style="padding: 0.5rem 1rem;">기록 저장</button>
            </div>
          </form>
        </div>

        <!-- Monthly Goal Modal -->
        <div id="goal-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
          <form id="goal-form" class="glass-card" style="width: 400px; display: flex; flex-direction: column; gap: 1rem;">
            <h3 id="goal-modal-title">월간 목표 설정</h3>
            <input type="hidden" id="goal-habit-id">
            <div class="input-group">
              <label>이번 달 목표 (분)</label>
              <input type="number" id="goal-target" class="glass-input" min="0" value="600" required>
            </div>
            <div class="input-group">
              <label>목표 설명</label>
              <input type="text" id="goal-label" class="glass-input" placeholder="예: 클린코드 완독">
            </div>
            <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 0.5rem;">
              <button type="button" id="btn-goal-cancel" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-primary); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">취소</button>
              <button type="submit" class="btn-primary" style="padding: 0.5rem 1rem;">목표 저장</button>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  setupEvents() {
    const logModal = this.element.querySelector('#log-modal');
    const logForm = this.element.querySelector('#log-form');
    const goalModal = this.element.querySelector('#goal-modal');
    const goalForm = this.element.querySelector('#goal-form');

    // Log modal cancel
    this.element.querySelector('#btn-log-cancel').addEventListener('click', () => {
      logModal.style.display = 'none';
    });

    // Goal modal cancel
    this.element.querySelector('#btn-goal-cancel').addEventListener('click', () => {
      goalModal.style.display = 'none';
    });

    // Log form submit
    logForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = this.element.querySelector('#log-habit-id').value;
      const value = parseInt(this.element.querySelector('#log-value').value) || 0;
      const memo = this.element.querySelector('#log-memo').value;
      const today = new Date().toISOString().slice(0, 10);
      this.#service.logActivity(id, today, { value, memo });
      logModal.style.display = 'none';
      this.refresh();
    });

    // Goal form submit
    goalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = this.element.querySelector('#goal-habit-id').value;
      const target = parseInt(this.element.querySelector('#goal-target').value) || 0;
      const label = this.element.querySelector('#goal-label').value;
      const monthStr = new Date().toISOString().slice(0, 7);
      this.#service.setMonthlyGoal(id, monthStr, target, label);
      goalModal.style.display = 'none';
      this.refresh();
    });
  }

  onMounted() {
    document.getElementById('topbar-title').textContent = 'Habit Planner';
    this.refresh();
  }

  #formatMinutes(mins) {
    if (mins < 60) return mins + '분';
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? h + '시간 ' + m + '분' : h + '시간';
  }

  #getWeekStart() {
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.getTime());
    monday.setDate(diff);
    monday.setHours(0, 0, 0, 0);
    return monday;
  }

  refresh() {
    const habits = this.#service.getAll();
    const listEl = this.element.querySelector('#habit-list');
    const today = new Date().toISOString().slice(0, 10);
    const monthStr = today.slice(0, 7);
    const weekStart = this.#getWeekStart();
    const logModal = this.element.querySelector('#log-modal');
    const goalModal = this.element.querySelector('#goal-modal');

    listEl.innerHTML = habits.map(h => {
      const isDoneToday = this.#service.isDone(h.id, today);
      const todayLog = this.#service.getLog(h.id, today);
      const streak = this.#service.getStreak(h.id);
      const monthProgress = this.#service.getMonthlyProgress(h.id, monthStr);
      const weeklyTotal = this.#service.getWeeklyTotal(h.id, weekStart);
      const goal = this.#service.getMonthlyGoal(h.id, monthStr);
      const weeklyTarget = monthProgress.target > 0 ? Math.round(monthProgress.target / 4) : 0;
      const weeklyPercent = weeklyTarget > 0 ? Math.min(100, Math.round((weeklyTotal / weeklyTarget) * 100)) : 0;

      const goalLabel = goal ? goal.label : '목표 미설정';
      const todayValue = todayLog ? todayLog.value : 0;
      const todayMemo = todayLog ? todayLog.memo : '';

      return '<div class="glass-card" style="display: flex; flex-direction: column; gap: 1rem; padding: 1.5rem;">' +
        // Header
        '<div style="display: flex; align-items: center; gap: 1rem;">' +
          '<div style="font-size: 2.5rem;">' + h.icon + '</div>' +
          '<div style="flex: 1;">' +
            '<h4 style="margin: 0; font-size: 1.2rem;">' + h.name + '</h4>' +
            '<div style="color: var(--text-secondary); font-size: 0.85rem;">' +
              (streak > 0 ? '🔥 ' + streak + '일째 연속 달성!' : '아직 스트릭 없음') +
            '</div>' +
          '</div>' +
        '</div>' +

        // Monthly Goal Section
        '<div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 0.8rem;">' +
          '<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">' +
            '<span style="font-size: 0.85rem; color: var(--text-secondary);">📅 ' + monthStr + ' 월간 목표</span>' +
            '<button class="btn-set-goal" data-id="' + h.id + '" style="background: none; border: none; color: var(--accent-purple); cursor: pointer; font-size: 0.8rem;">⚙ 설정</button>' +
          '</div>' +
          '<div style="font-size: 0.9rem; margin-bottom: 0.5rem;">' + goalLabel + '</div>' +
          (monthProgress.target > 0
            ? '<div style="background: rgba(255,255,255,0.1); border-radius: 8px; height: 10px; overflow: hidden;">' +
                '<div style="height: 100%; width: ' + monthProgress.percent + '%; background: var(--accent-gradient); border-radius: 8px; transition: width 0.4s;"></div>' +
              '</div>' +
              '<div style="display: flex; justify-content: space-between; font-size: 0.8rem; color: var(--text-secondary); margin-top: 0.3rem;">' +
                '<span>' + this.#formatMinutes(monthProgress.total) + ' / ' + this.#formatMinutes(monthProgress.target) + '</span>' +
                '<span>' + monthProgress.percent + '%</span>' +
              '</div>'
            : '<div style="font-size: 0.8rem; color: var(--text-secondary);">월간 목표를 설정하면 진행률을 볼 수 있습니다.</div>'
          ) +
        '</div>' +

        // Weekly Section
        '<div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 0.8rem;">' +
          '<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.5rem;">📊 이번 주 소계</div>' +
          (weeklyTarget > 0
            ? '<div style="background: rgba(255,255,255,0.1); border-radius: 8px; height: 8px; overflow: hidden;">' +
                '<div style="height: 100%; width: ' + weeklyPercent + '%; background: var(--success); border-radius: 8px; transition: width 0.4s;"></div>' +
              '</div>' +
              '<div style="font-size: 0.85rem; margin-top: 0.3rem;">' + this.#formatMinutes(weeklyTotal) + ' / ' + this.#formatMinutes(weeklyTarget) + ' (' + weeklyPercent + '%)</div>'
            : '<div style="font-size: 0.85rem;">' + this.#formatMinutes(weeklyTotal) + ' 투자</div>'
          ) +
        '</div>' +

        // Today Section
        '<div style="background: rgba(255,255,255,0.03); border-radius: 10px; padding: 0.8rem;">' +
          '<div style="font-size: 0.85rem; color: var(--text-secondary); margin-bottom: 0.3rem;">🕐 오늘 (' + today + ')</div>' +
          (isDoneToday
            ? '<div style="font-size: 1rem; font-weight: 600; color: var(--success);">✅ ' + this.#formatMinutes(todayValue) + ' 투자 완료</div>' +
              (todayMemo ? '<div style="font-size: 0.85rem; color: var(--text-secondary); margin-top: 0.3rem;">📝 ' + todayMemo + '</div>' : '')
            : '<div style="font-size: 0.9rem; color: var(--text-secondary);">아직 기록 없음</div>'
          ) +
        '</div>' +

        // Action Buttons
        '<div style="display: flex; gap: 0.5rem;">' +
          '<button class="btn-log-activity btn-primary" data-id="' + h.id + '" style="flex: 1; padding: 0.6rem; font-size: 0.9rem;">' +
            (isDoneToday ? '📝 기록 수정' : '⏱ 활동 기록하기') +
          '</button>' +
          '<button class="btn-quick-toggle" data-id="' + h.id + '" style="padding: 0.6rem 1rem; border-radius: 8px; cursor: pointer; border: 1px solid ' + (isDoneToday ? 'var(--success)' : 'var(--glass-border)') + '; background: ' + (isDoneToday ? 'var(--success)' : 'transparent') + '; color: var(--text-primary);">' +
            (isDoneToday ? '✓' : '○') +
          '</button>' +
        '</div>' +
      '</div>';
    }).join('');

    // Event delegation for dynamic buttons
    listEl.querySelectorAll('.btn-log-activity').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const todayLog = this.#service.getLog(id, today);
        this.element.querySelector('#log-habit-id').value = id;
        this.element.querySelector('#log-value').value = todayLog ? todayLog.value : 30;
        this.element.querySelector('#log-memo').value = todayLog ? todayLog.memo : '';
        const habit = habits.find(h => h.id === id);
        this.element.querySelector('#log-modal-title').textContent = (habit ? habit.icon + ' ' + habit.name : '') + ' — 활동 기록';
        logModal.style.display = 'flex';
      });
    });

    listEl.querySelectorAll('.btn-quick-toggle').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#service.toggleLog(btn.dataset.id, today);
        this.refresh();
      });
    });

    listEl.querySelectorAll('.btn-set-goal').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const goal = this.#service.getMonthlyGoal(id, monthStr);
        this.element.querySelector('#goal-habit-id').value = id;
        this.element.querySelector('#goal-target').value = goal ? goal.target : 600;
        this.element.querySelector('#goal-label').value = goal ? goal.label : '';
        const habit = habits.find(h => h.id === id);
        this.element.querySelector('#goal-modal-title').textContent = (habit ? habit.icon + ' ' + habit.name : '') + ' — 월간 목표';
        goalModal.style.display = 'flex';
      });
    });
  }
}
