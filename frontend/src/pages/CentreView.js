import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, ChevronDown, ChevronUp, CheckCheck } from 'lucide-react';
import api from '../api';

export default function CentreView() {
  const [expanded, setExpanded] = useState({});
  const [sizeFilter, setSizeFilter] = useState('all');
  const qc = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['stats'],
    queryFn: () => api.get('/stats').then(r => r.data),
    refetchInterval: 10000,
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ['sizes'],
    queryFn: () => api.get('/sizes').then(r => r.data),
  });

  const { data: allRecords = [] } = useQuery({
    queryKey: ['records', 'all', sizeFilter],
    queryFn: () => api.get('/records', {
      params: { size: sizeFilter !== 'all' ? sizeFilter : undefined }
    }).then(r => r.data),
  });

  const markMutation = useMutation({
    mutationFn: ({ id, thaali, done }) => api.patch(`/records/${id}/thaali`, { thaali, done }),
    onSuccess: () => {
      qc.invalidateQueries(['records']);
      qc.invalidateQueries(['stats']);
    },
    onError: () => toast.error('Failed to update'),
  });

  const bulkMutation = useMutation({
    mutationFn: ({ thaali, done, centre, size }) => api.patch('/records/bulk/thaali', { thaali, done, centre, size }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['records']);
      qc.invalidateQueries(['stats']);
      const sizeLabel = vars.size && vars.size !== 'all' ? ` (${vars.size})` : '';
      toast.success(`Thaali ${vars.thaali}${sizeLabel} in ${vars.centre} marked done ✅`);
    },
  });

  const toggle = (record, thaali) => {
    const currentDone = thaali === 1 ? record.thaali1_done : record.thaali2_done;
    markMutation.mutate({ id: record.id, thaali, done: !currentDone });
  };

  // Group visible records by centre
  const recordsByCentre = allRecords.reduce((acc, r) => {
    const key = r.centre || '(No Centre)';
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  // Build centre stats from the filtered records (so size filter reflects in cards)
  const centreKeys = Object.keys(recordsByCentre).sort();

  const toggleExpand = (name) => setExpanded(e => ({ ...e, [name]: !e[name] }));

  const getSizeLabel = (s) => s ? s.charAt(0).toUpperCase() + s.slice(1) : s;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Centre View</div>
          <div className="page-sub">Manage stickers centre by centre</div>
        </div>
        {/* Size filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 13, color: 'var(--text2)' }}>Size:</span>
          <div style={{ display: 'flex', gap: 6 }}>
            {['all', ...sizes].map(s => (
              <button key={s} onClick={() => setSizeFilter(s)}
                style={{
                  padding: '6px 14px', borderRadius: 20, fontSize: 13, fontWeight: 600, cursor: 'pointer', border: '2px solid',
                  borderColor: sizeFilter === s ? (s === 'big' ? 'var(--t1)' : s === 'small' ? 'var(--t2)' : 'var(--accent)') : 'var(--border)',
                  background: sizeFilter === s ? (s === 'big' ? 'rgba(108,99,255,0.15)' : s === 'small' ? 'rgba(245,158,11,0.15)' : 'rgba(108,99,255,0.1)') : 'transparent',
                  color: sizeFilter === s ? (s === 'big' ? 'var(--t1)' : s === 'small' ? 'var(--t2)' : 'var(--accent)') : 'var(--text2)',
                  transition: 'all 0.15s',
                }}>
                {s === 'all' ? 'All Sizes' : getSizeLabel(s)}
              </button>
            ))}
          </div>
        </div>
      </div>

      {centreKeys.length === 0 && (
        <div className="empty-state"><p>No data yet. Please upload your Excel file first.</p></div>
      )}

      <div className="centre-grid">
        {centreKeys.map(name => {
          const recs = recordsByCentre[name] || [];
          const isOpen = expanded[name];

          // Compute stats from current filtered records
          const total = recs.length;
          const bigRecs = recs.filter(r => r.size?.toLowerCase() === 'big');
          const smallRecs = recs.filter(r => r.size?.toLowerCase() === 'small');
          const t1Done = recs.filter(r => r.thaali1_done).length;
          const t2Done = recs.filter(r => r.thaali2_done).length;
          const t1BigDone = bigRecs.filter(r => r.thaali1_done).length;
          const t1SmallDone = smallRecs.filter(r => r.thaali1_done).length;
          const t2BigDone = bigRecs.filter(r => r.thaali2_done).length;
          const t2SmallDone = smallRecs.filter(r => r.thaali2_done).length;
          const p1 = total ? Math.round((t1Done / total) * 100) : 0;
          const p2 = total ? Math.round((t2Done / total) * 100) : 0;

          return (
            <div key={name} className="centre-card">
              <div className="centre-card-header">
                <div>
                  <div className="centre-name">{name}</div>
                  <div className="centre-total">
                    {total} members
                    {sizeFilter === 'all' && bigRecs.length > 0 && smallRecs.length > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 11 }}>
                        (<span style={{ color: 'var(--t1)' }}>{bigRecs.length}B</span> · <span style={{ color: 'var(--t2)' }}>{smallRecs.length}S</span>)
                      </span>
                    )}
                  </div>
                </div>
                <button className="btn btn-outline" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => toggleExpand(name)}>
                  {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
              </div>

              {/* Thaali 1 */}
              <div className="centre-row">
                <div>
                  <div className="centre-row-label" style={{ color: 'var(--t1)' }}>🟣 Thaali 1</div>
                  <div className="centre-row-nums">
                    {t1Done} done · {total - t1Done} pending
                    {sizeFilter === 'all' && bigRecs.length > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text2)' }}>
                        | <span style={{ color: 'var(--t1)' }}>{t1BigDone}/{bigRecs.length}B</span> · <span style={{ color: 'var(--t2)' }}>{t1SmallDone}/{smallRecs.length}S</span>
                      </span>
                    )}
                  </div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px', gap: 4 }}
                  onClick={() => bulkMutation.mutate({ thaali: 1, done: true, centre: name, size: sizeFilter !== 'all' ? sizeFilter : undefined })}
                  title={`Mark all T1 ${sizeFilter !== 'all' ? `(${sizeFilter})` : ''} done in ${name}`}>
                  <CheckCheck size={13} /> All Done
                </button>
              </div>
              <div className="progress-bar-bg" style={{ marginBottom: 12 }}>
                <div className="progress-bar-fill t1" style={{ width: `${p1}%` }} />
              </div>

              {/* Thaali 2 */}
              <div className="centre-row">
                <div>
                  <div className="centre-row-label" style={{ color: 'var(--t2)' }}>🟡 Thaali 2</div>
                  <div className="centre-row-nums">
                    {t2Done} done · {total - t2Done} pending
                    {sizeFilter === 'all' && bigRecs.length > 0 && (
                      <span style={{ marginLeft: 6, fontSize: 11, color: 'var(--text2)' }}>
                        | <span style={{ color: 'var(--t1)' }}>{t2BigDone}/{bigRecs.length}B</span> · <span style={{ color: 'var(--t2)' }}>{t2SmallDone}/{smallRecs.length}S</span>
                      </span>
                    )}
                  </div>
                </div>
                <button className="btn btn-outline" style={{ fontSize: 11, padding: '4px 10px', gap: 4 }}
                  onClick={() => bulkMutation.mutate({ thaali: 2, done: true, centre: name, size: sizeFilter !== 'all' ? sizeFilter : undefined })}
                  title={`Mark all T2 ${sizeFilter !== 'all' ? `(${sizeFilter})` : ''} done in ${name}`}>
                  <CheckCheck size={13} /> All Done
                </button>
              </div>
              <div className="progress-bar-bg">
                <div className="progress-bar-fill t2" style={{ width: `${p2}%` }} />
              </div>

              {/* Expanded member list */}
              {isOpen && (
                <div style={{ marginTop: 16, borderTop: '1px solid var(--border)', paddingTop: 12 }}>
                  <div style={{ fontSize: 12, color: 'var(--text2)', marginBottom: 8 }}>
                    Members {sizeFilter !== 'all' && <span style={{ color: 'var(--accent)' }}>({getSizeLabel(sizeFilter)} only)</span>}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, maxHeight: 340, overflowY: 'auto' }}>
                    {recs.map(r => (
                      <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px', background: 'var(--bg3)', borderRadius: 8 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.full_name}</div>
                          <div style={{ fontSize: 11, color: 'var(--text2)', display: 'flex', gap: 6 }}>
                            {r.sabeel_no && <span>{r.sabeel_no}</span>}
                            {r.size && (
                              <span style={{
                                padding: '1px 6px', borderRadius: 4,
                                background: r.size?.toLowerCase() === 'big' ? 'rgba(108,99,255,0.15)' : 'rgba(245,158,11,0.15)',
                                color: r.size?.toLowerCase() === 'big' ? 'var(--t1)' : 'var(--t2)',
                                fontSize: 10, fontWeight: 600
                              }}>{r.size}</span>
                            )}
                          </div>
                        </div>
                        <button className={`toggle-btn ${r.thaali1_done ? 'done-t1' : 'pending-t1'}`}
                          style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => toggle(r, 1)}>
                          {r.thaali1_done ? <CheckCircle2 size={12} /> : <Circle size={12} />} T1
                        </button>
                        <button className={`toggle-btn ${r.thaali2_done ? 'done-t2' : 'pending-t2'}`}
                          style={{ padding: '4px 10px', fontSize: 11 }} onClick={() => toggle(r, 2)}>
                          {r.thaali2_done ? <CheckCircle2 size={12} /> : <Circle size={12} />} T2
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
