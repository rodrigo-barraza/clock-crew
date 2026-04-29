// ── Clock Crew Member Profile Page ───────────────────────────
// Server Component with dynamic metadata, canonical URLs,
// JSON-LD structured data, and dynamic OG images for each
// member profile.
// ──────────────────────────────────────────────────────────────

import MemberProfileComponent from "../../../components/MemberProfileComponent/MemberProfileComponent";

const SITE_URL = "https://clocktopia.com";
const CLOCK_CREW_SERVICE_URL =
  process.env.CLOCK_CREW_SERVICE_URL || "http://localhost:5593";

// ── Fetch member data at request time for metadata ───────────
async function fetchMember(username) {
  try {
    const res = await fetch(
      `${CLOCK_CREW_SERVICE_URL}/clockcrew/users/${encodeURIComponent(username)}`,
      { next: { revalidate: 3600 } },
    );
    if (res.ok) return res.json();
  } catch {
    // Silently fall back to basic metadata
  }
  return null;
}

export async function generateMetadata({ params }) {
  const { username } = await params;
  const decodedName = decodeURIComponent(username);
  const member = await fetchMember(decodedName);

  const title = `${decodedName} — Clock Crew Member`;
  const description = member?.card?.bio
    ? `${decodedName}: ${member.card.bio.slice(0, 150).trim()}…`
    : `Profile page for ${decodedName}, a member of the Clock Crew — the legendary Newgrounds Flash animation collective.`;

  const avatarUrl = member?.card?.avatar || member?.avatarUrl || null;
  const ogImages = avatarUrl
    ? [{ url: avatarUrl, width: 300, height: 300, alt: `${decodedName} avatar` }]
    : [{ url: `${SITE_URL}/og-image.png`, width: 1200, height: 630, alt: "The Clock Crew" }];

  return {
    title,
    description,
    alternates: {
      canonical: `/clocks/${encodeURIComponent(decodedName)}`,
    },
    openGraph: {
      type: "profile",
      title,
      description,
      url: `${SITE_URL}/clocks/${encodeURIComponent(decodedName)}`,
      images: ogImages,
    },
    twitter: {
      card: avatarUrl ? "summary" : "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MemberProfilePage({ params }) {
  const { username } = await params;
  const decodedName = decodeURIComponent(username);
  const member = await fetchMember(decodedName);

  // ── JSON-LD Person structured data ──────────────────────────
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Person",
    name: decodedName,
    url: `${SITE_URL}/clocks/${encodeURIComponent(decodedName)}`,
    memberOf: {
      "@type": "Organization",
      name: "The Clock Crew",
      url: SITE_URL,
    },
    ...(member?.card?.avatar && { image: member.card.avatar }),
    ...(member?.card?.bio && { description: member.card.bio.slice(0, 200) }),
    ...(member?.dateRegistered && {
      knowsAbout: ["Flash Animation", "Newgrounds"],
    }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <MemberProfileComponent username={decodedName} />
    </>
  );
}
