"use client";

import React, {
  createElement,
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useReducedMotion } from "motion/react";

export enum Tag {
  H1 = "h1",
  H2 = "h2",
  H3 = "h3",
  P = "p",
}

export type VaporizeTextCycleProps = {
  texts: string[];
  font?: {
    fontFamily?: string;
    fontSize?: string;
    fontWeight?: number;
  };
  color?: string;
  spread?: number;
  density?: number;
  animation?: {
    vaporizeDuration?: number;
    fadeInDuration?: number;
    waitDuration?: number;
  };
  direction?: "left-to-right" | "right-to-left";
  alignment?: "left" | "center" | "right";
  tag?: Tag;
  className?: string;
};

type Particle = {
  x: number;
  y: number;
  originalX: number;
  originalY: number;
  rgb: string;
  opacity: number;
  originalAlpha: number;
  velocityX: number;
  velocityY: number;
  angle: number;
  speed: number;
  shouldFadeQuickly?: boolean;
};

type TextBoundaries = {
  left: number;
  right: number;
  width: number;
};

declare global {
  interface HTMLCanvasElement {
    textBoundaries?: TextBoundaries;
  }
}

export default function VaporizeTextCycle({
  texts = ["Top-Up Kilat 24 Jam", "Diskon 15% Diamond"],
  font = {
    fontFamily: "'Plus Jakarta Sans', sans-serif",
    fontSize: "44px",
    fontWeight: 800,
  },
  color = "rgb(248, 250, 252)",
  spread = 4,
  density = 6,
  animation = {
    vaporizeDuration: 1.6,
    fadeInDuration: 0.7,
    waitDuration: 1.8,
  },
  direction = "left-to-right",
  alignment = "left",
  tag = Tag.H1,
  className = "",
}: VaporizeTextCycleProps) {
  const shouldReduceMotion = useReducedMotion();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const wrapperRef = useRef<HTMLDivElement | null>(null);
  const isInView = useIsInView(wrapperRef);
  const lastFontRef = useRef<string | null>(null);
  const particlesRef = useRef<Particle[]>([]);
  const waitingTimeoutRef = useRef<number | null>(null);
  const [currentTextIndex, setCurrentTextIndex] = useState(0);
  const [animationState, setAnimationState] = useState<
    "static" | "vaporizing" | "fadingIn" | "waiting"
  >("waiting");
  const vaporizeProgressRef = useRef(0);
  const fadeOpacityRef = useRef(1);
  const [wrapperSize, setWrapperSize] = useState({ width: 0, height: 0 });
  const transformedDensity = transformValue(density, [0, 10], [0.3, 1], true);

  const globalDpr = useMemo(() => {
    if (typeof window !== "undefined") {
      return Math.min(window.devicePixelRatio || 1, 1.5);
    }
    return 1;
  }, []);

  const wrapperStyle = useMemo(
    () => ({
      width: "100%",
      height: "100%",
      pointerEvents: "none" as const,
    }),
    []
  );

  const canvasStyle = useMemo(
    () => ({
      minWidth: "30px",
      minHeight: "20px",
      pointerEvents: "none" as const,
      display: "block",
    }),
    []
  );

  const animationDurations = useMemo(
    () => ({
      VAPORIZE_DURATION: (animation.vaporizeDuration ?? 1.6) * 1000,
      FADE_IN_DURATION: (animation.fadeInDuration ?? 0.7) * 1000,
      WAIT_DURATION: (animation.waitDuration ?? 1.8) * 1000,
    }),
    [animation.vaporizeDuration, animation.fadeInDuration, animation.waitDuration]
  );

  const fontConfig = useMemo(() => {
    const fontSize = parseInt(font.fontSize?.replace("px", "") || "44", 10);
    const VAPORIZE_SPREAD = calculateVaporizeSpread(fontSize);
    const MULTIPLIED_VAPORIZE_SPREAD = VAPORIZE_SPREAD * spread;
    return {
      fontSize,
      VAPORIZE_SPREAD,
      MULTIPLIED_VAPORIZE_SPREAD,
    };
  }, [font.fontSize, spread]);

  const memoizedUpdateParticles = useCallback(
    (particles: Particle[], vaporizeX: number, deltaTime: number) => {
      return updateParticles(
        particles,
        vaporizeX,
        deltaTime,
        fontConfig.MULTIPLIED_VAPORIZE_SPREAD,
        animationDurations.VAPORIZE_DURATION,
        direction,
        transformedDensity
      );
    },
    [
      fontConfig.MULTIPLIED_VAPORIZE_SPREAD,
      animationDurations.VAPORIZE_DURATION,
      direction,
      transformedDensity,
    ]
  );

  const pixelStep = useMemo(() => {
    // Keep particle count smooth (~2k-4k) for 60fps across retina and software Canvas
    return Math.max(1, Math.round(globalDpr * (1.5 - transformedDensity * 0.4)));
  }, [globalDpr, transformedDensity]);

  const memoizedRenderParticles = useCallback(
    (ctx: CanvasRenderingContext2D, particles: Particle[]) => {
      renderParticles(ctx, particles, globalDpr, pixelStep);
    },
    [globalDpr, pixelStep]
  );

  // Reset when texts array identity changes (e.g. carousel slide switch)
  useEffect(() => {
    setCurrentTextIndex(0);
    vaporizeProgressRef.current = 0;
    fadeOpacityRef.current = 1;
    setAnimationState("waiting");
  }, [texts]);

  // Start waiting -> vaporizing cycle when visible in viewport
  useEffect(() => {
    if (shouldReduceMotion) return;

    if (waitingTimeoutRef.current) {
      window.clearTimeout(waitingTimeoutRef.current);
      waitingTimeoutRef.current = null;
    }

    if (isInView) {
      setAnimationState("waiting");
      vaporizeProgressRef.current = 0;
      waitingTimeoutRef.current = window.setTimeout(() => {
        setAnimationState("vaporizing");
      }, animationDurations.WAIT_DURATION);
    } else {
      setAnimationState("static");
    }

    return () => {
      if (waitingTimeoutRef.current) {
        window.clearTimeout(waitingTimeoutRef.current);
        waitingTimeoutRef.current = null;
      }
    };
  }, [isInView, texts, animationDurations.WAIT_DURATION, shouldReduceMotion]);

  // Main animation loop
  useEffect(() => {
    if (!isInView || shouldReduceMotion) return;

    let lastTime = performance.now();
    let frameId = 0;

    const animate = (currentTime: number) => {
      const deltaTime = Math.min((currentTime - lastTime) / 1000, 0.05);
      lastTime = currentTime;

      const canvas = canvasRef.current;
      const ctx = canvas?.getContext("2d");

      if (!canvas || !ctx || !particlesRef.current.length) {
        frameId = requestAnimationFrame(animate);
        return;
      }

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      switch (animationState) {
        case "static":
        case "waiting": {
          memoizedRenderParticles(ctx, particlesRef.current);
          break;
        }
        case "vaporizing": {
          vaporizeProgressRef.current +=
            (deltaTime * 100) / (animationDurations.VAPORIZE_DURATION / 1000);

          const textBoundaries = canvas.textBoundaries;
          if (!textBoundaries) break;

          const progress = Math.min(100, vaporizeProgressRef.current);
          const vaporizeX =
            direction === "left-to-right"
              ? textBoundaries.left + (textBoundaries.width * progress) / 100
              : textBoundaries.right - (textBoundaries.width * progress) / 100;

          const allVaporized = memoizedUpdateParticles(
            particlesRef.current,
            vaporizeX,
            deltaTime
          );
          memoizedRenderParticles(ctx, particlesRef.current);

          if (vaporizeProgressRef.current >= 100 && allVaporized) {
            setCurrentTextIndex((prevIndex) => (prevIndex + 1) % texts.length);
            setAnimationState("fadingIn");
            fadeOpacityRef.current = 0;
          }
          break;
        }
        case "fadingIn": {
          fadeOpacityRef.current +=
            (deltaTime * 1000) / animationDurations.FADE_IN_DURATION;

          const drawSize = Math.max(1.1, pixelStep / globalDpr);
          ctx.save();
          ctx.scale(globalDpr, globalDpr);
          const alphaFactor = Math.min(fadeOpacityRef.current, 1);
          const particles = particlesRef.current;
          for (let i = 0; i < particles.length; i++) {
            const p = particles[i];
            p.x = p.originalX;
            p.y = p.originalY;
            const opacity = alphaFactor * p.originalAlpha;
            if (opacity > 0.01) {
              ctx.fillStyle = `rgba(${p.rgb},${opacity.toFixed(2)})`;
              ctx.fillRect(p.x / globalDpr, p.y / globalDpr, drawSize, drawSize);
            }
          }
          ctx.restore();

          if (fadeOpacityRef.current >= 1) {
            setAnimationState("waiting");
            if (waitingTimeoutRef.current) {
              window.clearTimeout(waitingTimeoutRef.current);
            }
            waitingTimeoutRef.current = window.setTimeout(() => {
              vaporizeProgressRef.current = 0;
              resetParticles(particlesRef.current);
              setAnimationState("vaporizing");
            }, animationDurations.WAIT_DURATION);
          }
          break;
        }
      }

      frameId = requestAnimationFrame(animate);
    };

    frameId = requestAnimationFrame(animate);

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }
    };
  }, [
    animationState,
    isInView,
    shouldReduceMotion,
    texts.length,
    direction,
    globalDpr,
    pixelStep,
    memoizedUpdateParticles,
    memoizedRenderParticles,
    animationDurations.FADE_IN_DURATION,
    animationDurations.WAIT_DURATION,
    animationDurations.VAPORIZE_DURATION,
  ]);

  // Render & resample canvas particles on text/size change
  useEffect(() => {
    if (shouldReduceMotion) return;

    renderCanvas({
      framerProps: { texts, font, color, alignment },
      canvasRef,
      wrapperSize,
      particlesRef,
      globalDpr,
      pixelStep,
      currentTextIndex,
    });

    const currentFont = font.fontFamily || "sans-serif";
    return handleFontChange({
      currentFont,
      lastFontRef,
      canvasRef,
      wrapperSize,
      particlesRef,
      globalDpr,
      pixelStep,
      currentTextIndex,
      framerProps: { texts, font, color, alignment },
    });
  }, [
    texts,
    font,
    color,
    alignment,
    wrapperSize,
    currentTextIndex,
    globalDpr,
    pixelStep,
    shouldReduceMotion,
  ]);

  // Observe wrapper resize for responsive crispness
  useEffect(() => {
    const container = wrapperRef.current;
    if (!container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      setWrapperSize((prev) =>
        prev.width === Math.round(rect.width) && prev.height === Math.round(rect.height)
          ? prev
          : { width: Math.round(rect.width), height: Math.round(rect.height) }
      );
    };

    updateSize();
    const resizeObserver = new ResizeObserver(updateSize);
    resizeObserver.observe(container);
    return () => resizeObserver.disconnect();
  }, []);

  if (shouldReduceMotion) {
    const SafeTag = Object.values(Tag).includes(tag) ? tag : "p";
    return createElement(
      SafeTag,
      {
        className: `font-extrabold tracking-tight text-[#F8FAFC] ${className}`,
        style: {
          fontSize: font.fontSize,
          fontFamily: font.fontFamily,
          fontWeight: font.fontWeight,
        },
      },
      texts[0] ?? ""
    );
  }

  return (
    <div ref={wrapperRef} style={wrapperStyle} className={`relative ${className}`}>
      <canvas ref={canvasRef} style={canvasStyle} aria-hidden="true" />
      <SeoElement tag={tag} texts={texts} />
    </div>
  );
}

