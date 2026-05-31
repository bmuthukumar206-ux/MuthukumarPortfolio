/* ============================================================
   Hero 3D Scene — Three.js
   Floating extruded 3D letters that ASSEMBLE into "MUTHUKUMAR"
   as you scroll down. Multi-light rig + emissive accent.
   ============================================================ */

import * as THREE from 'three';
import { FontLoader } from 'three/addons/loaders/FontLoader.js';
import { TextGeometry } from 'three/addons/geometries/TextGeometry.js';

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
    cool: 0x6aa6ff, // subtle blue rim for contrast
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

  /* ---------- Lighting rig ----------
     Soft ambient + bright key + two fills + warm accent + cool rim,
     so the bevels on the extruded letters actually catch highlights. */
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
  // Palette ordered so the accent letters dominate visually
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

  /* ---------- 3D letters ---------- */
  const NAME = 'MUTHUKUMAR';
  const LETTER_SIZE = 0.85;
  const BASE_SPACING = 1.05; // tightness when assembled
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
  };

  const buildLetters = (font) => {
    const total = NAME.length;
    for (let i = 0; i < total; i++) {
      const geo = new TextGeometry(NAME[i], {
        font,
        size: LETTER_SIZE,
        height: 0.3,
        depth: 0.3,
        curveSegments: 6,
        bevelEnabled: true,
        bevelThickness: 0.045,
        bevelSize: 0.035,
        bevelOffset: 0,
        bevelSegments: 3,
      });
      geo.center();
      const mesh = new THREE.Mesh(geo, palette[i % palette.length]);
      placeMesh(mesh, i, total);
      mesh.userData.letterIndex = i;
      mesh.userData.totalLetters = total;
      scene.add(mesh);
      orbiters.push(mesh);
    }
  };

  // Decorative floating shapes — coexist with letters, always orbit (never assemble)
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
      // No letterIndex → animation loop treats this as decoration, no assembly
      scene.add(mesh);
      orbiters.push(mesh);
    }
  };

  // Always show the floating shapes as decor
  buildShapes(lowPower ? 5 : 8);

  // Load the font and add the assembling letters on top
  const fontLoader = new FontLoader();
  fontLoader.load(
    'https://unpkg.com/three@0.160.0/examples/fonts/helvetiker_bold.typeface.json',
    (font) => buildLetters(font),
    undefined,
    (err) => {
      console.warn('hero3d: font load failed, scene continues with shapes only', err);
    }
  );

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

  /* ---------- Resize & fit ---------- */
  let fitSpacing = BASE_SPACING;
  let fitScale = 1;
  const computeFit = () => {
    const fov = camera.fov * Math.PI / 180;
    const visibleH = 2 * Math.tan(fov / 2) * CAM_Z;
    const visibleW = visibleH * camera.aspect;
    const targetW = visibleW * 0.82;
    const naturalW = (NAME.length - 1) * BASE_SPACING + LETTER_SIZE;
    fitScale = Math.min(1, targetW / naturalW);
    fitSpacing = BASE_SPACING * fitScale;
  };

  const resize = () => {
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    if (!width || !height) return;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height, false);
    computeFit();
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

  // ease-in-out cubic
  const ease = (x) => x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const lerp = (a, b, t) => a + (b - a) * t;

  let firstFrame = true;

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible || !heroOnscreen) return;

    const t = clock.getElapsedTime();

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    // Assemble quickly — completed by 30% of viewport scroll so the name is
    // still on-screen when it locks into place.
    const assemble = Math.min(scrollY / (window.innerHeight * 0.3), 1);
    const a = ease(assemble);

    for (let i = 0; i < orbiters.length; i++) {
      const s = orbiters[i];
      const u = s.userData;

      // Scattered (orbit) position
      const angle = u.baseAngle + t * u.orbitSpeed * u.orbitDir;
      const sx = Math.cos(angle) * u.radius;
      const sz = Math.sin(angle) * u.radius - 1;
      const sy = u.yOffset + Math.sin(t * 0.6 + u.floatPhase) * 0.35;

      if (u.letterIndex !== undefined) {
        // Target (assembled) position — spell MUTHUKUMAR BELOW the portrait,
        // like a name plate beneath the photo.
        const tx = (u.letterIndex - (u.totalLetters - 1) / 2) * fitSpacing;
        const ty = -2.4;
        const tz = 0;

        s.position.x = lerp(sx, tx, a);
        s.position.y = lerp(sy, ty, a);
        s.position.z = lerp(sz, tz, a);

        // Spin freely when scattered, freeze upright when assembled
        const spinAmt = 1 - a;
        s.rotation.x += u.rotSpeedX * spinAmt;
        s.rotation.y += u.rotSpeedY * spinAmt;
        s.rotation.x = lerp(s.rotation.x, 0, a);
        s.rotation.y = lerp(s.rotation.y, 0, a);
        s.rotation.z = lerp(s.rotation.z, 0, a);

        // Scale: full when scattered, fit-to-viewport when assembled
        const sc = lerp(1, fitScale, a);
        s.scale.setScalar(sc);
      } else {
        // Fallback shapes — just orbit, no assembly
        s.position.set(sx, sy, sz);
        s.rotation.x += u.rotSpeedX;
        s.rotation.y += u.rotSpeedY;
      }
    }

    // Camera: parallax while scattered, ease back to straight-on for the name reveal
    const targetCamX = mouseX * 2.2 * (1 - a);
    const targetCamY = -mouseY * 1.4 * (1 - a);
    camera.position.x += (targetCamX - camera.position.x) * 0.05;
    camera.position.y += (targetCamY - camera.position.y) * 0.05;
    camera.lookAt(0, 0, 0);

    renderer.render(scene, camera);

    if (firstFrame && orbiters.length) {
      firstFrame = false;
      canvas.classList.add('is-ready');
    }
  };
  tick();
})();
