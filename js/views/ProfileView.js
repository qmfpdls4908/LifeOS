import { Component } from '../core/Component.js';

export class ProfileView extends Component {
  #service;
  #backupService;

  constructor(profileService, backupService) {
    super();
    this.#service = profileService;
    this.#backupService = backupService;
  }

  render() {
    return `
      <div style="max-width: 800px; margin: 0 auto;">
        <div class="glass-card" style="display: flex; flex-direction: column; gap: 1.5rem;">
          <h3 style="color: var(--accent-purple); font-size: 1.5rem;">내 기본사항 (Profile)</h3>
          <p style="color: var(--text-secondary); line-height: 1.5;">
            여기에 작성된 내용은 AI가 루틴이나 일정을 자동 생성할 때 <strong>가장 우선적으로 참고하는 기본 배경지식</strong>이 됩니다.<br/>
            직업, 기상/취침 선호 시간, 생활 패턴, 루틴 시 고려해야 할 개인적인 제약 사항 등을 자유롭게 적어주세요.
          </p>
          <textarea id="profile-input" class="glass-input" style="min-height: 300px; resize: vertical; padding: 1rem; font-family: inherit; line-height: 1.6;" placeholder="예시:\n- 나는 프리랜서 개발자이며, 주로 오후 1시부터 밤 9시까지 집중해서 일하는 것을 선호해.\n- 아침 잠이 많아서 오전 9시 이전에는 일정을 잡지 않았으면 좋겠어.\n- 하루에 최소 1시간은 독서를 할 수 있는 빈 시간을 만들어 줘."></textarea>
          <div style="display: flex; justify-content: flex-end; align-items: center; gap: 1rem;">
            <span id="save-status" style="color: var(--success); opacity: 0; transition: opacity 0.3s; font-size: 0.9rem;">저장되었습니다!</span>
            <button id="btn-save-profile" class="btn-primary">저장하기</button>
          </div>
        </div>

        <div class="glass-card" style="display: flex; flex-direction: column; gap: 1rem; margin-top: 1.5rem;">
          <h3 style="color: var(--accent-purple); font-size: 1.5rem;">데이터 백업/복원</h3>
          <p style="color: var(--text-secondary); line-height: 1.5;">
            모든 데이터(재정, 습관, 루틴, 경로, API 키 등)를 <strong>JSON 파일로 백업</strong>하고,
            다른 기기나 IP에서 <strong>복원</strong>할 수 있습니다.
          </p>
          <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
            <button id="btn-backup" class="btn-primary" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">📥 데이터 백업</button>
            <label id="btn-restore-label" class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); cursor: pointer;">
              📤 데이터 복원
              <input type="file" id="file-restore" accept=".json" style="display: none;">
            </label>
            <button id="btn-clear" class="btn-primary" style="background: linear-gradient(135deg, #ef4444, #dc2626);">🗑️ 데이터 초기화</button>
            <span id="backup-status" style="color: var(--success); opacity: 0; transition: opacity 0.3s; font-size: 0.9rem;"></span>
          </div>
        </div>
      </div>
    `;
  }

  setupEvents() {
    this.element.querySelector('#btn-save-profile').addEventListener('click', () => {
      const content = this.element.querySelector('#profile-input').value;
      this.#service.saveProfile(content);
      
      const statusLabel = this.element.querySelector('#save-status');
      statusLabel.style.opacity = '1';
      setTimeout(() => {
        statusLabel.style.opacity = '0';
      }, 2000);
    });

    this.element.querySelector('#btn-backup').addEventListener('click', () => {
      const result = this.#backupService.exportData();
      this.#showStatus(result.message, result.success);
    });

    this.element.querySelector('#file-restore').addEventListener('change', async (e) => {
      const file = e.target.files[0];
      if (!file) return;

      const confirmed = confirm('⚠️ 현재 데이터를 덮어씁니다. 계속하시겠습니까?\n\n백업 파일: ' + file.name);
      if (!confirmed) {
        e.target.value = '';
        return;
      }

      const result = await this.#backupService.restoreData(file);
      this.#showStatus(result.message, result.success);

      if (result.success) {
        setTimeout(() => { location.reload(); }, 1500);
      }
      e.target.value = '';
    });

    this.element.querySelector('#btn-clear').addEventListener('click', () => {
      const confirmed = confirm('⚠️ 정말로 모든 데이터를 삭제하시겠습니까?\n\n이 작업은 되돌릴 수 없습니다. 필요한 경우 먼저 백업을 수행하세요.');
      if (!confirmed) return;

      const result = this.#backupService.clearAllData();
      this.#showStatus(result.message, result.success);

      if (result.success) {
        setTimeout(() => { location.reload(); }, 1500);
      }
    });
  }

  #showStatus(message, isSuccess) {
    const statusEl = this.element.querySelector('#backup-status');
    statusEl.textContent = message;
    statusEl.style.color = isSuccess ? 'var(--success)' : 'var(--danger)';
    statusEl.style.opacity = '1';
    setTimeout(() => { statusEl.style.opacity = '0'; }, 4000);
  }

  onMounted() {
    document.getElementById('topbar-title').textContent = 'Profile';
    const profileText = this.#service.getProfile();
    this.element.querySelector('#profile-input').value = profileText;
  }
}
