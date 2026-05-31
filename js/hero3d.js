/* ============================================================
   Hero 3D Scene — Three.js
   Floating low-poly shapes orbiting a central icosahedron,
   mouse-controlled camera parallax, scroll-driven scale.
   Inspired by jesse-zhou.com vibes (without the custom assets).
   ============================================================ */

import * as THREE from 'three';

(() => {
  const canvas = document.querySelector('[data-hero-3d]');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  // Detect low-power surfaces — cut scene density on phones
  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const isNarrow = window.innerWidth < 700;
  const lowPower = isCoarse || isNarrow;

  const COLORS = {
    accent: 0xff4d2e,
    ink: 0x0a0a0a,
    light: 0xffffff,
  };

  let width = canvas.clientWidth || window.innerWidth;
  let height = canvas.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();

  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, 9);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
  renderer.setSize(width, height, false);

  /* ---------- Lighting ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const dirLight = new THREE.DirectionalLight(0xffffff, 0.7);
  dirLight.position.set(4, 6, 5);
  scene.add(dirLight);
  const accentLight = new THREE.PointLight(COLORS.accent, 1.6, 22);
  accentLight.position.set(0, 0, 3);
  scene.add(accentLight);
  const rimLight = new THREE.PointLight(0xffffff, 0.5, 18);
  rimLight.position.set(-5, 4, -3);
  scene.add(rimLight);

  /* ---------- Center feature shape ---------- */
  const featureGeo = new THREE.IcosahedronGeometry(1.35, 0);
  const featureMat = new THREE.MeshStandardMaterial({
    color: COLORS.accent,
    metalness: 0.25,
    roughness: 0.4,
    flatShading: true,
    transparent: true,
    opacity: 0.92,
  });
  const feature = new THREE.Mesh(featureGeo, featureMat);
  feature.position.set(0, 0, -2.5);
  scene.add(feature);

  // Wireframe halo around feature
  const haloGeo = new THREE.IcosahedronGeometry(1.6, 0);
  const haloMat = new THREE.MeshBasicMaterial({
    color: COLORS.accent,
    wireframe: true,
    transparent: true,
    opacity: 0.35,
  });
  const halo = new THREE.Mesh(haloGeo, haloMat);
  halo.position.copy(feature.position);
  scene.add(halo);

  /* ---------- Orbiting shapes ---------- */
  const shapeGeos = [
    new THREE.IcosahedronGeometry(0.55, 0),
    new THREE.OctahedronGeometry(0.5, 0),
    new THREE.TorusGeometry(0.4, 0.13, 14, 28),
    new THREE.TorusKnotGeometry(0.32, 0.1, 56, 8),
    new THREE.TetrahedronGeometry(0.6, 0),
    new THREE.DodecahedronGeometry(0.45, 0),
  ];

  const matAccent = new THREE.MeshStandardMaterial({
    color: COLORS.accent, metalness: 0.3, roughness: 0.4, flatShading: true,
  });
  const matInk = new THREE.MeshStandardMaterial({
    color: COLORS.ink, metalness: 0.35, roughness: 0.55, flatShading: true,
  });
  const matWire = new THREE.MeshBasicMaterial({
    color: COLORS.accent, wireframe: true, transparent: true, opacity: 0.6,
  });
  const matWireInk = new THREE.MeshBasicMaterial({
    color: COLORS.ink, wireframe: true, transparent: true, opacity: 0.4,
  });
  const palette = [matAccent, matInk, matWire, matWireInk, matAccent, matWire];

  const count = lowPower ? 6 : 11;
  const shapes = [];
  for (let i = 0; i < count; i++) {
    const geo = shapeGeos[i % shapeGeos.length];
    const mat = palette[i % palette.length];
    const mesh = new THREE.Mesh(geo, mat);

    const angle = (i / count) * Math.PI * 2 + Math.random() * 0.4;
    const radius = 3.2 + Math.random() * 1.8;
    const yOffset = (Math.random() - 0.5) * 3;
    mesh.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius - 1);

    mesh.userData = {
      baseAngle: angle,
      radius,
      yOffset,
      orbitSpeed: 0.08 + Math.random() * 0.12,
      orbitDir: Math.random() > 0.5 ? 1 : -1,
      rotSpeedX: (Math.random() - 0.5) * 0.014,
      rotSpeedY: (Math.random() - 0.5) * 0.014,
      floatPhase: Math.random() * Math.PI * 2,
    };
    const scale = 0.75 + Math.random() * 0.55;
    mesh.scale.setScalar(scale);
    scene.add(mesh);
    shapes.push(mesh);
  }

  /* ---------- Particle dust ---------- */
  if (!lowPower) {
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 220;
    const positions = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starsMat = new THREE.PointsMaterial({
      color: COLORS.accent,
      size: 0.04,
      transparent: true,
      opacity: 0.55,
    });
    const stars = new THREE.Points(starsGeo, starsMat);
    scene.add(stars);
  }

  /* ---------- Mouse / touch parallax ---------- */
  let targetMouseX = 0, targetMouseY = 0;
  let mouseX = 0, mouseY = 0;
  const onMove = (clientX, clientY) => {
    targetMouseX = (clientX / window.innerWidth - 0.5);
    targetMouseY = (clientY / window.innerHeight - 0.5);
  };
  window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY), { passive: true });
  window.addEventListener('touchmove', (e) => {
    if (e.touches.length) onMove(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  /* ---------- Scroll drive ---------- */
  let scrollY = window.scrollY;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ---------- Theme reactive: dim/brighten on dark ---------- */
  const applyThemeColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const inkColor = isDark ? 0xf3f3f1 : COLORS.ink;
    matInk.color.setHex(inkColor);
    matWireInk.color.setHex(inkColor);
  };
  applyThemeColors();
  new MutationObserver(applyThemeColors).observe(document.documentElement, {
    attributes: true, attributeFilter: ['data-theme'],
  });

  /* ---------- Resize ---------- */
  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
  };
  window.addEventListener('resize', resize);
  // Re-measure after fonts load & layout settles
  requestAnimationFrame(resize);
  setTimeout(resize, 300);

  /* ---------- Render loop ---------- */
  const clock = new THREE.Clock();
  let visible = true;

  // Pause when tab hidden
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (visible) clock.start();
  });

  // Pause when hero scrolled out of view (saves battery)
  let heroOnscreen = true;
  if ('IntersectionObserver' in window) {
    const hero = canvas.closest('.hero');
    if (hero) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { heroOnscreen = e.isIntersecting; });
      }, { rootMargin: '100px' }).observe(hero);
    }
  }

  // Fade-in after first frame
  let firstFrame = true;

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible || !heroOnscreen) return;

    const t = clock.getElapsedTime();

    // Smooth pointer
    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Orbit + spin shapes
    for (let i = 0; i < shapes.length; i++) {
      const s = shapes[i];
      const u = s.userData;
      const angle = u.baseAngle + t * u.orbitSpeed * u.orbitDir;
      s.position.x = Math.cos(angle) * u.radius;
      s.position.z = Math.sin(angle) * u.radius - 1;
      s.position.y = u.yOffset + Math.sin(t * 0.6 + u.floatPhase) * 0.35;
      s.rotation.x += u.rotSpeedX;
      s.rotation.y += u.rotSpeedY;
    }

    // Feature shape: slow tumble, scroll-driven scale
    feature.rotation.x = t * 0.18;
    feature.rotation.y = t * 0.22;
    halo.rotation.x = -t * 0.12;
    halo.rotation.y = -t * 0.15;
    const scrollFactor = Math.min(scrollY / 800, 1);
    const targetScale = 1 - scrollFactor * 0.4;
    feature.scale.setScalar(targetScale + Math.sin(t * 1.2) * 0.02);
    halo.scale.setScalar(targetScale * 1.05);

    // Camera parallax + slight scroll drift
    camera.position.x += (mouseX * 2.2 - camera.position.x) * 0.04;
    camera.position.y += (-mouseY * 1.4 - scrollFactor * 1.2 - camera.position.y) * 0.04;
    camera.lookAt(0, 0, -1);

    renderer.render(scene, camera);

    if (firstFrame) {
      firstFrame = false;
      canvas.classList.add('is-ready');
    }
  };
  tick();
})();
