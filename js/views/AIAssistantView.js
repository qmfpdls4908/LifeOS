import { Component } from '../core/Component.js';

export class AIAssistantView extends Component {
  #service;
  #chatHistory = [];

  constructor(aiService) {
    super();
    this.#service = aiService;
  }

  render() {
    const hasKey = this.#service.hasApiKey();
    return `
      <div style="max-width: 800px; margin: 0 auto; display: flex; flex-direction: column; height: 100%;">
        ${!hasKey ? this.#renderKeySetup() : this.#renderChat()}
      </div>
    `;
  }

  #renderKeySetup() {
    return `
      <div class="glass-card" style="display: flex; flex-direction: column; align-items: center; gap: 1.5rem; text-align: center; padding: 3rem;">
        <div style="font-size: 3rem;">🤖</div>
        <h3 style="color: var(--accent-purple);">AI 어시스턴트 설정</h3>
        <p style="color: var(--text-secondary);">OpenCode Go API Key를 입력하시면 LifeOS에 기록된 데이터를 분석하여 맞춤형 조언을 드립니다.</p>
        <div class="input-group" style="width: 100%; max-width: 500px;">
          <label>OpenCode Go API Key</label>
          <input type="password" id="api-key-input" class="glass-input" placeholder="OpenCode Go API Key">
        </div>
        <button id="btn-save-key" class="btn-primary" style="padding: 0.75rem 2rem;">설정 완료</button>
        <p style="font-size: 0.8rem; color: var(--text-secondary);">⚠️ API Key는 이 브라우저의 localStorage에만 저장됩니다.</p>
      </div>
    `;
  }

  #renderChat() {
    return `
      <div class="glass-card" style="flex: 1; display: flex; flex-direction: column; overflow: hidden;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
          <h3 style="color: var(--accent-purple);">🤖 AI 어시스턴트</h3>
          <button id="btn-reset-key" style="background: transparent; border: 1px solid var(--text-secondary); color: var(--text-secondary); padding: 0.3rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.8rem;">API Key 변경</button>
        </div>
        <div id="chat-messages" style="flex: 1; overflow-y: auto; display: flex; flex-direction: column; gap: 1rem; padding: 1rem 0;"></div>
        <div id="quick-prompts" style="display: flex; gap: 0.5rem; flex-wrap: wrap; margin-bottom: 1rem;"></div>
        <form id="chat-form" style="display: flex; gap: 0.5rem;">
          <input type="text" id="chat-input" class="glass-input" placeholder="궁금한 점을 물어보세요..." style="flex: 1;">
          <button type="submit" class="btn-primary" id="btn-send" style="padding: 0.75rem 1.5rem; white-space: nowrap;">전송</button>
        </form>
      </div>
    `;
  }

  setupEvents() {
    // Key setup
    const saveBtn = this.element.querySelector('#btn-save-key');
    if (saveBtn) {
      saveBtn.addEventListener('click', () => {
        const key = this.element.querySelector('#api-key-input').value.trim();
        if (key) {
          this.#service.saveApiKey(key);
          this.element.innerHTML = this.#renderChat();
          this.#setupChatEvents();
          this.#showQuickPrompts();
          this.#addMessage('assistant', '안녕하세요! 😊 LifeOS AI 어시스턴트입니다.\n\n아래 추천 질문을 눌러보시거나, 자유롭게 질문해 주세요!');
        }
      });
      return;
    }
    // Chat events
    this.#setupChatEvents();
  }

  #setupChatEvents() {
    const form = this.element.querySelector('#chat-form');
    const resetBtn = this.element.querySelector('#btn-reset-key');

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const input = this.element.querySelector('#chat-input');
        const msg = input.value.trim();
        if (msg) {
          input.value = '';
          this.#sendMessage(msg);
        }
      });
    }

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        localStorage.removeItem('opencode_go_api_key');
        this.element.innerHTML = this.#renderKeySetup();
        const saveBtn = this.element.querySelector('#btn-save-key');
        saveBtn.addEventListener('click', () => {
          const key = this.element.querySelector('#api-key-input').value.trim();
          if (key) {
            this.#service.saveApiKey(key);
            this.element.innerHTML = this.#renderChat();
            this.#setupChatEvents();
            this.#showQuickPrompts();
          }
        });
      });
    }
  }

  #showQuickPrompts() {
    const container = this.element.querySelector('#quick-prompts');
    if (!container) return;
    const prompts = [
      '📊 이번 주 내 상태를 평가해줘',
      '💰 지출 패턴을 분석해줘',
      '✅ 습관 달성률 피드백 해줘',
      '📅 루틴 개선 방법을 알려줘'
    ];
    container.innerHTML = prompts.map(p => `<button class="quick-prompt" style="background: rgba(139,92,246,0.15); border: 1px solid rgba(139,92,246,0.3); color: var(--accent-purple); padding: 0.4rem 0.8rem; border-radius: 20px; cursor: pointer; font-size: 0.85rem; transition: all 0.2s;">${p}</button>`).join('');
    container.querySelectorAll('.quick-prompt').forEach(btn => {
      btn.addEventListener('click', () => {
        this.#sendMessage(btn.textContent);
        container.style.display = 'none';
      });
    });
  }

  #addMessage(role, text) {
    const messagesEl = this.element.querySelector('#chat-messages');
    if (!messagesEl) return;
    const isUser = role === 'user';
    const bubble = document.createElement('div');
    bubble.style.cssText = `align-self: ${isUser ? 'flex-end' : 'flex-start'}; max-width: 85%; padding: 1rem; border-radius: 12px; background: ${isUser ? 'var(--accent-gradient)' : 'rgba(255,255,255,0.05)'}; border: ${isUser ? 'none' : '1px solid var(--glass-border)'}; line-height: 1.6; white-space: pre-wrap; word-break: break-word;`;
    // Escape HTML to prevent truncation from < or > characters
    let html = text.replace(/&/g, '&amp;')
                   .replace(/</g, '&lt;')
                   .replace(/>/g, '&gt;')
                   .replace(/"/g, '&quot;')
                   .replace(/'/g, '&#039;');
                   
    // Simple markdown: bold
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\n/g, '<br>');
    bubble.innerHTML = html;
    messagesEl.appendChild(bubble);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    this.#chatHistory.push({ role, text });
  }

  async #sendMessage(userMsg) {
    this.#addMessage('user', userMsg);
    // Show loading
    const loadingEl = document.createElement('div');
    loadingEl.style.cssText = 'align-self: flex-start; padding: 1rem; color: var(--text-secondary); font-style: italic;';
    loadingEl.textContent = '생각하는 중...';
    const messagesEl = this.element.querySelector('#chat-messages');
    messagesEl.appendChild(loadingEl);
    messagesEl.scrollTop = messagesEl.scrollHeight;
    // Disable input
    const sendBtn = this.element.querySelector('#btn-send');
    const chatInput = this.element.querySelector('#chat-input');
    if (sendBtn) sendBtn.disabled = true;
    if (chatInput) chatInput.disabled = true;
    try {
      const reply = await this.#service.ask(userMsg);
      loadingEl.remove();
      this.#addMessage('assistant', reply);
    } catch (err) {
      loadingEl.remove();
      this.#addMessage('assistant', `⚠️ 오류가 발생했습니다: ${err.message}`);
    } finally {
      if (sendBtn) sendBtn.disabled = false;
      if (chatInput) { chatInput.disabled = false; chatInput.focus(); }
    }
  }

  onMounted() {
    document.getElementById('topbar-title').textContent = 'AI Assistant';
    if (this.#service.hasApiKey()) {
      this.#showQuickPrompts();
      this.#addMessage('assistant', '안녕하세요! 😊 LifeOS AI 어시스턴트입니다.\n\n아래 추천 질문을 눌러보시거나, 자유롭게 질문해 주세요!');
    }
  }
}
