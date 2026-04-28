"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import styles from "./MemberProfileComponent.module.css";

// ── Helpers ──────────────────────────────────────────────────────
function formatNumber(n) {
  if (n == null) return "—";
  return typeof n === "number" ? n.toLocaleString() : n;
}

function formatDate(dateStr) {
  if (!dateStr) return "—";
  const d = new Date(dateStr);
  if (isNaN(d)) return dateStr;
  return d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
}

function stripHtml(html) {
  if (!html) return "";
  return html.replace(/<[^>]*>/g, "").trim();
}

// ── Tab definitions ──────────────────────────────────────────────
const TABS = [
  { key: "overview", label: "Overview", icon: "📋" },
  { key: "movies", label: "Movies", icon: "🎬" },
  { key: "games", label: "Games", icon: "🎮" },
  { key: "audio", label: "Audio", icon: "🎵" },
  { key: "art", label: "Art", icon: "🎨" },
  { key: "posts", label: "Posts", icon: "💬" },
  { key: "reviews", label: "Reviews", icon: "📝" },
];

// ── Sub-components ───────────────────────────────────────────────

function StatCard({ label, value, icon }) {
  return (
    <div className={styles.statCard}>
      {icon && <span className={styles.statIcon}>{icon}</span>}
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  );
}

function ContentCard({ item, type }) {
  const emoji = type === "movie" ? "🎬" : type === "game" ? "🎮" : type === "audio" ? "🎵" : "🎨";
  return (
    <a
      href={item.url}
      target="_blank"
      rel="noopener noreferrer"
      className={styles.contentCard}
    >
      {item.thumbnailUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.thumbnailUrl}
          alt={item.title}
          className={styles.contentThumb}
          loading="lazy"
          onError={(e) => { e.target.style.display = "none"; }}
        />
      )}
      <div className={styles.contentInfo}>
        <span className={styles.contentTitle}>{item.title}</span>
        <div className={styles.contentMeta}>
          <span className={styles.contentType}>{emoji}</span>
          {item.score != null && (
            <span className={styles.contentScore}>★ {(Math.round(item.score * 10) / 10).toFixed(1)}</span>
          )}
          {item.views != null && (
            <span className={styles.contentViews}>{formatNumber(item.views)} views</span>
          )}
          {item.publishedDate && (
            <span className={styles.contentDate}>{formatDate(item.publishedDate)}</span>
          )}
        </div>
        {item.description && (
          <p className={styles.contentDesc}>
            {item.description.length > 120 ? item.description.slice(0, 120) + "…" : item.description}
          </p>
        )}
      </div>
    </a>
  );
}

function PostItem({ post, showThread = true }) {
  const body = stripHtml(post.body || post.content || "");
  return (
    <div className={styles.postItem}>
      <div className={styles.postHeader}>
        {showThread && post.threadTitle && (
          <span className={styles.postThread}>{post.threadTitle}</span>
        )}
        {post.date && (
          <time className={styles.postDate}>{formatDate(post.date)}</time>
        )}
      </div>
      {body && (
        <p className={styles.postBody}>
          {body.length > 300 ? body.slice(0, 300) + "…" : body}
        </p>
      )}
    </div>
  );
}

function ReviewItem({ review }) {
  const body = stripHtml(review.body || review.text || "");
  return (
    <div className={styles.reviewItem}>
      <div className={styles.reviewHeader}>
        <span className={styles.reviewTarget}>{review.contentTitle || review.contentUrl || "Unknown"}</span>
        {review.score != null && (
          <span className={styles.reviewScore}>{review.score}/10</span>
        )}
      </div>
      {body && (
        <p className={styles.reviewBody}>
          {body.length > 250 ? body.slice(0, 250) + "…" : body}
        </p>
      )}
    </div>
  );
}

function ContentSection({ items, type, emptyLabel }) {
  if (!items?.length) {
    return (
      <div className={styles.emptyTab}>
        <span className={styles.emptyTabIcon}>📭</span>
        <span>No {emptyLabel} found</span>
      </div>
    );
  }
  return (
    <div className={styles.contentGrid}>
      {items.map((item, i) => (
        <ContentCard key={item.contentId || item._id || i} item={item} type={type} />
      ))}
    </div>
  );
}

// ── Overview Tab ─────────────────────────────────────────────────

