"use client";

import { useRef, useCallback, useEffect } from "react";
import DiscordChatComponent from "./components/DiscordChatComponent/DiscordChatComponent";

// ── Sunburst spin speeds (deg/s) ──────────────────────────────────
const IDLE_SPEED = 6;       // 360° / 60s — gentle idle rotation
const MAX_SPEED = 720;      // 2 full revolutions/s at peak — really fast

// Exponential decay rate for deceleration (hover-out)
// ~95% convergence at t ≈ 3/rate → ~2s, 99% at ~3s
const RATE_DECEL = 1.5;

// Ramp rate for continuous acceleration while hovering
// Lower = slower buildup. 0.3 ≈ noticeable at 3s, fast at 7s, wild at 10s
const RATE_RAMP = 0.3;

export default function Home() {
  const heroRef = useRef(null);
  const animRef = useRef({
    angle: 0,
    speed: IDLE_SPEED,
    hovering: false,
    hoverStart: 0,
    lastTime: 0,
    rafId: 0,
  });

  // ── rAF loop: smooth speed interpolation + rotation ────────────
  useEffect(() => {
    const state = animRef.current;
    state.lastTime = performance.now();

    const tick = (now) => {
      const dt = Math.min((now - state.lastTime) / 1000, 0.1); // cap at 100ms
      state.lastTime = now;

      if (state.hovering) {
        // Continuous ramp: exponential approach toward MAX_SPEED
        // Speed increases faster and faster over ~10s
        const elapsed = (now - state.hoverStart) / 1000;
        const targetSpeed = IDLE_SPEED + (MAX_SPEED - IDLE_SPEED) * (1 - Math.exp(-elapsed * RATE_RAMP));
        state.speed += (targetSpeed - state.speed) * (1 - Math.exp(-dt * 6));
      } else {
        // Decelerate smoothly back to idle
        state.speed += (IDLE_SPEED - state.speed) * (1 - Math.exp(-dt * RATE_DECEL));
      }

      // Accumulate angle
      state.angle = (state.angle + state.speed * dt) % 360;

      // Write to DOM via custom property (no React re-render)
      if (heroRef.current) {
        heroRef.current.style.setProperty("--sunburst-rotation", `${state.angle}deg`);
      }

      state.rafId = requestAnimationFrame(tick);
    };

    state.rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(state.rafId);
  }, []);

  // ── Hover handler: toggle speed target + energized class ───────
  const handleJoinHover = useCallback((hovering) => {
    const state = animRef.current;
    state.hovering = hovering;
    if (hovering) state.hoverStart = performance.now();
    heroRef.current?.classList.toggle("hero--energized", hovering);
  }, []);

  return (
    <main className="hero" ref={heroRef}>
      <div className="hero-content">
        <h1 className="hero-title">Clock Crew</h1>
        <p className="hero-subtitle">
          The legendary Newgrounds Flash animation collective — est. 2002
        </p>
        <section
          aria-label="Community Discord Live Feed"
          style={{ marginTop: "32px", width: "100%", maxWidth: "820px" }}
        >
          <DiscordChatComponent messageCount={500} joinMode onJoinHoverChange={handleJoinHover} />
        </section>
      </div>
    </main>
  );
}
