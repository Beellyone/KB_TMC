import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface MotherTmcDetail {
  id: number;
  category_id: number;
  code: string;
  name: string;
  category: { id: number; name: string };
}

interface TmcItem {
  id: number;
  mother_tmc_id: number;
  code: string;
  name: string;
}

interface Breakdown {
  id: number;
  mother_tmc_id: number;
  code: string;
  name: string;
}

export default function MotherTmcDetail() {
  const { id } = useParams<{ id: string }>();
  const { theme } = useTheme();
  const navigate = useNavigate();

  const [mother, setMother] = useState<MotherTmcDetail | null>(null);
  const [items, setItems] = useState<TmcItem[]>([]);
  const [breakdowns, setBreakdowns] = useState<Breakdown[]>([]);
  const [form, setForm] = useState({ code: '', name: '' });
  const [editItem, setEditItem] = useState<TmcItem | null>(null);
  const [editForm, setEditForm] = useState({ code: '', name: '' });
  const [bdForm, setBdForm] = useState({ code: '', name: '' });
  const [editBd, setEditBd] = useState<Breakdown | null>(null);
  const [editBdForm, setEditBdForm] = useState({ code: '', name: '' });
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    if (!id) return;
    const [m, i, b] = await Promise.all([
      api.get<MotherTmcDetail>(`/tmc/mothers/${id}`),
      api.get<TmcItem[]>(`/tmc/mothers/${id}/items`),
      api.get<Breakdown[]>(`/tmc/mothers/${id}/breakdowns`),
    ]);
    setMother(m);
    setItems(i);
    setBreakdowns(b);
  }, [id]);

  useEffect(() => { load(); }, [load]);

  // ── TMC Items ──

  const addItem = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tmc/items', { mother_tmc_id: Number(id), ...form });
      setForm({ code: '', name: '' });
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEdit = (item: TmcItem) => {
    setEditItem(item);
    setEditForm({ code: item.code, name: item.name });
  };

  const saveEdit = async (e: FormEvent) => {
    e.preventDefault();
    if (!editItem) return;
    setError('');
    try {
      await api.patch(`/tmc/items/${editItem.id}`, editForm);
      setEditItem(null);
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteItem = async (itemId: number) => {
    if (!confirm('Удалить ТМЦ?')) return;
    setError('');
    try {
      await api.delete(`/tmc/items/${itemId}`);
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // ── Breakdowns ──

  const addBreakdown = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tmc/breakdowns', { mother_tmc_id: Number(id), ...bdForm });
      setBdForm({ code: '', name: '' });
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEditBd = (bd: Breakdown) => {
    setEditBd(bd);
    setEditBdForm({ code: bd.code, name: bd.name });
  };

  const saveEditBd = async (e: FormEvent) => {
    e.preventDefault();
    if (!editBd) return;
    setError('');
    try {
      await api.patch(`/tmc/breakdowns/${editBd.id}`, editBdForm);
      setEditBd(null);
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteBreakdown = async (bdId: number) => {
    if (!confirm('Удалить поломку?')) return;
    setError('');
    try {
      await api.delete(`/tmc/breakdowns/${bdId}`);
      await load();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const s = {
    card: { background: theme.surface, borderRadius: 10, border: `1px solid ${theme.border}`, padding: 24, marginBottom: 24 } as React.CSSProperties,
    input: { padding: '8px 12px', border: `1px solid ${theme.inputBorder}`, borderRadius: 8, fontSize: 14, background: theme.inputBg, color: theme.text, outline: 'none' } as React.CSSProperties,
    btn: { padding: '8px 16px', background: theme.accent, color: theme.accentText, border: 'none', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' } as React.CSSProperties,
    btnDanger: { padding: '6px 12px', background: 'none', color: theme.danger, border: `1px solid ${theme.danger}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' } as React.CSSProperties,
    btnSecondary: { padding: '6px 12px', background: 'none', color: theme.textSecondary, border: `1px solid ${theme.border}`, borderRadius: 6, fontSize: 12, cursor: 'pointer' } as React.CSSProperties,
    backBtn: { background: 'none', border: 'none', color: theme.textSecondary, cursor: 'pointer', fontSize: 14, padding: 0, marginBottom: 16, fontFamily: 'inherit' } as React.CSSProperties,
    table: { width: '100%', borderCollapse: 'collapse' as const, fontSize: 14 } as React.CSSProperties,
    th: { textAlign: 'left' as const, padding: '10px 12px', borderBottom: `1px solid ${theme.border}`, color: theme.textSecondary, fontWeight: 500, fontSize: 13 } as React.CSSProperties,
    td: { padding: '10px 12px', borderBottom: `1px solid ${theme.border}` } as React.CSSProperties,
    form: { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' as const, marginBottom: 20 } as React.CSSProperties,
    label: { display: 'block', marginBottom: 4, fontSize: 12, color: theme.textSecondary } as React.CSSProperties,
    error: { color: theme.danger, marginBottom: 12, padding: '10px 14px', background: `${theme.danger}15`, borderRadius: 6, fontSize: 14 } as React.CSSProperties,
    info: { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 0 } as React.CSSProperties,
  };

  if (!mother) return <div style={{ textAlign: 'center', padding: 80, color: theme.textSecondary }}>Загрузка...</div>;

  return (
    <div>
      <button style={s.backBtn} onClick={() => navigate('/tmc')}>← Назад к ТМЦ</button>

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 18 }}>📦 {mother.name}</h3>
        <div style={s.info}>
          <div><span style={{ ...s.label, marginBottom: 2 }}>Код</span><strong>{mother.code}</strong></div>
          <div><span style={{ ...s.label, marginBottom: 2 }}>Категория</span><strong>{mother.category.name}</strong></div>
          <div><span style={{ ...s.label, marginBottom: 2 }}>Кол-во ТМЦ</span><strong>{items.length}</strong></div>
        </div>
      </div>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Закреплённые ТМЦ</h3>

        <form onSubmit={addItem} style={s.form}>
          <div>
            <span style={s.label}>Код</span>
            <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value }))} required placeholder="TMC-001" style={{ ...s.input, width: 140 }} />
          </div>
          <div>
            <span style={s.label}>Наименование</span>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required placeholder="Название ТМЦ" style={{ ...s.input, width: 250 }} />
          </div>
          <button type="submit" style={s.btn}>Добавить ТМЦ</button>
        </form>

        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Код</th>
              <th style={s.th}>Наименование</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {items.map(item => (
              <tr key={item.id}>
                <td style={s.td}>
                  {editItem?.id === item.id ? (
                    <input value={editForm.code} onChange={e => setEditForm(f => ({ ...f, code: e.target.value }))} required style={{ ...s.input, width: 100 }} />
                  ) : item.code}
                </td>
                <td style={s.td}>
                  {editItem?.id === item.id ? (
                    <input value={editForm.name} onChange={e => setEditForm(f => ({ ...f, name: e.target.value }))} required style={{ ...s.input, width: 200 }} />
                  ) : item.name}
                </td>
                <td style={{ ...s.td, textAlign: 'right' }}>
                  {editItem?.id === item.id ? (
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={saveEdit}>Сохранить</button>
                      <button style={s.btnSecondary} onClick={() => setEditItem(null)}>Отмена</button>
                    </span>
                  ) : (
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={() => startEdit(item)}>Изменить</button>
                      <button style={s.btnDanger} onClick={() => deleteItem(item.id)}>Удалить</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {items.length === 0 && (
              <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={3}>Нет закреплённых ТМЦ</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={s.card}>
        <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>🔧 Возможные поломки</h3>

        <form onSubmit={addBreakdown} style={s.form}>
          <div>
            <span style={s.label}>Код поломки</span>
            <input value={bdForm.code} onChange={e => setBdForm(f => ({ ...f, code: e.target.value }))} required placeholder="BD-001" style={{ ...s.input, width: 140 }} />
          </div>
          <div>
            <span style={s.label}>Наименование</span>
            <input value={bdForm.name} onChange={e => setBdForm(f => ({ ...f, name: e.target.value }))} required placeholder="Описание поломки" style={{ ...s.input, width: 250 }} />
          </div>
          <button type="submit" style={s.btn}>Добавить поломку</button>
        </form>

        <table style={s.table}>
          <thead>
            <tr>
              <th style={s.th}>Код</th>
              <th style={s.th}>Наименование</th>
              <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
            </tr>
          </thead>
          <tbody>
            {breakdowns.map(bd => (
              <tr key={bd.id}>
                <td style={s.td}>
                  {editBd?.id === bd.id ? (
                    <input value={editBdForm.code} onChange={e => setEditBdForm(f => ({ ...f, code: e.target.value }))} required style={{ ...s.input, width: 100 }} />
                  ) : bd.code}
                </td>
                <td style={s.td}>
                  {editBd?.id === bd.id ? (
                    <input value={editBdForm.name} onChange={e => setEditBdForm(f => ({ ...f, name: e.target.value }))} required style={{ ...s.input, width: 200 }} />
                  ) : bd.name}
                </td>
                <td style={{ ...s.td, textAlign: 'right' }}>
                  {editBd?.id === bd.id ? (
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={saveEditBd}>Сохранить</button>
                      <button style={s.btnSecondary} onClick={() => setEditBd(null)}>Отмена</button>
                    </span>
                  ) : (
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={() => startEditBd(bd)}>Изменить</button>
                      <button style={s.btnDanger} onClick={() => deleteBreakdown(bd.id)}>Удалить</button>
                    </span>
                  )}
                </td>
              </tr>
            ))}
            {breakdowns.length === 0 && (
              <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={3}>Нет поломок</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
