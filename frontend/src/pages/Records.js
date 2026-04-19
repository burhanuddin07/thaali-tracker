import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCircle2, Circle, Search } from 'lucide-react';
import api from '../api';

function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function Records() {
  const [searchInput, setSearchInput] = useState('');
  const [centre, setCentre] = useState('all');
  const [size, setSize] = useState('all');
  const searchRef = useRef(null);
  const qc = useQueryClient();

  const search = useDebounce(searchInput, 400);

  const { data: centres = [] } = useQuery({
    queryKey: ['centres'],
    queryFn: () => api.get('/centres').then(r => r.data),
  });

  const { data: sizes = [] } = useQuery({
    queryKey: ['sizes'],
    queryFn: () => api.get('/sizes').then(r => r.data),
  });

  const { data: records = [], isLoading, isFetching } = useQuery({
    queryKey: ['records', centre, size, search],
    queryFn: () => api.get('/records', {
      params: {
        centre: centre !== 'all' ? centre : undefined,
        size: size !== 'all' ? size : undefined,
        search: search || undefined,
      }
    }).then(r => r.data),
    keepPreviousData: true,
  });

  const markMutation = useMutation({
    mutationFn: ({ id, thaali, done }) => api.patch(`/records/${id}/thaali`, { thaali, done }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries(['records']);
      qc.invalidateQueries(['stats']);
      toast.success(`Thaali ${vars.thaali} ${vars.done ? '✅ marked done' : '↩️ unmarked'}`);
    },
    onError: () => toast.error('Failed to update'),
  });

  const toggle = (record, thaali) => {
    const currentDone = thaali === 1 ? record.thaali1_done : record.thaali2_done;
    markMutation.mutate({ id: record.id, thaali, done: !currentDone });
  };

  const fmt = (d) => d ? new Date(d).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }) : '';

  const t1Done = records.filter(r => r.thaali1_done).length;
  const t2Done = records.filter(r => r.thaali2_done).length;

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">All Records</div>
          <div className="page-sub">
            {records.length} records shown
            {isFetching && !isLoading && <span style={{ color: 'var(--text2)', marginLeft: 8, fontSize: 12 }}>updating...</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <div style={{ background: 'var(--t1-dim)', border: '1px solid var(--t1)', borderRadius: 8, padding: '6px 14px', fontSize: 13 }}>
            <span style={{ color: 'var(--t1)', fontWeight: 700 }}>T1:</span>
            <span style={{ marginLeft: 6, color: 'var(--green)' }}>{t1Done} ✓</span>
            <span style={{ marginLeft: 6, color: 'var(--amber)' }}>{records.length - t1Done} pending</span>
          </div>
          <div style={{ background: 'var(--t2-dim)', border: '1px solid var(--t2)', borderRadius: 8, padding: '6px 14px', fontSize: 13 }}>
            <span style={{ color: 'var(--t2)', fontWeight: 700 }}>T2:</span>
            <span style={{ marginLeft: 6, color: 'var(--green)' }}>{t2Done} ✓</span>
            <span style={{ marginLeft: 6, color: 'var(--amber)' }}>{records.length - t2Done} pending</span>
          </div>
        </div>
      </div>

      <div className="filters">
        <div style={{ position: 'relative', flex: 1, maxWidth: 280 }}>
          <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text2)' }} />
          <input
            ref={searchRef}
            className="search-input"
            style={{ paddingLeft: 34, paddingRight: 28, width: '100%' }}
            placeholder="Search name, sabeel no..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            autoComplete="off"
          />
          {searchInput && (
            <button onClick={() => { setSearchInput(''); searchRef.current?.focus(); }}
              style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text2)', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>
              ×
            </button>
          )}
        </div>

        <select className="select-input" value={centre} onChange={e => setCentre(e.target.value)}>
          <option value="all">All Centres</option>
          {centres.map(c => <option key={c} value={c}>{c}</option>)}
        </select>

        <select className="select-input" value={size} onChange={e => setSize(e.target.value)}>
          <option value="all">All Sizes</option>
          {sizes.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
        </select>

        {(centre !== 'all' || size !== 'all' || searchInput) && (
          <button className="btn btn-outline" style={{ fontSize: 12 }}
            onClick={() => { setCentre('all'); setSize('all'); setSearchInput(''); }}>
            ✕ Clear all
          </button>
        )}
      </div>

      <div className="card">
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Sabeel No</th>
                <th>Full Name</th>
                <th>Size</th>
                <th>Centre</th>
                <th>Contact</th>
                <th style={{ color: 'var(--t1)' }}>🟣 Thaali 1</th>
                <th style={{ color: 'var(--t2)' }}>🟡 Thaali 2</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px' }}>
                  <div className="dot-loader" style={{ justifyContent: 'center' }}><span/><span/><span/></div>
                </td></tr>
              ) : records.length === 0 ? (
                <tr><td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text2)' }}>
                  No records found.{(searchInput || centre !== 'all' || size !== 'all') && ' Try clearing filters.'}
                </td></tr>
              ) : records.map((r, i) => (
                <tr key={r.id}>
                  <td style={{ color: 'var(--text2)', fontSize: 12 }}>{i + 1}</td>
                  <td style={{ fontWeight: 600, fontFamily: 'monospace', fontSize: 13 }}>{r.sabeel_no || '—'}</td>
                  <td style={{ fontWeight: 600 }}>{r.full_name}</td>
                  <td>
                    <span className="badge" style={{
                      background: r.size?.toLowerCase() === 'big' ? 'rgba(108,99,255,0.15)' : r.size?.toLowerCase() === 'small' ? 'rgba(245,158,11,0.15)' : 'var(--bg3)',
                      color: r.size?.toLowerCase() === 'big' ? 'var(--t1)' : r.size?.toLowerCase() === 'small' ? 'var(--t2)' : 'var(--text2)',
                    }}>
                      {r.size || '—'}
                    </span>
                  </td>
                  <td><span className="badge centre">{r.centre || '—'}</span></td>
                  <td style={{ fontSize: 12, color: 'var(--text2)' }}>{r.contact_no || '—'}</td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <button className={`toggle-btn ${r.thaali1_done ? 'done-t1' : 'pending-t1'}`}
                        onClick={() => toggle(r, 1)} disabled={markMutation.isPending}>
                        {r.thaali1_done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {r.thaali1_done ? 'Done' : 'Pending'}
                      </button>
                      {r.thaali1_date && <span style={{ fontSize: 10, color: 'var(--text2)', paddingLeft: 4 }}>{fmt(r.thaali1_date)}</span>}
                    </div>
                  </td>
                  <td>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                      <button className={`toggle-btn ${r.thaali2_done ? 'done-t2' : 'pending-t2'}`}
                        onClick={() => toggle(r, 2)} disabled={markMutation.isPending}>
                        {r.thaali2_done ? <CheckCircle2 size={14} /> : <Circle size={14} />}
                        {r.thaali2_done ? 'Done' : 'Pending'}
                      </button>
                      {r.thaali2_date && <span style={{ fontSize: 10, color: 'var(--text2)', paddingLeft: 4 }}>{fmt(r.thaali2_date)}</span>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
