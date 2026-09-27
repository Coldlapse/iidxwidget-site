// 언어 전환(한국어/English)과 데모 영상 재생
(function () {
  const root = document.documentElement;

  // 언어: 저장된 값 → 브라우저 언어 순. 한국어가 아니면 영어
  function setLang(lang) {
    root.dataset.lang = lang;
    root.lang = lang;
    document.querySelectorAll('[data-set-lang]').forEach(b => b.classList.toggle('active', b.dataset.setLang === lang));
    try { localStorage.setItem('lang', lang); } catch (e) {}
  }
  let saved = null;
  try { saved = localStorage.getItem('lang'); } catch (e) {}
  setLang(saved || ((navigator.language || '').toLowerCase().startsWith('ko') ? 'ko' : 'en'));
  document.querySelectorAll('[data-set-lang]').forEach(b => b.addEventListener('click', () => setLang(b.dataset.setLang)));

  // 한 장면 + 영역 강조: 항목에 마우스를 올리거나(키보드 포커스, 터치로 누름) 하면 영상에서 그 영역만 밝게 두고 살짝 확대한다
  const W = 520, H = 380; // 영상 크기 (data-spot 좌표 기준)
  const ZOOM = 1.18;
  document.querySelectorAll('.spotlight').forEach(block => {
    const stage = block.querySelector('.spot-stage');
    const path = block.querySelector('.spot-mask path');
    const items = [...block.querySelectorAll('.spot-item')];
    const rects = item => item.dataset.spot.split(';').map(r => r.split(',').map(Number));

    function show(item) {
      items.forEach(i => i.classList.toggle('on', i === item));
      block.classList.toggle('active', !!item);
      if (!item) {
        stage.style.transform = '';
        return;
      }
      const list = rects(item);
      // 바깥 전체를 칠하고 영역마다 구멍을 낸다 (evenodd)
      path.setAttribute('d', `M0 0H${W}V${H}H0Z ` + list.map(([x, y, w, h]) => `M${x} ${y}h${w}v${h}h${-w}Z`).join(' '));
      // 영역들을 모두 감싸는 사각형의 가운데 쪽으로 확대
      const x1 = Math.min(...list.map(r => r[0])), y1 = Math.min(...list.map(r => r[1]));
      const x2 = Math.max(...list.map(r => r[0] + r[2])), y2 = Math.max(...list.map(r => r[1] + r[3]));
      const zoom = Math.min(ZOOM, W / (x2 - x1), H / (y2 - y1));
      stage.style.transformOrigin = `${((x1 + x2) / 2 / W) * 100}% ${((y1 + y2) / 2 / H) * 100}%`;
      stage.style.transform = `scale(${zoom.toFixed(3)})`;
    }

    items.forEach(item => {
      item.addEventListener('mouseenter', () => show(item));
      item.addEventListener('focus', () => show(item));
      item.addEventListener('click', event => { if (!event.target.closest('a')) show(item.classList.contains('on') ? null : item); });
    });
    block.querySelector('.spot-list').addEventListener('mouseleave', () => show(null));
    block.addEventListener('focusout', event => { if (!block.contains(event.relatedTarget)) show(null); });
  });

  // GitHub 실시간 숫자: 누적 다운로드(모든 릴리스의 설치 파일 .exe 다운로드 합), 스타, 기여자 수, 최신 버전.
  // latest.yml·.blockmap은 앱의 업데이트 확인이 받아 가는 파일이라 다운로드 수에서 뺀다.
  // 로그인 없는 GitHub API는 IP당 시간당 60회라 한 시간 동안 브라우저에 저장해 두고 다시 쓴다. 못 받으면 숫자를 숨긴 채 둔다.
  (function githubStats() {
    const REPO = 'https://api.github.com/repos/Coldlapse/IIDXwidget';
    const CACHE_KEY = 'ghStats';
    const CACHE_MS = 60 * 60 * 1000;
    const show = stats => {
      const locale = root.dataset.lang === 'en' ? 'en-US' : 'ko-KR';
      let any = false;
      document.querySelectorAll('[data-gh]').forEach(el => {
        const value = stats[el.dataset.gh];
        if (value === undefined || value === null) return;
        el.querySelectorAll('[data-gh-value]').forEach(b => { b.textContent = typeof value === 'number' ? value.toLocaleString(locale) : value; });
        el.hidden = false;
        any = true;
      });
      const meta = document.querySelector('.gh-meta');
      if (meta && any) meta.hidden = false;
    };
    let cached = null;
    try { cached = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); } catch (e) {}
    if (cached && Date.now() - cached.at < CACHE_MS) { show(cached.stats); return; }
    const get = url => fetch(url, { headers: { Accept: 'application/vnd.github+json' } }).then(r => (r.ok ? r.json() : Promise.reject(r.status)));
    Promise.allSettled([get(REPO), get(REPO + '/releases?per_page=100'), get(REPO + '/contributors?per_page=100')])
      .then(([repo, releases, contributors]) => {
        const stats = {};
        if (repo.status === 'fulfilled') stats.stars = repo.value.stargazers_count;
        if (releases.status === 'fulfilled' && Array.isArray(releases.value)) {
          stats.downloads = releases.value.reduce((sum, rel) => sum + (rel.assets || [])
            .filter(a => /\.exe$/i.test(a.name)).reduce((s, a) => s + (a.download_count || 0), 0), 0);
          const latest = releases.value.find(rel => !rel.draft && !rel.prerelease);
          if (latest) stats.version = latest.tag_name;
        }
        if (contributors.status === 'fulfilled' && Array.isArray(contributors.value)) stats.contributors = contributors.value.length;
        if (!Object.keys(stats).length) return;
        show(stats);
        try { localStorage.setItem(CACHE_KEY, JSON.stringify({ at: Date.now(), stats })); } catch (e) {}
      });
    // 언어를 바꾸면 숫자 형식(천 단위 구분)도 다시
    document.querySelectorAll('[data-set-lang]').forEach(b => b.addEventListener('click', () => {
      try { const c = JSON.parse(localStorage.getItem(CACHE_KEY) || 'null'); if (c) show(c.stats); } catch (e) {}
    }));
  })();

  // 데모 영상: 화면에 보일 때만 재생 (움직임 줄이기 설정이면 자동 재생하지 않고 재생 버튼만)
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const videos = document.querySelectorAll('video.demo');
  if (reduceMotion) {
    videos.forEach(v => { v.controls = true; });
    return;
  }
  const observer = new IntersectionObserver(entries => {
    entries.forEach(({ target, isIntersecting }) => {
      if (isIntersecting) {
        if (target.preload === 'none') target.preload = 'auto';
        target.play().catch(() => {});
      } else {
        target.pause();
      }
    });
  }, { threshold: 0.35 });
  videos.forEach(v => observer.observe(v));
})();
