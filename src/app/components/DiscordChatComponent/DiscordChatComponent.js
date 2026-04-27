"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import styles from "./DiscordChatComponent.module.css";

// ── Discord role colors (fallback when no role color from API) ───
const ROLE_COLORS = [
  "#e91e63", "#9c27b0", "#3f51b5", "#2196f3", "#009688",
  "#4caf50", "#ff9800", "#e74c3c", "#1abc9c", "#e67e22",
  "#f1c40f", "#2ecc71", "#3498db", "#9b59b6",
];

function getFallbackColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 31 + userId.charCodeAt(i)) | 0;
  }
  return ROLE_COLORS[Math.abs(hash) % ROLE_COLORS.length];
}

const AVATAR_COLORS = [
  "#5865f2", "#57f287", "#fee75c", "#eb459e", "#ed4245",
  "#3ba55d", "#faa61a", "#99aab5",
];

function getAvatarColor(userId) {
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = (hash * 37 + userId.charCodeAt(i)) | 0;
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

// ── Format Discord message content ───────────────────────────────
// Uses cleanContent (Discord.js already resolved @mentions → @Username).
function formatContent(content, cleanContent) {
  const text = cleanContent || content || "";
  if (!text) return null;

  // Split on @mentions and URLs — capture groups stay in the array
  const segments = text.split(/(@[\w.]+|https?:\/\/\S+)/g);

  if (segments.length <= 1) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {segments.map((seg, i) => {
        if (!seg) return null;

        if (seg.startsWith("@")) {
          return (
            <span key={i} className={styles.mention}>
              {seg}
            </span>
          );
        }

        if (/^https?:\/\//.test(seg)) {
          const display = seg.length > 50 ? seg.substring(0, 47) + "..." : seg;
          return (
            <a key={i} href={seg} target="_blank" rel="noopener noreferrer">
              {display}
            </a>
          );
        }

        return <span key={i}>{seg}</span>;
      })}
    </span>
  );
}

// ── Timestamps ───────────────────────────────────────────────────
function formatTimestamp(isoString) {
  const date = new Date(isoString);
  const now = new Date();
  const isToday = date.toDateString() === now.toDateString();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const isYesterday = date.toDateString() === yesterday.toDateString();

  const time = date.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return `${date.toLocaleDateString("en-US", {
    month: "2-digit",
    day: "2-digit",
    year: "numeric",
  })} ${time}`;
}

