"use client";

import React, { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";

type Props = { activeLine: number; className?: string };

type SceneName =
  | "title"
  | "standing-still"
  | "ripple"
  | "paris"
  | "demon-eyes"
  | "frozen-heart"
  | "stars"
  | "consciousness"
  | "company"
  | "faces"
  | "tunnel"
  | "erosion";

const SCENE_NAMES: SceneName[] = [
  "title",
  "standing-still",
  "ripple",
  "paris",
  "demon-eyes",
  "frozen-heart",
  "stars",
  "consciousness",
  "company",
  "faces",
  "tunnel",
  "erosion",
];

const TEX_SIZE = 512;
const N = 24000;

function sceneFromLine(l: number): SceneName {
  if (l < 0) return "title";
  if (l <= 3) return "standing-still";
  if (l <= 10) return "ripple";
  if (l <= 19) return "paris";
  if (l <= 22) return "demon-eyes";
  if (l <= 28) return "frozen-heart";
  if (l <= 36) return "stars";
  if (l <= 39) return "consciousness";
  if (l <= 46) return "company";
  if (l <= 51) return "faces";
  if (l <= 59) return "tunnel";
  return "erosion";
}

function defaultPalette(s: SceneName): [number, number, number] {
  switch (s) {
    case "standing-still":
      return [32, 38, 52];
    case "ripple":
      return [48, 35, 105];
    case "paris":
      return [160, 115, 45];
    case "demon-eyes":
      return [145, 24, 38];
    case "frozen-heart":
      return [25, 110, 170];
    case "stars":
      return [45, 38, 100];
    case "consciousness":
      return [65, 72, 92];
    case "company":
      return [105, 72, 48];
    case "faces":
      return [58, 65, 85];
    case "tunnel":
      return [125, 28, 62];
    case "erosion":
      return [48, 52, 62];
    default:
      return [72, 78, 92];
  }
}

function pseudo(s: number) {
  const x = Math.sin(s * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

async function loadSceneImages(): Promise<Map<SceneName, Uint8Array>> {
  const map = new Map<SceneName, Uint8Array>();
  const offscreen = document.createElement("canvas");
  offscreen.width = TEX_SIZE;
  offscreen.height = TEX_SIZE;
  const ctx = offscreen.getContext("2d", { willReadFrequently: true })!;

  await Promise.all(
    SCENE_NAMES.map(
      (name) =>
        new Promise<void>((resolve) => {
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => {
            ctx.clearRect(0, 0, TEX_SIZE, TEX_SIZE);
            ctx.drawImage(img, 0, 0, TEX_SIZE, TEX_SIZE);
            const data = ctx.getImageData(0, 0, TEX_SIZE, TEX_SIZE).data;
            const brightness = new Uint8Array(TEX_SIZE * TEX_SIZE);
            for (let i = 0; i < brightness.length; i++) {
              // Extract luminance
              brightness[i] = data[i * 4];
            }
            map.set(name, brightness);
            resolve();
          };
          img.onerror = () => {
            map.set(name, new Uint8Array(TEX_SIZE * TEX_SIZE).fill(255));
            resolve();
          };
          img.src = `/scenes/${name}.png`;
        }),
    ),
  );

  return map;
}

function sampleBrightness(
  tex: Uint8Array | undefined,
  u: number,
  v: number,
): number {
  if (!tex) return 255;
  const px = Math.min(TEX_SIZE - 1, Math.max(0, Math.floor(u * TEX_SIZE)));
  const py = Math.min(TEX_SIZE - 1, Math.max(0, Math.floor(v * TEX_SIZE)));
  return tex[py * TEX_SIZE + px];
}

type Motion = { dx: number; dy: number; opacityMul: number };

function sceneMotion(
  scene: SceneName,
  u: number,
  v: number,
  w: number,
  h: number,
  ts: number,
  seed: number,
  line: number,
  darkness: number,
): Motion {
  const n1 = pseudo(seed + 0.17);
  const n2 = pseudo(seed + 0.73);
  const n3 = pseudo(seed + 1.41);
  const m = Math.min(w, h);

  switch (scene) {
    case "title": {
      const dx =
        Math.sin(ts * 0.0004 + seed * 3.7) * m * 0.08 +
        Math.sin(ts * 0.00017 + seed * 7.1) * m * 0.05;
      const dy =
        Math.cos(ts * 0.0003 + seed * 5.3) * m * 0.06 +
        Math.cos(ts * 0.00021 + seed * 2.9) * m * 0.04;
      return { dx, dy, opacityMul: 1 };
    }

    case "standing-still": {
      if (darkness > 0.25) {
        return { dx: 0, dy: 0, opacityMul: 1 };
      }
      const speed = 0.4 + n1 * 0.8;
      const dir = n3 > 0.5 ? 1 : -1;
      const phase = ((ts * 0.0015 * speed + n2 * 500) % (w + 200));
      const dx = dir > 0 ? phase - u * w : u * w - phase;
      return { dx, dy: Math.sin(ts * 0.002 + seed * 10) * 4, opacityMul: 1 };
    }

    case "ripple": {
      const rcx = 0.5;
      const rcy = 0.5;
      const rdu = u - rcx;
      const rdv = v - rcy;
      const rdist = Math.sqrt(rdu * rdu + rdv * rdv);
      if (rdist < 0.001) return { dx: 0, dy: 0, opacityMul: 1 };
      const pulse = Math.sin(ts * 0.002 - rdist * 18) * m * 0.05;
      return {
        dx: (rdu / rdist) * pulse,
        dy: (rdv / rdist) * pulse,
        opacityMul: 1,
      };
    }

    case "paris": {
      const shimmer = Math.sin(ts * 0.003 + seed * 12) * m * 0.008;
      const rise = -Math.abs(Math.sin(ts * 0.0005 + seed * 4)) * m * 0.025;
      const sparkle = Math.sin(ts * 0.008 + seed * 23) > 0.82 ? 1.5 : 1.0;
      return { dx: shimmer, dy: rise, opacityMul: sparkle };
    }

    case "demon-eyes": {
      const leftU = 0.35;
      const rightU = 0.65;
      const eyeV = 0.48;
      const nearLeft = Math.sqrt((u - leftU) ** 2 + (v - eyeV) ** 2);
      const nearRight = Math.sqrt((u - rightU) ** 2 + (v - eyeV) ** 2);
      const nearest = nearLeft < nearRight ? leftU : rightU;
      const edu = nearest - u;
      const edv = eyeV - v;
      const edist = Math.sqrt(edu * edu + edv * edv);
      const pull = Math.sin(ts * 0.0015) * 0.5 + 0.5;
      const strength = m * 0.04 * pull;
      if (edist < 0.001) return { dx: 0, dy: 0, opacityMul: 1 };
      return {
        dx: (edu / edist) * strength,
        dy: (edv / edist) * strength,
        opacityMul: 1,
      };
    }

    case "frozen-heart": {
      const progress = Math.min(1, (line - 23) / 5);
      const jScale = m * 0.012 * (0.3 + progress * 3.5);
      const dx = Math.sin(ts * 0.006 + seed * 9) * jScale;
      const dy = Math.cos(ts * 0.007 + seed * 11) * jScale;
      return { dx, dy, opacityMul: 1 };
    }

    case "stars": {
      const depth = n1;
      const sspeed = 0.1 + depth * 0.4;
      const dx = Math.sin(ts * 0.0002 * sspeed + seed) * m * 0.04 * (1 + depth);
      const dy = Math.cos(ts * 0.00015 * sspeed + seed * 2) * m * 0.025 * (1 + depth);
      const twinkle = 0.5 + 0.5 * Math.sin(ts * 0.006 + seed * 17);
      return { dx, dy, opacityMul: darkness > 0.3 ? twinkle : 1 };
    }

    case "consciousness": {
      const cphase = Math.min(2, Math.max(0, line - 37));
      const waveAmp = m * 0.06 * (0.3 + cphase * 1.2);
      const dx = Math.sin(v * 12 + ts * 0.0015) * waveAmp;
      const dy = Math.cos(u * 8 + ts * 0.001) * waveAmp * 0.4;
      return { dx, dy, opacityMul: 1 };
    }

    case "company": {
      const isRight = u > 0.55;
      if (!isRight) return { dx: 0, dy: 0, opacityMul: 1 };
      const flick = pseudo(seed + Math.floor(ts * 0.004) * 0.1);
      const vis = flick > 0.3;
      const dissolve = Math.sin(ts * 0.003 + seed * 7) * 0.5 + 0.5;
      return {
        dx: (1 - dissolve) * (n1 - 0.5) * m * 0.06,
        dy: (1 - dissolve) * (n2 - 0.5) * m * 0.04,
        opacityMul: vis ? 0.85 + dissolve * 0.15 : 0.05,
      };
    }

    case "faces": {
      const fangle = ts * 0.0004 + seed * 0.5;
      const fradius = m * 0.02;
      return {
        dx: Math.cos(fangle) * fradius,
        dy: Math.sin(fangle) * fradius,
        opacityMul: 1,
      };
    }

    case "tunnel": {
      const tcx = 0.52;
      const tcy = 0.5;
      const tdu = tcx - u;
      const tdv = tcy - v;
      const tdist = Math.sqrt(tdu * tdu + tdv * tdv);
      if (tdist < 0.01) return { dx: 0, dy: 0, opacityMul: 1 };
      const tdepth = Math.min(1, tdist * 2.5);
      const tpull = m * 0.05 * tdepth;
      return {
        dx: (tdu / tdist) * tpull * Math.sin(ts * 0.0015 + tdist * 8),
        dy: (tdv / tdist) * tpull * Math.sin(ts * 0.0015 + tdist * 8),
        opacityMul: 1,
      };
    }

    case "erosion": {
      const estep = Math.max(0, line - 60);
      const liftStrength = estep * 0.3;
      const isLifting = n3 < 0.15 + estep * 0.15;
      if (!isLifting) return { dx: 0, dy: 0, opacityMul: 1 };
      const lift =
        -m * 0.08 * liftStrength * (1 + Math.sin(ts * 0.003 + seed) * 0.5);
      const scatter = (n1 - 0.5) * m * 0.06 * liftStrength;
      return { dx: scatter, dy: lift, opacityMul: 1 - liftStrength * 0.15 };
    }

    default:
      return { dx: 0, dy: 0, opacityMul: 1 };
  }
}

function springForScene(scene: SceneName): { spr: number; dmp: number } {
  switch (scene) {
    case "title":
      return { spr: 0.03, dmp: 0.92 };
    case "standing-still":
      return { spr: 0.22, dmp: 0.68 };
    case "ripple":
      return { spr: 0.06, dmp: 0.88 };
    case "stars":
      return { spr: 0.025, dmp: 0.94 };
    case "tunnel":
      return { spr: 0.08, dmp: 0.84 };
    case "consciousness":
      return { spr: 0.04, dmp: 0.90 };
    case "faces":
      return { spr: 0.04, dmp: 0.92 };
    case "erosion":
      return { spr: 0.035, dmp: 0.92 };
    default:
      return { spr: 0.06, dmp: 0.88 };
  }
}

export default function ProceduralVisual({ activeLine, className }: Props) {
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const sceneRef = useRef<SceneName>("title");
  const lineRef = useRef(activeLine);
  const texMapRef = useRef<Map<SceneName, Uint8Array> | null>(null);

  const scene = useMemo(() => sceneFromLine(activeLine), [activeLine]);

  useEffect(() => {
    sceneRef.current = scene;
    lineRef.current = activeLine;
  }, [scene, activeLine]);

  useEffect(() => {
    const wrapper = wrapperRef.current;
    const canvas = canvasRef.current;
    if (!wrapper || !canvas) return;

    const gridU = new Float32Array(N);
    const gridV = new Float32Array(N);
    const jitterX = new Float32Array(N);
    const jitterY = new Float32Array(N);
    const seeds = new Float32Array(N);

    for (let i = 0; i < N; i++) {
      seeds[i] = i * 0.743 + 0.1;
      const n1 = pseudo(seeds[i] + 0.17);
      const n2 = pseudo(seeds[i] + 0.73);
      gridU[i] = n1;
      gridV[i] = n2;
      jitterX[i] = (pseudo(seeds[i] + 1.41) - 0.5) * 2;
      jitterY[i] = (pseudo(seeds[i] + 2.03) - 0.5) * 2;
    }

    const currentPos = new Float32Array(N * 3);
    const velocities = new Float32Array(N * 2);
    const currentColors = new Float32Array(N * 3);
    const currentSizes = new Float32Array(N);
    const currentOpacities = new Float32Array(N);

    let renderer: THREE.WebGLRenderer;
    let threeScene: THREE.Scene;
    let camera: THREE.OrthographicCamera;
    let geometry: THREE.BufferGeometry;
    let material: THREE.ShaderMaterial;
    let w = 1;
    let h = 1;
    let basePointSize = 1.8;
    let prevScene: SceneName = "title";
    let sceneFade = 1;

    const ptrUniform = {
      uPointer: { value: new THREE.Vector2(-9999, -9999) },
      uPointerActive: { value: 0 as number },
      uPointerPressed: { value: 0 as number },
    };

    try {
      renderer = new THREE.WebGLRenderer({
        canvas,
        alpha: true,
        antialias: false,
        powerPreference: "high-performance",
      });
      // Use transparent background so it blends nicely with the page
      renderer.setClearColor(0xffffff, 0);

      threeScene = new THREE.Scene();
      camera = new THREE.OrthographicCamera(0, 1, 0, 1, -1, 1);

      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms: ptrUniform,
        vertexShader: `
          uniform vec2 uPointer;
          uniform float uPointerActive;
          uniform float uPointerPressed;
          attribute vec3 aColor;
          attribute float aSize;
          attribute float aOpacity;
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            vec2 fp = position.xy;
            float influence = 0.0;
            if (uPointerActive > 0.5) {
              vec2 delta = fp - uPointer;
              float dist = length(delta);
              float radius = mix(140.0, 210.0, uPointerPressed);
              if (dist < radius && dist > 0.001) {
                float inf = pow(1.0 - dist / radius, 2.0);
                vec2 dir = delta / dist;
                vec2 tan = vec2(-dir.y, dir.x);
                fp += dir * mix(24.0, 38.0, uPointerPressed) * inf
                    + tan * mix(12.0, 20.0, uPointerPressed) * inf;
                influence = inf;
              }
            }
            gl_Position = projectionMatrix * modelViewMatrix * vec4(fp, position.z, 1.0);
            
            // Slightly softer point size depending on density
            gl_PointSize = aSize * mix(1.0, 1.3, influence);
            vColor = mix(aColor, vec3(1.0), influence * 0.05);
            vOpacity = aOpacity;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vOpacity;
          void main() {
            if (vOpacity < 0.01) discard;
            // Render as soft circles instead of hard squares for better quality
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            float edge = 1.0 - smoothstep(0.3, 0.5, d);
            if (edge <= 0.0) discard;
            
            gl_FragColor = vec4(vColor, vOpacity * edge);
          }
        `,
      });

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(currentPos, 3),
      );
      geometry.setAttribute(
        "aColor",
        new THREE.BufferAttribute(currentColors, 3),
      );
      geometry.setAttribute(
        "aSize",
        new THREE.BufferAttribute(currentSizes, 1),
      );
      geometry.setAttribute(
        "aOpacity",
        new THREE.BufferAttribute(currentOpacities, 1),
      );

      const pts = new THREE.Points(geometry, material);
      threeScene.add(pts);
    } catch {
      return;
    }

    const resize = () => {
      const rect = wrapper.getBoundingClientRect();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = Math.max(320, Math.floor(rect.width));
      h = Math.max(240, Math.floor(rect.height));

      renderer.setPixelRatio(dpr);
      renderer.setSize(w, h, false);

      camera.left = 0;
      camera.right = w;
      camera.top = 0;
      camera.bottom = h;
      camera.updateProjectionMatrix();

      // Slightly larger base point size for better coverage
      basePointSize =
        Math.max(1.8, Math.min(3.2, 2.4 * (Math.min(w, h) / 600))) * dpr;
    };

    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(wrapper);

    const onMove = (e: PointerEvent) => {
      const r = wrapper.getBoundingClientRect();
      if (
        e.clientX < r.left ||
        e.clientX > r.right ||
        e.clientY < r.top ||
        e.clientY > r.bottom
      )
        return;
      ptrUniform.uPointer.value.set(e.clientX - r.left, e.clientY - r.top);
      ptrUniform.uPointerActive.value = 1;
    };
    const onDown = (e: PointerEvent) => {
      onMove(e);
      ptrUniform.uPointerPressed.value = 1;
    };
    const onUp = () => {
      ptrUniform.uPointerPressed.value = 0;
    };
    const onLeave = () => {
      ptrUniform.uPointerActive.value = 0;
      ptrUniform.uPointerPressed.value = 0;
    };

    wrapper.addEventListener("pointermove", onMove, { passive: true });
    wrapper.addEventListener("pointerdown", onDown);
    wrapper.addEventListener("pointerleave", onLeave);
    window.addEventListener("pointerup", onUp);

    loadSceneImages().then((m) => {
      texMapRef.current = m;
    });

    let dead = false;
    let raf = 0;

    const renderFrame = (ts: number) => {
      if (dead) return;

      const sName = sceneRef.current;
      const curLine = lineRef.current;
      const pal = defaultPalette(sName);
      const texMap = texMapRef.current;
      const tex = texMap?.get(sName);

      if (sName !== prevScene) {
        prevScene = sName;
        sceneFade = 0.08;
      }
      sceneFade = Math.min(1, sceneFade + 0.018);

      const isErosion = sName === "erosion";
      let erosionFrac = 1;
      if (isErosion) {
        const step = Math.max(0, curLine - 60);
        const fracs = [1.0, 0.78, 0.52, 0.30, 0.12, 0.02];
        erosionFrac = fracs[Math.min(step, 5)];
      }

      const palR = pal[0] / 255;
      const palG = pal[1] / 255;
      const palB = pal[2] / 255;

      const { spr, dmp } = springForScene(sName);

      for (let i = 0; i < N; i++) {
        const i3 = i * 3;
        const i2 = i * 2;

        const u = gridU[i];
        const v = gridV[i];

        const brightness = sampleBrightness(tex, u, v);
        // Map brightness to darkness (0 is white, 1 is black)
        // Adjust the curve so we get more contrast and less washed-out look
        let darkness = 1.0 - (brightness / 255.0);
        
        // Push the darkness up to make the image more solid and less "dotty"
        darkness = Math.pow(darkness, 0.8);

        const motion = sceneMotion(
          sName, u, v, w, h, ts, seeds[i], curLine, darkness,
        );

        const targetX =
          u * w + jitterX[i] * basePointSize * 0.4 + motion.dx;
        const targetY =
          v * h + jitterY[i] * basePointSize * 0.4 + motion.dy;

        // Base opacity relies heavily on the image darkness
        let targetOpacity = darkness * 1.8 * motion.opacityMul;

        if (isErosion && i / N > erosionFrac) {
          targetOpacity = 0;
        }

        targetOpacity = Math.min(1, targetOpacity * sceneFade);

        // Color mapping: use the palette, but let darkness dictate intensity
        const tint = 0.6; // How much of the palette color to use vs grayscale
        const targetR = darkness * (1 - tint) + palR * tint * darkness * 1.5;
        const targetG = darkness * (1 - tint) + palG * tint * darkness * 1.5;
        const targetB = darkness * (1 - tint) + palB * tint * darkness * 1.5;
        
        // Particles are larger where the image is darker, creating a solid fill
        const targetSize = basePointSize * (0.5 + darkness * 1.5);

        velocities[i2] =
          (velocities[i2] + (targetX - currentPos[i3]) * spr) * dmp;
        velocities[i2 + 1] =
          (velocities[i2 + 1] + (targetY - currentPos[i3 + 1]) * spr) * dmp;
        currentPos[i3] += velocities[i2];
        currentPos[i3 + 1] += velocities[i2 + 1];

        currentColors[i3] += (targetR - currentColors[i3]) * 0.15;
        currentColors[i3 + 1] += (targetG - currentColors[i3 + 1]) * 0.15;
        currentColors[i3 + 2] += (targetB - currentColors[i3 + 2]) * 0.15;
        currentSizes[i] += (targetSize - currentSizes[i]) * 0.2;
        currentOpacities[i] += (targetOpacity - currentOpacities[i]) * 0.2;
      }

      (
        geometry.getAttribute("position") as THREE.BufferAttribute
      ).needsUpdate = true;
      (geometry.getAttribute("aColor") as THREE.BufferAttribute).needsUpdate =
        true;
      (geometry.getAttribute("aSize") as THREE.BufferAttribute).needsUpdate =
        true;
      (
        geometry.getAttribute("aOpacity") as THREE.BufferAttribute
      ).needsUpdate = true;

      renderer.render(threeScene, camera);
      raf = requestAnimationFrame(renderFrame);
    };

    raf = requestAnimationFrame(renderFrame);

    return () => {
      dead = true;
      cancelAnimationFrame(raf);
      ro.disconnect();
      wrapper.removeEventListener("pointermove", onMove);
      wrapper.removeEventListener("pointerdown", onDown);
      wrapper.removeEventListener("pointerleave", onLeave);
      window.removeEventListener("pointerup", onUp);
      geometry?.dispose();
      material?.dispose();
      renderer?.dispose();
    };
  }, []);

  return (
    <div
      ref={wrapperRef}
      className={className ?? "relative h-full w-full"}
      aria-hidden="true"
    >
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: "none" }}
      />
    </div>
  );
}
