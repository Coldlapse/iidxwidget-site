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
