# 프롬프트 복사-붙여넣기 원페이지 사이트 구축 계획

## Context

사용자가 Google Sheets에 정리해둔 프롬프트 라이브러리를 누구나 로그인 없이 빠르게 검색하고, 한글/영문 본문을 클릭 한 번으로 클립보드에 복사할 수 있는 원페이지 웹사이트를 만든다. 모바일에서도 어디서나 접근 가능하도록 Vercel에 배포한다.

현재 작업 디렉토리 `D:\AI\prompt-copy-paste-site\`에는 `DESIGN.md` 한 개만 존재. 시드 데이터는 Google Sheets(ID: `1FQfystrI-azl5itsm51AviWe1gyIEuOwWfEddTP4qeE`)에 9개 컬럼·2개 행으로 존재 (No., 카테고리, 프롬프트 이름, 설명, 프롬프트(한글), 프롬프트(영문), 평가, 메모, 최종 수정일).

**의도하는 결과:**
- Vite + Vanilla JS 기반 원페이지 사이트
- 페이지 로드 시 Google Sheets CSV export를 실시간 fetch → 항상 최신
- Starbucks 스타일 디자인 시스템(`DESIGN.md`) 그대로 적용
- 한국어 가독성을 위해 Pretendard 굵은 weight(500~800) 사용
- Vercel 배포 → 모바일에서 URL로 즉시 접근

## 사용자 확정 결정사항

1. **데이터 소스**: 실시간 fetch (Google Sheets CSV export)
2. **한글/영문 표시**: 테이블 위 [한글]/[영문] 탭 전환
3. **검색 범위**: 프롬프트 이름 + 설명 + 카테고리
4. **카테고리 필터**: 칩 버튼 추가, 검색과 AND 조합
5. **기술 스택**: Vite + Vanilla JS (React 없음, 향후 확장 시 전환 용이)
6. **배포**: Vercel (무료, GitHub 연동 시 git push 자동 배포)

## 기술 스택

- **Vite 5+** (`npm create vite@latest . -- --template vanilla`) — dev server, HMR, 프로덕션 번들링
- **Vanilla JS (ES modules)** — 프레임워크 없음, 단일 페이지 규모에 적합
- **Pretendard** (npm 패키지) — 한국 대표 한글 웹폰트, 9단계 weight, Bold(700~800)에서도 깨끗
- **PapaParse** (npm 패키지) — Google Sheets CSV의 콤마/따옴표/줄바꿈 포함 셀을 RFC 4180 호환 안전 파싱
- **Clipboard API** — `navigator.clipboard.writeText()` 복사
- **Vercel** — 정적 호스팅 + 자동 배포

## 파일 구조 (Vite vanilla 템플릿 기반)

```
D:\AI\prompt-copy-paste-site\
├── DESIGN.md                 (기존, 수정 안 함)
├── plans/                    (새로 생성)
│   └── 260513_prompt-copy-paste-site.md
├── index.html                (Vite entry HTML)
├── src/
│   ├── main.js               (앱 진입점: fetch · 검색 · 필터 · 탭 · 복사)
│   ├── style.css             (DESIGN.md 토큰 + 컴포넌트 스타일)
│   └── parser.js             (CSV → 정규화된 prompt 객체 변환)
├── public/
│   └── favicon.svg           (선택, 간단한 그린 점)
├── package.json
├── vite.config.js            (필요 시 base path 등)
├── .gitignore                (node_modules, dist 등)
└── README.md                 (실행/배포 방법 짧게)
```

## 초기 설정 단계 (npm scripts)

```bash
cd D:\AI\prompt-copy-paste-site
npm create vite@latest . -- --template vanilla
npm install pretendard papaparse
npm install -D vite
npm run dev   # localhost:5173
```

`package.json`의 `scripts`:
- `dev`: `vite` — 개발 서버 (HMR)
- `build`: `vite build` — 프로덕션 빌드 → `dist/`
- `preview`: `vite preview` — 빌드 결과 미리보기

## 데이터 소스 URL

```
https://docs.google.com/spreadsheets/d/1FQfystrI-azl5itsm51AviWe1gyIEuOwWfEddTP4qeE/export?format=csv
```

Phase 1에서 공개 권한 + CORS 허용 확인됨. 실패 시 에러 메시지 + 재시도 버튼 노출.

## 페이지 레이아웃 (위에서 아래로)

```
┌────────────────────────────────────────────────────┐
│ Header                                             │
│  H1: "프롬프트 모음" (Starbucks Green #006241)     │
│  Subhead: "원하는 프롬프트를 찾아 클릭 한 번에     │
│            복사하세요." (Text Black Soft)          │
├────────────────────────────────────────────────────┤
│ Controls                                           │
│  [🔍 검색창 — floating label, white card]          │
│  [한글] [영문]   ← 탭 토글 (pill, Green Accent)   │
│  [전체] [업무] [글쓰기] ...  ← 카테고리 칩         │
├────────────────────────────────────────────────────┤
│ Table (white card, 12px radius, soft shadow)       │
│  ┌─────┬────────┬──────────┬────────────┬─────┐    │
│  │ No. │카테고리│프롬프트  │설명        │복사 │    │
│  ├─────┼────────┼──────────┼────────────┼─────┤    │
│  │  1  │업무    │도면 검토 │지적사항... │ 📋 │    │
│  └─────┴────────┴──────────┴────────────┴─────┘    │
└────────────────────────────────────────────────────┘
       Toast: "복사되었습니다" (Green Accent pill)
```

페이지 캔버스: Neutral Warm `#f2f0eb`. 카드: White `#ffffff` + 12px radius + 카드 그림자.

## 디자인 토큰 매핑 (DESIGN.md → 사이트)

### 색상
- 페이지 배경: `#f2f0eb` (Neutral Warm)
- 카드/테이블 배경: `#ffffff`
- H1 헤딩: `#006241` (Starbucks Green)
- CTA·활성 탭·복사 토스트: `#00754A` (Green Accent)
- 본문: `rgba(0, 0, 0, 0.87)` (Text Black)
- 보조 텍스트: `rgba(0, 0, 0, 0.58)` (Text Black Soft)
- 테이블 행 호버: `#edebe9` (Ceramic)
- 입력 보더: `#d6dbde`

### 타이포그래피 (Pretendard, "굵게" 사용자 요청 반영)
- 폰트: `'Pretendard Variable', 'Pretendard', -apple-system, BlinkMacSystemFont, sans-serif`
- import: `src/style.css` 최상단에서 `@import "pretendard/dist/web/variable/pretendardvariable.css";`
- letter-spacing: `-0.01em` 전체
- weight (사용자 요청: "너무 얇으면 잘 안 보임"):
  - body 기본: **500**
  - 테이블 일반 셀: **500**
  - H1: **800** (24px → 32px로 살짝 크게)
  - 카테고리 / 프롬프트 이름 셀: **700**
  - 버튼 / 탭 / 칩 라벨: **700**

### 컴포넌트
- 모든 버튼·탭·칩: `border-radius: 50px` (full pill)
- 활성 버튼: `transform: scale(0.95)` on `:active`, `transition: all 0.2s ease`
- 카드 그림자: `0 0 0.5px rgba(0,0,0,0.14), 0 1px 1px rgba(0,0,0,0.24)`
- spacing: rem 기반, `html { font-size: 62.5% }` 트릭으로 `1rem = 10px`

### 컨트롤 상세
- **검색창**: floating label, 활성 시 보더가 Green Accent로 전환
- **언어 탭**: 두 pill 한 묶음. 활성: Green Accent 배경 + 흰색 텍스트. 비활성: 투명 + Green Accent 보더/텍스트
- **카테고리 칩**: 단일 선택 pill (한 번에 1개만 활성)

## 검색·필터 로직 (`src/main.js`)

```js
function filterRows(rows, query, category) {
  const q = query.trim().toLowerCase();
  return rows.filter(r => {
    const matchesCategory = category === '전체' || r.카테고리 === category;
    const matchesQuery = !q ||
      r.프롬프트이름.toLowerCase().includes(q) ||
      r.설명.toLowerCase().includes(q) ||
      r.카테고리.toLowerCase().includes(q);
    return matchesCategory && matchesQuery;
  });
}
```

- 검색은 `input` 이벤트로 즉시 반영
- 빈 결과: "검색 결과가 없습니다" 안내 메시지

## 복사 동작

각 행의 복사 버튼(📋) 클릭 시:
1. 활성 언어 탭에 따라 `프롬프트(한글)` 또는 `프롬프트(영문)` 컬럼 값 읽음
2. `navigator.clipboard.writeText(value)` 호출
3. Green Accent pill 토스트 "복사되었습니다" 가 우하단에 1.5초 fade-in/out
4. 실패 시 (예: 권한 거부): `document.execCommand('copy')` fallback + 에러 토스트

## 반응형

- `<meta name="viewport" content="width=device-width, initial-scale=1">` 필수 포함
- **Desktop (≥1024px)**: 5컬럼 풀 테이블
- **Tablet (768–1023px)**: 동일 + outer gutter 24px
- **Mobile (<768px)**: 테이블을 가로 스크롤 (1차 단순 구현). 컨트롤은 수직 스택
- 터치 타겟: 복사 버튼·칩·탭 모두 최소 44×44px 확보

## Vercel 배포 단계

1. **Git 초기화 + GitHub repo 푸시**
   ```bash
   git init
   git add .
   git commit -m "Initial commit: prompt copy-paste site"
   # GitHub에서 빈 repo 생성 후
   git remote add origin https://github.com/<user>/prompt-copy-paste-site.git
   git push -u origin main
   ```

2. **Vercel 연동**
   - vercel.com 로그인 → "Add New" → "Project"
   - GitHub repo `prompt-copy-paste-site` 선택 → Import
   - Vercel이 Vite 자동 감지 (Framework Preset: Vite)
   - Build Command: `npm run build`, Output Directory: `dist` (자동 설정됨)
   - "Deploy" 클릭 → 30~60초 후 배포 완료
   - 생성된 URL (예: `prompt-copy-paste-site.vercel.app`) 을 모바일에서 접속

3. **이후 자동 배포**
   - `git push` 할 때마다 Vercel이 자동으로 빌드·배포
   - 별도 작업 불필요

## Plan 파일 보관 체계 (추가 요청)

사용자가 plan mode로 작성한 plan을 작업 디렉토리 안에서 관리하고 싶어함. 이번 plan 승인 후 다음을 함께 처리:

### 즉시 처리 작업
1. **폴더 생성**: `D:\AI\prompt-copy-paste-site\plans\` 디렉토리 신규 생성
2. **이번 plan 사본 저장**:
   - 원본: `C:\Users\162327\.claude\plans\clever-shimmying-firefly.md` (시스템 plan file, 유지)
   - 사본: `D:\AI\prompt-copy-paste-site\plans\260513_prompt-copy-paste-site.md`

### 영구 지침 메모리 저장 (feedback 타입)

> **규칙**: plan mode 종료 시마다 ExitPlanMode 호출 전후로, plan 파일의 사본을 작업 디렉토리 `<repo_root>/plans/YYMMDD_<slug>.md` 형식으로 저장한다.
>
> **Why**: 시스템 plan file 경로(`~/.claude/plans/<random-slug>.md`)는 외우기 어렵고, 사용자는 작업 디렉토리 안에서 plan 이력을 한눈에 관리하길 원함. 임의 slug(`clever-shimmying-firefly`) 대신 의미있는 영문 slug.
>
> **How to apply**:
> - 날짜: YYMMDD (예: 2026-05-13 → `260513`)
> - 슬러그: 작업 내용 요약 (kebab-case, 영문)
> - 동일일 첫 plan: `YYMMDD_<slug>.md`
> - 동일일 두 번째 plan 발생 시: 기존 파일을 `YYMMDD_01_<slug>.md`로 rename + 새 파일을 `YYMMDD_02_<new-slug>.md`로 저장
> - `<repo_root>/plans/`가 없으면 먼저 생성

이 지침은 글로벌 메모리에 저장되어 다른 작업 디렉토리에서도 동일 규칙 적용.

## 실행 순서 요약

ExitPlanMode 승인 후 다음 순서로 진행:

1. `D:\AI\prompt-copy-paste-site\plans\` 폴더 생성
2. 시스템 plan 파일을 `plans\260513_prompt-copy-paste-site.md` 로 복사
3. 메모리에 plan 보관 규칙 저장 (feedback 타입)
4. `npm create vite@latest . -- --template vanilla` (현재 디렉토리에 초기화 — 기존 `DESIGN.md`, `plans/` 와 충돌 없는지 확인 후 진행. 충돌 시 사용자에게 확인)
5. `npm install pretendard papaparse`
6. `src/main.js`, `src/style.css`, `src/parser.js`, `index.html` 작성
7. `npm run dev` 로 로컬 확인 (브라우저에서 테스트 시나리오 수행)
8. README에 실행 방법 + Vercel 배포 단계 작성
9. Vercel 배포 절차 사용자에게 안내 (GitHub repo 생성·연동은 사용자 인증 필요해서 직접 수행)

## 테스트 / 검증 절차

1. `npm run dev` → 브라우저 자동 오픈 (또는 `http://localhost:5173`)
2. **데이터 로딩**: 테이블에 시드 2행(도면 검토 / 공지 다듬기) 표시 확인
3. **검색**: "도면" 입력 → 1행만. 비우면 2행 복원
4. **카테고리 필터**: [업무] 클릭 → 1행. [전체] 복원
5. **언어 탭**: [영문] 탭 → 복사 시 영문 본문 들어가는지 (콘솔에서 클립보드 확인)
6. **복사**: 복사 버튼 클릭 → 토스트 노출 + Ctrl+V로 클립보드 검증
7. **반응형**: DevTools에서 360 / 768 / 1280px 토글
8. **폰트 굵기**: 화면 텍스트가 weight 500~800로 굵게 보이는지
9. **에러**: DevTools Offline 모드 → 에러 메시지 + 재시도 버튼
10. **프로덕션 빌드**: `npm run build` → `dist/` 생성 확인 → `npm run preview` 로 빌드 결과 확인
11. **모바일**: Vercel 배포 후 핸드폰 브라우저로 URL 접속, 위 시나리오 동일하게 동작 확인

## 참고 자료

- `D:\AI\prompt-copy-paste-site\DESIGN.md` (디자인 시스템 명세)
- [Vite Vanilla Template](https://vitejs.dev/guide/)
- [Pretendard (npm)](https://www.npmjs.com/package/pretendard)
- [PapaParse (npm)](https://www.npmjs.com/package/papaparse)
- [Vercel Vite 배포 가이드](https://vercel.com/docs/frameworks/vite)
- Google Sheets CSV: `https://docs.google.com/spreadsheets/d/1FQfystrI-azl5itsm51AviWe1gyIEuOwWfEddTP4qeE/export?format=csv`
