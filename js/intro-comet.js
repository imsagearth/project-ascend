(function () {
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reducedMotion) return;

  var DURATION = 1000;
  var FADE = 250;

  var canvas = document.createElement('canvas');
  canvas.id = 'introComet';
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.position = 'fixed';
  canvas.style.inset = '0';
  canvas.style.width = '100vw';
  canvas.style.height = '100vh';
  canvas.style.zIndex = '0';
  canvas.style.pointerEvents = 'none';
  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');
  var DPR = Math.min(window.devicePixelRatio || 1, 2);
  var width = window.innerWidth, height = window.innerHeight;
  canvas.width = width * DPR;
  canvas.height = height * DPR;
  ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

  function ease(p) { return 1 - Math.pow(1 - p, 2); }

  // Three comets, all travelling the same bottom-left to upper-right
  // diagonal in parallel tracks, so their huge glowing trails feel like
  // they sweep the whole screen. The center track is the largest.
  var comets = [
    {
      startX: width * -0.05, startY: height * 0.78,
      endX: width * 0.85, endY: height * -0.35,
      lineWidth: 20, glowRadius: 220, headRadius: 16, trailFraction: 0.5
    },
    {
      startX: width * -0.1, startY: height * 1.1,
      endX: width * 1.0, endY: height * -0.05,
      lineWidth: 52, glowRadius: 520, headRadius: 38, trailFraction: 0.62
    },
    {
      startX: width * 0.1, startY: height * 1.35,
      endX: width * 1.15, endY: height * 0.2,
      lineWidth: 20, glowRadius: 220, headRadius: 16, trailFraction: 0.5
    }
  ];

  function pointAt(comet, p) {
    p = Math.max(0, Math.min(1, p));
    var e = ease(p);
    return {
      x: comet.startX + (comet.endX - comet.startX) * e,
      y: comet.startY + (comet.endY - comet.startY) * e
    };
  }

  function drawComet(comet, progress) {
    var head = pointAt(comet, progress);
    var tail = pointAt(comet, progress - comet.trailFraction);

    var grad = ctx.createLinearGradient(head.x, head.y, tail.x, tail.y);
    grad.addColorStop(0, 'rgba(255,255,255,0.92)');
    grad.addColorStop(0.25, 'rgba(200,246,255,0.72)');
    grad.addColorStop(0.55, 'rgba(150,236,255,0.4)');
    grad.addColorStop(1, 'rgba(20,220,245,0)');
    ctx.strokeStyle = grad;
    ctx.lineWidth = comet.lineWidth;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(head.x, head.y);
    ctx.lineTo(tail.x, tail.y);
    ctx.stroke();

    var glow = ctx.createRadialGradient(head.x, head.y, 0, head.x, head.y, comet.glowRadius);
    glow.addColorStop(0, 'rgba(255,255,255,0.85)');
    glow.addColorStop(0.18, 'rgba(220,250,255,0.55)');
    glow.addColorStop(0.45, 'rgba(150,236,255,0.28)');
    glow.addColorStop(1, 'rgba(20,220,245,0)');
    ctx.fillStyle = glow;
    ctx.beginPath();
    ctx.arc(head.x, head.y, comet.glowRadius, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(head.x, head.y, comet.headRadius, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawFrame(progress) {
    ctx.clearRect(0, 0, width, height);
    for (var i = 0; i < comets.length; i++) drawComet(comets[i], progress);
  }

  var start = performance.now();
  var faded = false;

  function frame(now) {
    var elapsed = now - start;
    if (elapsed >= DURATION) {
      drawFrame(1);
      fadeOut();
      return;
    }
    drawFrame(elapsed / DURATION);
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);

  // Backup timer: requestAnimationFrame is throttled/suspended in
  // backgrounded tabs, so this guarantees the fade-out still fires on
  // schedule even if the page loaded while not in the active tab.
  window.setTimeout(fadeOut, DURATION);

  function fadeOut() {
    if (faded) return;
    faded = true;
    canvas.style.transition = 'opacity ' + FADE + 'ms ease';
    canvas.style.opacity = '0';
    window.setTimeout(function () {
      if (canvas.parentNode) canvas.parentNode.removeChild(canvas);
    }, FADE + 50);
  }
})();
