# 데이터 백업/복원 기능 구현 계획

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** LifeOS 모든 데이터를 JSON 파일로 내보내고 복원할 수 있는 백업/복원 기능을 Profile 페이지에 추가한다. (외부 IP 접속 시 데이터 이전 문제 해결)

**Architecture:** `BackupService`가 localStorage의 8개 키를 일괄 읽기/쓰기하고, `ProfileView` 하단에 백업/복원 버튼을 추가한다. 복원 시 페이지를 자동 새로고침하여 모든 서비스가 새 데이터를 다시 로드하도록 한다.

**Tech Stack:** Vanilla JS ES Modules, localStorage, Blob/URL.createObjectURL (다운로드), FileReader (업로드)

**Files to create (1):**
- `js/services/BackupService.js`

**Files to modify (3):**
- `js/views/ProfileView.js` — UI 버튼 추가
- `js/main.js` — DI 등록 + ProfileView 생성자 변경
- `style/index.css` — 파일 입력 숨김 스타일 추가

**Verification:** Live Server → Profile 페이지 → 백업 다운로드 → 다른 IP(localhost/외부)에서 복원

---

## Background: localStorage 격리 문제

```
http://localhost:5545      → localStorage A (데이터 있음 ✅)
http://192.168.0.5:5545    → localStorage B (텅 빔 🫗)
```

브라우저는 프로토콜+호스트+포트가 다르면 완전히 별개의 저장소로 취급한다. LifeOS는 서버 없이 localStorage만 사용하므로, 외부 IP에서 접속하면 모든 데이터(재정, 습관, 루틴, 경로 등)가 빈 상태로 보인다.

**해결책:** JSON 파일로 전체 데이터를 백업하고, 다른 IP에서 복원.

---

## 관리 대상 Storage 키 (10개)

| # | 키 | 출처 | 비고 |
|---|-----|------|------|
| 1 | `transactions` | FinanceService | Repo 통해 저장 |
| 2 | `routines_v4` | RoutineService | Repo 통해 저장 |
| 3 | `lifeos_destinations` | RouteService | Repo 통해 저장 |
| 4 | `habits_v2` | HabitService | Repo 통해 저장 |
| 5 | `reviews` | ReviewService | Repo 통해 저장 |
| 6 | `calendar_events` | CalendarService | Repo 통해 저장 |
| 7 | `lifeos_profile` | ProfileService | Repo 통해 저장 |
| 8 | `opencode_go_api_key` | AIService | **raw localStorage** (예외!) |
| 9 | `routines_v3` | (legacy) | 읽기 전용, 백업에 포함 |
| 10 | `habits` | (legacy) | 읽기 전용, 백업에 포함 |

---

## Task 1: BackupService 생성 — 데이터 익스포트/임포트 로직

**Files:**
- Create: `js/services/BackupService.js`

**목표:** localStorage의 모든 LifeOS 데이터를 JSON으로 묶어 다운로드하고, JSON 파일을 읽어 localStorage에 다시 쓰는 기능.

### Step 1: BackupService.js 작성

```javascript
/**
 * LifeOS 데이터 백업/복원 서비스
 * - 모든 localStorage 키를 JSON 파일로 내보내기
 * - JSON 파일에서 데이터 읽어 복원하기
 */
export class BackupService {
  // 백업 대상 키 목록 (순서 무관)
  #ALL_KEYS = [
    'transactions',
    'routines_v4',
    'routines_v3',
    'lifeos_destinations',
    'habits_v2',
    'habits',
    'reviews',
    'calendar_events',
    'lifeos_profile',
    'opencode_go_api_key'
  ];

  /**
   * 모든 localStorage 데이터를 JSON 객체로 수집
   * @returns {Object} { key: parsedValue, ... }
   */
  #collectAllData() {
    const backup = {};
    for (const key of this.#ALL_KEYS) {
      const raw = localStorage.getItem(key);
      if (raw !== null) {
        try {
          backup[key] = JSON.parse(raw);
        } catch (e) {
          // opencode_go_api_key 같은 raw string은 parse 실패 → 원본 저장
          backup[key] = raw;
        }
      }
    }
    return backup;
  }

  /**
   * JSON 파일로 데이터 다운로드
   */
  exportData() {
    const backup = this.#collectAllData();
    const keyCount = Object.keys(backup).length;
    
    if (keyCount === 0) {
      return { success: false, message: '백업할 데이터가 없습니다.' };
    }

    const jsonStr = JSON.stringify(backup, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const timestamp = new Date().toISOString().slice(0, 10);
    const fileName = `LifeOS_backup_${timestamp}.json`;
    
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    return { success: true, message: `${keyCount}개 항목 백업 완료! (${fileName})` };
  }

  /**
   * JSON 파일을 읽어 localStorage에 복원
   * @param {File} file - 사용자가 선택한 JSON 파일
   * @returns {Promise<{success: boolean, message: string}>}
   */
  restoreData(file) {
    return new Promise((resolve) => {
      if (!file || !file.name.endsWith('.json')) {
        resolve({ success: false, message: 'JSON 파일만 선택할 수 있습니다.' });
        return;
      }

      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          const keys = Object.keys(data);
          
          if (keys.length === 0) {
            resolve({ success: false, message: '빈 파일입니다.' });
            return;
          }

          for (const key of keys) {
            const value = data[key];
            // opencode_go_api_key는 raw string, 나머지는 JSON stringify 필요
            if (typeof value === 'string') {
              localStorage.setItem(key, value);
            } else {
              localStorage.setItem(key, JSON.stringify(value));
            }
          }
          
          resolve({ success: true, message: `${keys.length}개 항목 복원 완료! 페이지를 새로고침합니다...` });
        } catch (err) {
          resolve({ success: false, message: '올바른 LifeOS 백업 파일이 아닙니다.' });
        }
      };

      reader.onerror = () => {
        resolve({ success: false, message: '파일을 읽을 수 없습니다.' });
      };

      reader.readAsText(file);
    });
  }
}
```

