# LifeOS — 2026 통합 생활 관리 웹앱 구현 계획서

> **기술 스택**: HTML5 / Vanilla JS (ES Modules) / CSS3  
> **설계 원칙**: DI (Dependency Injection) · SOLID · YAGNI · KISS · DRY  
> **현재 날짜**: 2026-05-03 · **타겟 기간**: 2026년 5월 ~ 12월

---

## 1. 요구사항 정리

| # | 기능 | 핵심 요구 | 상태 |
|---|------|----------|------|
| F1 | **수입/지출 관리** | 거래 기록, 카테고리별 지출 확인, 부채 상환 추적 | ✅ 완료 |
| F2 | **일일 루틴 관리** | 기상-업무-자율시간-취침 타임블록 사이클 | ✅ 완료 |
| F3 | **이동 경로 안내** | 목적지(울산/김해/회사) 선택 → 교통편 안내 | ✅ 완료 |
| F4 | **습관 트래커** | 독서, 게임, 게임 창작 습관 기록 + 연속 달성 카운터 | ✅ 완료 |
| F5 | **주간 회고 (KPT)** | Keep / Problem / Try 기록 및 열람 | ✅ 완료 |
| F6 | **대시보드** | 잔액, 루틴, 습관 위젯 통합 요약 | ✅ 완료 |
| F7 | **달력 (Calendar)** | 월간 캘린더, 공휴일, 다일(Multi-day) 개인 일정 | ✅ 완료 |
| F8 | **AI 어시스턴트** | Gemini API를 활용한 데이터 기반 개인화 조언 | 🔲 진행 중 |

---

## 2. 설계 원칙 적용 전략

### 2.1 SOLID

| 원칙 | 적용 방법 |
|------|----------|
| **S**ingle Responsibility | 하나의 클래스/모듈은 하나의 책임만 담당. `FinanceService`는 거래 로직만, `FinanceView`는 렌더링만 |
| **O**pen/Closed | `config/categories.js`, `config/debts.js`, `config/destinations.js`로 설정을 분리하여 확장 시 코드 수정 없이 설정만 변경 |
| **L**iskov Substitution | `LocalStorageRepo` 구현체는 동일 인터페이스를 따르는 다른 저장소로 교체 가능 |
| **I**nterface Segregation | 각 Service는 자신의 책임 범위에 맞는 메서드만 노출 |
| **D**ependency Inversion | 모든 Service/View는 생성자 파라미터로 의존성을 주입받음. DI Container가 런타임에 주입 |

### 2.2 YAGNI · KISS · DRY

| 원칙 | 적용 방법 |
|------|----------|
| **YAGNI** | 서버 연동, 소셜 로그인 등 불필요한 기능 미구현. `utils/` 디렉토리는 필요해질 때 생성 예정 |
| **KISS** | 프레임워크 없이 Vanilla JS ES Modules로 구성. Observer 패턴(`EventBus`)으로 단순한 상태 관리 |
| **DRY** | `Component` 베이스 클래스로 View 공통 로직 추상화. Config 파일로 데이터 중복 제거 |

### 2.3 DI (Dependency Injection) 구현

```javascript
// core/Container.js — 경량 DI 컨테이너
export class Container {
  #registry = new Map();

  register(token, factory, { singleton = true } = {}) {
    this.#registry.set(token, { factory, singleton, instance: null });
  }

  resolve(token) {
    const entry = this.#registry.get(token);
    if (!entry) throw new Error(`[DI] "${token}" not registered`);
    if (entry.singleton) {
      if (!entry.instance) entry.instance = entry.factory(this);
      return entry.instance;
    }
    return entry.factory(this);
  }
}
```

> **핵심**: 모든 모듈은 `new`로 직접 의존성을 생성하지 않고, 생성자 파라미터로 주입받습니다.  
> Service는 `singleton: true`(기본값)로 앱 전역에서 공유되고, View는 `singleton: false`로 라우팅 시마다 새 인스턴스를 생성합니다.

---

## 3. 아키텍처

### 3.1 레이어 구조

