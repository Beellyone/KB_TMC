import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface Specification { id: number; executor_id: number; valid_from: string; valid_until: string; }
interface SpecMotherTmc { id: number; specification_id: number; mother_tmc_id: number; }
interface MotherTmc { id: number; code: string; name: string; }

export default function SpecificationDetail() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [spec, setSpec] = useState<Specification | null>(null);
  const [smtList, setSmtList] = useState<SpecMotherTmc[]>([]);
  const [mothers, setMothers] = useState<MotherTmc[]>([]);
  const [addMotherId, setAddMotherId] = useState(0);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [sp, smts, m] = await Promise.all([
      api.get<Specification>(`/specifications/${id}`),
      api.get<SpecMotherTmc[]>(`/specifications/${id}/mother-tmcs`),
      api.get<MotherTmc[]>('/tmc/mothers'),
    ]);
    setSpec(sp);
    setSmtList(smts);
    setMothers(m);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const motherById = (mid: number) => mothers.find(m => m.id === mid);
  const addedIds = new Set(smtList.map(s => s.mother_tmc_id));
  const available = mothers.filter(m => !addedIds.has(m.id));

  const addMother = async () => {
    if (!addMotherId) return;
    setError('');
    try {
      await api.post(`/specifications/${id}/mother-tmcs`, { mother_tmc_id: addMotherId });
      setAddMotherId(0);
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const removeMother = async (smtId: number) => {
    if (!confirm('Убрать материнский ТМЦ из спецификации? Все работы будут удалены.')) return;
    try { await api.delete(`/specifications/${id}/mother-tmcs/${smtId}`); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const s = {
    card: { background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, padding: 24, marginBottom: 24 } as React.CSSProperties,
    select: { padding: '8px 12px', border: `1px solid ${theme.inputBorder}`, borderRadius: 8, fontSize: 14, background: theme.inputBg, color: theme.text, outline: 'none' } as React.CSSProperties,
    btn: { padding: '8px 16px', background: theme.accent, color: theme.accentText, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    btnDanger: { padding: '6px 12px', background: 'none', color: theme.danger, border: `1px solid ${theme.danger}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' } as React.CSSProperties,
    btnSecondary: { padding: '6px 12px', background: 'none', color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' } as React.CSSProperties,
    backBtn: { background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16, fontFamily: 'inherit' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 } as React.CSSProperties,
    th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, fontWeight: 500, fontSize: 13 } as React.CSSProperties,
    td: { padding: '10px 12px', borderBottom: `1px solid ${theme.border}` } as React.CSSProperties,
    label: { display: 'block', marginBottom: 4, fontSize: 12, color: theme.textSecondary } as React.CSSProperties,
    error: { color: theme.danger, marginBottom: 12, padding: '10px 14px', background: `${theme.danger}15`, borderRadius: 6, fontSize: 14 } as React.CSSProperties,
    info: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 } as React.CSSProperties,
    row: { cursor: 'pointer', transition: 'background 0.1s' } as React.CSSProperties,
    form: { display: 'flex', gap: 10, alignItems: 'flex-end', marginBottom: 20 } as React.CSSProperties,
  };

  if (!spec) return <div style={{ textAlign: 'center', padding: 80, color: theme.textSecondary }}>Загрузка...</div>;

  return (
    <div>
      <button style={s.backBtn} onClick={() => navigate('/specifications')}>← Назад к спецификациям</button>

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📑 Спецификация #{spec.id}</h3>
        <div style={s.info}>
          <div><span style={s.label}>Подрядчик</span><strong>#{spec.executor_id}</strong></div>
          <div><span style={s.label}>Действует с</span><strong>{spec.valid_from}</strong></div>
          <div><span style={s.label}>Действует по</span><strong>{spec.valid_until}</strong></div>
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Материнские ТМЦ</h3>

        <div style={s.form}>
          <div>
            <span style={s.label}>Добавить материнский ТМЦ</span>
            <select value={addMotherId} onChange={e => setAddMotherId(Number(e.target.value))} style={s.select}>
              <option value={0} disabled>Выберите</option>
              {available.map(m => <option key={m.id} value={m.id}>{m.code} — {m.name}</option>)}
            </select>
          </div>
          <button style={s.btn} onClick={addMother} disabled={!addMotherId}>Добавить</button>
        </div>

        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Код</th>
              <th style={s.th}>Наименование</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {smtList.map(smt => {
              const m = motherById(smt.mother_tmc_id);
              return (
                <tr key={smt.id} style={s.row}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/specifications/${id}/mother-tmc/${smt.id}`)}>
                  <td style={s.td}>{m?.code || '—'}</td>
                  <td style={s.td}>{m?.name || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={() => navigate(`/specifications/${id}/mother-tmc/${smt.id}`)}>Работы</button>
                      <button style={s.btnDanger} onClick={() => removeMother(smt.id)}>Убрать</button>
                    </span>
                  </td>
                </tr>
              );
            })}
            {smtList.length === 0 && (
              <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={3}>Нет материнских ТМЦ</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
