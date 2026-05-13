# Git Commit Phase 번호 규칙

## Context
git commit 메시지에 "Phase 번호"를 부여하는 개인 컨벤션을 도입한다. 큰 변경은 정수 단위(Phase 1 → 2 → 3), 작은/유사 변경은 소수점 첫째자리(Phase 1.1 → 1.2 → 1.3)로 증가한다. 향후 git log를 훑었을 때 작업 단위가 한눈에 보이도록 하기 위함. 이번 작업의 산출물은 코드가 아니라, Claude가 앞으로 모든 프로젝트에서 따를 수 있도록 **feedback 메모리에 규칙을 저장**하는 것이다.

## 결정사항 (사용자 답변)
- **메시지 형식**: `Phase X.Y: <설명>` (콜론 + 짧은 한 줄 설명)
- **정수 vs 소수점 판단**: Claude가 휴리스틱으로 자동 판단
- **다음 번호 결정**: 커밋 직전 `git log --oneline`에서 가장 최근 Phase 번호를 파싱해 증가

## 휴리스틱 (Claude 자동 판단 기준)

### 정수 증가 (Phase X → X+1) — "큰 변경"
- 새 기능/페이지/엔드포인트 추가
- 아키텍처·디렉토리 구조 변경
- 의존성 도입/제거, 빌드/설정 시스템 교체
- 여러 도메인을 동시에 건드리는 리팩토링
- 직전 커밋과 **주제가 다른** 작업

### 소수점 증가 (Phase X.Y → X.(Y+1)) — "작은/유사 변경"
- 직전 커밋과 **같은 주제 안**에서의 후속 수정
- 버그 픽스, 오타, 스타일/포맷팅, 문구 변경
- 좁은 범위의 보정 (단일 함수, 단일 컴포넌트 한정)
- 직전 Phase의 마무리·정리

### 애매하면
한 줄로 분류 근거를 말한 뒤 그대로 진행 (사용자가 원치 않으면 정정 요청).

## 번호 결정 알고리즘

1. 커밋 직전 `git log --oneline -n 30` 실행
2. 정규식 `^Phase (\d+)(?:\.(\d+))?:` 으로 가장 최근 Phase 번호(major, minor) 추출
3. 휴리스틱으로 분류:
   - **큰 변경** → `Phase {major+1}: <설명>` (예: `Phase 1.3` 이후 → `Phase 2`)
   - **작은 변경** → `Phase {major}.{minor+1}: <설명>` (minor 없으면 `.1`)
4. 매칭되는 이력이 없으면(첫 번째 Phase 커밋) → `Phase 1: <설명>`로 시작

## 적용 대상 파일

새 메모리 파일 1개 생성, MEMORY.md 인덱스 1줄 추가.

| 경로 | 작업 |
|---|---|
| `C:\Users\162327\.claude\projects\D--AI-prompt-copy-paste-site\memory\feedback_git-commit-phase.md` | 신규 작성 (위 규칙 전문) |
| `C:\Users\162327\.claude\projects\D--AI-prompt-copy-paste-site\memory\MEMORY.md` | 인덱스 한 줄 추가 |

### 메모리 파일 골자 (feedback_git-commit-phase.md)

```markdown
---
name: feedback-git-commit-phase
description: git commit 메시지에 Phase X.Y 번호 부여 — 큰 변경은 정수, 작은/유사 변경은 소수점 첫째자리 증가
metadata:
  type: feedback
---

**규칙**: 모든 git commit 메시지를 `Phase X.Y: <설명>` 형식으로 작성.
- 큰 변경(새 기능, 구조 변경, 다중 도메인) → 정수 +1
- 작은/유사 변경(같은 주제 내 후속 수정, 버그 픽스, 오타) → 소수점 +0.1
- 다음 번호는 `git log --oneline -n 30`에서 가장 최근 Phase를 파싱해 결정
- 첫 Phase 커밋은 `Phase 1:`

**Why**: 사용자가 작업 단위와 흐름을 git log에서 한눈에 보고 싶음 (2026-05-13 결정).

**How to apply**:
- 커밋 직전 `git log --oneline -n 30`로 최신 Phase 번호 파싱
- 정규식: `^Phase (\d+)(?:\.(\d+))?:`
- 휴리스틱 분류 후 번호 증가 (큰 변경 → major+1 리셋 minor, 작은 변경 → minor+1)
- 애매하면 분류 근거를 한 줄로 밝히고 진행
- 사용자가 명시적으로 "Phase 2로 가자" 식으로 지정하면 그것을 우선
- 관련: [[feedback-plan-archive]]
```

### MEMORY.md 추가 줄
```
- [Git Commit Phase 번호 규칙](feedback_git-commit-phase.md) — 커밋 메시지에 Phase X.Y 부여, 큰 변경=정수, 작은 변경=소수점 첫째자리
```

## 검증

1. 메모리 파일 두 개가 정상 저장됐는지 확인 (`ls memory/`)
2. 다음 커밋을 만들 때 Claude가 자동으로:
   - `git log --oneline -n 30` 실행
   - 최근 Phase 파싱 → 휴리스틱 분류 → `Phase X.Y: <설명>` 형식으로 커밋 메시지 생성하는지 확인
3. 이번 프로젝트의 직전 커밋(Initial commit)에는 Phase가 없으므로, 다음 커밋이 `Phase 1: ...`로 시작하는지 확인