const SeoElement = memo(({ tag = Tag.P, texts }: { tag: Tag; texts: string[] }) => {
  const style = useMemo(
    () => ({
      position: "absolute" as const,
      width: "1px",
      height: "1px",
      overflow: "hidden",
      clip: "rect(0, 0, 0, 0)",
      whiteSpace: "nowrap" as const,
      userSelect: "none" as const,
      pointerEvents: "none" as const,
    }),
    []
  );

  const safeTag = Object.values(Tag).includes(tag) ? tag : "p";
  return createElement(safeTag, { style }, texts?.join(" · ") ?? "");
});

const handleFontChange = ({
  currentFont,
  lastFontRef,
  canvasRef,
  wrapperSize,
  particlesRef,
  globalDpr,
  pixelStep,
  currentTextIndex,
  framerProps,
}: {
  currentFont: string;
  lastFontRef: React.MutableRefObject<string | null>;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  wrapperSize: { width: number; height: number };
  particlesRef: React.MutableRefObject<Particle[]>;
  globalDpr: number;
  pixelStep: number;
  currentTextIndex: number;
  framerProps: VaporizeTextCycleProps;
}) => {
  if (currentFont !== lastFontRef.current) {
    lastFontRef.current = currentFont;

    const timeoutId = window.setTimeout(() => {
      renderCanvas({
        framerProps,
        canvasRef,
        wrapperSize,
        particlesRef,
        globalDpr,
        pixelStep,
        currentTextIndex,
      });
    }, 600);

    return () => {
      window.clearTimeout(timeoutId);
    };
  }

  return undefined;
};

