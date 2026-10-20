import React, { useState } from 'react';
import {
  Shield,
  ShieldAlert,
  Hash,
  Radar,
  Bug,
  ArrowRight,
  Database,
  Lock,
  Microscope,
  Briefcase,
  Link2,
  AlertTriangle,
  History,
  CheckCircle2,
  Fingerprint,
  Cpu,
  Layers,
  Search,
  CheckSquare,
  Play,
  Sparkles,
  Terminal,
  Activity,
  FileCode2,
  Command,
  ArrowUpRight
} from 'lucide-react';
import Navbar from '../components/Navbar';
import { User } from '../types';

interface LandingPageProps {
  currentUser: User | null;
  onNavigateLogin: () => void;
  onNavigateDashboard: () => void;
}

export default function LandingPage({
  currentUser,
  onNavigateLogin,
  onNavigateDashboard
}: LandingPageProps) {
  const [activeArtifactTab, setActiveArtifactTab] = useState<'memdump' | 'pcap' | 'lsass'>('memdump');

  const handlePrimaryCTA = () => {
    if (currentUser) {
      onNavigateDashboard();
    } else {
      onNavigateLogin();
    }
  };

  const cyberTools = [
    { id: 'defense', icon: ShieldAlert, name: 'Threat Shield', tag: 'ACTIVE', color: '#38bdf8', desc: 'Real-Time Intrusion & Zero-Day Defense' },
    { id: 'trace', icon: Fingerprint, name: 'Artifact Trace', tag: 'EVIDENCE', color: '#10b981', desc: 'Digital Artifact & Biometric Forensics' },
    { id: 'hash', icon: Hash, name: 'SHA-256 Engine', tag: 'VERIFIED', color: '#00f0ff', desc: 'Cryptographic Tamper-Proof Digest' },
    { id: 'memory', icon: Microscope, name: 'Volatility 3', tag: 'TELEMETRY', color: '#c084fc', desc: 'Process Injection & Memory Forensics' },
    { id: 'radar', icon: Radar, name: 'Threat Hunter', tag: 'NETWORK', color: '#f59e0b', desc: 'Packet Sniffer & Lateral Movement Hunter' },
    { id: 'malware', icon: Bug, name: 'Malware Triage', tag: 'IOC HUNTER', color: '#f43f5e', desc: 'Zero-Day IOCs & Automated Sandbox Triage' },
    { id: 'terminal', icon: Terminal, name: 'DFIR Shell', tag: 'LIVE CLI', color: '#0284c7', desc: 'Incident Command & Automation Console' },
    { id: 'vault', icon: Lock, name: 'Custody Vault', tag: 'COURT-READY', color: '#eab308', desc: 'Immutable Evidence Ledger & Chain of Custody' }
  ];

  return (
    <div style={{ backgroundColor: 'var(--bg-app)', color: 'var(--text-main)', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar
        currentUser={currentUser}
        onNavigateLanding={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        onNavigateLogin={onNavigateLogin}
        onNavigateDashboard={onNavigateDashboard}
      />

      {/* Hero Section (Antigravity Reference Style) */}
      <section style={{
        padding: '50px 24px 30px',
        maxWidth: '1280px',
        margin: '0 auto',
        textAlign: 'center',
        position: 'relative',
        width: '100%'
      }}>
        {/* Antigravity-Style Tactical Cyber Capabilities Strip */}
        <div className="cyber-tool-carousel">
          {cyberTools.map((t) => {
            const Icon = t.icon;
            return (
              <div
                key={t.id}
                className="cyber-tool-circle group"
                onClick={handlePrimaryCTA}
                style={{
                  '--tool-color': t.color,
                  '--tool-glow': t.color + '55'
                } as React.CSSProperties}
              >
                <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-115" style={{ color: t.color }} />
                <div className="cyber-tool-tooltip">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, letterSpacing: '0.5px', color: '#f8fafc', fontFamily: 'var(--font-mono)' }}>
                      {t.name}
                    </span>
                    <span style={{
                      fontSize: '0.6rem',
                      fontWeight: 800,
                      padding: '1px 5px',
                      borderRadius: '4px',
                      backgroundColor: t.color + '22',
                      color: t.color,
                      border: '1px solid ' + t.color + '44',
                      fontFamily: 'var(--font-mono)'
                    }}>
                      {t.tag}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.65rem', color: '#94a3b8', fontWeight: 500 }}>
                    {t.desc}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Hero Title with Rainbow Cursor */}
        <h1 style={{
          fontSize: 'clamp(2.5rem, 5.5vw, 4.4rem)',
          fontWeight: 800,
          lineHeight: 1.1,
          letterSpacing: '-1.8px',
          color: 'var(--text-main)',
          marginBottom: '20px',
          maxWidth: '1080px',
          margin: '0 auto 20px'
        }}>
          Experience cyber forensics in the agent-first era<span className="rainbow-cursor" />
        </h1>

        <p style={{
          fontSize: 'clamp(1rem, 2vw, 1.2rem)',
          color: 'var(--text-secondary)',
          maxWidth: '760px',
          margin: '0 auto 28px',
          lineHeight: 1.55
        }}>
          ForenSight is our unified cybersecurity investigation platform, allowing forensic teams to analyze breaches, verify SHA-256 evidence integrity, track chain of custody, and generate court-admissible dossiers.
        </p>

        {/* Primary CTA Buttons */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap', marginBottom: '46px' }}>
          <button
            className="btn btn-primary"
            onClick={handlePrimaryCTA}
            style={{ padding: '10px 26px', fontSize: '0.94rem', borderRadius: '8px' }}
          >
            <span>{currentUser ? 'Open Investigation Console' : 'Launch Platform'}</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>
          <a
            href="#preview"
            className="btn btn-outline"
            style={{ padding: '10px 22px', fontSize: '0.94rem', borderRadius: '8px', textDecoration: 'none' }}
          >
            <span>Interactive Preview</span>
            <ArrowUpRight className="w-4 h-4 ml-1" />
          </a>
        </div>

        {/* High-Tech Interactive Console Preview Window (Antigravity Video / IDE Reference Style) */}
        <div
          id="preview"
          style={{
            maxWidth: '1040px',
            margin: '0 auto',
            borderRadius: '14px',
            background: 'linear-gradient(180deg, rgba(15, 23, 42, 0.95) 0%, rgba(8, 12, 22, 0.98) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.8), 0 0 35px rgba(56, 189, 248, 0.15)',
            overflow: 'hidden',
            position: 'relative',
            textAlign: 'left'
          }}
        >
          {/* Window Titlebar */}
          <div
            style={{
              padding: '10px 16px',
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#ef4444' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#f59e0b' }} />
              <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#10b981' }} />
              <span style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.74rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                case-19 // operation-nightshade // apt39_telemetry.forensight
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span className="cyber-live-indicator">
                <span className="cyber-live-dot" />
                <span>SHA-256 SEALED</span>
              </span>
            </div>
          </div>

          {/* Interactive IDE / Terminal Interior */}
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: '340px' }} className="preview-split">
            {/* Left Artifact Explorer */}
            <div
              style={{
                backgroundColor: 'rgba(11, 16, 32, 0.65)',
                borderRight: '1px solid rgba(255, 255, 255, 0.08)',
                padding: '14px',
                fontFamily: 'ui-monospace, monospace',
                fontSize: '0.76rem'
              }}
            >
              <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Case #19 Artifacts
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div
                  onClick={() => setActiveArtifactTab('memdump')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: activeArtifactTab === 'memdump' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    border: activeArtifactTab === 'memdump' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: activeArtifactTab === 'memdump' ? '#38bdf8' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <FileCode2 className="w-3.5 h-3.5" />
                  <span>apt39_memdump.raw</span>
                </div>

                <div
                  onClick={() => setActiveArtifactTab('pcap')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: activeArtifactTab === 'pcap' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    border: activeArtifactTab === 'pcap' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: activeArtifactTab === 'pcap' ? '#38bdf8' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Activity className="w-3.5 h-3.5" />
                  <span>exfil_capture.pcap</span>
                </div>

                <div
                  onClick={() => setActiveArtifactTab('lsass')}
                  style={{
                    padding: '8px 10px',
                    borderRadius: '6px',
                    backgroundColor: activeArtifactTab === 'lsass' ? 'rgba(56, 189, 248, 0.15)' : 'transparent',
                    border: activeArtifactTab === 'lsass' ? '1px solid rgba(56, 189, 248, 0.35)' : '1px solid transparent',
                    color: activeArtifactTab === 'lsass' ? '#38bdf8' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  <Terminal className="w-3.5 h-3.5" />
                  <span>lsass_malfind.log</span>
                </div>
              </div>

              <div style={{ marginTop: '20px', padding: '10px', borderRadius: '6px', backgroundColor: 'rgba(15, 23, 42, 0.8)', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ fontSize: '0.66rem', color: 'var(--text-muted)' }}>SHA-256 HASH</div>
                <div style={{ fontSize: '0.68rem', color: '#10b981', wordBreak: 'break-all', marginTop: '2px' }}>
                  f1eafcc022fea7e9b0487d60517e4cf4e...
                </div>
              </div>
            </div>

            {/* Right Telemetry Code & Log Console */}
            <div
              style={{
                padding: '18px 22px',
                fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, monospace',
                fontSize: '0.8rem',
                color: '#e2e8f0',
                lineHeight: 1.6,
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <div style={{ color: '#64748b', marginBottom: '8px' }}>
                  // Volatility 3 Frame Telemetry - Target Host: WIN-SRV-2022.corp.local
                </div>
                <div style={{ color: '#38bdf8', marginBottom: '4px' }}>
                  [2026-10-20 15:42:12 UTC] Memory capture mounted: <code>apt39_memdump.raw</code> (Size: 4,294,967,296 bytes)
                </div>
                <div style={{ color: '#10b981', marginBottom: '4px' }}>
                  [2026-10-20 15:42:15 UTC] Cryptographic SHA-256 Digest: <code>f1eafcc022fea7e9b0487d60517e4cf4e7471960</code> (VERIFIED)
                </div>
                <div style={{ color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.08)', padding: '6px 10px', borderRadius: '6px', margin: '8px 0', border: '1px solid rgba(239, 68, 68, 0.25)' }}>
                  <strong>[CRITICAL ALERT]</strong> Process Injection: <code>lsass.exe (PID 620)</code>
                  <br />Reflective DLL mapped at base offset <code>0x7FFA89B00000</code> [MITRE ATT&CK T1055.001]
                </div>
                <div style={{ color: '#f59e0b', marginBottom: '4px' }}>
                  [2026-10-20 15:44:02 UTC] Threat Classification: Adversary APT39 Lateral Movement (Pass-The-Hash detected)
                </div>
                <div style={{ color: '#94a3b8' }}>
                  [2026-10-20 15:45:00 UTC] Chain of custody committed: Transfer to Forensic Vault Locker B-12
                </div>
              </div>

              {/* Floating "Play Intro / Launch Console" Button (Antigravity Style) */}
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  padding: '24px 0 10px'
                }}
              >
                <button
                  onClick={handlePrimaryCTA}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 24px',
                    borderRadius: '9999px',
                    background: 'rgba(15, 23, 42, 0.85)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(56, 189, 248, 0.45)',
                    color: '#ffffff',
                    fontSize: '0.88rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    boxShadow: '0 4px 24px rgba(0, 0, 0, 0.6), 0 0 20px rgba(56, 189, 248, 0.35)',
                    transition: 'all 0.2s ease'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.borderColor = '#38bdf8';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.borderColor = 'rgba(56, 189, 248, 0.45)';
                  }}
                >
                  <Play className="w-4 h-4 fill-sky-400 text-sky-400" />
                  <span>Launch Live Investigation Console</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Features Grid */}
      <section id="features" style={{ padding: '60px 24px', maxWidth: '1240px', margin: '0 auto', width: '100%' }}>
        <div style={{ textAlign: 'center', marginBottom: '36px' }}>
          <div style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
            Engineered For Digital Forensics & Incident Response
          </div>
          <h2 style={{ fontSize: '1.9rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.5px' }}>
            Core Investigation Capabilities
          </h2>
        </div>

        <div className="landing-capabilities-grid">
          {/* Card 1 */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-body" style={{ padding: '22px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(59, 130, 246, 0.12)', border: '1px solid rgba(59, 130, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Briefcase className="w-5 h-5 text-sky-400" />
              </div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Incident Dossiers & Scoping
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                Centralized case dossiers categorizing ransomware, data exfiltration, and insider breaches with priority classifications.
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-body" style={{ padding: '22px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(16, 185, 129, 0.12)', border: '1px solid rgba(16, 185, 129, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Microscope className="w-5 h-5 text-emerald-400" />
              </div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Cryptographic SHA-256 Vault
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                Automated cryptographic digest calculation guarantees evidence integrity and tamper detection from collection to trial.
              </p>
            </div>
          </div>

          {/* Card 3 */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-body" style={{ padding: '22px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(139, 92, 246, 0.12)', border: '1px solid rgba(139, 92, 246, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <Link2 className="w-5 h-5 text-violet-400" />
              </div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Immutable Chain of Custody
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                Strict chronological ledger recording every checkout, analysis step, and vault transition with automated audit tracking.
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-body" style={{ padding: '22px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <AlertTriangle className="w-5 h-5 text-red-400" />
              </div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Threat Indicator Triage
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                Document malware IOCs, lateral movement vectors, and CVE tags with automated severity rating metrics.
              </p>
            </div>
          </div>

          {/* Card 5 */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-body" style={{ padding: '22px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(245, 158, 11, 0.12)', border: '1px solid rgba(245, 158, 11, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <CheckSquare className="w-5 h-5 text-amber-400" />
              </div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Multi-Investigator Workflows
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                Delegate tasks across teams with strict deadlines and structured milestone tracking.
              </p>
            </div>
          </div>

          {/* Card 6 */}
          <div className="panel" style={{ marginBottom: 0 }}>
            <div className="panel-body" style={{ padding: '22px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', backgroundColor: 'rgba(56, 189, 248, 0.12)', border: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '14px' }}>
                <History className="w-5 h-5 text-sky-400" />
              </div>
              <h3 style={{ fontSize: '1.02rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '8px' }}>
                Official Incident Reporting
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', lineHeight: 1.5 }}>
                Generate official forensic dossiers in PDF and Word DOCX formats with cryptographic certificate seals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Investigation Lifecycle Workflow */}
      <section id="workflow" style={{ padding: '50px 24px', backgroundColor: 'rgba(15, 23, 42, 0.4)', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div style={{ maxWidth: '1000px', margin: '0 auto', textAlign: 'center' }}>
          <h2 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '28px' }}>
            Investigation Lifecycle Workflow
          </h2>

          <div className="landing-workflow-grid">
            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="panel-body" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.76rem', marginBottom: '4px' }}>STEP 01</div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Open Case Dossier</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>Define incident category, scope description, and assign lead investigator.</p>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="panel-body" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.76rem', marginBottom: '4px' }}>STEP 02</div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Ingest & Hash</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>Upload evidence file; backend verifies and records cryptographic SHA-256 digest.</p>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="panel-body" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.76rem', marginBottom: '4px' }}>STEP 03</div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Delegate Tasks</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>Assign analysis workflow tasks across investigators with strict deadlines.</p>
              </div>
            </div>

            <div className="panel" style={{ marginBottom: 0 }}>
              <div className="panel-body" style={{ padding: '16px' }}>
                <div style={{ color: 'var(--primary)', fontWeight: 700, fontSize: '0.76rem', marginBottom: '4px' }}>STEP 04</div>
                <strong style={{ color: 'var(--text-main)', fontSize: '0.9rem' }}>Log Custody & Export</strong>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.78rem', marginTop: '4px' }}>Record evidence custody actions and export court-ready PDF/DOCX reports.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Modern Cyber Footer */}
      <footer style={{
        marginTop: 'auto',
        backgroundColor: 'rgba(8, 12, 22, 0.95)',
        borderTop: '1px solid var(--border-color)',
        padding: '24px 32px 20px'
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Fingerprint className="w-5 h-5 text-sky-400" />
              <strong style={{ color: 'var(--text-main)', fontSize: '1.05rem', letterSpacing: '-0.3px' }}>ForenSight</strong>
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              Digital Forensics & Incident Response Platform // Enterprise Cryptographic Core
            </div>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
            &ldquo;Every digital trace tells a story.&rdquo;
          </div>

          <div>
            <button className="btn btn-outline btn-sm" onClick={handlePrimaryCTA}>
              <span>Sign In Console</span>
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
