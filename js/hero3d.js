/* ============================================================
   Hero 3D Scene — Three.js
   Smooth high-poly shapes in Google brand colors, click-to-glow,
   lightning flicker, mouse/touch parallax, scroll camera drift.
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

  // Google brand palette
  const G = {
    red:    0xEA4335,
    blue:   0x4285F4,
    green:  0x34A853,
    yellow: 0xFBBC05,
    white:  0xffffff,
    ink:    0x0a0a0a,
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
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));

  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(5, 7, 6);
  scene.add(keyLight);

  const fillLeft = new THREE.PointLight(0xffffff, 1.1, 28);
  fillLeft.position.set(-7, 2, 4);
  scene.add(fillLeft);

  const fillRight = new THREE.PointLight(0xffffff, 0.9, 26);
  fillRight.position.set(7, -2, 4);
  scene.add(fillRight);

  const tintBlue = new THREE.PointLight(G.blue, 1.4, 22);
  tintBlue.position.set(-4, 3, 2);
  scene.add(tintBlue);

  const tintGreen = new THREE.PointLight(G.green, 1.2, 22);
  tintGreen.position.set(4, -3, 2);
  scene.add(tintGreen);

  // ⚡ Lightning bolt — short bright flashes
  const lightning = new THREE.PointLight(0xffffff, 0, 30);
  lightning.position.set(0, 4, 4);
  scene.add(lightning);

  /* ---------- Materials in Google colors ---------- */
  const mkSolid = (hex) => new THREE.MeshStandardMaterial({
    color: hex,
    metalness: 0.45,
    roughness: 0.28,
    emissive: hex,
    emissiveIntensity: 0.25,
  });
  const mkWire = (hex) => new THREE.MeshBasicMaterial({
    color: hex, wireframe: true, transparent: true, opacity: 0.7,
  });

  const matRed    = mkSolid(G.red);
  const matBlue   = mkSolid(G.blue);
  const matGreen  = mkSolid(G.green);
  const matYellow = mkSolid(G.yellow);
  const matWireRed    = mkWire(G.red);
  const matWireBlue   = mkWire(G.blue);
  const matWireGreen  = mkWire(G.green);
  const matWireYellow = mkWire(G.yellow);

  const palette = [
    matBlue, matRed, matYellow, matGreen,
    matWireBlue, matRed, matGreen, matWireYellow,
    matBlue, matGreen, matWireRed, matYellow,
  ];

  /* ---------- Particle dust ---------- */
  if (!lowPower) {
    const starsGeo = new THREE.BufferGeometry();
    const starsCount = 240;
    const positions = new Float32Array(starsCount * 3);
    const colorChoices = [G.red, G.blue, G.green, G.yellow];
    const colors = new Float32Array(starsCount * 3);
    for (let i = 0; i < starsCount; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 22;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 14 - 4;
      const c = new THREE.Color(colorChoices[i % 4]);
      colors[i * 3 + 0] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }
    starsGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    starsGeo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    const starsMat = new THREE.PointsMaterial({
      vertexColors: true,
      size: 0.06,
      transparent: true,
      opacity: 0.7,
    });
    scene.add(new THREE.Points(starsGeo, starsMat));
  }

  /* ---------- Smooth shapes (higher subdivision) ---------- */
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
      // Click-glow state
      glow: 0,
      pulse: 0,
      baseEmissive: mesh.material.emissiveIntensity ?? 0,
    };
    const scale = 0.8 + Math.random() * 0.5;
    mesh.userData.baseScale = scale;
    mesh.scale.setScalar(scale);
  };

  const buildShapes = (count) => {
    // High-subdivision geometries for smooth shading
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
      // Standard materials should be cloned so per-instance emissive tweaks
      // don't bleed across shapes that share a material
      const meshMat = mat.isMeshStandardMaterial ? mat.clone() : mat;
      const mesh = new THREE.Mesh(geos[i % geos.length], meshMat);
      placeMesh(mesh, i, count);
      scene.add(mesh);
      orbiters.push(mesh);
    }
  };

  buildShapes(lowPower ? 8 : 12);

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

  /* ---------- Click → glow (raycaster from hero clicks) ---------- */
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
    hit.userData.glow = 1;   // 1 → 0 over time, drives emissive
    hit.userData.pulse = 1;  // 1 → 0 over time, drives scale pulse
  };
  // Canvas has pointer-events: none, so listen on the hero section
  const hero = canvas.closest('.hero');
  if (hero) {
    hero.addEventListener('click', (e) => tryHit(e.clientX, e.clientY));
    hero.addEventListener('touchend', (e) => {
      if (e.changedTouches.length) {
        const t = e.changedTouches[0];
        tryHit(t.clientX, t.clientY);
      }
    });
    // Cursor hint when hovering a shape area
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
    lightningT = 0.55; // duration of the flash sequence in seconds
    // Randomize bolt position so it feels alive
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

    // Lightning: schedule + flicker amplitude over its lifetime
    nextStrikeAt -= dt;
    if (nextStrikeAt <= 0) {
      triggerStrike();
      nextStrikeAt = 3 + Math.random() * 6; // 3–9s gap
    }
    if (lightningT > 0) {
      lightningT -= dt;
      // Flicker: a noisy decaying envelope
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

      // Click → glow + pulse decay
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
