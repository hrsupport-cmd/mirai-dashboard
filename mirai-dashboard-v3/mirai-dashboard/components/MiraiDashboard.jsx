'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  LayoutDashboard, Sparkles, Megaphone, Calendar, ChevronRight,
  Save, Clock, CheckCircle2, Pencil, Trash2, Plus, X, Check,
  Wifi, WifiOff, RefreshCw, ChevronDown, BarChart3, LayoutGrid,
  FileText, Info, Search, AlertTriangle, Zap, PlusCircle, Bot,
  GitBranch, TrendingUp, ArrowRight, Filter, Globe
} from 'lucide-react';

// ─── 컬러 시스템 (최대 대비) ──────────────────────────────────────────────────
const C = {
  bg:      '#05080f',
  surface: '#0d1420',
  raised:  '#131c2e',
  border:  'rgba(255,255,255,0.13)',
  borderB: 'rgba(255,255,255,0.22)',
  text:    '#eef2f8',   // 메인 텍스트 — 매우 밝게
  textB:   '#c8d6e8',   // 보조 텍스트
  textC:   '#8aa0bc',   // 3차 텍스트
  textD:   '#4e6278',   // 흐린
};

const SC = {
  완료:   { c:'#5eead4', bg:'rgba(94,234,212,0.14)', b:'rgba(94,234,212,0.35)' },
  진행중: { c:'#fcd34d', bg:'rgba(252,211,77,0.14)',  b:'rgba(252,211,77,0.35)'  },
  예정:   { c:'#7dd3fc', bg:'rgba(125,211,252,0.14)', b:'rgba(125,211,252,0.35)' },
  지연:   { c:'#fca5a5', bg:'rgba(252,165,165,0.14)', b:'rgba(252,165,165,0.35)' },
};
const CC = {
  prev: { l:'전주 실적', c:'#7dd3fc', bg:'rgba(125,211,252,0.1)', b:'rgba(125,211,252,0.28)' },
  curr: { l:'금주 진행', c:'#fcd34d', bg:'rgba(252,211,77,0.1)',  b:'rgba(252,211,77,0.28)'  },
  next: { l:'차주 예정', c:'#5eead4', bg:'rgba(94,234,212,0.1)',  b:'rgba(94,234,212,0.28)'  },
};
const STATUS_KEYS = ['완료','진행중','예정','지연'];
const PARTS = ['인사','총무','직속'];

const genId = () => Math.random().toString(36).slice(2,9);
const toItems = arr => {
  if (!Array.isArray(arr)||!arr.length) return [];
  return arr.map(i => typeof i==='string'
    ? {id:genId(),text:i,status:'진행중'}
    : {id:genId(),text:i.text||'',status:i.status||'진행중'});
};
const fromItems = items => items.map(({text,status})=>({text,status}));