const renderCanvas = ({
  framerProps,
  canvasRef,
  wrapperSize,
  particlesRef,
  globalDpr,
  pixelStep,
  currentTextIndex,
}: {
  framerProps: VaporizeTextCycleProps;
  canvasRef: React.RefObject<HTMLCanvasElement | null>;
  wrapperSize: { width: number; height: number };
  particlesRef: React.MutableRefObject<Particle[]>;
  globalDpr: number;
  pixelStep: number;
  currentTextIndex: number;
}) => {
  const canvas = canvasRef.current;
  if (!canvas || !wrapperSize.width || !wrapperSize.height) return;

  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) return;

  const { width, height } = wrapperSize;
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  canvas.width = Math.floor(width * globalDpr);
  canvas.height = Math.floor(height * globalDpr);

  const requestedFontSize = parseInt(framerProps.font?.fontSize?.replace("px", "") || "44", 10);
  const fontFamily = framerProps.font?.fontFamily ?? "'Plus Jakarta Sans', sans-serif";
  const fontWeight = framerProps.font?.fontWeight ?? 800;
  const color = parseColor(framerProps.color ?? "rgb(248, 250, 252)");
  const currentText = framerProps.texts[currentTextIndex] || framerProps.texts[0] || "NipNime";

  // Auto-fit font size so single-line headline never overflows narrow mobile screens
  let fittedPx = requestedFontSize * globalDpr;
  ctx.font = `${fontWeight} ${fittedPx}px ${fontFamily}`;
  const measured = ctx.measureText(currentText).width;
  const maxAllowedWidth = canvas.width - 6;
  if (measured > maxAllowedWidth && maxAllowedWidth > 40) {
    fittedPx = Math.max(18 * globalDpr, Math.floor(fittedPx * (maxAllowedWidth / measured)));
  }
  const font = `${fontWeight} ${fittedPx}px ${fontFamily}`;

  let textX = 0;
  const textY = canvas.height / 2;
  if (framerProps.alignment === "center") {
    textX = canvas.width / 2;
  } else if (framerProps.alignment === "right") {
    textX = canvas.width;
  }

  const { particles, textBoundaries } = createParticles(
    ctx,
    canvas,
    currentText,
    textX,
    textY,
    font,
    color,
    framerProps.alignment || "left",
    pixelStep
  );

  particlesRef.current = particles;
  canvas.textBoundaries = textBoundaries;

  // Draw initial frame immediately so first paint is never blank
  renderParticles(ctx, particles, globalDpr, pixelStep);
};

