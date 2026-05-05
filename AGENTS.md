# AGENTS.md — LifeOS

## Quickstart

```sh
# Start the local dev server (port 5545, NOT default 8000)
python -m http.server 5545
# Or double-click: LifeOS_서버실행.bat
# Then open: http://localhost:5545
```

No npm, no build, no bundler. Pure Vanilla JS ES Modules served as static files.

## Architecture (what's not obvious from filenames)

- **DI Container** (`js/core/Container.js`): Every module receives dependencies via constructor. Never `new` up a Service or View directly — use `container.resolve(token)`.
- **Views are non-singleton** (`{ singleton: false }`): Router creates a fresh View instance on every navigation, so `render()` always sees latest data. Services are singleton by default.
- **Data flow**: `View → Service → Repository.save() + EventBus.emit('updated') → other Views refresh`.
- **Persistence is exclusively localStorage** via `LocalStorageRepo` (load/save/clear). No server, no IndexedDB. Check browser DevTools > Application > Local Storage to inspect state.
- **Single CSS file**: ALL styles live in `style/index.css`. Uses CSS custom properties (dark glassmorphism theme). Do NOT create additional stylesheets.
- **Profile is critical infra**: `ProfileService/ProfileView` stores user context (job, sleep preferences, habits) as free-text. `AIService` reads this to generate personalized routines. If AI routines look generic, check that Profile has content.

## Dangerous files: `AIService.js` template literal rules

`js/services/AIService.js` contains long AI prompt strings. **NEVER use backtick template literals** for these strings — use `'+'` string concatenation instead. Backticks, `${`, and ` ``` ` inside template literals cause cryptic `SyntaxError: Invalid or unexpected token`. This has caused 4+ production breaks. See `TroubleShot/AIService_SyntaxErrors.md` for war stories.

When editing `AIService.js`:
- All system prompts MUST use `'...' + '...'` style, NOT `` `...` ``
- After any edit, verify the file parses: open DevTools Console and check for red errors on page load
- Check brace/paren balance manually if you replaced a code block — stray `}` is a common artifact

## Routing & navigation

- Hash-based SPA: `#dashboard`, `#calendar`, `#finance`, `#routine`, `#routes`, `#habits`, `#review`, `#ai`, `#profile`
- Router registered in `js/main.js` (lines 79-87). If adding a page, register both the DI token and the route there.
- Every View sets `document.getElementById('topbar-title').textContent` in `onMounted()`.

## Config vs code

Static data lives in `js/config/`:
- `categories.js` — income/expense category labels
- `debts.js` — debt list with amounts (total: 4,900,000 KRW)
- `destinations.js` — travel routes (Ulsan, Gimhae, company, university)

These are plain JS arrays/objects. Extend configs without touching Service code (Open/Closed principle).

## Verification

No test suite, no linter, no CI. After changes:
1. Start `python -m http.server 5545`
2. Open `http://localhost:5545` in browser
3. Check DevTools Console for errors
4. Click through each nav link to verify rendering
5. For data changes: add data → refresh page → confirm it persists in localStorage

## Korean language note

UI strings, config data, and user-facing text are in Korean. AI prompt system messages are a mix of Korean/English. Keep additions consistent with existing language.
