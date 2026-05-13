# 프롬프트 모음 (Prompt Copy-Paste Site)

자주 쓰는 AI 프롬프트를 한 페이지에서 검색하고 클릭 한 번에 복사할 수 있는 원페이지 사이트.

데이터는 Google Sheets에 정리하고, 페이지 로드 시 CSV로 실시간 fetch한다. 스프레드시트만 수정하면 사이트도 자동 반영.

## 기술 스택

- Vite 5 + Vanilla JS (ES modules)
- Pretendard (한글 웹폰트, weight 500–800)
- PapaParse (CSV 파서)
- 디자인 시스템: `DESIGN.md` (Starbucks 스타일)

## 로컬 실행

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # dist/ 생성
npm run preview   # 빌드 결과 미리보기
```

## 데이터 소스

Google Sheets CSV export:

```
https://docs.google.com/spreadsheets/d/1FQfystrI-azl5itsm51AviWe1gyIEuOwWfEddTP4qeE/export?format=csv
```

스프레드시트 컬럼:

| No. | 카테고리 | 프롬프트 이름 | 설명 | 프롬프트(한글) | 프롬프트(영문) | 평가 | 메모 | 최종 수정일 |

시트의 공유 권한이 "링크가 있는 모든 사용자에게 보기"여야 fetch 가능.

## 다른 스프레드시트를 쓰려면

`src/parser.js` 상단의 `SHEET_CSV_URL` 을 새 스프레드시트의 CSV export URL로 교체.
컬럼명이 달라지면 같은 파일의 `COLUMN_ALIASES`에 alias를 추가.

## Vercel 배포

1. GitHub repo 생성 후 푸시:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/<user>/prompt-copy-paste-site.git
   git push -u origin main
   ```

2. [vercel.com](https://vercel.com) 로그인 → **Add New → Project** → GitHub repo 선택 → Import
   - Framework Preset: **Vite** (자동 감지됨)
   - Build Command: `npm run build`
   - Output Directory: `dist`
   - **Deploy** 클릭

3. 30~60초 후 `<project-name>.vercel.app` URL 생성. 모바일 브라우저에서 이 URL로 접속하면 됨.

4. 이후 `git push` 시 Vercel이 자동 빌드·배포.

## 파일 구조

```
prompt-copy-paste-site/
├── index.html
├── src/
│   ├── main.js          앱 진입점 (state, 이벤트, 렌더)
│   ├── parser.js        CSV fetch + 정규화
│   └── style.css        디자인 토큰 + 컴포넌트
├── public/
│   └── favicon.svg
├── plans/               (이 프로젝트 plan 이력 보관)
├── DESIGN.md            디자인 시스템 명세
├── package.json
├── vite.config.js
└── .gitignore
```
