import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface Territory {
  id: number;
  name: string;
}

interface Warehouse {
  id: number;
  territory_id: number;
  name: string;
}

type Tab = 'territories' | 'warehouses';

export default function WarehousesPage() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>('territories');

  const [territories, setTerritories] = useState<Territory[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [filterTerr, setFilterTerr] = useState<number | null>(null);

  const [terrName, setTerrName] = useState('');
  const [editTerr, setEditTerr] = useState<Territory | null>(null);
  const [editTerrName, setEditTerrName] = useState('');

  const [whForm, setWhForm] = useState({ name: '', territory_id: 0 });
  const [editWh, setEditWh] = useState<Warehouse | null>(null);
  const [editWhForm, setEditWhForm] = useState({ name: '', territory_id: 0 });

  const [error, setError] = useState('');

  const loadTerritories = useCallback(async () => {
    const data = await api.get<Territory[]>('/warehouses/territories');
    setTerritories(data);
  }, []);

  const loadWarehouses = useCallback(async () => {
    const params = filterTerr ? `?territory_id=${filterTerr}` : '';
    const data = await api.get<Warehouse[]>(`/warehouses${params}`);
    setWarehouses(data);
  }, [filterTerr]);

  useEffect(() => { loadTerritories(); }, [loadTerritories]);
  useEffect(() => { loadWarehouses(); }, [loadWarehouses]);

  const terrNameById = (id: number) => territories.find(t => t.id === id)?.name || '—';

  // ── Territory CRUD ──

  const addTerritory = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/warehouses/territories', { name: terrName });
      setTerrName('');
      await loadTerritories();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEditTerr = (t: Territory) => {
    setEditTerr(t);
    setEditTerrName(t.name);
  };

  const saveEditTerr = async (e: FormEvent) => {
    e.preventDefault();
    if (!editTerr) return;
    setError('');
    try {
      await api.patch(`/warehouses/territories/${editTerr.id}`, { name: editTerrName });
      setEditTerr(null);
      await loadTerritories();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteTerritory = async (id: number) => {
    if (!confirm('Удалить территорию? Связанные склады тоже будут удалены.')) return;
    setError('');
    try {
      await api.delete(`/warehouses/territories/${id}`);
      await loadTerritories();
      await loadWarehouses();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // ── Warehouse CRUD ──

  const addWarehouse = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/warehouses', { ...whForm, territory_id: Number(whForm.territory_id) });
      setWhForm({ name: '', territory_id: 0 });
      await loadWarehouses();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEditWh = (w: Warehouse) => {
    setEditWh(w);
    setEditWhForm({ name: w.name, territory_id: w.territory_id });
  };

  const saveEditWh = async (e: FormEvent) => {
    e.preventDefault();
    if (!editWh) return;
    setError('');
    try {
      await api.patch(`/warehouses/${editWh.id}`, { ...editWhForm, territory_id: Number(editWhForm.territory_id) });
      setEditWh(null);
      await loadWarehouses();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteWarehouse = async (id: number) => {
    if (!confirm('Удалить склад?')) return;
    setError('');
    try {
      await api.delete(`/warehouses/${id}`);
      await loadWarehouses();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // ── Styles ──

  const s = {
    tabs: { display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${theme.border}` } as React.CSSProperties,
    tab: (active: boolean) => ({
      padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
      color: active ? theme.accent : theme.textSecondary, border: 'none', borderBottomWidth: 2,
      borderBottomStyle: 'solid' as const, borderBottomColor: active ? theme.accent : 'transparent',
      background: 'none', fontFamily: 'inherit',
    }) as React.CSSProperties,
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
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>🏭 Склады</h2>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.tabs}>
        <button style={s.tab(tab === 'territories')} onClick={() => setTab('territories')}>Территории</button>
        <button style={s.tab(tab === 'warehouses')} onClick={() => setTab('warehouses')}>Склады</button>
      </div>

      {tab === 'territories' && (
        <div style={s.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Территории</h3>
          <form onSubmit={addTerritory} style={s.form}>
            <div>
              <span style={s.label}>Наименование</span>
              <input value={terrName} onChange={e => setTerrName(e.target.value)} required placeholder="Новая территория" style={{ ...s.input, width: 250 }} />
            </div>
            <button type="submit" style={s.btn}>Добавить</button>
          </form>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Наименование</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {territories.map(t => (
                <tr key={t.id}>
                  <td style={s.td}>{t.id}</td>
                  <td style={s.td}>
                    {editTerr?.id === t.id ? (
                      <form onSubmit={saveEditTerr} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <input value={editTerrName} onChange={e => setEditTerrName(e.target.value)} required style={{ ...s.input, width: 200 }} />
                        <button type="submit" style={s.btnSecondary}>Сохранить</button>
                        <button type="button" style={s.btnSecondary} onClick={() => setEditTerr(null)}>Отмена</button>
                      </form>
                    ) : t.name}
                  </td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    {editTerr?.id !== t.id && (
                      <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                        <button style={s.btnSecondary} onClick={() => startEditTerr(t)}>Изменить</button>
                        <button style={s.btnDanger} onClick={() => deleteTerritory(t.id)}>Удалить</button>
                      </span>
                    )}
                  </td>
                </tr>
              ))}
              {territories.length === 0 && (
                <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={3}>Нет территорий</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'warehouses' && (
        <div style={s.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Склады</h3>

          <form onSubmit={addWarehouse} style={s.form}>
            <div>
              <span style={s.label}>Территория</span>
              <select value={whForm.territory_id} onChange={e => setWhForm(f => ({ ...f, territory_id: Number(e.target.value) }))} required style={s.select}>
                <option value={0} disabled>Выберите</option>
                {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div>
              <span style={s.label}>Наименование</span>
              <input value={whForm.name} onChange={e => setWhForm(f => ({ ...f, name: e.target.value }))} required placeholder="Название склада" style={{ ...s.input, width: 250 }} />
            </div>
            <button type="submit" style={s.btn}>Добавить</button>
          </form>

          <div style={{ marginBottom: 12 }}>
            <span style={s.label}>Фильтр по территории</span>
            <select value={filterTerr ?? ''} onChange={e => setFilterTerr(e.target.value ? Number(e.target.value) : null)} style={s.select}>
              <option value="">Все</option>
              {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>#</th>
                <th style={s.th}>Наименование</th>
                <th style={s.th}>Территория</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map(w => (
                <tr key={w.id}>
                  <td style={s.td}>{w.id}</td>
                  <td style={s.td}>{w.name}</td>
                  <td style={s.td}>{terrNameById(w.territory_id)}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={() => startEditWh(w)}>Изменить</button>
                      <button style={s.btnDanger} onClick={() => deleteWarehouse(w.id)}>Удалить</button>
                    </span>
                  </td>
                </tr>
              ))}
              {warehouses.length === 0 && (
                <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={4}>Нет складов</td></tr>
              )}
            </tbody>
          </table>

          {editWh && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={() => setEditWh(null)}>
              <div style={{ background: theme.surface, padding: 32, borderRadius: 12, border: `1px solid ${theme.border}`, minWidth: 400 }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Редактировать склад</h3>
                <form onSubmit={saveEditWh}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={s.label}>Территория</span>
                    <select value={editWhForm.territory_id} onChange={e => setEditWhForm(f => ({ ...f, territory_id: Number(e.target.value) }))} required style={{ ...s.select, width: '100%' }}>
                      {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <span style={s.label}>Наименование</span>
                    <input value={editWhForm.name} onChange={e => setEditWhForm(f => ({ ...f, name: e.target.value }))} required style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" style={s.btn}>Сохранить</button>
                    <button type="button" style={s.btnSecondary} onClick={() => setEditWh(null)}>Отмена</button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