function formatShortTime(isoString) {
  return new Date(isoString).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

function formatDateSeparator(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

// ── Message grouping ─────────────────────────────────────────────
function shouldGroup(current, previous) {
  if (!previous) return false;
  if (current.author.id !== previous.author.id) return false;
  const diff = new Date(previous.createdAtISO) - new Date(current.createdAtISO);
  return Math.abs(diff) < 7 * 60 * 1000;
}

function isDifferentDay(a, b) {
  if (!a || !b) return true;
  return new Date(a.createdAtISO).toDateString() !== new Date(b.createdAtISO).toDateString();
}

// ── Image Attachments ────────────────────────────────────────────
function ImageAttachments({ attachments }) {
  if (!attachments?.length) return null;

  const images = attachments.filter(
    (a) => a.contentType?.startsWith("image/") && (a.url || a.proxyURL),
  );

  if (!images.length) return null;

  return (
    <div className={styles.attachments}>
      {images.map((img, i) => {
        const src = img.proxyURL || img.url;
        // Constrain to max 400px wide, preserve aspect ratio
        const maxW = 400;
        const maxH = 300;
        let w = img.width || maxW;
        let h = img.height || maxH;
        if (w > maxW) {
          h = Math.round(h * (maxW / w));
          w = maxW;
        }
        if (h > maxH) {
          w = Math.round(w * (maxH / h));
          h = maxH;
        }

        return (
          <a
            key={i}
            href={img.url || src}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.attachmentLink}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={img.name || "attachment"}
              width={w}
              height={h}
              className={styles.attachmentImage}
              loading="lazy"
            />
          </a>
        );
      })}
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  DiscordChat Component
// ═════════════════════════════════════════════════════════════════

export default function DiscordChatComponent({ messageCount = 50 }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const res = await fetch(`/api/discord/messages?limit=${messageCount}`);
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (active) {
          setMessages((data.messages || []).reverse());
          setError(null);
          setLoading(false);
        }
      } catch (err) {
        if (active) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    const interval = setInterval(load, 1_000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [messageCount]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className={styles.container} id="discord-chat">
      {/* ── Title Bar ─────────────────────────────────────────── */}
      <div className={styles.titleBar}>
        <div className={styles.trafficLights}>
          <span className={styles.trafficDot} />
          <span className={styles.trafficDot} />
          <span className={styles.trafficDot} />
        </div>
        <span className={styles.channelIcon}>#</span>
        <span className={styles.channelName}>general-chat</span>
        <span className={styles.onlineDot} />
        <span className={styles.channelTopic}>
          general discussion, arguments and shouting matches
        </span>
      </div>

      {/* ── Messages ──────────────────────────────────────────── */}
      <div className={styles.messagesArea} ref={scrollRef}>
        {loading && (
          <div className={styles.loading}>
            <div className={styles.loadingDots}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
            <span>Loading messages…</span>
          </div>
        )}

        {error && (
          <div className={styles.error}>
            <span className={styles.errorIcon}>⚠️</span>
            <span>Couldn&apos;t load messages</span>
          </div>
        )}

        {!loading &&
          !error &&
          messages.map((msg, i) => {
            const prev = i > 0 ? messages[i - 1] : null;
            const grouped = shouldGroup(msg, prev);
            const newDay = isDifferentDay(msg, prev);
            // Use role color from API if available, otherwise deterministic fallback
            const nameColor = msg.author.roleColor || getFallbackColor(msg.author.id);

            return (
              <div key={msg.id}>
                {newDay && (
                  <div className={styles.dateSeparator}>
                    <span className={styles.dateSeparatorText}>
                      {formatDateSeparator(msg.createdAtISO)}
                    </span>
                  </div>
                )}

                {grouped && !newDay ? (
                  <div className={styles.messageRowGrouped}>
                    <span className={styles.timestampInline}>
                      {formatShortTime(msg.createdAtISO)}
                    </span>
                    <div className={styles.messageContent}>
                      <p className={styles.messageText}>
                        {formatContent(msg.content, msg.cleanContent)}
                      </p>
                      <ImageAttachments attachments={msg.attachments} />
                    </div>
                  </div>
                ) : (
                  <div className={styles.messageRow}>
                    {msg.author.avatarUrl ? (
                      <Image
                        className={styles.avatar}
                        src={msg.author.avatarUrl}
                        alt={msg.author.displayName}
                        width={40}
                        height={40}
                        unoptimized
                      />
                    ) : (
                      <div
                        className={styles.avatarFallback}
                        style={{ background: getAvatarColor(msg.author.id) }}
                      >
                        {(msg.author.displayName || "?")[0].toUpperCase()}
                      </div>
                    )}

                    <div className={styles.messageContent}>
                      <div className={styles.messageHeader}>
                        <span
                          className={styles.authorName}
                          style={{ color: nameColor }}
                        >
                          {msg.author.displayName}
                        </span>
                        <span className={styles.timestamp}>
                          {formatTimestamp(msg.createdAtISO)}
                        </span>
                      </div>
                      <p className={styles.messageText}>
                        {formatContent(msg.content, msg.cleanContent)}
                      </p>
                      <ImageAttachments attachments={msg.attachments} />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
      </div>

      {/* ── Input Bar ─────────────────────────────────────────── */}
      <div className={styles.inputBar}>
        <div className={styles.inputContainer}>
          <span className={styles.inputPlaceholder}>
            Message #general-chat
          </span>
          <div className={styles.inputIcons}>
            <span>😀</span>
            <span>🎁</span>
            <span>📎</span>
          </div>
        </div>
      </div>
    </div>
  );
}
