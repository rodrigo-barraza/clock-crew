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

// ── Search icon SVG ──────────────────────────────────────────────
function SearchIcon() {
  return (
    <svg className={styles.searchIcon} viewBox="0 0 16 16" fill="currentColor">
      <path d="M11.742 10.344a6.5 6.5 0 1 0-1.397 1.398h-.001l3.85 3.85a1 1 0 0 0 1.415-1.414l-3.85-3.85zm-5.44.706a5 5 0 1 1 0-10 5 5 0 0 1 0 10z" />
    </svg>
  );
}

// ── Content Detail Modal ─────────────────────────────────────────
// Shows the clicked movie/game at the top, then loads creator profile below.
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
  const isGame = item?.contentType === "game";

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <button className={styles.modalClose} onClick={onClose} title="Close">✕</button>

        {/* ══ CONTENT HERO — the clicked movie/game ══════════ */}
        <div className={styles.contentHero}>
          {item?.thumbnailUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.thumbnailUrl} alt={item.title} className={styles.contentHeroThumb} />
          )}
          <div className={styles.contentHeroInfo}>
            <span className={`${styles.typeBadge} ${isGame ? styles.typeBadgeGame : styles.typeBadgeMovie}`}
              style={{ position: "static" }}>
              {isGame ? "🎮 Game" : "🎬 Movie"}
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
              className={`${styles.actionButton} ${styles.actionPrimary}`}
              style={{ marginTop: 12, alignSelf: "flex-start" }}
            >
              {isGame ? "🎮 Play on Newgrounds" : "▶ Watch on Newgrounds"}
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
            {/* ── Avatar + Header inline ──────────────────────── */}
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
              </div>
            )}

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

// ═════════════════════════════════════════════════════════════════
//  NewgroundsPortalComponent
// ═════════════════════════════════════════════════════════════════

export default function NewgroundsPortalComponent() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [type, setType] = useState("all");
  const [totalMovies, setTotalMovies] = useState(0);
  const [totalGames, setTotalGames] = useState(0);
  const [selectedItem, setSelectedItem] = useState(null);
  const debounceRef = useRef(null);

  // ── Fetch portal data ──────────────────────────────────────────
  const fetchPortal = useCallback(async (q = "", t = "all") => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ type: t, sort: "score", limit: "80" });
      if (q) {
        params.set("q", q);
        // Also set username for exact-match fallback
        params.set("username", q);
      }
      const res = await fetch(`/api/newgrounds/portal?${params}`);
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setTotalMovies(data.totalMovies || 0);
        setTotalGames(data.totalGames || 0);
      }
    } catch (err) {
      console.error("[NewgroundsPortal] Fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial load ───────────────────────────────────────────────
  useEffect(() => {
    fetchPortal("", "all");
  }, [fetchPortal]);

  // ── Debounced search ───────────────────────────────────────────
  const handleSearchChange = useCallback((e) => {
    const val = e.target.value;
    setQuery(val);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      fetchPortal(val, type);
    }, 350);
  }, [fetchPortal, type]);

  // ── Type tab switch ────────────────────────────────────────────
  const handleTypeChange = useCallback((newType) => {
    setType(newType);
    fetchPortal(query, newType);
  }, [fetchPortal, query]);

  // ── Card click → content detail modal ──────────────────────────
  const handleItemClick = useCallback((item) => {
    setSelectedItem(item);
  }, []);

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
            <span className={styles.titleText}>Flash Portal</span>
          </span>
          <span className={styles.titleCount}>
            {totalMovies + totalGames > 0
              ? `${totalMovies.toLocaleString()} movies · ${totalGames.toLocaleString()} games`
              : ""}
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
                placeholder="Search movies, games, or usernames…"
                value={query}
                onChange={handleSearchChange}
                id="portal-search-input"
              />
            </div>
            <div className={styles.typeTabs}>
              {[
                { key: "all", label: "All" },
                { key: "movie", label: "🎬 Movies" },
                { key: "game", label: "🎮 Games" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  className={`${styles.typeTab} ${type === key ? styles.typeTabActive : ""}`}
                  onClick={() => handleTypeChange(key)}
                >
                  {label}
                </button>
              ))}
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
                <span>Loading portal…</span>
              </div>
            )}

            {!loading && items.length === 0 && (
              <div className={styles.emptyState} style={{ gridColumn: "1 / -1" }}>
                <span className={styles.emptyIcon}>🔍</span>
                <span className={styles.emptyText}>
                  {query ? `No results for "${query}"` : "No submissions found"}
                </span>
              </div>
            )}

            {!loading && items.map((item, i) => (
              <div
                key={item.contentId || item._id}
                className={styles.itemCard}
                onClick={() => handleItemClick(item)}
                style={{ animationDelay: `${Math.min(i * 30, 600)}ms` }}
                title={`${item.title} by ${item.usernameLower}`}
              >
                <div className={styles.itemThumbWrap}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={item.thumbnailUrl || ""}
                    alt={item.title}
                    className={styles.itemThumb}
                    loading="lazy"
                    onError={(e) => { e.target.style.display = "none"; }}
                  />
                  <span className={`${styles.typeBadge} ${
                    item.contentType === "game" ? styles.typeBadgeGame : styles.typeBadgeMovie
                  }`}>
                    {item.contentType === "game" ? "🎮" : "🎬"}
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
            ))}
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
    </>
  );
}
