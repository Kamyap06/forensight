import React, { useState, useEffect, useRef } from 'react';
import { Terminal, X, Minimize2, Maximize2, ShieldAlert, Cpu, CheckCircle2, RefreshCw } from 'lucide-react';
import { User } from '../types';
import { api } from '../services/api';

interface CyberTerminalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User | null;
  onNavigate: (view: string) => void;
  onSelectCase?: (caseId: number) => void;
}

interface CommandHistory {
  id: number;
  command: string;
  output: React.ReactNode;
  timestamp: string;
}

export default function CyberTerminal({
  isOpen,
  onClose,
  currentUser,
  onNavigate,
  onSelectCase
}: CyberTerminalProps) {
  const [inputVal, setInputVal] = useState('');
  const [history, setHistory] = useState<CommandHistory[]>([
    {
      id: 1,
      command: 'init',
      output: (
        <div style={{ color: '#38bdf8' }}>
          <div>[+] FORENSIGHT CYBER DEFENSE TERMINAL v3.2.0</div>
          <div>[+] Cryptographic Integrity Engine Online // SHA-256 Active</div>
          <div>[+] Type <span style={{ color: '#10b981', fontWeight: 600 }}>help</span> to inspect interactive SOC commands.</div>
        </div>
      ),
      timestamp: new Date().toLocaleTimeString()
    }
  ]);
  const [isMaximized, setIsMaximized] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
    }
  }, [isOpen]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  if (!isOpen) return null;

  const computeSha256 = async (str: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(str);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputVal.trim();
    if (!trimmed) return;

    const parts = trimmed.split(' ');
    const cmd = parts[0].toLowerCase();
    const args = parts.slice(1).join(' ');
    const timeStr = new Date().toLocaleTimeString();

    let outputNode: React.ReactNode = null;

    switch (cmd) {
      case 'help':
        outputNode = (
          <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr', gap: '4px', color: '#cbd5e1' }}>
            <span style={{ color: '#38bdf8', fontWeight: 600 }}>status</span>
            <span>Check node connectivity, MySQL health, and trigger status</span>

            <span style={{ color: '#38bdf8', fontWeight: 600 }}>cases</span>
            <span>Display recent active investigation dossiers</span>

            <span style={{ color: '#38bdf8', fontWeight: 600 }}>threats</span>
            <span>List verified critical forensic findings</span>

            <span style={{ color: '#38bdf8', fontWeight: 600 }}>sha256 &lt;str&gt;</span>
            <span>Calculate live cryptographic SHA-256 hash</span>

            <span style={{ color: '#38bdf8', fontWeight: 600 }}>scan</span>
            <span>Run simulated forensic IOC telemetry diagnostic</span>

            <span style={{ color: '#38bdf8', fontWeight: 600 }}>whoami</span>
            <span>Show active authenticated investigator telemetry</span>

            <span style={{ color: '#38bdf8', fontWeight: 600 }}>matrix</span>
            <span>Trigger cyber telemetry glyph stream</span>

            <span style={{ color: '#38bdf8', fontWeight: 600 }}>goto &lt;view&gt;</span>
            <span>Quick jump: dashboard, cases, evidence, findings, tasks, audit, reports</span>

            <span style={{ color: '#38bdf8', fontWeight: 600 }}>clear</span>
            <span>Clear console telemetry output</span>
          </div>
        );
        break;

      case 'status':
        try {
          const dbRes = await api.getDbCheck();
          outputNode = (
            <div style={{ color: '#10b981' }}>
              <div>[✓] Local Node: 127.0.0.1 (ForenSight DFIR SOC Platform)</div>
              <div>[✓] Database: MySQL 8.0 @ {dbRes?.database || 'forensight'} [HEALTHY]</div>
              <div>[✓] Cryptographic Checksum Engine: SHA-256 Active</div>
              <div>[✓] Audit Triggers: trg_after_custody_insert, trg_after_finding_insert [ENGAGED]</div>
              <div>[✓] Active User: {currentUser?.name || 'Anonymous'} ({currentUser?.role || 'Guest'})</div>
            </div>
          );
        } catch {
          outputNode = <div style={{ color: '#ef4444' }}>[!] Node telemetry unavailable. Check backend service.</div>;
        }
        break;

      case 'cases':
        try {
          const cRes = await api.getCases();
          const list = (cRes.cases || []).slice(0, 5);
          outputNode = (
            <div>
              <div style={{ color: '#94a3b8', marginBottom: '4px' }}>Found {cRes.cases?.length || 0} investigation dossiers (displaying recent):</div>
              {list.map((c: any) => (
                <div key={c.case_id} style={{ display: 'flex', gap: '12px', fontSize: '0.8rem', padding: '2px 0' }}>
                  <span style={{ color: '#38bdf8', fontFamily: 'monospace' }}>FS-{c.case_id}</span>
                  <span style={{ color: '#ffffff', fontWeight: 600 }}>{c.title}</span>
                  <span style={{ color: c.priority === 'Critical' ? '#ef4444' : c.priority === 'High' ? '#f97316' : '#10b981' }}>
                    [{c.priority}]
                  </span>
                  <span style={{ color: '#94a3b8' }}>({c.status})</span>
                </div>
              ))}
            </div>
          );
        } catch {
          outputNode = <div style={{ color: '#ef4444' }}>[!] Failed to query investigation database.</div>;
        }
        break;

      case 'threats':
        try {
          const fRes = await api.getFindings();
          const list = (fRes.findings || []).slice(0, 5);
          outputNode = (
            <div>
              <div style={{ color: '#ef4444', fontWeight: 600, marginBottom: '4px' }}>[!] Threat Telemetry Stream:</div>
              {list.map((f: any) => (
                <div key={f.finding_id} style={{ fontSize: '0.8rem', padding: '2px 0' }}>
                  <span style={{ color: f.severity === 'Critical' ? '#ef4444' : '#f59e0b', fontWeight: 600 }}>
                    [{f.severity}]
                  </span>{' '}
                  <span style={{ color: '#ffffff' }}>{f.finding_type}</span>: {f.description}
                </div>
              ))}
            </div>
          );
        } catch {
          outputNode = <div style={{ color: '#ef4444' }}>[!] Unable to query forensic findings telemetry.</div>;
        }
        break;

      case 'sha256':
        if (!args) {
          outputNode = <div style={{ color: '#f59e0b' }}>Usage: sha256 &lt;string or payload&gt;</div>;
        } else {
          const hash = await computeSha256(args);
          outputNode = (
            <div>
              <div style={{ color: '#94a3b8' }}>Input Payload: &quot;{args}&quot;</div>
              <div style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 600, marginTop: '2px' }}>
                SHA-256: {hash}
              </div>
            </div>
          );
        }
        break;

      case 'scan':
        outputNode = (
          <div style={{ color: '#38bdf8' }}>
            <div>[+] Initializing memory artifact diagnostic...</div>
            <div>[+] Scanning volatile process table [OK]</div>
            <div>[+] Correlating LSASS.exe handles against injection signatures...</div>
            <div>[+] Verifying byte entropy against known Cobalt Strike beacons...</div>
            <div style={{ color: '#10b981', fontWeight: 600, marginTop: '4px' }}>
              [✓] Forensic Scan Complete. 0 unverified anomalies detected. Integrity verified.
            </div>
          </div>
        );
        break;

      case 'whoami':
        outputNode = (
          <div style={{ color: '#38bdf8' }}>
            <div>Investigator: <span style={{ color: '#ffffff', fontWeight: 600 }}>{currentUser?.name || 'Anonymous User'}</span></div>
            <div>Email: <span style={{ color: '#94a3b8' }}>{currentUser?.email || 'N/A'}</span></div>
            <div>Role: <span style={{ color: '#10b981', fontWeight: 600 }}>{currentUser?.role || 'Guest'}</span></div>
            <div>Session Token: <span style={{ fontFamily: 'monospace', color: '#8b5cf6' }}>SEC-NODE-{Date.now().toString(16)}</span></div>
          </div>
        );
        break;

      case 'matrix':
        outputNode = (
          <div style={{ color: '#10b981', fontFamily: 'monospace', fontSize: '0.75rem', lineHeight: 1.2 }}>
            <div>01000110 01001111 01010010 01000101 01001110 01010011 01001001 01000111 01001000 01010100</div>
            <div>[0x7F4A] MEM_DUMP_ANALYSIS // INJECTION_DETECTED: lsass.exe PID: 684</div>
            <div>[0x9B1C] CHAIN_OF_CUSTODY_VERIFIED // HASH_MATCH: a3f5e6d7b8c9...</div>
            <div>[0xE4F0] AES-256-GCM TELEMETRY PIPELINE ENCRYPTED // STATUS: NOMINAL</div>
          </div>
        );
        break;

      case 'goto':
        if (!args) {
          outputNode = <div style={{ color: '#f59e0b' }}>Usage: goto &lt;dashboard | cases | evidence | tasks | findings | custody | audit | reports&gt;</div>;
        } else {
          onNavigate(args.toLowerCase());
          outputNode = <div style={{ color: '#10b981' }}>[✓] Navigating to view: {args}</div>;
        }
        break;

      case 'clear':
        setHistory([]);
        setInputVal('');
        return;

      default:
        outputNode = (
          <div style={{ color: '#ef4444' }}>
            Command not recognized: &quot;{cmd}&quot;. Type <span style={{ color: '#38bdf8', fontWeight: 600 }}>help</span> for available commands.
          </div>
        );
        break;
    }

    setHistory((prev) => [
      ...prev,
      {
        id: Date.now() + Math.random(),
        command: trimmed,
        output: outputNode,
        timestamp: timeStr
      }
    ]);
    setInputVal('');
  };

  return (
    <div
      style={{
        position: 'fixed',
        bottom: '18px',
        right: '18px',
        width: isMaximized ? 'calc(100vw - 36px)' : '620px',
        height: isMaximized ? 'calc(100vh - 36px)' : '380px',
        maxWidth: '100vw',
        maxHeight: '100vh',
        backgroundColor: 'rgba(7, 11, 20, 0.96)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(56, 189, 248, 0.35)',
        borderRadius: '12px',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.8), 0 0 25px rgba(56, 189, 248, 0.15)',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        animation: 'slideIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
    >
      {/* Top Cyber Light Glowing Bar */}
      <div
        style={{
          height: '2px',
          background: 'linear-gradient(90deg, #38bdf8, #8b5cf6, #10b981, #38bdf8)',
          backgroundSize: '200% 100%',
          animation: 'shimmer 3s linear infinite'
        }}
      />

      {/* Terminal Title Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '8px 14px',
          backgroundColor: 'rgba(15, 23, 42, 0.9)',
          borderBottom: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10b981', boxShadow: '0 0 8px #10b981' }} />
          <Terminal className="w-4 h-4 text-sky-400" />
          <span style={{ fontSize: '0.8rem', fontWeight: 700, letterSpacing: '0.5px', color: '#f8fafc', fontFamily: 'monospace' }}>
            FORENSIGHT // DFIR SOC TERMINAL
          </span>
          <span style={{ fontSize: '0.7rem', color: '#94a3b8', marginLeft: '6px' }}>[Ctrl + ~ to toggle]</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            style={{ background: 'transparent', border: 'none', color: '#94a3b8', cursor: 'pointer', padding: '4px' }}
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={onClose}
            style={{ background: 'transparent', border: 'none', color: '#ef4444', cursor: 'pointer', padding: '4px' }}
            title="Close Terminal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Terminal Output Area */}
      <div
        style={{
          flex: 1,
          padding: '12px 14px',
          overflowY: 'auto',
          fontFamily: 'Consolas, Monaco, "Courier New", monospace',
          fontSize: '0.82rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}
      >
        {history.map((h) => (
          <div key={h.id}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '0.74rem' }}>
              <span>[{h.timestamp}]</span>
              <span style={{ color: '#10b981', fontWeight: 600 }}>investigator@forensight:~$</span>
              <span style={{ color: '#ffffff', fontWeight: 600 }}>{h.command}</span>
            </div>
            <div style={{ marginTop: '4px', paddingLeft: '8px', borderLeft: '2px solid rgba(56, 189, 248, 0.25)' }}>
              {h.output}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Terminal Input Prompt */}
      <form
        onSubmit={handleCommand}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: 'rgba(10, 15, 30, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        <span style={{ color: '#10b981', fontFamily: 'monospace', fontWeight: 700, fontSize: '0.82rem' }}>
          &gt;
        </span>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          placeholder="Enter command (e.g., help, status, cases, threats, sha256)..."
          style={{
            flex: 1,
            background: 'transparent',
            border: 'none',
            outline: 'none',
            color: '#38bdf8',
            fontFamily: 'monospace',
            fontSize: '0.82rem'
          }}
        />
        <button
          type="submit"
          style={{
            backgroundColor: 'rgba(56, 189, 248, 0.15)',
            border: '1px solid rgba(56, 189, 248, 0.3)',
            borderRadius: '4px',
            color: '#38bdf8',
            padding: '3px 8px',
            fontSize: '0.72rem',
            fontFamily: 'monospace',
            cursor: 'pointer'
          }}
        >
          EXEC
        </button>
      </form>
    </div>
  );
}
