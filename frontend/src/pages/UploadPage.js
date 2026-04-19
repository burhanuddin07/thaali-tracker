import React, { useState, useRef } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Upload, FileSpreadsheet, CheckCircle2, AlertCircle } from 'lucide-react';
import api from '../api';

export default function UploadPage({ onSuccess }) {
  const [drag, setDrag] = useState(false);
  const [result, setResult] = useState(null);
  const inputRef = useRef();
  const qc = useQueryClient();

  const uploadMutation = useMutation({
    mutationFn: (file) => {
      const fd = new FormData();
      fd.append('file', file);
      return api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
    },
    onSuccess: (res) => {
      setResult({ success: true, imported: res.data.imported });
      qc.invalidateQueries(['records']);
      qc.invalidateQueries(['stats']);
      qc.invalidateQueries(['centres']);
      toast.success(`✅ Imported ${res.data.imported} records!`);
    },
    onError: (err) => {
      setResult({ success: false, error: err.response?.data?.error || 'Upload failed' });
      toast.error('Upload failed');
    },
  });

  const handleFile = (file) => {
    if (!file) return;
    if (!file.name.match(/\.(xlsx|xls)$/i)) {
      toast.error('Please upload an Excel file (.xlsx or .xls)');
      return;
    }
    setResult(null);
    uploadMutation.mutate(file);
  };

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="page-title">Upload Excel</div>
          <div className="page-sub">Import your Sabeel data from Excel (.xlsx / .xls)</div>
        </div>
      </div>

      <div className="card" style={{ maxWidth: 600 }}>
        <div
          className={`upload-area ${drag ? 'drag' : ''}`}
          onClick={() => inputRef.current.click()}
          onDragOver={e => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={e => { e.preventDefault(); setDrag(false); handleFile(e.dataTransfer.files[0]); }}
        >
          {uploadMutation.isPending ? (
            <>
              <div className="dot-loader" style={{ justifyContent: 'center', marginBottom: 12 }}>
                <span/><span/><span/>
              </div>
              <h3>Importing records...</h3>
              <p>Please wait</p>
            </>
          ) : (
            <>
              <FileSpreadsheet size={48} />
              <h3>Drop your Excel file here</h3>
              <p>or click to browse — supports .xlsx and .xls</p>
            </>
          )}
        </div>
        <input
          ref={inputRef} type="file" accept=".xlsx,.xls"
          style={{ display: 'none' }}
          onChange={e => handleFile(e.target.files[0])}
        />

        {result && (
          <div style={{
            marginTop: 20, padding: '16px 20px', borderRadius: 10,
            background: result.success ? 'var(--green-dim)' : 'var(--red-dim)',
            border: `1px solid ${result.success ? 'var(--green)' : 'var(--red)'}`,
            display: 'flex', alignItems: 'center', gap: 12
          }}>
            {result.success
              ? <CheckCircle2 size={20} color="var(--green)" />
              : <AlertCircle size={20} color="var(--red)" />
            }
            <div>
              {result.success
                ? <><strong>{result.imported} records</strong> imported successfully. Previous data replaced.</>
                : <><strong>Error:</strong> {result.error}</>
              }
            </div>
          </div>
        )}

        {result?.success && (
          <button className="btn btn-primary" style={{ marginTop: 16, width: '100%' }} onClick={onSuccess}>
            Go to Dashboard →
          </button>
        )}

        <div style={{ marginTop: 24, background: 'var(--bg3)', borderRadius: 8, padding: '16px 20px' }}>
          <div style={{ fontWeight: 700, marginBottom: 8, fontSize: 14 }}>📋 Expected Excel Columns</div>
          <div style={{ fontSize: 13, color: 'var(--text2)', lineHeight: 1.8 }}>
            Your Excel should have these column headers (case-insensitive):
          </div>
          <div style={{ marginTop: 8, display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {['SABEEL NO', 'Full Name', 'SIZE', 'Centres', 'THALI', 'Contact No'].map(col => (
              <span key={col} style={{
                background: 'var(--bg2)', border: '1px solid var(--border)',
                padding: '2px 10px', borderRadius: 4, fontSize: 12, fontFamily: 'monospace'
              }}>{col}</span>
            ))}
          </div>
          <div style={{ marginTop: 10, fontSize: 12, color: 'var(--text2)' }}>
            ⚠️ Uploading a new file will <strong>replace all existing records</strong> and reset all sticker statuses.
          </div>
        </div>
      </div>
    </div>
  );
}
