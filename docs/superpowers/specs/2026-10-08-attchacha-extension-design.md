# 앗!차차 웨일 확장앱 설계

흩어진 학과 공지·외부 공고의 마감일을 한곳(웨일 사이드바 달력)에 모아 알림으로 챙겨주는 확장앱. 기획서: `사이드바 확장앱 개발 기획서 - WEAVE(충남대).pdf`, UI: `앗!차차 — 웨일 확장앱 UI.html`(수정 금지).

## 범위
- 1단계(10/28 세미나 전 스토어 제출): 기획서 6기능 — 학과 공지 연동, 드래그 저장, 알림 시점 지정, 브라우저 알림+알림탭, 직접 입력, 수정·삭제
- 2단계(세미나 직후): Google 캘린더 단방향 동기화(설정의 메일 자리). `calendar.app.created` scope, OAuth 검증 신청 병행
- 제외: 백마 게시판(공통 공지), 메일 알림, 학사 일정(데이터 출처 없음)

## 구조
```
[GitHub Actions 하루 2회 12시·18시 KST]
  collector/collect.js
   ├ Secrets.CNU_KEY → POST form (homepageboardContents, P_board_no)
   ├ extension/departments.json의 학과별 board 순회, 게시판당 1회 호출, 최신 50건만 처리
   ├ extension/extract.js로 유형 분류·마감일 추출
   └ site/data/{학과id}.json 커밋 → Pages 배포
[웨일 확장앱 MV3] extension/
  sidebar.html/app.js  데모 이식, 시안 마크업 그대로(메일·학사일정·백마 게시판 문구만 제거)
  content.js           드래그 → 차차 버튼(Shadow DOM) → pendingScrap 저장 → 사이드바 열기
  background.js        chrome.alarms 알림 예약·발송, 6시간마다 학과 JSON 새로고침
  저장                 chrome.storage.local, 외부 전송 없음
```
키는 Actions Secrets에만 존재. 확장앱 패키지에는 키가 없다.

## 학내 게시판 API 사실관계(2026-10-08 실호출 확인)
- POST, `application/x-www-form-urlencoded`, `AUTH_KEY`(+`P_board_no`). JSON 바디는 401
- `cmsBoard`: 611개 게시판(252개 사이트). 학과 외 연구실·사업단 섞임
- `homepageboardContents`: 개수 파라미터 없음, 최신 90건, 본문 HTML(평균 12KB)
- `update_dt`는 Java Date 객체 → `time`(ms) 사용
- 원문 URL 필드 없음 → 학과 홈페이지 메뉴의 `boardNo = 'N'`으로 게시판 URL을 1회 수집해 매핑에 저장. 원문 = `{boardUrl}?mode=view&articleNo={article_no}`
- 일일 한도 1000건, 사용기간 연장 가능(사용자 확인)

## 데이터
- `extension/departments.json`: 시안 학과 목록(단과대 → 학과) + 학과별 boards `[{no, name, url}]`(최대 3개). 자동 초안 후 검수
- `site/data/{id}.json`: `{updated, ok, items:[{id, title, type, date, time, url, writer, attach, tag}]}` — 본문 원문은 저장하지 않음
- 수집 실패 시 이전 파일 유지, 확장앱은 `updated`로 "N시간 전 기준" 표시

## 추출 규칙(extract.js)
제목 → 본문 키워드 줄 → 본문 아무 날짜. 기간(~)이면 끝 날짜. 추가 규칙: `'26.` 연도, 공백 섞인 요일 `( 월 )`, `정오`=12:00, `N시`=N:00. 유형: 마감형(신청·접수·제출·모집·마감) / 행사형 / 정보형(달력 제외).

## 심사 대응
- 숨은 단축키·미구현 UI 제거(3.1, 2.1), 알림 거부해도 알림탭 동작(4.3)
- 권한: storage, alarms, notifications. host는 Pages 도메인, content script `<all_urls>`(드래그 기능 사유를 상세 설명에 명시)
- 알림: 백그라운드가 1분마다 확인. 1시간 넘게 지난 시점(브라우저 꺼짐)은 "놓친 알림"으로 알림탭에만. 저장 전에 이미 지난 시점은 보내지 않음(`savedAt`·공지 수신 시각 기준)
- 원격 코드 없음(5.2), 개인정보 수집 없음, privacy.html 제공

## 테스트
- `node --test collector` : 추출 규칙(실제 공지 제목), 수집 변환(fixture)
- 웨일 "압축 해제된 확장앱 로드"로 6기능·드래그·놓친 알림 수동 확인

## 일정
10/9~12 레포·수집기·매핑 / 10/13~17 확장앱 / 10/18 스토어 1차 리뷰 요청 / 10/28 세미나. 병행: 키 기간 연장, Google OAuth 검증 신청.