const createParticles = (
  ctx: CanvasRenderingContext2D,
  canvas: HTMLCanvasElement,
  text: string,
  textX: number,
  textY: number,
  font: string,
  color: string,
  alignment: "left" | "center" | "right",
  sampleRate: number
) => {
  const particles: Particle[] = [];
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = color;
  ctx.font = font;
  ctx.textAlign = alignment;
  ctx.textBaseline = "middle";
  ctx.imageSmoothingQuality = "high";
  ctx.imageSmoothingEnabled = true;

  const metrics = ctx.measureText(text);
  const textWidth = metrics.width;
  let textLeft = textX;
  if (alignment === "center") {
    textLeft = textX - textWidth / 2;
  } else if (alignment === "right") {
    textLeft = textX - textWidth;
  }

  const textBoundaries: TextBoundaries = {
    left: textLeft,
    right: textLeft + textWidth,
    width: textWidth,
  };

  ctx.fillText(text, textX, textY);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  for (let y = 0; y < canvas.height; y += sampleRate) {
    for (let x = 0; x < canvas.width; x += sampleRate) {
      const index = (y * canvas.width + x) * 4;
      const alpha = data[index + 3];

      if (alpha > 20) {
        const originalAlpha = Math.min(1, alpha / 255);
        particles.push({
          x,
          y,
          originalX: x,
          originalY: y,
          rgb: `${data[index]},${data[index + 1]},${data[index + 2]}`,
          opacity: originalAlpha,
          originalAlpha,
          velocityX: 0,
          velocityY: 0,
          angle: 0,
          speed: 0,
        });
      }
    }
  }

  ctx.clearRect(0, 0, canvas.width, canvas.height);
  return { particles, textBoundaries };
};

