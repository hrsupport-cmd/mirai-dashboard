'use client';
import React, { useState, useEffect, useRef } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell
} from 'recharts';
import {
  LayoutDashboard, Sparkles, Megaphone, Calendar,
  ChevronRight, Save, Clock, CheckCircle2,
  Pencil, Trash2, Plus, X, Check, Wifi, WifiOff,
  RefreshCw, ChevronDown, BarChart3, LayoutGrid,
  FileText, Info, Search, AlertTriangle, Zap,
  PlusCircle, Bot, GitBranch, TrendingUp
} from 'lucide-react';

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://tdqvoyhdeseuncqtytpv.supabase.co";
const SUPABASE_KEY = "sb_publishable_amfdIcyLqxdB8oLI3A8zGw_2La0DJS-";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const PARTS = ["인사", "총무", "직속"];
const STATUS_KEYS = ["완료", "진행중", "예정", "지연"];
const STATUS_CFG = {
  완료:   { color: "#34d399", bg: "rgba(52,211,153,0.13)",  border: "rgba(52,211,153,0.28)"  },
  진행중: { color: "#fbbf24", bg: "rgba(251,191,36,0.13)",  border: "rgba(251,191,36,0.28)"  },
  예정:   { color: "#38bdf8", bg: "rgba(56,189,248,0.13)",  border: "rgba(56,189,248,0.28)"  },
  지연:   { color: "#f87171", bg: "rgba(248,113,113,0.13)", border: "rgba(248,113,113,0.28)" },
};
const CARD_CFG = {
  prev: { label: "전주 실적", color: "#38bdf8", bg: "rgba(56,189,248,0.08)",  border: "rgba(56,189,248,0.2)"  },
  curr: { label: "금주 진행", color: "#fbbf24", bg: "rgba(251,191,36,0.08)",  border: "rgba(251,191,36,0.2)"  },
  next: { label: "차주 예정", color: "#34d399", bg: "rgba(52,211,153,0.08)",  border: "rgba(52,211,153,0.2)"  },
};
const FLAG_CFG = {
  "트래킹 누락": { color: "#f87171", bg: "rgba(248,113,113,0.1)", border: "rgba(248,113,113,0.25)" },
  "구체성 부족": { color: "#fbbf24", bg: "rgba(251,191,36,0.1)",  border: "rgba(251,191,36,0.25)"  },
};

// ─── Utils ────────────────────────────────────────────────────────────────────
const genId = () => Math.random().toString(36).slice(2, 9);
const toItems = (arr) => {
  if (!Array.isArray(arr) || !arr.length) return [];
  return arr.map(i => typeof i === 'string'
    ? { id: genId(), text: i, status: '진행중' }
    : { id: genId(), text: i.text || '', status: i.status || '진행중' });
};
const fromItems = (items) => items.map(({ text, status }) => ({ text, status }));

