import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface Specification {
  id: number;
  executor_id: number;
  valid_from: string;
  valid_until: string;
}

interface Executor { id: number; warehouse_id: number; contragent_id: number; }
interface Contragent { id: number; name: string; }
interface Warehouse { id: number; name: string; }

export default function SpecificationsPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [specs, setSpecs] = useState<Specification[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [contragents, setContragents] = useState<Contragent[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [form, setForm] = useState({ executor_id: 0, valid_from: '', valid_until: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const [s, e, c, w] = await Promise.all([
      api.get<Specification[]>('/specifications'),
      api.get<Executor[]>('/contractors/executors'),
      api.get<Contragent[]>('/contractors/contragents'),
      api.get<Warehouse[]>('/warehouses'),
    ]);
    setSpecs(s); setExecutors(e); setContragents(c); setWarehouses(w);
  }, []);

  useEffect(() => { load(); }, [load]);

  const executorLabel = (id: number) => {
    const ex = executors.find(e => e.id === id);
    if (!ex) return '—';
    const c = contragents.find(c => c.id === ex.contragent_id)?.name || '?';
    const w = warehouses.find(w => w.id === ex.warehouse_id)?.name || '?';
    return `${c} → ${w}`;
  };

  const isExpired = (d: string) => new Date(d) < new Date();

  const createSpec = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const created = await api.post<Specification>('/specifications', {
        executor_id: Number(form.executor_id), valid_from: form.valid_from, valid_until: form.valid_until,
      });
      setForm({ executor_id: 0, valid_from: '', valid_until: '' });
      navigate(`/specifications/${created.id}`);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteSpec = async (id: number) => {
    if (!confirm('Удалить спецификацию?')) return;
    try { await api.delete(`/specifications/${id}`); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

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
    badge: (expired: boolean) => ({
      display: 'inline-block', padding: '2px 8px', borderRadius: 4, fontSize: 11, fontWeight: 600,
      background: expired ? `${theme.danger}20` : `${theme.success}20`,
      color: expired ? theme.danger : theme.success,
    }) as React.CSSProperties,
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>📑 Спецификации</h2>
      {error && <div style={s.error}>{error}</div>}

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Новая спецификация</h3>
        <form onSubmit={createSpec} style={s.form}>
          <div>
            <span style={s.label}>Подрядчик *</span>
            <select value={form.executor_id} onChange={e => setForm(f => ({ ...f, executor_id: Number(e.target.value) }))} required style={s.select}>
              <option value={0} disabled>Выберите</option>
              {executors.map(ex => <option key={ex.id} value={ex.id}>{executorLabel(ex.id)}</option>)}
            </select>
          </div>
          <div>
            <span style={s.label}>Действует с *</span>
            <input type="date" value={form.valid_from} onChange={e => setForm(f => ({ ...f, valid_from: e.target.value }))} required style={s.input} />
          </div>
          <div>
            <span style={s.label}>Действует по *</span>
            <input type="date" value={form.valid_until} onChange={e => setForm(f => ({ ...f, valid_until: e.target.value }))} required style={s.input} />
          </div>
          <button type="submit" style={s.btn}>Создать</button>
        </form>
      </div>

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Спецификации</h3>
        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>#</th>
              <th style={s.th}>Подрядчик</th>
              <th style={s.th}>Период</th>
              <th style={s.th}>Статус</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {specs.map(sp => {
              const expired = isExpired(sp.valid_until);
              return (
                <tr key={sp.id} style={s.row}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/specifications/${sp.id}`)}>
                  <td style={s.td}>{sp.id}</td>
                  <td style={s.td}>{executorLabel(sp.executor_id)}</td>
                  <td style={s.td}>{sp.valid_from} — {sp.valid_until}</td>
                  <td style={s.td}><span style={s.badge(expired)}>{expired ? 'Истекла' : 'Действует'}</span></td>
                  <td style={{ ...s.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={() => navigate(`/specifications/${sp.id}`)}>Открыть</button>
                      <button style={s.btnDanger} onClick={() => deleteSpec(sp.id)}>Удалить</button>
                    </span>
                  </td>
                </tr>
              );
            })}
            {specs.length === 0 && (
              <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={5}>Нет спецификаций</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
