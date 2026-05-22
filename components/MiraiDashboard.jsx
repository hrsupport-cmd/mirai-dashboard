'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  LayoutDashboard, Sparkles, Megaphone, Calendar,
  ChevronRight, Save, ArrowRight, Clock, CheckCircle2,
  Pencil, Trash2, Plus, X, Check, GripVertical,
  AlertTriangle, Wifi, WifiOff, RefreshCw, ChevronDown,
  TrendingUp, BarChart3, Zap, Users
} from 'lucide-react';

// ─── Supabase ───────────────────────────────────────────────────────────────
const SUPABASE_URL = "https://tdqvoyhdeseuncqtytpv.supabase.co";
const SUPABASE_KEY = "sb_publishable_amfdIcyLqxdB8oLI3A8zGw_2La0DJS-";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// ─── Constants ──────────────────────────────────────────────────────────────
const PARTS = ["인사", "총무", "직속"];
const WEEKS = ["2026-05-W3", "2026-05-W4", "2026-06-W1", "2026-06-W2"];

const STATUS_CONFIG = {
  완료:   { color: "text-emerald-400", bg: "bg-emerald-400/10", border: "border-emerald-400/20", dot: "bg-emerald-400" },
  진행중: { color: "text-amber-400",   bg: "bg-amber-400/10",   border: "border-amber-400/20",   dot: "bg-amber-400" },
  예정:   { color: "text-sky-400",     bg: "bg-sky-400/10",     border: "border-sky-400/20",     dot: "bg-sky-400"   },
  지연:   { color: "text-rose-400",    bg: "bg-rose-400/10",    border: "border-rose-400/20",    dot: "bg-rose-400"  },
};

// ─── Utils ───────────────────────────────────────────────────────────────────
function genId() {
  return Math.random().toString(36).slice(2, 9);
}

function toItems(arr) {
  if (!arr || arr.length === 0) return [];
  return arr.map(i =>
    typeof i === 'string'
      ? { id: genId(), text: i, status: '진행중' }
      : { id: genId(), ...i }
  );
}

function fromItems(items) {
  return items.map(({ text, status }) => ({ text, status }));
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────
function StatusBadge({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['진행중'];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${cfg.color} ${cfg.bg} ${cfg.border} transition-all hover:opacity-80`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        {status}
        <ChevronDown size={9} />
      </button>
      {open && (
        <div className="absolute z-50 top-6 left-0 bg-[#1a1f2e] border border-white/10 rounded-xl overflow-hidden shadow-2xl shadow-black/50 w-20">
          {Object.keys(STATUS_CONFIG).map(s => (
            <button
              key={s}
              onClick={() => { onChange(s); setOpen(false); }}
              className={`w-full text-left px-3 py-2 text-[11px] font-semibold ${STATUS_CONFIG[s].color} hover:bg-white/5 transition-colors`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── WorkItem (inline editable, deletable) ───────────────────────────────────
function WorkItem({ item, onUpdate, onDelete, colorKey }) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft]   = useState(item.text);
  const inputRef = useRef(null);

  useEffect(() => {
    if (editing) inputRef.current?.focus();
  }, [editing]);

  const commit = () => {
    if (draft.trim()) onUpdate({ ...item, text: draft.trim() });
    else onDelete();
    setEditing(false);
  };

  const colorDotMap = {
    sky:     'bg-sky-400',
    amber:   'bg-amber-400',
    emerald: 'bg-emerald-400',
  };

  return (
    <div className="group/item flex items-start gap-3 py-2.5 px-3 -mx-3 rounded-xl hover:bg-white/[0.03] transition-all duration-200 animate-slide-up">
      {/* Grip handle */}
      <GripVertical size={14} className="mt-1 text-slate-700 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0 cursor-grab" />

      {/* Dot */}
      <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${colorDotMap[colorKey]}`} />

      {/* Text / Input */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <input
            ref={inputRef}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            onBlur={commit}
            onKeyDown={e => {
              if (e.key === 'Enter') commit();
              if (e.key === 'Escape') { setDraft(item.text); setEditing(false); }
            }}
            className="w-full bg-white/5 border border-sky-500/40 rounded-lg px-2 py-1 text-sm text-slate-200 focus:border-sky-400 transition-colors"
          />
        ) : (
          <span
            className="block text-sm text-slate-400 group-hover/item:text-slate-200 transition-colors leading-relaxed cursor-text"
            onDoubleClick={() => setEditing(true)}
          >
            {item.text}
          </span>
        )}
      </div>

      {/* Status badge */}
      <div className="shrink-0">
        <StatusBadge
          status={item.status}
          onChange={s => onUpdate({ ...item, status: s })}
        />
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0">
        <button
          onClick={() => setEditing(true)}
          className="p-1 rounded-lg text-slate-600 hover:text-sky-400 hover:bg-sky-400/10 transition-all"
          title="수정 (더블클릭도 가능)"
        >
          <Pencil size={12} />
        </button>
        <button
          onClick={onDelete}
          className="p-1 rounded-lg text-slate-600 hover:text-rose-400 hover:bg-rose-400/10 transition-all"
          title="삭제"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}

