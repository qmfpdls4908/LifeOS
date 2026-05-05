# AI 루틴 생성 - Routes 정보/이미지 활용 개선

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** AI 일간/주간 루틴 생성 시 Routes의 `details`(상세 텍스트)와 `images`(존재 여부 힌트)를 AI 프롬프트에 포함시키고, 주간 루틴 생성에도 Routes 정보를 추가한다.

**Architecture:** `RouteService.getRouteSummaryForAI()`의 반환 데이터를 확장하고, `AIService.generateWeeklyRoutine()`에도 Routes 정보를 주입한다. 이미지 데이터 자체(base64)는 토큰 낭비 방지를 위해 제외하고, 이미지 존재 여부만 텍스트 힌트로 전달한다.

**Tech Stack:** Vanilla JS ES Modules, localStorage persistence, Gemini API

**Files to modify (2 files):**
- `js/services/RouteService.js` (line 128-136)
- `js/services/AIService.js` (line 127-142)

**Verification:** `python -m http.server 5545` → 브라우저에서 수동 확인

---

## Background: 현재 상태

### 문제점
1. `RouteService.getRouteSummaryForAI()`가 `details`와 `images` 필드를 제외하고 반환함
2. `AIService.generateWeeklyRoutine()`에 Routes 정보가 전혀 포함되지 않음
3. 경남대 셔틀버스처럼 `details`에 중요한 텍스트 정보("탑승 장소: 김해시청 앞")가 있어도 AI가 모름

### 현재 `getRouteSummaryForAI()` 반환 구조
```json
[
  {
    "id": "ulsan", "name": "울산 (친가)",
    "routes": [
      { "method": "KTX", "from": "부산역", "to": "울산역", "duration": "약 20분", "cost": "₩8,400" }
    ]
  }
]
```
→ `details`, `images` 누락됨. `time`만 조건부 포함.

---

## Task 1: RouteService - AI 요약 데이터에 details/images 힌트 추가

**Files:**
- Modify: `js/services/RouteService.js:128-136`

**목표:** `getRouteSummaryForAI()`가 `details`(텍스트)와 `hasImages`(boolean)를 포함하도록 확장.

### Step 1: `getRouteSummaryForAI()` 수정

**현재 코드 (128-136줄):**
```javascript
getRouteSummaryForAI() {
    return this.#load().map(d => ({
      id: d.id, name: d.name,
      routes: d.routes.map(r => ({
        method: r.method, from: r.from, to: r.to,
        duration: r.duration, cost: r.cost, time: r.time || null
      }))
    }));
  }
```

**변경할 코드:**
```javascript
getRouteSummaryForAI() {
    return this.#load().map(d => ({
      id: d.id, name: d.name,
      routes: d.routes.map(r => {
        const summary = {
          method: r.method, from: r.from, to: r.to,
          duration: r.duration, cost: r.cost
        };
        if (r.time) summary.time = r.time;
        if (r.details) summary.details = r.details;
        if (r.images && r.images.length > 0) {
          summary.imageHint = `참조 이미지 ${r.images.length}장 있음 (지도/시간표 등)`;
        }
        return summary;
      })
    }));
  }
```

**변경 포인트 설명:**
- `time`, `details`, `imageHint`는 값이 있을 때만 키를 추가 (불필요한 null/빈 배열 방지)
- `imageHint`: 실제 base64 데이터는 제외하고 이미지 존재 여부만 한글 텍스트로 전달
- AI가 "참조 이미지 있음"이라는 힌트를 보고 경로 관련 블록에 주의를 기울이도록 유도

### Step 2: 기존 기능 회귀 확인

`getRouteSummaryForAI()`를 호출하는 곳은 `AIService.js`의 `generateDailyRoutine()` (207줄) 단 한 곳뿐이므로, 반환 구조가 이전과 호환되는지 확인:
- 기존 필드(`method`, `from`, `to`, `duration`, `cost`, `time`)는 그대로 유지됨 ✅
- 새 필드(`details`, `imageHint`)는 조건부 추가이므로 기존 JSON 파싱 로직에 영향 없음 ✅

### Step 3: Commit

```bash
git add js/services/RouteService.js
git commit -m "feat: RouteService.getRouteSummaryForAI()에 details 및 imageHint 필드 추가"
```

