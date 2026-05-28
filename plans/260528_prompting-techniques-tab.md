# 프롬프팅 기법 Tip 탭 추가

## Context

기존 사이트는 Google Sheets 기반 "프롬프트 복사·붙여넣기" 단일 페이지(`D:\AI\prompt-copy-paste-site`)다. 사용자가 자주 쓰는 프롬프트를 한곳에서 찾는 용도.

여기에 **"프롬프팅 기법 Tip"** 탭을 추가한다. 목적은 *프롬프트 그 자체*가 아니라 *프롬프트를 잘 쓰는 기법*(role, few-shot, CoT 등)을 카드 형태로 보여주는 학습용 페이지.

판단 기준: **현재 발전된 추론 모델(Claude 4.x, GPT-5 등)에서도 여전히 유효한 기법만** 포함. "Let's think step by step" 단독 사용, ReAct, Tree-of-Thoughts 같이 추론 모델이 자체적으로 처리해주는 기법은 제외.

## 결정 사항 (인터뷰 결과)

- **데이터 위치**: 코드 내장. `src/data/techniques.js`에 JS 객체로 관리 (Google Sheets 미사용).
- **레이아웃**: 카드 그리드 + 클릭 시 상세 모달.
- **탭 전환**: 상단에 탭 네비게이션 새로 추가. 단일 페이지 내 섹션 전환(SPA, 라우팅 X).
- **포함 기법**: 아래 11개.

### 포함할 11개 기법

| # | 기법 | 아이콘 | 한 줄 설명 |
|---|------|-------|-----------|
| 1 | CoT (Chain-of-Thought) | 🧠 | 단계별 추론을 명시적으로 요구 (비추론 모델·특정 형식 필요 시) |
| 2 | Role/Persona 프롬프팅 | 🎭 | 모델에 역할·전문 영역·어조 부여 |
| 3 | Few-shot 프롬프팅 | 📝 | 입출력 예시 2~5개로 형식·스타일 학습 |
| 4 | 구조화 출력 (XML/Markdown 태그) | 🏷️ | `<task>`, `<context>` 등 태그로 입출력 구조화 |
| 5 | 명확한 컨텍스트·제약 명시 | 🎯 | 목표·청중·제약·금지사항을 분리해서 명시 |
| 6 | 문서 분할 + 요약 체이닝 | 📄 | 긴 문서를 청크로 나눠 요약→통합 |
| 7 | Prompt Chaining (작업 분해) | 🔗 | 복잡 작업을 여러 호출로 나눠 단계별 처리 |
| 8 | Step-back 프롬프팅 | 🪜 | 본 문제 전에 일반 원칙·배경을 먼저 묻기 |
| 9 | Negative 지시 (하지 말 것 명시) | 🚫 | 금지 행동·제외 항목을 명시적으로 나열 |
| 10 | 출력 스키마·예시 지정 | 📐 | JSON/표 등 원하는 출력 구조를 예시로 제공 |
| 11 | Prefilling (응답 시작부 지정) | ✍️ | assistant 메시지 시작 토큰을 미리 채워 형식 강제 (Claude API) |

### 명시적 제외

- "Let's think step by step" 단독 사용 (추론 모델이 자체 수행)
- ReAct (에이전트 프레임워크 영역)
- Tree-of-Thoughts (추론 모델이 자체 수행)
- Self-Consistency (비용 대비 효용 낮음)

## 구현 계획

### 1. 신규 파일: `src/data/techniques.js`

11개 기법을 객체 배열로 export. 각 항목 구조:

```js
{
  id: 'cot',
  icon: '🧠',
  name: 'CoT (Chain-of-Thought)',
  oneLiner: '단계별 추론을 명시적으로 요구',
  whenToUse: '비추론 모델 사용 시, 수학·논리·다단계 추론 작업',
  howItWorks: '...',  // 2~4문장
  example: '...',     // 복사 가능한 예시 프롬프트 (한국어)
  caution: '...'      // 추론 모델에선 불필요한 경우 등 주의사항
}
```

### 2. `index.html` 수정

- `<header>` 아래, `<section class="controls">` 위에 **탭 네비게이션** 추가:
  ```html
  <nav class="tabs" role="tablist">
    <button class="tab is-active" data-tab="prompts">프롬프트</button>
    <button class="tab" data-tab="techniques">프롬프팅 기법</button>
  </nav>
  ```
