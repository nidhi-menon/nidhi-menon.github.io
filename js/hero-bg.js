(() => {
  'use strict';

  const hero = document.getElementById('hero');
  const canvas = document.getElementById('hero-particles-canvas');
  const ctx = canvas.getContext('2d');

  let particles = [];
  let animationId = null;
  let mouse = { x: null, y: null };

  const accent = { r: 61, g: 124, b: 138 };
  const maxDist = 120;

  function init() {
    const rect = hero.getBoundingClientRect();
    canvas.width = rect.width;
    canvas.height = rect.height;

    const count = Math.floor((rect.width * rect.height) / 8000);
    particles = [];

    for (let i = 0; i < count; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
      });
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < particles.length; i++) {
      const p = particles[i];
      p.x += p.vx;
      p.y += p.vy;

      if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, 0.25)`;
      ctx.fill();

      for (let j = i + 1; j < particles.length; j++) {
        const q = particles[j];
        const dx = p.x - q.x;
        const dy = p.y - q.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < maxDist) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(q.x, q.y);
          ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${0.08 * (1 - dist / maxDist)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }

      if (mouse.x !== null) {
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          ctx.beginPath();
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${accent.r}, ${accent.g}, ${accent.b}, ${0.15 * (1 - dist / 150)})`;
          ctx.lineWidth = 0.8;
          ctx.stroke();
        }
      }
    }

    animationId = requestAnimationFrame(draw);
  }

  hero.addEventListener('mousemove', (e) => {
    const rect = hero.getBoundingClientRect();
    mouse.x = e.clientX - rect.left;
    mouse.y = e.clientY - rect.top;
  });

  hero.addEventListener('mouseleave', () => {
    mouse.x = null;
    mouse.y = null;
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(() => {
      cancelAnimationFrame(animationId);
      init();
      draw();
    }, 200);
  });

  init();
  draw();

  // --- Typed role animation ---
  const roles = [
    'Machine Learning Engineer',
    'Search & Recommendations',
    'NLP & GenAI',
    'Technical Leadership',
  ];

  const typedEl = document.getElementById('typed-role');
  let roleIndex = 0;
  let charIndex = 0;
  let isDeleting = false;

  const TYPE_SPEED = 80;
  const DELETE_SPEED = 40;
  const PAUSE_AFTER_TYPE = 2400;
  const PAUSE_AFTER_DELETE = 600;

  function typeRole() {
    const current = roles[roleIndex];

    if (!isDeleting) {
      typedEl.textContent = current.slice(0, charIndex + 1);
      charIndex++;

      if (charIndex === current.length) {
        isDeleting = true;
        setTimeout(typeRole, PAUSE_AFTER_TYPE);
        return;
      }
      setTimeout(typeRole, TYPE_SPEED);
    } else {
      typedEl.textContent = current.slice(0, charIndex - 1);
      charIndex--;

      if (charIndex === 0) {
        isDeleting = false;
        roleIndex = (roleIndex + 1) % roles.length;
        setTimeout(typeRole, PAUSE_AFTER_DELETE);
        return;
      }
      setTimeout(typeRole, DELETE_SPEED);
    }
  }

  typeRole();
})();