const updateParticles = (
  particles: Particle[],
  vaporizeX: number,
  deltaTime: number,
  MULTIPLIED_VAPORIZE_SPREAD: number,
  VAPORIZE_DURATION: number,
  direction: string,
  density: number
) => {
  let allParticlesVaporized = true;

  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    const shouldVaporize =
      direction === "left-to-right"
        ? particle.originalX <= vaporizeX
        : particle.originalX >= vaporizeX;

    if (shouldVaporize) {
      if (particle.speed === 0) {
        particle.angle = Math.random() * Math.PI * 2;
        particle.speed = (Math.random() * 1 + 0.5) * MULTIPLIED_VAPORIZE_SPREAD;
        particle.velocityX = Math.cos(particle.angle) * particle.speed;
        particle.velocityY = Math.sin(particle.angle) * particle.speed;
        particle.shouldFadeQuickly = Math.random() > density;
      }

      if (particle.shouldFadeQuickly) {
        particle.opacity = Math.max(0, particle.opacity - deltaTime * 1.4);
      } else {
        const dx = particle.originalX - particle.x;
        const dy = particle.originalY - particle.y;
        const distanceFromOrigin = Math.sqrt(dx * dx + dy * dy);
        const dampingFactor = Math.max(
          0.95,
          1 - distanceFromOrigin / (100 * MULTIPLIED_VAPORIZE_SPREAD)
        );

        const randomSpread = MULTIPLIED_VAPORIZE_SPREAD * 3;
        const spreadX = (Math.random() - 0.5) * randomSpread;
        const spreadY = (Math.random() - 0.5) * randomSpread;

        particle.velocityX = (particle.velocityX + spreadX + dx * 0.002) * dampingFactor;
        particle.velocityY = (particle.velocityY + spreadY + dy * 0.002) * dampingFactor;

        const maxVelocity = MULTIPLIED_VAPORIZE_SPREAD * 2;
        const currentVelocity = Math.sqrt(
          particle.velocityX * particle.velocityX + particle.velocityY * particle.velocityY
        );

        if (currentVelocity > maxVelocity) {
          const scale = maxVelocity / currentVelocity;
          particle.velocityX *= scale;
          particle.velocityY *= scale;
        }

        particle.x += particle.velocityX * deltaTime * 22;
        particle.y += particle.velocityY * deltaTime * 11;

        const baseFadeRate = 0.45;
        const durationBasedFadeRate = baseFadeRate * (2000 / VAPORIZE_DURATION);
        particle.opacity = Math.max(
          0,
          particle.opacity - deltaTime * durationBasedFadeRate
        );
      }

      if (particle.opacity > 0.02) {
        allParticlesVaporized = false;
      }
    } else {
      allParticlesVaporized = false;
    }
  }

  return allParticlesVaporized;
};

