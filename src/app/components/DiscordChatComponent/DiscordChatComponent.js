"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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

// ── Tenor URL detection ──────────────────────────────────────────
const TENOR_URL_RE = /https?:\/\/tenor\.com\/view\/[\w-]+/g;

function extractTenorUrls(content) {
  return (content || "").match(TENOR_URL_RE) || [];
}

// ── Discord Custom Emoji ─────────────────────────────────────────
const CUSTOM_EMOJI_RE = /<(a?):(\w+):(\d+)>/g;

function emojiUrl(id, animated) {
  const ext = animated ? "gif" : "webp";
  return `https://cdn.discordapp.com/emojis/${id}.${ext}?size=48&quality=lossless`;
}

// ── Format Discord message content ───────────────────────────────
function formatContent(content, cleanContent) {
  const text = cleanContent || content || "";
  const rawContent = content || "";
  if (!text) return null;

  const emojiMap = new Map();
  let emojiMatch;
  CUSTOM_EMOJI_RE.lastIndex = 0;
  while ((emojiMatch = CUSTOM_EMOJI_RE.exec(rawContent)) !== null) {
    const [, animated, name, id] = emojiMatch;
    emojiMap.set(name, { animated: animated === "a", id, name });
  }

  const emojiRawPattern = "<a?:[\\w]+:\\d+>";
  const emojiCleanPattern = emojiMap.size > 0
    ? `:(?:${[...emojiMap.keys()].map(n => n.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")).join("|")}):`
    : null;

  const splitParts = [
    emojiRawPattern,
    ...(emojiCleanPattern ? [emojiCleanPattern] : []),
    "@[\\w.]+",
    "https?:\\/\\/\\S+",
  ];
  const splitRe = new RegExp(`(${splitParts.join("|")})`, "g");
  const segments = text.split(splitRe);

  if (segments.length <= 1 && emojiMap.size === 0) {
    return <span>{text}</span>;
  }

  return (
    <span>
      {segments.map((seg, i) => {
        if (!seg) return null;
        const rawEmojiMatch = /^<(a?):(\w+):(\d+)>$/.exec(seg);
        if (rawEmojiMatch) {
          const [, animated, name, id] = rawEmojiMatch;
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={emojiUrl(id, animated === "a")} alt={`:${name}:`}
              title={`:${name}:`} className={styles.customEmoji} draggable={false} loading="lazy" />
          );
        }
        const cleanEmojiMatch = /^:(\w+):$/.exec(seg);
        if (cleanEmojiMatch && emojiMap.has(cleanEmojiMatch[1])) {
          const emoji = emojiMap.get(cleanEmojiMatch[1]);
          return (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={i} src={emojiUrl(emoji.id, emoji.animated)} alt={`:${emoji.name}:`}
              title={`:${emoji.name}:`} className={styles.customEmoji} draggable={false} loading="lazy" />
          );
        }
        if (seg.startsWith("@")) {
          return <span key={i} className={styles.mention}>{seg}</span>;
        }
        if (/^https?:\/\//.test(seg)) {
          if (TENOR_URL_RE.test(seg)) { TENOR_URL_RE.lastIndex = 0; return null; }
          const display = seg.length > 50 ? seg.substring(0, 47) + "..." : seg;
          return <a key={i} href={seg} target="_blank" rel="noopener noreferrer">{display}</a>;
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
  const time = date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
  if (isToday) return `Today at ${time}`;
  if (isYesterday) return `Yesterday at ${time}`;
  return `${date.toLocaleDateString("en-US", { month: "2-digit", day: "2-digit", year: "numeric" })} ${time}`;
}

function formatShortTime(isoString) {
  return new Date(isoString).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true });
}

function formatDateSeparator(isoString) {
  return new Date(isoString).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
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

// ── Tenor GIF Embed ──────────────────────────────────────────────
function TenorEmbed({ url }) {
  const [gifUrl, setGifUrl] = useState(null);
  const [error, setError] = useState(false);
  useEffect(() => {
    let cancelled = false;
    fetch(`/api/tenor/oembed?url=${encodeURIComponent(url)}`)
      .then((res) => res.ok ? res.json() : Promise.reject())
      .then((data) => { if (!cancelled && data.gifUrl) setGifUrl(data.gifUrl); })
      .catch(() => { if (!cancelled) setError(true); });
    return () => { cancelled = true; };
  }, [url]);
  if (error) return null;
  if (!gifUrl) return <div className={styles.tenorPlaceholder}><div className={styles.tenorSpinner} /></div>;
  return (
    <a href={url} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={gifUrl} alt="Tenor GIF" className={styles.tenorGif} loading="lazy" />
    </a>
  );
}

function TenorEmbeds({ content }) {
  const urls = extractTenorUrls(content);
  if (!urls.length) return null;
  return <div className={styles.attachments}>{urls.map((url, i) => <TenorEmbed key={i} url={url} />)}</div>;
}

// ── Image Attachments ────────────────────────────────────────────
function ImageAttachments({ attachments }) {
  if (!attachments?.length) return null;
  const images = attachments.filter((a) => a.contentType?.startsWith("image/") && (a.url || a.proxyURL));
  if (!images.length) return null;
  return (
    <div className={styles.attachments}>
      {images.map((img, i) => {
        const src = img.proxyURL || img.url;
        const maxW = 400, maxH = 300;
        let w = img.width || maxW, h = img.height || maxH;
        if (w > maxW) { h = Math.round(h * (maxW / w)); w = maxW; }
        if (h > maxH) { w = Math.round(w * (maxH / h)); h = maxH; }
        return (
          <a key={i} href={img.url || src} target="_blank" rel="noopener noreferrer" className={styles.attachmentLink}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt={img.name || "attachment"} width={w} height={h}
              className={styles.attachmentImage} loading="lazy" />
          </a>
        );
      })}
    </div>
  );
}

// ── Status Indicator ─────────────────────────────────────────────
function StatusDot({ status }) {
  const colors = { online: "#23a559", idle: "#f0b232", dnd: "#f23f43" };
  return (
    <span className={styles.statusDot} style={{ background: colors[status] || "#80848e" }}
      title={status} />
  );
}

// ── Channel Sidebar Item ─────────────────────────────────────────
function ChannelItem({ channel, isActive, onClick }) {
  return (
    <button
      className={`${styles.channelItem} ${isActive ? styles.channelItemActive : ""}`}
      onClick={() => onClick(channel)}
      title={channel.topic || channel.name}
    >
      <span className={styles.channelHash}>#</span>
      <span className={styles.channelItemName}>{channel.name}</span>
    </button>
  );
}

// ── Members Sidebar ──────────────────────────────────────────────
function MemberItem({ member }) {
  return (
    <div className={styles.memberItem}>
      <div className={styles.memberAvatarWrap}>
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.avatarUrl} alt="" className={styles.memberAvatar} loading="lazy" />
        ) : (
          <div className={styles.memberAvatarFallback} style={{ background: getAvatarColor(member.id) }}>
            {(member.displayName || "?")[0].toUpperCase()}
          </div>
        )}
        <StatusDot status={member.status} />
      </div>
      <div className={styles.memberInfo}>
        <span className={styles.memberName} style={{ color: member.roleColor || "#dbdee1" }}>
          {member.displayName}
        </span>
        {member.activity && (
          <span className={styles.memberActivity}>{member.activity}</span>
        )}
      </div>
    </div>
  );
}