// ─── AddItemRow ───────────────────────────────────────────────────────────────
function AddItemRow({ onAdd, colorKey }) {
  const [active, setActive] = useState(false);
  const [text, setText]     = useState('');
  const [status, setStatus] = useState('진행중');
  const inputRef = useRef(null);

  const colorBorderMap = {
    sky:     'focus:border-sky-500/60',
    amber:   'focus:border-amber-500/60',
    emerald: 'focus:border-emerald-500/60',
  };

  useEffect(() => {
    if (active) inputRef.current?.focus();
  }, [active]);

  const commit = () => {
    if (text.trim()) {
      onAdd({ id: genId(), text: text.trim(), status });
      setText('');
      setStatus('진행중');
    }
    setActive(false);
  };

  if (!active) {
    return (
      <button
        onClick={() => setActive(true)}
        className="w-full mt-3 py-3 rounded-xl border border-dashed border-slate-800 text-slate-600 text-xs flex items-center justify-center gap-2 hover:border-sky-500/40 hover:text-sky-500 hover:bg-sky-500/5 transition-all duration-200 group/add"
      >
        <Plus size={13} className="group-hover/add:rotate-90 transition-transform duration-200" />
        항목 추가  <span className="text-slate-700 text-[10px]">Enter ↵</span>
      </button>
    );
  }

  return (
    <div className="mt-3 bg-white/5 border border-white/10 rounded-xl p-3 animate-slide-up">
      <input
        ref={inputRef}
        value={text}
        onChange={e => setText(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter') commit();
          if (e.key === 'Escape') { setText(''); setActive(false); }
        }}
        placeholder="업무 내용을 입력하세요..."
        className={`w-full bg-transparent border border-white/10 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder:text-slate-700 ${colorBorderMap[colorKey]} transition-colors mb-2`}
      />
      <div className="flex items-center justify-between">
        <div className="flex gap-1">
          {Object.keys(STATUS_CONFIG).map(s => {
            const cfg = STATUS_CONFIG[s];
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all ${
                  status === s
                    ? `${cfg.color} ${cfg.bg} ${cfg.border}`
                    : 'text-slate-600 border-slate-800 hover:border-slate-600'
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
        <div className="flex gap-1.5">
          <button
            onClick={() => { setText(''); setActive(false); }}
            className="p-1.5 rounded-lg text-slate-600 hover:text-slate-300 hover:bg-white/5 transition-all"
          >
            <X size={13} />
          </button>
          <button
            onClick={commit}
            className="p-1.5 rounded-lg text-sky-400 bg-sky-400/10 hover:bg-sky-400/20 transition-all"
          >
            <Check size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── WorkCard ─────────────────────────────────────────────────────────────────
function WorkCard({ title, items, icon, colorKey, isEditable, onItemsChange, onCarryOver }) {
  const colorHeaderMap = {
    sky:     'text-sky-400',
    amber:   'text-amber-400',
    emerald: 'text-emerald-400',
  };
  const colorBgMap = {
    sky:     'bg-sky-400/10 border-sky-400/20',
    amber:   'bg-amber-400/10 border-amber-400/20',
    emerald: 'bg-emerald-400/10 border-emerald-400/20',
  };

  const doneCount  = items.filter(i => i.status === '완료').length;
  const totalCount = items.length;

  const handleUpdate = (id, updated) =>
    onItemsChange?.(items.map(i => i.id === id ? updated : i));

  const handleDelete = (id) =>
    onItemsChange?.(items.filter(i => i.id !== id));

  const handleAdd = (newItem) =>
    onItemsChange?.([...items, newItem]);

  return (
    <div className="relative bg-[#0d1117] border border-white/[0.06] rounded-3xl p-7 hover:border-white/10 transition-all duration-500 flex flex-col group/card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-xl border ${colorBgMap[colorKey]}`}>
            <span className={colorHeaderMap[colorKey]}>{icon}</span>
          </div>
          <div>
            <h3 className="text-white font-bold text-sm">{title}</h3>
            <p className="text-slate-600 text-[10px] mt-0.5 font-mono">{totalCount}개 항목</p>
          </div>
        </div>
        {/* Progress + carry-over */}
        <div className="flex items-center gap-2">
          {totalCount > 0 && (
            <span className={`text-[10px] font-bold font-mono ${colorHeaderMap[colorKey]}`}>
              {doneCount}/{totalCount}
            </span>
          )}
          {onCarryOver && (
            <button
              onClick={onCarryOver}
              title="금주→전주 이관"
              className="opacity-0 group-hover/card:opacity-100 flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-sky-500/20 hover:text-sky-400 text-slate-500 border border-white/5 hover:border-sky-500/30 transition-all"
            >
              이관 <ArrowRight size={9} />
            </button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalCount > 0 && (
        <div className="h-0.5 bg-white/5 rounded-full mb-5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              colorKey === 'sky' ? 'bg-sky-400' : colorKey === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
            }`}
            style={{ width: `${(doneCount / totalCount) * 100}%` }}
          />
        </div>
      )}

      {/* Items */}
      <div className="flex-1 min-h-[80px]">
        {items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-20 text-slate-700 text-xs gap-1">
            <BarChart3 size={20} className="opacity-30" />
            <span>업무 항목이 없습니다</span>
          </div>
        )}
        {items.map(item =>
          isEditable ? (
            <WorkItem
              key={item.id}
              item={item}
              colorKey={colorKey}
              onUpdate={u => handleUpdate(item.id, u)}
              onDelete={() => handleDelete(item.id)}
            />
          ) : (
            // Read-only row
            <div key={item.id} className="flex items-start gap-3 py-2.5">
              <span className={`mt-2 w-1.5 h-1.5 rounded-full shrink-0 ${
                colorKey === 'sky' ? 'bg-sky-400' : colorKey === 'amber' ? 'bg-amber-400' : 'bg-emerald-400'
              }`} />
              <span className="flex-1 text-sm text-slate-400 leading-relaxed">{item.text}</span>
              <StatusBadge status={item.status} onChange={() => {}} />
            </div>
          )
        )}
        {isEditable && <AddItemRow onAdd={handleAdd} colorKey={colorKey} />}
      </div>
    </div>
  );
}

// ─── SaveStatusIndicator ─────────────────────────────────────────────────────
function SaveIndicator({ state }) {
  const map = {
    idle:   { icon: <Save size={14}/>,          text: '',          cls: 'text-slate-600' },
    saving: { icon: <RefreshCw size={14} className="animate-spin"/>, text: '저장 중...', cls: 'text-sky-400' },
    saved:  { icon: <CheckCircle2 size={14}/>,  text: '저장 완료', cls: 'text-emerald-400' },
    error:  { icon: <AlertTriangle size={14}/>, text: '저장 실패', cls: 'text-rose-400' },
  };
  const m = map[state];
  return (
    <div className={`flex items-center gap-1.5 text-xs font-medium ${m.cls} transition-all`}>
      {m.icon}
      {m.text}
    </div>
  );
}

// ─── StatsCard ────────────────────────────────────────────────────────────────
function StatsBar({ allItems }) {
  const byStatus = allItems.reduce((acc, i) => {
    acc[i.status] = (acc[i.status] || 0) + 1;
    return acc;
  }, {});

  const total = allItems.length || 1;
  const stats = [
    { label: '완료',   count: byStatus['완료']   || 0, color: 'bg-emerald-400', textColor: 'text-emerald-400' },
    { label: '진행중', count: byStatus['진행중'] || 0, color: 'bg-amber-400',   textColor: 'text-amber-400' },
    { label: '예정',   count: byStatus['예정']   || 0, color: 'bg-sky-400',     textColor: 'text-sky-400' },
    { label: '지연',   count: byStatus['지연']   || 0, color: 'bg-rose-400',    textColor: 'text-rose-400' },
  ];

  return (
    <div className="flex items-center gap-6">
      {stats.map(s => (
        <div key={s.label} className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${s.color}`} />
          <span className="text-xs text-slate-500">{s.label}</span>
          <span className={`text-xs font-bold font-mono ${s.textColor}`}>{s.count}</span>
        </div>
      ))}
    </div>
  );
}

// ─── Main Dashboard ───────────────────────────────────────────────────────────
const EMPTY_REPORT = {
  prev_work: [],
  curr_work: [],
  next_work: [],
  ax_case: '',
  notices: '',
};

export default function MiraiDashboard() {
  const [selectedWeek, setSelectedWeek] = useState(WEEKS[0]);
  const [activeTab, setActiveTab]       = useState(PARTS[0]);
  const [reportData, setReportData]     = useState(EMPTY_REPORT);
  const [loading, setLoading]           = useState(true);
  const [saveState, setSaveState]       = useState('idle'); // idle | saving | saved | error
  const [online, setOnline]             = useState(true);
  const saveTimerRef = useRef(null);

  // Network status
  useEffect(() => {
    const onOnline  = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online',  onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  // Load data
  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const { data } = await supabase
          .from('weekly_reports')
          .select('*')
          .eq('week_id', selectedWeek)
          .eq('part_name', activeTab)
          .maybeSingle();

        if (data) {
          setReportData({
            prev_work: toItems(data.prev_work),
            curr_work: toItems(data.curr_work),
            next_work: toItems(data.next_work),
            ax_case:   data.ax_case   || '',
            notices:   data.notices   || '',
          });
        } else {
          setReportData(EMPTY_REPORT);
        }
      } catch (err) {
        console.error('Load error:', err);
      }
      setLoading(false);
    }
    load();
  }, [selectedWeek, activeTab]);

  // Auto-save with debounce
  const triggerAutoSave = useCallback(() => {
    clearTimeout(saveTimerRef.current);
    setSaveState('idle');
    saveTimerRef.current = setTimeout(() => {
      handleSave();
    }, 2000);
  }, [reportData]); // eslint-disable-line

  // Save function
  const handleSave = async () => {
    setSaveState('saving');
    try {
      const { error } = await supabase
        .from('weekly_reports')
        .upsert({
          week_id:   selectedWeek,
          part_name: activeTab,
          prev_work: fromItems(reportData.prev_work),
          curr_work: fromItems(reportData.curr_work),
          next_work: fromItems(reportData.next_work),
          ax_case:   reportData.ax_case,
          notices:   reportData.notices,
        }, { onConflict: 'week_id,part_name' });

      setSaveState(error ? 'error' : 'saved');
      setTimeout(() => setSaveState('idle'), 3000);
    } catch (e) {
      setSaveState('error');
    }
  };

  // Carry-over
  const handleCarryOver = () => {
    if (reportData.curr_work.length === 0) return;
    const confirmed = window.confirm('금주 진행 사항을 전주 실적으로 이관하시겠습니까?');
    if (confirmed) {
      patch({ prev_work: [...reportData.curr_work], curr_work: [] });
    }
  };

  const patch = (updates) => {
    setReportData(d => ({ ...d, ...updates }));
  };

  // Keyboard shortcut: Ctrl+S / Cmd+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [reportData]); // eslint-disable-line

  const allItems = [...reportData.prev_work, ...reportData.curr_work, ...reportData.next_work];

  return (
    <div className="flex h-screen bg-[#080c10] text-slate-200 overflow-hidden" style={{ fontFamily: "'Noto Sans KR', sans-serif" }}>

      {/* ── Sidebar ── */}
      <aside className="w-64 shrink-0 border-r border-white/[0.05] flex flex-col bg-[#0a0e14]">
        {/* Logo */}
        <div className="p-7 border-b border-white/[0.05]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-sky-500/20 rounded-xl flex items-center justify-center border border-sky-500/20">
              <LayoutDashboard size={16} className="text-sky-400" />
            </div>
            <div>
              <div className="text-white font-black text-base tracking-tight leading-none">MIRAI</div>
              <div className="text-sky-500 text-[9px] font-bold tracking-[0.2em] mt-0.5">미래인재실</div>
            </div>
          </div>
        </div>

        {/* Connection status */}
        <div className="px-5 pt-4">
          <div className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-lg ${
            online ? 'text-emerald-400 bg-emerald-400/10' : 'text-rose-400 bg-rose-400/10'
          }`}>
            {online ? <Wifi size={11} /> : <WifiOff size={11} />}
            {online ? 'Supabase 연결됨' : '오프라인 모드'}
          </div>
        </div>

        {/* Week selector */}
        <div className="p-5 flex-1 overflow-y-auto">
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em] px-2 mb-3">
            Report Week
          </p>
          <nav className="space-y-1">
            {WEEKS.map(week => (
              <button
                key={week}
                onClick={() => setSelectedWeek(week)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-200 text-left ${
                  selectedWeek === week
                    ? 'bg-sky-500/10 text-sky-300 border border-sky-500/20'
                    : 'text-slate-500 hover:bg-white/[0.03] hover:text-slate-300 border border-transparent'
                }`}
              >
                <div>
                  <div className="text-xs font-bold">{week}</div>
                  {selectedWeek === week && (
                    <div className="text-[9px] text-sky-600 font-mono mt-0.5">현재 선택</div>
                  )}
                </div>
                <ChevronRight size={13} className={selectedWeek === week ? 'opacity-100 text-sky-400' : 'opacity-0'} />
              </button>
            ))}
          </nav>
        </div>

        {/* Keyboard hint */}
        <div className="p-5 border-t border-white/[0.05]">
          <div className="text-[10px] text-slate-700 space-y-1">
            <div className="flex justify-between">
              <span>저장</span>
              <kbd className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-mono">⌘S</kbd>
            </div>
            <div className="flex justify-between">
              <span>항목 편집</span>
              <kbd className="bg-white/5 px-1.5 py-0.5 rounded text-[9px] font-mono">더블클릭</kbd>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <main className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="sticky top-0 z-30 px-10 py-5 border-b border-white/[0.05] bg-[#080c10]/80 backdrop-blur-xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="text-xl font-black text-white tracking-tight">주간업무 보고</h1>
              <div className="flex items-center gap-2 mt-0.5">
                <Calendar size={11} className="text-sky-500" />
                <span className="text-[11px] text-slate-500 font-mono">{selectedWeek}</span>
                <span className="text-slate-700">·</span>
                <span className="text-[11px] text-slate-500">{activeTab} 파트</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Stats */}
            <StatsBar allItems={allItems} />

            {/* Save indicator */}
            <SaveIndicator state={saveState} />

            {/* Save button */}
            <button
              onClick={handleSave}
              disabled={saveState === 'saving'}
              className="flex items-center gap-2 bg-sky-500 hover:bg-sky-400 disabled:bg-slate-800 disabled:text-slate-600 text-white text-sm px-5 py-2.5 rounded-xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-sky-500/20"
            >
              <Save size={15} />
              저장
            </button>
          </div>
        </header>

        <div className="px-10 py-8">
          {/* Part tabs */}
          <div className="flex gap-2 mb-8 p-1 bg-white/[0.03] w-fit rounded-2xl border border-white/[0.05]">
            {PARTS.map(part => (
              <button
                key={part}
                onClick={() => setActiveTab(part)}
                className={`px-7 py-2.5 rounded-xl transition-all duration-200 text-sm font-bold ${
                  activeTab === part
                    ? 'bg-white text-black shadow-xl'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
                }`}
              >
                {part} <span className="text-[10px] font-mono opacity-60">파트</span>
              </button>
            ))}
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex flex-col items-center justify-center h-80 gap-3 text-slate-600">
              <RefreshCw size={28} className="animate-spin" />
              <span className="text-sm">데이터 동기화 중...</span>
            </div>
          ) : (
            <>
              {/* Work cards */}
              <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 mb-6">
                <WorkCard
                  title="전주 실적"
                  items={reportData.prev_work}
                  icon={<CheckCircle2 size={16} />}
                  colorKey="sky"
                  isEditable={false}
                />
                <WorkCard
                  title="금주 진행 사항"
                  items={reportData.curr_work}
                  icon={<Clock size={16} />}
                  colorKey="amber"
                  isEditable
                  onItemsChange={val => patch({ curr_work: val })}
                  onCarryOver={handleCarryOver}
                />
                <WorkCard
                  title="차주 예정 업무"
                  items={reportData.next_work}
                  icon={<Calendar size={16} />}
                  colorKey="emerald"
                  isEditable
                  onItemsChange={val => patch({ next_work: val })}
                />
              </div>

              {/* Bottom panels */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* AX 사례 */}
                <div className="bg-[#0d1117] border border-indigo-500/10 hover:border-indigo-500/20 rounded-3xl p-7 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-indigo-400/10 rounded-xl border border-indigo-400/20">
                      <Sparkles size={16} className="text-indigo-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">AX 사례 공유</h3>
                      <p className="text-[10px] text-slate-600 mt-0.5">이번 주 AI 혁신 적용 내용</p>
                    </div>
                    <div className="ml-auto text-[10px] font-mono text-slate-700">
                      {reportData.ax_case.length}자
                    </div>
                  </div>
                  <textarea
                    value={reportData.ax_case}
                    onChange={e => patch({ ax_case: e.target.value })}
                    className="w-full bg-transparent text-slate-300 text-sm leading-relaxed resize-none h-28 placeholder:text-slate-700 focus:outline-none"
                    placeholder="이번 주 혁신적인 AX 적용 사례를 기록해 주세요..."
                  />
                  <div className="mt-2 h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-indigo-400/50 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((reportData.ax_case.length / 300) * 100, 100)}%` }}
                    />
                  </div>
                </div>

                {/* 공지사항 */}
                <div className="bg-[#0d1117] border border-rose-500/10 hover:border-rose-500/20 rounded-3xl p-7 transition-all duration-300 group">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="p-2 bg-rose-400/10 rounded-xl border border-rose-400/20">
                      <Megaphone size={16} className="text-rose-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-sm">파트 공지 사항</h3>
                      <p className="text-[10px] text-slate-600 mt-0.5">팀원 공유 필수 사항</p>
                    </div>
                    <div className="ml-auto text-[10px] font-mono text-slate-700">
                      {reportData.notices.length}자
                    </div>
                  </div>
                  <textarea
                    value={reportData.notices}
                    onChange={e => patch({ notices: e.target.value })}
                    className="w-full bg-transparent text-slate-300 text-sm leading-relaxed resize-none h-28 placeholder:text-slate-700 focus:outline-none"
                    placeholder="팀원들에게 전달할 주요 공지 사항을 입력해 주세요..."
                  />
                  <div className="mt-2 h-0.5 bg-white/5 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-rose-400/50 rounded-full transition-all duration-500"
                      style={{ width: `${Math.min((reportData.notices.length / 300) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
