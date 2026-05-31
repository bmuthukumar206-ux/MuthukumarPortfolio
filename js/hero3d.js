/* ============================================================
   Hero 3D Scene — Three.js
   Smooth high-poly shapes in the site palette (accent + ink),
   click-to-glow, lightning flicker, parallax + scroll drift.
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
    accent:     0xff4d2e,
    accentSoft: 0xff8a66,
    ink:        0x0a0a0a,
    white:      0xffffff,
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

  const fillLeft = new THREE.PointLight(0xffffff, 1.0, 28);
  fillLeft.position.set(-7, 2, 4);
  scene.add(fillLeft);

  const fillRight = new THREE.PointLight(0xffffff, 0.85, 26);
  fillRight.position.set(7, -2, 4);
  scene.add(fillRight);

  const accentCenter = new THREE.PointLight(COLORS.accent, 2.4, 22);
  accentCenter.position.set(0, 0, 3);
  scene.add(accentCenter);

  const accentBack = new THREE.PointLight(COLORS.accentSoft, 1.6, 20);
  accentBack.position.set(-3, 4, -5);
  scene.add(accentBack);

  // Lightning bolt — short bright flashes
  const lightning = new THREE.PointLight(0xffffff, 0, 30);
  lightning.position.set(0, 4, 4);
  scene.add(lightning);

  /* ---------- Materials ---------- */
  const mkSolid = (hex) => new THREE.MeshStandardMaterial({
    color: hex,
    metalness: 0.45,
    roughness: 0.28,
    emissive: hex,
    emissiveIntensity: 0.22,
  });
  const mkWire = (hex) => new THREE.MeshBasicMaterial({
    color: hex, wireframe: true, transparent: true, opacity: 0.65,
  });

  const matAccent     = mkSolid(COLORS.accent);
  const matInk        = mkSolid(COLORS.ink);
  const matWireAccent = mkWire(COLORS.accent);
  const matWireInk    = mkWire(COLORS.ink);

  // Lean accent-heavy with ink + wireframes for variety
  const palette = [
    matAccent, matInk, matAccent, matWireAccent,
    matInk, matAccent, matWireInk, matAccent,
  ];

  /* ---------- Particle dust (accent) ---------- */
  if (!lowPower) {
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 200;
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
      opacity: 0.55,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));
  }

  /* ---------- Smooth shapes ---------- */
  const orbiters = [];

  const placeMesh = (mesh, i, total) => {
    const angle = (i / total) * Math.PI * 2 + Math.random() * 0.3;
    // Mobile: tighter orbit + smaller scale so shapes read as "little + far"
    const baseR  = lowPower ? 2.2 : 3.4;
    const varR   = lowPower ? 1.3 : 1.6;
    const baseS  = lowPower ? 0.42 : 0.8;
    const varS   = lowPower ? 0.28 : 0.5;
    const yRange = lowPower ? 2.2 : 2.8;

    const radius = baseR + Math.random() * varR;
    const yOffset = (Math.random() - 0.5) * yRange;
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
      glow: 0,
      pulse: 0,
      baseEmissive: mesh.material.emissiveIntensity ?? 0,
    };
    const scale = baseS + Math.random() * varS;
    mesh.userData.baseScale = scale;
    mesh.scale.setScalar(scale);
  };

  const buildShapes = (count) => {
    const geos = [
      new THREE.SphereGeometry(0.55, 48, 32),
      new THREE.IcosahedronGeometry(0.55, 2),
      new THREE.OctahedronGeometry(0.5, 2),
      new THREE.TorusGeometry(0.4, 0.14, 24, 64),
      new THREE.TorusKnotGeometry(0.32, 0.1, 128, 16),
      new THREE.DodecahedronGeometry(0.5, 0),
      new THREE.SphereGeometry(0.45, 64, 32),
    ];
    for (let i = 0; i < count; i++) {
      const mat = palette[i % palette.length];
      // Clone standard materials so click-glow doesn't bleed across shapes
      const meshMat = mat.isMeshStandardMaterial ? mat.clone() : mat;
      const mesh = new THREE.Mesh(geos[i % geos.length], meshMat);
      placeMesh(mesh, i, count);
      scene.add(mesh);
      orbiters.push(mesh);
    }
  };

  // Reduced counts: front-of-photo scene reads cleaner now
  buildShapes(lowPower ? 6 : 7);

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

  /* ---------- Click → glow (raycaster) ---------- */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const tryHit = (clientX, clientY) => {
    const rect = canvas.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return;
    ndc.x = ((clientX - rect.left) / rect.width) * 2 - 1;
    ndc.y = -((clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(orbiters, false);
    if (!hits.length) return;
    const hit = hits[0].object;
    hit.userData.glow = 1;
    hit.userData.pulse = 1;
  };
  const hero = canvas.closest('.hero');
  if (hero) {
    hero.addEventListener('click', (e) => tryHit(e.clientX, e.clientY));
    hero.addEventListener('touchend', (e) => {
      if (e.changedTouches.length) {
        const t = e.changedTouches[0];
        tryHit(t.clientX, t.clientY);
      }
    });
    hero.addEventListener('mousemove', (e) => {
      const rect = canvas.getBoundingClientRect();
      if (e.clientX < rect.left || e.clientX > rect.right) return;
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const hovering = raycaster.intersectObjects(orbiters, false).length > 0;
      hero.style.cursor = hovering ? 'pointer' : '';
    });
  }

  /* ---------- Scroll drive ---------- */
  let scrollY = window.scrollY;
  window.addEventListener('scroll', () => { scrollY = window.scrollY; }, { passive: true });

  /* ---------- Theme reactive ---------- */
  const applyThemeColors = () => {
    const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
    const inkColor = isDark ? 0xf3f3f1 : COLORS.ink;
    // Update originals + any cloned ink material instance still in the scene
    matInk.color.setHex(inkColor);
    matInk.emissive.setHex(inkColor);
    matWireInk.color.setHex(inkColor);
    orbiters.forEach((m) => {
      if (m.material.isMeshStandardMaterial && m.material.color.getHex() === (isDark ? 0x0a0a0a : 0xf3f3f1)) {
        m.material.color.setHex(inkColor);
        m.material.emissive.setHex(inkColor);
      }
    });
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

  /* ---------- Lightning scheduler ---------- */
  let lightningT = 0;
  let nextStrikeAt = 2 + Math.random() * 4;
  const triggerStrike = () => {
    lightningT = 0.55;
    lightning.position.set(
      (Math.random() - 0.5) * 8,
      2 + Math.random() * 4,
      2 + Math.random() * 3
    );
  };

  /* ---------- Render loop ---------- */
  const clock = new THREE.Clock();
  let visible = true;
  document.addEventListener('visibilitychange', () => {
    visible = document.visibilityState === 'visible';
    if (visible) clock.start();
  });

  let heroOnscreen = true;
  if ('IntersectionObserver' in window) {
    if (hero) {
      new IntersectionObserver((entries) => {
        entries.forEach((e) => { heroOnscreen = e.isIntersecting; });
      }, { rootMargin: '200px' }).observe(hero);
    }
  }

  let firstFrame = true;
  let lastT = 0;

  const tick = () => {
    requestAnimationFrame(tick);
    if (!visible || !heroOnscreen) return;

    const t = clock.getElapsedTime();
    const dt = Math.min(0.05, t - lastT);
    lastT = t;

    mouseX += (targetMouseX - mouseX) * 0.05;
    mouseY += (targetMouseY - mouseY) * 0.05;

    nextStrikeAt -= dt;
    if (nextStrikeAt <= 0) {
      triggerStrike();
      nextStrikeAt = 3 + Math.random() * 6;
    }
    if (lightningT > 0) {
      lightningT -= dt;
      const env = Math.max(0, lightningT / 0.55);
      const flicker = (Math.random() * 0.6 + 0.4) * env * env;
      lightning.intensity = flicker * 14;
    } else {
      lightning.intensity = 0;
    }

    for (let i = 0; i < orbiters.length; i++) {
      const s = orbiters[i];
      const u = s.userData;
      const angle = u.baseAngle + t * u.orbitSpeed * u.orbitDir;
      s.position.x = Math.cos(angle) * u.radius;
      s.position.z = Math.sin(angle) * u.radius - 1;
      s.position.y = u.yOffset + Math.sin(t * 0.6 + u.floatPhase) * 0.35;
      s.rotation.x += u.rotSpeedX;
      s.rotation.y += u.rotSpeedY;

      if (u.glow > 0 && s.material.isMeshStandardMaterial) {
        s.material.emissiveIntensity = u.baseEmissive + u.glow * 1.4;
        u.glow = Math.max(0, u.glow - dt * 0.9);
        if (u.glow === 0) s.material.emissiveIntensity = u.baseEmissive;
      }
      if (u.pulse > 0) {
        const k = 1 + u.pulse * 0.4;
        s.scale.setScalar(u.baseScale * k);
        u.pulse = Math.max(0, u.pulse - dt * 1.5);
        if (u.pulse === 0) s.scale.setScalar(u.baseScale);
      }
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
