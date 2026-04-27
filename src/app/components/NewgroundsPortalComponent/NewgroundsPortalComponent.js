"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import styles from "./NewgroundsPortalComponent.module.css";

// ── Score display helpers ────────────────────────────────────────
function ScoreDisplay({ score }) {
  if (score == null) return null;
  const rounded = Math.round(score * 10) / 10;
  return (
    <span className={styles.itemScore}>
      <span className={styles.scoreStar}>★</span>
      {rounded.toFixed(1)}
    </span>
  );
}

function formatNumber(n) {
  if (n == null) return "—";
  if (typeof n === "string") return n;
  return n.toLocaleString();
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr; // raw string like "2004-09-22"
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

// ── Top Submissions Section ──────────────────────────────────
function TopSubmissionsSection({ title, emoji, items }) {
  if (!items?.length) return null;
  return (
    <div className={styles.topSubmissions}>
      <div className={styles.topSubTitle}>{emoji} Top {title}</div>
      <div className={styles.topSubList}>
        {items.map((sub, i) => (
          <a
            key={sub.contentId || sub._id || i}
            href={sub.url}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.topSubItem}
          >
            {sub.thumbnailUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={sub.thumbnailUrl} alt={sub.title} className={styles.topSubThumb} loading="lazy" />
            )}
            <div className={styles.topSubInfo}>
              <span className={styles.topSubName}>{sub.title}</span>
            </div>
            {sub.score != null && (
              <span className={styles.topSubScore}>★ {(Math.round(sub.score * 10) / 10).toFixed(1)}</span>
            )}
          </a>
        ))}
      </div>
    </div>
  );
}

// ── Type metadata ────────────────────────────────────────────────
const TYPE_META = {
  movie: { emoji: "🎬", label: "Movie", badgeClass: "typeBadgeMovie", action: "▶ Watch on Newgrounds" },
  game:  { emoji: "🎮", label: "Game",  badgeClass: "typeBadgeGame",  action: "🎮 Play on Newgrounds" },
  audio: { emoji: "🎵", label: "Audio", badgeClass: "typeBadgeAudio", action: "🎧 Listen on Newgrounds" },
};

function getTypeMeta(contentType) {
  return TYPE_META[contentType] || TYPE_META.movie;
}

// ── Search icon SVG ──────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.44.706a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
    </svg>
  );
}

