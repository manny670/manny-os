import React from 'react';

export default function OrbitPlanet({ size = 'hero', className = '' }) {
  const isHero = size === 'hero';

  return (
    <div
      className={`orbit-planet-container ${className}`}
      style={{
        position: 'relative',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: isHero ? '100%' : size === 'medium' ? '120px' : '48px',
        maxWidth: isHero ? '280px' : undefined,
        aspectRatio: '1 / 1',
        margin: '0 auto',
        flexShrink: 0
      }}
    >
      <svg
        viewBox="0 0 280 280"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          overflow: 'visible',
          filter: 'drop-shadow(0 0 30px rgba(56, 189, 248, 0.28))'
        }}
      >
        <defs>
          {/* Planet Core Gradient: Electric Cyan & Sapphire Blue */}
          <radialGradient id="planet-core-glow" cx="38%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#FFFFFF" />
            <stop offset="20%" stopColor="#E0F2FE" />
            <stop offset="55%" stopColor="#38BDF8" />
            <stop offset="85%" stopColor="#0284C7" />
            <stop offset="100%" stopColor="#034570" />
          </radialGradient>

          {/* Outer Atmospheric Glow */}
          <radialGradient id="atmosphere-glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.35" />
            <stop offset="50%" stopColor="#818CF8" stopOpacity="0.12" />
            <stop offset="100%" stopColor="#08090C" stopOpacity="0" />
          </radialGradient>

          {/* Ring Gradients */}
          <linearGradient id="ring-grad-1" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#F5F3EB" stopOpacity="0.4" />
            <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#818CF8" stopOpacity="0.25" />
          </linearGradient>

          <linearGradient id="ring-grad-2" x1="100%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.3" />
            <stop offset="50%" stopColor="#F5F3EB" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#C084FC" stopOpacity="0.15" />
          </linearGradient>
        </defs>

        {/* Ambient Atmosphere */}
        <circle cx="140" cy="140" r="120" fill="url(#atmosphere-glow)" />

        {/* Outer Orbit Ring (Static Guide) */}
        <circle
          cx="140"
          cy="140"
          r="125"
          stroke="#F5F3EB"
          strokeOpacity="0.08"
          strokeWidth="1"
          strokeDasharray="4 6"
        />

        {/* Ring 1 (Rotated elliptical ring with orbiting satellite) */}
        <g style={{ transformOrigin: '140px 140px', animation: 'orbitSpin 38s linear infinite' }}>
          <ellipse
            cx="140"
            cy="140"
            rx="118"
            ry="46"
            stroke="url(#ring-grad-1)"
            strokeWidth="1.2"
            transform="rotate(-28 140 140)"
          />
          {/* Satellite Node 1 */}
          <circle cx="240" cy="90" r="4.5" fill="#F7F5ED" filter="drop-shadow(0 0 6px #F7F5ED)" />
          <circle cx="240" cy="90" r="8" stroke="#38BDF8" strokeWidth="0.75" strokeOpacity="0.6" />
        </g>

        {/* Ring 2 (Counter-rotating secondary orbit) */}
        <g style={{ transformOrigin: '140px 140px', animation: 'orbitSpinReverse 52s linear infinite' }}>
          <ellipse
            cx="140"
            cy="140"
            rx="98"
            ry="38"
            stroke="url(#ring-grad-2)"
            strokeWidth="1"
            strokeDasharray="3 3"
            transform="rotate(35 140 140)"
          />
          {/* Satellite Node 2 */}
          <circle cx="55" cy="180" r="3.5" fill="#38BDF8" filter="drop-shadow(0 0 5px #38BDF8)" />
        </g>

        {/* Inner Orbit Ring */}
        <ellipse
          cx="140"
          cy="140"
          rx="76"
          ry="26"
          stroke="#38BDF8"
          strokeOpacity="0.35"
          strokeWidth="0.8"
          transform="rotate(-60 140 140)"
        />

        {/* Planet Core Shadow & Spherical Depth */}
        <circle cx="140" cy="140" r="46" fill="#0D0F14" />
        <circle cx="140" cy="140" r="44" fill="url(#planet-core-glow)" />

        {/* Subtle Planetary Surface Texture Arcs */}
        <path
          d="M 112 124 Q 134 116 160 128"
          stroke="#034570"
          strokeWidth="1.2"
          strokeOpacity="0.4"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M 120 152 Q 146 142 168 156"
          stroke="#034570"
          strokeWidth="1.2"
          strokeOpacity="0.35"
          fill="none"
          strokeLinecap="round"
        />

        {/* Front Equatorial Ring Segment for Depth */}
        <g style={{ transformOrigin: '140px 140px', animation: 'orbitSpin 38s linear infinite' }}>
          <path
            d="M 40 140 A 118 46 0 0 0 240 140"
            stroke="#FFFDF7"
            strokeWidth="1.5"
            strokeOpacity="0.8"
            transform="rotate(-28 140 140)"
            fill="none"
          />
        </g>

        {/* Inner Core Highlight Sparkle */}
        <circle cx="124" cy="122" r="3" fill="#FFFFFF" fillOpacity="0.9" />
      </svg>
    </div>
  );
}
