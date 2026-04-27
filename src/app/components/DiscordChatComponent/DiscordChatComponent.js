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

export default function DiscordChatComponent({ messageCount = 50, joinMode = false, inviteUrl = "https://discord.gg/clockcrew" }) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let es;
    let retryTimeout;

    function connect() {
      es = new EventSource(`/api/discord/stream?limit=${messageCount}`);

      // ── Initial batch ───────────────────────────────────────────
      es.addEventListener("init", (e) => {
        try {
          const { messages: msgs } = JSON.parse(e.data);
          // Messages arrive newest-first from the API — reverse to chronological
          setMessages((msgs || []).reverse());
          setError(null);
          setLoading(false);
        } catch (err) {
          console.error("[DiscordChat] Init parse error:", err);
        }
      });

      // ── New messages (delta) ────────────────────────────────────
      es.addEventListener("new", (e) => {
        try {
          const { messages: newMsgs } = JSON.parse(e.data);
          if (!newMsgs?.length) return;

          setMessages((prev) => {
            // New messages arrive newest-first — reverse to chronological
            const appended = [...prev, ...newMsgs.reverse()];
            // Cap the buffer so the DOM doesn't grow unbounded
            return appended.length > messageCount
              ? appended.slice(appended.length - messageCount)
              : appended;
          });
        } catch (err) {
          console.error("[DiscordChat] New message parse error:", err);
        }
      });

      // ── Error handling with auto-reconnect ──────────────────────
      // EventSource auto-reconnects on network errors. We only need
      // to handle the case where the connection is permanently lost.
      es.addEventListener("error", (_e) => {
        if (es.readyState === EventSource.CLOSED) {
          console.warn("[DiscordChat] SSE connection closed, retrying in 3s…");
          es.close();
          retryTimeout = setTimeout(connect, 3_000);
        }
      });

      // ── Server-side error event ─────────────────────────────────
      es.addEventListener("error", () => {
        // Keep existing messages visible, just mark the error state
      });
    }

    connect();

    return () => {
      if (es) es.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [messageCount]);



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

      {/* ── Input Bar / Join CTA ────────────────────────────── */}
      <div className={styles.inputBar}>
        {joinMode ? (
          <a
            href={inviteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.joinButton}
            id="discord-join-button"
          >
            <svg className={styles.joinButtonIcon} viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.36-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.24-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
            </svg>
            Join the Discord Server
          </a>
        ) : (
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
        )}
      </div>
    </div>
  );
}
