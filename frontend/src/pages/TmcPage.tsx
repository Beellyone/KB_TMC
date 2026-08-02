import React, { useState, useEffect, useCallback, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface Category {
  id: number;
  name: string;
}

interface MotherTmc {
  id: number;
  category_id: number;
  code: string;
  name: string;
}

interface CategoryBreakdown {
  id: number;
  category_id: number;
  code: string;
  name: string;
}

type Tab = 'categories' | 'mothers';

export default function TmcPage() {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>('mothers');

  const [categories, setCategories] = useState<Category[]>([]);
  const [mothers, setMothers] = useState<MotherTmc[]>([]);
  const [filterCat, setFilterCat] = useState<number | null>(null);

  const [catName, setCatName] = useState('');
  const [editCat, setEditCat] = useState<Category | null>(null);
  const [editCatName, setEditCatName] = useState('');

  const [motherForm, setMotherForm] = useState({ code: '', name: '', category_id: 0 });
  const [editMother, setEditMother] = useState<MotherTmc | null>(null);
  const [editMotherForm, setEditMotherForm] = useState({ code: '', name: '', category_id: 0 });

  const [error, setError] = useState('');

  const [selectedCat, setSelectedCat] = useState<number | null>(null);
  const [catBreakdowns, setCatBreakdowns] = useState<CategoryBreakdown[]>([]);
  const [bdForm, setBdForm] = useState({ code: '', name: '' });
  const [editBd, setEditBd] = useState<CategoryBreakdown | null>(null);
  const [editBdForm, setEditBdForm] = useState({ code: '', name: '' });

  const loadCategories = useCallback(async () => {
    const data = await api.get<Category[]>('/tmc/categories');
    setCategories(data);
  }, []);

  const loadMothers = useCallback(async () => {
    const params = filterCat ? `?category_id=${filterCat}` : '';
    const data = await api.get<MotherTmc[]>(`/tmc/mothers${params}`);
    setMothers(data);
  }, [filterCat]);

  useEffect(() => { loadCategories(); }, [loadCategories]);
  useEffect(() => { loadMothers(); }, [loadMothers]);

  const catNameById = (id: number) => categories.find(c => c.id === id)?.name || '—';

  // ── Category Breakdowns ──

  const loadCatBreakdowns = async (catId: number) => {
    const data = await api.get<CategoryBreakdown[]>(`/tmc/categories/${catId}/breakdowns`);
    setCatBreakdowns(data);
  };

  const toggleCatBreakdowns = async (catId: number) => {
    if (selectedCat === catId) { setSelectedCat(null); return; }
    setSelectedCat(catId);
    await loadCatBreakdowns(catId);
  };

  const addCatBreakdown = async (e: FormEvent) => {
    e.preventDefault();
    if (!selectedCat) return;
    setError('');
    try {
      await api.post('/tmc/category-breakdowns', { category_id: selectedCat, ...bdForm });
      setBdForm({ code: '', name: '' });
      await loadCatBreakdowns(selectedCat);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEditBd = (bd: CategoryBreakdown) => {
    setEditBd(bd);
    setEditBdForm({ code: bd.code, name: bd.name });
  };

  const saveEditBd = async (e: FormEvent) => {
    e.preventDefault();
    if (!editBd || !selectedCat) return;
    setError('');
    try {
      await api.patch(`/tmc/category-breakdowns/${editBd.id}`, editBdForm);
      setEditBd(null);
      await loadCatBreakdowns(selectedCat);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteCatBreakdown = async (bdId: number) => {
    if (!confirm('Удалить шаблон поломки?')) return;
    if (!selectedCat) return;
    setError('');
    try {
      await api.delete(`/tmc/category-breakdowns/${bdId}`);
      await loadCatBreakdowns(selectedCat);
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // ── Category CRUD ──

  const addCategory = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tmc/categories', { name: catName });
      setCatName('');
      await loadCategories();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEditCat = (cat: Category) => {
    setEditCat(cat);
    setEditCatName(cat.name);
  };

  const saveEditCat = async (e: FormEvent) => {
    e.preventDefault();
    if (!editCat) return;
    setError('');
    try {
      await api.patch(`/tmc/categories/${editCat.id}`, { name: editCatName });
      setEditCat(null);
      await loadCategories();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteCategory = async (id: number) => {
    if (!confirm('Удалить категорию? Связанные материнские ТМЦ тоже будут удалены.')) return;
    setError('');
    try {
      await api.delete(`/tmc/categories/${id}`);
      await loadCategories();
      await loadMothers();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // ── Mother TMC CRUD ──

  const addMother = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      await api.post('/tmc/mothers', { ...motherForm, category_id: Number(motherForm.category_id) });
      setMotherForm({ code: '', name: '', category_id: 0 });
      await loadMothers();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEditMother = (m: MotherTmc) => {
    setEditMother(m);
    setEditMotherForm({ code: m.code, name: m.name, category_id: m.category_id });
  };

  const saveEditMother = async (e: FormEvent) => {
    e.preventDefault();
    if (!editMother) return;
    setError('');
    try {
      await api.patch(`/tmc/mothers/${editMother.id}`, { ...editMotherForm, category_id: Number(editMotherForm.category_id) });
      setEditMother(null);
      await loadMothers();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteMother = async (id: number) => {
    if (!confirm('Удалить материнский ТМЦ? Все закреплённые ТМЦ тоже будут удалены.')) return;
    setError('');
    try {
      await api.delete(`/tmc/mothers/${id}`);
      await loadMothers();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // ── Styles ──

  const s = {
    tabs: { display: 'flex', gap: 0, marginBottom: 24, borderBottom: `1px solid ${theme.border}` } as React.CSSProperties,
    tab: (active: boolean) => ({
      padding: '10px 24px', cursor: 'pointer', fontSize: 14, fontWeight: active ? 600 : 400,
      color: active ? theme.accent : theme.textSecondary, borderBottom: active ? `2px solid ${theme.accent}` : '2px solid transparent',
      background: 'none', border: 'none', borderBottomWidth: 2, borderBottomStyle: 'solid' as const,
      borderBottomColor: active ? theme.accent : 'transparent', fontFamily: 'inherit',
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
    row: { cursor: 'pointer', transition: 'background 0.1s' } as React.CSSProperties,
    form: { display: 'flex', gap: 10, alignItems: 'flex-end', flexWrap: 'wrap' as const, marginBottom: 20 } as React.CSSProperties,
    label: { display: 'block', marginBottom: 4, fontSize: 12, color: theme.textSecondary } as React.CSSProperties,
    error: { color: theme.danger, marginBottom: 12, padding: '10px 14px', background: `${theme.danger}15`, borderRadius: 6, fontSize: 14 } as React.CSSProperties,
  };

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>📦 ТМЦ</h2>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.tabs}>
        <button style={s.tab(tab === 'mothers')} onClick={() => setTab('mothers')}>Материнские ТМЦ</button>
        <button style={s.tab(tab === 'categories')} onClick={() => setTab('categories')}>Категории</button>
      </div>

      {tab === 'categories' && (
        <div style={s.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Категории ТМЦ</h3>
          <form onSubmit={addCategory} style={s.form}>
            <div>
              <span style={s.label}>Наименование</span>
              <input value={catName} onChange={e => setCatName(e.target.value)} required placeholder="Новая категория" style={{ ...s.input, width: 250 }} />
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
              {categories.map(cat => (
                <React.Fragment key={cat.id}>
                  <tr>
                    <td style={s.td}>{cat.id}</td>
                    <td style={s.td}>
                      {editCat?.id === cat.id ? (
                        <form onSubmit={saveEditCat} style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                          <input value={editCatName} onChange={e => setEditCatName(e.target.value)} required style={{ ...s.input, width: 200 }} />
                          <button type="submit" style={s.btnSecondary}>Сохранить</button>
                          <button type="button" style={s.btnSecondary} onClick={() => setEditCat(null)}>Отмена</button>
                        </form>
                      ) : cat.name}
                    </td>
                    <td style={{ ...s.td, textAlign: 'right' }}>
                      {editCat?.id !== cat.id && (
                        <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button style={s.btnSecondary} onClick={() => toggleCatBreakdowns(cat.id)}>
                            🔧 Поломки {selectedCat === cat.id ? '▲' : '▼'}
                          </button>
                          <button style={s.btnSecondary} onClick={() => startEditCat(cat)}>Изменить</button>
                          <button style={s.btnDanger} onClick={() => deleteCategory(cat.id)}>Удалить</button>
                        </span>
                      )}
                    </td>
                  </tr>
                  {selectedCat === cat.id && (
                    <tr>
                      <td colSpan={3} style={{ ...s.td, background: theme.bg, padding: 20 }}>
                        <h4 style={{ margin: '0 0 12px', fontSize: 14 }}>Шаблоны поломок — {cat.name}</h4>
                        <form onSubmit={addCatBreakdown} style={s.form}>
                          <div>
                            <span style={s.label}>Код</span>
                            <input value={bdForm.code} onChange={e => setBdForm(f => ({ ...f, code: e.target.value }))} required placeholder="PR-0" style={{ ...s.input, width: 100 }} />
                          </div>
                          <div>
                            <span style={s.label}>Наименование</span>
                            <input value={bdForm.name} onChange={e => setBdForm(f => ({ ...f, name: e.target.value }))} required placeholder="Диагностика" style={{ ...s.input, width: 200 }} />
                          </div>
                          <button type="submit" style={s.btn}>Добавить</button>
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
                            {catBreakdowns.map(bd => (
                              <tr key={bd.id}>
                                <td style={s.td}>
                                  {editBd?.id === bd.id ? (
                                    <input value={editBdForm.code} onChange={e => setEditBdForm(f => ({ ...f, code: e.target.value }))} required style={{ ...s.input, width: 80 }} />
                                  ) : bd.code}
                                </td>
                                <td style={s.td}>
                                  {editBd?.id === bd.id ? (
                                    <input value={editBdForm.name} onChange={e => setEditBdForm(f => ({ ...f, name: e.target.value }))} required style={{ ...s.input, width: 180 }} />
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
                                      <button style={s.btnDanger} onClick={() => deleteCatBreakdown(bd.id)}>Удалить</button>
                                    </span>
                                  )}
                                </td>
                              </tr>
                            ))}
                            {catBreakdowns.length === 0 && (
                              <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={3}>Нет шаблонов</td></tr>
                            )}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {categories.length === 0 && (
                <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={3}>Нет категорий</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {tab === 'mothers' && (
        <div style={s.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Материнские ТМЦ</h3>

          <form onSubmit={addMother} style={s.form}>
            <div>
              <span style={s.label}>Категория</span>
              <select value={motherForm.category_id} onChange={e => setMotherForm(f => ({ ...f, category_id: Number(e.target.value) }))} required style={s.select}>
                <option value={0} disabled>Выберите</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <span style={s.label}>Код</span>
              <input value={motherForm.code} onChange={e => setMotherForm(f => ({ ...f, code: e.target.value }))} required placeholder="MT-001" style={{ ...s.input, width: 120 }} />
            </div>
            <div>
              <span style={s.label}>Наименование</span>
              <input value={motherForm.name} onChange={e => setMotherForm(f => ({ ...f, name: e.target.value }))} required placeholder="Название" style={{ ...s.input, width: 200 }} />
            </div>
            <button type="submit" style={s.btn}>Добавить</button>
          </form>

          <div style={{ marginBottom: 12 }}>
            <span style={s.label}>Фильтр по категории</span>
            <select value={filterCat ?? ''} onChange={e => setFilterCat(e.target.value ? Number(e.target.value) : null)} style={s.select}>
              <option value="">Все</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Код</th>
                <th style={s.th}>Наименование</th>
                <th style={s.th}>Категория</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {mothers.map(m => (
                <tr key={m.id}
                  style={s.row}
                  onMouseEnter={e => (e.currentTarget.style.background = theme.surfaceHover)}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  onClick={() => navigate(`/tmc/mother/${m.id}`)}>
                  <td style={s.td}>{m.code}</td>
                  <td style={s.td}>{m.name}</td>
                  <td style={s.td}>{catNameById(m.category_id)}</td>
                  <td style={{ ...s.td, textAlign: 'right' }} onClick={e => e.stopPropagation()}>
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={() => startEditMother(m)}>Изменить</button>
                      <button style={s.btnDanger} onClick={() => deleteMother(m.id)}>Удалить</button>
                    </span>
                  </td>
                </tr>
              ))}
              {mothers.length === 0 && (
                <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={4}>Нет записей</td></tr>
              )}
            </tbody>
          </table>

          {editMother && (
            <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 }} onClick={() => setEditMother(null)}>
              <div style={{ background: theme.surface, padding: 32, borderRadius: 12, border: `1px solid ${theme.border}`, minWidth: 400 }} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Редактировать материнский ТМЦ</h3>
                <form onSubmit={saveEditMother}>
                  <div style={{ marginBottom: 12 }}>
                    <span style={s.label}>Категория</span>
                    <select value={editMotherForm.category_id} onChange={e => setEditMotherForm(f => ({ ...f, category_id: Number(e.target.value) }))} required style={{ ...s.select, width: '100%' }}>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 12 }}>
                    <span style={s.label}>Код</span>
                    <input value={editMotherForm.code} onChange={e => setEditMotherForm(f => ({ ...f, code: e.target.value }))} required style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <span style={s.label}>Наименование</span>
                    <input value={editMotherForm.name} onChange={e => setEditMotherForm(f => ({ ...f, name: e.target.value }))} required style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button type="submit" style={s.btn}>Сохранить</button>
                    <button type="button" style={s.btnSecondary} onClick={() => setEditMother(null)}>Отмена</button>
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
