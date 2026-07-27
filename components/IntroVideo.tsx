"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";

const SCENE_WIDTH = 1920;
const SCENE_HEIGHT = 1080;
const SAMPLE_FPS = 18;
const PAPER_COLOR = "#ffffff";
const VIDEO_LOOP = {
  start: 86,
  crossfadeStart: 89,
  end: 89.96,
} as const;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export default function IntroVideo() {
  const loop = VIDEO_LOOP;
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const blendVideoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    const blendVideo = blendVideoRef.current;
    if (!video || !blendVideo) return;

    const videos = [video, blendVideo];
    videos.forEach((item) => {
      item.muted = true;
      item.defaultMuted = true;
      item.playsInline = true;
      item.loop = false;
      item.setAttribute("muted", "");
      item.setAttribute("playsinline", "");
    });

    let initialized = false;
    let startupFrame = 0;
    const initializeVideos = () => {
      if (initialized) return;

      if (
        videos.some(
          (item) => item.readyState < HTMLMediaElement.HAVE_METADATA
        )
      ) {
        startupFrame = requestAnimationFrame(initializeVideos);
        return;
      }

      initialized = true;
      video.currentTime = loop.start;
      blendVideo.currentTime = loop.start;
      blendVideo.pause();
      void video.play().catch(() => {});
    };

    initializeVideos();

    return () => {
      cancelAnimationFrame(startupFrame);
      videos.forEach((item) => {
        item.pause();
      });
    };
  }, [loop]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    const blendVideo = blendVideoRef.current;
    if (!canvas || !video || !blendVideo) return;

    const sampleCanvas = document.createElement("canvas");
    const sampleContext = sampleCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const blendCanvas = document.createElement("canvas");
    const blendContext = blendCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    if (!sampleContext || !blendContext) return;

    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    const cover = {
      left: 0,
      bottom: 0,
      visibleWidth: SCENE_WIDTH,
      visibleHeight: SCENE_HEIGHT,
      scale: 1,
    };
    const uniforms = {
      uReveal: { value: reducedMotion ? 1 : 0 },
    };

    let cancelled = false;
    let animationFrame = 0;
    let lastSampleAt = 0;
    let sampleWidth = 0;
    let sampleHeight = 0;
    let pointScale = 8;
    let activeVideo: HTMLVideoElement = video;
    let incomingVideo: HTMLVideoElement = blendVideo;
    let isCrossfading = false;
    let blendAmount = 0;
    const startedAt = performance.now();

    let renderer: THREE.WebGLRenderer;
    let scene: THREE.Scene;
    let camera: THREE.OrthographicCamera;
    let material: THREE.ShaderMaterial;
    let geometry: THREE.BufferGeometry | null = null;
    let points: THREE.Points | null = null;
    let colors: Float32Array | null = null;
    let currentSizes: Float32Array | null = null;
    let targetSizes: Float32Array | null = null;
    let currentOpacities: Float32Array | null = null;
    let targetOpacities: Float32Array | null = null;

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
      camera = new THREE.OrthographicCamera(
        0,
        SCENE_WIDTH,
        SCENE_HEIGHT,
        0,
        -10,
        10
      );

      material = new THREE.ShaderMaterial({
        transparent: true,
        depthWrite: false,
        uniforms,
        vertexShader: `
          uniform float uReveal;

          attribute vec3 aColor;
          attribute float aSize;
          attribute float aOpacity;

          varying vec3 vColor;
          varying float vOpacity;

          void main() {
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = aSize;

            vColor = aColor;
            vOpacity = aOpacity * uReveal;
          }
        `,
        fragmentShader: `
          varying vec3 vColor;
          varying float vOpacity;

          void main() {
            vec2 centered = abs(gl_PointCoord - vec2(0.5));
            float squareEdge = max(centered.x, centered.y);
            float edgeMask = 1.0 - smoothstep(0.44, 0.5, squareEdge);

            if (edgeMask <= 0.0) discard;
            gl_FragColor = vec4(vColor, vOpacity * edgeMask);
          }
        `,
      });
    } catch {
      return;
    }

    const disposePointCloud = () => {
      if (points) scene.remove(points);
      geometry?.dispose();
      geometry = null;
      points = null;
      colors = null;
      currentSizes = null;
      targetSizes = null;
      currentOpacities = null;
      targetOpacities = null;
    };

    const createPointCloud = () => {
      if (!video.videoWidth || !video.videoHeight) return;

      const viewportWidth = canvas.clientWidth;
      const nextSampleWidth =
        viewportWidth < 640 ? 104 : viewportWidth < 1024 ? 132 : 168;
      const nextSampleHeight = Math.max(
        1,
        Math.round(nextSampleWidth * (video.videoHeight / video.videoWidth))
      );

      if (
        geometry &&
        nextSampleWidth === sampleWidth &&
        nextSampleHeight === sampleHeight
      ) {
        return;
      }

      sampleWidth = nextSampleWidth;
      sampleHeight = nextSampleHeight;
      sampleCanvas.width = sampleWidth;
      sampleCanvas.height = sampleHeight;
      blendCanvas.width = sampleWidth;
      blendCanvas.height = sampleHeight;
      disposePointCloud();

      const pointCount = sampleWidth * sampleHeight;
      const positions = new Float32Array(pointCount * 3);
      colors = new Float32Array(pointCount * 3);
      currentSizes = new Float32Array(pointCount);
      targetSizes = new Float32Array(pointCount);
      currentOpacities = new Float32Array(pointCount);
      targetOpacities = new Float32Array(pointCount);

      for (let y = 0; y < sampleHeight; y += 1) {
        for (let x = 0; x < sampleWidth; x += 1) {
          const index = y * sampleWidth + x;
          const cursor = index * 3;

          positions[cursor] = ((x + 0.5) / sampleWidth) * SCENE_WIDTH;
          positions[cursor + 1] =
            SCENE_HEIGHT - ((y + 0.5) / sampleHeight) * SCENE_HEIGHT;
          colors[cursor] = 0.75;
          colors[cursor + 1] = 0.75;
          colors[cursor + 2] = 0.75;
          currentSizes[index] = pointScale * 0.5;
          targetSizes[index] = pointScale * 0.5;
          currentOpacities[index] = 0;
          targetOpacities[index] = 0;
        }
      }

      geometry = new THREE.BufferGeometry();
      geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
      geometry.setAttribute(
        "aColor",
        new THREE.BufferAttribute(colors, 3).setUsage(THREE.DynamicDrawUsage)
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

    const resizeScene = () => {
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;
      if (!width || !height) return;

      const pixelRatio = Math.min(window.devicePixelRatio || 1, 1.6);
      renderer.setPixelRatio(pixelRatio);
      renderer.setSize(width, height, false);

      cover.scale = Math.max(width / SCENE_WIDTH, height / SCENE_HEIGHT);
      cover.visibleWidth = width / cover.scale;
      cover.visibleHeight = height / cover.scale;
      cover.left = (SCENE_WIDTH - cover.visibleWidth) / 2;
      cover.bottom = (SCENE_HEIGHT - cover.visibleHeight) / 2;

      camera.left = cover.left;
      camera.right = cover.left + cover.visibleWidth;
      camera.bottom = cover.bottom;
      camera.top = cover.bottom + cover.visibleHeight;
      camera.updateProjectionMatrix();

      pointScale = clamp(7.8 * cover.scale, 6.4, 10.5) * pixelRatio;
      createPointCloud();
    };

    const updateVideoLoop = () => {
      if (activeVideo.readyState < HTMLMediaElement.HAVE_METADATA) return;

      if (activeVideo.currentTime < loop.start) {
        activeVideo.currentTime = loop.start;
        void activeVideo.play().catch(() => {});
      }

      if (
        !isCrossfading &&
        activeVideo.currentTime >= loop.crossfadeStart
      ) {
        incomingVideo.currentTime = loop.start;
        void incomingVideo.play().catch(() => {});
        isCrossfading = true;
      }

      if (!isCrossfading) return;

      const linearBlend = clamp(
        (activeVideo.currentTime - loop.crossfadeStart) /
          (loop.end - loop.crossfadeStart),
        0,
        1
      );
      blendAmount = linearBlend * linearBlend * (3 - 2 * linearBlend);

      if (activeVideo.currentTime < loop.end) return;

      const outgoingVideo = activeVideo;
      activeVideo = incomingVideo;
      incomingVideo = outgoingVideo;
      incomingVideo.pause();
      incomingVideo.currentTime = loop.start;
      isCrossfading = false;
      blendAmount = 0;
    };

    const sampleFrame = () => {
      createPointCloud();
      if (
        !sampleWidth ||
        !sampleHeight ||
        activeVideo.readyState < HTMLMediaElement.HAVE_CURRENT_DATA ||
        !geometry ||
        !colors ||
        !targetSizes ||
        !targetOpacities
      ) {
        return;
      }

      sampleContext.drawImage(activeVideo, 0, 0, sampleWidth, sampleHeight);
      const frame = sampleContext.getImageData(
        0,
        0,
        sampleWidth,
        sampleHeight
      ).data;
      let blendFrame: Uint8ClampedArray | null = null;

      if (
        isCrossfading &&
        incomingVideo.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA
      ) {
        blendContext.drawImage(
          incomingVideo,
          0,
          0,
          sampleWidth,
          sampleHeight
        );
        blendFrame = blendContext.getImageData(
          0,
          0,
          sampleWidth,
          sampleHeight
        ).data;
      }

      for (let index = 0; index < sampleWidth * sampleHeight; index += 1) {
        const pixelCursor = index * 4;
        const colorCursor = index * 3;
        const mixChannel = (offset: number) => {
          const current = frame[pixelCursor + offset];
          if (!blendFrame) return current / 255;
          return (
            (current +
              (blendFrame[pixelCursor + offset] - current) * blendAmount) /
            255
          );
        };
        const red = mixChannel(0);
        const green = mixChannel(1);
        const blue = mixChannel(2);
        const alpha = mixChannel(3);
        const luma = red * 0.299 + green * 0.587 + blue * 0.114;
        const darkness = 1 - luma;
        const gammaRed = Math.pow(red, 0.8);
        const gammaGreen = Math.pow(green, 0.8);
        const gammaBlue = Math.pow(blue, 0.8);
        const average = (gammaRed + gammaGreen + gammaBlue) / 3;
        const saturation = Math.max(red, green, blue) - Math.min(red, green, blue);
        const saturationScale = 1.35;
        const lift = 0.015;

        colors[colorCursor] = clamp(
          average + (gammaRed - average) * saturationScale + lift,
          0,
          1
        );
        colors[colorCursor + 1] = clamp(
          average + (gammaGreen - average) * saturationScale + lift,
          0,
          1
        );
        colors[colorCursor + 2] = clamp(
          average + (gammaBlue - average) * saturationScale + lift,
          0,
          1
        );

        targetSizes[index] = pointScale * (0.82 + darkness * 0.12);
        targetOpacities[index] =
          clamp(0.7 + darkness * 0.1 + saturation * 0.12, 0, 0.88) * alpha;
      }

      geometry.getAttribute("aColor").needsUpdate = true;
    };

    const renderFrame = (time: number) => {
      if (cancelled) return;

      updateVideoLoop();

      if (time - lastSampleAt >= 1000 / (reducedMotion ? 8 : SAMPLE_FPS)) {
        sampleFrame();
        lastSampleAt = time;
      }

      if (
        geometry &&
        currentSizes &&
        targetSizes &&
        currentOpacities &&
        targetOpacities
      ) {
        for (let index = 0; index < currentSizes.length; index += 1) {
          currentSizes[index] +=
            (targetSizes[index] - currentSizes[index]) * 0.22;
          currentOpacities[index] +=
            (targetOpacities[index] - currentOpacities[index]) * 0.22;
        }

        geometry.getAttribute("aSize").needsUpdate = true;
        geometry.getAttribute("aOpacity").needsUpdate = true;
      }

      if (!reducedMotion) {
        uniforms.uReveal.value = clamp((time - startedAt) / 900, 0, 1);
      }

      renderer.render(scene, camera);
      animationFrame = requestAnimationFrame(renderFrame);
    };

    resizeScene();
    animationFrame = requestAnimationFrame(renderFrame);

    window.addEventListener("resize", resizeScene, { passive: true });

    return () => {
      cancelled = true;
      cancelAnimationFrame(animationFrame);
      window.removeEventListener("resize", resizeScene);
      disposePointCloud();
      material.dispose();
      renderer.dispose();
    };
  }, [loop]);

  return (
    <div
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100vw",
        height: "100vh",
        zIndex: 0,
        overflow: "hidden",
        background: PAPER_COLOR,
        pointerEvents: "none",
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
      <video
        ref={blendVideoRef}
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
      <canvas
        ref={canvasRef}
        style={{
          display: "block",
          width: "100%",
          height: "100%",
        }}
      />
      <div
        className="intro-video-wash"
        style={{
          position: "absolute",
          inset: 0,
          pointerEvents: "none",
        }}
      />
    </div>
  );
}
