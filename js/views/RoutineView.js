import { Component } from '../core/Component.js';

export class RoutineView extends Component {
  #service;
  #aiService;
  #habitService;
  #currentWeekStart;
  
  constructor(routineService, aiService, habitService) {
    super();
    this.#service = routineService;
    this.#aiService = aiService;
    this.#habitService = habitService;
  }

  render() {
    return `
      <div class="glass-card" style="max-width: 100%; margin: 0 auto; position: relative; padding: 2rem 1rem;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem; padding: 0 1rem; flex-wrap: wrap; gap: 1rem;">
          <h3 style="margin: 0; display: flex; align-items: center; gap: 1rem;">
            나의 주간 플래너
            <button id="btn-today" class="btn-tab" style="padding: 0.3rem 0.8rem; font-size: 0.8rem; border-radius: 12px; border: 1px solid var(--text-secondary); background: transparent; color: var(--text-primary); cursor: pointer; transition: 0.2s;">오늘</button>
          </h3>
          
          <div style="display: flex; align-items: center; gap: 1rem; background: rgba(0,0,0,0.2); padding: 0.5rem 1rem; border-radius: 20px;">
            <button id="btn-prev-week" style="background: none; border: none; color: var(--text-primary); cursor: pointer; font-size: 1.2rem; transition: 0.2s;">◀</button>
            <span id="week-label" style="font-weight: 600; min-width: 150px; text-align: center;"></span>
            <button id="btn-next-week" style="background: none; border: none; color: var(--text-primary); cursor: pointer; font-size: 1.2rem; transition: 0.2s;">▶</button>
          </div>

          <button id="btn-ai-generate" class="btn-primary" style="background: var(--accent-gradient); padding: 0.5rem 1rem; border-radius: 20px; font-weight: 600; display: flex; align-items: center; gap: 0.5rem; cursor: pointer; border: none; color: white;">
            <span>✨</span> 현재 주간 AI 생성
          </button>
        </div>
        
        <div id="routine-grid-container" style="display: flex; gap: 1rem; overflow-x: auto; padding-bottom: 1rem; scroll-behavior: smooth;">
          <!-- 7 columns here -->
        </div>

        <!-- Routine Modal -->
        <div id="routine-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
          <form id="routine-form" class="glass-card" style="width: 400px; display: flex; flex-direction: column; gap: 1rem;">
            <h3 id="modal-title">루틴 추가</h3>
            <input type="hidden" id="modal-id">
            <input type="hidden" id="modal-day">
            <div class="input-group">
              <label>루틴 이름</label>
              <input type="text" id="modal-label" class="glass-input" required>
            </div>
            <div style="display: flex; gap: 1rem;">
              <div class="input-group" style="flex: 1;">
                <label>시작 시간</label>
                <input type="time" id="modal-start" class="glass-input" required>
              </div>
              <div class="input-group" style="flex: 1;">
                <label>종료 시간</label>
                <input type="time" id="modal-end" class="glass-input" required>
              </div>
            </div>
            <div style="display: flex; gap: 1rem;">
              <div class="input-group" style="flex: 1;">
                <label>색상</label>
                <input type="color" id="modal-color" class="glass-input" value="#3b82f6" style="padding: 0; height: 40px;">
              </div>
              <div class="input-group" style="flex: 1;">
                <label>🔗 연결 습관</label>
                <select id="modal-habit" class="glass-input">
                  <option value="">없음</option>
                </select>
              </div>
            </div>
            <div style="display: flex; justify-content: space-between; margin-top: 1rem;">
              <button type="button" id="btn-delete-block" style="background: transparent; border: 1px solid var(--danger); color: var(--danger); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; display: none;">삭제</button>
              <div style="display: flex; gap: 0.5rem; margin-left: auto;">
                <button type="button" id="btn-modal-cancel" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-primary); padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer;">취소</button>
                <button type="submit" class="btn-primary" style="padding: 0.5rem 1rem;">저장</button>
              </div>
            </div>
          </form>
        </div>
      </div>
    `;
  }