- 기존 검색/필터/테이블/페이지네이션 영역 전체를 `<section id="view-prompts">`로 감싸기.
- 새 섹션 `<section id="view-techniques" hidden>` 추가:
  - 상단에 페이지 안내 문구 1~2줄
  - `<div id="technique-grid" class="technique-grid"></div>` (JS로 카드 렌더링)
- 기법 상세용 새 모달 `<div id="technique-modal" hidden>` 추가 (기존 modal과 별도, 구조가 다름).

### 3. `src/main.js` 수정

- `import { techniques } from './data/techniques.js';` 추가.
- 탭 전환 로직 추가 (`state.activeTab`, 클릭 시 두 섹션의 `hidden` 토글, 검색/필터 영역도 prompts 탭에서만 표시).
- 기법 카드 렌더 함수 `renderTechniques()` 추가 → 카드 클릭 시 `openTechniqueModal(technique)`.
- 기법 모달 열기/닫기 함수 추가. 예시 프롬프트는 `copyText()` 기존 함수 재사용.
- `loadPrompts()`는 기법 탭에서는 호출하지 않아도 되지만, 초기 1회 호출 유지(탭 전환 즉시 응답).

### 4. `src/style.css` 수정

- 탭 네비게이션 스타일 (기존 칩과 톤 통일, 활성 탭 표시).
- 카드 그리드 스타일: `grid-template-columns: repeat(auto-fill, minmax(240px, 1fr))`, 카드 내부 아이콘/제목/한줄 설명.
- 기법 모달 스타일 (기존 modal 클래스 최대한 재사용, 새 영역 — when/how/example/caution 섹션 — 만 추가).
- 다크/라이트 테마 변수 재사용 (기존 `data-theme` 시스템).

## 주요 파일 (수정·생성)

- **신규**: `D:\AI\prompt-copy-paste-site\src\data\techniques.js`
- **수정**: `D:\AI\prompt-copy-paste-site\index.html` (탭 + 새 섹션 + 새 모달)
- **수정**: `D:\AI\prompt-copy-paste-site\src\main.js` (탭 전환, 기법 렌더링, 기법 모달)
- **수정**: `D:\AI\prompt-copy-paste-site\src\style.css` (탭·카드그리드·기법모달 스타일)

## 재사용할 기존 코드

- `copyText()` (main.js:286) — 기법 예시 프롬프트 복사에 그대로 사용.
- `showToast()` (main.js:322) — 복사 피드백.
- `escapeHtml()` (main.js:174) — 동적 렌더링.
- 기존 modal의 backdrop·close·escape 키 패턴(main.js:376-388) — 동일 패턴으로 기법 모달에 적용.
- 다크/라이트 테마 토큰 — 그대로 사용.

## 검증 방법

1. `npm run dev` 실행 후 브라우저에서 사이트 진입.
2. 상단에 탭 두 개("프롬프트", "프롬프팅 기법") 표시 확인.
3. 기본 탭은 "프롬프트" — 기존 동작(검색·카테고리 칩·테이블·모달) 회귀 없는지 확인.
4. "프롬프팅 기법" 탭 클릭 → 카드 11개가 그리드로 표시.
5. 카드 클릭 → 모달에 이름·언제 쓰는지·작동 방식·예시·주의사항이 표시.
6. 예시 영역 "복사하기" 클릭 → 토스트 "복사되었습니다" 노출, 클립보드에 텍스트 들어감.
7. 모달 ESC 키·backdrop 클릭·X 버튼으로 닫힘.
8. 다크 모드 토글 시 두 탭 모두 정상 적용.
9. 모바일 폭(≤480px)에서 탭·카드 그리드·모달이 깨지지 않는지 확인.

## Phase 커밋 계획

[[feedback_git-commit-phase]] 규칙 적용. 큰 단위 = 정수+1, 작은 단위 = +0.1.

직전 커밋이 `Phase 1: 불필요한 slidev 워크스페이스 제거`이므로:

- `Phase 2: 프롬프팅 기법 Tip 탭 추가` (단일 큰 변경으로 묶어 커밋)
  - 또는 세분화 필요 시 `Phase 2.1: techniques.js 데이터 정의`, `Phase 2.2: 탭 네비게이션·기법 렌더링·모달 추가`로 분리.
