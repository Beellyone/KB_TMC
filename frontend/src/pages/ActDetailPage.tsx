import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface ActDetail {
  id: number;
  number: string;
  executor_id: number;
  file_name: string;
  attention_mark: string;
  status: string;
  created_at: string;
  dates: {
    diagnostics_date: string | null;
    verification_date: string | null;
    invoice_date: string | null;
    return_date: string | null;
    confirmation_date: string | null;
    completion_date: string | null;
  };
  repairs_count: number;
}

interface Repair {
  id: number;
  act_id: number;
  damaged_tmc_id: number;
  fault_description: string | null;
  cost_approval: string;
  state_qualification: string;
  attention_mark: string;
  price: number;
  tmc_code: string | null;
  tmc_name: string | null;
  serial_number: string | null;
}

const STATUS_LABELS: Record<string, string> = {
  NEW: 'Новый', CHECKING: 'Проверка', DONE: 'Выполнен', COMPLETE: 'Завершён', DECLINED: 'Отклонён',
};
const COST_LABELS: Record<string, string> = { DISAPPROVED: 'Не согласовано', APPROVED: 'Согласовано', GUARANTEE: 'Гарантия' };
const QUAL_LABELS: Record<string, string> = { UNCHECKED: 'Не проверено', UNQUALIFIED: 'Не квалифицировано', QUALIFIED: 'Квалифицировано' };