function dateToWeekId(date) {
  const d = new Date(date);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}-W${Math.ceil(d.getDate() / 7)}`;
}
function weekIdToRange(w) {
  const match = w.match(/(\d{4})-(\d{2})-W(\d)/);
  if (!match) return w;
  const [, y, m, wn] = match;
  const s = (parseInt(wn) - 1) * 7 + 1;
  return `${y}.${m}.${String(s).padStart(2,'0')} ~ ${y}.${m}.${String(Math.min(s+6,31)).padStart(2,'0')}`;
}
function weekIdsInRange(s, e) {
  const ids = new Set();
  const end = new Date(e);
  const cur = new Date(s);
  const day = cur.getDay();
  cur.setDate(cur.getDate() - (day === 0 ? 6 : day - 1));
  while (cur <= end) { ids.add(dateToWeekId(cur)); cur.setDate(cur.getDate() + 7); }
  return Array.from(ids).sort();
}

// ─── Shared styles ────────────────────────────────────────────────────────────
const S = {
  card:    { background: '#0d1117', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 18, padding: 20 },
  iconBtn: { background: 'transparent', border: 'none', cursor: 'pointer', color: '#475569', padding: 4, borderRadius: 6, display: 'flex', alignItems: 'center' },
};

// ─── StatusTag ────────────────────────────────────────────────────────────────
const STATUS_ICONS = { 완료: CheckCircle2, 진행중: Clock, 예정: Calendar, 지연: AlertTriangle };
function StatusTag({ status, onChange, size = 'sm' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = STATUS_CFG[status] || STATUS_CFG['진행중'];
  const Icon = STATUS_ICONS[status] || Clock;

  useEffect(() => {
    if (!open) return;
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={(e) => { e.stopPropagation(); onChange && setOpen(o => !o); }}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 4,
          padding: size === 'sm' ? '3px 8px' : '4px 10px',
          borderRadius: 6, border: `1px solid ${cfg.border}`,
          background: cfg.bg, color: cfg.color,
          fontSize: size === 'sm' ? 10 : 11, fontWeight: 800,
          cursor: onChange ? 'pointer' : 'default', whiteSpace: 'nowrap',
          transition: 'all 0.12s',
        }}
      >
        <Icon size={9} />
        {status}
        {onChange && <ChevronDown size={8} />}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: '110%', left: 0, zIndex: 999,
          background: '#161b24', border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: 10, overflow: 'hidden', boxShadow: '0 8px 32px rgba(0,0,0,0.5)', width: 90,
        }}>
          {STATUS_KEYS.map(s => {
            const c = STATUS_CFG[s]; const Ic = STATUS_ICONS[s] || Clock;
            return (
              <button key={s} onClick={(e) => { e.stopPropagation(); onChange(s); setOpen(false); }}
                style={{ width: '100%', textAlign: 'left', padding: '8px 12px', fontSize: 11, fontWeight: 700,
                  color: c.color, background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', gap: 6 }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.04)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <Ic size={10} />{s}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── FlagBadge ────────────────────────────────────────────────────────────────
function FlagBadge({ flag, comment }) {
  const [hov, setHov] = useState(false);
  const cfg = FLAG_CFG[flag]; if (!cfg) return null;
  const Icon = flag === '트래킹 누락' ? GitBranch : Zap;
  return (
    <div style={{ position: 'relative', display: 'inline-block' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3,
        padding: '2px 7px', borderRadius: 5, fontSize: 9, fontWeight: 800,
        background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color, cursor: 'default' }}>
        <Icon size={8} />{flag}
      </span>
      {hov && comment && (
        <div style={{ position: 'absolute', bottom: '120%', left: 0, zIndex: 1000,
          background: '#1e293b', border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: 10, padding: '8px 12px', fontSize: 11, color: '#94a3b8',
          boxShadow: '0 8px 24px rgba(0,0,0,0.5)', maxWidth: 260, whiteSpace: 'normal', lineHeight: 1.5 }}>
          {comment}
        </div>
      )}
    </div>
  );
}

// ─── WorkItem ─────────────────────────────────────────────────────────────────
function WorkItem({ item, onUpdate, onDelete, flags = [] }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(item.text);
  const ref = useRef(null);
  useEffect(() => { setDraft(item.text); }, [item.text]);
  useEffect(() => { if (editing) ref.current?.focus(); }, [editing]);
  const commit = () => {
    const t = draft.trim();
    if (t && t !== item.text) onUpdate({ ...item, text: t });
    else if (!t) onDelete();
    setEditing(false);
  };
  const [hov, setHov] = useState(false);

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '8px 0',
      borderBottom: '1px solid rgba(255,255,255,0.04)' }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ flexShrink: 0, marginTop: 1 }}>
        <StatusTag status={item.status} onChange={s => onUpdate({ ...item, status: s })} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        {editing ? (
          <input ref={ref} value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { setDraft(item.text); setEditing(false); } }}
            style={{ width: '100%', background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(56,189,248,0.4)', borderRadius: 7,
              padding: '4px 8px', color: '#e2e8f0', fontSize: 12, outline: 'none' }}
          />
        ) : (
          <span onDoubleClick={() => setEditing(true)}
            style={{ display: 'block', fontSize: 12, color: '#94a3b8', lineHeight: 1.55,
              cursor: 'text', wordBreak: 'break-word', transition: 'color 0.15s',
              color: hov ? '#d1d5db' : '#94a3b8' }}>
            {item.text}
          </span>
        )}
        {flags.length > 0 && (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4, marginTop: 5 }}>
            {flags.map(f => <FlagBadge key={f.flag} flag={f.flag} comment={f.comment} />)}
          </div>
        )}
      </div>
      <div style={{ display: 'flex', gap: 2, opacity: hov ? 1 : 0, transition: 'opacity 0.15s', flexShrink: 0 }}>
        <button onClick={() => setEditing(true)} style={{ ...S.iconBtn }}
          onMouseEnter={e => e.currentTarget.style.color = '#38bdf8'}
          onMouseLeave={e => e.currentTarget.style.color = '#475569'}><Pencil size={11} /></button>
        <button onClick={onDelete} style={{ ...S.iconBtn }}
          onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
          onMouseLeave={e => e.currentTarget.style.color = '#475569'}><Trash2 size={11} /></button>
      </div>
    </div>
  );
}

// ─── AddRow ───────────────────────────────────────────────────────────────────
function AddRow({ onAdd }) {
  const [active, setActive] = useState(false);
  const [text, setText] = useState('');
  const [status, setStatus] = useState('진행중');
  const ref = useRef(null);
  useEffect(() => { if (active) ref.current?.focus(); }, [active]);
  const commit = () => {
    if (text.trim()) { onAdd({ id: genId(), text: text.trim(), status }); setText(''); setStatus('진행중'); }
    setActive(false);
  };
  if (!active) return (
    <button onClick={() => setActive(true)} style={{
      width: '100%', marginTop: 8, padding: '7px 0', background: 'transparent',
      border: '1px dashed rgba(255,255,255,0.07)', borderRadius: 8,
      color: '#334155', fontSize: 11, cursor: 'pointer',
      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, transition: 'all 0.15s'
    }}
    onMouseEnter={e => { e.currentTarget.style.borderColor = 'rgba(56,189,248,0.4)'; e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.background = 'rgba(56,189,248,0.04)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; e.currentTarget.style.color = '#334155'; e.currentTarget.style.background = 'transparent'; }}>
      <Plus size={12} />항목 추가 <span style={{ fontSize: 10, color: '#293548' }}>Enter ↵</span>
    </button>
  );
  return (
    <div style={{ marginTop: 8, background: 'rgba(255,255,255,0.03)', borderRadius: 9, padding: 10 }}>
      <input ref={ref} value={text} onChange={e => setText(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); commit(); } if (e.key === 'Escape') { setText(''); setActive(false); } }}
        placeholder="업무 내용 입력 후 Enter..."
        style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56,189,248,0.3)',
          borderRadius: 7, padding: '6px 10px', color: '#e2e8f0', fontSize: 12, outline: 'none',
          marginBottom: 8, boxSizing: 'border-box' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
          {STATUS_KEYS.map(s => { const c = STATUS_CFG[s]; return (
            <button key={s} onClick={() => setStatus(s)} style={{
              padding: '2px 8px', borderRadius: 5, fontSize: 9, fontWeight: 800, cursor: 'pointer',
              border: `1px solid ${status === s ? c.border : 'rgba(255,255,255,0.08)'}`,
              background: status === s ? c.bg : 'transparent',
              color: status === s ? c.color : '#475569', transition: 'all 0.12s',
            }}>{s}</button>
          ); })}
        </div>
        <div style={{ display: 'flex', gap: 4 }}>
          <button onClick={() => { setText(''); setActive(false); }} style={S.iconBtn}><X size={13} /></button>
          <button onClick={commit} style={{ ...S.iconBtn, color: '#38bdf8' }}><Check size={13} /></button>
        </div>
      </div>
    </div>
  );
}

// ─── WorkCard ─────────────────────────────────────────────────────────────────
function WorkCard({ cardKey, items, onItemsChange, onCarryOver, analysisData = [] }) {
  const cfg = CARD_CFG[cardKey];
  const done = items.filter(i => i.status === '완료').length;
  const delayed = items.filter(i => i.status === '지연').length;
  const pct = items.length ? Math.round((done / items.length) * 100) : 0;
  const upd = (id, u) => onItemsChange(p => p.map(i => i.id === id ? u : i));
  const del = (id) => onItemsChange(p => p.filter(i => i.id !== id));
  const add = (item) => onItemsChange(p => [...p, item]);
  const CardIcon = cardKey === 'prev' ? CheckCircle2 : cardKey === 'curr' ? Clock : Calendar;

  return (
    <div style={{ ...S.card, display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ padding: 8, borderRadius: 11, background: cfg.bg, border: `1px solid ${cfg.border}` }}>
            <CardIcon size={15} color={cfg.color} />
          </div>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9' }}>{cfg.label}</div>
            <div style={{ fontSize: 9, color: '#475569', fontFamily: 'monospace', marginTop: 2 }}>
              {items.length}개 항목{items.length > 0 ? ` · 완료 ${pct}%` : ''}
              {delayed > 0 ? <span style={{ color: '#f87171' }}> · 지연 {delayed}건</span> : ''}
            </div>
          </div>
        </div>
        {cardKey === 'curr' && onCarryOver && (
          <button onClick={onCarryOver}
            style={{ fontSize: 10, fontWeight: 700, padding: '4px 10px', borderRadius: 7,
              background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
              color: '#64748b', cursor: 'pointer', transition: 'all 0.15s' }}
            onMouseEnter={e => { e.currentTarget.style.color = '#38bdf8'; e.currentTarget.style.borderColor = 'rgba(56,189,248,0.3)'; }}
            onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)'; }}>
            전주로 이관 →
          </button>
        )}
      </div>

      {items.length > 0 && (
        <div style={{ display: 'flex', height: 3, background: 'rgba(255,255,255,0.05)', borderRadius: 3, marginBottom: 10, overflow: 'hidden', gap: 1 }}>
          <div style={{ width: `${pct}%`, background: '#34d399', borderRadius: 3, transition: 'width 0.6s' }} />
          {delayed > 0 && <div style={{ width: `${Math.round(delayed/items.length*100)}%`, background: '#f87171', borderRadius: 3 }} />}
        </div>
      )}

      <div style={{ flex: 1 }}>
        {items.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 72, color: '#293548', gap: 4 }}>
            <BarChart3 size={18} /><span style={{ fontSize: 11 }}>항목 없음</span>
          </div>
        )}
        {items.map((item, idx) => {
          const itemFlags = analysisData
            .filter(a => a.index === idx)
            .flatMap(a => (a.flags || []).map(f => ({ flag: f, comment: a.comment })));
          return (
            <WorkItem key={item.id} item={item} flags={itemFlags}
              onUpdate={u => upd(item.id, u)}
              onDelete={() => del(item.id)} />
          );
        })}
        <AddRow onAdd={add} />
      </div>
    </div>
  );
}

// ─── BottleneckChart ──────────────────────────────────────────────────────────
function BottleneckChart({ stats, activePart, onPartClick }) {
  return (
    <div>
      {stats.map(s => {
        const pct = s.total ? Math.round(s.delay / s.total * 100) : 0;
        const clr = pct >= 40 ? '#f87171' : pct >= 20 ? '#fbbf24' : '#34d399';
        const risk = pct >= 40 ? '위험' : pct >= 20 ? '주의' : '정상';
        const isActive = activePart === s.part;
        return (
          <div key={s.part}
            onClick={() => onPartClick(s.part)}
            style={{
              display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10,
              padding: '7px 10px', borderRadius: 9, cursor: 'pointer',
              background: isActive ? `rgba(${pct>=40?'248,113,113':pct>=20?'251,191,36':'52,211,153'},0.07)` : 'transparent',
              border: isActive ? `1px solid ${clr}33` : '1px solid transparent',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; }}
            onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8', width: 32, flexShrink: 0 }}>{s.part}</span>
            <div style={{ flex: 1, height: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${Math.max(pct, 2)}%`, background: clr,
                borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                paddingRight: 6, transition: 'width 0.6s' }}>
                {pct > 15 && <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(255,255,255,0.9)' }}>{pct}%</span>}
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: clr, fontFamily: 'monospace', width: 32, textAlign: 'right' }}>{pct}%</span>
            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4,
              background: `${clr}20`, border: `1px solid ${clr}40`, color: clr, flexShrink: 0 }}>{risk}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── HorizontalBarChart ───────────────────────────────────────────────────────
