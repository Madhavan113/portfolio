"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";

type IntroPhase = "hello" | "video" | "thanks" | "skipped" | "done";

const TIMED_SUBTITLES: [number, string, number?][] = [
  [2, "hi, my name is madhavan."],
  [6, "thanks for visiting."],
  [
    10,
    "i have separated most of the content of this website into random things i have worked on or thought about.",
  ],
  [
    21,
    "i apologize for the bad writing, as i'm not a good writer and i don't like to use ai for my writing.",
  ],
  [
    33,
    "i'm looking to improve at design, and so i'm also apologizing if you find some designs to be gaudy.",
  ],
  [44, "beyond that i don't believe i have much else to say!"],
  [49, "also thanks for reading. the code is (shiba)."],
  [
    55,
    "please don't rage at me if you disagree, but feel free to email me and i will read your email.",
  ],
];

const VIDEO_DURATION = 142;
const SCENE_W = 1920;
const SCENE_H = 1080;
const SAMPLE_FPS = 24;
const PAPER_COLOR = "#ebe3d3";
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
  const [phase, setPhase] = useState<IntroPhase>("video");
  const [fadeOut, setFadeOut] = useState(false);
  const [displayedText, setDisplayedText] = useState("");
  const [currentSubtitleIndex, setCurrentSubtitleIndex] = useState(-1);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [isTyping, setIsTyping] = useState(false);
  const [videoTime, setVideoTime] = useState(0);
  const [showSubtitle, setShowSubtitle] = useState(true);

  const subtitleTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const didCommitBackgroundRef = useRef(false);

  const finalizeToBackground = useCallback(() => {
    if (didCommitBackgroundRef.current) return;
    didCommitBackgroundRef.current = true;

    const video = videoRef.current;
    if (video) {
      video.pause();
    }

    try {
      sessionStorage.removeItem("site-point-background");
      localStorage.removeItem("site-point-background");
    } catch {
      // Ignore storage access failures.
    }

    setFadeOut(true);
    setTimeout(() => {
      setPhase("done");
    }, 500);
  }, []);

  useEffect(() => {
    const ensureMuted = () => {
      const video = videoRef.current;
      if (!video) return;

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;
      video.setAttribute("muted", "");
      video.setAttribute("playsinline", "");
    };

    ensureMuted();
    const interval = setInterval(ensureMuted, 100);
    const timeout = setTimeout(() => clearInterval(interval), 2000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== "video") return;

    let cancelled = false;
    let hasResetPlayback = false;

    const startPlayback = () => {
      if (cancelled) return;

      video.muted = true;
      video.defaultMuted = true;
      video.playsInline = true;

      if (!hasResetPlayback) {
        try {
          video.currentTime = 0;
          hasResetPlayback = true;
        } catch {
          // Ignore until metadata is ready.
        }
      }

      video.play().catch(() => {});
    };

    const handleCanPlay = () => startPlayback();
    const handleEnded = () => finalizeToBackground();

    startPlayback();
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("ended", handleEnded);

    const timer1 = setTimeout(startPlayback, 100);
    const timer2 = setTimeout(startPlayback, 300);
    const timer3 = setTimeout(startPlayback, 700);
    const timer4 = setTimeout(startPlayback, 1200);

    return () => {
      cancelled = true;
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      video.pause();
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("ended", handleEnded);
    };
  }, [phase, finalizeToBackground]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || phase !== "hello") return;

    video.pause();
    try {
      video.currentTime = 0;
    } catch {
      // Ignore until metadata is ready.
    }
  }, [phase]);

  useEffect(() => {
    const video = videoRef.current;

    if (phase !== "video") {
      setVideoTime(0);
      setCurrentSubtitleIndex(-1);
      setCurrentCharIndex(0);
      setDisplayedText("");
      setIsTyping(false);
      setShowSubtitle(true);
      return;
    }

    const interval = setInterval(() => {
      if (!video) return;

      const elapsed = video.currentTime || 0;
      setVideoTime(elapsed);

      if (video.ended || elapsed >= (video.duration || VIDEO_DURATION)) {
        finalizeToBackground();
      }
    }, 100);

    return () => clearInterval(interval);
  }, [phase, finalizeToBackground]);

  useEffect(() => {
    if (phase !== "video") return;

    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", {
      willReadFrequently: true,
    });

    if (!sampleContext) return;

    const pointer = {
      active: false,
      pressed: false,
    };
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
    let introStartedAt = performance.now();

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
      if (points && scene) {
        scene.remove(points);
      }

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
      pointer.active = true;
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
      const nextSampleWidth =
        width < 640 ? 144 : width < 1024 ? 192 : 256;
      const nextSampleHeight = Math.max(
        1,
        Math.round(nextSampleWidth * (video.videoHeight / video.videoWidth))
      );

      if (
        nextSampleWidth === sampleWidth &&
        nextSampleHeight === sampleHeight &&
        geometry
      ) {
        return;
      }

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
        new THREE.BufferAttribute(currentPositions, 3).setUsage(
          THREE.DynamicDrawUsage
        )
      );
      geometry.setAttribute(
        "aColor",
        new THREE.BufferAttribute(currentColors, 3).setUsage(
          THREE.DynamicDrawUsage
        )
      );
      geometry.setAttribute(
        "aSize",
        new THREE.BufferAttribute(currentSizes, 1).setUsage(
          THREE.DynamicDrawUsage
        )
      );
      geometry.setAttribute(
        "aOpacity",
        new THREE.BufferAttribute(currentOpacities, 1).setUsage(
          THREE.DynamicDrawUsage
        )
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
      ) {
        return;
      }

      sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
      sampleContext.drawImage(video, 0, 0, sampleWidth, sampleHeight);
      const frame = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight).data;

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
          const sampleLuma = (candidateIndex: number) =>
            candidateIndex >= 0 && candidateIndex < lumaMap!.length
              ? lumaMap![candidateIndex]
              : luma;
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
          const scatterRadius = (1 - reveal) * (360 + normalizedDistance * 560);
          const scatterX =
            SCENE_W / 2 +
            Math.cos(seed * 11.9) * scatterRadius +
            Math.sin(time * 0.0011 + seed * 4.7) * 12;
          const scatterY =
            SCENE_H / 2 +
            Math.sin(seed * 9.3) * scatterRadius * 0.72 +
            Math.cos(time * 0.001 + seed * 5.9) * 12;
          const formedX =
            baseX + Math.sin(time * 0.0016 + seed * 6.2) * (0.2 + edge * 18);
          const formedY =
            baseY + Math.cos(time * 0.0014 + seed * 5.4) * (0.2 + edge * 18);
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

      if (!sampleWidth || !sampleHeight) {
        createPointCloud();
      }

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
          ) {
            continue;
          }

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
      pointer.active = false;
      pointer.pressed = false;
      uniforms.uPointerActive.value = 0;
      uniforms.uPointerPressed.value = 0;
    };
    const handlePointerDown = (event: PointerEvent) => {
      updatePointer(event);
      pointer.pressed = true;
      uniforms.uPointerPressed.value = 1;
    };
    const handlePointerUp = () => {
      pointer.pressed = false;
      uniforms.uPointerPressed.value = 0;
    };

    resizeScene();
    introStartedAt = performance.now();
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
  }, [phase]);

  useEffect(() => {
    if (phase !== "video") return;

    let nextIndex = -1;
    for (let i = TIMED_SUBTITLES.length - 1; i >= 0; i -= 1) {
      if (videoTime >= TIMED_SUBTITLES[i][0]) {
        nextIndex = i;
        break;
      }
    }

    if (nextIndex !== currentSubtitleIndex && nextIndex !== -1) {
      setCurrentSubtitleIndex(nextIndex);
      setCurrentCharIndex(0);
      setDisplayedText("");
      setIsTyping(true);
      setShowSubtitle(true);

      if (subtitleTimeoutRef.current) {
        clearTimeout(subtitleTimeoutRef.current);
      }

      const duration = TIMED_SUBTITLES[nextIndex][2];
      if (duration) {
        subtitleTimeoutRef.current = setTimeout(() => {
          setShowSubtitle(false);
        }, duration * 1000);
      }
    }
  }, [phase, videoTime, currentSubtitleIndex]);

  useEffect(() => {
    if (!isTyping || currentSubtitleIndex === -1) return;

    const currentLine = TIMED_SUBTITLES[currentSubtitleIndex]?.[1];
    if (!currentLine) return;

    if (currentCharIndex < currentLine.length) {
      const timer = setTimeout(() => {
        setDisplayedText(currentLine.slice(0, currentCharIndex + 1));
        setCurrentCharIndex((prev) => prev + 1);
      }, 50);

      return () => clearTimeout(timer);
    }

    setIsTyping(false);
  }, [isTyping, currentSubtitleIndex, currentCharIndex]);

  const handleWheel = useCallback(
    (event: WheelEvent) => {
      if (phase === "video" || phase === "hello") {
        event.preventDefault();
        finalizeToBackground();
      }
    },
    [phase, finalizeToBackground]
  );

  const handleTouchMove = useCallback(
    (event: TouchEvent) => {
      if (phase === "video" || phase === "hello") {
        event.preventDefault();
        finalizeToBackground();
      }
    },
    [phase, finalizeToBackground]
  );

  useEffect(() => {
    if (phase === "hello" || phase === "video") {
      document.body.style.overflow = "hidden";
      window.addEventListener("wheel", handleWheel, { passive: false });
      window.addEventListener("touchmove", handleTouchMove, {
        passive: false,
      });
    } else if (phase === "thanks" || phase === "skipped") {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchmove", handleTouchMove);
    };
  }, [phase, handleWheel, handleTouchMove]);

  const handleClick = useCallback(() => {
    if (phase === "hello") {
      setPhase("video");
    } else if (phase === "thanks" || phase === "skipped") {
      setPhase("done");
    }
  }, [phase]);

  useEffect(() => {
    if (phase === "skipped") {
      const timer = setTimeout(() => {
        setPhase("done");
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [phase]);

  if (phase === "done") {
    return null;
  }

  return (
    <div
      onClick={handleClick}
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 99999,
        background: "#000000",
        cursor: "pointer",
        opacity: fadeOut ? 0 : 1,
        transition: "opacity 0.5s ease-out",
        margin: 0,
        padding: 0,
        overflow: "hidden",
      }}
    >
      <video
        ref={videoRef}
        src="/video3.mp4"
        preload="auto"
        muted
        playsInline
        style={{
          position: "absolute",
          width: 1,
          height: 1,
          opacity: 0,
          pointerEvents: "none",
        }}
      />

      {phase === "hello" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#000000",
          }}
        >
          <h1
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
              fontSize: "clamp(5rem, 20vw, 14rem)",
              fontWeight: 500,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
              margin: 0,
              animation: "fadeIn 1s ease-out",
            }}
          >
            Salvē!
          </h1>

          <div
            style={{
              position: "absolute",
              bottom: "3rem",
              left: "50%",
              transform: "translateX(-50%)",
              color: "#FFFFFF",
              opacity: 0.4,
              fontFamily: "'Courier Prime', monospace",
              fontSize: "0.75rem",
              letterSpacing: "0.15em",
              textTransform: "uppercase",
            }}
          >
            click or wait
          </div>
        </div>
      )}

      <div
        style={{
          position: "absolute",
          inset: 0,
          width: "100vw",
          height: "100vh",
          margin: 0,
          padding: 0,
          overflow: "hidden",
          background: PAPER_COLOR,
          opacity: phase === "video" ? 1 : 0,
          visibility: phase === "video" ? "visible" : "hidden",
          transition: "opacity 0.8s ease-out",
        }}
      >
        <canvas
          ref={canvasRef}
          className="h-full w-full touch-none"
          style={{
            display: "block",
            width: "100%",
            height: "100%",
          }}
        />

        {phase === "video" && displayedText && showSubtitle && (
          <div
            style={{
              position: "absolute",
              bottom: "5.5rem",
              left: "50%",
              transform: "translateX(-50%)",
              color: "#161514",
              fontFamily: "'Courier Prime', monospace",
              fontSize: "clamp(0.95rem, 2.2vw, 1.25rem)",
              letterSpacing: "0.04em",
              textAlign: "center",
              background: "rgba(247, 244, 236, 0.82)",
              border: "1px solid rgba(22, 21, 20, 0.14)",
              padding: "0.8rem 1.25rem",
              borderRadius: "999px",
              maxWidth: "80%",
              lineHeight: 1.45,
              boxShadow: "0 10px 30px rgba(0, 0, 0, 0.05)",
            }}
          >
            {displayedText}
            {isTyping && (
              <span
                style={{
                  display: "inline-block",
                  width: "2px",
                  height: "1.05em",
                  background: "#161514",
                  marginLeft: "4px",
                  verticalAlign: "text-bottom",
                  animation: "blink 1s infinite",
                }}
              />
            )}
          </div>
        )}

        {phase === "video" && (
          <div
            style={{
              position: "absolute",
              bottom: "2rem",
              right: "2rem",
              color: "rgba(22, 21, 20, 0.7)",
              fontFamily: "'Courier Prime', monospace",
              fontSize: "0.72rem",
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              background: "rgba(247, 244, 236, 0.76)",
              border: "1px solid rgba(22, 21, 20, 0.12)",
              padding: "0.5rem 0.9rem",
              borderRadius: "999px",
            }}
          >
            scroll to skip
          </div>
        )}
      </div>

      {phase === "skipped" && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "#000000",
            animation: "fadeIn 0.5s ease-out",
          }}
        >
          <span
            style={{
              fontFamily:
                '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif',
              fontSize: "clamp(5rem, 20vw, 14rem)",
              fontWeight: 500,
              color: "#FFFFFF",
              letterSpacing: "-0.03em",
            }}
          >
            :(
          </span>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes blink {
          0%,
          50% {
            opacity: 1;
          }
          51%,
          100% {
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
