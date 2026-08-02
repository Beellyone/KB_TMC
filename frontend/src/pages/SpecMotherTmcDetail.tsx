import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface BreakdownItem { id: number; code: string; name: string; source: string; }
interface SpecWork { id: number; breakdown_source: string; breakdown_id: number; price: number; }

export default function SpecMotherTmcDetail() {
  const { id, smtId } = useParams<{ id: string; smtId: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [breakdowns, setBreakdowns] = useState<BreakdownItem[]>([]);
  const [prices, setPrices] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id || !smtId) return;
    const [allBd, works] = await Promise.all([
      api.get<{ category_breakdowns: BreakdownItem[]; own_breakdowns: BreakdownItem[] }>(
        `/tmc/mothers/${id}/all-breakdowns`
      ).catch(() => ({ category_breakdowns: [], own_breakdowns: [] })),
      api.get<SpecWork[]>(`/specifications/${id}/mother-tmcs/${smtId}/works`),
    ]);
    const all = [...allBd.category_breakdowns, ...allBd.own_breakdowns];
    setBreakdowns(all);
    const pm: Record<string, string> = {};
    for (const w of works) pm[`${w.breakdown_source}:${w.breakdown_id}`] = String(w.price);
    setPrices(pm);
  }, [id, smtId]);

  useEffect(() => { load(); }, [load]);

  const setPrice = (key: string, val: string) => { setPrices(p => ({ ...p, [key]: val })); setSaved(false); };

  const saveAll = async () => {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const items = Object.entries(prices)
        .filter(([, v]) => v && Number(v) > 0)
        .map(([key, value]) => {
          const [source, bdId] = key.split(':');
          return { breakdown_source: source, breakdown_id: Number(bdId), price: Number(value) };
        });
      await api.put(`/specifications/${id}/mother-tmcs/${smtId}/works`, items);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
    finally { setSaving(false); }
  };

  const s = {
    card: { background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, padding: 24, marginBottom: 24 } as React.CSSProperties,
    input: { padding: '8px 12px', border: `1px solid ${theme.inputBorder}`, borderRadius: 8, fontSize: 14, background: theme.inputBg, color: theme.text, outline: 'none', width: 120, textAlign: 'right' as const } as React.CSSProperties,
    btn: { padding: '10px 24px', background: theme.accent, color: theme.accentText, border: 'none', borderRadius: 8, fontSize: 14, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    backBtn: { background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16, fontFamily: 'inherit' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 } as React.CSSProperties,
    th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, fontWeight: 500, fontSize: 13 } as React.CSSProperties,
    td: { padding: '10px 12px', borderBottom: `1px solid ${theme.border}` } as React.CSSProperties,
    error: { color: theme.danger, marginBottom: 12, padding: '10px 14px', background: `${theme.danger}15`, borderRadius: 6, fontSize: 14 } as React.CSSProperties,
    success: { color: theme.success, marginBottom: 12, padding: '10px 14px', background: `${theme.success}15`, borderRadius: 6, fontSize: 14 } as React.CSSProperties,
  };

  return (
    <div>
      <button style={s.backBtn} onClick={() => navigate(`/specifications/${id}`)}>← Назад к спецификации</button>

      {error && <div style={s.error}>{error}</div>}
      {saved && <div style={s.success}>✓ Цены сохранены</div>}

      <div style={s.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <h3 style={{ margin: 0, fontSize: 16 }}>💰 Работы и цены</h3>
          <button style={s.btn} onClick={saveAll} disabled={saving}>
            {saving ? 'Сохранение...' : 'Сохранить всё'}
          </button>
        </div>

        {breakdowns.length === 0 ? (
          <div style={{ color: theme.textSecondary, textAlign: 'center', padding: 40 }}>
            Нет поломок для этого материнского ТМЦ — добавьте их на странице ТМЦ
          </div>
        ) : (
          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Код</th>
                <th style={s.th}>Наименование</th>
                <th style={s.th}>Тип</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Цена</th>
              </tr>
            </thead>
            <tbody>
              {breakdowns.map(bd => {
                const key = `${bd.source}:${bd.id}`;
                return (
                  <tr key={key}>
                    <td style={s.td}><strong>{bd.code}</strong></td>
                    <td style={s.td}>{bd.name}</td>
                    <td style={s.td}>
                      <span style={{
                        fontSize: 11, fontWeight: 600, padding: '2px 6px', borderRadius: 4,
                        background: bd.source === 'category' ? `${theme.accent}20` : `${theme.success}20`,
                        color: bd.source === 'category' ? theme.accent : theme.success,
                      }}>
                        {bd.source === 'category' ? 'категория' : 'своя'}
                      </span>
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      <input
                        type="number" min="0" step="0.01"
                        value={prices[key] || ''}
                        onChange={e => setPrice(key, e.target.value)}
                        placeholder="0.00"
                        style={s.input}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
