import { useState, useEffect, useCallback, type FormEvent } from 'react';
import { api } from '../api/client';
import { useTheme } from '../context/ThemeContext';

interface Contragent {
  id: number;
  name: string;
  full_name: string | null;
  org_form: string | null;
  person: string | null;
  job: string | null;
  basis: string | null;
}

interface Executor {
  id: number;
  warehouse_id: number;
  contragent_id: number;
  emails: string | null;
  agreement_number: string | null;
  agreement_date: string | null;
}

interface Warehouse {
  id: number;
  name: string;
}

type Tab = 'contragents' | 'executors';

const emptyContragentForm = { name: '', full_name: '', org_form: '', person: '', job: '', basis: '' };
const emptyExecutorForm = { warehouse_id: 0, contragent_id: 0, emails: '', agreement_number: '', agreement_date: '' };

export default function ContractorsPage() {
  const { theme } = useTheme();
  const [tab, setTab] = useState<Tab>('contragents');

  const [contragents, setContragents] = useState<Contragent[]>([]);
  const [executors, setExecutors] = useState<Executor[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  const [cForm, setCForm] = useState({ ...emptyContragentForm });
  const [editC, setEditC] = useState<Contragent | null>(null);
  const [editCForm, setEditCForm] = useState({ ...emptyContragentForm });

  const [exForm, setExForm] = useState({ ...emptyExecutorForm });
  const [editEx, setEditEx] = useState<Executor | null>(null);
  const [editExForm, setEditExForm] = useState({ ...emptyExecutorForm });

  const [filterContragent, setFilterContragent] = useState<number | null>(null);
  const [error, setError] = useState('');

  const loadContragents = useCallback(async () => {
    setContragents(await api.get<Contragent[]>('/contractors/contragents'));
  }, []);

  const loadExecutors = useCallback(async () => {
    const params = filterContragent ? `?contragent_id=${filterContragent}` : '';
    setExecutors(await api.get<Executor[]>(`/contractors/executors${params}`));
  }, [filterContragent]);

  const loadWarehouses = useCallback(async () => {
    setWarehouses(await api.get<Warehouse[]>('/warehouses'));
  }, []);

  useEffect(() => { loadContragents(); loadWarehouses(); }, [loadContragents, loadWarehouses]);
  useEffect(() => { loadExecutors(); }, [loadExecutors]);

  const contragentNameById = (id: number) => contragents.find(c => c.id === id)?.name || '—';
  const warehouseNameById = (id: number) => warehouses.find(w => w.id === id)?.name || '—';

  // ── Contragent CRUD ──

  const addContragent = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const body: Record<string, string | null> = { name: cForm.name };
      for (const k of ['full_name', 'org_form', 'person', 'job', 'basis'] as const) {
        if (cForm[k]) body[k] = cForm[k];
      }
      await api.post('/contractors/contragents', body);
      setCForm({ ...emptyContragentForm });
      await loadContragents();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEditC = (c: Contragent) => {
    setEditC(c);
    setEditCForm({
      name: c.name, full_name: c.full_name || '', org_form: c.org_form || '',
      person: c.person || '', job: c.job || '', basis: c.basis || '',
    });
  };

  const saveEditC = async (e: FormEvent) => {
    e.preventDefault();
    if (!editC) return;
    setError('');
    try {
      const body: Record<string, string | null> = {};
      for (const k of ['name', 'full_name', 'org_form', 'person', 'job', 'basis'] as const) {
        body[k] = editCForm[k] || null;
      }
      await api.patch(`/contractors/contragents/${editC.id}`, body);
      setEditC(null);
      await loadContragents();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteContragent = async (id: number) => {
    if (!confirm('Удалить контрагента? Связанные исполнители тоже будут удалены.')) return;
    setError('');
    try {
      await api.delete(`/contractors/contragents/${id}`);
      await loadContragents();
      await loadExecutors();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  // ── Executor CRUD ──

  const addExecutor = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const body: Record<string, unknown> = {
        warehouse_id: Number(exForm.warehouse_id),
        contragent_id: Number(exForm.contragent_id),
      };
      if (exForm.emails) body.emails = exForm.emails;
      if (exForm.agreement_number) body.agreement_number = exForm.agreement_number;
      if (exForm.agreement_date) body.agreement_date = exForm.agreement_date;
      await api.post('/contractors/executors', body);
      setExForm({ ...emptyExecutorForm });
      await loadExecutors();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const startEditEx = (ex: Executor) => {
    setEditEx(ex);
    setEditExForm({
      warehouse_id: ex.warehouse_id, contragent_id: ex.contragent_id,
      emails: ex.emails || '', agreement_number: ex.agreement_number || '',
      agreement_date: ex.agreement_date || '',
    });
  };

  const saveEditEx = async (e: FormEvent) => {
    e.preventDefault();
    if (!editEx) return;
    setError('');
    try {
      const body: Record<string, unknown> = {
        warehouse_id: Number(editExForm.warehouse_id),
        contragent_id: Number(editExForm.contragent_id),
      };
      body.emails = editExForm.emails || null;
      body.agreement_number = editExForm.agreement_number || null;
      body.agreement_date = editExForm.agreement_date || null;
      await api.patch(`/contractors/executors/${editEx.id}`, body);
      setEditEx(null);
      await loadExecutors();
    } catch (err: unknown) { setError(err instanceof Error ? err.message : 'Ошибка'); }
  };

  const deleteExecutor = async (id: number) => {
    if (!confirm('Удалить исполнителя?')) return;
    setError('');
    try {
      await api.delete(`/contractors/executors/${id}`);
      await loadExecutors();
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
    modalOverlay: { position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
    modal: { background: theme.surface, padding: 32, borderRadius: 12, border: `1px solid ${theme.border}`, minWidth: 480 } as React.CSSProperties,
    fieldRow: { marginBottom: 12 } as React.CSSProperties,
    fieldRowWide: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 12 } as React.CSSProperties,
  };

  const renderContragentForm = (
    form: typeof cForm,
    setForm: (f: typeof cForm) => void,
    onSubmit: (e: FormEvent) => void,
    submitLabel: string,
    onCancel?: () => void,
    inline?: boolean,
  ) => (
    <form onSubmit={onSubmit}>
      <div style={inline ? s.form : s.fieldRow}>
        <div>
          <span style={s.label}>Наименование *</span>
          <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required style={{ ...s.input, width: inline ? 180 : '100%', boxSizing: 'border-box' }} />
        </div>
        <div>
          <span style={s.label}>Полное наименование</span>
          <input value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} style={{ ...s.input, width: inline ? 200 : '100%', boxSizing: 'border-box' }} />
        </div>
        <div>
          <span style={s.label}>Орг. форма</span>
          <input value={form.org_form} onChange={e => setForm({ ...form, org_form: e.target.value })} placeholder="ООО, ИП..." style={{ ...s.input, width: inline ? 120 : '100%', boxSizing: 'border-box' }} />
        </div>
        {!inline && (
          <>
            <div style={s.fieldRow}>
              <span style={s.label}>Контактное лицо</span>
              <input value={form.person} onChange={e => setForm({ ...form, person: e.target.value })} style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={s.fieldRow}>
              <span style={s.label}>Должность</span>
              <input value={form.job} onChange={e => setForm({ ...form, job: e.target.value })} style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
            </div>
            <div style={s.fieldRow}>
              <span style={s.label}>Основание</span>
              <input value={form.basis} onChange={e => setForm({ ...form, basis: e.target.value })} placeholder="Устав, доверенность..." style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <button type="submit" style={s.btn}>{submitLabel}</button>
        {onCancel && <button type="button" style={s.btnSecondary} onClick={onCancel}>Отмена</button>}
      </div>
    </form>
  );

  return (
    <div>
      <h2 style={{ margin: '0 0 20px' }}>🏗️ Подрядчики</h2>

      {error && <div style={s.error}>{error}</div>}

      <div style={s.tabs}>
        <button style={s.tab(tab === 'contragents')} onClick={() => setTab('contragents')}>Контрагенты</button>
        <button style={s.tab(tab === 'executors')} onClick={() => setTab('executors')}>Исполнители</button>
      </div>

      {tab === 'contragents' && (
        <div style={s.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Контрагенты</h3>
          {renderContragentForm(cForm, setCForm, addContragent, 'Добавить', undefined, true)}

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Наименование</th>
                <th style={s.th}>Орг. форма</th>
                <th style={s.th}>Контактное лицо</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {contragents.map(c => (
                <tr key={c.id}>
                  <td style={s.td}>{c.name}</td>
                  <td style={s.td}>{c.org_form || '—'}</td>
                  <td style={s.td}>{c.person || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={() => startEditC(c)}>Изменить</button>
                      <button style={s.btnDanger} onClick={() => deleteContragent(c.id)}>Удалить</button>
                    </span>
                  </td>
                </tr>
              ))}
              {contragents.length === 0 && (
                <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={4}>Нет контрагентов</td></tr>
              )}
            </tbody>
          </table>

          {editC && (
            <div style={s.modalOverlay} onClick={() => setEditC(null)}>
              <div style={s.modal} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Редактировать контрагента</h3>
                {renderContragentForm(editCForm, setEditCForm, saveEditC, 'Сохранить', () => setEditC(null))}
              </div>
            </div>
          )}
        </div>
      )}

      {tab === 'executors' && (
        <div style={s.card}>
          <h3 style={{ margin: '0 0 16px', fontSize: 16 }}>Исполнители</h3>

          <form onSubmit={addExecutor} style={s.form}>
            <div>
              <span style={s.label}>Склад *</span>
              <select value={exForm.warehouse_id} onChange={e => setExForm(f => ({ ...f, warehouse_id: Number(e.target.value) }))} required style={s.select}>
                <option value={0} disabled>Выберите</option>
                {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            </div>
            <div>
              <span style={s.label}>Контрагент *</span>
              <select value={exForm.contragent_id} onChange={e => setExForm(f => ({ ...f, contragent_id: Number(e.target.value) }))} required style={s.select}>
                <option value={0} disabled>Выберите</option>
                {contragents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div>
              <span style={s.label}>Emails</span>
              <input value={exForm.emails} onChange={e => setExForm(f => ({ ...f, emails: e.target.value }))} placeholder="a@b.com, c@d.com" style={{ ...s.input, width: 200 }} />
            </div>
            <div>
              <span style={s.label}>№ договора</span>
              <input value={exForm.agreement_number} onChange={e => setExForm(f => ({ ...f, agreement_number: e.target.value }))} style={{ ...s.input, width: 120 }} />
            </div>
            <div>
              <span style={s.label}>Дата договора</span>
              <input type="date" value={exForm.agreement_date} onChange={e => setExForm(f => ({ ...f, agreement_date: e.target.value }))} style={{ ...s.input, width: 150 }} />
            </div>
            <button type="submit" style={s.btn}>Добавить</button>
          </form>

          <div style={{ marginBottom: 12 }}>
            <span style={s.label}>Фильтр по контрагенту</span>
            <select value={filterContragent ?? ''} onChange={e => setFilterContragent(e.target.value ? Number(e.target.value) : null)} style={s.select}>
              <option value="">Все</option>
              {contragents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <table style={s.table}>
            <thead>
              <tr>
                <th style={s.th}>Склад</th>
                <th style={s.th}>Контрагент</th>
                <th style={s.th}>Emails</th>
                <th style={s.th}>№ договора</th>
                <th style={s.th}>Дата</th>
                <th style={{ ...s.th, textAlign: 'right' }}>Действия</th>
              </tr>
            </thead>
            <tbody>
              {executors.map(ex => (
                <tr key={ex.id}>
                  <td style={s.td}>{warehouseNameById(ex.warehouse_id)}</td>
                  <td style={s.td}>{contragentNameById(ex.contragent_id)}</td>
                  <td style={s.td}>{ex.emails || '—'}</td>
                  <td style={s.td}>{ex.agreement_number || '—'}</td>
                  <td style={s.td}>{ex.agreement_date || '—'}</td>
                  <td style={{ ...s.td, textAlign: 'right' }}>
                    <span style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                      <button style={s.btnSecondary} onClick={() => startEditEx(ex)}>Изменить</button>
                      <button style={s.btnDanger} onClick={() => deleteExecutor(ex.id)}>Удалить</button>
                    </span>
                  </td>
                </tr>
              ))}
              {executors.length === 0 && (
                <tr><td style={{ ...s.td, color: theme.textSecondary, textAlign: 'center' }} colSpan={6}>Нет исполнителей</td></tr>
              )}
            </tbody>
          </table>

          {editEx && (
            <div style={s.modalOverlay} onClick={() => setEditEx(null)}>
              <div style={s.modal} onClick={e => e.stopPropagation()}>
                <h3 style={{ margin: '0 0 20px', fontSize: 16 }}>Редактировать исполнителя</h3>
                <form onSubmit={saveEditEx}>
                  <div style={s.fieldRowWide}>
                    <div>
                      <span style={s.label}>Склад</span>
                      <select value={editExForm.warehouse_id} onChange={e => setEditExForm(f => ({ ...f, warehouse_id: Number(e.target.value) }))} required style={{ ...s.select, width: '100%' }}>
                        {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                      </select>
                    </div>
                    <div>
                      <span style={s.label}>Контрагент</span>
                      <select value={editExForm.contragent_id} onChange={e => setEditExForm(f => ({ ...f, contragent_id: Number(e.target.value) }))} required style={{ ...s.select, width: '100%' }}>
                        {contragents.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                  </div>
                  <div style={s.fieldRow}>
                    <span style={s.label}>Emails</span>
                    <input value={editExForm.emails} onChange={e => setEditExForm(f => ({ ...f, emails: e.target.value }))} style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={s.fieldRowWide}>
                    <div>
                      <span style={s.label}>№ договора</span>
                      <input value={editExForm.agreement_number} onChange={e => setEditExForm(f => ({ ...f, agreement_number: e.target.value }))} style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
                    </div>
                    <div>
                      <span style={s.label}>Дата договора</span>
                      <input type="date" value={editExForm.agreement_date} onChange={e => setEditExForm(f => ({ ...f, agreement_date: e.target.value }))} style={{ ...s.input, width: '100%', boxSizing: 'border-box' }} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 10, marginTop: 12 }}>
                    <button type="submit" style={s.btn}>Сохранить</button>
                    <button type="button" style={s.btnSecondary} onClick={() => setEditEx(null)}>Отмена</button>
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
