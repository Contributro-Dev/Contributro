import { loginWithGithub } from '../services/authServices.js'
import bgImage from '../assets/3d-wave.jpg'

function Login() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0d0d0d',
      display: 'flex',
      fontFamily: "'Space Grotesk', 'IBM Plex Mono', monospace",
      color: '#fff',
      overflow: 'hidden',
    }}>

      {/* LEFT PANEL */}
      <div style={{
        flex: 1,
        padding: '0.8rem 4rem',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'space-between',
        borderRight: '1px solid #1e1e1e',
        position: 'relative',
      }}>

        {/* Background image with opacity */}
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `url(${bgImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          opacity: 0.1,  // ← control opacity here (0 to 1)
          zIndex: 0,
        }} />

        {/* Vignette overlay */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse at center, transparent 40%, #0d0d0d 100%)',
          zIndex: 1,
        }} />

        {/* Top nav */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center',position: 'relative', zIndex: 2 }}>
          <span style={{ fontWeight: 700, fontSize: '1rem', letterSpacing: '0.05em', color: '#fff' }}>
            CONTRIBUTRO.
          </span>
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button style={iconBtn}>⊞</button>
            <button style={iconBtn}>⚙</button>
          </div>
        </div>

        {/* Main content */}
        <div style={{  position: 'relative', zIndex: 2 }}>
          <p style={{
            fontSize: '0.7rem',
            letterSpacing: '0.25em',
            color: '#555',
            textTransform: 'uppercase',
            marginBottom: '0.75rem',
          }}>
            SYSTEM IDENTIFICATION
          </p>
          <p style={{
            fontSize: '1rem',
            letterSpacing: '0.2em',
            color: '#b9b9b9',
            textTransform: 'uppercase',
            fontWeight: 600,
            marginBottom: '2rem',
          }}>
            THE CONTRIBUTOR PLATFORM
          </p>

<h1 style={{
  fontSize: 'clamp(2.5rem, 5vw, 4rem)',
  fontFamily: "'flex', 'Space Grotesk', 'IBM Plex Mono', monospace",
  fontWeight: 800,
  lineHeight: 1.0,
  marginBottom: '3rem',
  letterSpacing: '0.03em',

  // Gradient text
  background: 'linear-gradient(135deg, #7c5cfc 0%, #a78bfa 40%, #e879f9 100%)',
  WebkitBackgroundClip: 'text',
  WebkitTextFillColor: 'transparent',
  backgroundClip: 'text',
}}>
  Build<br />
  something<br />
  bigger than<br />
  yourself.
</h1>
          {/* Feature list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {[
              {
                icon: '◈',
                title: 'ML-Powered Matching',
                desc: 'Neural algorithms align your skill signature with high-impact projects.',
              },
              {
                icon: '⌥',
                title: 'GitHub Integrated',
                desc: 'Seamless repository sync with real-time contribution tracking.',
              },
              {
                icon: '◉',
                title: 'Verified Teams',
                desc: 'Collaborate with verified developers and project maintainers.',
              },
            ].map((f) => (
              <div key={f.title} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                <div style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  background: '#1a1330',
                  border: '1px solid #2e2550',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1rem',
                  color: '#7c5cfc',
                  flexShrink: 0,
                }}>
                  {f.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: '0.2rem', color: '#e0e0e0' }}>
                    {f.title}
                  </p>
                  <p style={{ fontSize: '0.8rem', color: '#666', lineHeight: 1.5 }}>
                    {f.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom footer */}
        <div style={{ fontSize: '0.65rem', color: '#333', letterSpacing: '0.15em', textTransform: 'uppercase' ,position: 'relative', zIndex: 2}}>
          © 2026 CONTRIBUTRO. ENCRYPTED ACCESS ONLY.
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{
        width: '638px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        backgroundColor: '#151515',
      }}>
        <div style={{
          width: '100%',
          maxWidth: '360px',
          background: '#161616',
          border: '1px solid #222',
          boxShadow: '0 4px 40px rgba(32, 32, 32, 0.5)',
          borderRadius: '16px',
          padding: '2.5rem',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1.5rem',
        }}>

          {/* Lock icon */}
          <div style={{
            width: '56px',
            height: '56px',
            borderRadius: '12px',
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '1.5rem',
          }}>
            <span className="material-symbols-outlined">
              lock_open
            </span>
          </div>

          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: '1.3rem',
              fontWeight: 700,
              fontFamily: "'inter', 'Space Grotesk', 'IBM Plex Mono', monospace",
              color: '#fff',
              marginBottom: '0.5rem',
              letterSpacing: '-0.01em',
            }}>
              Initialize Session
            </h2>
            <p style={{ fontSize: '0.85rem', fontFamily: "'space-grotesk', 'inter', 'IBM Plex Mono', monospace", color: '#666', lineHeight: 1.5 }}>
              Sync your GitHub to start collaborating.
            </p>
          </div>

          {/* GitHub button */}
          <button
            onClick={loginWithGithub}
            style={{
              width: '100%',
              padding: '0.85rem 1.5rem',
              background: '#fff',
              color: '#0d0d0d',
              border: 'none',
              borderRadius: '10px',
              fontSize: '0.9rem',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.6rem',
              letterSpacing: '0.01em',
              transition: 'background 0.2s',
            }}
            onMouseEnter={e => e.currentTarget.style.background = '#e8e8e8'}
            onMouseLeave={e => e.currentTarget.style.background = '#fff'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            Continue with GitHub
          </button>

          {/* Terms */}
          <p style={{
            fontSize: '0.72rem',
            color: '#444',
            textAlign: 'center',
            lineHeight: 1.6,
          }}>
            By authenticating, you agree to the{' '}
            <span style={{ color: '#7c5cfc', cursor: 'pointer' }}>System Protocols</span>
            {' '}and{' '}
            <span style={{ color: '#7c5cfc', cursor: 'pointer' }}>Data Handling Terms</span>.
          </p>

          {/* Bottom links */}
          <div style={{
            borderTop: '1px solid #1e1e1e',
            width: '100%',
            paddingTop: '1rem',
            display: 'flex',
            justifyContent: 'center',
            gap: '1.5rem',
          }}>
            {['PROTOCOL', 'SECURITY', 'ARCHITECTURE'].map(link => (
              <span key={link} style={{
                fontSize: '0.62rem',
                color: '#333',
                letterSpacing: '0.15em',
                cursor: 'pointer',
                textTransform: 'uppercase',
              }}>
                {link}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div >
  )
}


const iconBtn = {
  background: 'transparent',
  border: '1px solid #222',
  borderRadius: '10px',
  color: '#666',
  width: '32px',
  height: '32px',
  cursor: 'pointer',
  fontSize: '0.9rem',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

export default Login;