function OverviewTab({ data }) {
  const { member, movies, games, audio, fans, ccPosts, ccThreads } = data;
  const ng = member.newgrounds;
  const cc = member.ccForum;
  const summary = member.profileSummary;

  // Top 3 of each content type for highlights
  const topMovies = movies?.slice(0, 3) || [];
  const topGames = games?.slice(0, 3) || [];
  const topAudio = audio?.slice(0, 3) || [];

  return (
    <div className={styles.overviewGrid}>
      {/* ── AI Profile Summary ─────────────────────────────────── */}
      {summary?.markdown && summary.status === "complete" && (
        <section className={styles.summaryPanel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🤖</span>
            AI-Generated Profile
            <span className={styles.summaryMeta}>
              {summary.model && <span className={styles.summaryModel}>{summary.model}</span>}
            </span>
          </h2>
          <div className={styles.summaryContent}>
            <MarkdownRenderer markdown={summary.markdown} />
          </div>
        </section>
      )}

      {/* ── Newgrounds Stats ───────────────────────────────────── */}
      {ng && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🟠</span>
            Newgrounds Stats
          </h2>
          <div className={styles.miniStatsGrid}>
            <StatCard label="Fans" value={formatNumber(ng.fans)} icon="♥" />
            <StatCard label="Level" value={ng.level ?? "—"} icon="⬆" />
            <StatCard label="Blams" value={formatNumber(ng.blams)} icon="💣" />
            <StatCard label="Saves" value={formatNumber(ng.saves)} icon="🛡" />
            <StatCard label="Medals" value={formatNumber(ng.medals)} icon="🏅" />
            <StatCard label="Trophies" value={formatNumber(ng.trophies)} icon="🏆" />
            {ng.expPoints && <StatCard label="EXP" value={ng.expPoints} icon="✨" />}
            {ng.votePower && <StatCard label="Vote Power" value={ng.votePower} icon="⚡" />}
          </div>
          {ng.description && (
            <p className={styles.ngBio}>{ng.description}</p>
          )}
          <div className={styles.personalInfo}>
            {ng.joinDate && <span className={styles.infoItem}>📅 Joined {ng.joinDate}</span>}
            {ng.location && <span className={styles.infoItem}>📍 {ng.location}</span>}
            {ng.job && <span className={styles.infoItem}>💼 {ng.job}</span>}
            {ng.age != null && <span className={styles.infoItem}>🎂 Age {ng.age}</span>}
            {ng.sex && <span className={styles.infoItem}>👤 {ng.sex}</span>}
            {ng.realName && <span className={styles.infoItem}>🪪 {ng.realName}</span>}
            {ng.school && <span className={styles.infoItem}>🎓 {ng.school}</span>}
            {ng.rank && <span className={styles.infoItem}>🎖 {ng.rank}</span>}
            {ng.globalRank != null && <span className={styles.infoItem}>🌍 Rank #{formatNumber(ng.globalRank)}</span>}
          </div>
        </section>
      )}

      {/* ── CC Forum ───────────────────────────────────────────── */}
      {cc && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🕰️</span>
            ClockCrew.net Forum
          </h2>
          <div className={styles.ccIdentity}>
            {cc.avatarUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={cc.avatarUrl} alt={cc.username} className={styles.ccAvatar} />
            )}
            <div>
              <span className={styles.ccName}>{cc.username}</span>
              {cc.customTitle && <span className={styles.ccTitle}>&ldquo;{cc.customTitle}&rdquo;</span>}
              {cc.position && <span className={styles.ccBadge}>{cc.position}</span>}
            </div>
          </div>
          <div className={styles.miniStatsGrid}>
            <StatCard label="Posts" value={formatNumber(cc.postCount)} icon="💬" />
            <StatCard label="Registered" value={formatDate(cc.dateRegistered)} icon="📅" />
            {cc.location && <StatCard label="Location" value={cc.location} icon="📍" />}
            {cc.gender && <StatCard label="Gender" value={cc.gender} icon="👤" />}
          </div>
          {cc.signatureHtml && (
            <div className={styles.signatureWrap}>
              <span className={styles.signatureLabel}>Signature</span>
              <div className={styles.signatureContent} dangerouslySetInnerHTML={{ __html: cc.signatureHtml }} />
            </div>
          )}
        </section>
      )}

      {/* ── Content Counts ─────────────────────────────────────── */}
      {ng && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📊</span>
            Content Overview
          </h2>
          <div className={styles.contentPills}>
            {ng.movieCount > 0 && <span className={styles.pill}>🎬 {ng.movieCount} Movies</span>}
            {ng.gameCount > 0 && <span className={styles.pill}>🎮 {ng.gameCount} Games</span>}
            {ng.audioCount > 0 && <span className={styles.pill}>🎵 {ng.audioCount} Audio</span>}
            {ng.reviewCount > 0 && <span className={styles.pill}>📝 {ng.reviewCount} Reviews</span>}
            {ng.postCount > 0 && <span className={styles.pill}>💬 {ng.postCount} Posts</span>}
            {ng.faveCount > 0 && <span className={styles.pill}>❤️ {ng.faveCount} Faves</span>}
            {ng.newsCount > 0 && <span className={styles.pill}>📰 {ng.newsCount} News</span>}
          </div>
        </section>
      )}

      {/* ── Top Movies ─────────────────────────────────────────── */}
      {topMovies.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🎬</span>
            Top Movies
          </h2>
          <div className={styles.topContentList}>
            {topMovies.map((m, i) => (
              <ContentCard key={m.contentId || i} item={m} type="movie" />
            ))}
          </div>
        </section>
      )}

      {/* ── Top Games ──────────────────────────────────────────── */}
      {topGames.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🎮</span>
            Top Games
          </h2>
          <div className={styles.topContentList}>
            {topGames.map((g, i) => (
              <ContentCard key={g.contentId || i} item={g} type="game" />
            ))}
          </div>
        </section>
      )}

      {/* ── Top Audio ──────────────────────────────────────────── */}
      {topAudio.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🎵</span>
            Top Audio
          </h2>
          <div className={styles.topContentList}>
            {topAudio.map((a, i) => (
              <ContentCard key={a.contentId || i} item={a} type="audio" />
            ))}
          </div>
        </section>
      )}

      {/* ── Fans ───────────────────────────────────────────────── */}
      {fans?.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>♥</span>
            Fans
            <span className={styles.panelCount}>{fans.length}</span>
          </h2>
          <div className={styles.fansList}>
            {fans.slice(0, 50).map((fan, i) => (
              <span key={i} className={styles.fanTag}>{fan}</span>
            ))}
            {fans.length > 50 && <span className={styles.fanMore}>+{fans.length - 50} more</span>}
          </div>
        </section>
      )}

      {/* ── CC Threads Started ─────────────────────────────────── */}
      {ccThreads?.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>📌</span>
            Forum Threads Started
            <span className={styles.panelCount}>{ccThreads.length}</span>
          </h2>
          <ul className={styles.threadList}>
            {ccThreads.slice(0, 20).map((t, i) => (
              <li key={t.topicId || i} className={styles.threadItem}>
                <span className={styles.threadTitle}>{t.title}</span>
                <span className={styles.threadMeta}>
                  {t.totalPosts != null && <span>{t.totalPosts} replies</span>}
                  {t.date && <span>{formatDate(t.date)}</span>}
                  {t.boardName && <span className={styles.threadBoard}>{t.boardName}</span>}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ── Recent CC Posts ─────────────────────────────────────── */}
      {ccPosts?.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>💬</span>
            Recent Forum Posts
            <span className={styles.panelCount}>{ccPosts.length}</span>
          </h2>
          <div className={styles.postsList}>
            {ccPosts.slice(0, 10).map((p, i) => (
              <PostItem key={p.messageId || i} post={p} />
            ))}
          </div>
        </section>
      )}

      {/* ── External Links ─────────────────────────────────────── */}
      {ng?.links?.length > 0 && (
        <section className={styles.panel}>
          <h2 className={styles.sectionTitle}>
            <span className={styles.sectionIcon}>🔗</span>
            Links
          </h2>
          <div className={styles.linksList}>
            {ng.links.map((link, i) => (
              <a
                key={i}
                href={link.url || link}
                target="_blank"
                rel="noopener noreferrer"
                className={styles.linkItem}
              >
                {link.label || link.name || (() => { try { return new URL(link.url || link).hostname; } catch { return "Link"; } })()}
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

// ── Simple markdown renderer ─────────────────────────────────────
function MarkdownRenderer({ markdown }) {
  if (!markdown) return null;

  const lines = markdown.split("\n");
  const elements = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (line.startsWith("# ")) {
      elements.push(<h1 key={i} className={styles.mdH1}>{line.slice(2)}</h1>);
    } else if (line.startsWith("## ")) {
      elements.push(<h2 key={i} className={styles.mdH2}>{line.slice(3)}</h2>);
    } else if (line.startsWith("### ")) {
      elements.push(<h3 key={i} className={styles.mdH3}>{line.slice(4)}</h3>);
    } else if (line.startsWith("> ")) {
      elements.push(<blockquote key={i} className={styles.mdBlockquote}>{line.slice(2)}</blockquote>);
    } else if (line.startsWith("- ") || line.startsWith("* ")) {
      const listItems = [];
      let j = i;
      while (j < lines.length && (lines[j].startsWith("- ") || lines[j].startsWith("* ") || lines[j].startsWith("  "))) {
        listItems.push(lines[j].replace(/^[-*]\s/, "").replace(/^\s+/, ""));
        j++;
      }
      elements.push(
        <ul key={i} className={styles.mdList}>
          {listItems.map((item, idx) => <li key={idx}>{item}</li>)}
        </ul>
      );
      i = j;
      continue;
    } else if (line.trim() === "") {
      // skip
    } else {
      elements.push(<p key={i} className={styles.mdParagraph}>{line}</p>);
    }
    i++;
  }

  return <div className={styles.mdWrap}>{elements}</div>;
}

// ═════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════

export default function MemberProfileComponent({ username }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("overview");

  const fetchMember = useCallback(async (name) => {
    try {
      const res = await fetch(`/api/clockcrew/users/${encodeURIComponent(name)}`);
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || `Failed (${res.status})`);
      }
      return { data: await res.json(), error: null };
    } catch (err) {
      return { data: null, error: err.message };
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    fetchMember(username).then(({ data: d, error: e }) => {
      if (cancelled) return;
      setData(d);
      setError(e);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [username, fetchMember]);

  // ── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className={styles.profileWrap}>
        <div className={styles.skeleton}>
          <div className={styles.skeletonAvatar} />
          <div className={styles.skeletonLines}>
            <div className={styles.skeletonLine} style={{ width: "40%" }} />
            <div className={styles.skeletonLine} style={{ width: "60%" }} />
            <div className={styles.skeletonLine} style={{ width: "30%" }} />
          </div>
        </div>
      </div>
    );
  }

  // ── Error ──────────────────────────────────────────────────────
  if (error || !data?.member) {
    return (
      <div className={styles.profileWrap}>
        <div className={styles.errorCard}>
          <span className={styles.errorIcon}>⚠️</span>
          <p className={styles.errorText}>{error || "Member not found"}</p>
          <Link href="/clocks" className={styles.backLink}>← Back to Members</Link>
        </div>
      </div>
    );
  }

  const { member, movies, games, audio, art, reviews } = data;
  const ng = member.newgrounds;
  const cc = member.ccForum;

  const initials = (member.username || "?").replace(/clock$/i, "").slice(0, 2).toUpperCase();
  const avatarUrl = cc?.avatarUrl || ng?.avatarUrl || member.avatarUrl;

  // Build visible tabs based on available data
  const visibleTabs = TABS.filter(tab => {
    if (tab.key === "overview") return true;
    if (tab.key === "movies") return movies?.length > 0;
    if (tab.key === "games") return games?.length > 0;
    if (tab.key === "audio") return audio?.length > 0;
    if (tab.key === "art") return art?.length > 0;
    if (tab.key === "posts") return data.ccPosts?.length > 0 || data.ngPosts?.length > 0;
    if (tab.key === "reviews") return reviews?.length > 0;
    return false;
  });

  return (
    <div className={styles.profileWrap}>
      {/* ── Header ────────────────────────────────────────────── */}
      <header className={styles.header}>
        <div className={styles.headerBg} aria-hidden="true" />
        <div className={styles.identity}>
          <div className={styles.avatarLarge}>
            {avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={avatarUrl} alt={`${member.username} avatar`} className={styles.avatarImg} />
            ) : (
              <span className={styles.avatarFallback}>{initials}</span>
            )}
          </div>
          <div className={styles.identityInfo}>
            <h1 className={styles.username}>{member.username}</h1>
            <div className={styles.badges}>
              {cc?.customTitle && <span className={styles.customTitle}>{cc.customTitle}</span>}
              {cc?.group && <span className={styles.groupBadge}>{cc.group}</span>}
              {cc?.position && <span className={styles.posBadge}>{cc.position}</span>}
              {ng?.rank && <span className={styles.ngRankBadge}>{ng.rank}</span>}
              {ng?.level != null && <span className={styles.levelBadge}>Lvl {ng.level}</span>}
              {ng?.supporter && <span className={styles.supporterBadge}>⭐ Supporter</span>}
            </div>
            <div className={styles.headerActions}>
              {ng?.profileUrl && (
                <a href={ng.profileUrl} target="_blank" rel="noopener noreferrer" className={styles.headerBtn}>🌐 Newgrounds</a>
              )}
              {cc?.profileUrl && (
                <a href={cc.profileUrl} target="_blank" rel="noopener noreferrer" className={styles.headerBtn}>🕰️ Forum</a>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* ── Quick Stats Bar ───────────────────────────────────── */}
      <section className={styles.quickStats}>
        {cc?.postCount > 0 && <StatCard label="Forum Posts" value={formatNumber(cc.postCount)} icon="💬" />}
        {ng?.fans > 0 && <StatCard label="NG Fans" value={formatNumber(ng.fans)} icon="♥" />}
        {movies?.length > 0 && <StatCard label="Movies" value={movies.length} icon="🎬" />}
        {games?.length > 0 && <StatCard label="Games" value={games.length} icon="🎮" />}
        {audio?.length > 0 && <StatCard label="Audio" value={audio.length} icon="🎵" />}
        {art?.length > 0 && <StatCard label="Art" value={art.length} icon="🎨" />}
        {reviews?.length > 0 && <StatCard label="Reviews" value={reviews.length} icon="📝" />}
      </section>

      {/* ── Tabs ──────────────────────────────────────────────── */}
      {visibleTabs.length > 1 && (
        <nav className={styles.tabBar}>
          {visibleTabs.map(tab => (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ""}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              {tab.label}
              {tab.key === "movies" && movies?.length > 0 && <span className={styles.tabCount}>{movies.length}</span>}
              {tab.key === "games" && games?.length > 0 && <span className={styles.tabCount}>{games.length}</span>}
              {tab.key === "audio" && audio?.length > 0 && <span className={styles.tabCount}>{audio.length}</span>}
              {tab.key === "art" && art?.length > 0 && <span className={styles.tabCount}>{art.length}</span>}
              {tab.key === "reviews" && reviews?.length > 0 && <span className={styles.tabCount}>{reviews.length}</span>}
            </button>
          ))}
        </nav>
      )}

      {/* ── Tab Content ───────────────────────────────────────── */}
      <div className={styles.tabContent}>
        {activeTab === "overview" && <OverviewTab data={data} />}
        {activeTab === "movies" && <ContentSection items={movies} type="movie" emptyLabel="movies" />}
        {activeTab === "games" && <ContentSection items={games} type="game" emptyLabel="games" />}
        {activeTab === "audio" && <ContentSection items={audio} type="audio" emptyLabel="audio" />}
        {activeTab === "art" && <ContentSection items={art} type="art" emptyLabel="art" />}
        {activeTab === "posts" && (
          <div className={styles.postsTab}>
            {data.ccPosts?.length > 0 && (
              <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🕰️</span>
                  ClockCrew Forum Posts
                  <span className={styles.panelCount}>{data.ccPosts.length}</span>
                </h2>
                <div className={styles.postsList}>
                  {data.ccPosts.map((p, i) => <PostItem key={p.messageId || i} post={p} />)}
                </div>
              </section>
            )}
            {data.ngPosts?.length > 0 && (
              <section className={styles.panel}>
                <h2 className={styles.sectionTitle}>
                  <span className={styles.sectionIcon}>🟠</span>
                  Newgrounds BBS Posts
                  <span className={styles.panelCount}>{data.ngPosts.length}</span>
                </h2>
                <div className={styles.postsList}>
                  {data.ngPosts.map((p, i) => <PostItem key={p.postId || i} post={p} showThread={false} />)}
                </div>
              </section>
            )}
          </div>
        )}
        {activeTab === "reviews" && (
          <div className={styles.reviewsList}>
            {reviews?.map((r, i) => <ReviewItem key={r.reviewId || i} review={r} />)}
          </div>
        )}
      </div>
    </div>
  );
}
