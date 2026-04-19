import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../api';

const fmt = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }) : '-';

function Building2({ size }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>;
}

function MiniBar({ value, total, color }) {
  const pct = total ? Math.round((value / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <div className="progress-bar-bg" style={{ flex: 1, height: 5 }}>
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color, height: '100%', borderRadius: 3, transition: 'width 0.4s' }} />
      </div>
      <span style={{ fontSize: 11, color: 'var(--text2)', minWidth: 28, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then(r => r.data),
    refetchInterval: 10000,
  });

  if (isLoading) return <div className="loading"><div className="dot-loader"><span/><span/><span/></div></div>;
  if (!stats) return null;

  const { total, thaali1, thaali2, bothDone, centres, sizeStats, t1DateWise, t2DateWise } = stats;

  const t1Pct = total ? Math.round((thaali1.done / total) * 100) : 0;
  const t2Pct = total ? Math.round((thaali2.done / total) * 100) : 0;
  const bothPct = total ? Math.round((bothDone / total) * 100) : 0;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Dashboard</div>
          <div className="page-sub">Live sticker progress across all centres</div>
        </div>
      </div>

      {/* Top stat cards */}
      <div className="stats-grid">
        <div className="stat-card total">
          <div className="stat-label">Total Records</div>
          <div className="stat-value" style={{ color: '#a78bfa' }}>{total}</div>
          <div className="stat-sub">All registered members</div>
        </div>
        <div className="stat-card t1">
          <div className="stat-label">🟣 Thaali 1 — Done</div>
          <div className="stat-value" style={{ color: 'var(--t1)' }}>{thaali1.done}</div>
          <div className="stat-sub">{thaali1.pending} pending</div>
          <div className="progress-wrap">
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{t1Pct}% complete</div>
            <div className="progress-bar-bg"><div className="progress-bar-fill t1" style={{ width: `${t1Pct}%` }} /></div>
          </div>
        </div>
        <div className="stat-card t2">
          <div className="stat-label">🟡 Thaali 2 — Done</div>
          <div className="stat-value" style={{ color: 'var(--t2)' }}>{thaali2.done}</div>
          <div className="stat-sub">{thaali2.pending} pending</div>
          <div className="progress-wrap">
            <div style={{ fontSize: 11, color: 'var(--text2)', marginBottom: 4 }}>{t2Pct}% complete</div>
            <div className="progress-bar-bg"><div className="progress-bar-fill t2" style={{ width: `${t2Pct}%` }} /></div>
          </div>
        </div>
        <div className="stat-card green">
          <div className="stat-label">✅ Both Stickers Done</div>
          <div className="stat-value" style={{ color: 'var(--green)' }}>{bothDone}</div>
          <div className="stat-sub">{bothPct}% fully complete</div>
          <div className="progress-wrap">
            <div className="progress-bar-bg"><div className="progress-bar-fill green" style={{ width: `${bothPct}%` }} /></div>
          </div>
        </div>
      </div>

      {/* Size breakdown */}
      {sizeStats && sizeStats.length > 0 && (
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="section-title">📦 Size-wise Progress</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
            {sizeStats.map(s => {
              const label = s.size ? s.size.charAt(0).toUpperCase() + s.size.slice(1) : 'Unknown';
              const color = s.size === 'big' ? 'var(--t1)' : s.size === 'small' ? 'var(--t2)' : 'var(--green)';
              const bgColor = s.size === 'big' ? 'rgba(108,99,255,0.1)' : s.size === 'small' ? 'rgba(245,158,11,0.1)' : 'var(--bg3)';
              return (
                <div key={s.size} style={{ background: bgColor, border: `1px solid ${color}33`, borderRadius: 10, padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <div style={{ fontWeight: 700, color, fontSize: 15 }}>{label} Thaali</div>
                    <div style={{ fontSize: 12, color: 'var(--text2)', background: 'var(--bg2)', padding: '2px 8px', borderRadius: 10 }}>{s.total} members</div>
                  </div>
                  <div style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>🟣 Thaali 1</span>
                      <span><span style={{ color: 'var(--green)', fontWeight: 600 }}>{s.t1_done} done</span> · <span style={{ color: 'var(--amber)' }}>{s.t1_pending} pending</span></span>
                    </div>
                    <MiniBar value={s.t1_done} total={s.total} color="var(--t1)" />
                  </div>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ color: 'var(--text2)' }}>🟡 Thaali 2</span>
                      <span><span style={{ color: 'var(--green)', fontWeight: 600 }}>{s.t2_done} done</span> · <span style={{ color: 'var(--amber)' }}>{s.t2_pending} pending</span></span>
                    </div>
                    <MiniBar value={s.t2_done} total={s.total} color="var(--t2)" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Centre-wise table with size breakdown */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div className="section-title"><Building2 size={18} /> Centre-wise Progress (with Size breakdown)</div>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Centre</th>
                <th>Total</th>
                <th style={{ color: 'var(--t1)' }}>T1 Done</th>
                <th style={{ color: 'var(--t1)' }}>T1 Big ✓</th>
                <th style={{ color: 'var(--t1)' }}>T1 Small ✓</th>
                <th style={{ color: 'var(--t1)' }}>T1 %</th>
                <th style={{ color: 'var(--t2)' }}>T2 Done</th>
                <th style={{ color: 'var(--t2)' }}>T2 Big ✓</th>
                <th style={{ color: 'var(--t2)' }}>T2 Small ✓</th>
                <th style={{ color: 'var(--t2)' }}>T2 %</th>
              </tr>
            </thead>
            <tbody>
              {centres.map(c => {
                const p1 = c.total ? Math.round((c.t1_done / c.total) * 100) : 0;
                const p2 = c.total ? Math.round((c.t2_done / c.total) * 100) : 0;
                return (
                  <tr key={c.centre}>
                    <td><span className="badge centre">{c.centre || '(No Centre)'}</span></td>
                    <td style={{ fontWeight: 700 }}>{c.total}
                      <span style={{ fontSize: 10, color: 'var(--text2)', marginLeft: 4 }}>
                        ({c.big_total}B/{c.small_total}S)
                      </span>
                    </td>
                    <td style={{ color: 'var(--t1)', fontWeight: 600 }}>{c.t1_done}</td>
                    <td><span style={{ color: 'var(--t1)', fontSize: 12 }}>{c.t1_big_done}<span style={{ color: 'var(--text2)' }}>/{c.big_total}</span></span></td>
                    <td><span style={{ color: 'var(--t2)', fontSize: 12 }}>{c.t1_small_done}<span style={{ color: 'var(--text2)' }}>/{c.small_total}</span></span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar-bg" style={{ width: 50 }}><div className="progress-bar-fill t1" style={{ width: `${p1}%` }} /></div>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{p1}%</span>
                      </div>
                    </td>
                    <td style={{ color: 'var(--t2)', fontWeight: 600 }}>{c.t2_done}</td>
                    <td><span style={{ color: 'var(--t1)', fontSize: 12 }}>{c.t2_big_done}<span style={{ color: 'var(--text2)' }}>/{c.big_total}</span></span></td>
                    <td><span style={{ color: 'var(--t2)', fontSize: 12 }}>{c.t2_small_done}<span style={{ color: 'var(--text2)' }}>/{c.small_total}</span></span></td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                        <div className="progress-bar-bg" style={{ width: 50 }}><div className="progress-bar-fill t2" style={{ width: `${p2}%` }} /></div>
                        <span style={{ fontSize: 11, color: 'var(--text2)' }}>{p2}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <div style={{ fontSize: 11, color: 'var(--text2)', marginTop: 8 }}>B = Big · S = Small · numbers show done/total</div>
      </div>

      {/* Date-wise */}
      <div className="date-section">
        <div className="card">
          <div className="section-title" style={{ color: 'var(--t1)' }}>🟣 Thaali 1 — Daily Activity</div>
          {t1DateWise.length === 0 ? <p style={{ color: 'var(--text2)', fontSize: 13 }}>No stickers marked yet.</p> : (
            <table>
              <thead><tr><th>Date</th><th>Stickers Done</th></tr></thead>
              <tbody>{t1DateWise.map(r => (
                <tr key={r.date}>
                  <td style={{ fontWeight: 600 }}>{fmt(r.date)}</td>
                  <td><span style={{ color: 'var(--t1)', fontWeight: 700 }}>{r.count}</span> <span style={{ fontSize: 11, color: 'var(--text2)' }}>stickers</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
        <div className="card">
          <div className="section-title" style={{ color: 'var(--t2)' }}>🟡 Thaali 2 — Daily Activity</div>
          {t2DateWise.length === 0 ? <p style={{ color: 'var(--text2)', fontSize: 13 }}>No stickers marked yet.</p> : (
            <table>
              <thead><tr><th>Date</th><th>Stickers Done</th></tr></thead>
              <tbody>{t2DateWise.map(r => (
                <tr key={r.date}>
                  <td style={{ fontWeight: 600 }}>{fmt(r.date)}</td>
                  <td><span style={{ color: 'var(--t2)', fontWeight: 700 }}>{r.count}</span> <span style={{ fontSize: 11, color: 'var(--text2)' }}>stickers</span></td>
                </tr>
              ))}</tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
