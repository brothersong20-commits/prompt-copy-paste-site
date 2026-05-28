# 프롬프팅 기법 4개 추가 (Phase 2 보강)

## Context

직전 작업으로 `D:\AI\prompt-copy-paste-site`에 "프롬프팅 기법" 탭을 추가했고 11개 기법이 카드로 표시된다. 사용자가 **웹 검색을 통해 검증된 추가 기법 4개**를 더 보강해달라고 요청.

판단 기준은 동일: **2026년 현재 추론 모델 시대(Claude 4.5/4.6, GPT-5, Gemini 3, o3 등)에도 여전히 유효한 기법**. 추론 모델이 내부적으로 처리해주는 기법(Tree-of-Thoughts, Self-Consistency, Let's-think-step-by-step 단독)은 다시 제외.

## 웹 검색 핵심 요약 (2026-05 기준)

검색에서 반복적으로 강조된, 추론 모델 시대에도 ROI가 높은 기법:

- **Self-Refine / Self-Critique** — 첫 답을 초안으로 두고 모델이 자기 검토·개선하게 함. 글쓰기·코드·기획에서 일관되게 효과.
- **Chain-of-Verification (CoVe)** — 답변 후 검증 질문을 만들고 답해 환각·논리 결함을 잡아냄. 규제·사실 검증이 중요한 작업에 핵심.
- **Quote-then-Answer (근거 인용 먼저)** — 긴 문서 Q&A에서 관련 부분을 먼저 인용하게 한 뒤 답하라고 시킴. Anthropic이 환각 방지 핵심 기법으로 명시.
- **"모를 땐 모른다" 허용 (Uncertainty Permission)** — 자신 없으면 "모릅니다"라고 답하도록 명시. 매우 단순하지만 환각을 크게 줄임. RAG에서 특히 강력.
- **Meta-Prompting** — 모델에게 프롬프트 자체를 생성·개선시키기.
- **Long-context placement** — 긴 문서는 위에, 질문은 아래에 두면 응답 품질 최대 30% 향상.
- **Success Criteria 명시** — "좋은 답이란 무엇인가"를 함께 알려주기.

## 추가할 4개 기법 (추천)

기존 11개와 중복되지 않고, 환각 방지·품질 보강이라는 빈 영역을 채우는 4개를 선정:

| # | 기법 | 아이콘 | 한 줄 설명 | 왜 추가하는가 |
|---|------|-------|-----------|--------------|
| 12 | **Self-Refine / Self-Critique** | 🔁 | 모델에게 자기 출력을 비평하고 개선하게 함 | 일상 워크플로에 가장 자주 쓰이는 품질 보강 기법. 추론 모델에도 효과. |
| 13 | **Chain-of-Verification (CoVe)** | ✅ | 답변 후 검증 질문을 만들어 자기 답을 검사 | 환각·논리 결함을 줄이는 표준 기법. CoT와 결이 다름(검증 단계). |
| 14 | **근거 인용 먼저 (Quote-then-Answer)** | 📑 | 긴 문서에서 관련 인용을 먼저 뽑고 답함 | Anthropic 권장. RAG·문서 Q&A 환각 방지 핵심. |
| 15 | **"모를 땐 모른다" 허용 (Uncertainty Permission)** | 🤷 | 자신 없으면 단정하지 말고 "모름"으로 답하라고 명시 | 가장 단순하지만 환각 방지에 강력. 한 줄 추가로 큰 효과. |

### 검토했지만 이번에 제외

- **Meta-Prompting** — 매력적이지만 일반 사용자 일상 워크플로보다는 프롬프트 엔지니어 도구에 가까움. 다음 라운드 후보.
- **Long-context placement** — 너무 미시적이고 "구조화 출력"·"컨텍스트·제약 명시"에 일부 흡수됨.
- **Success Criteria 명시** — 기존 "명확한 컨텍스트·제약 명시"의 확장이라 중복도 높음.
- **Self-Consistency / Tree-of-Thoughts** — 추론 모델 시대 효용 낮음(이전 라운드와 동일 이유).

## 구현 계획

영향 범위는 **`src/data/techniques.js` 단 1개 파일**. 이미 렌더링이 데이터 배열을 순회하는 구조라(`renderTechniques()` in `src/main.js:closeTechniqueModal` 직후 정의), 데이터만 추가하면 카드 4장이 자동으로 그리드에 추가된다.

### 수정할 파일

- `D:\AI\prompt-copy-paste-site\src\data\techniques.js` — 배열에 객체 4개 추가.

### 객체 스키마 (기존과 동일)

```js
{
  id, icon, name, oneLiner,
  whenToUse,    // 언제 쓰는가
  howItWorks,   // 작동 방식
  example,      // 복사 가능한 한국어 예시 프롬프트
  caution       // 주의사항·한계
}
```

### 변경 없는 파일

- `index.html` — 변경 없음 (탭/모달 마크업 그대로).
- `src/main.js` — 변경 없음 (`renderTechniques`가 배열 길이에 무관하게 동작).
- `src/style.css` — 변경 없음 (그리드 `auto-fill` + 카드 동일 스타일).

## 검증 방법

1. dev 서버는 이미 백그라운드 실행 중. 변경 후 hot reload로 즉시 반영.
2. 브라우저에서 http://localhost:5173 → "프롬프팅 기법" 탭 진입.
3. 카드 개수가 **15개**로 늘었는지 확인.
4. 새 카드 4개(🔁/✅/📑/🤷) 클릭 시 모달에 5개 섹션(언제 쓰는가 / 작동 방식 / 예시 프롬프트 / 주의사항) 정상 표시.
5. 예시 프롬프트 "복사하기" 클릭 → 토스트 표시 + 클립보드에 텍스트.
6. 다크 모드 토글에도 정상.
7. 모바일 폭(≤480px)에서 그리드 1열 + 카드 정상.

## Phase 커밋 계획

[[feedback_git-commit-phase]] 규칙: 데이터 4개 추가만 있는 작은 변경이므로 정수+1이 아니라 소수점.

- `Phase 2.1: 프롬프팅 기법 4개 추가 (Self-Refine, CoVe, Quote-then-Answer, Uncertainty Permission)`

## 참고 자료 (웹 검색 출처)

- [Anthropic — Prompting best practices (Claude API Docs)](https://platform.claude.com/docs/en/build-with-claude/prompt-engineering/claude-prompting-best-practices)
- [SurePrompts — 2026 Reasoning Models Prompting Guide](https://sureprompts.com/blog/ai-reasoning-models-prompting-complete-guide-2026)
- [Karo Zieminski — Every AI Prompting Technique That Works on Reasoning Models (2026)](https://karozieminski.substack.com/p/ai-prompting-techniques-reasoning-models-2026)
- [Medium — Advanced Prompting Techniques: Stability, Verification, and Trust (2025-12)](https://medium.com/@er.rajkumaar/advanced-prompting-techniques-stability-verification-and-trust-part-2b-7bdfe7126881)
- [Maxim AI — Advanced Prompt Engineering Techniques in 2025](https://www.getmaxim.ai/articles/advanced-prompt-engineering-techniques-in-2025/)
- [Anthropic Engineering — Effective context engineering for AI agents](https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents)