```
┌───────────────────────────────────────────────────────┐
│                  Presentation Layer                   │
│         Views / Components (DOM 렌더링, 이벤트)        │
├───────────────────────────────────────────────────────┤
│                  Application Layer                    │
│         Services (비즈니스 로직, 유효성 검증)            │
├───────────────────────────────────────────────────────┤
│                    Domain Layer                       │
│         Models / Entities (순수 데이터 구조)            │
├───────────────────────────────────────────────────────┤
│                Infrastructure Layer                   │
│     Repository, EventBus, Router, Config              │
└───────────────────────────────────────────────────────┘
```

### 3.2 파일 구조 (현재 기준)

```
lifeos/
├── index.html
├── LifeOS_서버실행.bat        # 로컬 서버 실행 스크립트
├── style/
│   └── index.css             # 전역 디자인 토큰 & 리셋 (단일 CSS)
├── js/
│   ├── main.js               # Composition Root (DI 등록 & 앱 부트스트랩)
│   ├── core/
│   │   ├── Container.js      # DI 컨테이너
│   │   ├── EventBus.js       # Pub/Sub 이벤트 버스
│   │   ├── Router.js         # Hash 기반 SPA 라우터
│   │   └── Component.js      # 뷰 컴포넌트 베이스 클래스
│   ├── models/
│   │   ├── Transaction.js    # { id, type, amount, category, memo, date }
│   │   ├── RoutineBlock.js   # { id, label, startTime, endTime, color, category }
│   │   ├── CalendarEvent.js  # { id, date, endDate, title, type, color }
│   │   ├── Habit.js          # { id, name, icon, logs[] }
│   │   └── Review.js         # { id, weekOf, keep, problem, tryNext }
│   ├── repositories/
│   │   └── LocalStorageRepo.js
│   ├── services/
│   │   ├── FinanceService.js
│   │   ├── RoutineService.js
│   │   ├── RouteService.js
│   │   ├── CalendarService.js
│   │   ├── HabitService.js
│   │   ├── ReviewService.js
│   │   └── AIService.js       # [신규] Gemini API 호출
│   ├── views/
│   │   ├── DashboardView.js
│   │   ├── FinanceView.js
│   │   ├── RoutineView.js
│   │   ├── RouteView.js
│   │   ├── CalendarView.js
│   │   ├── HabitView.js
│   │   ├── ReviewView.js
│   │   └── AIAssistantView.js # [신규] AI 채팅 UI
│   └── config/
│       ├── categories.js     # 지출 카테고리 목록
│       ├── debts.js          # 부채 항목별 금액
│       └── destinations.js   # 목적지 & 교통편 데이터
└── implementation_plan.md
```

---

## 4. 모듈별 상세 설계

### 4.1 수입/지출 관리 (F1) — ✅ 구현 완료

- **Model**: `Transaction.js` — `{ id, type, amount, category, memo, date }`
- **Config**: `categories.js` (수입/지출 카테고리), `debts.js` (부채 항목별 금액, 총 490만원)
- **Service**: `FinanceService.js` — CRUD, 잔액 계산, 부채상환 진행률
- **View**: `FinanceView.js` — 입력 폼, 거래 리스트, 부채 상환 게이지 (부채 목록 포함)

### 4.2 일일 루틴 관리 (F2) — 🔲 요일별 주간 뷰 개편 예정 (Phase 8)

- **Model**: `RoutineBlock.js` — `{ id, label, startTime, endTime, color, category }`
- **Service**: `RoutineService.js` — 데이터 구조를 `weekday/weekend`에서 `monday`~`sunday` 7일 체제로 개편
- **View**: `RoutineView.js` — 가로 스크롤이 가능한 **7개 열(월~일)의 주간 타임라인 그리드** 렌더링. 각 블록 클릭 시 수정/삭제, '+' 버튼을 눌러 특정 요일에 루틴 추가 가능.

### 4.3 이동 경로 안내 (F3) — 🔲 CRUD 개편 예정 (Phase 9)

- **Config**: `destinations.js` — 울산(친가), 김해(약혼자), 회사, 경남대 기본 데이터 (시드 역할)
- **Service**: `RouteService.js` — 목적지/경로 CRUD + localStorage 영속화
- **View**: `RouteView.js` — 목적지별 교통편 카드 그리드 + 추가/수정/삭제 UI

