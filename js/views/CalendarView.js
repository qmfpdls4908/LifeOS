import { Component } from '../core/Component.js';

export class CalendarView extends Component {
  #service;
  #bus;
  #currentYear;
  #currentMonth; // 0-11
  
  constructor(calendarService, eventBus) {
    super();
    this.#service = calendarService;
    this.#bus = eventBus;
    
    const now = new Date();
    this.#currentYear = now.getFullYear();
    this.#currentMonth = now.getMonth();
    
    this.handleUpdate = () => this.refresh();
  }

  render() {
    return `
      <div style="max-width: 1000px; margin: 0 auto; display: flex; flex-direction: column; height: 100%;">
        <div class="glass-card" style="display: flex; flex-direction: column; flex: 1;">
          
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;">
            <button id="btn-prev-month" class="btn-primary" style="padding: 0.5rem 1rem;">&lt; 이전 달</button>
            <h2 id="calendar-title" style="color: var(--accent-blue); font-size: 1.8rem; font-weight: 700;">2026년 5월</h2>
            <button id="btn-next-month" class="btn-primary" style="padding: 0.5rem 1rem;">다음 달 &gt;</button>
          </div>
          
          <div style="display: grid; grid-template-columns: repeat(7, 1fr); gap: 0.5rem; text-align: center; font-weight: bold; color: var(--text-secondary); margin-bottom: 0.5rem;">
            <div style="color: var(--danger);">일</div>
            <div>월</div>
            <div>화</div>
            <div>수</div>
            <div>목</div>
            <div>금</div>
            <div style="color: var(--accent-blue);">토</div>
          </div>
          
          <div id="calendar-grid" style="display: grid; grid-template-columns: repeat(7, 1fr); auto-rows: minmax(100px, auto); gap: 0.5rem; flex: 1;">
            <!-- Calendar Cells -->
          </div>
        </div>
        
        <!-- Day Detail Modal -->
        <div id="day-detail-modal" style="display: none; position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 1000; justify-content: center; align-items: center;">
          <div class="glass-card" style="width: 450px; display: flex; flex-direction: column; gap: 1rem; max-height: 80vh;">
            <div style="display: flex; justify-content: space-between; align-items: center;">
              <h3 id="detail-date-title" style="margin: 0; color: var(--text-primary);">일정 상세</h3>
              <button id="btn-detail-close" style="background: transparent; border: none; color: var(--text-secondary); cursor: pointer; font-size: 1.5rem; padding: 0.2rem; line-height: 1;">×</button>
            </div>
            <div id="detail-events-list" style="display: flex; flex-direction: column; gap: 0.5rem; overflow-y: auto; flex: 1; padding-right: 0.5rem;">
              <!-- Events injected here -->
            </div>
            <hr style="border: none; border-top: 1px solid var(--glass-border); margin: 0.5rem 0;" />
            <div id="detail-add-section" style="display: flex; flex-direction: column; gap: 0.8rem;">
              <button id="btn-detail-add-toggle" style="padding: 0.5rem; font-size: 0.9rem; background: rgba(255,255,255,0.05); border: 1px dashed var(--glass-border); color: var(--text-primary); width: 100%; border-radius: 8px; cursor: pointer;">+ 새 일정 추가</button>
              <div id="detail-add-form" style="display: none; flex-direction: column; gap: 0.8rem; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 8px;">
                <input type="hidden" id="detail-date-input">
                <div class="input-group" style="margin: 0;">
                  <label>종료 날짜 (선택)</label>
                  <input type="date" id="detail-end-date-input" class="glass-input">
                </div>
                <div class="input-group" style="margin: 0;">
                  <label>일정 제목</label>
                  <input type="text" id="detail-title-input" class="glass-input" placeholder="약속, 여행 등">
                </div>
                <div style="display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem;">
                  <button id="btn-detail-save" class="btn-primary" style="padding: 0.5rem 1rem;">추가하기</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  setupEvents() {
    this.element.querySelector('#btn-prev-month').addEventListener('click', () => {
      this.#currentMonth--;
      if (this.#currentMonth < 0) {
        this.#currentMonth = 11;
        this.#currentYear--;
      }
      this.refresh();
    });

    this.element.querySelector('#btn-next-month').addEventListener('click', () => {
      this.#currentMonth++;
      if (this.#currentMonth > 11) {
        this.#currentMonth = 0;
        this.#currentYear++;
      }
      this.refresh();
    });

    // Calendar grid delegated events
    this.element.querySelector('#calendar-grid').addEventListener('click', (e) => {
      const cell = e.target.closest('.calendar-cell');
      if (cell) {
        const dateStr = cell.dataset.date;
        if (dateStr) this.openDayDetail(dateStr);
      }
    });

    // Modal Events
    const detailModal = this.element.querySelector('#day-detail-modal');
    this.element.querySelector('#btn-detail-close').addEventListener('click', () => {
      detailModal.style.display = 'none';
      this.element.querySelector('#detail-add-form').style.display = 'none';
      this.element.querySelector('#btn-detail-add-toggle').style.display = 'block';
    });

    // Delegated delete inside modal
    this.element.querySelector('#detail-events-list').addEventListener('click', (e) => {
      if (e.target.classList.contains('btn-detail-delete-event')) {
        const eventId = e.target.dataset.id;
        const dateStr = this.element.querySelector('#detail-date-input').value;
        this.#service.removePersonalEvent(eventId);
        this.openDayDetail(dateStr); // Refresh modal content
      }
    });

    this.element.querySelector('#btn-detail-add-toggle').addEventListener('click', (e) => {
      e.target.style.display = 'none';
      this.element.querySelector('#detail-add-form').style.display = 'flex';
      this.element.querySelector('#detail-title-input').focus();
    });

    this.element.querySelector('#btn-detail-save').addEventListener('click', () => {
      const date = this.element.querySelector('#detail-date-input').value;
      const endDate = this.element.querySelector('#detail-end-date-input').value || date;
      const title = this.element.querySelector('#detail-title-input').value.trim();
      if (title) {
        if (endDate < date) {
          alert('종료 날짜는 시작 날짜보다 앞설 수 없습니다.');
          return;
        }
        this.#service.addPersonalEvent(date, endDate, title);
        this.element.querySelector('#detail-title-input').value = '';
        this.element.querySelector('#detail-end-date-input').value = date;
        this.openDayDetail(date); // Refresh modal content
      }
    });
  }

  openDayDetail(dateStr) {
    this.element.querySelector('#detail-date-title').textContent = `${dateStr} 일정`;
    this.element.querySelector('#detail-date-input').value = dateStr;
    this.element.querySelector('#detail-end-date-input').min = dateStr;
    this.element.querySelector('#detail-end-date-input').value = dateStr;
    
    // Reset form state
    this.element.querySelector('#detail-title-input').value = '';
    this.element.querySelector('#detail-add-form').style.display = 'none';
    this.element.querySelector('#btn-detail-add-toggle').style.display = 'block';

    const allEvents = this.#service.getAllEvents();
    const dayEvents = allEvents.filter(e => dateStr >= e.date && dateStr <= e.endDate);
    
    let listHtml = '';
    if (dayEvents.length === 0) {
      listHtml = '<div style="color: var(--text-secondary); text-align: center; padding: 2rem 0;">등록된 일정이 없습니다.</div>';
    } else {
      listHtml = dayEvents.map(e => `
        <div style="background: ${e.color}33; border-left: 4px solid ${e.color}; padding: 0.8rem; border-radius: 4px; display: flex; justify-content: space-between; align-items: center; gap: 0.5rem;">
          <span style="flex: 1; word-break: break-all; white-space: normal; line-height: 1.4;">${e.title}</span>
          ${e.type === 'personal' ? `<button class="btn-detail-delete-event" data-id="${e.id}" style="background:rgba(239, 68, 68, 0.2); border:1px solid var(--danger); color:var(--danger); cursor:pointer; font-size: 0.8rem; padding: 0.3rem 0.6rem; border-radius: 4px; flex-shrink: 0;">삭제</button>` : `<span style="font-size: 0.75rem; color: var(--text-secondary); flex-shrink: 0; padding: 0.3rem;">공휴일</span>`}
        </div>
      `).join('');
    }
    
    this.element.querySelector('#detail-events-list').innerHTML = listHtml;
    this.element.querySelector('#day-detail-modal').style.display = 'flex';
  }

  onMounted() {
    this.#bus.on('calendar:updated', this.handleUpdate);
    document.getElementById('topbar-title').textContent = 'Calendar';
    this.refresh();
  }
  
  destroy() {
    this.#bus.off('calendar:updated', this.handleUpdate);
    super.destroy();
  }

  refresh() {
    this.element.querySelector('#calendar-title').textContent = `${this.#currentYear}년 ${this.#currentMonth + 1}월`;
    
    const firstDay = new Date(this.#currentYear, this.#currentMonth, 1).getDay();
    const daysInMonth = new Date(this.#currentYear, this.#currentMonth + 1, 0).getDate();
    
    const allEvents = this.#service.getAllEvents();
    
    let html = '';
    // Empty cells before 1st day
    for (let i = 0; i < firstDay; i++) {
      html += `<div style="background: rgba(255,255,255,0.01); border-radius: 8px;"></div>`;
    }
    
    // Days
    const todayStr = new Date().toISOString().slice(0, 10);
    
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = `${this.#currentYear}-${String(this.#currentMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const dayEvents = allEvents.filter(e => dateStr >= e.date && dateStr <= e.endDate);
      
      const isToday = dateStr === todayStr;
      const isSunday = new Date(this.#currentYear, this.#currentMonth, d).getDay() === 0;
      const hasHoliday = dayEvents.some(e => e.type === 'holiday');
      
      let dayColor = 'var(--text-primary)';
      if (isSunday || hasHoliday) dayColor = 'var(--danger)';
      
      let eventsHtml = dayEvents.map(e => `
        <div style="background: ${e.color}33; border-left: 2px solid ${e.color}; font-size: 0.75rem; padding: 2px 4px; border-radius: 2px; text-align: left; display: flex; justify-content: space-between; align-items: center; gap: 4px;">
          <span style="flex: 1; overflow: hidden; white-space: nowrap; text-overflow: ellipsis;" title="${e.title}">${e.title}</span>
        </div>
      `).join('');

      html += `
        <div class="calendar-cell glass-card" data-date="${dateStr}" style="min-width: 0; padding: 0.5rem; cursor: pointer; display: flex; flex-direction: column; gap: 0.3rem; min-height: 100px; border: ${isToday ? '2px solid var(--accent-purple)' : '1px solid var(--glass-border)'}; background: ${isToday ? 'rgba(139, 92, 246, 0.1)' : 'var(--glass-bg)'};">
          <div style="text-align: right; font-weight: 600; color: ${dayColor}; font-size: 0.9rem;">${d}</div>
          <div style="flex: 1; display: flex; flex-direction: column; gap: 0.2rem; overflow-y: auto;">
            ${eventsHtml}
          </div>
        </div>
      `;
    }
    
    this.element.querySelector('#calendar-grid').innerHTML = html;
  }
}