function dateToWeekId(d) {
  const dt = new Date(d);
  return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-W${Math.ceil(dt.getDate()/7)}`;
}
function weekIdToRange(w) {
  const m = w.match(/(\d{4})-(\d{2})-W(\d)/);
  if (!m) return w;
  const s = (parseInt(m[3])-1)*7+1;
  return `${m[1]}.${m[2]}.${String(s).padStart(2,'0')}~${m[1]}.${m[2]}.${String(Math.min(s+6,31)).padStart(2,'0')}`;
}
function weekIdsInRange(s,e) {
  const ids=new Set(); const end=new Date(e); const cur=new Date(s);
  cur.setDate(cur.getDate()-(cur.getDay()===0?6:cur.getDay()-1));
  while(cur<=end){ids.add(dateToWeekId(cur));cur.setDate(cur.getDate()+7);}
  return Array.from(ids).sort();
}

async function dbCall(action, payload={}) {
  const res = await fetch('/api/db', {
    method:'POST', headers:{'Content-Type':'application/json'},
    body: JSON.stringify({action,payload}),
  });
  const json = await res.json();
  if (json.error) throw new Error(json.error);
  return json;
}

const Sty = {
  card: {background:C.surface, border:`1px solid ${C.border}`, borderRadius:16, padding:20},
  btn:  {background:'transparent', border:'none', cursor:'pointer', color:C.textC,
         padding:4, borderRadius:6, display:'flex', alignItems:'center', transition:'color 0.15s'},
};

// ─── StatusTag ────────────────────────────────────────────────────────────────
const SICON = {완료:CheckCircle2, 진행중:Clock, 예정:Calendar, 지연:AlertTriangle};
function StatusTag({status, onChange}) {
  const [open,setOpen] = useState(false);
  const ref = useRef(null);
  const cfg = SC[status]||SC['진행중'];
  const Icon = SICON[status]||Clock;
  useEffect(()=>{
    if(!open) return;
    const h = e => { if(ref.current&&!ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h);
  },[open]);
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block'}}>
      <button onClick={e=>{e.stopPropagation();onChange&&setOpen(o=>!o);}}
        style={{display:'inline-flex',alignItems:'center',gap:4,padding:'3px 9px',
          borderRadius:6,border:`1px solid ${cfg.b}`,background:cfg.bg,color:cfg.c,
          fontSize:11,fontWeight:800,cursor:onChange?'pointer':'default',whiteSpace:'nowrap'}}>
        <Icon size={9}/>{status}{onChange&&<ChevronDown size={8}/>}
      </button>
      {open&&(
        <div style={{position:'absolute',top:'110%',left:0,zIndex:999,background:C.raised,
          border:`1px solid ${C.border}`,borderRadius:10,overflow:'hidden',
          boxShadow:'0 8px 32px rgba(0,0,0,0.7)',width:100}}>
          {STATUS_KEYS.map(s=>{const c=SC[s];const Ic=SICON[s]||Clock; return(
            <button key={s} onClick={e=>{e.stopPropagation();onChange(s);setOpen(false);}}
              style={{width:'100%',textAlign:'left',padding:'9px 12px',fontSize:12,fontWeight:700,
                color:c.c,background:'transparent',border:'none',cursor:'pointer',
                display:'flex',alignItems:'center',gap:7}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(255,255,255,0.08)'}
              onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <Ic size={11}/>{s}
            </button>
          );})}
        </div>
      )}
    </div>
  );
}

// ─── WorkItem ─────────────────────────────────────────────────────────────────
function WorkItem({item, onUpdate, onDelete, flags=[]}) {
  const [editing,setEditing] = useState(false);
  const [draft,setDraft] = useState(item.text);
  const [hov,setHov] = useState(false);
  const ref = useRef(null);
  useEffect(()=>{setDraft(item.text);},[item.text]);
  useEffect(()=>{if(editing)ref.current?.focus();},[editing]);
  const commit = () => {
    const t=draft.trim();
    if(t&&t!==item.text) onUpdate({...item,text:t});
    else if(!t) onDelete();
    setEditing(false);
  };
  return (
    <div style={{display:'flex',alignItems:'flex-start',gap:8,padding:'9px 0',
      borderBottom:`1px solid rgba(255,255,255,0.08)`}}
      onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <div style={{flexShrink:0,marginTop:1}}>
        <StatusTag status={item.status} onChange={s=>onUpdate({...item,status:s})}/>
      </div>
      <div style={{flex:1,minWidth:0}}>
        {editing ? (
          <input ref={ref} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit}
            onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape'){setDraft(item.text);setEditing(false);}}}
            style={{width:'100%',background:'rgba(255,255,255,0.09)',border:`1px solid rgba(125,211,252,0.5)`,
              borderRadius:7,padding:'5px 9px',color:C.text,fontSize:13,outline:'none'}}/>
        ):(
          <span onDoubleClick={()=>setEditing(true)}
            style={{display:'block',fontSize:13,color:hov?C.text:C.textB,
              lineHeight:1.55,cursor:'text',wordBreak:'break-word',transition:'color 0.15s'}}>
            {item.text}
          </span>
        )}
        {flags.length>0&&(
          <div style={{display:'flex',gap:4,marginTop:5,flexWrap:'wrap'}}>
            {flags.map((f,i)=>(
              <span key={i} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 7px',
                borderRadius:5,fontSize:10,fontWeight:800,
                color:f.flag==='트래킹 누락'?'#fca5a5':'#fcd34d',
                background:f.flag==='트래킹 누락'?'rgba(252,165,165,0.12)':'rgba(252,211,77,0.12)',
                border:`1px solid ${f.flag==='트래킹 누락'?'rgba(252,165,165,0.3)':'rgba(252,211,77,0.3)'}`}}>
                {f.flag}
              </span>
            ))}
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:2,opacity:hov?1:0,transition:'opacity 0.15s',flexShrink:0}}>
        <button onClick={()=>setEditing(true)} style={Sty.btn}
          onMouseEnter={e=>e.currentTarget.style.color='#7dd3fc'}
          onMouseLeave={e=>e.currentTarget.style.color=C.textC}><Pencil size={12}/></button>
        <button onClick={onDelete} style={Sty.btn}
          onMouseEnter={e=>e.currentTarget.style.color='#fca5a5'}
          onMouseLeave={e=>e.currentTarget.style.color=C.textC}><Trash2 size={12}/></button>
      </div>
    </div>
  );
}

// ─── AddRow ───────────────────────────────────────────────────────────────────
function AddRow({onAdd}) {
  const [active,setActive] = useState(false);
  const [text,setText] = useState('');
  const [status,setStatus] = useState('진행중');
  const ref = useRef(null);
  useEffect(()=>{if(active)ref.current?.focus();},[active]);
  const commit = () => {
    if(text.trim()){onAdd({id:genId(),text:text.trim(),status});setText('');setStatus('진행중');}
    setActive(false);
  };
  if(!active) return (
    <button onClick={()=>setActive(true)}
      style={{width:'100%',marginTop:10,padding:'8px',background:'transparent',
        border:`1px dashed rgba(255,255,255,0.16)`,borderRadius:8,color:C.textD,
        fontSize:12,cursor:'pointer',display:'flex',alignItems:'center',
        justifyContent:'center',gap:6,transition:'all 0.15s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='rgba(125,211,252,0.5)';e.currentTarget.style.color='#7dd3fc';e.currentTarget.style.background='rgba(125,211,252,0.05)';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(255,255,255,0.16)';e.currentTarget.style.color=C.textD;e.currentTarget.style.background='transparent';}}>
      <Plus size={13}/>항목 추가 <span style={{fontSize:10,color:C.textD}}>Enter ↵</span>
    </button>
  );
  return (
    <div style={{marginTop:10,background:'rgba(255,255,255,0.05)',borderRadius:9,padding:10}}>
      <input ref={ref} value={text} onChange={e=>setText(e.target.value)}
        onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape'){setText('');setActive(false);}}}
        placeholder="업무 내용 입력 후 Enter..."
        style={{width:'100%',background:'rgba(255,255,255,0.08)',border:`1px solid rgba(125,211,252,0.4)`,
          borderRadius:7,padding:'7px 10px',color:C.text,fontSize:13,outline:'none',
          marginBottom:8,boxSizing:'border-box',fontFamily:"'Noto Sans KR',sans-serif"}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',gap:3}}>
          {STATUS_KEYS.map(s=>{const c=SC[s];return(
            <button key={s} onClick={()=>setStatus(s)} style={{padding:'3px 8px',borderRadius:5,fontSize:10,
              fontWeight:800,cursor:'pointer',border:`1px solid ${status===s?c.b:'rgba(255,255,255,0.14)'}`,
              background:status===s?c.bg:'transparent',color:status===s?c.c:C.textC,transition:'all 0.12s'}}>
              {s}
            </button>
          );})}
        </div>
        <div style={{display:'flex',gap:4}}>
          <button onClick={()=>{setText('');setActive(false);}} style={Sty.btn}><X size={13}/></button>
          <button onClick={commit} style={{...Sty.btn,color:'#7dd3fc'}}><Check size={13}/></button>
        </div>
      </div>
    </div>
  );
}

// ─── WorkCard ─────────────────────────────────────────────────────────────────
function WorkCard({cardKey,items,onItemsChange,onCarryOver,analysisData=[]}) {
  const cfg = CC[cardKey];
  const done = items.filter(i=>i.status==='완료').length;
  const delayed = items.filter(i=>i.status==='지연').length;
  const pct = items.length ? Math.round(done/items.length*100) : 0;
  const CIcon = cardKey==='prev'?CheckCircle2:cardKey==='curr'?Clock:Calendar;
  return (
    <div style={{...Sty.card,display:'flex',flexDirection:'column'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start',marginBottom:12}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <div style={{padding:8,borderRadius:11,background:cfg.bg,border:`1px solid ${cfg.b}`}}>
            <CIcon size={16} color={cfg.c}/>
          </div>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.text}}>{cfg.l}</div>
            <div style={{fontSize:10,color:C.textC,fontFamily:'monospace',marginTop:2}}>
              {items.length}개{items.length>0?` · 완료 ${pct}%`:''}
              {delayed>0&&<span style={{color:'#fca5a5'}}> · 지연 {delayed}건</span>}
            </div>
          </div>
        </div>
        {cardKey==='curr'&&onCarryOver&&(
          <button onClick={onCarryOver}
            style={{fontSize:11,fontWeight:700,padding:'4px 10px',borderRadius:7,
              background:'rgba(255,255,255,0.06)',border:`1px solid ${C.border}`,
              color:C.textB,cursor:'pointer',transition:'all 0.15s',
              display:'flex',alignItems:'center',gap:4}}
            onMouseEnter={e=>{e.currentTarget.style.color='#7dd3fc';e.currentTarget.style.borderColor='rgba(125,211,252,0.4)';}}
            onMouseLeave={e=>{e.currentTarget.style.color=C.textB;e.currentTarget.style.borderColor=C.border;}}>
            이관 <ArrowRight size={11}/>
          </button>
        )}
      </div>
      {items.length>0&&(
        <div style={{display:'flex',height:4,background:'rgba(255,255,255,0.08)',borderRadius:4,marginBottom:12,overflow:'hidden',gap:1}}>
          <div style={{width:`${pct}%`,background:'#5eead4',borderRadius:4,transition:'width 0.5s'}}/>
          {delayed>0&&<div style={{width:`${Math.round(delayed/items.length*100)}%`,background:'#fca5a5',borderRadius:4}}/>}
        </div>
      )}
      <div style={{flex:1}}>
        {items.length===0&&(
          <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:80,color:C.textD,gap:4}}>
            <BarChart3 size={20}/><span style={{fontSize:12}}>항목 없음</span>
          </div>
        )}
        {items.map((item,idx)=>{
          const fl=analysisData.filter(a=>a.index===idx).flatMap(a=>(a.flags||[]).map(f=>({flag:f,comment:a.comment})));
          return <WorkItem key={item.id} item={item} flags={fl}
            onUpdate={u=>onItemsChange(p=>p.map(i=>i.id===item.id?u:i))}
            onDelete={()=>onItemsChange(p=>p.filter(i=>i.id!==item.id))}/>;
        })}
        <AddRow onAdd={item=>onItemsChange(p=>[...p,item])}/>
      </div>
    </div>
  );
}

// ─── HorizontalBarChart ───────────────────────────────────────────────────────
function HBarChart({data,activePart}) {
  const [sel,setSel] = useState(null);
  const getItems = key => {
    if(activePart&&activePart!=='전체') return data[activePart]?.[key]||[];
    return PARTS.flatMap(p=>(data[p]?.[key]||[]).map(i=>({...i,part:p})));
  };
  const rows=[
    {key:'prev_work',label:'전주 실적'},
    {key:'curr_work',label:'금주 진행'},
    {key:'next_work',label:'차주 예정'},
  ];
  const filteredItems = sel ? getItems(sel.key).filter(i=>i.status===sel.status) : [];
  return (
    <div>
      <div style={{...Sty.card,marginBottom:14}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:20}}>
          <div>
            <div style={{fontSize:14,fontWeight:700,color:C.text,display:'flex',alignItems:'center',gap:7}}>
              <TrendingUp size={16} color="#7dd3fc"/> 업무 달성 현황
            </div>
            <div style={{fontSize:11,color:C.textC,marginTop:3}}>색상 바 클릭 → 해당 업무 목록 표시</div>
          </div>
          <div style={{display:'flex',gap:14,flexWrap:'wrap'}}>
            {[['완료','#5eead4'],['진행중','#fcd34d'],['예정','#7dd3fc'],['지연','#fca5a5']].map(([l,c])=>(
              <div key={l} style={{display:'flex',alignItems:'center',gap:5,fontSize:11,color:C.textB}}>
                <span style={{width:8,height:8,borderRadius:2,background:c}}/>{l}
              </div>
            ))}
          </div>
        </div>
        {rows.map(row=>{
          const items=getItems(row.key);
          const total=items.length;
          const done=items.filter(i=>i.status==='완료').length;
          const pct=total?Math.round(done/total*100):0;
          const pctColor=pct>=70?'#5eead4':pct>=40?'#fcd34d':'#fca5a5';
          const byCnt={};STATUS_KEYS.forEach(s=>{byCnt[s]=items.filter(i=>i.status===s).length;});
          return (
            <div key={row.key} style={{display:'flex',alignItems:'center',gap:14,padding:'14px 0',
              borderBottom:`1px solid rgba(255,255,255,0.09)`}}>
              <div style={{width:80,flexShrink:0}}>
                <div style={{fontSize:12,fontWeight:700,color:C.textB}}>{row.label}</div>
                <div style={{fontSize:10,color:C.textC,fontFamily:'monospace',marginTop:2}}>{total}건</div>
              </div>
              <div style={{flex:1,height:36,background:'rgba(255,255,255,0.08)',borderRadius:8,overflow:'hidden',display:'flex',border:`1px solid rgba(255,255,255,0.11)`}}>
                {total===0?(
                  <div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}>
                    <span style={{fontSize:11,color:C.textD}}>항목 없음</span>
                  </div>
                ):STATUS_KEYS.filter(s=>byCnt[s]>0).map(s=>{
                  const c=SC[s];
                  const w=Math.round(byCnt[s]/total*100);
                  const isActive=sel?.key===row.key&&sel?.status===s;
                  const isDim=sel&&!isActive;
                  return (
                    <div key={s}
                      onClick={()=>setSel(p=>(p?.key===row.key&&p?.status===s)?null:{key:row.key,status:s})}
                      style={{width:`${w}%`,height:'100%',background:c.c,flexShrink:0,
                        display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',
                        opacity:isDim?0.2:1,outline:isActive?'3px solid rgba(255,255,255,0.5)':'none',
                        outlineOffset:'-3px',transition:'opacity 0.2s',filter:isActive?'brightness(1.15)':'none'}}
                      title={`${s}: ${byCnt[s]}건 (${w}%)`}>
                      <span style={{fontSize:10,fontWeight:800,color:'rgba(0,0,0,0.75)',whiteSpace:'nowrap',padding:'0 5px',pointerEvents:'none'}}>
                        {w>=14?`${s} ${w}%`:w>=8?`${w}%`:''}
                      </span>
                    </div>
                  );
                })}
              </div>
              <div style={{width:68,textAlign:'right',flexShrink:0}}>
                <div style={{fontSize:22,fontWeight:800,color:total?pctColor:C.textD,fontFamily:'monospace',lineHeight:1}}>{total?pct+'%':'—'}</div>
                <div style={{fontSize:9,color:C.textC,marginTop:3}}>완료 달성률</div>
              </div>
            </div>
          );
        })}
      </div>
      {sel&&filteredItems.length>0&&(
        <div style={{...Sty.card,border:`1px solid ${SC[sel.status]?.b}`,marginBottom:14}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12}}>
            <div style={{fontSize:13,fontWeight:700,color:SC[sel.status]?.c,display:'flex',alignItems:'center',gap:7}}>
              <Filter size={14}/>{CC[sel.key.replace('_work','')]?.l} · {sel.status} ({filteredItems.length}건)
            </div>
            <button onClick={()=>setSel(null)} style={Sty.btn}><X size={14}/></button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:6}}>
            {filteredItems.map((item,i)=>{
              const c=SC[item.status]||SC['진행중'];
              return (
                <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'10px 14px',
                  background:`${c.c}0f`,border:`1px solid ${c.b}`,borderRadius:9}}>
                  <StatusTag status={item.status}/>
                  <span style={{flex:1,fontSize:13,color:C.textB,lineHeight:1.5}}>{item.text}</span>
                  {item.part&&<span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:5,
                    border:`1px solid ${C.border}`,color:C.textC,background:'rgba(255,255,255,0.05)',flexShrink:0}}>{item.part}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── GlobalView (전체 업무 보기) ──────────────────────────────────────────────
function GlobalView() {
  const [allData,setAllData] = useState([]);
  const [loading,setLoading] = useState(true);
  const [statusFilter,setStatusFilter] = useState('전체');
  const [partFilter,setPartFilter] = useState('전체');

  useEffect(()=>{
    async function load() {
      setLoading(true);
      try {
        const {data:rows} = await dbCall('load_global');
        const flat = [];
        (rows||[]).forEach(row=>{
          ['prev_work','curr_work','next_work'].forEach(k=>{
            toItems(row[k]).forEach(item=>{
              flat.push({
                ...item,
                week_id: row.week_id,
                part: row.part_name,
                cardLabel: CC[k.replace('_work','')]?.l,
                cardKey: k.replace('_work',''),
              });
            });
          });
        });
        setAllData(flat);
      } catch(e) { console.error(e); }
      setLoading(false);
    }
    load();
  },[]);

  const filtered = allData.filter(i=>{
    if(statusFilter!=='전체'&&i.status!==statusFilter) return false;
    if(partFilter!=='전체'&&i.part!==partFilter) return false;
    return true;
  });

  const statusCounts = {};
  STATUS_KEYS.forEach(s=>{ statusCounts[s]=allData.filter(i=>i.status===s).length; });

  const btnStyle = (active, color) => ({
    padding:'6px 16px', borderRadius:9, border:'none', cursor:'pointer',
    fontSize:12, fontWeight:700, transition:'all 0.15s',
    background: active ? (color||'#fff') : 'transparent',
    color: active ? (color?'rgba(0,0,0,0.8)':'#0f172a') : C.textC,
  });

  return (
    <div>
      <div style={{marginBottom:16,display:'flex',alignItems:'center',gap:8}}>
        <Globe size={15} color="#7dd3fc"/>
        <span style={{fontSize:15,fontWeight:700,color:C.text}}>전체 업무 보기</span>
        <span style={{fontSize:11,color:C.textC,fontFamily:'monospace'}}>주차 무관 · 전체 {allData.length}건</span>
      </div>

      {/* 요약 카드 */}
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:18}}>
        {STATUS_KEYS.map(s=>{const c=SC[s];return(
          <div key={s} style={{...Sty.card,border:`1px solid ${c.b}`,padding:'14px 18px',cursor:'pointer',transition:'border-color 0.15s'}}
            onClick={()=>setStatusFilter(p=>p===s?'전체':s)}>
            <div style={{fontSize:10,fontWeight:700,color:c.c,marginBottom:5,display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:c.c}}/>{s}
            </div>
            <div style={{fontSize:26,fontWeight:800,color:C.text,lineHeight:1,fontFamily:'monospace'}}>{statusCounts[s]||0}</div>
            <div style={{fontSize:9,color:C.textC,marginTop:4}}>전체 주차 합산</div>
          </div>
        );})}
      </div>

      {/* 필터 바 */}
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
        <div style={{display:'flex',gap:2,padding:3,background:'rgba(255,255,255,0.05)',borderRadius:10,border:`1px solid ${C.border}`}}>
          <button style={btnStyle(statusFilter==='전체')} onClick={()=>setStatusFilter('전체')}>전체</button>
          {STATUS_KEYS.map(s=>{const c=SC[s];return(
            <button key={s} style={btnStyle(statusFilter===s,c.c)} onClick={()=>setStatusFilter(p=>p===s?'전체':s)}>{s}</button>
          );})}
        </div>
        <div style={{display:'flex',gap:2,padding:3,background:'rgba(255,255,255,0.05)',borderRadius:10,border:`1px solid ${C.border}`}}>
          <button style={btnStyle(partFilter==='전체')} onClick={()=>setPartFilter('전체')}>전체 파트</button>
          {PARTS.map(p=>(
            <button key={p} style={btnStyle(partFilter===p)} onClick={()=>setPartFilter(q=>q===p?'전체':p)}>{p}</button>
          ))}
        </div>
        <span style={{fontSize:11,color:C.textC,marginLeft:'auto'}}>{filtered.length}건 표시</span>
      </div>

      {/* 결과 목록 */}
      {loading?(
        <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:200,gap:12,color:C.textC}}>
          <RefreshCw size={22} style={{animation:'spin 1s linear infinite'}}/>
          <span style={{fontSize:13}}>불러오는 중...</span>
        </div>
      ):filtered.length===0?(
        <div style={{...Sty.card,textAlign:'center',padding:48,color:C.textD}}>
          <Globe size={32} style={{margin:'0 auto 12px'}}/>
          <div style={{fontSize:14}}>해당 조건의 업무가 없습니다</div>
        </div>
      ):(
        <div style={{...Sty.card,padding:0,overflow:'hidden'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:13}}>
              <thead>
                <tr style={{background:'rgba(255,255,255,0.04)',borderBottom:`1px solid ${C.border}`}}>
                  {['주차','파트','분류','업무 내용','상태'].map(h=>(
                    <th key={h} style={{padding:'10px 16px',textAlign:'left',fontSize:11,fontWeight:700,color:C.textC,whiteSpace:'nowrap'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((item,i)=>{
                  const c=SC[item.status]||SC['진행중'];
                  const cc=CC[item.cardKey];
                  return (
                    <tr key={i} style={{borderBottom:`1px solid rgba(255,255,255,0.06)`,background:i%2?'rgba(255,255,255,0.02)':'transparent'}}>
                      <td style={{padding:'10px 16px',color:C.textB,fontFamily:'monospace',fontSize:11}}>{item.week_id}</td>
                      <td style={{padding:'10px 16px'}}>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 8px',borderRadius:999,background:'rgba(255,255,255,0.08)',color:C.textB}}>{item.part}</span>
                      </td>
                      <td style={{padding:'10px 16px'}}>
                        <span style={{fontSize:10,fontWeight:700,padding:'2px 7px',borderRadius:999,background:cc?.bg,border:`1px solid ${cc?.b}`,color:cc?.c}}>{item.cardLabel}</span>
                      </td>
                      <td style={{padding:'10px 16px',color:C.text,maxWidth:300,wordBreak:'break-word'}}>{item.text}</td>
                      <td style={{padding:'10px 16px'}}><StatusTag status={item.status}/></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div style={{padding:'8px 16px',borderTop:`1px solid ${C.border}`,fontSize:10,color:C.textD}}>총 {filtered.length}건 · 상태 카드 클릭으로 빠른 필터</div>
        </div>
      )}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

// ─── AnalyticsView ────────────────────────────────────────────────────────────
function AnalyticsView({selectedWeek,data}) {
  const [apart,setApart] = useState('전체');
  const aStats = PARTS.map(p=>{
    if(apart!=='전체'&&p!==apart) return null;
    const rd=data[p]||{prev_work:[],curr_work:[],next_work:[]};
    const all=[...rd.prev_work,...rd.curr_work,...rd.next_work];
    return{p,done:all.filter(i=>i.status==='완료').length,ing:all.filter(i=>i.status==='진행중').length,
      plan:all.filter(i=>i.status==='예정').length,delay:all.filter(i=>i.status==='지연').length,total:all.length};
  }).filter(Boolean);
  const total=aStats.reduce((a,s)=>a+s.total,0)||1;
  const done=aStats.reduce((a,s)=>a+s.done,0);
  const delay=aStats.reduce((a,s)=>a+s.delay,0);
  const ing=aStats.reduce((a,s)=>a+s.ing,0);
  const kpis=[
    {label:'완료율',value:Math.round(done/total*100)+'%',sub:`${done}/${total} 완료`,c:'#5eead4',b:'rgba(94,234,212,0.3)'},
    {label:'전체 업무',value:total,sub:apart==='전체'?'3개 파트 합산':'해당 파트',c:'#7dd3fc',b:'rgba(125,211,252,0.3)'},
    {label:'진행중',value:ing,sub:'현재 처리 중',c:'#fcd34d',b:'rgba(252,211,77,0.3)'},
    {label:'지연',value:delay,sub:delay>0?'즉시 조치 필요':'이슈 없음',c:'#fca5a5',b:'rgba(252,165,165,0.3)'},
  ];
  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
        <div style={{display:'flex',gap:3,padding:3,background:'rgba(255,255,255,0.05)',borderRadius:10,border:`1px solid ${C.border}`}}>
          {['전체',...PARTS].map(p=>(
            <button key={p} onClick={()=>setApart(p)}
              style={{padding:'6px 14px',borderRadius:8,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,
                background:apart===p?'#fff':'transparent',color:apart===p?'#0f172a':C.textC,transition:'all 0.15s'}}>
              {p}
            </button>
          ))}
        </div>
        <span style={{fontSize:11,color:C.textC,fontFamily:'monospace'}}>{selectedWeek}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:18}}>
        {kpis.map(k=>(
          <div key={k.label} style={{...Sty.card,border:`1px solid ${k.b}`,padding:'16px 18px'}}>
            <div style={{fontSize:11,fontWeight:700,color:k.c,marginBottom:5,display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:k.c}}/>{k.label}
            </div>
            <div style={{fontSize:28,fontWeight:800,color:C.text,lineHeight:1,fontFamily:'monospace'}}>{k.value}</div>
            <div style={{fontSize:10,color:C.textC,marginTop:4}}>{k.sub}</div>
          </div>
        ))}
      </div>
      <HBarChart data={data} activePart={apart}/>
      {/* 병목 지수 */}
      <div style={Sty.card}>
        <div style={{fontSize:13,fontWeight:700,color:C.text,marginBottom:4,display:'flex',alignItems:'center',gap:7}}>
          <AlertTriangle size={15} color="#fca5a5"/> 업무 병목 지수
        </div>
        <div style={{fontSize:11,color:C.textC,marginBottom:16}}>파트별 지연 비율 — 40% 이상 즉시 조치 필요</div>
        {PARTS.map(p=>{
          const rd=data[p]||{};
          const all=[...(rd.prev_work||[]),...(rd.curr_work||[]),...(rd.next_work||[])];
          const pct=all.length?Math.round(all.filter(i=>i.status==='지연').length/all.length*100):0;
          const clr=pct>=40?'#fca5a5':pct>=20?'#fcd34d':'#5eead4';
          const risk=pct>=40?'위험':pct>=20?'주의':'정상';
          return(
            <div key={p} style={{display:'flex',alignItems:'center',gap:10,marginBottom:10}}>
              <span style={{fontSize:12,fontWeight:700,color:C.textB,width:32,flexShrink:0}}>{p}</span>
              <div style={{flex:1,height:20,background:'rgba(255,255,255,0.08)',borderRadius:4,overflow:'hidden'}}>
                <div style={{height:'100%',width:`${Math.max(pct,2)}%`,background:clr,borderRadius:4,transition:'width 0.5s'}}/>
              </div>
              <span style={{fontSize:11,fontWeight:700,color:clr,fontFamily:'monospace',width:32,textAlign:'right'}}>{pct}%</span>
              <span style={{fontSize:9,fontWeight:800,padding:'2px 7px',borderRadius:4,flexShrink:0,
                color:clr,background:`${clr}1a`,border:`1px solid ${clr}55`}}>{risk}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── KanbanBoard ──────────────────────────────────────────────────────────────
function KanbanBoard({data}) {
  const all=[];
  PARTS.forEach(p=>{const rd=data[p]||{};['prev_work','curr_work','next_work'].forEach(k=>(rd[k]||[]).forEach(i=>all.push({...i,part:p,cardKey:k.replace('_work',''),cardLabel:CC[k.replace('_work','')]?.l})));});
  const byS={};STATUS_KEYS.forEach(s=>{byS[s]=all.filter(i=>i.status===s);});
  const tot=all.length||1;
  return (
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {STATUS_KEYS.map(s=>{const c=SC[s];return(
          <div key={s} style={{...Sty.card,border:`1px solid ${c.b}`,padding:'16px 18px'}}>
            <div style={{fontSize:11,fontWeight:700,color:c.c,marginBottom:5,display:'flex',alignItems:'center',gap:5}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:c.c}}/>{s}
            </div>
            <div style={{fontSize:28,fontWeight:800,color:C.text,fontFamily:'monospace'}}>{byS[s].length}</div>
            <div style={{fontSize:10,color:C.textC,marginTop:4}}>전체의 {Math.round(byS[s].length/tot*100)}%</div>
          </div>
        );})}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,alignItems:'start'}}>
        {STATUS_KEYS.map(s=>{const c=SC[s];const items=byS[s];return(
          <div key={s} style={{...Sty.card,padding:0,overflow:'hidden'}}>
            <div style={{padding:'11px 14px',borderBottom:`1px solid ${C.border}`,background:c.bg,
              display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:12,fontWeight:700,color:c.c,display:'flex',alignItems:'center',gap:5}}>
                <span style={{width:6,height:6,borderRadius:'50%',background:c.c}}/>{s}
              </span>
              <span style={{fontSize:10,fontWeight:700,padding:'1px 7px',borderRadius:999,background:c.bg,border:`1px solid ${c.b}`,color:c.c}}>{items.length}</span>
            </div>
            <div style={{padding:8,display:'flex',flexDirection:'column',gap:5}}>
              {items.length===0&&<div style={{padding:'20px 12px',textAlign:'center',color:C.textD,fontSize:12}}>항목 없음</div>}
              {items.map((item,i)=>{const cc=CC[item.cardKey];return(
                <div key={i} style={{background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,borderRadius:9,padding:'10px 12px'}}>
                  <div style={{fontSize:13,color:C.textB,lineHeight:1.5,marginBottom:8}}>{item.text}</div>
                  <div style={{display:'flex',gap:4}}>
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:999,background:cc?.bg,border:`1px solid ${cc?.b}`,color:cc?.c}}>{item.part}</span>
                    <span style={{fontSize:9,fontWeight:700,padding:'2px 7px',borderRadius:999,background:cc?.bg,border:`1px solid ${cc?.b}`,color:cc?.c}}>{item.cardLabel}</span>
                  </div>
                </div>
              );})}
            </div>
          </div>
        );})}
      </div>
    </div>
  );
}

// ─── WeekManager ──────────────────────────────────────────────────────────────
function WeekManager({weeks,onClose,onAdd}) {
  const [date,setDate]=useState('');
  const preview=date?dateToWeekId(date):'';
  const exists=weeks.includes(preview);
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.78)',backdropFilter:'blur(8px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:C.raised,border:`1px solid ${C.border}`,borderRadius:22,padding:32,width:440,boxShadow:'0 24px 64px rgba(0,0,0,0.7)'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:20}}>
          <div style={{fontSize:16,fontWeight:800,color:C.text,display:'flex',alignItems:'center',gap:8}}><PlusCircle size={17} color="#7dd3fc"/>주차 관리</div>
          <button onClick={onClose} style={Sty.btn}><X size={17}/></button>
        </div>
        {/* 자동 이관 안내 */}
        <div style={{background:'rgba(125,211,252,0.1)',border:'1px solid rgba(125,211,252,0.25)',borderRadius:10,padding:'12px 14px',marginBottom:16}}>
          <div style={{fontSize:12,fontWeight:700,color:'#7dd3fc',marginBottom:4,display:'flex',alignItems:'center',gap:5}}>
            <Info size={13}/>자동 이관 안내
          </div>
          <div style={{fontSize:12,color:C.textB,lineHeight:1.7}}>
            새 주차를 열면 <strong style={{color:C.text}}>전주 금주 진행 항목</strong>이 자동으로 <strong style={{color:C.text}}>전주 실적</strong>으로 이관됩니다.<br/>
            이관 후 화면에서 확인하고 <strong style={{color:'#7dd3fc}'}}>저장</strong> 버튼을 반드시 눌러주세요.
          </div>
        </div>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)}
          style={{width:'100%',background:'rgba(255,255,255,0.08)',border:`1px solid ${C.border}`,borderRadius:10,padding:'10px 14px',color:C.text,fontSize:13,outline:'none',marginBottom:10,boxSizing:'border-box'}}/>
        {preview&&(
          <div style={{padding:'9px 14px',borderRadius:10,background:exists?'rgba(252,211,77,0.1)':'rgba(125,211,252,0.1)',border:`1px solid ${exists?'rgba(252,211,77,0.3)':'rgba(125,211,252,0.3)'}`,fontSize:12,color:exists?'#fcd34d':'#7dd3fc',display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
            <Calendar size={13}/><span style={{fontFamily:'monospace',fontWeight:700}}>{preview}</span>
            <span style={{marginLeft:'auto',fontSize:10}}>{exists?'이미 존재':weekIdToRange(preview)}</span>
          </div>
        )}
        <button onClick={()=>{if(preview&&!exists){onAdd(preview);onClose();}}} disabled={!preview||exists}
          style={{width:'100%',padding:12,borderRadius:11,border:'none',background:(!preview||exists)?'rgba(255,255,255,0.06)':'#3b82f6',color:(!preview||exists)?C.textC:'#fff',fontSize:13,fontWeight:700,cursor:(!preview||exists)?'not-allowed':'pointer',marginBottom:8}}>
          {exists?'이미 추가된 주차':'주차 추가하기'}
        </button>
        <div style={{marginTop:16}}>
          <div style={{fontSize:11,color:C.textB,fontWeight:600,marginBottom:8}}>등록된 주차 ({weeks.length})</div>
          <div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:160,overflowY:'auto'}}>
            {weeks.map(w=>(
              <div key={w} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'7px 12px',borderRadius:8,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`}}>
                <span style={{fontSize:12,fontFamily:'monospace',color:C.textB}}>{w}</span>
                <span style={{fontSize:10,color:C.textC}}>{weekIdToRange(w)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast ────────────────────────────────────────────────────────────────────
function Toast({msg,onClose}) {
  useEffect(()=>{const t=setTimeout(onClose,5000);return()=>clearTimeout(t);},[onClose]);
  return(
    <div style={{position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',background:C.raised,border:'1px solid rgba(94,234,212,0.35)',borderRadius:13,padding:'12px 20px',zIndex:9999,display:'flex',alignItems:'center',gap:10,boxShadow:'0 8px 32px rgba(0,0,0,0.6)',maxWidth:520}}>
      <Info size={15} color="#5eead4"/>
      <span style={{fontSize:13,color:C.textB}}>{msg}</span>
      <button onClick={onClose} style={{...Sty.btn,marginLeft:4}}><X size={13}/></button>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
const EMPTY = () => ({prev_work:[],curr_work:[],next_work:[],ax_case:'',notices:''});

export default function MiraiDashboard() {
  const [weeks,setWeeks]               = useState([]);
  const [selectedWeek,setSelectedWeek] = useState('');
  const [activeTab,setActiveTab]       = useState(PARTS[0]);
  const [viewMode,setViewMode]         = useState('report');
  const [reportData,setReportData]     = useState(EMPTY());
  const [allPartData,setAllPartData]   = useState({});
  const [loading,setLoading]           = useState(true);
  const [saveState,setSaveState]       = useState('idle');
  const [online,setOnline]             = useState(true);
  const [toast,setToast]               = useState(null);
  const [showWeekMgr,setShowWeekMgr]   = useState(false);
  const [analysis,setAnalysis]         = useState(null);
  const [analysisLoading,setAnalysisLoading] = useState(false);
  const [showAnalysis,setShowAnalysis] = useState(false);

  useEffect(()=>{
    const on=()=>setOnline(true),off=()=>setOnline(false);
    window.addEventListener('online',on);window.addEventListener('offline',off);
    return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);};
  },[]);

  // 주차 목록 로드
  useEffect(()=>{
    async function loadWeeks() {
      try {
        const {data} = await dbCall('load_weeks');
        const ids=[...new Set((data||[]).map(r=>r.week_id))].sort();
        const cur=dateToWeekId(new Date());
        const all=ids.includes(cur)?ids:[...ids,cur].sort();
        setWeeks(all);
        setSelectedWeek(all[all.length-1]||cur);
      } catch(e) {
        const cur=dateToWeekId(new Date());
        setWeeks([cur]); setSelectedWeek(cur);
      }
    }
    loadWeeks();
  },[]);

  // ★ 핵심 수정: 데이터 로드 + 자동 이관 + 자동 저장
  useEffect(()=>{
    if(!selectedWeek) return;
    async function load() {
      setLoading(true); setAnalysis(null);
      try {
        const {data} = await dbCall('load',{week_id:selectedWeek,part_name:activeTab});
        if(data) {
          // 기존 데이터 있음 → 그냥 로드
          setReportData({
            prev_work: toItems(data.prev_work),
            curr_work: toItems(data.curr_work),
            next_work: toItems(data.next_work),
            ax_case:   data.ax_case||'',
            notices:   data.notices||'',
          });
        } else {
          // 새 주차 → 전주 데이터 자동 이관
          const wIdx = weeks.indexOf(selectedWeek);
          let auto = EMPTY();
          if(wIdx > 0) {
            try {
              const {data:prev} = await dbCall('load_prev',{week_id:weeks[wIdx-1],part_name:activeTab});
              if(prev?.curr_work?.length) {
                const carriedItems = toItems(prev.curr_work);
                auto = {...EMPTY(), prev_work: carriedItems};

                // ★ 자동 저장 — 이관 데이터를 즉시 DB에 저장
                await dbCall('save',{
                  week_id: selectedWeek,
                  part_name: activeTab,
                  prev_work: fromItems(carriedItems),
                  curr_work: [],
                  next_work: [],
                  ax_case: '',
                  notices: '',
                });
                setToast(`✅ ${weeks[wIdx-1]} 금주 내용 → 전주 실적 자동 이관 완료 (자동 저장됨)`);
              }
            } catch(e) { console.error('carry-over error:',e); }
          }
          setReportData(auto);
        }
      } catch(e) {
        setToast('데이터 로드 실패: '+e.message);
        console.error(e);
      }
      setLoading(false);
    }
    load();
  },[selectedWeek,activeTab,weeks]); // eslint-disable-line

  // 분석/현황판용 전체 파트 데이터
  useEffect(()=>{
    if(!selectedWeek||(viewMode!=='analytics'&&viewMode!=='board')) return;
    async function loadAll() {
      try {
        const {data:rows} = await dbCall('load_all',{week_id:selectedWeek});
        const map={};
        (rows||[]).forEach(r=>{
          map[r.part_name]={
            prev_work:toItems(r.prev_work),
            curr_work:toItems(r.curr_work),
            next_work:toItems(r.next_work),
          };
        });
        map[activeTab]={prev_work:reportData.prev_work,curr_work:reportData.curr_work,next_work:reportData.next_work};
        setAllPartData(map);
      } catch(e) { console.error(e); }
    }
    loadAll();
  },[viewMode,selectedWeek,reportData]); // eslint-disable-line

  // ★ 저장
  const handleSave = useCallback(async () => {
    setSaveState('saving');
    try {
      await dbCall('save',{
        week_id:   selectedWeek,
        part_name: activeTab,
        prev_work: fromItems(reportData.prev_work),
        curr_work: fromItems(reportData.curr_work),
        next_work: fromItems(reportData.next_work),
        ax_case:   reportData.ax_case,
        notices:   reportData.notices,
      });
      setSaveState('saved');
    } catch(e) {
      setToast('저장 실패: '+e.message);
      setSaveState('error');
    }
    setTimeout(()=>setSaveState('idle'),2500);
  },[selectedWeek,activeTab,reportData]);

  const handleCarryOver = () => {
    if(!reportData.curr_work.length){setToast('금주 진행 사항이 없습니다.');return;}
    if(!window.confirm('금주 진행 내용을 전주 실적으로 이관하고 금주를 초기화할까요?'))return;
    setReportData(p=>({...p,prev_work:[...p.curr_work],curr_work:[]}));
    setToast('✅ 이관 완료. 저장 버튼을 눌러주세요.');
  };

  const handleAnalyze = async () => {
    setShowAnalysis(true); setAnalysisLoading(true); setAnalysis(null);
    try {
      const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reportData,activeTab,selectedWeek})});
      const data=await res.json();
      if(data.error) throw new Error(data.error);
      setAnalysis(data);
    } catch(e) {
      setToast('AI 분석 실패: '+e.message);
      setShowAnalysis(false);
    }
    setAnalysisLoading(false);
  };

  // ⌘S
  useEffect(()=>{
    const h=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();handleSave();}};
    window.addEventListener('keydown',h); return()=>window.removeEventListener('keydown',h);
  },[handleSave]);

  const patch = field => updater => setReportData(p=>({...p,[field]:typeof updater==='function'?updater(p[field]):updater}));

  const saveBg    = {idle:'#3b82f6',saving:'rgba(255,255,255,0.1)',saved:'#22c55e',error:'#ef4444'};
  const saveLabel = {idle:'저장',saving:'저장 중...',saved:'저장됨 ✓',error:'저장 실패'};

  const analyticsData = {
    ...allPartData,
    [activeTab]:{prev_work:reportData.prev_work,curr_work:reportData.curr_work,next_work:reportData.next_work}
  };

  const VIEWS=[
    {key:'report',    icon:<FileText size={13}/>,    label:'보고서'},
    {key:'analytics', icon:<TrendingUp size={13}/>,  label:'분석'},
    {key:'board',     icon:<LayoutGrid size={13}/>,  label:'현황판'},
    {key:'global',    icon:<Globe size={13}/>,       label:'전체 보기'},
  ];

  return (
    <div style={{display:'flex',height:'100vh',background:C.bg,color:C.text,overflow:'hidden',fontFamily:"'Noto Sans KR',sans-serif"}}>

      {/* Sidebar */}
      <aside style={{width:240,flexShrink:0,borderRight:`1px solid ${C.border}`,display:'flex',flexDirection:'column',background:C.surface}}>
        <div style={{padding:'22px 20px',borderBottom:`1px solid ${C.border}`}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:32,height:32,borderRadius:10,background:'rgba(59,130,246,0.2)',border:'1px solid rgba(59,130,246,0.3)',display:'flex',alignItems:'center',justifyContent:'center'}}>
              <LayoutDashboard size={15} color="#7dd3fc"/>
            </div>
            <div>
              <div style={{fontSize:16,fontWeight:900,color:C.text,letterSpacing:'-0.5px'}}>MIRAI</div>
              <div style={{fontSize:8,fontWeight:700,color:'#7dd3fc',letterSpacing:'0.2em',marginTop:1}}>미래인재실</div>
            </div>
          </div>
        </div>

        <div style={{padding:'10px 14px',borderBottom:`1px solid rgba(255,255,255,0.07)`}}>
          <div style={{display:'flex',alignItems:'center',gap:5,fontSize:10,fontWeight:700,padding:'5px 9px',borderRadius:7,
            color:online?'#5eead4':'#fca5a5',background:online?'rgba(94,234,212,0.12)':'rgba(252,165,165,0.12)'}}>
            {online?<Wifi size={11}/>:<WifiOff size={11}/>}
            {online?'DB 연결됨':'오프라인'}
          </div>
        </div>

        <div style={{padding:'12px 10px',flex:1,overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'0 6px',marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:800,color:C.textD,letterSpacing:'0.2em'}}>WEEKS</div>
            <button onClick={()=>setShowWeekMgr(true)}
              style={{display:'flex',alignItems:'center',gap:4,padding:'4px 9px',borderRadius:7,
                border:'1px solid rgba(125,211,252,0.35)',background:'rgba(125,211,252,0.1)',
                color:'#7dd3fc',cursor:'pointer',fontSize:10,fontWeight:700,transition:'all 0.15s'}}
              onMouseEnter={e=>e.currentTarget.style.background='rgba(125,211,252,0.2)'}
              onMouseLeave={e=>e.currentTarget.style.background='rgba(125,211,252,0.1)'}>
              <Plus size={12}/> 주차 추가
            </button>
          </div>
          <nav style={{display:'flex',flexDirection:'column',gap:2}}>
            {weeks.map(w=>{
              const active=selectedWeek===w;
              return(
                <button key={w} onClick={()=>setSelectedWeek(w)}
                  style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 12px',
                    borderRadius:11,border:active?'1px solid rgba(59,130,246,0.4)':'1px solid transparent',
                    background:active?'rgba(59,130,246,0.15)':'transparent',
                    color:active?'#7dd3fc':C.textC,cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}
                  onMouseEnter={e=>{if(!active){e.currentTarget.style.background='rgba(255,255,255,0.05)';e.currentTarget.style.color=C.textB;}}}
                  onMouseLeave={e=>{if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color=C.textC;}}}>
                  <div>
                    <div style={{fontSize:11,fontWeight:700,fontFamily:'monospace'}}>{w}</div>
                    {active&&<div style={{fontSize:9,color:'#7dd3fc',marginTop:2}}>{weekIdToRange(w)}</div>}
                  </div>
                  <ChevronRight size={12} style={{opacity:active?1:0}}/>
                </button>
              );
            })}
            {!weeks.length&&<div style={{fontSize:12,color:C.textD,textAlign:'center',padding:'20px 8px'}}>위 버튼으로 주차를 추가하세요</div>}
          </nav>
        </div>

        <div style={{padding:'14px 16px',borderTop:`1px solid ${C.border}`}}>
          {[['저장','⌘S'],['항목 편집','더블클릭'],['추가 취소','Esc']].map(([l,k])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:6}}>
              <span style={{fontSize:10,color:C.textC}}>{l}</span>
              <kbd style={{background:'rgba(255,255,255,0.08)',padding:'2px 6px',borderRadius:4,fontSize:9,fontFamily:'monospace',color:C.textB}}>{k}</kbd>
            </div>
          ))}
        </div>
      </aside>

      {/* Main */}
      <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        <header style={{padding:'13px 28px',borderBottom:`1px solid ${C.border}`,background:C.surface,
          backdropFilter:'blur(20px)',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0}}>
          <div>
            <h1 style={{fontSize:18,fontWeight:900,color:C.text,margin:0,letterSpacing:'-0.5px'}}>주간업무 보고</h1>
            <div style={{display:'flex',alignItems:'center',gap:6,marginTop:3}}>
              <Calendar size={11} color="#7dd3fc"/>
              <span style={{fontSize:11,color:C.textB,fontFamily:'monospace'}}>{selectedWeek||'—'}</span>
              <span style={{color:C.textD}}>·</span>
              <span style={{fontSize:11,color:C.textB}}>{activeTab} 파트</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{display:'flex',gap:2,padding:3,background:'rgba(255,255,255,0.05)',borderRadius:10,border:`1px solid ${C.border}`}}>
              {VIEWS.map(v=>(
                <button key={v.key} onClick={()=>setViewMode(v.key)}
                  style={{display:'flex',alignItems:'center',gap:4,padding:'5px 12px',borderRadius:8,border:'none',
                    cursor:'pointer',fontSize:11,fontWeight:700,background:viewMode===v.key?'#fff':'transparent',
                    color:viewMode===v.key?'#0f172a':C.textC,transition:'all 0.15s'}}>
                  {v.icon}{v.label}
                </button>
              ))}
            </div>
            {viewMode==='report'&&(
              <button onClick={handleAnalyze}
                style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:9,
                  border:'1px solid rgba(167,139,250,0.4)',background:'rgba(167,139,250,0.15)',
                  color:'#e9d5ff',fontSize:11,fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}
                onMouseEnter={e=>e.currentTarget.style.background='rgba(167,139,250,0.25)'}
                onMouseLeave={e=>e.currentTarget.style.background='rgba(167,139,250,0.15)'}>
                <Bot size={14}/> AI 분석
              </button>
            )}
            {saveState!=='idle'&&<span style={{fontSize:11,fontWeight:700,color:saveBg[saveState]}}>{saveLabel[saveState]}</span>}
            <button onClick={handleSave} disabled={saveState==='saving'}
              style={{display:'flex',alignItems:'center',gap:5,background:saveBg[saveState],color:'#fff',
                padding:'8px 20px',borderRadius:9,border:'none',fontSize:12,fontWeight:700,
                cursor:'pointer',transition:'all 0.2s',boxShadow:'0 2px 14px rgba(59,130,246,0.35)'}}>
              <Save size={14}/>{saveLabel[saveState]}
            </button>
          </div>
        </header>

        <div style={{flex:1,overflowY:'auto',padding:'22px 28px'}}>

          {/* 보고서 */}
          {viewMode==='report'&&(
            <>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
                <div style={{display:'flex',gap:3,padding:3,background:'rgba(255,255,255,0.05)',borderRadius:13,border:`1px solid ${C.border}`}}>
                  {PARTS.map(p=>(
                    <button key={p} onClick={()=>setActiveTab(p)}
                      style={{padding:'7px 20px',borderRadius:10,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,
                        background:activeTab===p?'#fff':'transparent',color:activeTab===p?'#0f172a':C.textC,transition:'all 0.2s'}}>
                      {p} <span style={{fontSize:9,opacity:0.5}}>파트</span>
                    </button>
                  ))}
                </div>
                <span style={{fontSize:11,color:C.textD,fontFamily:'monospace'}}>{selectedWeek}</span>
              </div>

              {loading?(
                <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:280,gap:12,color:C.textC}}>
                  <RefreshCw size={24} style={{animation:'spin 1s linear infinite'}}/>
                  <span style={{fontSize:14}}>데이터 동기화 중...</span>
                </div>
              ):(
                <>
                  <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:16}}>
                    {['prev','curr','next'].map(key=>(
                      <WorkCard key={key} cardKey={key}
                        items={reportData[`${key}_work`]}
                        onItemsChange={patch(`${key}_work`)}
                        onCarryOver={key==='curr'?handleCarryOver:undefined}
                        analysisData={analysis?.[`${key}_work`]||[]}/>
                    ))}
                  </div>
                  <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:16}}>
                    {[
                      {f:'ax_case',icon:<Sparkles size={14} color="#e9d5ff"/>,label:'AX 사례 공유',sub:'AI 혁신 적용 내용',c:'#a78bfa',ph:'이번 주 AX 적용 사례를 기록해 주세요...'},
                      {f:'notices',icon:<Megaphone size={14} color="#fca5a5"/>,label:'파트 공지 사항',sub:'팀원 공유 필수 사항',c:'#f87171',ph:'팀원들에게 전달할 공지 사항을 입력해 주세요...'},
                    ].map(({f,icon,label,sub,c,ph})=>(
                      <div key={f} style={Sty.card}>
                        <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                          <div style={{padding:7,borderRadius:9,background:`${c}25`,border:`1px solid ${c}45`}}>{icon}</div>
                          <div style={{flex:1}}>
                            <div style={{fontSize:13,fontWeight:700,color:C.text}}>{label}</div>
                            <div style={{fontSize:10,color:C.textC,marginTop:2}}>{sub}</div>
                          </div>
                          <span style={{fontSize:10,color:C.textD,fontFamily:'monospace'}}>{(reportData[f]||'').length}자</span>
                        </div>
                        <textarea value={reportData[f]||''} onChange={e=>setReportData(p=>({...p,[f]:e.target.value}))} placeholder={ph}
                          style={{width:'100%',background:'transparent',border:'none',color:C.textB,fontSize:13,lineHeight:1.7,resize:'none',height:96,outline:'none',fontFamily:"'Noto Sans KR',sans-serif",boxSizing:'border-box'}}/>
                        <div style={{height:2,background:'rgba(255,255,255,0.08)',borderRadius:999,overflow:'hidden',marginTop:6}}>
                          <div style={{height:'100%',background:c,borderRadius:999,width:`${Math.min(((reportData[f]?.length||0)/300)*100,100)}%`,transition:'width 0.4s'}}/>
                        </div>
                      </div>
                    ))}
                  </div>

                  {showAnalysis&&(
                    <div style={{marginTop:16,background:C.raised,border:'1px solid rgba(167,139,250,0.3)',borderRadius:16,overflow:'hidden'}}>
                      <div style={{padding:'13px 18px',borderBottom:`1px solid ${C.border}`,background:'rgba(167,139,250,0.1)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontSize:13,fontWeight:800,color:'#e9d5ff',display:'flex',alignItems:'center',gap:7}}><Bot size={15}/> AI 분석 — {activeTab} 파트</span>
                        <button onClick={()=>setShowAnalysis(false)} style={Sty.btn}><X size={14}/></button>
                      </div>
                      <div style={{padding:18}}>
                        {analysisLoading?(
                          <div style={{display:'flex',alignItems:'center',gap:10,color:C.textC,fontSize:13}}>
                            <RefreshCw size={16} style={{animation:'spin 1s linear infinite',color:'#e9d5ff'}}/>
                            Claude가 보고서를 분석 중입니다...
                          </div>
                        ):analysis?(
                          <>
                            {analysis.summary&&<div style={{padding:'12px 14px',borderRadius:10,background:'rgba(167,139,250,0.1)',border:'1px solid rgba(167,139,250,0.2)',fontSize:12,color:'#e9d5ff',lineHeight:1.7,marginBottom:14}}>{analysis.summary}</div>}
                            {['prev_work','curr_work','next_work'].map(key=>{
                              const items=(analysis[key]||[]).filter(x=>x.flags?.length);
                              if(!items.length) return null;
                              const label={prev_work:'전주 실적',curr_work:'금주 진행',next_work:'차주 예정'}[key];
                              return(
                                <div key={key} style={{marginBottom:12}}>
                                  <div style={{fontSize:11,fontWeight:700,color:C.textC,marginBottom:8,letterSpacing:'0.08em'}}>{label}</div>
                                  {items.map(item=>(
                                    <div key={item.index} style={{padding:'10px 14px',borderRadius:10,background:'rgba(255,255,255,0.04)',border:`1px solid ${C.border}`,marginBottom:6}}>
                                      <div style={{display:'flex',gap:4,flexWrap:'wrap',marginBottom:5}}>
                                        {(item.flags||[]).map(f=>(
                                          <span key={f} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 7px',borderRadius:5,fontSize:10,fontWeight:800,
                                            color:f==='트래킹 누락'?'#fca5a5':'#fcd34d',
                                            background:f==='트래킹 누락'?'rgba(252,165,165,0.12)':'rgba(252,211,77,0.12)',
                                            border:`1px solid ${f==='트래킹 누락'?'rgba(252,165,165,0.3)':'rgba(252,211,77,0.3)'}`}}>
                                            {f}
                                          </span>
                                        ))}
                                      </div>
                                      {item.comment&&<div style={{fontSize:11,color:C.textC,lineHeight:1.6}}>{item.comment}</div>}
                                    </div>
                                  ))}
                                </div>
                              );
                            })}
                          </>
                        ):null}
                      </div>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {viewMode==='analytics'&&<AnalyticsView selectedWeek={selectedWeek} data={analyticsData}/>}
          {viewMode==='board'&&<KanbanBoard data={analyticsData}/>}
          {viewMode==='global'&&<GlobalView/>}
        </div>
      </main>

      {showWeekMgr&&<WeekManager weeks={weeks} onClose={()=>setShowWeekMgr(false)}
        onAdd={w=>{setWeeks(p=>[...new Set([...p,w])].sort());setSelectedWeek(w);setToast(`주차 ${w} 추가됨`);}}/>}
      {toast&&<Toast msg={toast} onClose={()=>setToast(null)}/>}
      <style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