#### 4.3.1 Routes CRUD 상세 설계 (Phase 9)

**데이터 구조:**
```javascript
// Destination
{
  id: string,        // 고유 식별자 (예: 'ulsan', 'gimhae', uuid)
  name: string,      // 목적지명 (예: '울산 (친가)')
  routes: [
    {
      id: string,    // 경로 고유 식별자
      method: string,// 교통편 (예: 'KTX', '시외버스')
      from: string,  // 출발지
      to: string,    // 도착지
      duration: string, // 소요 시간 (예: '약 20분')
      cost: string,  // 비용 (예: '₩8,400')
      time: string|null,  // 출발/도착 시각 정보 (옵션)
      details: string|null, // 추가 정보 (옵션)
      images: string[]     // 이미지 경로 배열 (옵션)
    }
  ]
}
```

**데이터 흐름:**
```
destinations.js (시드 데이터)
        │
        ▼
RouteService.load()
  ├── localStorage에 'lifeos_destinations' 키가 없으면
  │   destinations.js 기본값으로 초기 적재
  └── 이후 모든 CRUD는 localStorage 기준
```

**변경 범위:**

| 파일 | 변경 내용 |
|------|----------|
| `js/services/RouteService.js` | `Repository` 의존성 추가. CRUD 메서드 구현. `destinations.js`는 초기값으로만 사용 |
| `js/views/RouteView.js` | 목적지 추가/수정/삭제 UI. 경로 추가/수정/삭제 UI. 인라인 폼 |
| `js/main.js` | `RouteService` DI 등록에 `Repository` 추가 |
| `js/config/destinations.js` | 변경 없음 (시드 데이터 유지) |
| `js/services/AIService.js` | 변경 없음 (`getRouteSummaryForAI()` 인터페이스 그대로) |

**UI 구성:**
```
┌───────────────────────────────────────────┐
│  [+ 새 목적지 추가]                       │
├───────────────────────────────────────────┤
│  ┌─ 울산 (친가) ───── [수정] [삭제] ───┐ │
│  │  [경로1] 출발→도착 / 시간 / 비용      │ │
│  │  [경로2] 출발→도착 / 시간 / 비용      │ │
│  │  [+ 경로 추가]                        │ │
│  └──────────────────────────────────────┘ │
│  ┌─ 김해 (약혼자) ── [수정] [삭제] ────┐ │
│  │  ...                                  │ │
│  └──────────────────────────────────────┘ │
└───────────────────────────────────────────┘
```

**AI 연계 보존:** `getRouteSummaryForAI()` 메서드는 기존과 동일한 { id, name, routes: [...] } 형태를 반환하므로 `AIService`는 변경 불필요. 마스터가 추가한 커스텀 경로도 AI 프롬프트에 자동 포함됨.

#### 4.3.2 경로 이미지 업로드 (Phase 9.1)

**목적:** 각 경로 카드에 탑승 정보 이미지(탑승 장소 사진, 시간표 등)를 첨부할 수 있게 한다.

**현재 상태:**
- 데이터 모델 `images: string[]` 필드 이미 존재
- RouteView에서 이미지 표시 로직 이미 구현됨
- RouteService CRUD에서 `images` 필드 처리 완료
- ❌ 경로 추가/수정 폼에 이미지 업로드 UI 없음 (텍스트 URL만 가능)

**구현 범위:**

| 파일 | 변경 내용 |
|------|----------|
| `js/views/RouteView.js` | 경로 폼(`#renderRouteForm`)에 파일 업로드 UI + 이미지 목록(썸네일 + 삭제) 추가 |

**파일 크기 제한 전략 (localStorage 5MB 한도):**
```
File Input → FileReader → base64 → Canvas 리사이즈 (max-width 1400px) →
JPEG quality 0.78 → 압축 base64 (보통 80~150KB/장) → localStorage 저장
```

