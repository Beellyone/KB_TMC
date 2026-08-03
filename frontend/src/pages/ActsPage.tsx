import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface Act {
  id: number;
  number: string;
  executor_id: number;
  file_name: string;
  attention_mark: string;
  status: string;
  created_at: string;
}

interface Executor { id: number; warehouse_id: number; contragent_id: number; }
interface Contragent { id: number; name: string; }
interface Warehouse { id: number; name: string; }

interface PreviewRow {
  row_number: number;
  tmc_code: string;
  serial_number: string;
  fault_description: string;
  tmc_id: number | null;
  tmc_name: string | null;
}

interface PreviewError { row_number: number; field: string; message: string; }
interface PreviewWarning { row_number: number; field: string; message: string; is_guarantee: boolean; }

interface Preview {
  rows: PreviewRow[];
  errors: PreviewError[];
  warnings: PreviewWarning[];
  file_name: string;
  executor_id: number;
  act_number: string;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый', CHECKING: 'Проверка', DONE: 'Выполнен', COMPLETE: 'Завершён', DECLINED: 'Отклонён',
};

export default function ActsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [acts, setActs] = useState<Act[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [contragents, setContragents] = useState<Contragent[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [form, setForm] = useState({ executor_id: 0, number: '' });
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [a, e, c, w] = await Promise.all([
      api.get<Act[]>('/acts'),
      api.get<Executor[]>('/contractors/executors'),
      api.get<Contragent[]>('/contractors/contragents'),
      api.get<Warehouse[]>('/warehouses'),
    ]);
    setActs(a); setExecutors(e); setContragents(c); setWarehouses(w);
  }, []);

  useEffect(() => { load(); }, [load]);

  const executorLabel = (id: number) => {
    const ex = executors.find(e => e.id === id);
    if (!ex) return '—';
    const c = contragents.find(c => c.id === ex.contragent_id)?.name || '?';
    const w = warehouses.find(w => w.id === ex.warehouse_id)?.name || '?';
    return `${c} → ${w}`;
  };

  const uploadFile = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('act_number', form.number);
      fd.append('executor_id', String(form.executor_id));
      const result = await api.upload<Preview>('/acts/upload', fd);
      setPreview(result);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    } finally { setLoading(false); }
  };

  const confirmAct = async () => {
    if (!preview) return;
    setError('');
    setLoading(true);
    try {
      const created = await api.post<Act>('/acts/confirm', {
        number: preview.act_number,
        executor_id: preview.executor_id,
        file_name: preview.file_name,
        rows: preview.rows,
      });
      setPreview(null);
      setFile(null);
      setForm({ executor_id: 0, number: '' });
      navigate(`/acts/${created.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка создания');
    } finally { setLoading(false); }
  };

  const deleteAct = async (id: number) => {
    if (!confirm('Удалить акт?')) return;
    try { await api.delete(`/acts/${id}`); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const errorRows = new Set(preview?.errors.map(e => e.row_number) || []);
  const warnRows = new Set(preview?.warnings.filter(w => w.is_guarantee).map(w => w.row_number) || []);

  const s = {
    card: { background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, padding: 24, marginBottom: 24 } as React.CSSProperties,
    input: { padding: '8px 12px', border: `1px solid ${theme.inputBorder}`, borderRadius: 8, fontSize: 14, background: theme.inputBg, color: theme.text, outline: 'none' } as React.CSSProperties,
    select: { padding: '8px 12px', border: `1px solid ${theme.inputBorder}`, borderRadius: 8, fontSize: 14, background: theme.inputBg, color: theme.text, outline: 'none' } as React.CSSProperties,
    btn: { padding: '8px 16px', background: theme.accent, color: theme.accentText, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    btnDanger: { padding: '6px 12px', background: 'none', color: theme.danger, border: `1px solid ${theme.danger}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' } as React.CSSProperties,
    btnSecondary: { padding: '6px 12px', background: 'none', color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 } as React.CSSProperties,
    th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, fontWeight: 500, fontSize: 13 } as React.CSSProperties,
    td: { padding: '10px 12px', borderBottom: `1px solid ${theme.border}` } as React.CSSProperties,
    form: { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' as const, marginBottom: 20 } as React.CSSProperties,
    label: { display: 'block', marginBottom: 4, fontSize: 12, color: theme.textSecondary } as React.CSSProperties,
    error: { color: theme.danger, marginBottom: 12, padding: '10px 14px', background: `${theme.danger}15`, borderRadius: 6, fontSize: 14 } as React.CSSProperties,
    row: { cursor: 'pointer', transition: 'background 0.1s' } as React.CSSProperties,
    errorRow: { background: `${theme.danger}12` } as React.CSSProperties,
    warnRow: { background: `${theme.success}12` } as React.CSSProperties,
    badge: (status: string) => {
      const colors: Record<string, string> = { NEW: theme.accent, CHECKING: theme.textSecondary, DONE: theme.success, COMPLETE: theme.success, DECLINED: theme.danger };
      return { display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${colors[status] || theme.textSecondary}20`, color: colors[status] || theme.textSecondary } as React.CSSProperties;
    },
    attentionBadge: { display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontSize: 10, fontWeight: 700, background: `${theme.danger}20`, color: theme.danger, marginLeft: 6 } as React.CSSProperties,
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>📋 Акты</h2>
      {error && <div style={s.error}>{error}</div>}

      {!preview && (
        <div style={s.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Создать акт</h3>
          <form onSubmit={uploadFile} style={s.form}>
            <div>
              <span style={s.label}>Подрядчик *</span>
              <select value={form.executor_id} onChange={e => setForm(f => ({ ...f, executor_id: Number(e.target.value) }))} required style={s.select}>
                <option value={0} disabled>Выберите</option>
                {executors.map(ex => <option key={ex.id} value={ex.id}>{executorLabel(ex.id)}</option>)}
              </select>
            </div>
            <div>
              <span style={s.label}>Номер акта *</span>
              <input value={form.number} onChange={e => setForm(f => ({ ...f, number: e.target.value }))} required placeholder="26-08-001" style={{ ...s.input, width: 140 }} />
            </div>
            <div>
              <span style={s.label}>Excel файл *</span>
              <input type="file" accept=".xls,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} required style={{ ...s.input, width: 220 }} />
            </div>
            <button type="submit" style={s.btn} disabled={loading}>{loading ? 'Загрузка...' : 'Загрузить'}</button>
          </form>
        </div>
      )}

      {preview && (
        <div style={s.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Превью акта: {preview.act_number}</h3>

          {preview.errors.length > 0 && (
            <div style={{ ...s.error, marginBottom: 16 }}>
              <strong>Ошибки ({preview.errors.length}):</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {preview.errors.map((e, i) => <li key={i}>Строка {e.row_number}: {e.message}</li>)}
              </ul>
            </div>
          )}

          {preview.warnings.length > 0 && (
            <div style={{ color: theme.success, marginBottom: 16, padding: '10px 14px', background: `${theme.success}15`, borderRadius: 6, fontSize: 14 }}>
              <strong>Предупреждения ({preview.warnings.length}):</strong>
              <ul style={{ margin: '8px 0 0', paddingLeft: 20 }}>
                {preview.warnings.map((w, i) => <li key={i}>Строка {w.row_number}: {w.message}</li>)}
              </ul>
            </div>
          )}

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Код ТМЦ</th>
                <th style={s.th}>ТМЦ</th>
                <th style={s.th}>Серийный номер</th>
                <th style={s.th}>Неисправность</th>
              </tr>
            </thead>
            <tbody>
              {preview.rows.map(row => {
                const isError = errorRows.has(row.row_number);
                const isWarn = !isError && warnRows.has(row.row_number);
                const rowStyle = isError ? s.errorRow : isWarn ? s.warnRow : undefined;
                return (
                  <tr key={row.row_number} style={rowStyle}>
                    <td style={s.td}>{row.row_number}</td>
                    <td style={s.td}>{row.tmc_code}</td>
                    <td style={s.td}>{row.tmc_name || '—'}</td>
                    <td style={s.td}>{row.serial_number}</td>
                    <td style={s.td}>{row.fault_description || '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
            <button style={s.btn} onClick={confirmAct} disabled={preview.errors.length > 0 || loading}>
              {loading ? 'Создание...' : `Подтвердить и создать (${preview.rows.length - preview.errors.length} ремонтов)`}
            </button>
            <button style={s.btnSecondary} onClick={() => setPreview(null)}>Отмена</button>
          </div>
        </div>
      )}

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Акты</h3>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Номер</th>
              <th style={s.th}>Подрядчик</th>
              <th style={s.th}>Статус</th>
              <th style={s.th}>Дата</th>
              <th style={s.th}>Файл</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {acts.map(a => (
              <tr key={a.id} style={s.row}
                onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceHover)}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                onClick={() => navigate(`/acts/${a.id}`)}>
                <td style={s.td}>
                  <strong>{a.number}</strong>
                  {a.attention_mark === 'ATTENTION' && <span style={s.attentionBadge}>!</span>}
                </td>
                <td style={s.td}>{executorLabel(a.executor_id)}</td>
                <td style={s.td}><span style={s.badge(a.status)}>{STATUS_LABELS[a.status] || a.status}</span></td>
                <td style={s.td}>{a.created_at.split('T')[0]}</td>
                <td style={s.td}>{a.file_name}</td>
                <td style={{ ...s.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                  <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                    <button style={s.btnSecondary} onClick={() => navigate(`/acts/${a.id}`)}>Открыть</button>
                    <button style={s.btnDanger} onClick={() => deleteAct(a.id)}>Удалить</button>
                  </span>
                </td>
              </tr>
            ))}
            {acts.length === 0 && (
              <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={6}>Нет актов</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
