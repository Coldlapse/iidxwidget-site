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
