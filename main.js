/* ============================================
   VAPΞ KULTΞ — MAIN.JS
   Smoke Canvas + Cursor + Interactions
   ============================================ */

// ---- CURSOR GLOW ----
const cursorGlow = document.getElementById('cursorGlow');
document.addEventListener('mousemove', (e) => {
  cursorGlow.style.left = e.clientX + 'px';
  cursorGlow.style.top  = e.clientY + 'px';
});

// ---- SMOKE CANVAS ENGINE ----
const canvas = document.getElementById('smokeCanvas');
const ctx    = canvas.getContext('2d');

canvas.width  = window.innerWidth;
canvas.height = window.innerHeight;

window.addEventListener('resize', () => {
  canvas.width  = window.innerWidth;
  canvas.height = window.innerHeight;
});

class SmokeParticle {
  constructor(x, y, fromDevice) {
    this.fromDevice = fromDevice || false;
    this.x = x || Math.random() * canvas.width;
    this.y = y || canvas.height + 20;
    this.vx = (Math.random() - 0.5) * (fromDevice ? 1.2 : 0.5);
    this.vy = -(Math.random() * (fromDevice ? 2.5 : 1.2) + (fromDevice ? 1 : 0.4));
    this.radius = Math.random() * (fromDevice ? 30 : 50) + (fromDevice ? 8 : 15);
    this.maxRadius = this.radius * (fromDevice ? 5 : 4);
    this.opacity = Math.random() * 0.25 + 0.05;
    this.life = 0;
    this.maxLife = Math.random() * 200 + (fromDevice ? 120 : 180);
    this.rotation = Math.random() * Math.PI * 2;
    this.rotSpeed = (Math.random() - 0.5) * 0.02;

    // color variants
    const cols = [
      [0, 255, 231],   // teal
      [199, 125, 255], // purple
      [255, 45, 120],  // pink
      [255, 255, 255], // white
    ];
    const w = fromDevice ? [0.65, 0.15, 0.05, 0.15] : [0.4, 0.2, 0.1, 0.3];
    let r = Math.random(), cumW = 0;
    this.color = cols[0];
    for (let i = 0; i < cols.length; i++) {
      cumW += w[i];
      if (r < cumW) { this.color = cols[i]; break; }
    }
  }

  update() {
    this.life++;
    this.x += this.vx;
    this.y += this.vy;
    this.vx *= 0.995;
    this.vy *= 0.997;
    this.vx += (Math.random() - 0.5) * 0.08;
    this.radius = Math.min(this.radius * 1.012, this.maxRadius);
    this.rotation += this.rotSpeed;
    const prog = this.life / this.maxLife;
    if (prog < 0.2) {
      this.opacity = (prog / 0.2) * 0.2;
    } else {
      this.opacity = (1 - (prog - 0.2) / 0.8) * 0.2;
    }
  }

  draw() {
    if (this.opacity <= 0) return;
    ctx.save();
    ctx.translate(this.x, this.y);
    ctx.rotate(this.rotation);
    const [r, g, b] = this.color;
    const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, this.radius);
    grad.addColorStop(0,   `rgba(${r},${g},${b},${this.opacity})`);
    grad.addColorStop(0.4, `rgba(${r},${g},${b},${this.opacity * 0.5})`);
    grad.addColorStop(1,   `rgba(${r},${g},${b},0)`);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(0, 0, this.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  isDead() { return this.life >= this.maxLife; }
}

const particles = [];
let   frameCount = 0;

// Spawn position of the vape device tip in viewport
function getDeviceTipPos() {
  const emitter = document.getElementById('smokeEmitter');
  if (!emitter) return null;
  const rect = emitter.getBoundingClientRect();
  return { x: rect.left + rect.width / 2, y: rect.top };
}

function spawnParticles() {
  frameCount++;
  // Background ambient smoke
  if (frameCount % 4 === 0) {
    for (let i = 0; i < 2; i++) {
      particles.push(new SmokeParticle());
    }
  }
  // Device tip smoke — denser
  if (frameCount % 2 === 0) {
    const pos = getDeviceTipPos();
    if (pos) {
      for (let i = 0; i < 3; i++) {
        const p = new SmokeParticle(
          pos.x + (Math.random() - 0.5) * 8,
          pos.y + (Math.random() - 0.5) * 4,
          true
        );
        particles.push(p);
      }
    }
  }
}

function animateSmoke() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  spawnParticles();
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].isDead()) particles.splice(i, 1);
  }
  // Keep pool healthy
  if (particles.length > 600) particles.splice(0, 50);
  requestAnimationFrame(animateSmoke);
}

animateSmoke();

// ---- CURSOR TRAIL SMOKE on mouse click ----
document.addEventListener('click', (e) => {
  for (let i = 0; i < 12; i++) {
    const p = new SmokeParticle(
      e.clientX + (Math.random() - 0.5) * 20,
      e.clientY + (Math.random() - 0.5) * 20,
      true
    );
    p.vy = -(Math.random() * 3 + 1);
    particles.push(p);
  }
});

// ---- SCROLL REVEAL ----
const observerOptions = {
  root: null,
  rootMargin: '0px',
  threshold: 0.1
};

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      entry.target.classList.add('revealed');
      revealObserver.unobserve(entry.target);
    }
  });
}, observerOptions);

document.querySelectorAll('.product-card, .flavor-card, .lounge-card').forEach(el => {
  el.style.opacity = '0';
  el.style.transform = 'translateY(30px)';
  el.style.transition = 'opacity 0.7s cubic-bezier(.22,1,.36,1), transform 0.7s cubic-bezier(.22,1,.36,1)';
  revealObserver.observe(el);
});

document.addEventListener('animationend', () => {}, { passive: true });

// Trigger class
const styleEl = document.createElement('style');
styleEl.textContent = `
  .revealed {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;
document.head.appendChild(styleEl);

// Stagger delay for grid items
document.querySelectorAll('.products-grid .product-card').forEach((el, i) => {
  el.style.transitionDelay = (i * 0.08) + 's';
});
document.querySelectorAll('.flavors-grid .flavor-card').forEach((el, i) => {
  el.style.transitionDelay = (i * 0.07) + 's';
});

// ---- NAVBAR SCROLL EFFECT ----
const navbar = document.querySelector('.navbar');
window.addEventListener('scroll', () => {
  if (window.scrollY > 60) {
    navbar.style.background = 'rgba(5,5,10,0.95)';
    navbar.style.borderBottomColor = 'rgba(0,255,231,0.2)';
  } else {
    navbar.style.background = 'rgba(5,5,10,0.7)';
    navbar.style.borderBottomColor = 'rgba(0,255,231,0.12)';
  }
}, { passive: true });

// ---- ADD BUTTON SMOKE BURST ----
document.querySelectorAll('.add-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < 20; i++) {
      const p = new SmokeParticle(cx, cy, true);
      p.vy = -(Math.random() * 4 + 2);
      p.vx = (Math.random() - 0.5) * 4;
      particles.push(p);
    }
  });
});

// ---- GLITCH RANDOM TRIGGER ----
setInterval(() => {
  const el = document.querySelector('.glitch');
  if (!el) return;
  el.style.animation = 'none';
  void el.offsetWidth;
  el.style.animation = '';
}, 5000);

console.log(
  '%cVAPΞ KULTΞ\n%cCloud Culture. Premium Experience.',
  'color:#00ffe7;font-size:28px;font-weight:bold;font-family:monospace;',
  'color:#6b6b85;font-size:12px;font-family:monospace;'
);
