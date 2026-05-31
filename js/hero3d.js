/* ============================================================
   Hero 3D Scene — Three.js
   Floating low-poly shapes with multi-light rig + mouse/touch
   parallax and scroll-driven camera drift. Letters reverted
   to static HTML (see .hero__name / .hero__namek).
   ============================================================ */

import * as THREE from 'three';

(() => {
  const canvas = document.querySelector('[data-hero-3d]');
  if (!canvas) return;

  const prefersReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReduced) return;

  const isCoarse = window.matchMedia('(pointer: coarse)').matches;
  const isNarrow = window.innerWidth < 700;
  const lowPower = isCoarse || isNarrow;

  const COLORS = {
    accent: 0xff4d2e,
    accentSoft: 0xff8a66,
    ink: 0x0a0a0a,
    light: 0xffffff,
    cool: 0x6aa6ff,
  };

  let width = canvas.clientWidth || window.innerWidth;
  let height = canvas.clientHeight || window.innerHeight;

  const scene = new THREE.Scene();

  const CAM_Z = 9;
  const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
  camera.position.set(0, 0, CAM_Z);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    alpha: true,
    antialias: true,
    powerPreference: 'high-performance',
  });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower ? 1.5 : 2));
  renderer.setSize(width, height, false);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  /* ---------- Lighting rig ---------- */
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(5, 7, 6);
  scene.add(keyLight);

  const fillLeft = new THREE.PointLight(0xffffff, 1.1, 28);
  fillLeft.position.set(-7, 2, 4);
  scene.add(fillLeft);

  const fillRight = new THREE.PointLight(0xffffff, 0.9, 26);
  fillRight.position.set(7, -2, 4);
  scene.add(fillRight);

  const accentCenter = new THREE.PointLight(COLORS.accent, 2.6, 20);
  accentCenter.position.set(0, 0, 3);
  scene.add(accentCenter);

  const accentBack = new THREE.PointLight(COLORS.accentSoft, 1.8, 18);
  accentBack.position.set(-3, 4, -5);
  scene.add(accentBack);

  const coolRim = new THREE.PointLight(COLORS.cool, 0.9, 20);
  coolRim.position.set(4, -4, -4);
  scene.add(coolRim);

  /* ---------- Materials ---------- */
  const matAccent = new THREE.MeshStandardMaterial({
    color: COLORS.accent,
    metalness: 0.45,
    roughness: 0.28,
    emissive: COLORS.accent,
    emissiveIntensity: 0.35,
  });
  const matInk = new THREE.MeshStandardMaterial({
    color: COLORS.ink,
    metalness: 0.6,
    roughness: 0.32,
  });
  const matWire = new THREE.MeshBasicMaterial({
    color: COLORS.accent, wireframe: true, transparent: true, opacity: 0.75,
  });
  const matWireInk = new THREE.MeshBasicMaterial({
    color: COLORS.ink, wireframe: true, transparent: true, opacity: 0.5,
  });
  const palette = [matAccent, matInk, matAccent, matWire, matAccent, matInk, matWireInk, matAccent, matInk, matAccent];

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
      size: 0.05,
      transparent: true,
      opacity: 0.6,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));
  }

  /* ---------- Floating shapes ---------- */
  const orbiters = [];

  const placeMesh = (mesh, i, total) => {
    const angle = (i / total) * Math.PI * 2 + Math.random() * 0.3;
    const radius = 3.4 + Math.random() * 1.6;
    const yOffset = (Math.random() - 0.5) * 2.8;
    mesh.position.set(Math.cos(angle) * radius, yOffset, Math.sin(angle) * radius - 1);
    mesh.userData = {
      baseAngle: angle,
      radius,
      yOffset,
      orbitSpeed: 0.05 + Math.random() * 0.08,
      orbitDir: Math.random() > 0.5 ? 1 : -1,
      rotSpeedX: (Math.random() - 0.5) * 0.009,
      rotSpeedY: (Math.random() - 0.5) * 0.011,
      floatPhase: Math.random() * Math.PI * 2,
    };
    const scale = 0.8 + Math.random() * 0.5;
    mesh.scale.setScalar(scale);
  };

  const buildShapes = (count) => {
    const geos = [
      new THREE.IcosahedronGeometry(0.55, 0),
      new THREE.OctahedronGeometry(0.5, 0),
      new THREE.TorusGeometry(0.4, 0.13, 14, 28),
      new THREE.TetrahedronGeometry(0.6, 0),
      new THREE.DodecahedronGeometry(0.45, 0),
      new THREE.TorusKnotGeometry(0.3, 0.09, 56, 8),
    ];
    for (let i = 0; i < count; i++) {
      const mesh = new THREE.Mesh(geos[i % geos.length], palette[i % palette.length]);
      placeMesh(mesh, i, count);
      scene.add(mesh);
      orbiters.push(mesh);
    }
  };

  buildShapes(lowPower ? 7 : 11);

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

  /* ---------- Theme reactive ---------- */
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
  requestAnimationFrame(resize);
  setTimeout(resize, 300);

  /* ---------- Render loop ---------- */
  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (visible) clock.start();
  });

  let heroOnscreen = true;
  if ('IntersectionObserver' in window) {
    const hero = canvas.closest('.hero');
    if (hero) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { heroOnscreen = e.isIntersecting; });
      }, { rootMargin: '200px' }).observe(hero);
    }
  }

  let firstFrame = true;

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible || !heroOnscreen) return;

    const t = clock.getElapsedTime();

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    for (let i = 0; i < orbiters.length; i++) {
      const s = orbiters[i];
      const u = s.userData;
      const angle = u.baseAngle + t * u.orbitSpeed * u.orbitDir;
      s.position.x = Math.cos(angle) * u.radius;
      s.position.z = Math.sin(angle) * u.radius - 1;
      s.position.y = u.yOffset + Math.sin(t * 0.6 + u.floatPhase) * 0.35;
      s.rotation.x += u.rotSpeedX;
      s.rotation.y += u.rotSpeedY;
    }

    const scrollFactor = Math.min(scrollY / 800, 1);
    camera.position.x += (mouseX * 2.2 - camera.position.x) * 0.05;
    camera.position.y += (-mouseY * 1.4 - scrollFactor * 1.2 - camera.position.y) * 0.05;
    camera.lookAt(0, 0, -1);

    renderer.render(scene, camera);

    if (firstFrame && orbiters.length) {
      firstFrame = false;
      canvas.classList.add('is-ready');
    }
  };
  tick();
})();
