"use client";

import { useEffect, useRef } from "react";

type BackgroundPoint = {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  alpha: number;
  tint: number;
  seed: number;
};

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function PointCloudBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    try {
      sessionStorage.removeItem("site-point-background");
      localStorage.removeItem("site-point-background");
    } catch {
      // Ignore storage access failures.
    }

    const canvas = canvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext("2d");
    if (!context) return;

    let raf = 0;
    let lastTime = 0;
    let width = 0;
    let height = 0;
    let points: BackgroundPoint[] = [];

    const buildPoints = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;
      context.setTransform(dpr, 0, 0, dpr, 0, 0);

      const pointCount = clamp(
        Math.round((width * height) / 16000),
        110,
        220
      );

      points = Array.from({ length: pointCount }, (_, index) => {
        const seed = Math.random() * Math.PI * 2 + index * 0.17;
        const speed = 0.4 + Math.random() * 0.55;

        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(seed) * speed * 0.06,
          vy: Math.sin(seed) * speed * 0.04,
          size: 1.1 + Math.random() * 2.2,
          alpha: 0.12 + Math.random() * 0.12,
          tint: Math.random(),
          seed,
        };
      });
    };

    const drawBackground = () => {
      context.fillStyle = "rgba(246, 244, 238, 0.98)";
      context.fillRect(0, 0, width, height);

      const gradient = context.createRadialGradient(
        width * 0.5,
        height * 0.42,
        0,
        width * 0.5,
        height * 0.42,
        Math.max(width, height) * 0.72
      );

      gradient.addColorStop(0, "rgba(0, 0, 0, 0.045)");
      gradient.addColorStop(0.45, "rgba(0, 0, 0, 0.018)");
      gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

      context.fillStyle = gradient;
      context.fillRect(0, 0, width, height);
    };

    const render = (time: number) => {
      const delta = lastTime ? Math.min((time - lastTime) / 16.67, 2) : 1;
      lastTime = time;
      const seconds = time * 0.001;

      context.clearRect(0, 0, width, height);
      drawBackground();

      for (const point of points) {
        point.x += point.vx * delta;
        point.y += point.vy * delta;

        if (point.x < -8) point.x = width + 8;
        if (point.x > width + 8) point.x = -8;
        if (point.y < -8) point.y = height + 8;
        if (point.y > height + 8) point.y = -8;

        const pulse = 0.82 + Math.sin(seconds * 0.45 + point.seed * 3.4) * 0.18;
        const driftX = Math.sin(seconds * 0.18 + point.seed) * 1.4;
        const driftY = Math.cos(seconds * 0.16 + point.seed * 1.3) * 1.2;
        const warm = 12 + Math.round(point.tint * 22);
        const cool = 18 + Math.round(point.tint * 18);

        context.beginPath();
        context.arc(
          point.x + driftX,
          point.y + driftY,
          point.size * pulse * 2.8,
          0,
          Math.PI * 2
        );
        context.fillStyle = `rgba(${warm}, ${warm}, ${cool}, ${(point.alpha * pulse) / 10})`;
        context.fill();

        context.beginPath();
        context.arc(
          point.x + driftX,
          point.y + driftY,
          point.size * pulse,
          0,
          Math.PI * 2
        );
        context.fillStyle = `rgba(${warm}, ${warm}, ${cool}, ${point.alpha * pulse})`;
        context.fill();
      }

      raf = window.requestAnimationFrame(render);
    };

    buildPoints();
    raf = window.requestAnimationFrame(render);
    window.addEventListener("resize", buildPoints, { passive: true });

    return () => {
      window.removeEventListener("resize", buildPoints);
      window.cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 1,
        opacity: 1,
      }}
    />
  );
}
