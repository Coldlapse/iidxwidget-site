# iidxwidget-site

[IIDXwidget](https://github.com/Coldlapse/IIDXwidget) 소개·데모 페이지. GitHub Pages로 배포하는 정적 사이트입니다 (빌드 없음).

- 주소: https://iidxwidget.beatmania.app (기본) / https://iidxwidget.coldlapse.dev (기본 주소로 이동)
- 한국어 / English (오른쪽 위 KO·EN, 처음에는 브라우저 언어를 따름)

## 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 페이지 전체. 문장은 `<span lang="ko">`와 `<span lang="en">`를 나란히 두고 CSS로 한쪽만 보인다 |
| `style.css` | 스타일 (위젯과 같은 어두운 계기판 느낌) |
| `main.js` | 언어 전환, 데모 영상은 화면에 보일 때만 재생 (움직임 줄이기 설정이면 자동 재생 안 함) |
| `assets/` | 데모 영상(mp4)·포스터(jpg)·스크린샷, 개발자 이미지 |
| `CNAME` | GitHub Pages 사용자 지정 도메인 (`iidxwidget.beatmania.app`) |
| `.nojekyll` | Jekyll 처리 끄기 |

글꼴은 Google Fonts(Chakra Petch)와 jsDelivr(Pretendard)에서 불러옵니다.

## 데모 영상 다시 찍기

데모는 앱 저장소의 실제 위젯 화면을 Electron 오프스크린 창으로 30fps 녹화한 것입니다. 가상 입력을 앱의 세션 통계 모듈에 넣어 숫자도 실제처럼 움직입니다.
녹화 스크립트는 `tools/record-demo.js`입니다 (사용법은 파일 맨 위). 위젯 디자인이 바뀌면 다시 찍어 `assets/`를 바꿉니다. 채터링 영상과 정지 화면 몇 장은 같은 방식으로 따로 찍었습니다.

| 파일 | 장면 |
|---|---|
| `play.mp4` | 13 KPS 정도로 치는 기본 화면 |
| `gauge.mp4` | KPS 6 → 46 → 14 (빨간 영역, 끝값 떨림) |
| `dp.mp4` | DP (1320×600) |
| `ln.mp4` | 롱노트 색 |
| `themes.mp4` | 색상 테마 바뀜 |
| `chatter.mp4` | 채터링 감지 창 강조 규칙 |

## 배포

### 1. 저장소와 Pages
1. GitHub에 이 저장소를 올린다 (예: `Coldlapse/iidxwidget-site`, 공개).
2. Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `/ (root)`.
3. Custom domain에 `iidxwidget.beatmania.app` (CNAME 파일과 같음) → DNS 확인 뒤 **Enforce HTTPS** 켜기.

### 2. iidxwidget.beatmania.app (Cloudflare DNS)
- `CNAME` 레코드: 이름 `iidxwidget`, 대상 `coldlapse.github.io`
- 처음에는 **DNS only(회색 구름)** 로 둔다. GitHub가 인증서를 발급한 뒤에는 프록시를 켜도 되지만, 켜려면 Cloudflare SSL 모드를 Full로.
- `.app`은 HTTPS만 되는 도메인이라 인증서가 나오기 전(보통 몇 분~1시간)에는 접속되지 않는다.

### 3. iidxwidget.coldlapse.dev → 기본 주소로 이동 (Cloudflare)
GitHub Pages는 저장소 하나에 도메인 하나만 붙일 수 있어서, 두 번째 주소는 이동만 시킨다. coldlapse.dev도 beatmania.app과 같은 Cloudflare 계정이라 Cloudflare 안에서 끝난다.
1. DNS: `AAAA` 레코드, 이름 `iidxwidget`, 값 `100::`, **프록시 켜기(주황 구름)**. 실제 서버 없이 Cloudflare가 요청을 받기 위한 자리표시 주소다.
2. Rules → Redirect Rules → 새 규칙:
   - 조건: Hostname equals `iidxwidget.coldlapse.dev`
   - 동작: Dynamic, 식 `concat("https://iidxwidget.beatmania.app", http.request.uri.path)`, 상태 코드 301, 쿼리 문자열 유지
3. `.dev`도 HTTPS만 되는 도메인이다. 프록시를 켜 두면 Cloudflare 인증서로 바로 HTTPS가 된다.

## 비용

| 항목 | 비용 |
|---|---|
| GitHub Pages 호스팅 (공개 저장소) | 무료 |
| HTTPS 인증서 (GitHub Pages가 자동 발급) | 무료 |
| Cloudflare DNS (beatmania.app) | 무료 |
| Cloudflare Redirect Rule (coldlapse.dev → beatmania.app) | 무료 (무료 요금제에 규칙 10개) |
| 도메인 | 이미 가진 도메인의 하위 주소라 추가 비용 없음 (beatmania.app·coldlapse.dev 갱신비는 그대로, Cloudflare 등록은 원가 수준) |
| **추가 비용 합계** | **0원** |

트래픽: 페이지 한 번 전체 보기 약 1.5MB (영상은 화면에 보일 때만 받음). GitHub Pages의 권장 한도(월 100GB)는 대략 월 6만 번 전체 조회에 해당하고, 사이트 크기 한도(1GB)에 비해 지금 사이트는 약 1.5MB입니다.
