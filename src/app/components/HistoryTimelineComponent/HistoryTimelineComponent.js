"use client";

import { useRef, useEffect, useState } from "react";
import styles from "./HistoryTimelineComponent.module.css";
import {
  INFO_BOX, TABLE_OF_CONTENTS, REFERENCES, NOTABLE_WORKS,
  NOTABLE_MEMBERS, RIVAL_CREWS, TIMELINE_EVENTS, ERA_COLORS,
  SEE_ALSO,
} from "./historyData";

/* ── Helpers ──────────────────────────────────────────────────── */

function Cite({ ids }) {
  return ids.map((id) => (
    <a key={id} className={styles.cite} href={`#ref-${id}`} title={`Reference ${id}`}>
      [{id}]
    </a>
  ));
}

function ExtLink({ href, children }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer">
      {children}
    </a>
  );
}

/* ── Component ────────────────────────────────────────────────── */

export default function HistoryTimelineComponent() {
  const timelineRef = useRef(null);
  const [visibleItems, setVisibleItems] = useState(new Set());

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleItems((prev) => {
              const next = new Set(prev);
              next.add(entry.target.dataset.index);
              return next;
            });
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" },
    );
    const items = timelineRef.current?.querySelectorAll("[data-index]");
    items?.forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  return (
    <article className={styles.article}>
      {/* ── Header ────────────────────────────────────────────── */}
      <header className={styles.header}>
        <h1 className={styles.title}>History of the Clock Crew</h1>
        <p className={styles.subtitle}>
          The <strong>Clock Crew</strong> is a Flash animation collective originating from{" "}
          <ExtLink href="https://www.newgrounds.com">Newgrounds.com</ExtLink> in 2001.
          Founded in the wake of <ExtLink href="https://strawberryclock.newgrounds.com">StrawberryClock</ExtLink>&apos;s
          infamous submission{" "}
          <ExtLink href="https://www.newgrounds.com/portal/view/11521">&quot;B&quot;</ExtLink>,
          it became the platform&apos;s first organized creative crew and one of the most
          enduring communities in internet animation history.<Cite ids={[1, 3]} />
        </p>
      </header>

      {/* ── Info Box ──────────────────────────────────────────── */}
      <div className={styles.clearfix}>
        <aside className={styles.infoBox}>
          <div className={styles.infoBoxHeader}>{INFO_BOX.title}</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img className={styles.infoBoxImage} src={INFO_BOX.imageUrl} alt={INFO_BOX.imageAlt} loading="lazy" />
          <div className={styles.infoBoxCaption}>{INFO_BOX.caption}</div>
          <table className={styles.infoBoxTable}>
            <tbody>
              {INFO_BOX.rows.map((row) => (
                <tr key={row.label}>
                  <td className={styles.infoBoxLabel}>{row.label}</td>
                  <td className={styles.infoBoxValue} dangerouslySetInnerHTML={{ __html: row.value }} />
                </tr>
              ))}
            </tbody>
          </table>
        </aside>

        {/* ── Table of Contents ──────────────────────────────── */}
        <nav className={styles.toc}>
          <div className={styles.tocHeading}>📑 Contents</div>
          <ol className={styles.tocList}>
            {TABLE_OF_CONTENTS.map((item) => (
              <li key={item.id} className={styles.tocItem}>
                <a className={styles.tocLink} href={`#${item.id}`}>{item.label}</a>
              </li>
            ))}
          </ol>
        </nav>

        {/* ── Origins ────────────────────────────────────────── */}
        <h2 id="origins" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Origins</h2>
        <p className={styles.paragraph}>
          <ExtLink href="https://www.newgrounds.com">Newgrounds</ExtLink> was founded by{" "}
          <ExtLink href="https://tomfulp.newgrounds.com">Tom Fulp</ExtLink> in 1995 as a personal
          website for sharing creative work. By 2000, Fulp had launched an automated{" "}
          <strong>Flash Portal</strong> that allowed users to upload their own{" "}
          <ExtLink href="https://en.wikipedia.org/wiki/Adobe_Flash">Macromedia Flash</ExtLink>{" "}
          animations and games — effectively creating a &quot;YouTube before YouTube&quot; for
          interactive content.<Cite ids={[7, 11]} /> The portal featured a democratic{" "}
          <strong>judgment system</strong> where community members voted on new submissions;
          those that scored below a threshold were &quot;blammed&quot; (deleted), while survivors
          remained permanently on the site.
        </p>
        <p className={styles.paragraph}>
          Into this ecosystem arrived a user known as <strong>Coolboyman</strong>, who began
          flooding the Flash Portal with intentionally provocative, low-quality animations —
          submissions with titles like &quot;Donald Duck Porno&quot; and &quot;Dickey Mouse&quot; —
          designed to antagonize the community. All were promptly blammed. Undeterred, Coolboyman
          created a new account: <strong>StrawberryClock</strong>.<Cite ids={[3, 5]} />
        </p>

        {/* ── The Movie "B" ──────────────────────────────────── */}
        <h2 id="the-movie-b" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>The Movie &quot;B&quot;</h2>

        <div className={`${styles.figure} ${styles.figureRight}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.figureImage}
            src="/images/b-movie-screenshot.png"
            alt="Screenshot of B on the Newgrounds portal"
            loading="lazy"
          />
          <div className={styles.figureCaption}>
            &quot;B&quot; as it appears on the{" "}
            <ExtLink href="https://www.newgrounds.com/portal/view/11521">Newgrounds portal</ExtLink>.
            The submission consisted of a single frame.
          </div>
        </div>

        <p className={styles.paragraph}>
          On <strong>August 15, 2001</strong>, StrawberryClock submitted a Flash movie titled simply{" "}
          <ExtLink href="https://www.newgrounds.com/portal/view/11521">&quot;B&quot;</ExtLink>.
          The submission consisted of a single static frame displaying a red letter &quot;B&quot;
          alongside a picture of a strawberry — deliberately minimal, with no animation whatsoever.
          Previous submissions under the StrawberryClock name (including one titled &quot;A&quot;)
          had been swiftly blammed by the community.<Cite ids={[2, 5]} />
        </p>
        <p className={styles.paragraph}>
          Against all expectations, <strong>&quot;B&quot; survived judgment</strong>. While it received
          predictably low scores, it passed the deletion threshold and was awarded{" "}
          <strong>Turd of the Week</strong> — a Newgrounds accolade for the lowest-scoring submission
          to survive. StrawberryClock promptly declared himself the{" "}
          <strong>&quot;King of the Portal&quot;</strong>.<Cite ids={[2, 3, 5]} />
        </p>
        <div className={styles.blockquote}>
          The survival of &quot;B&quot; was a watershed moment. It proved that even the most minimal,
          deliberately absurd content could pass through the democratic judgment system — and in
          doing so, it challenged every assumption the Newgrounds community held about quality
          standards.
          <div className={styles.blockquoteAttribution}>— Clock Crew Wiki<Cite ids={[4]} /></div>
        </div>
        <p className={styles.paragraph}>
          The date of &quot;B&quot;&apos;s submission — August 15 — would later be enshrined as{" "}
          <strong>Clock Day</strong>, one of the most enduring annual traditions in Newgrounds
          history.<Cite ids={[6]} />
        </p>

        {/* ── Formation ──────────────────────────────────────── */}
        <h2 id="formation" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Formation of the Crew</h2>
        <p className={styles.paragraph}>
          The unexpected survival of &quot;B&quot; attracted immediate attention. Users began creating
          accounts with &quot;Clock&quot; appended to food items and objects:{" "}
          <strong>OrangeClock</strong>, <strong>PineappleClock</strong>,{" "}
          <strong>RaspberryClock</strong>, and <strong>AppleClock</strong> were among the first.
          While StrawberryClock served as the movement&apos;s catalyst, it was{" "}
          <strong>OrangeClock</strong> who organized the group into a formal collective — designing
          the first crew logo, establishing aesthetic conventions, and defining what it meant to be
          a &quot;Clock&quot; character.<Cite ids={[3, 4, 5]} />
        </p>
        <p className={styles.paragraph}>
          In <strong>2002</strong>, the community launched <strong>ClockCrew.net</strong>, an{" "}
          <ExtLink href="https://en.wikipedia.org/wiki/Simple_Machines_Forum">SMF</ExtLink>-based
          forum that became the crew&apos;s primary gathering point outside Newgrounds. At its peak,
          the forum hosted hundreds of active members and accumulated over{" "}
          <strong>700,000 posts</strong> across dozens of boards — serving as the organizational
          hub for collaborations, WIPs, lore-building, and the distinctive community culture.<Cite ids={[14]} />
        </p>

        {/* ── Style & Identity ───────────────────────────────── */}
        <h2 id="identity" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Style &amp; Identity</h2>
        <p className={styles.paragraph}>
          The Clock Crew developed a distinctive visual and auditory language that set them apart
          from other Newgrounds creators:
        </p>
        <p className={styles.paragraph}>
          <strong>Clock-face characters:</strong> Members created avatars consisting of everyday objects
          (typically fruits and vegetables) with an analog clock serving as the face. These characters
          often had simple stick-figure limbs or moved as if by an unseen force — a style born from
          limited animation skills that became an intentional aesthetic choice.<Cite ids={[3, 5]} />
        </p>
        <p className={styles.paragraph}>
          <strong>Speakonia &amp; text-to-speech:</strong>{" "}
          <ExtLink href="https://en.wikipedia.org/wiki/Speakonia">Speakonia</ExtLink> was a
          relatively obscure text-to-speech program that the Clock Crew adopted as their signature
          voice engine. Its robotic, monotonous delivery became inseparable from the crew&apos;s
          identity. Some members also used AT&amp;T Natural Voices for higher-fidelity TTS dialogue.
          The use of synthesized speech was both a practical workaround (most members were teenagers
          without recording equipment) and a deliberate stylistic choice that enhanced the absurdist
          tone.<Cite ids={[3, 5]} />
        </p>
        <p className={styles.paragraph}>
          <strong>Clocktopia:</strong> In the crew&apos;s shared lore, the Clock characters inhabited
          a fictional realm called <strong>Clocktopia</strong>, with StrawberryClock depicted as its
          bumbling, self-proclaimed king. This world-building provided narrative scaffolding for
          collaborative movies and serial content.<Cite ids={[4, 5]} />
        </p>
        <p className={styles.paragraph}>
          <strong>Absurdism and anti-humor:</strong> While early submissions were intentionally
          low-quality provocations, the crew&apos;s humor evolved into a distinctive brand of
          absurdist comedy — non-sequiturs, meta-references, and deliberately jarring tonal shifts
          became hallmarks of the Clock aesthetic.
        </p>

        {/* ── Golden Age ─────────────────────────────────────── */}
        <h2 id="golden-age" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>The Golden Age (2002–2005)</h2>
        <p className={styles.paragraph}>
          Between 2002 and 2005, the Clock Crew entered its most productive and culturally
          significant period. Members produced increasingly ambitious Flash animations, pioneering
          the <strong>collab movie</strong> format — large-scale compilation films featuring dozens
          of individual segments contributed by different members. These collabs became a defining
          feature of the group and influenced how collaborative content was organized on Newgrounds
          for years to come.<Cite ids={[1, 3]} />
        </p>
        <p className={styles.paragraph}>
          The <strong>CCTV (Clock Crew Television)</strong> series represented the peak of this
          collaborative ambition. <strong>CCTV2</strong> (2007), while slightly after the golden age
          core, featured contributions from over <strong>50 animators</strong> and was one of the
          largest collaborative projects in Newgrounds history at the time.<Cite ids={[1]} />
        </p>
        <p className={styles.paragraph}>
          Forum culture at ClockCrew.net thrived during this period, characterized by in-jokes,
          drama, art threads, and a uniquely chaotic creative energy. Many members were teenagers
          finding their voice through Flash animation — the low barrier to entry (clock-face
          characters were simple to draw, Speakonia eliminated the need for voice actors) meant
          that nearly anyone could participate and learn.
        </p>

        {/* ── Clock Day ──────────────────────────────────────── */}
        <h2 id="clock-day" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Clock Day</h2>

        <div className={`${styles.figure} ${styles.figureRight}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className={styles.figureImage}
            src="/images/clock-day-celebration.png"
            alt="Clock Day celebration"
            loading="lazy"
          />
          <div className={styles.figureCaption}>
            Every August 15, Clock Crew members celebrate Clock Day — the anniversary of &quot;B&quot; — with{" "}
            collaborative animations on the{" "}
            <ExtLink href="https://www.newgrounds.com">Newgrounds portal</ExtLink>.
          </div>
        </div>

        <p className={styles.paragraph}>
          <strong>Clock Day</strong> is celebrated annually on <strong>August 15</strong> to
          commemorate the submission of &quot;B&quot;. First observed in <strong>2002</strong>,
          it quickly became one of Newgrounds&apos; most distinctive annual events.<Cite ids={[6]} />
        </p>
        <p className={styles.paragraph}>
          On Clock Day, members historically flooded the portal with Clock-themed submissions,
          creating a &quot;goodwill&quot; atmosphere where many users voted favorably to help
          submissions pass judgment. While early celebrations were characterized by mass-submission
          tactics, the event gradually evolved into a genuine creative tradition featuring
          increasingly elaborate collaborative projects.<Cite ids={[6]} />
        </p>
        <p className={styles.paragraph}>
          Newgrounds began formally supporting Clock Day in <strong>2005</strong>, advertising it
          in advance, creating site-wide banners, and hosting official competitions. The holiday
          continues to be observed to this day — <strong>Clock Day 2024</strong> marked the 23rd
          anniversary, and <strong>Clock Day 2025</strong> marked the 24th, with fresh collaborations
          like the annual &quot;Clocks of the BBS&quot; series.<Cite ids={[1, 6]} />
        </p>

        {/* ── Rivalries ──────────────────────────────────────── */}
        <h2 id="rivalries" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Rivalries &amp; Offshoots</h2>
        <p className={styles.paragraph}>
          The Clock Crew&apos;s success spawned an entire &quot;crew culture&quot; on Newgrounds,
          with numerous groups forming to emulate, parody, or antagonize the original
          collective.<Cite ids={[3, 5]} />
        </p>

        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Crew</th>
              <th>Year</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {RIVAL_CREWS.map((crew) => (
              <tr key={crew.name}>
                <td>
                  {crew.url
                    ? <ExtLink href={crew.url}>{crew.name}</ExtLink>
                    : crew.name}
                </td>
                <td>{crew.year}</td>
                <td>{crew.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={styles.paragraph}>
          The <ExtLink href="https://locklegion.com">Lock Legion</ExtLink>, founded in{" "}
          <strong>2003</strong> by a user named StrawberryLock, was the most significant rival.
          Lock characters used padlock-themed avatars and celebrated their own{" "}
          <strong>Lock Day on May 26</strong>. The Clock-Lock rivalry fueled creative output on
          both sides, though many members participated in both communities. The dynamic was as
          much a creative catalyst as a genuine antagonism.<Cite ids={[5, 8]} />
        </p>
        <p className={styles.paragraph}>
          Other offshoots followed naming patterns inspired by the originals — gun-themed groups
          like the <strong>Glock Group</strong>, <strong>Uzi Union</strong>, and{" "}
          <strong>Luger League</strong> proliferated, alongside broader crews like the{" "}
          <strong>Star Syndicate</strong> and <strong>Soup Squad</strong>.<Cite ids={[3]} />
        </p>

        {/* ── Notable Works ──────────────────────────────────── */}
        <h2 id="notable-works" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Notable Works</h2>

        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Title</th>
              <th>Year</th>
              <th>Author(s)</th>
              <th>Description</th>
            </tr>
          </thead>
          <tbody>
            {NOTABLE_WORKS.map((work) => (
              <tr key={work.title}>
                <td><ExtLink href={work.url}>{work.title}</ExtLink></td>
                <td>{work.year}</td>
                <td>{work.author}</td>
                <td>{work.description}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* ── Notable Members ────────────────────────────────── */}
        <h2 id="notable-members" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Notable Members</h2>
        <p className={styles.paragraph}>
          Many Clock Crew members leveraged their community involvement into professional careers
          in animation, game design, streaming, and broader internet culture.<Cite ids={[3]} />
        </p>

        <table className={styles.dataTable}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Also known as</th>
              <th>Role / Career</th>
              <th>Notes</th>
            </tr>
          </thead>
          <tbody>
            {NOTABLE_MEMBERS.map((m) => (
              <tr key={m.name}>
                <td>
                  {m.url
                    ? <ExtLink href={m.url}>{m.name}</ExtLink>
                    : m.name}
                </td>
                <td>{m.aka || "—"}</td>
                <td>{m.role}</td>
                <td>{m.note}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <p className={styles.paragraph}>
          Perhaps most remarkably, the pseudonymous Twitter personality{" "}
          <ExtLink href="https://twitter.com/dril">@dril</ExtLink> — one of the most influential
          accounts in internet culture — was a Clock Crew member under the name{" "}
          <strong>DrunkMagiKoopa</strong>. Similarly,{" "}
          <ExtLink href="https://www.youtube.com/user/vinesauce">Vinny from Vinesauce</ExtLink>,
          a widely popular gaming streamer, was a Clock under the name{" "}
          <strong>ZidaneX</strong>.<Cite ids={[15, 16]} />
        </p>

        {/* ── Evolution ──────────────────────────────────────── */}
        <h2 id="evolution" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Evolution &amp; Diaspora</h2>
        <p className={styles.paragraph}>
          As the founding generation matured through the late 2000s, the explosive growth period
          gave way to a more measured pace. Many members — now in their twenties — pursued
          professional careers in animation, game development, and web design, skills directly
          honed through years of Flash experimentation within the crew.<Cite ids={[3]} />
        </p>
        <p className={styles.paragraph}>
          The rise of <strong>YouTube</strong> (2005), the proliferation of <strong>mobile
          browsers</strong> that didn&apos;t support Flash, and the broader shift toward{" "}
          <strong>HTML5</strong> gradually eroded Flash&apos;s dominance as the web&apos;s
          interactive medium. Newgrounds adapted, but the era of Flash animation collectives
          as a cultural force began to fade.
        </p>
        <p className={styles.paragraph}>
          In <strong>2017</strong>, ClockCrew.net transitioned to a{" "}
          <strong>read-only archive</strong>, preserving its hundreds of thousands of posts as a
          digital time capsule. Active discussion migrated to Discord servers and social media,
          though the archive remains a treasure trove of early internet creative
          culture.<Cite ids={[14]} />
        </p>

        {/* ── Flash Preservation ─────────────────────────────── */}
        <h2 id="preservation" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Flash Preservation</h2>
        <p className={styles.paragraph}>
          On <strong>December 31, 2020</strong>, Adobe officially ended support for Flash Player,
          threatening to render the entire corpus of Clock Crew animations — and all Flash content
          across the web — inaccessible in modern browsers.<Cite ids={[10, 11]} />
        </p>
        <p className={styles.paragraph}>
          Newgrounds, under Tom Fulp&apos;s leadership, became the primary champion of Flash
          preservation. The platform adopted{" "}
          <ExtLink href="https://ruffle.rs">Ruffle</ExtLink>, an open-source Flash Player
          emulator written in <ExtLink href="https://www.rust-lang.org/">Rust</ExtLink> and
          compiled to <strong>WebAssembly</strong>. Originally created by Mike Welsh in 2016
          (initially called &quot;Fluster&quot;), Ruffle enables Flash SWF files to run natively
          in modern browsers without the original plugin.<Cite ids={[9, 10]} />
        </p>
        <p className={styles.paragraph}>
          Newgrounds began sponsoring Ruffle&apos;s development in <strong>2019</strong> and
          established a <strong>Flash Preservation Crew</strong> to test and report compatibility
          issues. Other platforms including the <strong>Internet Archive</strong>,{" "}
          <strong>Armor Games</strong>, and <strong>Coolmath Games</strong> followed suit. Thanks
          to these efforts, the vast library of Clock Crew animations remains playable for future
          generations.<Cite ids={[10]} />
        </p>

        {/* ── Cultural Impact ────────────────────────────────── */}
        <h2 id="cultural-impact" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Cultural Impact</h2>
        <p className={styles.paragraph}>
          The Clock Crew&apos;s influence extends well beyond Newgrounds. Elements from the
          community have appeared in commercial media: <strong>The Behemoth</strong>&apos;s{" "}
          <ExtLink href="https://www.thebehemoth.com/castlecrashers">Castle Crashers</ExtLink>
          {" "}(whose developers had roots in Newgrounds),{" "}
          <strong>Adult Swim</strong>&apos;s <em>Mr. Pickles</em>, and{" "}
          <strong>Warner Bros.</strong>&apos; <em>Dying Light</em> all contain Clock Crew
          references or elements created by former members.<Cite ids={[3, 12]} />
        </p>
        <p className={styles.paragraph}>
          More broadly, the Clock Crew pioneered several concepts that became standard in online
          creative communities: the organized <strong>crew/collective model</strong>, the{" "}
          <strong>collaborative compilation format</strong>, the use of{" "}
          <strong>text-to-speech as artistic tool</strong>, and the idea of{" "}
          <strong>community-specific holidays</strong> that platforms formally recognize. Their
          approach to collaborative content creation predated modern creator collectives by over
          a decade.
        </p>
        <p className={styles.paragraph}>
          The group&apos;s trajectory — from deliberate provocation through collaborative
          creativity to professional development — serves as one of the earliest documented
          examples of an internet community functioning as an informal apprenticeship system for
          creative careers.<Cite ids={[3]} />
        </p>
      </div>

      {/* ── Timeline Section ─────────────────────────────────── */}
      <h2 id="timeline" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>Timeline</h2>
      <div className={styles.legend}>
        {[
          { key: "origins", label: "Origins" },
          { key: "golden", label: "Golden Age" },
          { key: "middle", label: "Evolution" },
          { key: "modern", label: "Modern Era" },
        ].map((era) => (
          <span key={era.key} className={styles.legendItem}>
            <span className={styles.legendDot} style={{ background: ERA_COLORS[era.key] }} />
            {era.label}
          </span>
        ))}
      </div>

      <div className={styles.timeline} ref={timelineRef}>
        <div className={styles.rail} aria-hidden="true" />
        {TIMELINE_EVENTS.map((event, i) => {
          const isVisible = visibleItems.has(String(i));
          const side = i % 2 === 0 ? "Left" : "Right";
          return (
            <div
              key={i}
              className={`${styles.item} ${styles[`item${side}`]} ${isVisible ? styles.itemVisible : ""}`}
              data-index={i}
            >
              <div
                className={styles.node}
                style={{
                  borderColor: ERA_COLORS[event.era],
                  boxShadow: isVisible ? `0 0 12px ${ERA_COLORS[event.era]}40` : "none",
                }}
              >
                <div className={styles.nodeInner} style={{ background: ERA_COLORS[event.era] }} />
              </div>
              <div className={styles.card}>
                <span className={styles.cardYear} style={{ color: ERA_COLORS[event.era] }}>
                  {event.year}
                </span>
                <h3 className={styles.cardTitle}>{event.title}</h3>
                <p className={styles.cardContent}>{event.content}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── See Also ─────────────────────────────────────────── */}
      <h2 id="see-also" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>See Also</h2>
      <ul className={styles.seeAlsoList}>
        {SEE_ALSO.map((item) => (
          <li key={item.label} className={styles.seeAlsoItem}>
            <ExtLink href={item.url}>{item.label}</ExtLink>
          </li>
        ))}
      </ul>

      {/* ── References ───────────────────────────────────────── */}
      <h2 id="references" className={`${styles.sectionHeading} ${styles.sectionAnchor}`}>References</h2>
      <div className={styles.references}>
        <ol className={styles.refList}>
          {REFERENCES.map((ref) => (
            <li key={ref.id} id={`ref-${ref.id}`} className={styles.refItem}>
              {ref.text}.{" "}
              <ExtLink href={ref.url}>{ref.url}</ExtLink>
            </li>
          ))}
        </ol>
      </div>
    </article>
  );
}