function HorizontalBarChart({ data, activePart }) {
  const [sel, setSel] = useState(null); // {cardKey, status}

  const rows = [
    { key: 'prev_work', label: '전주 실적', color: '#38bdf8' },
    { key: 'curr_work', label: '금주 진행', color: '#fbbf24' },
    { key: 'next_work', label: '차주 예정', color: '#34d399' },
  ];

  const getItems = (cardKey) => {
    if (activePart && activePart !== '전체') return data[activePart]?.[cardKey] || [];
    return PARTS.flatMap(p => (data[p]?.[cardKey] || []).map(i => ({ ...i, part: p })));
  };

  const handleClick = (cardKey, status) => {
    setSel(s => (s?.cardKey === cardKey && s?.status === status) ? null : { cardKey, status });
  };

  const filteredItems = sel ? getItems(sel.cardKey).filter(i => i.status === sel.status) : [];

  return (
    <div>
      {/* Chart card */}
      <div style={{ ...S.card, marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 7 }}>
              <TrendingUp size={15} color="#38bdf8" /> 업무 달성 현황
            </div>
            <div style={{ fontSize: 10, color: '#334155', marginTop: 3 }}>색상 바 클릭 → 해당 업무 목록 표시</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['완료','#34d399'],['진행중','#fbbf24'],['예정','#38bdf8'],['지연','#f87171']].map(([l,c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, color: '#64748b', cursor: 'default' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
        </div>

        {rows.map(row => {
          const items = getItems(row.key);
          const total = items.length;
          const done = items.filter(i => i.status === '완료').length;
          const pct = total ? Math.round(done / total * 100) : 0;
          const pctColor = pct >= 70 ? '#34d399' : pct >= 40 ? '#fbbf24' : '#f87171';
          const byCnt = {};
          STATUS_KEYS.forEach(s => { byCnt[s] = items.filter(i => i.status === s).length; });

          return (
            <div key={row.key} style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '12px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
              {/* Label */}
              <div style={{ width: 76, flexShrink: 0 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#94a3b8' }}>{row.label}</div>
                <div style={{ fontSize: 9, color: '#334155', fontFamily: 'monospace', marginTop: 2 }}>{total}건</div>
              </div>

              {/* Stacked bar */}
              <div style={{ flex: 1, height: 32, background: 'rgba(255,255,255,0.04)', borderRadius: 7, overflow: 'hidden', display: 'flex', border: '1px solid rgba(255,255,255,0.04)' }}>
                {total === 0 ? (
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, color: '#293548' }}>항목 없음</span>
                  </div>
                ) : STATUS_KEYS.filter(s => byCnt[s] > 0).map(s => {
                  const cfg = STATUS_CFG[s];
                  const w = Math.round(byCnt[s] / total * 100);
                  const isActive = sel?.cardKey === row.key && sel?.status === s;
                  const isDimmed = sel && !(sel.cardKey === row.key && sel.status === s);
                  return (
                    <div key={s}
                      onClick={() => handleClick(row.key, s)}
                      style={{
                        width: `${w}%`, height: '100%', background: cfg.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', position: 'relative', flexShrink: 0,
                        opacity: isDimmed ? 0.3 : 1,
                        outline: isActive ? `2px solid rgba(255,255,255,0.4)` : 'none',
                        outlineOffset: '-2px',
                        transition: 'opacity 0.2s, filter 0.15s',
                        filter: isActive ? 'brightness(1.15)' : 'none',
                      }}
                      onMouseEnter={e => { if (!isDimmed) e.currentTarget.style.filter = 'brightness(1.2)'; }}
                      onMouseLeave={e => { e.currentTarget.style.filter = isActive ? 'brightness(1.15)' : 'none'; }}
                      title={`${s}: ${byCnt[s]}건 (${w}%)`}
                    >
                      <span style={{ fontSize: 9, fontWeight: 800, color: 'rgba(0,0,0,0.6)', whiteSpace: 'nowrap', padding: '0 5px', pointerEvents: 'none' }}>
                        {w >= 14 ? `${s} ${w}%` : w >= 8 ? `${w}%` : ''}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Percentage */}
              <div style={{ width: 64, textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: total ? pctColor : '#293548', fontFamily: 'monospace', lineHeight: 1 }}>{total ? pct + '%' : '—'}</div>
                <div style={{ fontSize: 8, color: '#334155', marginTop: 3 }}>완료 달성률</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filtered task list */}
      {sel && filteredItems.length > 0 && (
        <div style={{ ...S.card, border: `1px solid ${STATUS_CFG[sel.status]?.border || 'rgba(255,255,255,0.1)'}`, marginBottom: 14, animation: 'fadeIn 0.2s ease' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: STATUS_CFG[sel.status]?.color, display: 'flex', alignItems: 'center', gap: 7 }}>
              <TrendingUp size={13} />
              {CARD_CFG[sel.cardKey.replace('_work', '')]?.label} · {sel.status} ({filteredItems.length}건)
            </div>
            <button onClick={() => setSel(null)} style={{ ...S.iconBtn }}>
              <X size={13} />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredItems.map((item, i) => {
              const cfg = STATUS_CFG[item.status] || STATUS_CFG['진행중'];
              return (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '9px 12px', background: `${cfg.color}0d`, border: `1px solid ${cfg.border}`, borderRadius: 9 }}>
                  <StatusTag status={item.status} />
                  <span style={{ flex: 1, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{item.text}</span>
                  {item.part && <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 5, border: '1px solid rgba(255,255,255,0.08)', color: '#64748b', background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>{item.part}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
      <style>{`@keyframes fadeIn{from{opacity:0;transform:translateY(-6px)}to{opacity:1;transform:translateY(0)}}`}</style>
    </div>
  );
}

// ─── AnalyticsView ────────────────────────────────────────────────────────────
function AnalyticsView({ selectedWeek, data }) {
  const [filterPart, setFilterPart] = useState(null);
  const [apartFilter, setApartFilter] = useState('전체');


  // Recalculate with apartFilter
  const activeStats2 = PARTS.map(part => {
    if (apartFilter !== '전체' && part !== apartFilter) return null;
    const rd = data[part] || { prev_work: [], curr_work: [], next_work: [] };
    const all = [...rd.prev_work, ...rd.curr_work, ...rd.next_work];
    return { part, done: all.filter(i=>i.status==='완료').length, ing: all.filter(i=>i.status==='진행중').length, plan: all.filter(i=>i.status==='예정').length, delay: all.filter(i=>i.status==='지연').length, total: all.length };
  }).filter(Boolean);

  const aTotalAll = activeStats2.reduce((a,s)=>a+s.total,0)||1;
  const aDoneAll  = activeStats2.reduce((a,s)=>a+s.done,0);
  const aDelayAll = activeStats2.reduce((a,s)=>a+s.delay,0);
  const aIngAll   = activeStats2.reduce((a,s)=>a+s.ing,0);

  const activeKpis = [
    { label: '완료율', value: Math.round(aDoneAll/aTotalAll*100)+'%', sub: `${aDoneAll}/${aTotalAll} 완료`, color: '#34d399', border: 'rgba(52,211,153,0.25)' },
    { label: '전체 업무', value: aTotalAll, sub: apartFilter==='전체'?'3개 파트 합산':'해당 파트', color: '#38bdf8', border: 'rgba(56,189,248,0.25)' },
    { label: '진행중', value: aIngAll, sub: '현재 처리 중', color: '#fbbf24', border: 'rgba(251,191,36,0.25)' },
    { label: '지연', value: aDelayAll, sub: aDelayAll>0?'즉시 조치 필요':'이슈 없음', color: '#f87171', border: 'rgba(248,113,113,0.25)' },
  ];

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', gap: 3, padding: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.05)' }}>
          {['전체', ...PARTS].map(p => (
            <button key={p} onClick={() => setApartFilter(p)} style={{ padding: '5px 14px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: apartFilter===p?'#fff':'transparent', color: apartFilter===p?'#0f172a':'#475569', transition: 'all 0.15s' }}>{p}</button>
          ))}
        </div>
        <span style={{ fontSize: 10, color: '#293548', fontFamily: 'monospace' }}>{selectedWeek}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 18 }}>
        {activeKpis.map(k => (
          <div key={k.label} style={{ ...S.card, border: `1px solid ${k.border}`, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: k.color, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: k.color }} />{k.label}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', lineHeight: 1, fontFamily: 'monospace' }}>{k.value}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <HorizontalBarChart data={data} activePart={apartFilter} />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
        {/* Bar chart */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
            <BarChart3 size={14} color="#38bdf8" /> 파트별 업무 현황
          </div>
          <div style={{ fontSize: 9, color: '#475569', marginBottom: 14 }}>전체 파트 상태별 분포</div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 12, flexWrap: 'wrap' }}>
            {[['완료','#34d399'],['진행중','#fbbf24'],['예정','#38bdf8'],['지연','#f87171']].map(([l,c]) => (
              <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 10, color: '#64748b' }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: c }} />{l}
              </div>
            ))}
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={chartData} barGap={3} barCategoryGap="30%">
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: '#334155', fontSize: 9 }} axisLine={false} tickLine={false} width={20} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.03)' }} />
              <Bar dataKey="완료"   fill="#34d399" radius={[3,3,0,0]} fillOpacity={0.85} />
              <Bar dataKey="진행중" fill="#fbbf24" radius={[3,3,0,0]} fillOpacity={0.85} />
              <Bar dataKey="예정"   fill="#38bdf8" radius={[3,3,0,0]} fillOpacity={0.85} />
              <Bar dataKey="지연"   fill="#f87171" radius={[3,3,0,0]} fillOpacity={0.9}
                onClick={(data) => handlePartClick(data.name)} style={{ cursor: 'pointer' }} />
            </BarChart>
          </ResponsiveContainer>
          <div style={{ fontSize: 9, color: '#334155', textAlign: 'center', marginTop: 4 }}>
            빨간 막대 클릭 시 해당 파트 지연 업무 필터링
          </div>
        </div>

        {/* Bottleneck */}
        <div style={{ ...S.card }}>
          <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 4, display: 'flex', alignItems: 'center', gap: 7 }}>
            <AlertTriangle size={14} color="#f87171" /> 업무 병목 지수
          </div>
          <div style={{ fontSize: 9, color: '#475569', marginBottom: 16 }}>
            지연 비율 기준 — 바 클릭 시 지연 업무 필터링
          </div>
          <BottleneckChart stats={stats} activePart={filterPart} onPartClick={handlePartClick} />
          <div style={{ marginTop: 16, padding: '10px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ fontSize: 9, color: '#475569', marginBottom: 6, fontWeight: 600 }}>기준</div>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {[['0–20%','정상','#34d399'],['20–40%','주의','#fbbf24'],['40%+','위험','#f87171']].map(([r,l,c]) => (
                <div key={l} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 9 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: c }} />
                  <span style={{ color: '#64748b' }}>{r}</span>
                  <span style={{ color: c, fontWeight: 700 }}>{l}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Delay filter panel */}
      {(filterPart || delayedItems.length > 0) && (
        <div style={{ ...S.card, border: '1px solid rgba(248,113,113,0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 700, color: '#f87171', display: 'flex', alignItems: 'center', gap: 7 }}>
              <AlertTriangle size={14} />
              {filterPart ? `${filterPart} 파트 지연 업무` : `전체 지연 업무 (${delayedItems.length}건)`}
            </div>
            {filterPart && (
              <button onClick={() => setFilterPart(null)}
                style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6,
                  border: '1px solid rgba(255,255,255,0.08)', background: 'transparent',
                  color: '#64748b', cursor: 'pointer' }}>
                필터 해제
              </button>
            )}
          </div>
          {delayedItems.length === 0 ? (
            <div style={{ fontSize: 12, color: '#34d399', display: 'flex', alignItems: 'center', gap: 7 }}>
              <CheckCircle2 size={14} /> 해당 파트 지연 업무 없음
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {delayedItems.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10,
                  padding: '10px 14px', background: 'rgba(248,113,113,0.05)',
                  border: '1px solid rgba(248,113,113,0.12)', borderRadius: 10 }}>
                  <StatusTag status="지연" size="sm" />
                  <span style={{ flex: 1, fontSize: 12, color: '#94a3b8', lineHeight: 1.5 }}>{item.text}</span>
                  <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 5,
                    border: '1px solid rgba(255,255,255,0.08)', color: '#64748b',
                    background: 'rgba(255,255,255,0.04)', flexShrink: 0 }}>{item.part}</span>
                  <span style={{ fontSize: 9, color: '#475569', flexShrink: 0 }}>{item.cardLabel}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── KanbanBoard ──────────────────────────────────────────────────────────────
function KanbanBoard({ data }) {
  const all = [];
  PARTS.forEach(part => {
    const rd = data[part] || {};
    ['prev_work','curr_work','next_work'].forEach(k =>
      (rd[k] || []).forEach(i => all.push({ ...i, part, cardKey: k.replace('_work',''), cardLabel: CARD_CFG[k.replace('_work','')]?.label }))
    );
  });
  const byS = {};
  STATUS_KEYS.forEach(s => { byS[s] = all.filter(i => i.status === s); });
  const total = all.length || 1;
  const stats = STATUS_KEYS.map(s => ({ key: s, count: byS[s].length, pct: Math.round(byS[s].length/total*100), cfg: STATUS_CFG[s] }));

  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, marginBottom: 20 }}>
        {stats.map(s => (
          <div key={s.key} style={{ ...S.card, border: `1px solid ${s.cfg.border}`, padding: '14px 18px' }}>
            <div style={{ fontSize: 10, fontWeight: 700, color: s.cfg.color, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 5 }}>
              <span style={{ width: 5, height: 5, borderRadius: '50%', background: s.cfg.color }} />{s.key}
            </div>
            <div style={{ fontSize: 26, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>{s.count}</div>
            <div style={{ fontSize: 9, color: '#475569', marginTop: 4 }}>전체의 {s.pct}%</div>
          </div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 12, alignItems: 'start' }}>
        {STATUS_KEYS.map(s => {
          const cfg = STATUS_CFG[s]; const items = byS[s];
          return (
            <div key={s} style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: cfg.bg, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: cfg.color }} />{s}
                </span>
                <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: cfg.bg, border: `1px solid ${cfg.border}`, color: cfg.color }}>{items.length}</span>
              </div>
              <div style={{ padding: 8, display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.length === 0 && <div style={{ padding: '18px 12px', textAlign: 'center', color: '#293548', fontSize: 11 }}>항목 없음</div>}
                {items.map((item, i) => {
                  const cc = CARD_CFG[item.cardKey];
                  return (
                    <div key={i} style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 10, padding: '10px 12px' }}>
                      <div style={{ fontSize: 11, color: '#cbd5e1', lineHeight: 1.5, marginBottom: 8 }}>{item.text}</div>
                      <div style={{ display: 'flex', gap: 4 }}>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: cc?.bg, border: `1px solid ${cc?.border}`, color: cc?.color }}>{item.part}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, padding: '1px 7px', borderRadius: 999, background: cc?.bg, border: `1px solid ${cc?.border}`, color: cc?.color }}>{item.cardLabel}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── SearchView ───────────────────────────────────────────────────────────────
function SearchView() {
  const [start, setStart] = useState('');
  const [end, setEnd]     = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [filterPart, setFP]   = useState('전체');
  const [filterStat, setFS]   = useState('전체');

  const handleSearch = async () => {
    if (!start || !end) return;
    setLoading(true);
    const ids = weekIdsInRange(start, end);
    const { data } = await supabase.from('weekly_reports').select('*').in('week_id', ids);
    setResults(data || []);
    setLoading(false);
  };

  const allItems = [];
  if (results) {
    results.forEach(row => {
      ['prev_work','curr_work','next_work'].forEach(k => {
        toItems(row[k]).forEach((i, idx) => {
          allItems.push({ ...i, week_id: row.week_id, part: row.part_name,
            cardLabel: CARD_CFG[k.replace('_work','')]?.label,
            rowKey: `${row.week_id}-${row.part_name}-${k}-${idx}` });
        });
      });
    });
  }

  const filtered = allItems.filter(i => {
    if (filterPart !== '전체' && i.part !== filterPart) return false;
    if (filterStat !== '전체' && i.status !== filterStat) return false;
    if (keyword && !i.text.toLowerCase().includes(keyword.toLowerCase())) return false;
    return true;
  });

  const inp = { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 9, padding: '8px 12px', color: '#e2e8f0', fontSize: 12, outline: 'none' };

  return (
    <div>
      <div style={{ ...S.card, marginBottom: 16 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 7 }}>
          <Search size={14} color="#38bdf8" /> 기간별 업무 검색
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'flex-end', flexWrap: 'wrap' }}>
          <div><div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 5 }}>시작일</div><input type="date" value={start} onChange={e => setStart(e.target.value)} style={inp} /></div>
          <div style={{ color: '#334155', paddingBottom: 10 }}>~</div>
          <div><div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 5 }}>종료일</div><input type="date" value={end} onChange={e => setEnd(e.target.value)} style={inp} /></div>
          <button onClick={handleSearch} disabled={!start || !end || loading} style={{
            padding: '9px 22px', borderRadius: 9, border: 'none',
            background: (!start || !end) ? '#1e293b' : '#0ea5e9',
            color: (!start || !end) ? '#475569' : '#fff',
            fontSize: 12, fontWeight: 700, cursor: (!start || !end) ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', gap: 6 }}>
            {loading ? <RefreshCw size={13} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={13} />}
            검색
          </button>
        </div>
      </div>

      {results && (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10, marginBottom: 14 }}>
            {STATUS_KEYS.map(s => { const cfg = STATUS_CFG[s]; return (
              <div key={s} style={{ ...S.card, border: `1px solid ${cfg.border}`, padding: '12px 16px' }}>
                <div style={{ fontSize: 9, fontWeight: 700, color: cfg.color, marginBottom: 3, display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 4, height: 4, borderRadius: '50%', background: cfg.color }} />{s}
                </div>
                <div style={{ fontSize: 22, fontWeight: 800, color: '#f1f5f9', fontFamily: 'monospace' }}>{filtered.filter(i=>i.status===s).length}</div>
              </div>
            ); })}
          </div>
          <div style={{ display: 'flex', gap: 10, marginBottom: 14, flexWrap: 'wrap', alignItems: 'center' }}>
            <input placeholder="키워드 검색..." value={keyword} onChange={e => setKeyword(e.target.value)} style={{ ...inp, width: 180 }} />
            <select value={filterPart} onChange={e => setFP(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option>전체</option>{PARTS.map(p => <option key={p}>{p}</option>)}
            </select>
            <select value={filterStat} onChange={e => setFS(e.target.value)} style={{ ...inp, cursor: 'pointer' }}>
              <option>전체</option>{STATUS_KEYS.map(s => <option key={s}>{s}</option>)}
            </select>
            <span style={{ fontSize: 11, color: '#475569', marginLeft: 'auto' }}>{filtered.length}개 항목 · {results.length}개 주차</span>
          </div>
          <div style={{ ...S.card, padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ background: 'rgba(255,255,255,0.02)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {['주차','파트','분류','업무 내용','상태'].map(h => (
                      <th key={h} style={{ padding: '9px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: '#64748b', whiteSpace: 'nowrap' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((item, i) => {
                    const sc = STATUS_CFG[item.status] || STATUS_CFG['진행중'];
                    return (
                      <tr key={item.rowKey} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', background: i % 2 ? 'rgba(255,255,255,0.01)' : 'transparent' }}>
                        <td style={{ padding: '9px 14px', color: '#94a3b8', fontFamily: 'monospace', fontSize: 11 }}>{item.week_id}</td>
                        <td style={{ padding: '9px 14px' }}><span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 999, background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>{item.part}</span></td>
                        <td style={{ padding: '9px 14px' }}><span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 999 }}>{item.cardLabel}</span></td>
                        <td style={{ padding: '9px 14px', color: '#cbd5e1', maxWidth: 280 }}>{item.text}</td>
                        <td style={{ padding: '9px 14px' }}><StatusTag status={item.status} /></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── WeekManager ──────────────────────────────────────────────────────────────
function WeekManager({ weeks, onClose, onAdd }) {
  const [date, setDate] = useState('');
  const preview = date ? dateToWeekId(date) : '';
  const exists = weeks.includes(preview);
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)', zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={onClose}>
      <div style={{ background: '#0f172a', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 22, padding: 32, width: 420, boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }} onClick={e => e.stopPropagation()}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 22 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#f1f5f9', display: 'flex', alignItems: 'center', gap: 8 }}>
            <PlusCircle size={16} color="#38bdf8" /> 주차 관리
          </div>
          <button onClick={onClose} style={S.iconBtn}><X size={16} /></button>
        </div>
        <div style={{ fontSize: 11, color: '#64748b', marginBottom: 8 }}>날짜 선택 → 해당 주차 자동 생성</div>
        <input type="date" value={date} onChange={e => setDate(e.target.value)} style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', color: '#e2e8f0', fontSize: 13, outline: 'none', marginBottom: 10, boxSizing: 'border-box' }} />
        {preview && (
          <div style={{ padding: '9px 14px', borderRadius: 10, background: exists ? 'rgba(251,191,36,0.08)' : 'rgba(56,189,248,0.08)', border: `1px solid ${exists ? 'rgba(251,191,36,0.25)' : 'rgba(56,189,248,0.25)'}`, fontSize: 12, color: exists ? '#fbbf24' : '#38bdf8', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
            <Calendar size={13} />
            <span style={{ fontFamily: 'monospace', fontWeight: 700 }}>{preview}</span>
            <span style={{ marginLeft: 'auto', fontSize: 10 }}>{exists ? '이미 존재' : weekIdToRange(preview)}</span>
          </div>
        )}
        <button onClick={() => { if (preview && !exists) { onAdd(preview); onClose(); } }} disabled={!preview || exists}
          style={{ width: '100%', padding: 11, borderRadius: 11, border: 'none', background: (!preview || exists) ? '#1e293b' : '#0ea5e9', color: (!preview || exists) ? '#334155' : '#fff', fontSize: 13, fontWeight: 700, cursor: (!preview || exists) ? 'not-allowed' : 'pointer' }}>
          {exists ? '이미 추가된 주차' : '주차 추가'}
        </button>
        <div style={{ marginTop: 20 }}>
          <div style={{ fontSize: 10, color: '#64748b', fontWeight: 600, marginBottom: 8 }}>등록된 주차 ({weeks.length})</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: 180, overflowY: 'auto' }}>
            {weeks.map(w => (
              <div key={w} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '7px 12px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)' }}>
                <span style={{ fontSize: 11, fontFamily: 'monospace', color: '#94a3b8' }}>{w}</span>
                <span style={{ fontSize: 9, color: '#475569' }}>{weekIdToRange(w)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({ msg, onClose }) {
  useEffect(() => { const t = setTimeout(onClose, 4000); return () => clearTimeout(t); }, [onClose]);
  return (
    <div style={{ position: 'fixed', bottom: 28, left: '50%', transform: 'translateX(-50%)', background: '#0f172a', border: '1px solid rgba(52,211,153,0.3)', borderRadius: 13, padding: '11px 20px', zIndex: 9999, display: 'flex', alignItems: 'center', gap: 10, boxShadow: '0 8px 32px rgba(0,0,0,0.5)', maxWidth: 480 }}>
      <Info size={14} color="#34d399" />
      <span style={{ fontSize: 12, color: '#94a3b8' }}>{msg}</span>
      <button onClick={onClose} style={{ ...S.iconBtn, marginLeft: 4 }}><X size={12} /></button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const EMPTY = () => ({ prev_work: [], curr_work: [], next_work: [], ax_case: '', notices: '' });

export default function MiraiDashboard() {
  const [weeks, setWeeks]             = useState([]);
  const [selectedWeek, setSelectedWeek] = useState('');
  const [activeTab, setActiveTab]     = useState(PARTS[0]);
  const [viewMode, setViewMode]       = useState('report');
  const [reportData, setReportData]   = useState(EMPTY());
  const [allPartData, setAllPartData] = useState({});
  const [loading, setLoading]         = useState(true);
  const [saveState, setSaveState]     = useState('idle');
  const [online, setOnline]           = useState(true);
  const [toast, setToast]             = useState(null);
  const [showWeekMgr, setShowWeekMgr] = useState(false);
  const [analysis, setAnalysis]       = useState(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [showAnalysis, setShowAnalysis] = useState(false);

  useEffect(() => {
    const on = () => setOnline(true), off = () => setOnline(false);
    window.addEventListener('online', on); window.addEventListener('offline', off);
    return () => { window.removeEventListener('online', on); window.removeEventListener('offline', off); };
  }, []);

  // Load weeks from DB
  useEffect(() => {
    async function loadWeeks() {
      const { data } = await supabase.from('weekly_reports').select('week_id');
      const ids = [...new Set((data || []).map(r => r.week_id))].sort();
      const cur = dateToWeekId(new Date());
      const all = ids.includes(cur) ? ids : [...ids, cur].sort();
      setWeeks(all);
      setSelectedWeek(all[all.length - 1] || cur);
    }
    loadWeeks();
  }, []);

  // Load report data + cross-week carry-over
  useEffect(() => {
    if (!selectedWeek) return;
    async function load() {
      setLoading(true); setAnalysis(null);
      try {
        const { data } = await supabase.from('weekly_reports').select('*')
          .eq('week_id', selectedWeek).eq('part_name', activeTab).maybeSingle();
        if (data) {
          setReportData({ prev_work: toItems(data.prev_work), curr_work: toItems(data.curr_work), next_work: toItems(data.next_work), ax_case: data.ax_case || '', notices: data.notices || '' });
        } else {
          const wIdx = weeks.indexOf(selectedWeek);
          let auto = EMPTY();
          if (wIdx > 0) {
            const { data: prev } = await supabase.from('weekly_reports').select('curr_work')
              .eq('week_id', weeks[wIdx - 1]).eq('part_name', activeTab).maybeSingle();
            if (prev?.curr_work?.length) {
              auto = { ...EMPTY(), prev_work: toItems(prev.curr_work) };
              setToast(`✅ ${weeks[wIdx - 1]} 금주 내용 → 전주 실적 자동 이관`);
            }
          }
          setReportData(auto);
        }
      } catch (e) { console.error(e); }
      setLoading(false);
    }
    load();
  }, [selectedWeek, activeTab, weeks]);

  // Load all parts for analytics/board
  useEffect(() => {
    if (!selectedWeek || (viewMode !== 'analytics' && viewMode !== 'board')) return;
    async function loadAll() {
      const { data: rows } = await supabase.from('weekly_reports').select('*').eq('week_id', selectedWeek);
      const map = {};
      (rows || []).forEach(r => {
        map[r.part_name] = { prev_work: toItems(r.prev_work), curr_work: toItems(r.curr_work), next_work: toItems(r.next_work) };
      });
      map[activeTab] = { prev_work: reportData.prev_work, curr_work: reportData.curr_work, next_work: reportData.next_work };
      setAllPartData(map);
    }
    loadAll();
  }, [viewMode, selectedWeek, reportData]); // eslint-disable-line

  const handleSave = async () => {
    setSaveState('saving');
    try {
      const { error } = await supabase.from('weekly_reports').upsert({
        week_id: selectedWeek, part_name: activeTab,
        prev_work: fromItems(reportData.prev_work), curr_work: fromItems(reportData.curr_work),
        next_work: fromItems(reportData.next_work), ax_case: reportData.ax_case, notices: reportData.notices,
      }, { onConflict: 'week_id,part_name' });
      setSaveState(error ? 'error' : 'saved');
    } catch { setSaveState('error'); }
    setTimeout(() => setSaveState('idle'), 2500);
  };

  const handleCarryOver = () => {
    if (!reportData.curr_work.length) { setToast('금주 진행 사항이 없습니다.'); return; }
    if (!window.confirm('금주 진행 내용을 전주 실적으로 이관하고 금주를 초기화할까요?')) return;
    setReportData(p => ({ ...p, prev_work: [...p.curr_work], curr_work: [] }));
    setToast('✅ 금주 → 전주 이관 완료. 저장 버튼을 눌러주세요.');
  };

  const handleAnalyze = async () => {
    setShowAnalysis(true); setAnalysisLoading(true); setAnalysis(null);
    try {
      const res = await fetch('/api/analyze', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ reportData, activeTab, selectedWeek }) });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch (e) { setToast('AI 분석 실패: ' + e.message); setShowAnalysis(false); }
    setAnalysisLoading(false);
  };

  useEffect(() => {
    const h = (e) => { if ((e.ctrlKey || e.metaKey) && e.key === 's') { e.preventDefault(); handleSave(); } };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [reportData]); // eslint-disable-line

  const patch = (field) => (updater) => setReportData(p => ({ ...p, [field]: typeof updater === 'function' ? updater(p[field]) : updater }));

  const saveBg    = { idle: '#0ea5e9', saving: '#334155', saved: '#10b981', error: '#ef4444' };
  const saveLabel = { idle: '저장', saving: '저장 중...', saved: '저장됨 ✓', error: '저장 실패' };
  const VIEWS = [
    { key: 'report',    icon: <FileText size={13} />,    label: '보고서' },
    { key: 'analytics', icon: <TrendingUp size={13} />,  label: '분석' },
    { key: 'board',     icon: <LayoutGrid size={13} />,  label: '현황판' },
    { key: 'search',    icon: <Search size={13} />,      label: '검색' },
  ];

  const analyticsData = { ...allPartData, [activeTab]: { prev_work: reportData.prev_work, curr_work: reportData.curr_work, next_work: reportData.next_work } };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#070b12', color: '#e2e8f0', overflow: 'hidden', fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width: 232, flexShrink: 0, borderRight: '1px solid rgba(255,255,255,0.05)', display: 'flex', flexDirection: 'column', background: '#0a0e14' }}>
        <div style={{ padding: '22px 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 30, height: 30, borderRadius: 9, background: 'rgba(14,165,233,0.15)', border: '1px solid rgba(14,165,233,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LayoutDashboard size={14} color="#38bdf8" />
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 900, color: '#f1f5f9', letterSpacing: '-0.5px' }}>MIRAI</div>
              <div style={{ fontSize: 8, fontWeight: 700, color: '#0ea5e9', letterSpacing: '0.18em', marginTop: 1 }}>미래인재실</div>
            </div>
          </div>
        </div>

        <div style={{ padding: '10px 14px', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 9, fontWeight: 700, padding: '4px 8px', borderRadius: 7, color: online ? '#34d399' : '#f87171', background: online ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}>
            {online ? <Wifi size={10} /> : <WifiOff size={10} />}
            {online ? 'Supabase 연결됨' : '오프라인'}
          </div>
        </div>

        <div style={{ padding: '12px 10px', flex: 1, overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 6px', marginBottom: 8 }}>
            <div style={{ fontSize: 8, fontWeight: 800, color: '#293548', letterSpacing: '0.2em' }}>WEEKS</div>
            <button onClick={() => setShowWeekMgr(true)} style={{ ...S.iconBtn, color: '#38bdf8' }} title="주차 추가"><PlusCircle size={13} /></button>
          </div>
          <nav style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {weeks.map(w => {
              const active = selectedWeek === w;
              return (
                <button key={w} onClick={() => setSelectedWeek(w)} style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '8px 12px', borderRadius: 11, border: active ? '1px solid rgba(14,165,233,0.2)' : '1px solid transparent',
                  background: active ? 'rgba(14,165,233,0.1)' : 'transparent',
                  color: active ? '#38bdf8' : '#475569', cursor: 'pointer', textAlign: 'left', transition: 'all 0.15s',
                }}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'rgba(255,255,255,0.03)'; e.currentTarget.style.color = '#94a3b8'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#475569'; } }}>
                  <div>
                    <div style={{ fontSize: 11, fontWeight: 700, fontFamily: 'monospace' }}>{w}</div>
                    {active && <div style={{ fontSize: 8, color: '#0ea5e9', marginTop: 2 }}>{weekIdToRange(w)}</div>}
                  </div>
                  <ChevronRight size={11} style={{ opacity: active ? 1 : 0 }} />
                </button>
              );
            })}
            {!weeks.length && <div style={{ fontSize: 11, color: '#293548', textAlign: 'center', padding: '20px 8px' }}>+ 버튼으로 주차 추가</div>}
          </nav>
        </div>

        <div style={{ padding: '14px 16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {[['저장', '⌘S'], ['항목 편집', '더블클릭'], ['추가 취소', 'Esc']].map(([l, k]) => (
            <div key={l} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
              <span style={{ fontSize: 9, color: '#293548' }}>{l}</span>
              <kbd style={{ background: 'rgba(255,255,255,0.05)', padding: '1px 5px', borderRadius: 4, fontSize: 8, fontFamily: 'monospace', color: '#334155' }}>{k}</kbd>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <header style={{ padding: '13px 28px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(7,11,18,0.85)', backdropFilter: 'blur(20px)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h1 style={{ fontSize: 17, fontWeight: 900, color: '#f1f5f9', margin: 0, letterSpacing: '-0.5px' }}>주간업무 보고</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 2 }}>
              <Calendar size={10} color="#0ea5e9" />
              <span style={{ fontSize: 10, color: '#475569', fontFamily: 'monospace' }}>{selectedWeek || '—'}</span>
              <span style={{ color: '#1e293b' }}>·</span>
              <span style={{ fontSize: 10, color: '#475569' }}>{activeTab} 파트</span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div style={{ display: 'flex', gap: 2, padding: 3, background: 'rgba(255,255,255,0.04)', borderRadius: 10, border: '1px solid rgba(255,255,255,0.06)' }}>
              {VIEWS.map(v => (
                <button key={v.key} onClick={() => setViewMode(v.key)} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '5px 11px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 700, background: viewMode === v.key ? '#fff' : 'transparent', color: viewMode === v.key ? '#0f172a' : '#475569', transition: 'all 0.15s' }}>
                  {v.icon}{v.label}
                </button>
              ))}
            </div>
            {viewMode === 'report' && (
              <button onClick={handleAnalyze} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 9, border: '1px solid rgba(139,92,246,0.3)', background: 'rgba(139,92,246,0.1)', color: '#a78bfa', fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(139,92,246,0.2)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(139,92,246,0.1)'}>
                <Bot size={13} /> AI 분석
              </button>
            )}
            {saveState !== 'idle' && <span style={{ fontSize: 11, fontWeight: 700, color: saveBg[saveState] }}>{saveLabel[saveState]}</span>}
            <button onClick={handleSave} disabled={saveState === 'saving'} style={{ display: 'flex', alignItems: 'center', gap: 5, background: saveBg[saveState], color: '#fff', padding: '7px 18px', borderRadius: 9, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.2s' }}>
              <Save size={13} />{saveLabel[saveState]}
            </button>
          </div>
        </header>

        <div style={{ flex: 1, overflowY: 'auto', padding: '22px 28px' }}>
          {/* REPORT */}
          {viewMode === 'report' && (
            <>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                <div style={{ display: 'flex', gap: 4, padding: 3, background: 'rgba(255,255,255,0.03)', borderRadius: 13, border: '1px solid rgba(255,255,255,0.05)' }}>
                  {PARTS.map(p => (
                    <button key={p} onClick={() => setActiveTab(p)} style={{ padding: '6px 18px', borderRadius: 10, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: activeTab === p ? '#fff' : 'transparent', color: activeTab === p ? '#0f172a' : '#475569', transition: 'all 0.2s' }}>
                      {p} <span style={{ fontSize: 9, opacity: 0.5 }}>파트</span>
                    </button>
                  ))}
                </div>
                <span style={{ fontSize: 10, color: '#334155', fontFamily: 'monospace' }}>{selectedWeek}</span>
              </div>

              {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: 280, gap: 12, color: '#475569' }}>
                  <RefreshCw size={22} style={{ animation: 'spin 1s linear infinite' }} />
                  <span style={{ fontSize: 13 }}>데이터 동기화 중...</span>
                  <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 16, marginBottom: 16 }}>
                    {['prev', 'curr', 'next'].map(key => (
                      <WorkCard key={key} cardKey={key}
                        items={reportData[`${key}_work`]}
                        onItemsChange={patch(`${key}_work`)}
                        onCarryOver={key === 'curr' ? handleCarryOver : undefined}
                        analysisData={analysis?.[`${key}_work`] || []}
                      />
                    ))}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      { f: 'ax_case', icon: <Sparkles size={13} color="#818cf8" />, label: 'AX 사례 공유', sub: 'AI 혁신 적용 내용', c: '#818cf8', ph: '이번 주 AX 적용 사례를 기록해 주세요...' },
                      { f: 'notices', icon: <Megaphone size={13} color="#f87171" />, label: '파트 공지 사항', sub: '팀원 공유 필수 사항', c: '#f87171', ph: '팀원들에게 전달할 공지 사항을 입력해 주세요...' },
                    ].map(({ f, icon, label, sub, c, ph }) => (
                      <div key={f} style={S.card}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
                          <div style={{ padding: 7, borderRadius: 9, background: `${c}18`, border: `1px solid ${c}30` }}>{icon}</div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#f1f5f9' }}>{label}</div>
                            <div style={{ fontSize: 9, color: '#475569', marginTop: 2 }}>{sub}</div>
                          </div>
                          <span style={{ fontSize: 9, color: '#293548', fontFamily: 'monospace' }}>{(reportData[f] || '').length}자</span>
                        </div>
                        <textarea value={reportData[f] || ''} onChange={e => setReportData(p => ({ ...p, [f]: e.target.value }))} placeholder={ph}
                          style={{ width: '100%', background: 'transparent', border: 'none', color: '#94a3b8', fontSize: 12, lineHeight: 1.7, resize: 'none', height: 96, outline: 'none', fontFamily: "'Noto Sans KR', sans-serif", boxSizing: 'border-box' }} />
                        <div style={{ height: 2, background: 'rgba(255,255,255,0.05)', borderRadius: 999, overflow: 'hidden', marginTop: 6 }}>
                          <div style={{ height: '100%', background: c, borderRadius: 999, width: `${Math.min(((reportData[f]?.length || 0) / 300) * 100, 100)}%`, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {showAnalysis && (
                    <div style={{ marginTop: 16, background: '#0f172a', border: '1px solid rgba(139,92,246,0.2)', borderRadius: 16, overflow: 'hidden' }}>
                      <div style={{ padding: '12px 18px', borderBottom: '1px solid rgba(255,255,255,0.06)', background: 'rgba(139,92,246,0.08)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: '#a78bfa', display: 'flex', alignItems: 'center', gap: 7 }}>
                          <Bot size={14} /> AI 분석 — {activeTab} 파트
                        </span>
                        <button onClick={() => setShowAnalysis(false)} style={S.iconBtn}><X size={13} /></button>
                      </div>
                      <div style={{ padding: 16 }}>
                        {analysisLoading ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#64748b', fontSize: 12 }}>
                            <RefreshCw size={15} style={{ animation: 'spin 1s linear infinite', color: '#a78bfa' }} />
                            Claude가 보고서를 분석 중입니다...
                          </div>
                        ) : analysis ? (
                          <>
                            {analysis.summary && <div style={{ padding: '10px 14px', borderRadius: 10, background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.15)', fontSize: 11, color: '#c4b5fd', lineHeight: 1.7, marginBottom: 12 }}>{analysis.summary}</div>}
                            {['prev_work','curr_work','next_work'].map(key => {
                              const items = (analysis[key] || []).filter(x => x.flags?.length);
                              if (!items.length) return null;
                              const label = { prev_work: '전주 실적', curr_work: '금주 진행', next_work: '차주 예정' }[key];
                              return (
                                <div key={key} style={{ marginBottom: 12 }}>
                                  <div style={{ fontSize: 9, fontWeight: 700, color: '#475569', marginBottom: 6, letterSpacing: '0.1em' }}>{label}</div>
                                  {items.map(item => (
                                    <div key={item.index} style={{ padding: '9px 12px', borderRadius: 9, background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', marginBottom: 5 }}>
                                      <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap', marginBottom: 5 }}>
                                        {item.flags.map(f => <FlagBadge key={f} flag={f} comment={item.comment} />)}
                                      </div>
                                      {item.comment && <div style={{ fontSize: 10, color: '#64748b', lineHeight: 1.5 }}>{item.comment}</div>}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </>
                        ) : null}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {viewMode === 'analytics' && <AnalyticsView selectedWeek={selectedWeek} data={analyticsData} />}
          {viewMode === 'board'     && <KanbanBoard data={analyticsData} />}
          {viewMode === 'search'    && <SearchView />}
        </div>
      </main>

      {showWeekMgr && <WeekManager weeks={weeks} onClose={() => setShowWeekMgr(false)} onAdd={w => { setWeeks(p => [...new Set([...p, w])].sort()); setSelectedWeek(w); setToast(`주차 ${w} 추가됨`); }} />}
      {toast && <Toast msg={toast} onClose={() => setToast(null)} />}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
