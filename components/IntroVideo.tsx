"use client";

import { useEffect, useRef, useState } from "react";
import * as THREE from "three";

const SCENE_W = 1920;
const SCENE_H = 1080;
const SAMPLE_FPS = 24;
const PAPER_COLOR = "#ffffff";
const SUBCELL_OFFSETS = [
  { x: 0, y: 0 },
  { x: -0.34, y: -0.34 },
  { x: 0.34, y: -0.34 },
  { x: -0.34, y: 0.34 },
  { x: 0.34, y: 0.34 },
] as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function easeOutCubic(value: number) {
  return 1 - Math.pow(1 - value, 3);
}

export default function IntroVideo() {
  const [dismissed, setDismissed] = useState(false);
  const [gone, setGone] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    if (!dismissed) return;
    const timer = setTimeout(() => setGone(true), 600);
    return () => clearTimeout(timer);
  }, [dismissed]);

  useEffect(() => {
    if (dismissed) return;

    const onScroll = () => setDismissed(true);
    const onWheel = () => setDismissed(true);
    const onTouch = () => setDismissed(true);

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("wheel", onWheel, { passive: true });
    window.addEventListener("touchmove", onTouch, { passive: true });

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchmove", onTouch);
    };
  }, [dismissed]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || gone) return;

    video.muted = true;
    video.defaultMuted = true;
    video.playsInline = true;
    video.loop = true;
    video.setAttribute("muted", "");
    video.setAttribute("playsinline", "");

    const start = () => { video.play().catch(() => {}); };

    start();
    video.addEventListener("canplay", start);
    const t1 = setTimeout(start, 200);
    const t2 = setTimeout(start, 800);

    return () => {
      video.pause();
      video.removeEventListener("canplay", start);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [gone]);

  useEffect(() => {
    if (gone) return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!sampleContext) return;

    const cover = {
      left: 0,
      bottom: 0,
      visibleWidth: SCENE_W,
      visibleHeight: SCENE_H,
      scale: 1,
    };
    const uniforms = {
      uPointer: { value: new THREE.Vector2(SCENE_W / 2, SCENE_H / 2) },
      uPointerActive: { value: 0 },
      uPointerPressed: { value: 0 },
    };

    let cancelled = false;
    let raf = 0;
    let renderer: THREE.WebGLRenderer | null = null;
    let scene: THREE.Scene | null = null;
    let camera: THREE.OrthographicCamera | null = null;
    let material: THREE.ShaderMaterial | null = null;
    let geometry: THREE.BufferGeometry | null = null;
    let points: THREE.Points | null = null;
    let currentPositions: Float32Array | null = null;
    let targetPositions: Float32Array | null = null;
    let velocities: Float32Array | null = null;
    let currentColors: Float32Array | null = null;
    let targetColors: Float32Array | null = null;
    let currentSizes: Float32Array | null = null;
    let targetSizes: Float32Array | null = null;
    let currentOpacities: Float32Array | null = null;
    let targetOpacities: Float32Array | null = null;
    let lumaMap: Float32Array | null = null;
    let lastSampleAt = 0;
    let sampleWidth = 0;
    let sampleHeight = 0;
    let basePointSize = 3.1;
    const introStartedAt = performance.now();

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: false,
        antialias: true,
        powerPreference: "high-performance",
      });
      renderer.setClearColor(new THREE.Color(PAPER_COLOR), 1);
      renderer.outputColorSpace = THREE.SRGBColorSpace;

      scene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(0, SCENE_W, SCENE_H, 0, -40, 40);

      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms,
        vertexShader: `
          uniform vec2 uPointer;
          uniform float uPointerActive;
          uniform float uPointerPressed;

          attribute vec3 aColor;
          attribute float aSize;
          attribute float aOpacity;

          varying vec3 vColor;
          varying float vOpacity;
          varying float vGlow;

          void main() {
            vec3 current = position;
            vec2 finalPosition = current.xy;
            float influence = 0.0;

            if (uPointerActive > 0.5) {
              vec2 delta = current.xy - uPointer;
              float distanceToPointer = length(delta);
              float radius = mix(150.0, 220.0, uPointerPressed);

              if (distanceToPointer < radius) {
                float rawInfluence = 1.0 - distanceToPointer / radius;
                float easedInfluence = rawInfluence * rawInfluence;
                vec2 direction = delta / max(distanceToPointer, 0.0001);
                vec2 tangent = vec2(-direction.y, direction.x);
                float push = mix(22.0, 36.0, uPointerPressed) * easedInfluence;
                float swirl = mix(10.0, 18.0, uPointerPressed) * easedInfluence;

                finalPosition += direction * push + tangent * swirl;
                influence = easedInfluence;
              }
            }

            vec4 mvPosition = modelViewMatrix * vec4(finalPosition, current.z, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            gl_PointSize = aSize * mix(1.0, 1.42, influence);

            vColor = mix(aColor, vec3(1.0), influence * 0.08);
            vOpacity = aOpacity;
            vGlow = influence;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vOpacity;
          varying float vGlow;

          void main() {
            vec2 pointUv = gl_PointCoord - vec2(0.5);
            float distanceToCenter = length(pointUv);
            float edgeMask = 1.0 - smoothstep(0.28, 0.5, distanceToCenter);

            if (edgeMask <= 0.0) {
              discard;
            }

            float innerMask = 1.0 - smoothstep(0.0, 0.16, distanceToCenter);
            vec3 color = mix(vColor, vec3(1.0), vGlow * 0.08);
            float alpha = vOpacity * edgeMask * (0.9 + innerMask * 0.16);

            gl_FragColor = vec4(color, alpha);
          }
        `,
      });
    } catch {
      return;
    }

    const disposePointCloud = () => {
      if (points && scene) scene.remove(points);
      geometry?.dispose();
      geometry = null;
      points = null;
      currentPositions = null;
      targetPositions = null;
      velocities = null;
      currentColors = null;
      targetColors = null;
      currentSizes = null;
      targetSizes = null;
      currentOpacities = null;
      targetOpacities = null;
      lumaMap = null;
    };

    const resizeScene = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      const dpr = Math.min(window.devicePixelRatio || 1, 1.8);
      if (!renderer || !camera || !width || !height) return;

      renderer.setPixelRatio(dpr);
      renderer.setSize(width, height, false);

      cover.scale = Math.max(width / SCENE_W, height / SCENE_H);
      cover.visibleWidth = width / cover.scale;
      cover.visibleHeight = height / cover.scale;
      cover.left = (SCENE_W - cover.visibleWidth) / 2;
      cover.bottom = (SCENE_H - cover.visibleHeight) / 2;

      camera.left = cover.left;
      camera.right = cover.left + cover.visibleWidth;
      camera.bottom = cover.bottom;
      camera.top = cover.bottom + cover.visibleHeight;
      camera.updateProjectionMatrix();

      basePointSize = Math.min(5.6, Math.max(1.9, 2.55 * cover.scale)) * dpr;
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      uniforms.uPointerActive.value = 1;
      const localX = event.clientX - rect.left;
      const localY = event.clientY - rect.top;
      uniforms.uPointer.value.set(
        cover.left + (localX / Math.max(rect.width, 1)) * cover.visibleWidth,
        cover.bottom +
          ((rect.height - localY) / Math.max(rect.height, 1)) *
            cover.visibleHeight
      );
    };

    const createPointCloud = () => {
      if (!scene || !material || !video.videoWidth || !video.videoHeight) return;

      const width = canvas.clientWidth;
      const nextSampleWidth = width < 640 ? 144 : width < 1024 ? 192 : 256;
      const nextSampleHeight = Math.max(
        1,
        Math.round(nextSampleWidth * (video.videoHeight / video.videoWidth))
      );

      if (
        nextSampleWidth === sampleWidth &&
        nextSampleHeight === sampleHeight &&
        geometry
      )
        return;

      sampleWidth = nextSampleWidth;
      sampleHeight = nextSampleHeight;
      sampleCanvas.width = sampleWidth;
      sampleCanvas.height = sampleHeight;

      disposePointCloud();

      const cellCount = sampleWidth * sampleHeight;
      const particleCount = cellCount * SUBCELL_OFFSETS.length;
      currentPositions = new Float32Array(particleCount * 3);
      targetPositions = new Float32Array(particleCount * 3);
      velocities = new Float32Array(particleCount * 3);
      currentColors = new Float32Array(particleCount * 3);
      targetColors = new Float32Array(particleCount * 3);
      currentSizes = new Float32Array(particleCount);
      targetSizes = new Float32Array(particleCount);
      currentOpacities = new Float32Array(particleCount);
      targetOpacities = new Float32Array(particleCount);
      lumaMap = new Float32Array(cellCount);

      const centerX = SCENE_W / 2;
      const centerY = SCENE_H / 2;

      for (let index = 0; index < particleCount; index += 1) {
        const cursor3 = index * 3;
        const angle = Math.random() * Math.PI * 2;
        const spread = 150 + Math.random() * 380;

        currentPositions[cursor3] = centerX + Math.cos(angle) * spread;
        currentPositions[cursor3 + 1] =
          centerY + Math.sin(angle) * spread * 0.72;
        currentPositions[cursor3 + 2] = (Math.random() - 0.5) * 16;
        targetPositions[cursor3] = currentPositions[cursor3];
        targetPositions[cursor3 + 1] = currentPositions[cursor3 + 1];
        targetPositions[cursor3 + 2] = currentPositions[cursor3 + 2];

        currentColors[cursor3] = 0.2;
        currentColors[cursor3 + 1] = 0.2;
        currentColors[cursor3 + 2] = 0.2;
        targetColors[cursor3] = 0.2;
        targetColors[cursor3 + 1] = 0.2;
        targetColors[cursor3 + 2] = 0.2;

        currentSizes[index] = basePointSize * 0.18;
        targetSizes[index] = basePointSize * 0.18;
        currentOpacities[index] = 0;
        targetOpacities[index] = 0;
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(currentPositions, 3).setUsage(THREE.DynamicDrawUsage)
      );
      geometry.setAttribute(
        "aColor",
        new THREE.BufferAttribute(currentColors, 3).setUsage(THREE.DynamicDrawUsage)
      );
      geometry.setAttribute(
        "aSize",
        new THREE.BufferAttribute(currentSizes, 1).setUsage(THREE.DynamicDrawUsage)
      );
      geometry.setAttribute(
        "aOpacity",
        new THREE.BufferAttribute(currentOpacities, 1).setUsage(THREE.DynamicDrawUsage)
      );

      points = new THREE.Points(geometry, material);
      points.frustumCulled = false;
      scene.add(points);
    };

    const sampleFrame = (time: number) => {
      createPointCloud();

      if (
        !video.videoWidth ||
        !video.videoHeight ||
        video.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !targetPositions ||
        !targetColors ||
        !targetSizes ||
        !targetOpacities ||
        !lumaMap
      )
        return;

      sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
      sampleContext.drawImage(video, 0, 0, sampleWidth, sampleHeight);
      const frame = sampleContext.getImageData(
        0,
        0,
        sampleWidth,
        sampleHeight
      ).data;

      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          const index = y * sampleWidth + x;
          const cursor = index * 4;
          const r = frame[cursor] / 255;
          const g = frame[cursor + 1] / 255;
          const b = frame[cursor + 2] / 255;
          const alpha = frame[cursor + 3] / 255;
          lumaMap[index] = (r * 0.299 + g * 0.587 + b * 0.114) * alpha;
        }
      }

      const introProgress = easeOutCubic(
        clamp((time - introStartedAt) / 2400, 0, 1)
      );
      const maxDistance = Math.hypot(SCENE_W / 2, SCENE_H / 2);
      const cellSceneWidth = SCENE_W / sampleWidth;
      const cellSceneHeight = SCENE_H / sampleHeight;

      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          const cellIndex = y * sampleWidth + x;
          const cursor = cellIndex * 4;

          const r = frame[cursor] / 255;
          const g = frame[cursor + 1] / 255;
          const b = frame[cursor + 2] / 255;
          const alpha = frame[cursor + 3] / 255;
          const luma = lumaMap[cellIndex];
          const sampleLuma = (ci: number) =>
            ci >= 0 && ci < lumaMap!.length ? lumaMap![ci] : luma;
          const left = sampleLuma(cellIndex - 1);
          const right = sampleLuma(cellIndex + 1);
          const up = sampleLuma(cellIndex - sampleWidth);
          const down = sampleLuma(cellIndex + sampleWidth);
          const upLeft = sampleLuma(cellIndex - sampleWidth - 1);
          const upRight = sampleLuma(cellIndex - sampleWidth + 1);
          const downLeft = sampleLuma(cellIndex + sampleWidth - 1);
          const downRight = sampleLuma(cellIndex + sampleWidth + 1);
          const edge = Math.max(
            Math.abs(luma - left),
            Math.abs(luma - right),
            Math.abs(luma - up),
            Math.abs(luma - down),
            Math.abs(luma - upLeft),
            Math.abs(luma - upRight),
            Math.abs(luma - downLeft),
            Math.abs(luma - downRight)
          );
          const darkness = 1 - luma;
          const localContrast =
            Math.abs(left - right) +
            Math.abs(up - down) +
            Math.abs(upLeft - downRight) +
            Math.abs(upRight - downLeft);
          const ink = clamp(
            edge * 5.8 + localContrast * 1.15 + darkness * 0.52,
            0,
            1
          );
          const presence = clamp(
            ink * 1.35 + edge * 0.95 + darkness * 0.18 - 0.22,
            0,
            1
          );
          const baseX = ((x + 0.5) / sampleWidth) * SCENE_W;
          const baseY = SCENE_H - ((y + 0.5) / sampleHeight) * SCENE_H;
          const seed = cellIndex * 0.173;
          const normalizedDistance =
            Math.hypot(baseX - SCENE_W / 2, baseY - SCENE_H / 2) / maxDistance;
          const reveal = easeOutCubic(
            clamp((introProgress - normalizedDistance * 0.45) / 0.55, 0, 1)
          );
          const scatterRadius =
            (1 - reveal) * (360 + normalizedDistance * 560);
          const scatterX =
            SCENE_W / 2 +
            Math.cos(seed * 11.9) * scatterRadius +
            Math.sin(time * 0.0011 + seed * 4.7) * 12;
          const scatterY =
            SCENE_H / 2 +
            Math.sin(seed * 9.3) * scatterRadius * 0.72 +
            Math.cos(time * 0.001 + seed * 5.9) * 12;
          const averageColor = (r + g + b) / 3;
          const maxChannel = Math.max(r, g, b);
          const minChannel = Math.min(r, g, b);
          const saturation = maxChannel - minChannel;
          const vibrance = 2.35 + saturation * 1.1 + presence * 0.4;
          const lift = 0.12 + presence * 0.16;
          const boostedR = clamp(
            averageColor + (r - averageColor) * vibrance + lift,
            0,
            1
          );
          const boostedG = clamp(
            averageColor + (g - averageColor) * vibrance + lift,
            0,
            1
          );
          const boostedB = clamp(
            averageColor + (b - averageColor) * vibrance + lift,
            0,
            1
          );
          const activePoints =
            presence < 0.035 || alpha < 0.02
              ? 0
              : presence > 0.78
                ? 5
                : presence > 0.58
                  ? 4
                  : presence > 0.36
                    ? 3
                    : presence > 0.16
                      ? 2
                      : 1;

          for (let slot = 0; slot < SUBCELL_OFFSETS.length; slot += 1) {
            const particleIndex = cellIndex * SUBCELL_OFFSETS.length + slot;
            const cursor3 = particleIndex * 3;
            const offset = SUBCELL_OFFSETS[slot];
            const slotSeed = seed + slot * 17.137;
            const localX =
              baseX +
              offset.x * cellSceneWidth * (activePoints > 2 ? 0.72 : 0.44);
            const localY =
              baseY -
              offset.y * cellSceneHeight * (activePoints > 2 ? 0.72 : 0.44);
            const localFormedX =
              localX +
              Math.sin(time * 0.0016 + slotSeed * 6.2) * (0.12 + edge * 10);
            const localFormedY =
              localY +
              Math.cos(time * 0.0014 + slotSeed * 5.4) * (0.12 + edge * 10);
            const hiddenScatterX = scatterX + offset.x * 48 * (1 - reveal);
            const hiddenScatterY = scatterY - offset.y * 48 * (1 - reveal);

            if (slot >= activePoints) {
              targetPositions[cursor3] = hiddenScatterX;
              targetPositions[cursor3 + 1] = hiddenScatterY;
              targetPositions[cursor3 + 2] = 26 + slot * 0.2;
              targetColors[cursor3] = 0.96;
              targetColors[cursor3 + 1] = 0.95;
              targetColors[cursor3 + 2] = 0.92;
              targetSizes[particleIndex] = 0;
              targetOpacities[particleIndex] = 0;
              continue;
            }

            const subdivisionScale =
              slot === 0 ? 1 : 1 / Math.sqrt(activePoints);

            targetPositions[cursor3] =
              hiddenScatterX + (localFormedX - hiddenScatterX) * reveal;
            targetPositions[cursor3 + 1] =
              hiddenScatterY + (localFormedY - hiddenScatterY) * reveal;
            targetPositions[cursor3 + 2] =
              (1 - reveal) * (16 + slot * 0.4) + edge * 10;

            targetColors[cursor3] = boostedR;
            targetColors[cursor3 + 1] = boostedG;
            targetColors[cursor3 + 2] = boostedB;

            targetSizes[particleIndex] =
              basePointSize *
              (0.16 + presence * 0.36 + ink * 0.56 + edge * 1.15) *
              (0.22 + reveal * 0.98) *
              subdivisionScale;
            targetOpacities[particleIndex] = clamp(
              (presence * 1.25 + ink * 0.9 + edge * 0.7) *
                alpha *
                (0.16 + reveal * 1.08) *
                (slot === 0 ? 1.08 : 0.9),
              0,
              0.98
            );
          }
        }
      }
    };

    const renderFrame = (time: number) => {
      if (!renderer || !scene || !camera || cancelled) return;

      if (!sampleWidth || !sampleHeight) createPointCloud();

      if (time - lastSampleAt > 1000 / SAMPLE_FPS) {
        sampleFrame(time);
        lastSampleAt = time;
      }

      if (
        geometry &&
        currentPositions &&
        targetPositions &&
        velocities &&
        currentColors &&
        targetColors &&
        currentSizes &&
        targetSizes &&
        currentOpacities &&
        targetOpacities
      ) {
        for (let index = 0; index < currentSizes.length; index += 1) {
          if (
            targetSizes[index] < 0.0001 &&
            currentSizes[index] < 0.0001 &&
            targetOpacities[index] < 0.0001 &&
            currentOpacities[index] < 0.0001
          )
            continue;

          const cursor3 = index * 3;

          velocities[cursor3] =
            (velocities[cursor3] +
              (targetPositions[cursor3] - currentPositions[cursor3]) * 0.16) *
            0.76;
          velocities[cursor3 + 1] =
            (velocities[cursor3 + 1] +
              (targetPositions[cursor3 + 1] - currentPositions[cursor3 + 1]) *
                0.16) *
            0.76;
          velocities[cursor3 + 2] =
            (velocities[cursor3 + 2] +
              (targetPositions[cursor3 + 2] - currentPositions[cursor3 + 2]) *
                0.1) *
            0.72;

          currentPositions[cursor3] += velocities[cursor3];
          currentPositions[cursor3 + 1] += velocities[cursor3 + 1];
          currentPositions[cursor3 + 2] += velocities[cursor3 + 2];

          currentColors[cursor3] +=
            (targetColors[cursor3] - currentColors[cursor3]) * 0.24;
          currentColors[cursor3 + 1] +=
            (targetColors[cursor3 + 1] - currentColors[cursor3 + 1]) * 0.24;
          currentColors[cursor3 + 2] +=
            (targetColors[cursor3 + 2] - currentColors[cursor3 + 2]) * 0.24;
          currentSizes[index] +=
            (targetSizes[index] - currentSizes[index]) * 0.28;
          currentOpacities[index] +=
            (targetOpacities[index] - currentOpacities[index]) * 0.28;
        }

        geometry.getAttribute("position").needsUpdate = true;
        geometry.getAttribute("aColor").needsUpdate = true;
        geometry.getAttribute("aSize").needsUpdate = true;
        geometry.getAttribute("aOpacity").needsUpdate = true;
      }

      renderer.render(scene, camera);
      raf = requestAnimationFrame(renderFrame);
    };

    const handlePointerMove = (event: PointerEvent) => updatePointer(event);
    const handlePointerEnter = (event: PointerEvent) => updatePointer(event);
    const handlePointerLeave = () => {
      uniforms.uPointerActive.value = 0;
      uniforms.uPointerPressed.value = 0;
    };
    const handlePointerDown = (event: PointerEvent) => {
      updatePointer(event);
      uniforms.uPointerPressed.value = 1;
    };
    const handlePointerUp = () => {
      uniforms.uPointerPressed.value = 0;
    };

    resizeScene();
    createPointCloud();
    raf = requestAnimationFrame(renderFrame);

    window.addEventListener("resize", resizeScene, { passive: true });
    canvas.addEventListener("pointermove", handlePointerMove);
    canvas.addEventListener("pointerenter", handlePointerEnter);
    canvas.addEventListener("pointerleave", handlePointerLeave);
    canvas.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resizeScene);
      canvas.removeEventListener("pointermove", handlePointerMove);
      canvas.removeEventListener("pointerenter", handlePointerEnter);
      canvas.removeEventListener("pointerleave", handlePointerLeave);
      canvas.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("pointerup", handlePointerUp);
      disposePointCloud();
      material?.dispose();
      renderer?.dispose();
    };
  }, [gone]);

  if (gone) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        background: PAPER_COLOR,
        pointerEvents: "auto",
        opacity: dismissed ? 0 : 1,
        transition: "opacity 0.5s ease-out",
      }}
    >
      <video
        ref={videoRef}
        src="/video3.mp4"
        preload="auto"
        muted
        loop
        playsInline
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
          touchAction: "none",
        }}
      />
    </div>
  );
}