---

## Task 2: AIService - 주간 루틴 생성에 Routes 정보 추가

**Files:**
- Modify: `js/services/AIService.js:127-142`

**목표:** `generateWeeklyRoutine()`의 system prompt에 Routes 정보를 주입.

### Step 1: Routes 데이터 수집 코드 추가

`generateWeeklyRoutine()` 메서드 내, `profileText` 선언부(125줄) 바로 아래에 Routes 수집 코드 추가:

**현재 코드 (124-125줄):**
```javascript
    const profileText = this.#profileService ? this.#profileService.getProfile() : '';

    const systemPrompt = '당신은 LifeOS 앱의 주간 루틴 자동 생성 AI입니다. ' +
```

**변경 후:**
```javascript
    const profileText = this.#profileService ? this.#profileService.getProfile() : '';

    const routesJson = JSON.stringify(this.#routeService ? this.#routeService.getRouteSummaryForAI() : []);

    const systemPrompt = '당신은 LifeOS 앱의 주간 루틴 자동 생성 AI입니다. ' +
```

### Step 2: system prompt에 Routes 섹션 추가

system prompt 문자열에 `[이동 경로 정보]` 섹션 삽입. `eventsJson` 다음에 추가:

**현재 코드 (131-132줄):**
```javascript
      '[이번 주 일정] ' + eventsJson + ' ' +
      '[사용자 취미 목표] ' + habitsJson + ' ' +
```

**변경 후:**
```javascript
      '[이번 주 일정] ' + eventsJson + ' ' +
      '[이동 경로 정보] ' + routesJson + ' ' +
      '[사용자 취미 목표] ' + habitsJson + ' ' +
```

**변경 포인트 설명:**
- `'+'` 문자열 연결 방식 유지 (AGENTS.md 규칙 준수) — 백틱 사용 금지
- Routes 정보를 일정과 취미 사이에 배치하여 자연스러운 흐름 유지
- 주간 프롬프트에도 "출퇴근 시간을 경로 정보에 맞게 배치하라"는 맥락을 암묵적으로 제공 (별도 규칙 추가 없이 AI가 추론)

### Step 3: Commit

```bash
git add js/services/AIService.js
git commit -m "feat: generateWeeklyRoutine()에 Routes 경로 정보 주입"
```

---

## Task 3: 수동 검증 (Manual Verification)

**검증 방법:** (AGENTS.md Verification 섹션에 따름)

### Step 1: 서버 실행
```sh
python -m http.server 5545
```

### Step 2: 브라우저 확인
1. `http://localhost:5545` 접속
2. DevTools Console 열기 (F12)
3. 에러 없는지 확인 (빨간색 메시지 0개)

### Step 3: 일일 루틴 생성 테스트
1. AI 메뉴 → "오늘 루틴 생성" 클릭
2. DevTools Console에서 `[AIService] generateDailyRoutine raw response:` 로그 확인
3. 생성된 루틴에 Routes 정보가 반영되었는지 확인 (예: 경남대 루트가 있으면 통학버스 관련 블록 존재)

### Step 4: 주간 루틴 생성 테스트
1. AI 메뉴 → "주간 루틴 생성" 클릭
2. 생성된 루틴에 Routes 정보가 반영되었는지 확인
3. JSON 응답 정상 파싱되는지 확인

### Step 5: Routes 수정 후 재생성 테스트
1. Routes 메뉴에서 경로 추가/수정
2. AI 루틴 재생성
3. 수정된 내용이 반영되는지 확인

---

## Summary of Changes

| 파일 | 변경 내용 | 영향 범위 |
|------|----------|-----------|
| `js/services/RouteService.js` | `getRouteSummaryForAI()`: `details` + `imageHint` 필드 조건부 추가 | 일일 루틴 생성 프롬프트 품질 향상 |
| `js/services/AIService.js` | `generateWeeklyRoutine()`: Routes 정보 수집 및 프롬프트 주입 | 주간 루틴 생성 시 경로 정보 반영 |

**총 코드 변경량:** 약 20줄 (2개 파일)
**예상 소요 시간:** 15분
**회귀 위험:** 낮음 (기존 필드 유지, 조건부 추가만 수행)