// ── Whitelisted channel IDs (only these are shown in the sidebar) ─
const CHANNEL_IDS = ["671089694397956116", "676318241689436170"];

// ═════════════════════════════════════════════════════════════════
//  DiscordChat Component
// ═════════════════════════════════════════════════════════════════

export default function DiscordChatComponent({ messageCount = 500, joinMode = false, inviteUrl = "https://discord.gg/sBX7BxP", onJoinHoverChange }) {
  const [channels, setChannels] = useState([]);
  const [serverName, setServerName] = useState("");
  const [activeChannelId, setActiveChannelId] = useState(CHANNEL_IDS[0]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [members, setMembers] = useState(null);
  const scrollRef = useRef(null);
  const isFirstLoad = useRef(true);

  // Derive active channel object from fetched data
  const activeChannel = channels.find((ch) => ch.id === activeChannelId) || { id: activeChannelId, name: "chat" };

  // ── Fetch channel list + server name from API ───────────────────
  useEffect(() => {
    let cancelled = false;
    fetch("/api/discord/channels")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => {
        if (cancelled) return;
        if (data.guildName) setServerName(data.guildName);
        // Filter to only the whitelisted channels, preserve order
        const filtered = CHANNEL_IDS
          .map((id) => data.channels?.find((ch) => ch.id === id))
          .filter(Boolean);
        setChannels(filtered.length > 0 ? filtered : CHANNEL_IDS.map((id) => ({ id, name: id })));
      })
      .catch(() => {
        // Fallback — use IDs as names
        if (!cancelled) setChannels(CHANNEL_IDS.map((id) => ({ id, name: id })));
      });
    return () => { cancelled = true; };
  }, []);

  // ── Scroll to bottom ────────────────────────────────────────────
  const scrollToBottom = useCallback((instant = false) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTo({ top: el.scrollHeight, behavior: instant ? "instant" : "smooth" });
  }, []);

  // ── SSE stream for messages ─────────────────────────────────────
  useEffect(() => {
    let es;
    let retryTimeout;

    function connect() {
      es = new EventSource(`/api/discord/stream?limit=${messageCount}&channelId=${activeChannelId}`);

      es.addEventListener("init", (e) => {
        try {
          const { messages: msgs } = JSON.parse(e.data);
          const reversed = (msgs || []).reverse();
          setMessages(reversed);
          setError(null);
          setLoading(false);

          // ── Backfill server name & channel names from message data ──
          // The SSE stream messages include guildName and channelName
          // from DiscordDataService, so we can use them as a fallback
          // when the Lupos /guild/channels endpoint is unavailable.
          if (reversed.length > 0) {
            const firstMsg = reversed[0];
            if (firstMsg.guildName) {
              setServerName((prev) => prev || firstMsg.guildName);
            }
            // Build channel name map from all messages in the batch
            setChannels((prev) => {
              // If we already have real names (not just IDs), keep them
              const hasRealNames = prev.some((ch) => ch.name !== ch.id);
              if (hasRealNames) return prev;

              const channelMap = new Map();
              for (const msg of reversed) {
                if (msg.channelId && msg.channelName) {
                  channelMap.set(msg.channelId, msg.channelName);
                }
              }
              if (channelMap.size === 0) return prev;

              // Merge discovered names into existing channel list
              return prev.map((ch) => ({
                ...ch,
                name: channelMap.get(ch.id) || ch.name,
              }));
            });
          }

          requestAnimationFrame(() => {
            scrollToBottom(true);
            isFirstLoad.current = false;
          });
        } catch (err) {
          console.error("[DiscordChat] Init parse error:", err);
        }
      });

      es.addEventListener("new", (e) => {
        try {
          const { messages: newMsgs } = JSON.parse(e.data);
          if (!newMsgs?.length) return;
          setMessages((prev) => {
            const appended = [...prev, ...newMsgs.reverse()];
            return appended.length > messageCount ? appended.slice(appended.length - messageCount) : appended;
          });
          requestAnimationFrame(() => scrollToBottom(false));
        } catch (err) {
          console.error("[DiscordChat] New message parse error:", err);
        }
      });

      es.addEventListener("delete", (e) => {
        try {
          const { ids } = JSON.parse(e.data);
          if (!ids?.length) return;
          const deletedSet = new Set(ids);
          setMessages((prev) => prev.filter((msg) => !deletedSet.has(msg.id)));
        } catch (err) {
          console.error("[DiscordChat] Delete event parse error:", err);
        }
      });

      es.addEventListener("error", () => {
        if (es.readyState === EventSource.CLOSED) {
          console.warn("[DiscordChat] SSE closed, retrying in 3s…");
          es.close();
          retryTimeout = setTimeout(connect, 3_000);
        }
      });
    }

    connect();
    return () => {
      if (es) es.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [messageCount, scrollToBottom, activeChannelId]);

  // ── Fetch members (poll every 30s) ──────────────────────────────
  useEffect(() => {
    let cancelled = false;
    async function fetchMembers() {
      try {
        const res = await fetch("/api/discord/members");
        if (res.ok && !cancelled) {
          setMembers(await res.json());
        }
      } catch {
        // silently ignore — sidebar is non-critical
      }
    }
    fetchMembers();
    const interval = setInterval(fetchMembers, 30_000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // ── Channel switch — reset message state eagerly ────────────────
  const handleChannelClick = useCallback((channel) => {
    setActiveChannelId(channel.id);
    setMessages([]);
    setLoading(true);
    isFirstLoad.current = true;
  }, []);

  return (
    <div className={styles.container} id="discord-chat">
      {/* ── Title Bar ─────────────────────────────────────────── */}
      <div className={styles.titleBar}>
        <div className={styles.trafficLights}>
          <span className={styles.trafficDot} />
          <span className={styles.trafficDot} />
          <span className={styles.trafficDot} />
        </div>
        <span className={styles.titleBarCenter}>
          <span className={styles.channelName}>{serverName || "Discord"}</span>
        </span>
        <span className={styles.onlineDot} />
        {members && (
          <span className={styles.channelTopic}>
            {members.totalOnline} online · {members.totalMembers} members
          </span>
        )}
      </div>

      {/* ── Three-Panel Layout ─────────────────────────────────── */}
      <div className={styles.panelLayout}>
        {/* ── Left Sidebar: Channels ──────────────────────────── */}
        <aside className={styles.channelSidebar}>
          <div className={styles.serverHeader}>
            <span className={styles.serverName}>{serverName || "Discord"}</span>
          </div>
          <div className={styles.channelList}>
            <div className={styles.channelCategory}>
              <span className={styles.categoryName}>Text Channels</span>
            </div>
            {channels.map((ch) => (
              <ChannelItem
                key={ch.id}
                channel={ch}
                isActive={activeChannelId === ch.id}
                onClick={handleChannelClick}
              />
            ))}
          </div>
        </aside>

        {/* ── Center: Messages ────────────────────────────────── */}
        <div className={styles.chatPanel}>
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
            {!loading && !error && messages.map((msg, i) => {
              const prev = i > 0 ? messages[i - 1] : null;
              const grouped = shouldGroup(msg, prev);
              const newDay = isDifferentDay(msg, prev);
              const nameColor = msg.author.roleColor || getFallbackColor(msg.author.id);
              return (
                <div key={msg.id}>
                  {newDay && (
                    <div className={styles.dateSeparator}>
                      <span className={styles.dateSeparatorText}>{formatDateSeparator(msg.createdAtISO)}</span>
                    </div>
                  )}
                  {grouped && !newDay ? (
                    <div className={styles.messageRowGrouped}>
                      <span className={styles.timestampInline}>{formatShortTime(msg.createdAtISO)}</span>
                      <div className={styles.messageContent}>
                        <p className={styles.messageText}>{formatContent(msg.content, msg.cleanContent)}</p>
                        <TenorEmbeds content={msg.content} />
                        <ImageAttachments attachments={msg.attachments} />
                      </div>
                    </div>
                  ) : (
                    <div className={styles.messageRow}>
                      {msg.author.avatarUrl ? (
                        <Image className={styles.avatar} src={msg.author.avatarUrl}
                          alt={msg.author.displayName} width={40} height={40} unoptimized />
                      ) : (
                        <div className={styles.avatarFallback} style={{ background: getAvatarColor(msg.author.id) }}>
                          {(msg.author.displayName || "?")[0].toUpperCase()}
                        </div>
                      )}
                      <div className={styles.messageContent}>
                        <div className={styles.messageHeader}>
                          <span className={styles.authorName} style={{ color: nameColor }}>
                            {msg.author.displayName}
                          </span>
                          {msg.author.isBot && (
                            <span className={styles.botBadge}>
                              <svg className={styles.botBadgeIcon} viewBox="0 0 16 16" fill="currentColor">
                                <path d="M7.4,11.17,4,8.62,5,7.26l2,1.53L10.64,4l1.36,1Z" />
                              </svg>
                              BOT
                            </span>
                          )}
                          <span className={styles.timestamp}>{formatTimestamp(msg.createdAtISO)}</span>
                        </div>
                        <p className={styles.messageText}>{formatContent(msg.content, msg.cleanContent)}</p>
                        <TenorEmbeds content={msg.content} />
                        <ImageAttachments attachments={msg.attachments} />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Input Bar / Join CTA ──────────────────────────── */}
          <div className={styles.inputBar}>
            {joinMode ? (
              <a href={inviteUrl} target="_blank" rel="noopener noreferrer"
                className={styles.joinButton} id="discord-join-button"
                onMouseEnter={() => onJoinHoverChange?.(true)}
                onMouseLeave={() => onJoinHoverChange?.(false)}>
                <svg className={styles.joinButtonIcon} viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
                  <path d="M19.27 5.33C17.94 4.71 16.5 4.26 15 4a.09.09 0 0 0-.07.03c-.18.33-.39.76-.53 1.09a16.09 16.09 0 0 0-4.8 0c-.14-.34-.36-.76-.54-1.09c-.01-.02-.04-.03-.07-.03c-1.5.26-2.93.71-4.27 1.33c-.01 0-.02.01-.03.02c-2.72 4.07-3.47 8.03-3.1 11.95c0 .02.01.04.03.05c1.8 1.32 3.53 2.12 5.24 2.65c.03.01.06 0 .07-.02c.4-.55.76-1.13 1.07-1.74c.02-.04 0-.08-.04-.09c-.57-.22-1.11-.48-1.64-.78c-.04-.02-.04-.08-.01-.11c.11-.08.22-.17.33-.25c.02-.02.05-.02.07-.01c3.44 1.57 7.15 1.57 10.55 0c.02-.01.05-.01.07.01c.11.09.22.17.33.26c.04.03.04.09-.01.11c-.52.31-1.07.56-1.64.78c-.04.01-.05.06-.04.09c.32.61.68 1.19 1.07 1.74c.03.01.06.02.09.01c1.72-.53 3.45-1.33 5.24-2.65c.02-.01.03-.03.03-.05c.44-4.53-.73-8.46-3.1-11.95c-.01-.01-.02-.02-.04-.02zM8.52 14.91c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.84 2.12-1.89 2.12zm6.97 0c-1.03 0-1.89-.95-1.89-2.12s.84-2.12 1.89-2.12c1.06 0 1.9.96 1.89 2.12c0 1.17-.83 2.12-1.89 2.12z" />
                </svg>
                Join the Discord Server
              </a>
            ) : (
              <div className={styles.inputContainer}>
                <span className={styles.inputPlaceholder}>Message #{activeChannel.name}</span>
                <div className={styles.inputIcons}>
                  <span>😀</span><span>🎁</span><span>📎</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ── Right Sidebar: Members ──────────────────────────── */}
        <aside className={styles.memberSidebar}>
          {members ? (
            <div className={styles.memberList}>
              {members.roles?.map((role) => (
                <div key={role.id} className={styles.memberRoleGroup}>
                  <div className={styles.memberRoleHeader}>
                    {role.name} — {role.members.length}
                  </div>
                  {role.members.map((m) => (
                    <MemberItem key={m.id} member={m} />
                  ))}
                </div>
              ))}
              {members.bots?.length > 0 && (
                <div className={styles.memberRoleGroup}>
                  <div className={styles.memberRoleHeader}>
                    Bots — {members.bots.length}
                  </div>
                  {members.bots.map((m) => (
                    <MemberItem key={m.id} member={m} />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className={styles.loading}>
              <div className={styles.loadingDots}>
                <span className={styles.loadingDot} />
                <span className={styles.loadingDot} />
                <span className={styles.loadingDot} />
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
