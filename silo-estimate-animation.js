(function () {
  const ANIMATION_DURATION_MS = 14000;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function easeInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - ((-2 * t + 2) ** 3) / 2;
  }

  function easeOut(t) {
    return 1 - (1 - t) ** 3;
  }

  function fract(x) {
    return x - Math.floor(x);
  }

  function seeded(index) {
    return fract(Math.sin((index + 1) * 78.233) * 43758.5453);
  }

  function drawRoundedRect(ctx, x, y, w, h, r) {
    const radius = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + w - radius, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + radius);
    ctx.lineTo(x + w, y + h - radius);
    ctx.quadraticCurveTo(x + w, y + h, x + w - radius, y + h);
    ctx.lineTo(x + radius, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }

  function getFillState(t) {
    if (t < 800) {
      return { fill: 0.03, surfaceType: "flat", delta: 0 };
    }
    if (t < 3000) {
      const p = easeOut((t - 800) / 2200);
      return { fill: lerp(0.03, 1, p), surfaceType: "flat", delta: 0 };
    }
    if (t < 4000) {
      const p = easeInOut((t - 3000) / 1000);
      return { fill: lerp(1, 0.9, p), surfaceType: "convex", delta: lerp(-0.08, -0.32, p) };
    }
    if (t < 9000) {
      const p = easeInOut((t - 4000) / 5000);
      const delta = lerp(-0.3, 0.3, p); // convex -> flat -> concave while emptying
      const surfaceType = delta < -0.05 ? "convex" : (delta > 0.05 ? "concave" : "flat");
      return { fill: lerp(0.9, 0.28, p), surfaceType, delta };
    }
    if (t < 13000) {
      const p = easeInOut((t - 9000) / 4000);
      const delta = lerp(0.28, 0.38, p);
      return { fill: lerp(0.28, 0.18, p), surfaceType: "concave", delta };
    }
    return { fill: 0.18, surfaceType: "concave", delta: 0.38 };
  }

  function drawScene(ctx, width, height, t) {
    const fadeSilo = clamp(t / 800, 0, 1);
    const fillState = getFillState(t);
    const fill = clamp(fillState.fill, 0, 1);

    const bg = ctx.createLinearGradient(0, 0, 0, height);
    bg.addColorStop(0, "#102235");
    bg.addColorStop(1, "#1a354e");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, width, height);

    const cx = width * 0.42;
    const cylW = Math.min(width * 0.4, 220);
    const left = cx - cylW / 2;
    const right = cx + cylW / 2;
    const topY = height * 0.15;
    const cylBottomY = height * 0.68;
    const hopperTipY = height * 0.84;
    const outletBottomY = height * 0.9;
    const openingRy = Math.max(10, height * 0.03);
    const outletHalf = Math.max(9, cylW * 0.08);
    const wallInset = 2.4;

    function wallXAtY(y, side) {
      if (y <= cylBottomY) return side === "left" ? left + wallInset : right - wallInset;
      const q = clamp((y - cylBottomY) / (hopperTipY - cylBottomY), 0, 1);
      const x = lerp(cylW / 2 - wallInset, outletHalf + 1, q);
      return side === "left" ? cx - x : cx + x;
    }

    const yEdge = lerp(hopperTipY - 1, topY + openingRy, fill);
    const absDelta = Math.abs(fillState.delta);
    const isFlat = absDelta < 0.05 || fillState.surfaceType === "flat";
    const amp = isFlat ? 0 : clamp(absDelta * 40, 6, 28);
    const yMidRaw = fillState.surfaceType === "concave" ? yEdge + amp : yEdge - amp;
    const yMid = clamp(yMidRaw, topY + openingRy + 2, hopperTipY - 4);

    const xLeftEdge = wallXAtY(yEdge, "left");
    const xRightEdge = wallXAtY(yEdge, "right");
    const xLeftTip = cx - outletHalf - 1.4;
    const xRightTip = cx + outletHalf + 1.4;

    ctx.globalAlpha = fadeSilo;

    const shell = ctx.createLinearGradient(left, 0, right, 0);
    shell.addColorStop(0, "#8ea2b8");
    shell.addColorStop(0.24, "#c8d5e2");
    shell.addColorStop(1, "#e3ecf5");
    ctx.fillStyle = shell;
    ctx.strokeStyle = "#7f95ab";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(left, topY);
    ctx.lineTo(left, cylBottomY);
    ctx.lineTo(cx - outletHalf - 2, hopperTipY);
    ctx.lineTo(cx - outletHalf - 2, outletBottomY);
    ctx.lineTo(cx + outletHalf + 2, outletBottomY);
    ctx.lineTo(cx + outletHalf + 2, hopperTipY);
    ctx.lineTo(right, cylBottomY);
    ctx.lineTo(right, topY);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "rgba(123, 138, 156, 0.2)";
    ctx.beginPath();
    ctx.moveTo(left, topY);
    ctx.lineTo(left + cylW * 0.16, topY);
    ctx.lineTo(left + cylW * 0.16, cylBottomY + 16);
    ctx.lineTo(cx - outletHalf - 2, hopperTipY);
    ctx.lineTo(left, cylBottomY);
    ctx.closePath();
    ctx.fill();

    ctx.fillStyle = "rgba(255, 255, 255, 0.14)";
    ctx.beginPath();
    ctx.moveTo(right - cylW * 0.16, topY);
    ctx.lineTo(right, topY);
    ctx.lineTo(right, cylBottomY);
    ctx.lineTo(cx + outletHalf + 2, hopperTipY);
    ctx.lineTo(right - cylW * 0.16, cylBottomY + 16);
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(13, 27, 43, 0.72)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(cx, topY, cylW / 2, openingRy, 0, 0, Math.PI * 2);
    ctx.stroke();

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(left + wallInset, topY + 1);
    ctx.lineTo(left + wallInset, cylBottomY);
    ctx.lineTo(xLeftTip, hopperTipY);
    ctx.lineTo(xLeftTip, outletBottomY - 1);
    ctx.lineTo(xRightTip, outletBottomY - 1);
    ctx.lineTo(xRightTip, hopperTipY);
    ctx.lineTo(right - wallInset, cylBottomY);
    ctx.lineTo(right - wallInset, topY + 1);
    ctx.closePath();
    ctx.clip();

    const fillGradient = ctx.createLinearGradient(0, topY, 0, outletBottomY);
    fillGradient.addColorStop(0, "#51d593");
    fillGradient.addColorStop(1, "#23945d");
    ctx.fillStyle = fillGradient;

    ctx.beginPath();
    ctx.moveTo(xLeftEdge, yEdge);
    ctx.lineTo(cx, yMid);
    ctx.lineTo(xRightEdge, yEdge);
    if (yEdge <= cylBottomY) {
      ctx.lineTo(right - wallInset, cylBottomY);
      ctx.lineTo(xRightTip, hopperTipY);
      ctx.lineTo(xLeftTip, hopperTipY);
      ctx.lineTo(left + wallInset, cylBottomY);
    } else {
      ctx.lineTo(xRightTip, hopperTipY);
      ctx.lineTo(xLeftTip, hopperTipY);
    }
    ctx.closePath();
    ctx.fill();

    ctx.strokeStyle = "rgba(0, 0, 0, 0.22)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(xLeftEdge, yEdge + 1);
    ctx.lineTo(cx, yMid + 1);
    ctx.lineTo(xRightEdge, yEdge + 1);
    ctx.stroke();

    ctx.strokeStyle = "rgba(235, 255, 243, 0.85)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(xLeftEdge, yEdge);
    ctx.lineTo(cx, yMid);
    ctx.lineTo(xRightEdge, yEdge);
    ctx.stroke();

    if (t >= 3000) {
      ctx.fillStyle = "rgba(233, 251, 238, 0.88)";
      for (let i = 0; i < 12; i += 1) {
        const px = xLeftEdge + 8 + seeded(i) * Math.max(8, (xRightEdge - xLeftEdge - 16));
        const sideDen = px <= cx
          ? Math.max(1, cx - xLeftEdge)
          : Math.max(1, xRightEdge - cx);
        const local = px <= cx
          ? (px - xLeftEdge) / sideDen
          : (xRightEdge - px) / sideDen;
        const curveY = yEdge + (yMid - yEdge) * clamp(local, 0, 1);
        const py = curveY + 4 + seeded(i + 20) * 8;
        ctx.beginPath();
        ctx.arc(px, py, 2.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    if (t >= 800 && t < 3000) {
      for (let i = 0; i < 44; i += 1) {
        const spawn = 800 + i * 55;
        const life = 900 + seeded(i + 300) * 700;
        const age = t - spawn;
        if (age < 0 || age > life) continue;
        const p = age / life;
        const x = cx + (seeded(i + 11) - 0.5) * (cylW * 0.78);
        const targetY = yEdge - 5 - seeded(i + 31) * 7;
        const y = lerp(topY - 24, targetY, easeOut(p));
        ctx.fillStyle = "rgba(235, 252, 241, 0.95)";
        ctx.beginPath();
        ctx.arc(x, y, 2.1 + seeded(i + 90) * 1.2, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();

    if (t >= 4000) {
      const dayProgress = clamp((t - 4000) / 5000, 0, 1);
      const dayFloat = 1 + dayProgress * 6;
      const dayCurrent = Math.min(7, Math.floor(dayFloat + 1e-6));
      const dayFrac = fract(dayFloat);

      if (dayCurrent < 7) {
        const panelAlpha = clamp((t - 4000) / 300, 0, 1);
        const panelX = width * 0.72;
        const panelY = height * 0.26;
        const panelW = Math.max(88, width * 0.2);
        const panelH = Math.max(112, height * 0.28);

        ctx.globalAlpha = panelAlpha;
        drawRoundedRect(ctx, panelX, panelY, panelW, panelH, 12);
        ctx.fillStyle = "rgba(236, 245, 251, 0.96)";
        ctx.fill();
        ctx.strokeStyle = "rgba(105, 143, 171, 0.8)";
        ctx.lineWidth = 1.4;
        ctx.stroke();

        ctx.fillStyle = "#0b6f98";
        ctx.font = "700 12px 'SF Pro Text', 'Segoe UI', sans-serif";
        ctx.fillText("DAY", panelX + 12, panelY + 20);

        ctx.save();
        ctx.beginPath();
        ctx.rect(panelX + 10, panelY + 28, panelW - 20, panelH - 38);
        ctx.clip();
        ctx.fillStyle = "#13314a";
        ctx.font = "700 36px 'SF Pro Text', 'Segoe UI', sans-serif";
        const baseline = panelY + panelH * 0.72;
        const offset = dayFrac * 30;
        ctx.fillText(String(dayCurrent), panelX + panelW * 0.42, baseline - offset);
        if (dayCurrent < 6) {
          ctx.globalAlpha = clamp(dayFrac * 1.2, 0, 1);
          ctx.fillText(String(dayCurrent + 1), panelX + panelW * 0.42, baseline + 30 - offset);
        }
        ctx.restore();
      }
    }

    if (t >= 9000) {
      const e = clamp((t - 9000) / 4000, 0, 1);
      const drawProg = clamp((e - 0.12) / 0.68, 0, 1);
      const pulse = 1 - clamp((t - 9000) / 520, 0, 1);
      const originX = cx;
      const originY = topY + 2;
      const centerX = cx;
      const centerY = yMid;
      const wallY = centerY;
      const wallX = wallXAtY(wallY, "right");

      ctx.globalAlpha = 1;
      ctx.fillStyle = "#4bb7e2";
      ctx.beginPath();
      ctx.arc(originX, originY, 4.6, 0, Math.PI * 2);
      ctx.fill();
      if (pulse > 0) {
        ctx.strokeStyle = `rgba(75, 183, 226, ${pulse * 0.5})`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(originX, originY, lerp(8, 21, 1 - pulse), 0, Math.PI * 2);
        ctx.stroke();
      }

      ctx.strokeStyle = "#6dd5ff";
      ctx.lineWidth = 2;
      ctx.setLineDash([4, 5]);
      function dashedPartial(ax, ay, bx, by, p) {
        const px = lerp(ax, bx, p);
        const py = lerp(ay, by, p);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(px, py);
        ctx.stroke();
      }
      dashedPartial(originX, originY, centerX, centerY, drawProg); // h
      dashedPartial(centerX, centerY, wallX, wallY, drawProg); // r
      dashedPartial(originX, originY, wallX, wallY, drawProg); // L
      ctx.setLineDash([]);

      if (drawProg > 0.72) {
        ctx.fillStyle = "rgba(228, 244, 255, 0.95)";
        ctx.font = "700 13px 'SF Pro Text', 'Segoe UI', sans-serif";
        ctx.fillText("h", originX + 7, (originY + centerY) / 2);
        ctx.fillText("r", (centerX + wallX) / 2, centerY - 7);
        ctx.fillText("L", (originX + wallX) / 2 + 5, (originY + wallY) / 2 - 3);
      }
    }

    if (t >= 13000) {
      ctx.fillStyle = "rgba(0, 0, 0, 0.26)";
      drawRoundedRect(ctx, width * 0.31, height * 0.88, width * 0.35, 30, 8);
      ctx.fill();
      ctx.fillStyle = "#eaf4fb";
      ctx.font = "600 13px 'SF Pro Text', 'Segoe UI', sans-serif";
      ctx.fillText("Surface geometry measured", width * 0.34, height * 0.9);
    }
  }

  function mountSiloEstimateAnimation(root) {
    const canvas = root.querySelector("canvas");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let rafId = 0;
    let startMs = performance.now();

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = Math.max(2, Math.round(rect.width * dpr));
      canvas.height = Math.max(2, Math.round(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function frame(now) {
      const rect = canvas.getBoundingClientRect();
      const t = (now - startMs) % ANIMATION_DURATION_MS;
      drawScene(ctx, rect.width, rect.height, t);
      rafId = requestAnimationFrame(frame);
    }

    window.addEventListener("resize", resize);
    resize();
    rafId = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }

  document.querySelectorAll("[data-silo-estimate-animation]").forEach((root) => {
    mountSiloEstimateAnimation(root);
  });
})();
