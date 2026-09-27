# iidxwidget-site

[IIDXwidget](https://github.com/Coldlapse/IIDXwidget) 소개·데모 페이지. GitHub Pages로 배포하는 정적 사이트입니다 (빌드 없음).

- 주소: https://iidxwidget.coldlapse.dev
- 한국어 / English (오른쪽 위 KO·EN, 처음에는 브라우저 언어를 따름)

## 구성

| 파일 | 내용 |
|---|---|
| `index.html` | 페이지 전체. 문장은 `<span lang="ko">`와 `<span lang="en">`를 나란히 두고 CSS로 한쪽만 보인다 |
| `style.css` | 스타일 (위젯과 같은 어두운 계기판 느낌) |
| `main.js` | 언어 전환, 데모 영상은 화면에 보일 때만 재생 (움직임 줄이기 설정이면 자동 재생 안 함) |
| `assets/` | 데모 영상(mp4)·포스터(jpg)·스크린샷, 개발자 이미지 |
| `favicon.svg`, `favicon-32.png`, `apple-touch-icon.png` | 사이트 아이콘 (턴테이블 모양) |
| `assets/og.png` | 링크 미리보기 이미지 1200×630 (디스코드·트위터). 위젯 디자인이 바뀌면 `combo.jpg`로 다시 그린다 |
| `CNAME` | GitHub Pages 사용자 지정 도메인 (`iidxwidget.coldlapse.dev`) |
| `.nojekyll` | Jekyll 처리 끄기 |

글꼴은 Google Fonts(Chakra Petch)와 jsDelivr(Pretendard)에서 불러옵니다.

## 데모 영상 다시 찍기

데모는 앱 저장소의 실제 위젯 화면을 Electron 오프스크린 창으로 30fps 녹화한 것입니다. 가상 입력을 앱의 세션 통계 모듈에 넣어 숫자도 실제처럼 움직입니다.
녹화 스크립트는 `tools/record-demo.js`입니다 (사용법은 파일 맨 위). 위젯 디자인이 바뀌면 다시 찍어 `assets/`를 바꿉니다. 채터링 영상과 정지 화면 몇 장은 같은 방식으로 따로 찍었습니다.

| 파일 | 장면 |
|---|---|
| `play.mp4` | 첫 화면: 13 KPS 정도로 치는 기본 화면 |
| `combo.mp4` | 입력 계기판·KPS 스피드미터·릴리즈·롱노트를 한 장면에 (KPS 7 → 46 → 12, 롱노트 섞음). 오른쪽 설명에 마우스를 올리면 영역을 강조 (`data-spot` 좌표는 520×380 기준) |
| `dp.mp4` | DP (1320×600) |
| `themes2.mp4` | 스크래치 이미지(움직이는 GIF 포함)와 이미지에 맞춘 색 세트 3가지 |
| `chatter.mp4` | 채터링 감지 창 강조 규칙 |

## 배포

### 1. 저장소와 Pages
1. GitHub에 이 저장소를 올린다 (`Coldlapse/iidxwidget-site`, 공개). `coldlapse.github.io` 저장소(메인 페이지)와는 별개다.
2. Settings → Pages → Source: `Deploy from a branch`, Branch: `main` / `/ (root)`.
3. Custom domain에 `iidxwidget.coldlapse.dev` (CNAME 파일과 같음) → DNS 확인 뒤 **Enforce HTTPS** 켜기.

### 2. iidxwidget.coldlapse.dev (Cloudflare DNS)
- `CNAME` 레코드: 이름 `iidxwidget`, 대상 `coldlapse.github.io`
- 처음에는 **DNS only(회색 구름)** 로 둔다. GitHub가 인증서를 발급한 뒤에는 프록시를 켜도 되지만, 켜려면 Cloudflare SSL 모드를 Full로.
- `.dev`는 HTTPS만 되는 도메인이라 인증서가 나오기 전(보통 몇 분~1시간)에는 접속되지 않는다.

### 3. 메인 페이지(coldlapse.dev)와 함께 쓰기
`coldlapse.github.io`는 Coldlapse 계정의 Pages 사이트 전체가 함께 쓰는 접속 지점이다. 여러 도메인이 모두 이 주소를 가리켜도 GitHub가 **들어온 도메인**으로 저장소를 고르므로 서로 부딪히지 않는다.

| 들어온 주소 | 보여주는 저장소 |
|---|---|
| `coldlapse.dev` | `Coldlapse/coldlapse.github.io` (메인 페이지, 그 저장소의 사용자 지정 도메인) |
| `iidxwidget.coldlapse.dev` | `Coldlapse/iidxwidget-site` (이 저장소의 `CNAME`) |

- 메인 페이지에 `coldlapse.dev`를 걸면, 자기 도메인이 없는 다른 Pages 저장소는 `coldlapse.dev/<저장소>/`로 열린다. 이 저장소는 자기 도메인이 있어서 `coldlapse.dev/iidxwidget-site/`로 들어와도 `iidxwidget.coldlapse.dev`로 옮겨진다.
- `coldlapse.dev`는 최상위 도메인이라 A 레코드 4개(`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`)나 이름 `@`의 CNAME(Cloudflare가 A처럼 처리)으로 연결한다.
- GitHub 계정 Settings → Pages에서 `coldlapse.dev` **도메인 인증**을 해 두면 다른 사람이 이 도메인을 자기 Pages에 걸어 가로채지 못한다.

## 비용

| 항목 | 비용 |
|---|---|
| GitHub Pages 호스팅 (공개 저장소) | 무료 |
| HTTPS 인증서 (GitHub Pages가 자동 발급) | 무료 |
| Cloudflare DNS (coldlapse.dev) | 무료 |
| 도메인 | 이미 가진 도메인의 하위 주소라 추가 비용 없음 (coldlapse.dev 갱신비는 그대로, Cloudflare 등록은 원가 수준) |
| **추가 비용 합계** | **0원** |

트래픽: 페이지 한 번 전체 보기 약 1.5MB (영상은 화면에 보일 때만 받음). GitHub Pages의 권장 한도(월 100GB)는 대략 월 6만 번 전체 조회에 해당하고, 사이트 크기 한도(1GB)에 비해 지금 사이트는 약 1.5MB입니다.