  setupEvents() {
    const modal = this.element.querySelector('#routine-modal');
    const form = this.element.querySelector('#routine-form');
    
    // Nav events
    this.element.querySelector('#btn-prev-week').addEventListener('click', () => {
      this.#currentWeekStart.setDate(this.#currentWeekStart.getDate() - 7);
      this.#renderGrid();
    });
    this.element.querySelector('#btn-next-week').addEventListener('click', () => {
      this.#currentWeekStart.setDate(this.#currentWeekStart.getDate() + 7);
      this.#renderGrid();
    });
    this.element.querySelector('#btn-today').addEventListener('click', () => {
      this.#setWeekToToday();
    });

    const aiBtn = this.element.querySelector('#btn-ai-generate');
    if (aiBtn) {
      aiBtn.addEventListener('click', async () => {
        if (!confirm('현재 보고 있는 주간의 일정에 맞춰 루틴을 새로 생성합니다. 덮어씌우시겠습니까?')) return;
        
        const originalText = aiBtn.innerHTML;
        aiBtn.innerHTML = '<span>⏳</span> 생성 중...';
        aiBtn.disabled = true;
        
        try {
          const newRoutines = await this.#aiService.generateWeeklyRoutine(this.#currentWeekStart);
          this.#service.overwriteAllRoutines(newRoutines);
          this.#renderGrid();
          alert('해당 주간의 일정을 반영한 루틴이 성공적으로 생성되었습니다!');
        } catch (e) {
          alert('생성 실패: ' + e.message);
        } finally {
          aiBtn.innerHTML = originalText;
          aiBtn.disabled = false;
        }
      });
    }

    // Delegate clicks for Add buttons and Routine blocks
    this.element.querySelector('#routine-grid-container').addEventListener('click', (e) => {
      // Add Button Click
      const addBtn = e.target.closest('.btn-add-block');
      if (addBtn) {
        form.reset();
        this.element.querySelector('#modal-id').value = '';
        this.element.querySelector('#modal-day').value = addBtn.dataset.day; // YYYY-MM-DD
        this.element.querySelector('#modal-title').textContent = '루틴 추가';
        this.element.querySelector('#btn-delete-block').style.display = 'none';
        this.element.querySelector('#modal-color').value = '#3b82f6';
        
        const habitSelect = this.element.querySelector('#modal-habit');
        if (this.#habitService) {
          habitSelect.innerHTML = '<option value="">없음</option>' + this.#habitService.getAll().map(h => `<option value="${h.id}">${h.icon} ${h.name}</option>`).join('');
        }
        habitSelect.value = '';

        modal.style.display = 'flex';
        return;
      }

      // Block Click
      const item = e.target.closest('.routine-item');
      if (item) {
        const id = item.dataset.id;
        const dateStr = item.dataset.day;
        const block = this.#service.getAll(dateStr).find(b => b.id === id);
        if (block) {
          this.element.querySelector('#modal-id').value = block.id;
          this.element.querySelector('#modal-day').value = dateStr;
          this.element.querySelector('#modal-label').value = block.label;
          this.element.querySelector('#modal-start').value = block.startTime;
          this.element.querySelector('#modal-end').value = block.endTime;
          this.element.querySelector('#modal-color').value = block.color;

          const habitSelect = this.element.querySelector('#modal-habit');
          if (this.#habitService) {
            habitSelect.innerHTML = '<option value="">없음</option>' + this.#habitService.getAll().map(h => `<option value="${h.id}">${h.icon} ${h.name}</option>`).join('');
          }
          habitSelect.value = block.habitId || '';

          this.element.querySelector('#modal-title').textContent = '루틴 수정';
          this.element.querySelector('#btn-delete-block').style.display = 'block';
          modal.style.display = 'flex';
        }
      }
    });

    // AI Day Suggestion Event Handler
    this.element.querySelector('#routine-grid-container').addEventListener('click', async (e) => {
      const aiBtn = e.target.closest('.btn-ai-day');
      if (!aiBtn) return;
      e.stopPropagation();
      
      const dateStr = aiBtn.dataset.day;

      const originalText = aiBtn.innerHTML;
      aiBtn.innerHTML = '⏳ 생성 중...';
      aiBtn.disabled = true;

      try {
        const suggestionArray = await this.#aiService.generateDailyRoutine(dateStr);
        if (confirm(`✨ AI가 ${dateStr}의 하루 일정을 추천했습니다.\n적용하시겠습니까? (기존 일정은 덮어씌워집니다)`)) {
          this.#service.overwriteAllRoutines({
            [dateStr]: suggestionArray
          });
          this.#renderGrid();
        }
      } catch (err) {
        alert('AI 추천 실패: ' + err.message);
      } finally {
        aiBtn.innerHTML = originalText;
        aiBtn.disabled = false;
      }
    });

    this.element.querySelector('#btn-modal-cancel').addEventListener('click', () => {
      modal.style.display = 'none';
    });

    this.element.querySelector('#btn-delete-block').addEventListener('click', () => {
      const id = this.element.querySelector('#modal-id').value;
      const dateStr = this.element.querySelector('#modal-day').value;
      if (id && dateStr) {
        this.#service.removeBlock(dateStr, id);
        modal.style.display = 'none';
        this.#renderGrid();
      }
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const id = this.element.querySelector('#modal-id').value;
      const dateStr = this.element.querySelector('#modal-day').value;
      const data = {
        label: this.element.querySelector('#modal-label').value,
        startTime: this.element.querySelector('#modal-start').value,
        endTime: this.element.querySelector('#modal-end').value,
        color: this.element.querySelector('#modal-color').value,
        category: 'routine',
        habitId: this.element.querySelector('#modal-habit').value || null
      };
      
      if (data.startTime >= data.endTime) {
        alert('종료 시간은 시작 시간보다 늦어야 합니다.');
        return;
      }

      if (id) {
        this.#service.updateBlock(dateStr, id, data);
      } else {
        this.#service.addBlock(dateStr, data);
      }
      modal.style.display = 'none';
      this.#renderGrid();
    });
  }

  onMounted() {
    document.getElementById('topbar-title').textContent = 'Weekly Planner';
    this.#setWeekToToday();
  }

  #setWeekToToday() {
    const curr = new Date();
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    this.#currentWeekStart = new Date(curr.getTime());
    this.#currentWeekStart.setDate(diff);
    this.#currentWeekStart.setHours(0,0,0,0);
    this.#renderGrid();
    
    // Auto-scroll to today
    setTimeout(() => {
      const todayStr = this.#service.getCurrentDateString();
      const col = this.element.querySelector(`#col-${todayStr}`);
      const container = this.element.querySelector('#routine-grid-container');
      if (col && container) {
        const scrollPos = col.offsetLeft - container.offsetLeft - 20;
        container.scrollTo({ left: Math.max(0, scrollPos), behavior: 'smooth' });
      }
    }, 100);
  }

  #renderGrid() {
    const container = this.element.querySelector('#routine-grid-container');
    const todayStr = this.#service.getCurrentDateString();
    
    const weekDates = [];
    const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(this.#currentWeekStart.getTime());
      d.setDate(this.#currentWeekStart.getDate() + i);
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      weekDates.push({
        dateStr: `${yyyy}-${mm}-${dd}`,
        label: `${dayNames[i]} (${mm}/${dd})`
      });
    }

    // Update label
    this.element.querySelector('#week-label').textContent = `${weekDates[0].dateStr} ~ ${weekDates[6].dateStr.slice(5)}`;
    
    container.innerHTML = weekDates.map(dayInfo => {
      const isToday = dayInfo.dateStr === todayStr;
      const blocks = this.#service.getAll(dayInfo.dateStr); // Auto-generates defaults if empty
      
      const blocksHtml = blocks.map(b => {
        const startH = parseInt(b.startTime.split(':')[0]);
        const endH = parseInt(b.endTime.split(':')[0]);
        let duration = endH - startH;
        if (duration <= 0) duration = 1;
        
        let habitIcon = '';
        if (b.habitId && this.#habitService) {
          const habit = this.#habitService.getAll().find(h => h.id === b.habitId);
          if (habit) habitIcon = `<span style="margin-right: 4px;">${habit.icon}</span>`;
        }
        
        return `
          <div class="routine-item" data-id="${b.id}" data-day="${dayInfo.dateStr}" style="background: ${b.color}22; padding: 0.5rem; border-radius: 8px; border-left: 4px solid ${b.color}; display: flex; flex-direction: column; justify-content: center; min-height: ${Math.max(50, duration * 20)}px; cursor: pointer; transition: 0.2s; margin-bottom: 0.5rem;">
            <div style="font-weight: 600; font-size: 0.9rem;">${habitIcon}${b.label}</div>
            <div style="font-size: 0.8rem; opacity: 0.8;">${b.startTime} - ${b.endTime}</div>
          </div>
        `;
      }).join('');

      return `
        <div class="routine-column" id="col-${dayInfo.dateStr}" style="flex: 0 0 280px; display: flex; flex-direction: column; background: ${isToday ? 'rgba(255,255,255,0.05)' : 'transparent'}; border: ${isToday ? '1px solid var(--accent-purple)' : '1px solid var(--glass-border)'}; border-radius: 12px; padding: 1rem; box-shadow: ${isToday ? '0 0 15px rgba(139, 92, 246, 0.2)' : 'none'};">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h4 style="margin: 0; color: ${isToday ? 'var(--accent-purple)' : 'var(--text-primary)'};">${dayInfo.label} ${isToday ? '(오늘)' : ''}</h4>
            <button class="btn-ai-day" data-day="${dayInfo.dateStr}" style="background: none; border: none; cursor: pointer; font-size: 1rem; opacity: 0.7; transition: 0.2s;" title="일일 루틴 자동 생성">✨</button>
          </div>
          <div style="flex: 1; overflow-y: auto; padding-right: 0.2rem;">
            ${blocksHtml}
          </div>
          <button class="btn-add-block btn-primary" data-day="${dayInfo.dateStr}" style="width: 100%; padding: 0.5rem; margin-top: 1rem; font-size: 0.9rem; background: rgba(255,255,255,0.1); border: 1px dashed var(--glass-border);">+ 새 루틴</button>
        </div>
      `;
    }).join('');

    const items = container.querySelectorAll('.routine-item');
    items.forEach(item => {
      item.addEventListener('mouseenter', () => item.style.filter = 'brightness(1.2)');
      item.addEventListener('mouseleave', () => item.style.filter = 'none');
    });

    const aiDayBtns = container.querySelectorAll('.btn-ai-day');
    aiDayBtns.forEach(btn => {
      btn.addEventListener('mouseenter', () => btn.style.opacity = '1');
      btn.addEventListener('mouseleave', () => btn.style.opacity = '0.7');
    });
  }
}