export default function ActDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [act, setAct] = useState<ActDetail | null>(null);
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    try {
      const [a, r] = await Promise.all([
        api.get<ActDetail>(`/acts/${id}`),
        api.get<Repair[]>(`/acts/${id}/repairs`),
      ]);
      setAct(a);
      setRepairs(r);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки');
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const updateStatus = async (status: string) => {
    try { await api.patch(`/acts/${id}`, { status }); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const updateDate = async (field: string, value: string) => {
    try { await api.patch(`/acts/${id}`, { dates: { [field]: value || null } }); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const updateRepair = async (repairId: number, data: Record<string, unknown>) => {
    try { await api.patch(`/acts/${id}/repairs/${repairId}`, data); await load(); }
    catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const s = {
    card: { background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, padding: 24, marginBottom: 24 } as React.CSSProperties,
    input: { padding: '6px 10px', border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 13, background: theme.inputBg, color: theme.text, outline: 'none' } as React.CSSProperties,
    select: { padding: '6px 10px', border: `1px solid ${theme.inputBorder}`, borderRadius: 6, fontSize: 13, background: theme.inputBg, color: theme.text, outline: 'none' } as React.CSSProperties,
    btn: { padding: '8px 16px', background: theme.accent, color: theme.accentText, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    backBtn: { background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16, fontFamily: 'inherit' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 13 } as React.CSSProperties,
    th: { textAlign: 'left' as const, padding: '8px 10px', borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, fontWeight: 500, fontSize: 12 } as React.CSSProperties,
    td: { padding: '8px 10px', borderBottom: `1px solid ${theme.border}` } as React.CSSProperties,
    label: { display: 'block', marginBottom: 4, fontSize: 12, color: theme.textSecondary } as React.CSSProperties,
    error: { color: theme.danger, marginBottom: 12, padding: '10px 14px', background: `${theme.danger}15`, borderRadius: 6, fontSize: 14 } as React.CSSProperties,
    info: { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 } as React.CSSProperties,
    dates: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginTop: 16 } as React.CSSProperties,
    guaranteeRow: { background: `${theme.success}10` } as React.CSSProperties,
    badge: (color: string) => ({ display: 'inline-block', padding: '2px 6px', borderRadius: 4, fontSize: 11, fontWeight: 600, background: `${color}20`, color }) as React.CSSProperties,
  };

  if (!act) return <div style={{ textAlign: 'center', padding: 80, color: theme.textSecondary }}>Загрузка...</div>;

  const statuses = ['NEW', 'CHECKING', 'DONE', 'COMPLETE', 'DECLINED'];

  return (
    <div>
      <button style={s.backBtn} onClick={() => navigate('/acts')}>← Назад к актам</button>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 18 }}>
            📋 Акт {act.number}
            {act.attention_mark === 'ATTENTION' && (
              <span style={{ fontSize: 12, color: theme.danger, fontWeight: 700, marginLeft: 8, background: `${theme.danger}15`, padding: '2px 8px', borderRadius: 4 }}>ТРЕБУЕТ ВНИМАНИЯ</span>
            )}
          </h3>
          <select value={act.status} onChange={e => updateStatus(e.target.value)} style={s.select}>
            {statuses.map(st => <option key={st} value={st}>{STATUS_LABELS[st]}</option>)}
          </select>
        </div>
        <div style={s.info}>
          <div><span style={s.label}>Подрядчик</span><strong>#{act.executor_id}</strong></div>
          <div><span style={s.label}>Файл</span><strong>{act.file_name}</strong></div>
          <div><span style={s.label}>Ремонтов</span><strong>{act.repairs_count}</strong></div>
          <div><span style={s.label}>Создан</span><strong>{act.created_at.split('T')[0]}</strong></div>
        </div>

        <div style={s.dates}>
          {[
            { key: 'diagnostics_date', label: 'Диагностика' },
            { key: 'verification_date', label: 'Проверка' },
            { key: 'invoice_date', label: 'Счёт' },
            { key: 'return_date', label: 'Возврат' },
            { key: 'confirmation_date', label: 'Подтверждение' },
            { key: 'completion_date', label: 'Завершение' },
          ].map(d => (
            <div key={d.key}>
              <span style={s.label}>{d.label}</span>
              <input type="date"
                value={act.dates[d.key as keyof typeof act.dates] || ''}
                onChange={e => updateDate(d.key, e.target.value)}
                style={{ ...s.input, width: '100%', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>
      </div>

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Ремонты</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Код ТМЦ</th>
                <th style={s.th}>ТМЦ</th>
                <th style={s.th}>Серийный №</th>
                <th style={s.th}>Неисправность</th>
                <th style={s.th}>Согласование</th>
                <th style={s.th}>Квалификация</th>
                <th style={s.th}>Цена</th>
              </tr>
            </thead>
            <tbody>
              {repairs.map(r => {
                const isGuarantee = r.cost_approval === 'GUARANTEE';
                return (
                  <tr key={r.id} style={isGuarantee ? s.guaranteeRow : undefined}>
                    <td style={s.td}>{r.tmc_code || '—'}</td>
                    <td style={s.td}>{r.tmc_name || '—'}</td>
                    <td style={s.td}>{r.serial_number || '—'}</td>
                    <td style={s.td}>{r.fault_description || '—'}</td>
                    <td style={s.td}>
                      <select value={r.cost_approval} onChange={e => updateRepair(r.id, { cost_approval: e.target.value })} style={s.select}>
                        <option value="DISAPPROVED">Не согласовано</option>
                        <option value="APPROVED">Согласовано</option>
                        <option value="GUARANTEE">Гарантия</option>
                      </select>
                    </td>
                    <td style={s.td}>
                      <select value={r.state_qualification} onChange={e => updateRepair(r.id, { state_qualification: e.target.value })} style={s.select}>
                        <option value="UNCHECKED">Не проверено</option>
                        <option value="UNQUALIFIED">Не квалиф.</option>
                        <option value="QUALIFIED">Квалифицировано</option>
                      </select>
                    </td>
                    <td style={s.td}>
                      <input type="number" min="0" step="0.01" value={r.price}
                        onChange={e => updateRepair(r.id, { price: Number(e.target.value) })}
                        style={{ ...s.input, width: 80, textAlign: 'right' }}
                      />
                    </td>
                  </tr>
                );
              })}
              {repairs.length === 0 && (
                <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={7}>Нет ремонтов</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