const renderParticles = (
  ctx: CanvasRenderingContext2D,
  particles: Particle[],
  globalDpr: number,
  sampleRate: number
) => {
  const drawSize = Math.max(1.1, sampleRate / globalDpr);
  ctx.save();
  ctx.scale(globalDpr, globalDpr);

  for (let i = 0; i < particles.length; i++) {
    const p = particles[i];
    if (p.opacity > 0.01) {
      ctx.fillStyle = `rgba(${p.rgb},${p.opacity.toFixed(2)})`;
      ctx.fillRect(p.x / globalDpr, p.y / globalDpr, drawSize, drawSize);
    }
  }

  ctx.restore();
};

const resetParticles = (particles: Particle[]) => {
  for (let i = 0; i < particles.length; i++) {
    const particle = particles[i];
    particle.x = particle.originalX;
    particle.y = particle.originalY;
    particle.opacity = particle.originalAlpha;
    particle.speed = 0;
    particle.velocityX = 0;
    particle.velocityY = 0;
  }
};

const calculateVaporizeSpread = (fontSize: number) => {
  const points = [
    { size: 20, spread: 0.2 },
    { size: 50, spread: 0.5 },
    { size: 100, spread: 1.5 },
  ];

  if (fontSize <= points[0].size) return points[0].spread;
  if (fontSize >= points[points.length - 1].size) return points[points.length - 1].spread;

  let i = 0;
  while (i < points.length - 1 && points[i + 1].size < fontSize) i++;

  const p1 = points[i];
  const p2 = points[i + 1];
  return p1.spread + ((fontSize - p1.size) * (p2.spread - p1.spread)) / (p2.size - p1.size);
};

const parseColor = (color: string) => {
  const rgbMatch = color.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  const rgbaMatch = color.match(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*([\d.]+)\)/);

  if (rgbaMatch) {
    const [, r, g, b, a] = rgbaMatch;
    return `rgba(${r}, ${g}, ${b}, ${a})`;
  } else if (rgbMatch) {
    const [, r, g, b] = rgbMatch;
    return `rgba(${r}, ${g}, ${b}, 1)`;
  }

  return "rgba(248, 250, 252, 1)";
};

function transformValue(
  input: number,
  inputRange: number[],
  outputRange: number[],
  clamp = false
): number {
  const [inputMin, inputMax] = inputRange;
  const [outputMin, outputMax] = outputRange;

  const progress = (input - inputMin) / (inputMax - inputMin);
  let result = outputMin + progress * (outputMax - outputMin);

  if (clamp) {
    if (outputMax > outputMin) {
      result = Math.min(Math.max(result, outputMin), outputMax);
    } else {
      result = Math.min(Math.max(result, outputMax), outputMin);
    }
  }

  return result;
}

function useIsInView(ref: React.RefObject<HTMLElement | null>) {
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    if (!ref.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0, rootMargin: "50px" }
    );

    observer.observe(ref.current);

    return () => {
      observer.disconnect();
    };
  }, [ref]);

  return isInView;
}