- 원본 이미지는 리사이즈 후 저장 (원본 폐기)
- 이미지당 약 80~150KB, 10장이면 약 800KB~1.5MB — localStorage 한도 내 안전
- 썸네일은 CSS `object-fit: cover`로 작게 표시, 클릭 시 원본 해상도로 확대

**UI 추가 요소:**
```
경로 폼 하단:
┌──────────────────────────────────────────┐
│ 📷 탑승 정보 이미지 (선택)               │
│ ┌──────┐ ┌──────┐                       │
│ │ 썸네1 │ │ 썸네2 │  [➕ 이미지 추가]     │
│ │  [✕]  │ │  [✕]  │                       │
│ └──────┘ └──────┘                       │
└──────────────────────────────────────────┘
```

- `[➕ 이미지 추가]` 버튼 → 숨겨진 `<input type="file" accept="image/*">` 트리거
- 선택된 이미지: Canvas로 리사이즈 → base64 변환 → images 배열에 push → 썸네일로 미리보기
- 각 썸네일 우상단 `[✕]` 버튼으로 개별 삭제
- 저장 시 images 배열 전체를 RouteService에 전달

**검증 항목:**
| 항목 | 방법 |
|------|------|
| 이미지 업로드 | 경로 추가 폼에서 이미지 파일 선택 → 썸네일 표시 확인 |
| 다중 이미지 | 2~3개 이미지 추가 → 모두 썸네일로 표시되는지 확인 |
| 이미지 삭제 | 썸네일의 ✕ 버튼 클릭 → 해당 이미지만 제거 |
| 경로 저장 후 유지 | 이미지 포함 경로 저장 → 새로고침 → 이미지 표시 확인 |
| 기존 URL 호환 | destinations.js 기본 데이터의 `./assets/...` 이미지 그대로 표시 |

### 4.4 습관 트래커 (F4) — ✅ 구현 완료

- **Model**: `Habit.js` — `{ id, name, icon, logs[] }`
- **Service**: `HabitService.js` — 토글, 연속 달성(streak) 계산
- **View**: `HabitView.js` — 습관 카드 + 달성 버튼 + 스트릭 카운터

### 4.5 주간 회고 (F5) — ✅ 구현 완료

- **Model**: `Review.js` — `{ id, weekOf, keep, problem, tryNext }`
- **Service**: `ReviewService.js` — KPT 저장/조회
- **View**: `ReviewView.js` — KPT 입력 폼 (좌) + 과거 기록 열람 (우)

### 4.6 대시보드 (F6) — ✅ 구현 완료

| 위젯 | 데이터 소스 |
|------|-----------|
| 현재 잔액 + 부채 상환 진행률 | `FinanceService` |
| 현재 진행 중인 루틴 | `RoutineService` |
| 오늘의 습관 현황 | `HabitService` |

### 4.7 캘린더 & 일정 관리 (F7) — ✅ 구현 완료

- **Model**: `CalendarEvent.js` — `{ id, date, endDate, title, type, color }`
- **Service**: `CalendarService.js` — 2026년 공휴일 내장 + 개인 일정 CRUD
- **View**: `CalendarView.js` — 7x5 월간 그리드, 다일(Multi-day) 일정, 모달 입력

### 4.8 AI 어시스턴트 (F8) — 🔲 진행 중

#### Service — `AIService.js`
- Google Gemini API REST 호출 (`generativelanguage.googleapis.com`)
- API Key는 `localStorage`에 저장하여 재사용 (개인 전용 앱 — 서버 우회 불필요)
- LifeOS 내 모든 Service 데이터를 JSON 형태의 시스템 프롬프트에 포함
- **보안 참고**: 개인 PC에서만 사용. API Key 사용량 제한 설정 권장

#### View — `AIAssistantView.js`
- API Key 최초 1회 입력 폼 (이후 localStorage에서 자동 로드)
- 챗봇 형식의 UI (사용자 질문 입력 및 AI 답변 마크다운 렌더링)
- 기본 프롬프트 추천 버튼 제공 ("이번 주 상태 평가", "지출 조언", "루틴 피드백" 등)

---

## 5. Infrastructure 상세

