'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'

// ============================================================================
// EXPERIENCE PAGE — Dungeon-themed subpage
// Background: ZB6YSk.gif (looping animated dungeon ambience)
// Character:  wizard.gif (8-frame idle wizard, placed on the page)
// Linked from the "Experience" button in the main nav bar.
// ============================================================================

// Basic Web Audio click sound — keeps the page standalone (no shared hook).
function playClick() {
  try {
    const AC = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext
    const ctx = new AC()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'square'
    osc.frequency.setValueAtTime(220, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(110, ctx.currentTime + 0.08)
    gain.gain.setValueAtTime(0.08, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1)
    osc.connect(gain).connect(ctx.destination)
    osc.start()
    osc.stop(ctx.currentTime + 0.1)
    setTimeout(() => ctx.close(), 200)
  } catch {}
}

// Wizard idle speech lines — sarcastic fourth-wall-breaking dungeon flavour.
const WIZARD_LINES = [
  "Ah, a visitor. The King sends his regards... and his taxes.",
  "I conjured this scroll of Experience myself. The King took credit, naturally.",
  "Experience points? I have 9,999. The King has 12. Don't tell him I said so.",
  "These are Arjun's quests. Real ones. Not the King's 'spirit sword' nonsense.",
  "I once tried to teach the King a fireball spell. He burned his own crown.",
  "Read carefully, traveler. Each line is a year of Arjun's life. Almost.",
  "The Goddess thinks she runs this dungeon. I let her. Wizards prefer the back row.",
  "Scroll down. The good quests are at the bottom. Like all dungeons.",
]

// Experience entries — Arjun's actual roles/education.
const EXPERIENCE_ENTRIES = [
  {
    role: 'Website Management & Marketing Head',
    org: 'AIOrders × Foodswipe',
    period: '2024 — Present',
    location: 'Remote',
    summary:
      'Wearing two hats at AIOrders and Foodswipe — owning website management (site updates, performance tuning, content drops) while also heading marketing across both brands: campaigns, positioning, and growth experiments tied to each product launch.',
    tags: ['Website Management', 'Marketing Head', 'Growth', 'Cross-brand'],
    rarity: 'legendary',
  },
  {
    role: 'B.Tech CSE — 4th Year',
    org: 'VIT Bhopal University',
    period: '2022 — 2026',
    location: 'Bhopal, India',
    summary:
      'Pursuing Computer Science & Engineering with a focus on full-stack web development, AI agents, and applied machine learning. Building production-grade side projects across the curriculum — from JWT auth systems to in-browser data analysis agents.',
    tags: ['CSE', 'AI/ML', 'Full-Stack', 'Systems'],
    rarity: 'epic',
  },
  {
    role: 'Independent Builder & Content Creator',
    org: 'Self-employed',
    period: '2023 — Present',
    location: 'Bhopal, India',
    summary:
      'Shipping open-source projects on GitHub (12 featured in this very dungeon), creating UGC content, and editing video. Vocalist and flutist on the side — the dungeon acoustics are excellent, the King disagrees.',
    tags: ['Open Source', 'UGC', 'Video Editing', 'Music'],
    rarity: 'rare',
  },
]

const RARITY_STYLE: Record<string, { border: string; glow: string; label: string; text: string }> = {
  common: { border: 'rgba(160,160,170,0.45)', glow: 'rgba(160,160,170,0.25)', label: 'COMMON', text: '#c8c8d0' },
  rare: { border: 'rgba(96,165,250,0.6)', glow: 'rgba(96,165,250,0.35)', label: 'RARE', text: '#93c5fd' },
  epic: { border: 'rgba(168,85,247,0.6)', glow: 'rgba(168,85,247,0.4)', label: 'EPIC', text: '#d8b4fe' },
  legendary: { border: 'rgba(250,204,21,0.7)', glow: 'rgba(250,204,21,0.5)', label: 'LEGENDARY', text: '#fde68a' },
}

export default function ExperiencePage() {
  const [wizardLine, setWizardLine] = useState(WIZARD_LINES[0])
  const [showWizardBubble, setShowWizardBubble] = useState(false)

  // Pick a random wizard line whenever the user clicks the wizard.
  const talkWizard = () => {
    playClick()
    const next = WIZARD_LINES[Math.floor(Math.random() * WIZARD_LINES.length)]
    setWizardLine(next)
    setShowWizardBubble(true)
    window.setTimeout(() => setShowWizardBubble(false), 4200)
  }

  // Pick a fresh line on mount.
  useEffect(() => {
    setWizardLine(WIZARD_LINES[Math.floor(Math.random() * WIZARD_LINES.length)])
  }, [])

  return (
    <main
      style={{
        position: 'relative',
        minHeight: '100vh',
        width: '100%',
        overflowX: 'hidden',
        background: '#0a0a0f',
        color: '#e9e1f2',
        fontFamily: 'var(--font-inter), system-ui, sans-serif',
      }}
    >
      {/* ===== Animated background GIF ===== */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 0,
          backgroundImage: 'url(/experience/dungeon-bg.gif)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
          opacity: 0.55,
          filter: 'saturate(0.85) brightness(0.7)',
        }}
      />
      {/* Dark vignette overlay so the bg sits behind content without fighting it */}
      <div
        aria-hidden
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 1,
          background:
            'radial-gradient(ellipse at center, rgba(10,10,15,0.4) 0%, rgba(10,10,15,0.85) 70%, rgba(5,5,8,0.97) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ===== Top bar: back link + section label ===== */}
      <header
        style={{
          position: 'relative',
          zIndex: 5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '22px 28px',
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <Link
          href="/"
          onClick={playClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '9px 16px',
            fontSize: '13px',
            fontWeight: 600,
            letterSpacing: '0.3px',
            color: '#fde68a',
            textDecoration: 'none',
            background: 'linear-gradient(135deg, rgba(250,204,21,0.14), rgba(250,204,21,0.04))',
            border: '1px solid rgba(250,204,21,0.35)',
            borderRadius: '999px',
            boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.15), 0 2px 12px rgba(250,204,21,0.18)',
            backdropFilter: 'blur(6px)',
            transition: 'transform 0.2s ease, background 0.3s ease',
            cursor: 'pointer',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.transform = 'translateY(-1px)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(250,204,21,0.24), rgba(250,204,21,0.08))'
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.transform = 'translateY(0)'
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(250,204,21,0.14), rgba(250,204,21,0.04))'
          }}
        >
          <span style={{ fontSize: '16px' }}>&larr;</span> Back to Dungeon
        </Link>

        <div
          style={{
            fontSize: '11px',
            fontWeight: 700,
            letterSpacing: '3px',
            textTransform: 'uppercase',
            color: 'rgba(250,204,21,0.7)',
            textShadow: '0 0 12px rgba(250,204,21,0.3)',
          }}
        >
          Chamber of Experience
        </div>
      </header>

      {/* ===== Hero: title + wizard character ===== */}
      <section
        style={{
          position: 'relative',
          zIndex: 4,
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '40px 28px 60px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) auto',
          gap: '32px',
          alignItems: 'center',
        }}
      >
        {/* Title block */}
        <div>
          <h1
            style={{
              fontFamily: 'var(--font-bebas), var(--font-anton), system-ui, sans-serif',
              fontSize: 'clamp(56px, 9vw, 112px)',
              lineHeight: 0.92,
              margin: 0,
              letterSpacing: '2px',
              color: '#fde68a',
              textShadow:
                '0 0 28px rgba(250,204,21,0.45), 0 0 60px rgba(168,85,247,0.25), 0 4px 0 rgba(0,0,0,0.6)',
            }}
          >
            EXPERIENCE
          </h1>
          <p
            style={{
              marginTop: '14px',
              maxWidth: '560px',
              fontSize: '16px',
              lineHeight: 1.65,
              color: 'rgba(233,225,242,0.78)',
              fontFamily: 'var(--font-inter), sans-serif',
            }}
          >
            The wizard has guarded these scrolls for centuries. Click him to hear his idle mutterings —
            he has opinions about everything, especially the King. Below, a chronicle of Arjun&apos;s
            real-world quests: paid work, formal study, and the indie grind in between.
          </p>
        </div>

        {/* Wizard character — clickable, speech bubble on click.
            alignItems: flex-end keeps the wizard + label flush-right within
            the grid cell so the wizard aligns with the section's right edge. */}
        <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
          {/* Speech bubble — to the LEFT of the wizard, anchored at ~35% from top
              so the tail points toward the wizard's face/upper body (a portrait
              sprite's head sits in the upper third, not dead center). */}
          {showWizardBubble && (
            <div
              style={{
                position: 'absolute',
                right: 'calc(100% + 14px)',
                top: '35%',
                transform: 'translateY(-50%)',
                maxWidth: '300px',
                width: 'max-content',
                padding: '12px 14px',
                background: 'rgba(15,12,25,0.96)',
                border: '1px solid rgba(168,85,247,0.55)',
                borderRadius: '12px',
                boxShadow: '0 8px 30px rgba(0,0,0,0.6), 0 0 18px rgba(168,85,247,0.25)',
                fontFamily: 'var(--font-vt323), monospace',
                fontSize: '17px',
                lineHeight: 1.35,
                color: '#e9d5ff',
                textAlign: 'left',
                zIndex: 6,
                animation: 'wizardBubbleIn 0.25s ease',
              }}
            >
              {wizardLine}
              {/* tail — on the RIGHT side of bubble, aligned with the bubble's
                  vertical anchor (35% from top), pointing toward the wizard */}
              <div
                style={{
                  position: 'absolute',
                  top: '50%',
                  right: '-8px',
                  transform: 'translateY(-50%) rotate(45deg)',
                  width: '14px',
                  height: '14px',
                  background: 'rgba(15,12,25,0.96)',
                  borderTop: '1px solid rgba(168,85,247,0.55)',
                  borderRight: '1px solid rgba(168,85,247,0.55)',
                }}
              />
            </div>
          )}

          <button
            onClick={talkWizard}
            aria-label="Talk to the wizard"
            style={{
              background: 'none',
              border: 'none',
              padding: 0,
              cursor: 'pointer',
              display: 'block',
              filter: 'drop-shadow(0 0 18px rgba(168,85,247,0.45)) drop-shadow(0 8px 12px rgba(0,0,0,0.7))',
              transition: 'transform 0.2s ease, filter 0.3s ease',
              animation: 'wizardFloat 3.6s ease-in-out infinite',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = 'scale(1.06)'
              e.currentTarget.style.filter = 'drop-shadow(0 0 28px rgba(168,85,247,0.7)) drop-shadow(0 8px 12px rgba(0,0,0,0.7))'
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = 'scale(1)'
              e.currentTarget.style.filter = 'drop-shadow(0 0 18px rgba(168,85,247,0.45)) drop-shadow(0 8px 12px rgba(0,0,0,0.7))'
            }}
          >
            {/* Wizard.gif — cropped to sprite (61x108 native), rendered at 200px.
                The original 250x250 GIF had ~75% transparent padding around a
                57x104 sprite. Cropped in scripts/crop_wizard.py so scaling
                now enlarges the actual wizard, not empty pixels. */}
            <img
              src="/experience/wizard.gif"
              alt="Idle dungeon wizard"
              width={200}
              height={354}
              style={{ display: 'block', imageRendering: 'pixelated' }}
              draggable={false}
            />
          </button>
          <div
            style={{
              marginTop: '8px',
              fontSize: '11px',
              letterSpacing: '2px',
              textTransform: 'uppercase',
              color: 'rgba(168,85,247,0.7)',
              fontFamily: 'var(--font-vt323), monospace',
              textAlign: 'right',
            }}
          >
            click to talk
          </div>
        </div>
      </section>

      {/* ===== Experience entries — dungeon loot-card style ===== */}
      <section
        style={{
          position: 'relative',
          zIndex: 4,
          maxWidth: '920px',
          margin: '0 auto',
          padding: '20px 28px 100px',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}
      >
        {EXPERIENCE_ENTRIES.map((entry, i) => {
          const r = RARITY_STYLE[entry.rarity]
          return (
            <article
              key={i}
              style={{
                position: 'relative',
                padding: '24px 26px',
                background: 'rgba(15,12,25,0.78)',
                border: `1px solid ${r.border}`,
                borderRadius: '14px',
                boxShadow: `0 0 24px ${r.glow}, inset 0 1px 1px rgba(255,255,255,0.05), 0 10px 30px rgba(0,0,0,0.5)`,
                backdropFilter: 'blur(8px)',
                overflow: 'hidden',
              }}
            >
              {/* Rarity label tag */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  right: '16px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '2px',
                  padding: '3px 9px',
                  borderRadius: '999px',
                  color: r.text,
                  background: `${r.glow}`,
                  border: `1px solid ${r.border}`,
                  textTransform: 'uppercase',
                }}
              >
                {r.label}
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 14px', alignItems: 'baseline', marginBottom: '4px' }}>
                <h2
                  style={{
                    margin: 0,
                    fontFamily: 'var(--font-bebas), var(--font-anton), sans-serif',
                    fontSize: '28px',
                    letterSpacing: '1px',
                    color: '#fde68a',
                    textShadow: '0 0 12px rgba(250,204,21,0.3)',
                  }}
                >
                  {entry.role}
                </h2>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: '4px 14px',
                  fontSize: '13px',
                  color: 'rgba(233,225,242,0.7)',
                  fontFamily: 'var(--font-vt323), monospace',
                  letterSpacing: '0.5px',
                  marginBottom: '12px',
                }}
              >
                <span style={{ color: r.text }}>{entry.org}</span>
                <span>•</span>
                <span>{entry.period}</span>
                <span>•</span>
                <span>{entry.location}</span>
              </div>

              <p
                style={{
                  margin: '0 0 14px',
                  fontSize: '14.5px',
                  lineHeight: 1.65,
                  color: 'rgba(233,225,242,0.85)',
                  fontFamily: 'var(--font-inter), sans-serif',
                }}
              >
                {entry.summary}
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {entry.tags.map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      letterSpacing: '0.4px',
                      padding: '3px 9px',
                      borderRadius: '6px',
                      color: 'rgba(233,225,242,0.85)',
                      background: 'rgba(255,255,255,0.06)',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            </article>
          )
        })}

        {/* Footer note */}
        <p
          style={{
            marginTop: '20px',
            textAlign: 'center',
            fontSize: '13px',
            color: 'rgba(233,225,242,0.45)',
            fontFamily: 'var(--font-vt323), monospace',
            letterSpacing: '1px',
          }}
        >
          More quests unlock as Arjun levels up. Check back at the next full moon.
        </p>
      </section>

      {/* Local keyframes — scoped to this page via a <style> tag */}
      <style>{`
        @keyframes wizardFloat {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-8px); }
        }
        @keyframes wizardBubbleIn {
          from { opacity: 0; transform: translateY(-50%) translateX(8px); }
          to   { opacity: 1; transform: translateY(-50%) translateX(0); }
        }
      `}</style>
    </main>
  )
}