// ── Content Detail Modal ─────────────────────────────────────────
function ContentDetailModal({ item, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!item?.usernameLower) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/newgrounds/card/${encodeURIComponent(item.usernameLower)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [item?.usernameLower]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const profile = data?.profile;
  const ccUser = data?.ccUser;
  const randomPost = data?.randomPost;
  const meta = getTypeMeta(item?.contentType);

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} title="Close">✕</button>

        {/* ══ CONTENT HERO — the clicked content ══════════ */}
        <div
          className={styles.contentHero}
          style={item?.thumbnailUrl ? { backgroundImage: `url(${item.thumbnailUrl})` } : undefined}
        >
          <div className={styles.contentHeroOverlay} />
          <div className={styles.contentHeroBody}>
            <span className={`${styles.heroBadge} ${styles[meta.badgeClass]}`}>
              {meta.emoji} {meta.label}
            </span>
            <h2 className={styles.contentHeroTitle}>{item?.title}</h2>
            <div className={styles.contentHeroMeta}>
              <span className={styles.contentHeroAuthor}>by {item?.usernameLower}</span>
              {item?.score != null && (
                <span className={styles.contentHeroScore}>★ {item.score.toFixed(1)} / 5.0</span>
              )}
            </div>
            {item?.score != null && (
              <div className={styles.scoreBar}>
                <div className={styles.scoreBarFill} style={{ width: `${(item.score / 5) * 100}%` }} />
              </div>
            )}
            <a
              href={item?.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`${styles.actionButton} ${styles.actionHero}`}
            >
              {meta.action}
            </a>
          </div>
        </div>

        {/* ══ CREATOR PROFILE ════════════════════════════════ */}
        <div className={styles.creatorDivider}>
          <span className={styles.creatorDividerText}>Created by</span>
        </div>

        {loading ? (
          <div className={styles.loading} style={{ minHeight: 120 }}>
            <div className={styles.loadingDots}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
          </div>
        ) : !profile ? (
          <div className={styles.emptyState} style={{ minHeight: 80 }}>
            <span className={styles.emptyText}>Profile not found</span>
          </div>
        ) : (
          <>
            <div className={styles.creatorHeader}>
              <div className={styles.cardAvatarWrap} style={{ margin: 0, width: 56, height: 56 }}>
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={profile.username} className={styles.cardAvatar} />
                ) : (
                  <div className={styles.cardAvatarFallback}>{(profile.username || "?")[0].toUpperCase()}</div>
                )}
              </div>
              <div>
                <span className={styles.cardUsername}>{profile.username}</span>
                <div className={styles.cardRankRow}>
                  {profile.rank && <span className={`${styles.cardRankBadge} ${styles.ngBadge}`}>{profile.rank}</span>}
                  {profile.level != null && <span className={`${styles.cardRankBadge} ${styles.levelBadge}`}>Lvl {profile.level}</span>}
                  {profile.supporter && <span className={`${styles.cardRankBadge} ${styles.supporterBadge}`}>⭐ Supporter</span>}
                  {ccUser?.position && <span className={`${styles.cardRankBadge} ${styles.ccBadge}`}>{ccUser.position}</span>}
                </div>
              </div>
            </div>

            {profile.description && <p className={styles.cardDescription}>{profile.description}</p>}

            <div className={styles.cardPersonalInfo}>
              {profile.joinDate && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>📅</span> Joined <span className={styles.personalInfoValue}>{profile.joinDate}</span></span>}
              {profile.location && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>📍</span> <span className={styles.personalInfoValue}>{profile.location}</span></span>}
              {profile.age != null && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>🎂</span> <span className={styles.personalInfoValue}>Age {profile.age}</span></span>}
              {profile.sex && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>👤</span> <span className={styles.personalInfoValue}>{profile.sex}</span></span>}
              {profile.job && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>💼</span> <span className={styles.personalInfoValue}>{profile.job}</span></span>}
              {profile.globalRank != null && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>🌍</span> Rank #<span className={styles.personalInfoValue}>{formatNumber(profile.globalRank)}</span></span>}
              {profile.expPoints && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>✨</span> EXP <span className={styles.personalInfoValue}>{profile.expPoints}</span></span>}
              {profile.votePower && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>⚡</span> <span className={styles.personalInfoValue}>{profile.votePower}</span></span>}
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.fans)}</span><span className={styles.statLabel}>Fans</span></div>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.blams)}</span><span className={styles.statLabel}>Blams</span></div>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.saves)}</span><span className={styles.statLabel}>Saves</span></div>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.medals)}</span><span className={styles.statLabel}>Medals</span></div>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.trophies)}</span><span className={styles.statLabel}>Trophies</span></div>
              {profile.expRank != null && <div className={styles.statItem}><span className={styles.statValue}>#{formatNumber(profile.expRank)}</span><span className={styles.statLabel}>EXP Rank</span></div>}
            </div>

            <div className={styles.contentCounts}>
              {profile.movieCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>🎬</span><span className={styles.contentPillCount}>{profile.movieCount}</span> Movies</span>}
              {profile.gameCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>🎮</span><span className={styles.contentPillCount}>{profile.gameCount}</span> Games</span>}
              {profile.audioCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>🎵</span><span className={styles.contentPillCount}>{profile.audioCount}</span> Audio</span>}

              {profile.reviewCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>📝</span><span className={styles.contentPillCount}>{profile.reviewCount}</span> Reviews</span>}
              {profile.postCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>💬</span><span className={styles.contentPillCount}>{profile.postCount}</span> Posts</span>}
              {profile.faveCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>❤️</span><span className={styles.contentPillCount}>{profile.faveCount}</span> Faves</span>}
            </div>

            {ccUser && (
              <div className={styles.ccSection}>
                <div className={styles.ccSectionTitle}>🕰️ ClockCrew.net Forum</div>
                <div className={styles.ccRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {ccUser.avatarUrl && <img src={ccUser.avatarUrl} alt={ccUser.username} className={styles.ccAvatar} />}
                  <div className={styles.ccInfo}>
                    <span className={styles.ccUsername}>{ccUser.username}</span>
                    {ccUser.customTitle && <div className={styles.ccCustomTitle}>&ldquo;{ccUser.customTitle}&rdquo;</div>}
                  </div>
                </div>
                <div className={styles.ccStats}>
                  {ccUser.postCount != null && <span className={styles.ccStatItem}>Forum Posts: <span className={styles.ccStatValue}>{formatNumber(ccUser.postCount)}</span></span>}
                  {ccUser.dateRegistered && <span className={styles.ccStatItem}>Registered: <span className={styles.ccStatValue}>{formatDate(ccUser.dateRegistered)}</span></span>}
                </div>

                {randomPost?.body && (
                  <blockquote className={styles.ccForumQuote}>
                    <p className={styles.ccQuoteBody}>
                      &ldquo;{(() => {
                        const stripped = randomPost.body.replace(/<[^>]*>/g, "").trim();
                        return stripped.length > 280 ? stripped.slice(0, 277) + "…" : stripped;
                      })()}&rdquo;
                    </p>
                    <footer className={styles.ccQuoteFooter}>
                      {randomPost.threadTitle && (
                        <span className={styles.ccQuoteThread}>
                          <span className={styles.ccQuoteThreadIcon}>💬</span>
                          {randomPost.threadTitle}
                        </span>
                      )}
                      {randomPost.date && (
                        <span className={styles.ccQuoteDate}>{formatDate(randomPost.date)}</span>
                      )}
                    </footer>
                  </blockquote>
                )}
              </div>
            )}

            <TopSubmissionsSection title="Movies" emoji="🎬" items={data?.topMovies} />
            <TopSubmissionsSection title="Games" emoji="🎮" items={data?.topGames} />
            <TopSubmissionsSection title="Audio" emoji="🎵" items={data?.topAudio} />


            <div className={styles.cardActions}>
              <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.actionSecondary}`}>🌐 NG Profile</a>
              {ccUser?.profileUrl && <a href={ccUser.profileUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.actionSecondary}`}>🕰️ Forum Profile</a>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Profile Detail Modal (for Clocks tab) ────────────────────