### 5.1 `LocalStorageRepo.js`
```javascript
export class LocalStorageRepo {
  load(key)        { return JSON.parse(localStorage.getItem(key) ?? '[]'); }
  save(key, data)  { localStorage.setItem(key, JSON.stringify(data)); }
  clear(key)       { localStorage.removeItem(key); }
}
```

### 5.2 `EventBus.js` (Observer 패턴)
```javascript
export class EventBus {
  #listeners = new Map();
  on(event, cb)     { /* 구독 */ }
  emit(event, data) { /* 발행 */ }
  off(event, cb)    { /* 해제 */ }
}
```

### 5.3 `Router.js` (Hash Router)
- DI Container를 주입받아 `viewToken`으로 View 인스턴스를 resolve
- View는 `singleton: false`이므로 라우팅마다 새 인스턴스 생성 → 항상 최신 데이터 반영

---

## 6. 데이터 흐름

```
사용자 입력 → View.onSubmit()
                │
                ▼
        Service.add(data)         ← View는 Service만 호출 (DIP)
                │
        ┌───────┴───────┐
        ▼               ▼
Repository.save()   EventBus.emit('updated')
                        │
                ┌───────┴────────┐
                ▼                ▼
        FinanceView.refresh()  CalendarView.refresh()
```

---

## 7. 개발 페이즈

| Phase | 내용 | 상태 |
|-------|------|------|
| **1** | 기반 구축 (Container, EventBus, Router, CSS 디자인 시스템) | ✅ 완료 |
| **2** | 수입/지출 관리 (Model, Service, View, 부채 게이지) | ✅ 완료 |
| **3** | 루틴 매니저 + 이동 경로 안내 | ✅ 완료 |
| **4** | 습관 트래커 + 주간 회고 | ✅ 완료 |
| **5** | 대시보드 통합 | ✅ 완료 |
| **6** | 캘린더 모듈 (공휴일 + 다일 개인 일정) | ✅ 완료 |
| **7** | Gemini AI 어시스턴트 연동 (API 호출 및 채팅 UI) | ✅ 완료 |
| **8** | 루틴 관리 고도화 (월~일요일 주간 뷰 개편) | 🔲 진행 예정 |
| **9** | 이동 경로 CRUD 개편 (목적지/경로 추가·수정·삭제) | ✅ 완료 |
| **9.1** | 경로 이미지 업로드 (탑승 정보 사진/시간표 첨부) | ✅ 완료 |

---

## 8. UI 디자인 방향

| 항목 | 선택 |
|------|------|
| **테마** | 다크 모드 기본 |
| **색상** | 딥 네이비(#0f172a) 배경 + 보라~블루 그라데이션 액센트 |
| **효과** | Glassmorphism 카드, 마이크로 애니메이션 |
| **폰트** | Inter (Google Fonts CDN) |
| **레이아웃** | 좌측 사이드바 네비게이션 + 우측 콘텐츠 |
| **CSS** | `style/index.css` 단일 파일로 통합 관리 |

---

## 9. 검증 계획

| 항목 | 방법 |
|------|------|
| 거래 CRUD | 추가/삭제 후 새로고침하여 데이터 유지 확인 |
| 라우팅 | 각 해시 직접 접근 시 정상 렌더링 |
| 이벤트 전파 | 거래 추가 시 FinanceView 자동 갱신 확인 |
| 캘린더 다일 일정 | 시작~종료 범위의 모든 날짜에 일정 표시 확인 |
| AI 어시스턴트 | API Key 입력 → 질문 → 응답 정상 렌더링 확인 |
| 경로 CRUD | 목적지/경로 추가 후 새로고침 → 데이터 유지 확인 |
| 경로 CRUD | 경로 수정/삭제 후 RouteView 갱신 확인 |
| 경로 AI 연계 | 커스텀 경로 추가 후 AI 일일 루틴 생성 시 경로 정보 포함 확인 |
| 경로 이미지 업로드 | 경로 추가 폼에서 이미지 파일 선택 → 썸네일 표시 → 저장 후 유지 확인 |
| 경로 다중 이미지 | 2~3개 이미지 추가 → 모두 썸네일 표시 → 개별 삭제 가능 확인 |
