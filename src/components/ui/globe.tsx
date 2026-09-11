"use client";

import createGlobe, { type COBEOptions } from "cobe";
import { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Interactive WebGL globe, adapted from the cobe demo.
 *
 * The original is a decorative demo and leaks in ways that matter in a PWA that
 * stays open for days, so this rewrite differs in five substantive ways:
 *
 *  - Rotation is driven by our own rAF loop calling `globe.update()`. The demo
 *    everyone copies is written against cobe v1, whose `onRender` option v2
 *    removed outright — passing it silently does nothing, so the globe renders
 *    a single frame and then sits frozen forever.
 *  - Rotation, size and drag offset live in refs. In the original they were
 *    plain `let`s in the component body plus a `useState` for the drag offset,
 *    so the render callback saw an offset frozen at 0 — the globe rotated but
 *    dragging did nothing.
 *  - The globe is torn down whenever it is hidden or scrolled out of view, and
 *    rebuilt on return. There is no pause API, and leaving a WebGL context and
 *    a 60fps loop running behind a backgrounded PWA is the single biggest
 *    battery cost here.
 *  - Device pixel ratio and sample count are capped on small screens. The cost
 *    of this component is fill rate, not the 6 KB of library: a 400 CSS-px
 *    globe at DPR 3 is well over a million fragment-shader pixels per frame.
 *  - WebGL context loss is handled. iOS drops the context when a PWA is
 *    backgrounded, which otherwise leaves a permanently blank canvas.
 *  - The resize listener is removed, and the theme is followed so the globe
 *    matches light and dark instead of glowing white on a black screen.
 */

const AUTO_ROTATE_PER_FRAME = 0.004;

/**
 * Rotation at which Southeast Asia faces the viewer, calibrated by rendering a
 * Jakarta marker across phi 0..5. The globe spins a full turn every ~26s, so
 * this only governs the first few seconds — which is most of a login screen's
 * life, hence worth setting.
 */
const START_PHI = 3.1;

/** Below this width the globe is treated as being on a phone. */
const SMALL_SCREEN = 640;

export type GlobeProps = {
  className?: string;
  /**
   * Merged over the computed defaults — mainly markers and colours. Read when
   * the globe is built, not on every render, so an inline object here cannot
   * thrash the WebGL context.
   */
  config?: Partial<COBEOptions>;
};

export default function Globe({ className, config }: GlobeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const phi = useRef(START_PHI);
  const width = useRef(0);
  // Where the pointer went down, and how far it has travelled since. Both are
  // refs because the render callback reads them every frame.
  const dragStart = useRef<number | null>(null);
  const offset = useRef(0);

  // Rebuilding is how this component pauses, so anything that should stop the
  // animation becomes a reason to tear the globe down.
  const [live, setLive] = useState(false);
  const [failed, setFailed] = useState(false);
  const [dark, setDark] = useState(false);
  const [reduced, setReduced] = useState(false);

  const configRef = useRef(config);
  useEffect(() => {
    configRef.current = config;
  });

  // Follow the theme and the reduced-motion preference, and stop drawing while
  // the tab is hidden or the globe is scrolled off screen.
  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;

    const readTheme = () => setDark(root.classList.contains("dark"));
    const readMotion = () => setReduced(motion.matches);
    readTheme();
    readMotion();

    const themeObserver = new MutationObserver(readTheme);
    themeObserver.observe(root, { attributes: true, attributeFilter: ["class"] });
    motion.addEventListener("change", readMotion);

    let onScreen = false;
    const sync = () => setLive(onScreen && document.visibilityState === "visible");

    const io = new IntersectionObserver((entries) => {
      onScreen = entries.some((entry) => entry.isIntersecting);
      sync();
    });
    if (containerRef.current) io.observe(containerRef.current);

    document.addEventListener("visibilitychange", sync);
    return () => {
      themeObserver.disconnect();
      motion.removeEventListener("change", readMotion);
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !live || failed) return;

    const small = window.innerWidth < SMALL_SCREEN;
    const measure = () => {
      width.current = canvas.offsetWidth;
    };
    measure();
    if (width.current === 0) return;

    const onLost = (event: Event) => {
      event.preventDefault();
      queueMicrotask(() => setFailed(true));
    };
    canvas.addEventListener("webglcontextlost", onLost);

    const resize = new ResizeObserver(measure);
    resize.observe(canvas);

    let globe: ReturnType<typeof createGlobe> | null = null;
    try {
      globe = createGlobe(canvas, {
        width: width.current * 2,
        height: width.current * 2,
        phi: START_PHI,
        theta: 0.28,
        // Fill rate, not bundle size, is what costs on a phone.
        devicePixelRatio: Math.min(window.devicePixelRatio || 1, small ? 1.5 : 2),
        mapSamples: small ? 9000 : 16000,
        // A white sphere on a white page is invisible, so the light theme gets
        // a brand-tinted base and real shading rather than cobe's default.
        // Kept within a hair of cobe's own published light/dark values, which
        // are known-good on real GPUs. The only deliberate departure is a faint
        // brand tint on the light base: cobe ships pure white, which is an
        // invisible sphere on a white page.
        mapBrightness: dark ? 6 : 1.2,
        diffuse: dark ? 1.2 : 0.5,
        dark: dark ? 1 : 0,
        baseColor: dark ? [0.26, 0.24, 0.32] : [0.95, 0.93, 0.98],
        markerColor: [0.99, 0.11, 0.11],
        glowColor: dark ? [0.12, 0.11, 0.16] : [1, 1, 1],
        markers: [],
        ...configRef.current,
      });
    } catch {
      // Deferred: re-rendering part-way through this effect would tear down the
      // very setup it is still running.
      queueMicrotask(() => setFailed(true));
    }

    // cobe v2 draws only when told to, so the animation is ours to run.
    let frame = 0;
    const tick = () => {
      if (dragStart.current === null && !reduced) phi.current += AUTO_ROTATE_PER_FRAME;
      globe?.update({
        phi: phi.current + offset.current,
        width: width.current * 2,
        height: width.current * 2,
      });
      canvas.style.opacity = "1";
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(frame);
      canvas.removeEventListener("webglcontextlost", onLost);
      resize.disconnect();
      globe?.destroy();
    };
  }, [live, failed, dark, reduced]);

  // A lost context or a machine without WebGL falls through to whatever is
  // behind the component rather than showing a dead black square.
  if (failed) return null;

  return (
    <div
      ref={containerRef}
      className={cn("pointer-events-none absolute inset-0 mx-auto aspect-square w-full", className)}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className="size-full opacity-0 transition-opacity duration-700 [contain:layout_paint_size]"
        // Without this the browser keeps the drag for its own scrolling and the
        // passive-listener default makes preventDefault a no-op.
        style={{ touchAction: "none", cursor: "grab", pointerEvents: "auto" }}
        onPointerDown={(event) => {
          dragStart.current = event.clientX - offset.current * 200;
          event.currentTarget.style.cursor = "grabbing";
          event.currentTarget.setPointerCapture(event.pointerId);
        }}
        onPointerMove={(event) => {
          if (dragStart.current === null) return;
          offset.current = (event.clientX - dragStart.current) / 200;
        }}
        onPointerUp={(event) => {
          dragStart.current = null;
          event.currentTarget.style.cursor = "grab";
        }}
        onPointerCancel={() => {
          dragStart.current = null;
        }}
      />
    </div>
  );
}