function ProfileDetailModal({ username, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!username) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/newgrounds/card/${encodeURIComponent(username)}`)
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((d) => { if (!cancelled) { setData(d); setLoading(false); } })
      .catch(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [username]);

  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  const profile = data?.profile;
  const ccUser = data?.ccUser;
  const randomPost = data?.randomPost;

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} title="Close">✕</button>

        {/* ══ PROFILE BANNER ════════════════════════════════ */}
        <div className={styles.profileBanner}>
          <div className={styles.profileBannerGradient} />
        </div>

        {loading ? (
          <div className={styles.loading} style={{ minHeight: 200 }}>
            <div className={styles.loadingDots}>
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
              <span className={styles.loadingDot} />
            </div>
          </div>
        ) : !profile ? (
          <div className={styles.emptyState} style={{ minHeight: 120 }}>
            <span className={styles.emptyText}>Profile not found</span>
          </div>
        ) : (
          <>
            {/* ── Avatar + Identity ─────────────────────────── */}
            <div className={styles.profileIdentity}>
              <div className={styles.profileAvatarWrap}>
                {profile.avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={profile.avatarUrl} alt={profile.username} className={styles.cardAvatar} />
                ) : (
                  <div className={styles.cardAvatarFallback}>{(profile.username || "?")[0].toUpperCase()}</div>
                )}
              </div>
              <div className={styles.profileNameBlock}>
                <span className={styles.profileDisplayName}>{profile.username}</span>
                <div className={styles.cardRankRow}>
                  {profile.rank && <span className={`${styles.cardRankBadge} ${styles.ngBadge}`}>{profile.rank}</span>}
                  {profile.level != null && <span className={`${styles.cardRankBadge} ${styles.levelBadge}`}>Lvl {profile.level}</span>}
                  {profile.supporter && <span className={`${styles.cardRankBadge} ${styles.supporterBadge}`}>⭐ Supporter</span>}
                  {ccUser?.position && <span className={`${styles.cardRankBadge} ${styles.ccBadge}`}>{ccUser.position}</span>}
                </div>
              </div>
            </div>

            {profile.description && <p className={styles.cardDescription}>{profile.description}</p>}

            <div className={styles.cardPersonalInfo}>
              {profile.joinDate && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>📅</span> Joined <span className={styles.personalInfoValue}>{profile.joinDate}</span></span>}
              {profile.location && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>📍</span> <span className={styles.personalInfoValue}>{profile.location}</span></span>}
              {profile.age != null && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>🎂</span> <span className={styles.personalInfoValue}>Age {profile.age}</span></span>}
              {profile.sex && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>👤</span> <span className={styles.personalInfoValue}>{profile.sex}</span></span>}
              {profile.job && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>💼</span> <span className={styles.personalInfoValue}>{profile.job}</span></span>}
              {profile.realName && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>🪪</span> <span className={styles.personalInfoValue}>{profile.realName}</span></span>}
              {profile.school && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>🎓</span> <span className={styles.personalInfoValue}>{profile.school}</span></span>}
              {profile.globalRank != null && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>🌍</span> Rank #<span className={styles.personalInfoValue}>{formatNumber(profile.globalRank)}</span></span>}
              {profile.expPoints && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>✨</span> EXP <span className={styles.personalInfoValue}>{profile.expPoints}</span></span>}
              {profile.votePower && <span className={styles.personalInfoItem}><span className={styles.personalInfoIcon}>⚡</span> <span className={styles.personalInfoValue}>{profile.votePower}</span></span>}
            </div>

            <div className={styles.statsGrid}>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.fans)}</span><span className={styles.statLabel}>Fans</span></div>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.blams)}</span><span className={styles.statLabel}>Blams</span></div>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.saves)}</span><span className={styles.statLabel}>Saves</span></div>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.medals)}</span><span className={styles.statLabel}>Medals</span></div>
              <div className={styles.statItem}><span className={styles.statValue}>{formatNumber(profile.trophies)}</span><span className={styles.statLabel}>Trophies</span></div>
              {profile.expRank != null && <div className={styles.statItem}><span className={styles.statValue}>#{formatNumber(profile.expRank)}</span><span className={styles.statLabel}>EXP Rank</span></div>}
            </div>

            <div className={styles.contentCounts}>
              {profile.movieCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>🎬</span><span className={styles.contentPillCount}>{profile.movieCount}</span> Movies</span>}
              {profile.gameCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>🎮</span><span className={styles.contentPillCount}>{profile.gameCount}</span> Games</span>}
              {profile.audioCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>🎵</span><span className={styles.contentPillCount}>{profile.audioCount}</span> Audio</span>}

              {profile.reviewCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>📝</span><span className={styles.contentPillCount}>{profile.reviewCount}</span> Reviews</span>}
              {profile.postCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>💬</span><span className={styles.contentPillCount}>{profile.postCount}</span> Posts</span>}
              {profile.faveCount > 0 && <span className={styles.contentPill}><span className={styles.contentPillIcon}>❤️</span><span className={styles.contentPillCount}>{profile.faveCount}</span> Faves</span>}
            </div>

            {/* ── Top Submissions ─────────────────────────────── */}
            <TopSubmissionsSection title="Movies" emoji="🎬" items={data?.topMovies} />
            <TopSubmissionsSection title="Games" emoji="🎮" items={data?.topGames} />
            <TopSubmissionsSection title="Audio" emoji="🎵" items={data?.topAudio} />


            {/* ── CC Forum ─────────────────────────────────────── */}
            {ccUser && (
              <div className={styles.ccSection}>
                <div className={styles.ccSectionTitle}>🕰️ ClockCrew.net Forum</div>
                <div className={styles.ccRow}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {ccUser.avatarUrl && <img src={ccUser.avatarUrl} alt={ccUser.username} className={styles.ccAvatar} />}
                  <div className={styles.ccInfo}>
                    <span className={styles.ccUsername}>{ccUser.username}</span>
                    {ccUser.customTitle && <div className={styles.ccCustomTitle}>&ldquo;{ccUser.customTitle}&rdquo;</div>}
                  </div>
                </div>
                <div className={styles.ccStats}>
                  {ccUser.postCount != null && <span className={styles.ccStatItem}>Forum Posts: <span className={styles.ccStatValue}>{formatNumber(ccUser.postCount)}</span></span>}
                  {ccUser.dateRegistered && <span className={styles.ccStatItem}>Registered: <span className={styles.ccStatValue}>{formatDate(ccUser.dateRegistered)}</span></span>}
                </div>

                {randomPost?.body && (
                  <blockquote className={styles.ccForumQuote}>
                    <p className={styles.ccQuoteBody}>
                      &ldquo;{(() => {
                        const stripped = randomPost.body.replace(/<[^>]*>/g, "").trim();
                        return stripped.length > 280 ? stripped.slice(0, 277) + "…" : stripped;
                      })()}&rdquo;
                    </p>
                    <footer className={styles.ccQuoteFooter}>
                      {randomPost.threadTitle && (
                        <span className={styles.ccQuoteThread}>
                          <span className={styles.ccQuoteThreadIcon}>💬</span>
                          {randomPost.threadTitle}
                        </span>
                      )}
                      {randomPost.date && (
                        <span className={styles.ccQuoteDate}>{formatDate(randomPost.date)}</span>
                      )}
                    </footer>
                  </blockquote>
                )}
              </div>
            )}

            {/* ── External Links ──────────────────────────────── */}
            {profile.links?.length > 0 && (
              <div className={styles.profileLinks}>
                <div className={styles.topSubTitle}>🔗 Links</div>
                <div className={styles.profileLinksList}>
                  {profile.links.map((link, i) => (
                    <a key={i} href={link.url || link} target="_blank" rel="noopener noreferrer" className={styles.profileLinkItem}>
                      {link.label || link.name || new URL(link.url || link).hostname}
                    </a>
                  ))}
                </div>
              </div>
            )}

            <div className={styles.cardActions}>
              <a href={profile.profileUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.actionPrimary}`}>🌐 NG Profile</a>
              {ccUser?.profileUrl && <a href={ccUser.profileUrl} target="_blank" rel="noopener noreferrer" className={`${styles.actionButton} ${styles.actionSecondary}`}>🕰️ Forum Profile</a>}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ── Clock Profile Card (for Clocks tab) ──────────────────────────
