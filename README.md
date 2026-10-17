# 앗!차차

흩어진 충남대 학과 공지와 웹에서 드래그한 공고의 마감일을 웨일 사이드바 달력에 모아, 놓치기 전에 알려주는 웨일 확장앱. 네이버 웨일 캠퍼스 크루 2기 WEAVE(충남대).

## 구조
```
extension/   웨일 확장앱(MV3, 빌드 없음) — 스토어 zip 대상
  sidebar.html · app.js   사이드바 UI(시안 마크업 그대로)
  core.js                 사이드바·백그라운드 공용 상태/일정 로직
  background.js           알림(1분 확인) · 학과 공지 새로고침(3시간) · 드래그 중계
  content.js              모든 사이트: 드래그 → "앗!차차에 저장" 버튼
  extract.js              마감일 추출 규칙(수집기와 공용)
  departments.json        학과 → 학내 게시판 매핑
collector/   학내 게시판 수집(Node, 의존성 없음) + 테스트
site/        GitHub Pages: data/{학과id}.json, privacy.html
docs/        설계 문서, 스토어 등록 문구
```

## 개발
```bash
node --test "collector/*.test.js"
```
웨일에서 `whale://extensions` → 개발자 모드 → "압축해제된 확장앱을 로드합니다" → `extension/` 선택.

## 수집기
`.github/workflows/collect.yml`이 하루 4회(9·12·15·18시 KST) `collector/collect.js`를 실행해 `site/data/`를 갱신하고 Pages에 배포한다.
- 레포 Settings → Secrets → Actions에 `CNU_KEY`(학내 게시판 API 접속키) 등록. 키는 코드·커밋에 넣지 않는다.
- Settings → Pages → Source: GitHub Actions. (private 레포는 GitHub Pro 필요)
- Settings → Variables → Actions에 `COLLECT_ENABLED=true`를 넣어야 워크플로가 돈다(그 전엔 건너뜀).
- 학과 매핑 다시 만들기: `node collector/build-map.js cmsBoard.json` (cmsBoard 응답 파일은 커밋 금지)

## 스토어 패키지
(PowerShell 5.1 `Compress-Archive`는 경로를 `icons\icon.png`처럼 역슬래시로 넣어 다른 OS·스토어에서 깨질 수 있어 쓰지 않는다)
```bash
python -c "import zipfile,os; z=zipfile.ZipFile('dist/attchacha.zip','w',zipfile.ZIP_DEFLATED); [z.write(os.path.join(r,f), os.path.relpath(os.path.join(r,f),'extension').replace(os.sep,'/')) for r,_,fs in os.walk('extension') for f in fs]"
```
