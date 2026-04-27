"use client";

import { useRef, useCallback, useEffect } from "react";
import DiscordChatComponent from "./components/DiscordChatComponent/DiscordChatComponent";

// ── Sunburst spin speeds (deg/s) ──────────────────────────────────
const IDLE_SPEED = 6;     // 360° / 60s
const FAST_SPEED = 36;    // 360° / 10s

// Exponential decay rates — higher = faster convergence
// ~95% convergence at t ≈ 3/rate
const RATE_ACCEL = 8;     // hover-in:  ~0.4s to reach 95%
const RATE_DECEL = 1.5;   // hover-out: ~2s to reach 95%, ~3s to 99%

export default function Home() {
  const heroRef = useRef(null);
  const animRef = useRef({
    angle: 0,
    speed: IDLE_SPEED,
    targetSpeed: IDLE_SPEED,
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

      // Exponential ease toward target speed
      const rate = state.targetSpeed > state.speed ? RATE_ACCEL : RATE_DECEL;
      state.speed += (state.targetSpeed - state.speed) * (1 - Math.exp(-dt * rate));

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
    animRef.current.targetSpeed = hovering ? FAST_SPEED : IDLE_SPEED;
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