function ClockCard({ profile, style, onClick }) {
  const [imgError, setImgError] = useState(false);
  const fanCount = profile.fans?.count ?? 0;
  const avatarSrc = profile.ccAvatarUrl || profile.avatarUrl;
  const showAvatar = avatarSrc && !imgError;
  return (
    <div
      className={styles.itemCard}
      onClick={onClick}
      style={style}
      title={`${profile.username} — Lvl ${profile.level ?? "?"}`}
    >
      <div className={styles.clockAvatarWrap}>
        {showAvatar ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={avatarSrc}
            alt={profile.username}
            className={styles.clockAvatarImg}
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className={styles.clockAvatarFallbackInitial}>
            {(profile.username || "?")[0].toUpperCase()}
          </div>
        )}
        {profile.level != null && (
          <span className={styles.clockLevelBadge}>Lvl {profile.level}</span>
        )}
      </div>
      <div className={styles.itemInfo}>
        <span className={styles.itemTitle}>{profile.username}</span>
        <div className={styles.itemMeta}>
          <span className={styles.itemAuthor}>{profile.location || profile.joinDate || ""}</span>
          {fanCount > 0 && (
            <span className={styles.clockFanCount}>
              <span className={styles.scoreStar}>♥</span>
              {formatNumber(fanCount)}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// ═════════════════════════════════════════════════════════════════
//  NewgroundsPortalComponent
// ═════════════════════════════════════════════════════════════════

const PAGE_SIZE = 40;

// Tab definitions — "clocks" uses a separate endpoint
const TABS = [
  { key: "all",    label: "All" },
  { key: "movie",  label: "🎬 Movies" },
  { key: "game",   label: "🎮 Games" },
  { key: "audio",  label: "🎵 Audio" },
  { key: "clocks", label: "🕰️ Clocks" },
];

export default function NewgroundsPortalComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [year, setYear] = useState("");
  const [availableYears, setAvailableYears] = useState({ contentYears: [], profileYears: [] });
  const [counts, setCounts] = useState({ movies: 0, games: 0, audio: 0, clocks: 0 });
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedProfile, setSelectedProfile] = useState(null);
  const debounceRef = useRef(null);
  const sentinelRef = useRef(null);
  const skipRef = useRef(0);
  const fetchingRef = useRef(false);

  // ── Build title bar summary ────────────────────────────────────
  const titleSummary = (() => {
    if (type === "clocks") {
      return counts.clocks > 0 ? `${counts.clocks.toLocaleString()} clocks` : "";
    }
    const parts = [];
    if (counts.movies > 0) parts.push(`${counts.movies.toLocaleString()} movies`);
    if (counts.games > 0) parts.push(`${counts.games.toLocaleString()} games`);
    if (counts.audio > 0) parts.push(`${counts.audio.toLocaleString()} audio`);
    return parts.join(" · ");
  })();

  // ── Fetch available years for dropdown ─────────────────────────
  useEffect(() => {
    let cancelled = false;
    fetch("/api/newgrounds/portal/years")
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => { if (!cancelled) setAvailableYears(data); })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  // ── Fetch portal data ──────────────────────────────────────────
  const fetchPortal = useCallback(async (q = "", t = "all", append = false, yr = "") => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    const skip = append ? skipRef.current : 0;
    if (!append) {
      setLoading(true);
      setHasMore(true);
      skipRef.current = 0;
    } else {
      setLoadingMore(true);
    }

    try {
      const isClocks = t === "clocks";
      const params = new URLSearchParams({
        sort: isClocks ? "fans" : "score",
        limit: String(PAGE_SIZE),
        skip: String(skip),
      });
      if (q) {
        params.set("q", q);
        if (!isClocks) params.set("username", q);
      }
      if (!isClocks) params.set("type", t);
      if (yr) params.set("year", yr);

      const endpoint = isClocks ? "/api/newgrounds/portal/clocks" : "/api/newgrounds/portal";
      const res = await fetch(`${endpoint}?${params}`);

      if (res.ok) {
        const data = await res.json();

        if (isClocks) {
          const profiles = data.profiles || [];
          if (append) {
            setItems((prev) => [...prev, ...profiles]);
          } else {
            setItems(profiles);
            setCounts((prev) => ({ ...prev, clocks: data.totalClocks || 0 }));
          }
          skipRef.current = skip + profiles.length;
          if (profiles.length < PAGE_SIZE || skipRef.current >= (data.totalClocks || 0)) {
            setHasMore(false);
          }
        } else {
          const newItems = data.items || [];
          if (append) {
            setItems((prev) => [...prev, ...newItems]);
          } else {
            setItems(newItems);
            setCounts({
              movies: data.totalMovies || 0,
              games: data.totalGames || 0,
              audio: data.totalAudio || 0,
              clocks: counts.clocks,
            });
          }
          skipRef.current = skip + newItems.length;
          const totalFiltered = (data.totalMovies || 0) + (data.totalGames || 0) + (data.totalAudio || 0);
          if (newItems.length < PAGE_SIZE || skipRef.current >= totalFiltered) {
            setHasMore(false);
          }
        }
      }
    } catch (err) {
      console.error("[NewgroundsPortal] Fetch error:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Initial load ───────────────────────────────────────────────
  useEffect(() => {
    fetchPortal("", "all", false, "");
  }, [fetchPortal]);

  // ── IntersectionObserver for infinite scroll ───────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting && hasMore && !loading && !loadingMore) {
          fetchPortal(query, type, true, year);
        }
      },
      { rootMargin: "200px" },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasMore, loading, loadingMore, query, type, year, fetchPortal]);

  // ── Debounced search ───────────────────────────────────────────
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPortal(val, type, false, year);
    }, 350);
  }, [fetchPortal, type, year]);

  // ── Type tab switch ────────────────────────────────────────────
  const handleTypeChange = useCallback((newType) => {
    setType(newType);
    // Reset year when switching between content and clocks tabs
    // since they use different year pools
    setYear("");
    fetchPortal(query, newType, false, "");
  }, [fetchPortal, query]);

  // ── Year filter change ────────────────────────────────────────
  const handleYearChange = useCallback((e) => {
    const newYear = e.target.value;
    setYear(newYear);
    fetchPortal(query, type, false, newYear);
  }, [fetchPortal, query, type]);

  // ── Card click → content detail modal ──────────────────────────
  const handleItemClick = useCallback((item) => {
    setSelectedItem(item);
  }, []);

  // ── Clock card click → open profile modal ──────────────────────
  const handleClockClick = useCallback((profile) => {
    setSelectedProfile(profile.usernameLower || profile.username?.toLowerCase());
  }, []);

  const isClocks = type === "clocks";

  return (
    <>
      <div className={styles.container} id="newgrounds-portal">
        {/* ── Title Bar ─────────────────────────────────────── */}
        <div className={styles.titleBar}>
          <div className={styles.trafficLights}>
            <span className={styles.trafficDot} />
            <span className={styles.trafficDot} />
            <span className={styles.trafficDot} />
          </div>
          <span className={styles.titleBarCenter}>
            <span className={styles.titleText}>{isClocks ? "Clock Crew" : "Flash Portal"}</span>
          </span>
          <span className={styles.titleCount}>
            {titleSummary}
          </span>
        </div>

        {/* ── Content ───────────────────────────────────────── */}
        <div className={styles.contentArea}>
          {/* ── Search + Filters ──────────────────────────────── */}
          <div className={styles.searchBar}>
            <div className={styles.searchInputWrap}>
              <SearchIcon />
              <input
                className={styles.searchInput}
                type="text"
                placeholder={isClocks ? "Search clocks by name…" : "Search movies, games, audio, or usernames…"}
                value={query}
                onChange={handleSearchChange}
                id="portal-search-input"
              />
            </div>
            <div className={styles.filterRow}>
              <div className={styles.typeTabs}>
                {TABS.map(({ key, label }) => (
                  <button
                    key={key}
                    className={`${styles.typeTab} ${type === key ? styles.typeTabActive : ""}`}
                    onClick={() => handleTypeChange(key)}
                  >
                    {label}
                  </button>
                ))}
              </div>
              <div className={styles.yearFilter}>
                <select
                  className={styles.yearSelect}
                  value={year}
                  onChange={handleYearChange}
                  id="portal-year-filter"
                >
                  <option value="">All Years</option>
                  {(isClocks ? availableYears.profileYears : availableYears.contentYears).map((y) => (
                    <option key={y} value={y}>{y}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* ── Item Grid ─────────────────────────────────────── */}
          <div className={styles.itemGrid}>
            {loading && (
              <div className={styles.loading} style={{ gridColumn: "1 / -1" }}>
                <div className={styles.loadingDots}>
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                </div>
                <span>Loading {isClocks ? "clocks" : "portal"}…</span>
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className={styles.emptyState} style={{ gridColumn: "1 / -1" }}>
                <span className={styles.emptyIcon}>🔍</span>
                <span className={styles.emptyText}>
                  {query ? `No results for "${query}"` : isClocks ? "No clocks found" : "No submissions found"}
                </span>
              </div>
            )}

            {!isClocks && items.map((item, i) => {
              const meta = getTypeMeta(item.contentType);
              return (
                <div
                  key={`${item.contentId || item._id}-${i}`}
                  className={styles.itemCard}
                  onClick={() => handleItemClick(item)}
                  style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                  title={`${item.title} by ${item.usernameLower}`}
                >
                  <div className={styles.itemThumbWrap}>
                    {item.thumbnailUrl && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title}
                        className={styles.itemThumb}
                        loading="lazy"
                        onError={(e) => { e.target.style.display = "none"; }}
                      />
                    )}
                    <span className={`${styles.typeBadge} ${styles[meta.badgeClass]}`}>
                      {meta.emoji}
                    </span>
                  </div>
                  <div className={styles.itemInfo}>
                    <span className={styles.itemTitle}>{item.title}</span>
                    <div className={styles.itemMeta}>
                      <span className={styles.itemAuthor}>{item.usernameLower}</span>
                      <ScoreDisplay score={item.score} />
                    </div>
                  </div>
                </div>
              );
            })}

            {isClocks && items.map((profile, i) => (
              <ClockCard
                key={`${profile.usernameLower || profile._id}-${i}`}
                profile={profile}
                style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                onClick={() => handleClockClick(profile)}
              />
            ))}

            {/* ── Infinite scroll sentinel ─────────────────────── */}
            <div ref={sentinelRef} className={styles.sentinel} />

            {loadingMore && (
              <div className={styles.loadingMore}>
                <div className={styles.loadingDots}>
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                  <span className={styles.loadingDot} />
                </div>
              </div>
            )}

            {!loading && !hasMore && items.length > 0 && (
              <div className={styles.endOfList}>
                All {items.length.toLocaleString()} {isClocks ? "clocks" : "submissions"} loaded
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Content Detail Modal ─────────────────────────── */}
      {selectedItem && (
        <ContentDetailModal
          item={selectedItem}
          onClose={() => setSelectedItem(null)}
        />
      )}

      {/* ── Profile Detail Modal (Clocks tab) ────────────── */}
      {selectedProfile && (
        <ProfileDetailModal
          username={selectedProfile}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </>
  );
}