**설계 결정:**
- `#collectAllData()`: `JSON.parse` 실패 시 원본 문자열 저장 → `opencode_go_api_key` 대응
- `exportData()`: Blob + 임시 `<a>` 태그로 다운로드 트리거 (서버 없이 가능)
- `restoreData()`: `FileReader`로 비동기 처리, `Promise` 반환
- 복원 후 자동 새로고침은 View에서 처리 (서비스는 순수 로직만)

### Step 2: Commit

```bash
git add js/services/BackupService.js
git commit -m "feat: BackupService - 데이터 익스포트/임포트 로직 구현"
```

---

## Task 2: ProfileView에 백업/복원 UI 추가

**Files:**
- Modify: `js/views/ProfileView.js`

**목표:** Profile 카드 하단에 "데이터 백업" / "데이터 복원" 버튼을 추가.

### Step 1: 생성자에 BackupService 파라미터 추가

**현재 코드:**
```javascript
export class ProfileView extends Component {
  #service;

  constructor(profileService) {
    super();
    this.#service = profileService;
  }
```

**변경 후:**
```javascript
export class ProfileView extends Component {
  #service;
  #backupService;

  constructor(profileService, backupService) {
    super();
    this.#service = profileService;
    this.#backupService = backupService;
  }
```

### Step 2: render()에 백업/복원 UI 추가

기존 `glass-card` 아래에 두 번째 `glass-card`를 추가한다. (또는 같은 카드 내에 구분선 + 버튼 행으로 추가)

**render() 메서드에 추가할 HTML (기존 카드 바로 다음):**
```html
<div class="glass-card" style="display: flex; flex-direction: column; gap: 1rem;">
  <h3 style="color: var(--accent-purple); font-size: 1.5rem;">데이터 백업/복원</h3>
  <p style="color: var(--text-secondary); line-height: 1.5;">
    모든 데이터(재정, 습관, 루틴, 경로, API 키 등)를 <strong>JSON 파일로 백업</strong>하고,
    다른 기기나 IP에서 <strong>복원</strong>할 수 있습니다.
  </p>
  <div style="display: flex; gap: 1rem; align-items: center; flex-wrap: wrap;">
    <button id="btn-backup" class="btn-primary" style="background: linear-gradient(135deg, #3b82f6, #2563eb);">
      📥 데이터 백업
    </button>
    <label id="btn-restore-label" class="btn-primary" style="background: linear-gradient(135deg, #10b981, #059669); cursor: pointer;">
      📤 데이터 복원
      <input type="file" id="file-restore" accept=".json" style="display: none;">
    </label>
    <span id="backup-status" style="color: var(--success); opacity: 0; transition: opacity 0.3s; font-size: 0.9rem;"></span>
  </div>
</div>
```

### Step 3: setupEvents()에 백업/복원 이벤트 추가

