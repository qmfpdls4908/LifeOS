export class AIService {
  #API_KEY_STORE = 'gemini_api_key';
  #financeService;
  #habitService;
  #reviewService;
  #routineService;
  #calendarService;
  #routeService;
  #profileService;

  constructor(financeService, habitService, reviewService, routineService, calendarService, routeService, profileService) {
    this.#financeService = financeService;
    this.#habitService = habitService;
    this.#reviewService = reviewService;
    this.#routineService = routineService;
    this.#calendarService = calendarService;
    this.#routeService = routeService;
    this.#profileService = profileService;
  }

  getApiKey() {
    return localStorage.getItem(this.#API_KEY_STORE) || '';
  }

  saveApiKey(key) {
    localStorage.setItem(this.#API_KEY_STORE, key.trim());
  }

  hasApiKey() {
    return !!this.getApiKey();
  }

  #gatherContext() {
    const today = new Date().toISOString().slice(0, 10);
    const transactions = this.#financeService.getAll();
    const balance = this.#financeService.getBalance();
    const recentTx = transactions.slice(0, 20);
    const habits = this.#habitService.getAll();
    const habitSummary = habits.map(h => {
      const monthStr = today.slice(0, 7);
      const progress = this.#habitService.getMonthlyProgress(h.id, monthStr);
      const goal = this.#habitService.getMonthlyGoal(h.id, monthStr);
      return {
        name: h.name,
        streak: this.#habitService.getStreak(h.id),
        doneToday: !!(h.logs[today] && h.logs[today].done),
        todayMinutes: h.logs[today] ? h.logs[today].value : 0,
        monthlyGoal: goal ? goal.label : 'none',
        monthlyProgress: progress.percent + '%'
      };
    });
    const reviews = this.#reviewService.getAll().slice(0, 4);
    const dateStr = this.#routineService.getCurrentDateString();
    const routine = this.#routineService.getAll(dateStr).map(b => ({
      label: b.label, time: `${b.startTime}-${b.endTime}`, category: b.category
    }));
    return {
      today, balance,
      recentTransactions: recentTx.map(t => ({ date: t.date, type: t.type, amount: t.amount, category: t.category, memo: t.memo })),
      habits: habitSummary,
      recentReviews: reviews.map(r => ({ week: r.weekOf, keep: r.keep, problem: r.problem, tryNext: r.tryNext })),
      dailyRoutine: routine
    };
  }

  async ask(userMessage) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('API Key가 설정되지 않았습니다.');
    const context = this.#gatherContext();
    const systemPrompt = `당신은 LifeOS 앱의 AI 어시스턴트입니다. 사용자의 생활 데이터를 분석하여 실질적이고 구체적인 조언을 제공합니다. 따뜻하고 격려하는 톤으로 한국어로 대답하세요. 데이터를 기반으로 한 구체적인 수치와 패턴을 언급하며 조언해 주세요. 답변 마지막에 실행 가능한 액션 아이템을 1~3개 제안해 주세요.\n\n현재 사용자 데이터:\n${JSON.stringify(context, null, 2)}`;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
    const body = {
      contents: [{ role: 'user', parts: [{ text: systemPrompt + '\n\n사용자 질문: ' + userMessage }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 8192 }
    };
    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API 오류 (${response.status})`);
    }
    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AI로부터 응답을 받지 못했습니다.');
    return text;
  }

  async generateWeeklyRoutine(startDate = new Date()) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('API Key가 설정되지 않았습니다. AI 메뉴에서 먼저 설정해 주세요.');
    
    const curr = new Date(startDate.getTime());
    const day = curr.getDay();
    const diff = curr.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(curr.getTime());
    monday.setDate(diff);
    
    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday.getTime());
      d.setDate(monday.getDate() + i);
      // Format as YYYY-MM-DD in local time, safely:
      const yyyy = d.getFullYear();
      const mm = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      weekDates.push(`${yyyy}-${mm}-${dd}`);
    }
    
    const weekEvents = [];
    if (this.#calendarService) {
      const allEvents = this.#calendarService.getAllEvents();
      weekEvents.push(...allEvents.filter(e => {
        return (e.date >= weekDates[0] && e.date <= weekDates[6]) || 
               (e.endDate && e.endDate >= weekDates[0] && e.endDate <= weekDates[6]);
      }));
    }

    const eventsJson = JSON.stringify(weekEvents.map(e => ({ title: e.title, start: e.date, end: e.endDate || e.date })));

    const habitsJson = JSON.stringify(this.#habitService ? this.#habitService.getAll().map(h => {
      const monthStr = weekDates[0].slice(0, 7);
      const goal = this.#habitService.getMonthlyGoal(h.id, monthStr);
      return { id: h.id, name: h.name, goal: goal ? goal.target + '분/월' : '목표 없음' };
    }) : []);

    const profileText = this.#profileService ? this.#profileService.getProfile() : '';

    const routesJson = JSON.stringify(this.#routeService ? this.#routeService.getRouteSummaryForAI() : []);

    const systemPrompt = '당신은 LifeOS 앱의 주간 루틴 자동 생성 AI입니다. ' +
      '이번 주 월요일부터 일요일까지(' + weekDates[0] + ' ~ ' + weekDates[6] + ')의 루틴을 설계하세요. ' +
      (profileText ? '[사용자 기본 사항(우선 반영)] ' + profileText + ' ' : '') +
      '사용자의 캘린더 일정(공휴일 및 약속 등)을 우선적으로 고려하여 유동적으로 배치해야 합니다. ' +
      '[이번 주 일정] ' + eventsJson + ' ' +
      '[이동 경로 정보] ' + routesJson + ' ' +
      '[사용자 취미 목표] ' + habitsJson + ' ' +
      '자율 시간이나 휴식 시간에 취미 활동을 적절히 분배하여 배치하세요. ' +
      '취미 블록을 생성할 때는 해당 습관의 habitId를 포함해야 합니다. ' +
      '[응답 규칙] ' +
      'category는 sleep, work, free, routine, hobby 중 하나. ' +
      'startTime과 endTime은 HH:MM 형태. ' +
      '24시간 전체가 커버되도록 각 날짜별로 연속된 블록을 생성할 것. ' +
      'color는 hex 색상코드. ' +
      '응답은 반드시 아래 JSON 스키마를 따르는 순수 JSON 객체만 반환하세요. ' +
      '키는 다음 날짜 문자열이어야 합니다: ' + weekDates.join(', ') + '. ' +
      '각 키의 값은 {label, startTime, endTime, color, category, habitId} 객체의 배열입니다. habitId는 취미 블록에만 포함합니다.';

    const models = ['gemini-2.5-flash', 'gemini-2.0-flash-lite'];
    let lastError = '';

    for (const model of models) {
      const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + model + ':generateContent?key=' + apiKey;
      const body = {
        contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
        generationConfig: { 
          temperature: 0.5, 
          maxOutputTokens: 8192,
          responseMimeType: 'application/json'
        }
      };

      try {
        const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
        if (!response.ok) {
          const err = await response.json().catch(() => ({}));
          lastError = err?.error?.message || 'API 오류 (' + response.status + ')';
          console.warn(model + ' 실패, 다음 모델 시도:', lastError);
          continue;
        }
        
        const data = await response.json();
        let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) { lastError = 'AI로부터 응답을 받지 못했습니다.'; continue; }
        
        // Try direct parse first
        try {
          return JSON.parse(text);
        } catch (e1) {
          // Fallback: extract JSON from markdown code block
          const codeBlockMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
          if (codeBlockMatch) {
            try { return JSON.parse(codeBlockMatch[1]); } catch(e2) {}
          }
          // Fallback: find first { to last }
          const start = text.indexOf('{');
          const end = text.lastIndexOf('}');
          if (start !== -1 && end > start) {
            try { return JSON.parse(text.substring(start, end + 1)); } catch(e3) {}
          }
          console.error('AI Raw Response (' + model + '):', text);
          lastError = 'AI가 올바른 JSON 포맷을 반환하지 않았습니다.';
          continue;
        }
      } catch (fetchErr) {
        lastError = fetchErr.message;
        console.warn(model + ' fetch 실패:', lastError);
        continue;
      }
    }
    throw new Error(lastError || '모든 AI 모델이 응답하지 못했습니다. 잠시 후 다시 시도해 주세요.');
  }

  async generateDailyRoutine(dateStr) {
    const apiKey = this.getApiKey();
    if (!apiKey) throw new Error('API Key가 설정되지 않았습니다. AI 메뉴에서 먼저 설정해 주세요.');

    const events = this.#calendarService ? this.#calendarService.getAllEvents().filter(e => 
      (e.date <= dateStr && (!e.endDate || e.endDate >= dateStr))
    ) : [];

    const routes = this.#routeService ? this.#routeService.getRouteSummaryForAI() : [];
    
    const habits = this.#habitService ? this.#habitService.getAll().map(h => {
      const monthStr = dateStr.slice(0, 7);
      const goal = this.#habitService.getMonthlyGoal(h.id, monthStr);
      return { id: h.id, name: h.name, goal: goal ? goal.target + '분/월' : '목표 없음' };
    }) : [];

    const profileText = this.#profileService ? this.#profileService.getProfile() : '';

    const systemPrompt = `당신은 LifeOS 앱의 일일 루틴 설계 AI입니다.
사용자가 ${dateStr}의 하루 전체 루틴을 새로 생성하려 합니다.

[사용자 기본 사항 (우선 반영)]
${profileText || '등록된 내용 없음'}

[이 날의 캘린더 일정]
${JSON.stringify(events.map(e => ({title: e.title, type: e.type})))}

[사용자 취미/습관 목표]
${JSON.stringify(habits)}

[이동 경로 정보]
${JSON.stringify(routes)}

[필수 규칙]
1. 00:00부터 24:00까지 빈 시간 없이, 최소 8개 이상의 연속된 블록으로 하루 전체를 채워야 합니다.
2. 각 블록의 endTime은 다음 블록의 startTime과 정확히 같아야 합니다.
3. 첫 블록의 startTime은 반드시 "00:00", 마지막 블록의 endTime은 반드시 "24:00"이어야 합니다.
4. category: sleep, work, free, routine, hobby 중 하나.
5. color: hex 코드 (sleep=#1e293b, routine=#3b82f6, work=#ef4444, free=#8b5cf6, hobby=#10b981).
6. habitId: 취미와 관련된 경우에만 포함.
7. 공휴일이면 출근 없이 자유 시간 위주, 평일이면 출퇴근을 포함해야 합니다.

[응답 형식 — 반드시 이 JSON 배열 형태로만 응답하세요]
[
  {"label":"수면","startTime":"00:00","endTime":"06:30","color":"#1e293b","category":"sleep"},
  {"label":"기상 및 아침 준비","startTime":"06:30","endTime":"07:30","color":"#3b82f6","category":"routine"},
  {"label":"출근 이동","startTime":"07:30","endTime":"08:30","color":"#0f172a","category":"routine"},
  {"label":"오전 업무","startTime":"08:30","endTime":"12:00","color":"#ef4444","category":"work"},
  {"label":"점심 식사","startTime":"12:00","endTime":"13:00","color":"#10b981","category":"routine"},
  {"label":"오후 업무","startTime":"13:00","endTime":"18:00","color":"#ef4444","category":"work"},
  {"label":"퇴근 이동","startTime":"18:00","endTime":"19:00","color":"#0f172a","category":"routine"},
  {"label":"저녁 식사","startTime":"19:00","endTime":"20:00","color":"#10b981","category":"routine"},
  {"label":"자율 시간","startTime":"20:00","endTime":"23:00","color":"#8b5cf6","category":"free"},
  {"label":"취침 준비 및 수면","startTime":"23:00","endTime":"24:00","color":"#1e293b","category":"sleep"}
]

위 예시처럼 하루 전체를 촘촘하게 채운 JSON 배열만 반환하세요. 예시 그대로가 아니라, 위의 캘린더/경로/취미 정보를 반영하여 이 날에 맞게 맞춤 설계해야 합니다.`;

    const url = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=' + apiKey;
    const body = {
      contents: [{ role: 'user', parts: [{ text: systemPrompt }] }],
      generationConfig: { temperature: 0.7, maxOutputTokens: 4096, responseMimeType: 'application/json' }
    };

    const response = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err?.error?.message || `API 오류 (${response.status})`);
    }

    const data = await response.json();
    let text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new Error('AI로부터 응답을 받지 못했습니다.');

    console.log('[AIService] generateDailyRoutine raw response:', text);

    const extractArray = (raw) => {
      // 1. Direct parse
      let parsed;
      try { parsed = JSON.parse(raw); } catch (e) {
        // 2. Try extracting from code block
        const codeBlockMatch = raw.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
        if (codeBlockMatch) {
          try { parsed = JSON.parse(codeBlockMatch[1]); } catch(e2) {}
        }
        // 3. Try finding JSON substring
        if (!parsed) {
          const arrStart = raw.indexOf('[');
          const arrEnd = raw.lastIndexOf(']');
          const objStart = raw.indexOf('{');
          const objEnd = raw.lastIndexOf('}');
          if (arrStart !== -1 && arrEnd > arrStart) {
            try { parsed = JSON.parse(raw.substring(arrStart, arrEnd + 1)); } catch(e3) {}
          }
          if (!parsed && objStart !== -1 && objEnd > objStart) {
            try { parsed = JSON.parse(raw.substring(objStart, objEnd + 1)); } catch(e4) {}
          }
        }
      }

      if (!parsed) {
        console.error('[AIService] Failed to parse:', raw);
        throw new Error('AI 응답을 파싱할 수 없습니다.');
      }

      // If already an array, return it
      if (Array.isArray(parsed)) return parsed;

      // If object with a date key or any key containing an array, extract that array
      if (typeof parsed === 'object') {
        const values = Object.values(parsed);
        for (const v of values) {
          if (Array.isArray(v) && v.length > 0 && v[0].startTime) return v;
        }
        // If single routine object, wrap it
        if (parsed.startTime && parsed.label) return [parsed];
      }

      console.error('[AIService] Unexpected structure:', parsed);
      throw new Error('AI 응답 형식이 예상과 다릅니다.');
    };

    return extractArray(text);
  }
}
