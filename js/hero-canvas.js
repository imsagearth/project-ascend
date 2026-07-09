(function () {
  var canvas = document.getElementById('bgCanvas');
  if (!canvas) return;

  var ctx = canvas.getContext('2d');
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var width = 0, height = 0;

  var TIER_COLOR = { core: '224,250,255', bright: '150,236,255', mid: '20,220,245', dim: '15,110,140' };
  var WARM_COLORS = ['255,214,170', '255,150,120'];
  var CURSOR_RADIUS = 140;
  var CURSOR_PULL = 14;

  function layout() {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width * DPR;
    canvas.height = height * DPR;
    canvas.style.width = width + 'px';
    canvas.style.height = height + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function drawSparkleStar(cx, cy, r, points, innerRatio, rotation) {
    ctx.beginPath();
    var step = Math.PI / points;
    for (var i = 0; i < points * 2; i++) {
      var angle = step * i - Math.PI / 2 + rotation;
      var radius = i % 2 === 0 ? r : r * innerRatio;
      var x = cx + Math.cos(angle) * radius;
      var y = cy + Math.sin(angle) * radius;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
  }

  // ---------- Nebula texture (faint dark-navy/teal clouds, scattered evenly) ----------
  var NEBULA_COUNT = 5;
  var nebulae = [];
  function buildNebulae() {
    nebulae = [];
    for (var i = 0; i < NEBULA_COUNT; i++) {
      nebulae.push({
        x: ((i + 0.5) / NEBULA_COUNT) * width + (Math.random() - 0.5) * width * 0.18,
        y: Math.random() * height,
        r: 200 + Math.random() * 180,
        color: Math.random() < 0.5 ? '6,60,70' : '10,25,30',
        opacity: 0.05 + Math.random() * 0.05,
        phase: Math.random() * Math.PI * 2
      });
    }
  }
  function drawNebulae() {
    for (var i = 0; i < nebulae.length; i++) {
      var n = nebulae[i];
      var dx = Math.sin(t * 0.05 + n.phase) * 22 + parX * 0.25;
      var dy = Math.cos(t * 0.04 + n.phase) * 16 + parY * 0.25;
      var g = ctx.createRadialGradient(n.x + dx, n.y + dy, 0, n.x + dx, n.y + dy, n.r);
      g.addColorStop(0, 'rgba(' + n.color + ',' + n.opacity + ')');
      g.addColorStop(1, 'rgba(' + n.color + ',0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(n.x + dx, n.y + dy, n.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // ---------- Stars: real 4/6-point sparkle shapes, drifting slowly upward, looping ----------
  var STAR_COUNT = 150;
  var stars = [];
  function spawnStar() {
    var big = Math.random() < 0.12;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      r: big ? Math.random() * 1.8 + 2.2 : Math.random() * 1.3 + 1,
      points: Math.random() < 0.5 ? 4 : 6,
      innerRatio: 0.22 + Math.random() * 0.1,
      rotation: Math.random() * Math.PI,
      glow: big,
      phase: Math.random() * Math.PI * 2,
      speed: 0.3 + Math.random() * 1.0,
      rise: 2 + Math.random() * 4
    };
  }
  function buildStars() {
    stars = [];
    for (var i = 0; i < STAR_COUNT; i++) stars.push(spawnStar());
  }
  function drawStars(dt) {
    for (var i = 0; i < stars.length; i++) {
      var s = stars[i];
      if (!reducedMotion) {
        s.y -= s.rise * dt;
        if (s.y < -20) { s.y = height + 20; s.x = Math.random() * width; }
      }
      var sx = s.x + parX * 0.5, sy = s.y + parY * 0.5;
      var twinkle = 0.35 + Math.sin(t * s.speed + s.phase) * 0.3 + 0.3;
      var dx = sx - cursorX, dy = sy - cursorY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var boost = dist < CURSOR_RADIUS ? (1 - dist / CURSOR_RADIUS) * 0.9 : 0;
      var a = Math.min(twinkle + boost, 1.4);
      if (s.glow || boost > 0) {
        var glowR = s.r * (s.glow ? 5 : 4) * (1 + boost * 0.6);
        var g = ctx.createRadialGradient(sx, sy, 0, sx, sy, glowR);
        g.addColorStop(0, 'rgba(150,236,255,' + (a * 0.5).toFixed(3) + ')');
        g.addColorStop(1, 'rgba(150,236,255,0)');
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.arc(sx, sy, glowR, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.fillStyle = 'rgba(220,248,255,' + Math.min(a * 0.85, 1).toFixed(3) + ')';
      drawSparkleStar(sx, sy, s.r * (1 + boost * 0.5), s.points, s.innerRatio, s.rotation);
    }
  }

  // ---------- Rising particles, spread evenly across the full viewport ----------
  var RISE_COUNT = reducedMotion ? 0 : 140;
  var riseParticles = [];
  function spawnRiseParticle() {
    var r = Math.random();
    var tier = r < 0.5 ? 'mid' : r < 0.8 ? 'bright' : 'core';
    var isWarm = Math.random() < 0.05;
    return {
      x: Math.random() * width,
      y: Math.random() * height,
      size: Math.random() * 1.8 + 0.6,
      color: isWarm ? WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)] : TIER_COLOR[tier],
      baseAlpha: isWarm ? 0.5 : (tier === 'core' ? 0.85 : tier === 'bright' ? 0.65 : 0.5),
      speed: 12 + Math.random() * 22,
      swayAmp: Math.random() * 14 + 4,
      swaySpeed: 0.15 + Math.random() * 0.4,
      swayPhase: Math.random() * Math.PI * 2
    };
  }
  function buildRiseParticles() {
    riseParticles = [];
    for (var i = 0; i < RISE_COUNT; i++) riseParticles.push(spawnRiseParticle());
  }
  function drawRiseParticles(dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < riseParticles.length; i++) {
      var p = riseParticles[i];
      p.y -= p.speed * dt;
      if (p.y < -20) { p.y = height + 20; p.x = Math.random() * width; }
      var baseX = p.x + Math.sin(t * p.swaySpeed + p.swayPhase) * p.swayAmp + parX * 0.75;
      var baseY = p.y + parY * 0.75;
      var dx = cursorX - baseX, dy = cursorY - baseY;
      var dist = Math.sqrt(dx * dx + dy * dy);
      var drawX = baseX, drawY = baseY, alpha = p.baseAlpha;
      if (dist < CURSOR_RADIUS && dist > 0.01) {
        var pull = (1 - dist / CURSOR_RADIUS) * CURSOR_PULL;
        drawX += (dx / dist) * pull;
        drawY += (dy / dist) * pull;
        alpha = Math.min(alpha + (1 - dist / CURSOR_RADIUS) * 0.4, 1);
      }
      ctx.beginPath();
      ctx.fillStyle = 'rgba(' + p.color + ',' + alpha.toFixed(3) + ')';
      ctx.arc(drawX, drawY, p.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  // ---------- Glowing cyan/teal comets, scattered across the whole page ----------
  var TRAIL_COUNT = reducedMotion ? 0 : 14;
  var trails = [];
  function spawnTrail() {
    var isWarm = Math.random() < 0.1;
    var dir = Math.random() < 0.5 ? 1 : -1;
    return {
      x: Math.random() * width,
      y: height + 40 + Math.random() * height * 0.5,
      len: 30 + Math.random() * 55,
      vx: dir * (18 + Math.random() * 16),
      vy: -(40 + Math.random() * 35),
      color: isWarm ? WARM_COLORS[Math.floor(Math.random() * WARM_COLORS.length)] : TIER_COLOR[Math.random() < 0.5 ? 'bright' : 'mid'],
      opacity: (isWarm ? 0.16 : 0.22) + Math.random() * 0.14,
      travelled: 0,
      maxTravel: height * (0.7 + Math.random() * 0.5)
    };
  }
  function buildTrails() {
    trails = [];
    for (var i = 0; i < TRAIL_COUNT; i++) {
      var trail = spawnTrail();
      trail.travelled = Math.random() * trail.maxTravel;
      trails.push(trail);
    }
  }
  function drawTrails(dt) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    for (var i = 0; i < trails.length; i++) {
      var w = trails[i];
      w.x += w.vx * dt;
      w.y += w.vy * dt;
      w.travelled += Math.abs(w.vy) * dt;
      if (w.travelled > w.maxTravel) { var fresh = spawnTrail(); trails[i] = fresh; continue; }
      var fade = Math.sin(Math.min(w.travelled / w.maxTravel, 1) * Math.PI);
      var alpha = fade * w.opacity;
      var mag = Math.sqrt(w.vx * w.vx + w.vy * w.vy) || 1;
      var hx = w.x + parX * 0.9, hy = w.y + parY * 0.9;
      var x2 = hx - (w.vx / mag) * w.len;
      var y2 = hy - (w.vy / mag) * w.len;

      var grad = ctx.createLinearGradient(hx, hy, x2, y2);
      grad.addColorStop(0, 'rgba(' + w.color + ',' + alpha.toFixed(3) + ')');
      grad.addColorStop(1, 'rgba(' + w.color + ',0)');
      ctx.strokeStyle = grad;
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(hx, hy);
      ctx.lineTo(x2, y2);
      ctx.stroke();

      var headG = ctx.createRadialGradient(hx, hy, 0, hx, hy, 6);
      headG.addColorStop(0, 'rgba(' + w.color + ',' + (alpha * 0.9).toFixed(3) + ')');
      headG.addColorStop(1, 'rgba(' + w.color + ',0)');
      ctx.fillStyle = headG;
      ctx.beginPath();
      ctx.arc(hx, hy, 6, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();
  }

  layout();
  buildNebulae();
  buildStars();
  buildRiseParticles();
  buildTrails();

  window.addEventListener('resize', function () {
    layout();
    buildNebulae();
    buildStars();
  });

  // ---------- Cursor / touch reactive parallax ----------
  var cursorX = -9999, cursorY = -9999;
  var parTargetX = 0, parTargetY = 0;
  var parX = 0, parY = 0;
  var PARALLAX_MAX = 22;

  function updatePointer(clientX, clientY) {
    cursorX = clientX;
    cursorY = clientY;
    parTargetX = (clientX / width - 0.5) * 2 * PARALLAX_MAX;
    parTargetY = (clientY / height - 0.5) * 2 * PARALLAX_MAX;
  }
  window.addEventListener('mousemove', function (e) {
    updatePointer(e.clientX, e.clientY);
  });
  window.addEventListener('touchmove', function (e) {
    if (e.touches && e.touches.length) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });
  window.addEventListener('touchstart', function (e) {
    if (e.touches && e.touches.length) updatePointer(e.touches[0].clientX, e.touches[0].clientY);
  }, { passive: true });

  var t = 0;
  var lastTime = performance.now();

  function frame(now) {
    var dt = Math.min((now - lastTime) / 1000, 0.05);
    lastTime = now;
    t += 0.016;
    parX += (parTargetX - parX) * 0.06;
    parY += (parTargetY - parY) * 0.06;
    ctx.clearRect(0, 0, width, height);
    drawNebulae();
    drawStars(dt);
    drawRiseParticles(dt);
    drawTrails(dt);
    if (!reducedMotion) requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
})();