```javascript
setupEvents() {
  // 기존 저장 버튼 이벤트 (유지)
  this.element.querySelector('#btn-save-profile').addEventListener('click', () => { ... });

  // 백업
  this.element.querySelector('#btn-backup').addEventListener('click', () => {
    const result = this.#backupService.exportData();
    this.#showBackupStatus(result.message, result.success);
  });

  // 복원 (파일 선택 시 자동 실행)
  this.element.querySelector('#file-restore').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    const confirmed = confirm('⚠️ 현재 데이터를 덮어씁니다. 계속하시겠습니까?\n\n백업 파일: ' + file.name);
    if (!confirmed) {
      e.target.value = ''; // 파일 선택 초기화
      return;
    }

    const result = await this.#backupService.restoreData(file);
    this.#showBackupStatus(result.message, result.success);
    
    if (result.success) {
      setTimeout(() => { location.reload(); }, 1500);
    }
    e.target.value = '';
  });
}

// 상태 메시지 표시 헬퍼
#showBackupStatus(message, isSuccess) {
  const statusEl = this.element.querySelector('#backup-status');
  statusEl.textContent = message;
  statusEl.style.color = isSuccess ? 'var(--success)' : 'var(--danger)';
  statusEl.style.opacity = '1';
  setTimeout(() => { statusEl.style.opacity = '0'; }, 4000);
}
```

### Step 4: Commit

```bash
git add js/views/ProfileView.js
git commit -m "feat: ProfileView에 데이터 백업/복원 UI 추가"
```

---

## Task 3: main.js — BackupService DI 등록

**Files:**
- Modify: `js/main.js`

### Step 1: import 추가

```javascript
import { BackupService } from './services/BackupService.js';
```

(다른 service import들 옆에 추가)

### Step 2: BackupService 등록

Service 섹션(31-50줄 부근)에 추가:

```javascript
container.register('BackupService', (c) => new BackupService());
```

Repository 불필요 — BackupService는 `localStorage`를 직접 사용한다.

### Step 3: ProfileView 생성자에 BackupService 주입

ProfileView 등록 부분을 찾아 두 번째 인자로 `BackupService`를 추가:

**현재:**
```javascript
container.register('ProfileView', (c) => new ProfileView(
  c.resolve('ProfileService')
), { singleton: false });
```

**변경 후:**
```javascript
container.register('ProfileView', (c) => new ProfileView(
  c.resolve('ProfileService'),
  c.resolve('BackupService')
), { singleton: false });
```

### Step 4: Commit

```bash
git add js/main.js
git commit -m "feat: BackupService DI 등록 및 ProfileView 주입"
```

---

## Task 4: style/index.css — 파일 입력 숨김 스타일

**Files:**
- Modify: `style/index.css`

**목표:** 복원용 `<input type="file">`이 UI에 보이지 않도록 숨기고, 레이블 버튼만 표시한다.

### Step 1: 파일 입력 hidden 스타일 추가

`style/index.css` 하단에 추가:

```css
/* 백업/복원 - 파일 입력 숨김 */
#file-restore {
  display: none;
}
```

> 참고: `#btn-restore-label` 레이블이 `input`을 감싸고 `cursor: pointer`를 가지므로, 레이블 클릭 시 파일 선택기가 열린다.

### Step 2: Commit

```bash
git add style/index.css
git commit -m "style: 백업 파일 입력 숨김 스타일 추가"
```

---

## Task 5: 수동 검증

### Step 1: localhost에서 백업
1. `http://localhost:5545` 접속
2. Profile 페이지 → **"📥 데이터 백업"** 클릭
3. `LifeOS_backup_2026-05-05.json` 파일 다운로드 확인
4. 파일 열어서 모든 키가 포함되었는지 확인

### Step 2: 다른 IP에서 복원
1. Live Server 외부 IP로 모바일/다른 기기에서 접속
2. Profile 페이지 → **"📤 데이터 복원"** 클릭
3. 다운로드한 JSON 파일 선택
4. ⚠️ 덮어쓰기 확인 창 → 확인
5. 페이지 새로고침 → 모든 데이터가 복원되었는지 확인

### Step 3: 엣지 케이스 확인
- 빈 파일 선택 시 에러 메시지 표시
- JSON 아닌 파일 선택 시 에러 메시지 표시
- 데이터가 하나도 없을 때 백업 → "백업할 데이터가 없습니다."

---

## Summary of Changes

| 파일 | 작업 |
|------|------|
| `js/services/BackupService.js` | **신규 생성** — 익스포트(DTO 생성+다운로드), 임포트(FileReader→localStorage 쓰기) |
| `js/views/ProfileView.js` | **수정** — 생성자에 BackupService 추가, 두 번째 glass-card(백업/복원 버튼), 이벤트 핸들러 |
| `js/main.js` | **수정** — BackupService DI 등록 + ProfileView 생성자 인자 추가 |
| `style/index.css` | **수정** — `#file-restore { display: none; }` 1줄 추가 |

**총 코드 변경량:** 약 120줄 (생성 90줄 + 수정 30줄)
**예상 소요 시간:** 25분
**회귀 위험:** 낮음 (새 기능 추가, 기존 코드 변경 최소화)
