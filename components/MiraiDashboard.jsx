'use client';
import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  FileText, BarChart3, LayoutGrid, Globe, Search,
  Save, Plus, X, Check, ChevronRight, ChevronDown, ArrowRight,
  Calendar, Clock, CheckCircle2, AlertTriangle, TrendingUp,
  Pencil, Trash2, Bot, Wifi, WifiOff, RefreshCw, PlusCircle,
  Megaphone, Sparkles, Filter, Zap,
} from 'lucide-react';

// ─── 디자인 토큰 ──────────────────────────────────────────────────────────────
const T = {
  bg:'#F2F4F7', surf:'#FFFFFF', card:'#FFFFFF', el:'#F8F9FC',
  b:'rgba(0,0,0,0.07)', bm:'rgba(0,0,0,0.12)', bl:'rgba(0,0,0,0.20)',
  t1:'#0D111A', t2:'#374151', t3:'#6B7280', t4:'#9CA3AF',
};

const STATUS = {
  완료:   { color:'#059669', bg:'#ECFDF5', border:'#6EE7B7', light:'#D1FAE5', icon:CheckCircle2 },
  진행중: { color:'#D97706', bg:'#FFFBEB', border:'#FCD34D', light:'#FEF3C7', icon:Clock         },
  예정:   { color:'#2563EB', bg:'#EFF6FF', border:'#93C5FD', light:'#DBEAFE', icon:Calendar      },
  지연:   { color:'#DC2626', bg:'#FEF2F2', border:'#FCA5A5', light:'#FEE2E2', icon:AlertTriangle },
};
const CARD = {
  prev:{ label:'전주 실적', color:'#2563EB', bg:'#EFF6FF', border:'#BFDBFE', icon:CheckCircle2 },
  curr:{ label:'금주 진행', color:'#D97706', bg:'#FFFBEB', border:'#FCD34D', icon:Clock        },
  next:{ label:'차주 예정', color:'#059669', bg:'#ECFDF5', border:'#A7F3D0', icon:Calendar     },
};
const PART_COLOR = { '인사':'#2563EB', '총무':'#059669', '직속':'#D97706' };
const PARTS       = ['인사','총무','직속'];
const STATUS_KEYS = ['완료','진행중','예정','지연'];

// ─── Utils ────────────────────────────────────────────────────────────────────
const genId     = () => Math.random().toString(36).slice(2,9);
const toItems   = arr => { if(!Array.isArray(arr)||!arr.length)return []; return arr.map(i=>typeof i==='string'?{id:genId(),text:i,status:'진행중'}:{id:genId(),text:i.text||'',status:i.status||'진행중'}); };
const fromItems = items => items.map(({text,status})=>({text,status}));

const dateToWeekId = d => { const dt=new Date(d); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-W${Math.ceil(dt.getDate()/7)}`; };
const weekIdToRange = w => { const m=w.match(/(\d{4})-(\d{2})-W(\d)/); if(!m)return w; const s=(parseInt(m[3])-1)*7+1; return `${m[1]}.${m[2]}.${String(s).padStart(2,'0')} — ${m[1]}.${m[2]}.${String(Math.min(s+6,31)).padStart(2,'0')}`; };
const weekIdsInRange = (s,e) => { const ids=new Set(),end=new Date(e),cur=new Date(s); cur.setDate(cur.getDate()-(cur.getDay()===0?6:cur.getDay()-1)); while(cur<=end){ids.add(dateToWeekId(cur));cur.setDate(cur.getDate()+7);} return Array.from(ids).sort(); };

const dbCall = async (action,payload={}) => {
  const res=await fetch('/api/db',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action,payload})});
  const json=await res.json(); if(json.error)throw new Error(json.error); return json;
};

const EMPTY_PART = () => ({ prev_work:[], curr_work:[], next_work:[], ax_case:'', notices:'' });
const EMPTY_ALL  = () => Object.fromEntries(PARTS.map(p=>[p, EMPTY_PART()]));

// ─── Primitives ───────────────────────────────────────────────────────────────
const Badge = ({status}) => { const s=STATUS[status]||STATUS['진행중'];const Icon=s.icon; return <span style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,background:s.bg,border:`1px solid ${s.border}`,color:s.color,fontSize:12,fontWeight:700,whiteSpace:'nowrap'}}><Icon size={11}/>{status}</span>; };
const Pill  = ({label,color='#2563EB',active}) => <span style={{display:'inline-flex',alignItems:'center',padding:'2px 9px',borderRadius:999,fontSize:11,fontWeight:600,background:active?`${color}18`:'#F3F4F6',border:active?`1px solid ${color}44`:'1px solid transparent',color:active?color:'#6B7280'}}>{label}</span>;
const IBtn  = ({icon,onClick,color='#2563EB',title}) => { const [h,setH]=useState(false); return <button onClick={onClick} title={title} style={{background:h?`${color}12`:'transparent',border:`1px solid ${h?color+'33':'rgba(0,0,0,0.08)'}`,color:h?color:'#9CA3AF',padding:6,borderRadius:8,cursor:'pointer',display:'flex',alignItems:'center',transition:'all 0.15s'}} onMouseEnter={()=>setH(true)} onMouseLeave={()=>setH(false)}>{icon}</button>; };

// ─── StatusDropdown ───────────────────────────────────────────────────────────
const StatusDropdown = ({status,onChange}) => {
  const [open,setOpen]=useState(false); const ref=useRef(null);
  useEffect(()=>{ if(!open)return; const h=e=>{if(ref.current&&!ref.current.contains(e.target))setOpen(false);}; document.addEventListener('mousedown',h); return()=>document.removeEventListener('mousedown',h); },[open]);
  const s=STATUS[status]||STATUS['진행중']; const Icon=s.icon;
  return (
    <div ref={ref} style={{position:'relative',display:'inline-block',flexShrink:0}}>
      <button onClick={e=>{e.stopPropagation();onChange&&setOpen(o=>!o);}}
        style={{display:'inline-flex',alignItems:'center',gap:5,padding:'4px 10px',borderRadius:20,background:s.bg,border:`1px solid ${s.border}`,color:s.color,fontSize:12,fontWeight:700,cursor:onChange?'pointer':'default',whiteSpace:'nowrap',transition:'all 0.12s'}}
        onMouseEnter={e=>{if(onChange)e.currentTarget.style.background=s.light;}} onMouseLeave={e=>{e.currentTarget.style.background=s.bg;}}>
        <Icon size={11}/>{status}{onChange&&<ChevronDown size={9}/>}
      </button>
      {open&&(
        <div style={{position:'absolute',top:'calc(100% + 5px)',left:0,zIndex:9999,background:'#fff',border:'1px solid rgba(0,0,0,0.1)',borderRadius:14,overflow:'hidden',boxShadow:'0 8px 32px rgba(0,0,0,0.12)',width:118,animation:'fadeUp 0.15s ease'}}>
          {STATUS_KEYS.map(k=>{const c=STATUS[k];const Ic=c.icon;return(
            <button key={k} onClick={e=>{e.stopPropagation();onChange(k);setOpen(false);}}
              style={{width:'100%',textAlign:'left',padding:'10px 14px',fontSize:13,fontWeight:600,color:c.color,background:'transparent',border:'none',cursor:'pointer',display:'flex',alignItems:'center',gap:8,transition:'background 0.1s'}}
              onMouseEnter={e=>e.currentTarget.style.background=c.bg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
              <Ic size={13}/>{k}
            </button>
          );})}
        </div>
      )}
    </div>
  );
};

// ─── WorkItem ─────────────────────────────────────────────────────────────────
const WorkItem = ({item,onUpdate,onDelete,flags=[]}) => {
  const [editing,setEditing]=useState(false); const [draft,setDraft]=useState(item.text); const [hov,setHov]=useState(false); const ref=useRef(null);
  useEffect(()=>{setDraft(item.text);},[item.text]);
  useEffect(()=>{if(editing)ref.current?.focus();},[editing]);
  const commit=()=>{const t=draft.trim();if(t&&t!==item.text)onUpdate?.({...item,text:t});else if(!t)onDelete?.();setEditing(false);};
  return(
    <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 0',borderBottom:'1px solid rgba(0,0,0,0.06)',transition:'background 0.1s'}} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}>
      <StatusDropdown status={item.status} onChange={s=>onUpdate?.({...item,status:s})}/>
      <div style={{flex:1,minWidth:0}}>
        {editing?(
          <input ref={ref} value={draft} onChange={e=>setDraft(e.target.value)} onBlur={commit} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape'){setDraft(item.text);setEditing(false);}}}
            style={{width:'100%',background:'#F8FAFF',border:'1.5px solid #2563EB',borderRadius:8,padding:'6px 10px',color:T.t1,fontSize:14,fontFamily:'inherit'}}/>
        ):(
          <span onDoubleClick={()=>setEditing(true)} style={{display:'block',fontSize:14,lineHeight:1.6,color:hov?T.t1:T.t2,cursor:'text',wordBreak:'break-word',transition:'color 0.12s'}}>{item.text}</span>
        )}
        {flags.length>0&&(
          <div style={{display:'flex',gap:5,marginTop:6,flexWrap:'wrap'}}>
            {flags.map((f,i)=><span key={i} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:5,fontSize:11,fontWeight:700,color:f.flag==='트래킹 누락'?'#DC2626':'#D97706',background:f.flag==='트래킹 누락'?'#FEF2F2':'#FFFBEB',border:`1px solid ${f.flag==='트래킹 누락'?'#FECACA':'#FCD34D'}`}}><AlertTriangle size={8}/>{f.flag}</span>)}
          </div>
        )}
      </div>
      <div style={{display:'flex',gap:4,opacity:hov?1:0,transition:'opacity 0.15s',flexShrink:0}}>
        <IBtn icon={<Pencil size={13}/>} onClick={()=>setEditing(true)} color="#2563EB" title="수정 (더블클릭도 가능)"/>
        <IBtn icon={<Trash2 size={13}/>} onClick={onDelete} color="#DC2626" title="삭제"/>
      </div>
    </div>
  );
};

// ─── AddRow ───────────────────────────────────────────────────────────────────
const AddRow = ({onAdd}) => {
  const [active,setActive]=useState(false); const [text,setText]=useState(''); const [status,setStatus]=useState('진행중'); const ref=useRef(null);
  useEffect(()=>{if(active)ref.current?.focus();},[active]);
  const commit=()=>{if(text.trim()){onAdd({id:genId(),text:text.trim(),status});setText('');setStatus('진행중');}setActive(false);};
  if(!active)return(
    <button onClick={()=>setActive(true)} style={{width:'100%',marginTop:12,padding:'10px',background:'transparent',border:'1.5px dashed rgba(0,0,0,0.12)',borderRadius:10,color:'#9CA3AF',fontSize:13,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',gap:6,transition:'all 0.15s'}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563EB';e.currentTarget.style.color='#2563EB';e.currentTarget.style.background='#EFF6FF';}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(0,0,0,0.12)';e.currentTarget.style.color='#9CA3AF';e.currentTarget.style.background='transparent';}}>
      <Plus size={14}/>항목 추가 <span style={{fontSize:11,color:'#D1D5DB'}}>Enter ↵</span>
    </button>
  );
  return(
    <div style={{marginTop:12,background:'#F8F9FC',borderRadius:12,padding:14,border:'1px solid rgba(0,0,0,0.08)'}}>
      <input ref={ref} value={text} onChange={e=>setText(e.target.value)} onKeyDown={e=>{if(e.key==='Enter'){e.preventDefault();commit();}if(e.key==='Escape'){setText('');setActive(false);}}} placeholder="업무 내용을 입력하세요..."
        style={{width:'100%',background:'#fff',border:'1.5px solid #BFDBFE',borderRadius:8,padding:'9px 12px',color:T.t1,fontSize:14,marginBottom:10,boxSizing:'border-box',fontFamily:'inherit'}}/>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
        <div style={{display:'flex',gap:5}}>
          {STATUS_KEYS.map(s=>{const c=STATUS[s];const on=status===s;return(<button key={s} onClick={()=>setStatus(s)} style={{padding:'4px 10px',borderRadius:20,fontSize:11,fontWeight:700,cursor:'pointer',border:`1px solid ${on?c.border:'rgba(0,0,0,0.1)'}`,background:on?c.bg:'transparent',color:on?c.color:'#6B7280',transition:'all 0.12s'}}>{s}</button>);})}
        </div>
        <div style={{display:'flex',gap:6}}>
          <button onClick={()=>{setText('');setActive(false);}} style={{padding:'6px 14px',borderRadius:8,border:'1px solid rgba(0,0,0,0.12)',background:'transparent',color:'#6B7280',fontSize:13,cursor:'pointer'}}>취소</button>
          <button onClick={commit} style={{padding:'6px 16px',borderRadius:8,border:'none',background:'#2563EB',color:'#fff',fontSize:13,fontWeight:700,cursor:'pointer',boxShadow:'0 2px 8px rgba(37,99,235,0.25)'}}>추가</button>
        </div>
      </div>
    </div>
  );
};

// ─── WorkCard ─────────────────────────────────────────────────────────────────
const WorkCard = ({cardKey,items,onItemsChange,onCarryOver,analysisData=[]}) => {
  const cfg=CARD[cardKey]; const CIcon=cfg.icon;
  const done=items.filter(i=>i.status==='완료').length; const delay=items.filter(i=>i.status==='지연').length; const pct=items.length?Math.round(done/items.length*100):0;
  const counts=useMemo(()=>{const r={};STATUS_KEYS.forEach(s=>{r[s]=items.filter(i=>i.status===s).length;});return r;},[items]);
  return(
    <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:16,display:'flex',flexDirection:'column',overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)',transition:'box-shadow 0.2s,border-color 0.2s'}}
      onMouseEnter={e=>{e.currentTarget.style.boxShadow='0 4px 20px rgba(0,0,0,0.09)';e.currentTarget.style.borderColor=cfg.border;}}
      onMouseLeave={e=>{e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,0.05)';e.currentTarget.style.borderColor='rgba(0,0,0,0.08)';}}>
      <div style={{height:3,background:cfg.color,opacity:0.7}}/>
      <div style={{padding:'16px 18px 12px',borderBottom:'1px solid rgba(0,0,0,0.06)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10}}>
          <div style={{display:'flex',alignItems:'center',gap:9}}>
            <div style={{width:34,height:34,borderRadius:10,background:cfg.bg,border:`1px solid ${cfg.border}`,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <CIcon size={16} color={cfg.color}/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:700,color:T.t1}}>{cfg.label}</div>
              <div style={{fontSize:11,color:T.t3,marginTop:1}}>{items.length}개{items.length>0?` · 완료 ${pct}%`:''}{delay>0&&<span style={{color:'#DC2626'}}> · 지연 {delay}</span>}</div>
            </div>
          </div>
          {cardKey==='curr'&&onCarryOver&&(
            <button onClick={onCarryOver} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 11px',borderRadius:8,border:'1px solid rgba(0,0,0,0.1)',background:'transparent',color:T.t2,fontSize:12,fontWeight:600,cursor:'pointer',transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor='#2563EB';e.currentTarget.style.color='#2563EB';e.currentTarget.style.background='#EFF6FF';}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor='rgba(0,0,0,0.1)';e.currentTarget.style.color=T.t2;e.currentTarget.style.background='transparent';}}>
              이관 <ArrowRight size={12}/>
            </button>
          )}
        </div>
        {items.length>0&&(
          <>
            <div style={{display:'flex',height:5,borderRadius:5,overflow:'hidden',gap:1,marginBottom:7}}>
              {STATUS_KEYS.filter(s=>counts[s]>0).map(s=><div key={s} style={{flex:counts[s],height:'100%',background:STATUS[s].color,opacity:0.8}}/>)}
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
              {STATUS_KEYS.filter(s=>counts[s]>0).map(s=><div key={s} style={{display:'flex',alignItems:'center',gap:4,fontSize:11,color:T.t3}}><span style={{width:6,height:6,borderRadius:2,background:STATUS[s].color}}/>{s} {counts[s]}</div>)}
            </div>
          </>
        )}
      </div>
      <div style={{padding:'10px 18px 16px',flex:1}}>
        {items.length===0&&<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:80,color:'#D1D5DB',gap:6}}><BarChart3 size={22}/><span style={{fontSize:13}}>항목 없음</span></div>}
        {items.map((item,idx)=>{const fl=analysisData.filter(a=>a.index===idx).flatMap(a=>(a.flags||[]).map(f=>({flag:f,comment:a.comment})));return <WorkItem key={item.id} item={item} flags={fl} onUpdate={u=>onItemsChange(p=>p.map(i=>i.id===item.id?u:i))} onDelete={()=>onItemsChange(p=>p.filter(i=>i.id!==item.id))}/>;  })}
        <AddRow onAdd={item=>onItemsChange(p=>[...p,item])}/>
      </div>
    </div>
  );
};

// ─── SegmentControl ───────────────────────────────────────────────────────────
const SegCtrl = ({options,value,onChange,sm}) => (
  <div style={{display:'flex',gap:2,padding:3,background:'#F3F4F6',borderRadius:10,border:'1px solid rgba(0,0,0,0.08)'}}>
    {options.map(o=><button key={o} onClick={()=>onChange(o)} style={{padding:sm?'5px 12px':'7px 18px',borderRadius:8,border:'none',cursor:'pointer',fontSize:sm?12:13,fontWeight:700,transition:'all 0.15s',background:value===o?'#fff':'transparent',color:value===o?T.t1:T.t3,boxShadow:value===o?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>{o}</button>)}
  </div>
);

const SecHdr = ({icon,title,sub}) => (
  <div style={{display:'flex',alignItems:'flex-start',gap:10,marginBottom:16}}>
    {icon}<div><div style={{fontSize:16,fontWeight:700,color:T.t1}}>{title}</div>{sub&&<div style={{fontSize:12,color:T.t3,marginTop:3}}>{sub}</div>}</div>
  </div>
);

const Loading = () => (
  <div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:320,gap:14,color:T.t3}}>
    <RefreshCw size={26} style={{animation:'spin 1s linear infinite',color:'#2563EB'}}/><span style={{fontSize:15}}>데이터 불러오는 중...</span>
  </div>
);

// ─── HBarChart ────────────────────────────────────────────────────────────────
const HBarChart = ({allData,activePart}) => {
  const [sel,setSel]=useState(null);
  const getItems = key => {
    if(activePart&&activePart!=='전체') return allData[activePart]?.[key]||[];
    return PARTS.flatMap(p=>(allData[p]?.[key]||[]).map(i=>({...i,part:p})));
  };
  const rows=[{key:'prev_work',label:'전주 실적'},{key:'curr_work',label:'금주 진행'},{key:'next_work',label:'차주 예정'}];
  const filtered=sel?getItems(sel.key).filter(i=>i.status===sel.status):[];
  return(
    <div style={{marginBottom:16}}>
      <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:18,padding:24,marginBottom:12,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:22}}>
          <div>
            <div style={{fontSize:15,fontWeight:700,color:T.t1,display:'flex',alignItems:'center',gap:8}}><TrendingUp size={17} color="#2563EB"/>업무 달성 현황</div>
            <div style={{fontSize:12,color:T.t3,marginTop:4}}>색상 바를 클릭하면 해당 업무 목록을 확인할 수 있습니다</div>
          </div>
          <div style={{display:'flex',gap:14}}>
            {STATUS_KEYS.map(s=>{const c=STATUS[s];return <div key={s} style={{display:'flex',alignItems:'center',gap:5,fontSize:12,color:T.t2}}><span style={{width:8,height:8,borderRadius:2,background:c.color}}/>{s}</div>;})}
          </div>
        </div>
        {rows.map(row=>{
          const items=getItems(row.key),total=items.length,done=items.filter(i=>i.status==='완료').length,pct=total?Math.round(done/total*100):0;
          const pctColor=pct>=70?'#059669':pct>=40?'#D97706':'#DC2626';
          const byCnt={};STATUS_KEYS.forEach(s=>{byCnt[s]=items.filter(i=>i.status===s).length;});
          return(
            <div key={row.key} style={{display:'flex',alignItems:'center',gap:16,padding:'13px 0',borderBottom:'1px solid rgba(0,0,0,0.05)'}}>
              <div style={{width:82,flexShrink:0}}><div style={{fontSize:13,fontWeight:700,color:T.t1}}>{row.label}</div><div style={{fontSize:11,color:T.t3,fontFamily:'monospace',marginTop:2}}>{total}건</div></div>
              <div style={{flex:1,height:40,background:'#F3F4F6',borderRadius:10,overflow:'hidden',display:'flex',border:'1px solid rgba(0,0,0,0.06)'}}>
                {total===0?<div style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center'}}><span style={{fontSize:12,color:T.t4}}>데이터 없음</span></div>
                  :STATUS_KEYS.filter(s=>byCnt[s]>0).map(s=>{const c=STATUS[s],w=Math.round(byCnt[s]/total*100);const isA=sel?.key===row.key&&sel?.status===s;const isDim=sel&&!isA;return(
                    <div key={s} onClick={()=>setSel(p=>(p?.key===row.key&&p?.status===s)?null:{key:row.key,status:s})} title={`${s}: ${byCnt[s]}건 (${w}%)`}
                      style={{width:`${w}%`,height:'100%',background:c.color,flexShrink:0,display:'flex',alignItems:'center',justifyContent:'center',cursor:'pointer',opacity:isDim?0.18:1,outline:isA?'3px solid rgba(0,0,0,0.2)':'none',outlineOffset:'-3px',transition:'opacity 0.2s'}}
                      onMouseEnter={e=>{if(!isDim)e.currentTarget.style.filter='brightness(1.08)';}} onMouseLeave={e=>{e.currentTarget.style.filter='';} }>
                      {w>=14&&<span style={{fontSize:11,fontWeight:800,color:'rgba(255,255,255,0.95)',pointerEvents:'none'}}>{w>=18?`${s} `:''}{w}%</span>}
                    </div>
                  );})}
              </div>
              <div style={{width:70,textAlign:'right',flexShrink:0}}><div style={{fontSize:24,fontWeight:800,color:total?pctColor:'#D1D5DB',fontFamily:'monospace',lineHeight:1}}>{total?`${pct}%`:'—'}</div><div style={{fontSize:10,color:T.t3,marginTop:3}}>완료 달성률</div></div>
            </div>
          );
        })}
      </div>
      {sel&&filtered.length>0&&(
        <div style={{background:'#fff',border:`2px solid ${STATUS[sel.status]?.border}`,borderRadius:16,padding:20,animation:'fadeUp 0.18s ease',boxShadow:'0 4px 16px rgba(0,0,0,0.07)'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:14}}>
            <div style={{fontSize:14,fontWeight:700,color:STATUS[sel.status]?.color,display:'flex',alignItems:'center',gap:7}}><Filter size={15}/>{CARD[sel.key.replace('_work','')]?.label} · {sel.status} ({filtered.length}건)</div>
            <IBtn icon={<X size={14}/>} onClick={()=>setSel(null)} color="#6B7280"/>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {filtered.map((item,i)=>{const c=STATUS[item.status]||STATUS['진행중'];return(
              <div key={i} style={{display:'flex',alignItems:'center',gap:12,padding:'11px 16px',background:c.bg,border:`1px solid ${c.border}`,borderRadius:10}}>
                <Badge status={item.status}/><span style={{flex:1,fontSize:14,color:T.t1,lineHeight:1.5}}>{item.text}</span>
                {item.part&&<Pill label={item.part} color={PART_COLOR[item.part]}/>}
              </div>
            );})}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── AnalyticsView ────────────────────────────────────────────────────────────
const AnalyticsView = ({selectedWeek,allData}) => {
  const [apart,setApart]=useState('전체');
  const stats=useMemo(()=>PARTS.filter(p=>apart==='전체'||p===apart).map(p=>{const rd=allData[p]||{};const all=[...(rd.prev_work||[]),...(rd.curr_work||[]),...(rd.next_work||[])];return{p,done:all.filter(i=>i.status==='완료').length,ing:all.filter(i=>i.status==='진행중').length,plan:all.filter(i=>i.status==='예정').length,delay:all.filter(i=>i.status==='지연').length,total:all.length};}),[apart,allData]);
  const total=stats.reduce((a,s)=>a+s.total,0)||1,done=stats.reduce((a,s)=>a+s.done,0),delay=stats.reduce((a,s)=>a+s.delay,0),ing=stats.reduce((a,s)=>a+s.ing,0);
  const kpis=[{l:'완료율',v:`${Math.round(done/total*100)}%`,s:`${done}/${total} 완료`,c:'#059669',bg:'#ECFDF5',b:'#A7F3D0'},{l:'전체 업무',v:total,s:apart==='전체'?'3개 파트 합산':'해당 파트',c:'#2563EB',bg:'#EFF6FF',b:'#BFDBFE'},{l:'진행중',v:ing,s:'현재 처리 중',c:'#D97706',bg:'#FFFBEB',b:'#FCD34D'},{l:'지연',v:delay,s:delay>0?'즉시 조치 필요':'이슈 없음',c:'#DC2626',bg:'#FEF2F2',b:'#FECACA'}];
  return(
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
        <SegCtrl options={['전체',...PARTS]} value={apart} onChange={setApart}/>
        <span style={{fontSize:12,color:T.t3,fontFamily:'monospace'}}>{selectedWeek}</span>
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {kpis.map(k=>(
          <div key={k.l} style={{background:k.bg,border:`1px solid ${k.b}`,borderRadius:16,padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:12,fontWeight:700,color:k.c,marginBottom:7,display:'flex',alignItems:'center',gap:5}}><span style={{width:7,height:7,borderRadius:'50%',background:k.c}}/>{k.l}</div>
            <div style={{fontSize:34,fontWeight:800,color:T.t1,lineHeight:1,fontFamily:'monospace'}}>{k.v}</div>
            <div style={{fontSize:11,color:T.t3,marginTop:6}}>{k.s}</div>
          </div>
        ))}
      </div>
      <HBarChart allData={allData} activePart={apart}/>
      <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:18,padding:24,boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
        <SecHdr icon={<AlertTriangle size={17} color="#DC2626"/>} title="업무 병목 지수" sub="파트별 지연 비율 — 40% 이상 즉시 조치 권고"/>
        {PARTS.map(p=>{
          const rd=allData[p]||{};const all=[...(rd.prev_work||[]),...(rd.curr_work||[]),...(rd.next_work||[])];
          const pct=all.length?Math.round(all.filter(i=>i.status==='지연').length/all.length*100):0;
          const clr=pct>=40?'#DC2626':pct>=20?'#D97706':'#059669';const risk=pct>=40?'위험':pct>=20?'주의':'정상';
          const rbg=pct>=40?'#FEF2F2':pct>=20?'#FFFBEB':'#ECFDF5';const rb=pct>=40?'#FECACA':pct>=20?'#FCD34D':'#A7F3D0';
          return(
            <div key={p} style={{display:'flex',alignItems:'center',gap:14,marginBottom:14}}>
              <span style={{fontSize:13,fontWeight:700,color:T.t1,width:34,flexShrink:0}}>{p}</span>
              <div style={{flex:1,height:24,background:'#F3F4F6',borderRadius:8,overflow:'hidden',border:'1px solid rgba(0,0,0,0.06)'}}>
                <div style={{height:'100%',width:`${Math.max(pct,pct>0?4:0)}%`,background:clr,borderRadius:8,transition:'width 0.6s ease'}}/>
              </div>
              <span style={{fontSize:13,fontWeight:700,color:clr,fontFamily:'monospace',width:36,textAlign:'right'}}>{pct}%</span>
              <span style={{fontSize:11,fontWeight:700,padding:'3px 10px',borderRadius:6,flexShrink:0,color:clr,background:rbg,border:`1px solid ${rb}`}}>{risk}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── KanbanBoard ──────────────────────────────────────────────────────────────
const KanbanBoard = ({allData}) => {
  const all=useMemo(()=>{const r=[];PARTS.forEach(p=>{const rd=allData[p]||{};['prev_work','curr_work','next_work'].forEach(k=>(rd[k]||[]).forEach(i=>r.push({...i,part:p,cardKey:k.replace('_work',''),cardLabel:CARD[k.replace('_work','')]?.label})));});return r;},[allData]);
  const byS=useMemo(()=>{const r={};STATUS_KEYS.forEach(s=>{r[s]=all.filter(i=>i.status===s);});return r;},[all]);
  const tot=all.length||1;
  return(
    <div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,marginBottom:20}}>
        {STATUS_KEYS.map(s=>{const c=STATUS[s];return(
          <div key={s} style={{background:c.bg,border:`1px solid ${c.border}`,borderRadius:16,padding:'18px 20px',boxShadow:'0 1px 3px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:12,fontWeight:700,color:c.color,marginBottom:7,display:'flex',alignItems:'center',gap:5}}><span style={{width:7,height:7,borderRadius:'50%',background:c.color}}/>{s}</div>
            <div style={{fontSize:34,fontWeight:800,color:T.t1,fontFamily:'monospace'}}>{byS[s].length}</div>
            <div style={{fontSize:11,color:T.t3,marginTop:5}}>전체의 {Math.round(byS[s].length/tot*100)}%</div>
          </div>
        );})}
      </div>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:12,alignItems:'start'}}>
        {STATUS_KEYS.map(s=>{const c=STATUS[s];const items=byS[s];return(
          <div key={s} style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
            <div style={{padding:'12px 16px',borderBottom:'1px solid rgba(0,0,0,0.06)',background:c.bg,display:'flex',justifyContent:'space-between',alignItems:'center'}}>
              <span style={{fontSize:13,fontWeight:700,color:c.color,display:'flex',alignItems:'center',gap:6}}><span style={{width:7,height:7,borderRadius:'50%',background:c.color}}/>{s}</span>
              <span style={{fontSize:11,fontWeight:700,padding:'2px 8px',borderRadius:999,background:'#fff',border:`1px solid ${c.border}`,color:c.color}}>{items.length}</span>
            </div>
            <div style={{padding:10,display:'flex',flexDirection:'column',gap:6}}>
              {items.length===0&&<div style={{padding:'24px',textAlign:'center',color:T.t4,fontSize:13}}>항목 없음</div>}
              {items.map((item,i)=>{const cc=CARD[item.cardKey];const pc=PART_COLOR[item.part]||'#2563EB';return(
                <div key={i} style={{background:'#F9FAFB',border:'1px solid rgba(0,0,0,0.07)',borderRadius:10,padding:'12px 14px',transition:'box-shadow 0.15s',cursor:'default'}}
                  onMouseEnter={e=>e.currentTarget.style.boxShadow='0 2px 8px rgba(0,0,0,0.07)'} onMouseLeave={e=>e.currentTarget.style.boxShadow='none'}>
                  <div style={{fontSize:13,color:T.t1,lineHeight:1.5,marginBottom:10}}>{item.text}</div>
                  <div style={{display:'flex',gap:5,flexWrap:'wrap'}}>
                    <Badge status={item.status}/>
                    <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:`${pc}15`,border:`1px solid ${pc}33`,color:pc}}>{item.part}</span>
                    <span style={{fontSize:10,fontWeight:700,padding:'3px 8px',borderRadius:999,background:cc?.bg,border:`1px solid ${cc?.border}`,color:cc?.color}}>{item.cardLabel}</span>
                  </div>
                </div>
              );})}
            </div>
          </div>
        );})}
      </div>
    </div>
  );
};

// ─── GlobalView ───────────────────────────────────────────────────────────────
const GlobalView = () => {
  const [rows,setRows]=useState([]);const [loading,setLoading]=useState(true);const [sf,setSf]=useState('전체');const [pf,setPf]=useState('전체');const [kw,setKw]=useState('');
  useEffect(()=>{async function load(){setLoading(true);try{const {data}=await dbCall('load_global');setRows(data||[]);}catch(e){console.error(e);}setLoading(false);}load();},[]);
  const flat=useMemo(()=>{const r=[];rows.forEach(row=>{['prev_work','curr_work','next_work'].forEach(k=>{toItems(row[k]).forEach(item=>{r.push({...item,week_id:row.week_id,part:row.part_name,cardLabel:CARD[k.replace('_work','')]?.label,cardKey:k.replace('_work','')});});});});return r;},[rows]);
  const filtered=useMemo(()=>flat.filter(i=>{if(sf!=='전체'&&i.status!==sf)return false;if(pf!=='전체'&&i.part!==pf)return false;if(kw&&!i.text.toLowerCase().includes(kw.toLowerCase()))return false;return true;}),[flat,sf,pf,kw]);
  const counts=useMemo(()=>{const r={};STATUS_KEYS.forEach(s=>{r[s]=flat.filter(i=>i.status===s).length;});return r;},[flat]);
  if(loading)return <Loading/>;
  return(
    <div>
      <SecHdr icon={<Globe size={17} color="#2563EB"/>} title="전체 업무 보기" sub={`주차 무관 · 전체 ${flat.length}건`}/>
      <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:10,marginBottom:20}}>
        {STATUS_KEYS.map(s=>{const c=STATUS[s];const active=sf===s;return(
          <button key={s} onClick={()=>setSf(p=>p===s?'전체':s)} style={{background:active?c.bg:'#fff',border:`1px solid ${active?c.border:'rgba(0,0,0,0.08)'}`,borderRadius:14,padding:'16px 20px',cursor:'pointer',textAlign:'left',transition:'all 0.18s',boxShadow:active?`0 2px 12px ${c.color}22`:'0 1px 3px rgba(0,0,0,0.04)'}}>
            <div style={{fontSize:12,fontWeight:700,color:c.color,marginBottom:7,display:'flex',alignItems:'center',gap:5}}><span style={{width:7,height:7,borderRadius:'50%',background:c.color}}/>{s}</div>
            <div style={{fontSize:30,fontWeight:800,color:T.t1,fontFamily:'monospace'}}>{counts[s]||0}</div>
            <div style={{fontSize:11,color:T.t3,marginTop:5}}>클릭하여 필터</div>
          </button>
        );})}
      </div>
      <div style={{display:'flex',gap:10,alignItems:'center',marginBottom:16,flexWrap:'wrap'}}>
        <div style={{position:'relative',flex:'0 0 200px'}}>
          <Search size={14} color={T.t3} style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',pointerEvents:'none'}}/>
          <input value={kw} onChange={e=>setKw(e.target.value)} placeholder="키워드 검색..." style={{width:'100%',background:'#fff',border:'1px solid rgba(0,0,0,0.1)',borderRadius:9,padding:'9px 10px 9px 32px',color:T.t1,fontSize:13}}/>
        </div>
        <SegCtrl options={['전체',...PARTS]} value={pf} onChange={setPf} sm/>
        <span style={{fontSize:12,color:T.t3,marginLeft:'auto'}}>{filtered.length}건</span>
      </div>
      {filtered.length===0?(
        <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:16,padding:60,textAlign:'center',color:T.t4}}><Globe size={32} style={{margin:'0 auto 12px'}}/><div style={{fontSize:15}}>해당 조건의 업무가 없습니다</div></div>
      ):(
        <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:16,overflow:'hidden',boxShadow:'0 1px 4px rgba(0,0,0,0.05)'}}>
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead><tr style={{background:'#F9FAFB',borderBottom:'1px solid rgba(0,0,0,0.08)'}}>{['주차','파트','분류','업무 내용','상태'].map(h=><th key={h} style={{padding:'12px 18px',textAlign:'left',fontSize:12,fontWeight:700,color:T.t3,whiteSpace:'nowrap'}}>{h}</th>)}</tr></thead>
              <tbody>
                {filtered.map((item,i)=>{const cc=CARD[item.cardKey];const pc=PART_COLOR[item.part]||'#2563EB';return(
                  <tr key={i} style={{borderBottom:'1px solid rgba(0,0,0,0.05)',background:i%2?'#FAFAFA':'#fff',transition:'background 0.1s'}} onMouseEnter={e=>e.currentTarget.style.background='#F0F4FF'} onMouseLeave={e=>e.currentTarget.style.background=i%2?'#FAFAFA':'#fff'}>
                    <td style={{padding:'12px 18px',fontFamily:'monospace',fontSize:12,color:T.t2,whiteSpace:'nowrap'}}>{item.week_id}</td>
                    <td style={{padding:'12px 18px'}}><span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:999,background:`${pc}15`,border:`1px solid ${pc}33`,color:pc}}>{item.part}</span></td>
                    <td style={{padding:'12px 18px'}}><span style={{fontSize:11,fontWeight:700,padding:'3px 9px',borderRadius:999,background:cc?.bg,border:`1px solid ${cc?.border}`,color:cc?.color}}>{item.cardLabel}</span></td>
                    <td style={{padding:'12px 18px',color:T.t1,fontSize:14,maxWidth:320,wordBreak:'break-word'}}>{item.text}</td>
                    <td style={{padding:'12px 18px'}}><Badge status={item.status}/></td>
                  </tr>
                );})}
              </tbody>
            </table>
          </div>
          <div style={{padding:'10px 18px',borderTop:'1px solid rgba(0,0,0,0.06)',fontSize:11,color:T.t3,display:'flex',justifyContent:'space-between',background:'#F9FAFB'}}><span>총 {filtered.length}건</span><span>상태 카드 클릭 → 빠른 필터</span></div>
        </div>
      )}
    </div>
  );
};

// ─── WeekManager ─────────────────────────────────────────────────────────────
const WeekManager = ({weeks,onClose,onAdd}) => {
  const [date,setDate]=useState('');const preview=date?dateToWeekId(date):'';const exists=weeks.includes(preview);
  return(
    <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.4)',backdropFilter:'blur(8px)',zIndex:2000,display:'flex',alignItems:'center',justifyContent:'center'}} onClick={onClose}>
      <div style={{background:'#fff',border:'1px solid rgba(0,0,0,0.1)',borderRadius:24,padding:36,width:480,boxShadow:'0 24px 80px rgba(0,0,0,0.16)',animation:'fadeUp 0.2s ease'}} onClick={e=>e.stopPropagation()}>
        <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:24}}>
          <div style={{fontSize:18,fontWeight:800,color:T.t1,display:'flex',alignItems:'center',gap:9}}><PlusCircle size={18} color="#2563EB"/>주차 관리</div>
          <IBtn icon={<X size={16}/>} onClick={onClose} color="#6B7280"/>
        </div>
        <div style={{background:'#EFF6FF',border:'1px solid #BFDBFE',borderRadius:12,padding:'14px 16px',marginBottom:20}}>
          <div style={{fontSize:13,fontWeight:700,color:'#2563EB',marginBottom:5,display:'flex',alignItems:'center',gap:5}}><Zap size={14}/>자동 이관 안내</div>
          <div style={{fontSize:13,color:T.t2,lineHeight:1.7}}>새 주차를 처음 열면 <strong>전주의 금주 진행 항목</strong>이 자동으로 <strong>이번 주 전주 실적</strong>으로 이관 저장됩니다.</div>
        </div>
        <label style={{fontSize:12,fontWeight:700,color:T.t2,marginBottom:7,display:'block'}}>날짜 선택 → 주차 자동 계산</label>
        <input type="date" value={date} onChange={e=>setDate(e.target.value)} style={{width:'100%',background:'#F9FAFB',border:'1.5px solid rgba(0,0,0,0.12)',borderRadius:10,padding:'11px 14px',color:T.t1,fontSize:14,marginBottom:10,boxSizing:'border-box',fontFamily:'inherit'}}/>
        {preview&&<div style={{padding:'10px 14px',borderRadius:10,marginBottom:14,background:exists?'#FFFBEB':'#EFF6FF',border:`1px solid ${exists?'#FCD34D':'#BFDBFE'}`,fontSize:13,color:exists?'#D97706':'#2563EB',display:'flex',alignItems:'center',gap:8}}><Calendar size={14}/><span style={{fontFamily:'monospace',fontWeight:700}}>{preview}</span><span style={{marginLeft:'auto',fontSize:11}}>{exists?'이미 존재':weekIdToRange(preview)}</span></div>}
        <button onClick={()=>{if(preview&&!exists){onAdd(preview);onClose();}}} disabled={!preview||exists} style={{width:'100%',padding:13,borderRadius:12,border:'none',background:(!preview||exists)?'#F3F4F6':'#2563EB',color:(!preview||exists)?T.t3:'#fff',fontSize:14,fontWeight:700,cursor:(!preview||exists)?'not-allowed':'pointer',transition:'all 0.2s',boxShadow:(!preview||exists)?'none':'0 4px 20px rgba(37,99,235,0.3)'}}>{exists?'이미 추가된 주차':'주차 추가하기'}</button>
        <div style={{marginTop:20}}><div style={{fontSize:12,fontWeight:700,color:T.t2,marginBottom:10}}>등록된 주차 ({weeks.length})</div><div style={{display:'flex',flexDirection:'column',gap:4,maxHeight:160,overflowY:'auto'}}>{weeks.map(w=><div key={w} style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'9px 14px',borderRadius:9,background:'#F9FAFB',border:'1px solid rgba(0,0,0,0.07)'}}><span style={{fontSize:13,fontFamily:'monospace',color:T.t1,fontWeight:600}}>{w}</span><span style={{fontSize:11,color:T.t3}}>{weekIdToRange(w)}</span></div>)}</div></div>
      </div>
    </div>
  );
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const Toast = ({msg,type='success',onClose}) => {
  useEffect(()=>{const t=setTimeout(onClose,5000);return()=>clearTimeout(t);},[onClose]);
  const isE=type==='error';
  return <div style={{background:'#fff',border:`1px solid ${isE?'#FECACA':'#6EE7B7'}`,borderRadius:14,padding:'13px 20px',zIndex:9999,display:'flex',alignItems:'center',gap:10,boxShadow:'0 8px 32px rgba(0,0,0,0.12)',maxWidth:540,animation:'fadeUp 0.2s ease'}}>{isE?<AlertTriangle size={16} color="#DC2626"/>:<CheckCircle2 size={16} color="#059669"/>}<span style={{fontSize:14,color:T.t1,lineHeight:1.4}}>{msg}</span><button onClick={onClose} style={{background:'transparent',border:'none',cursor:'pointer',color:T.t3,marginLeft:8,padding:2}}><X size={14}/></button></div>;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function MiraiDashboard() {
  const [weeks,setWeeks]             = useState([]);
  const [selectedWeek,setSelectedWeek] = useState('');
  const [viewMode,setViewMode]       = useState('report');
  // ★ 핵심: 단일 공유 state — 보고서/분석/현황판 모두 이걸 바라봄
  const [allData,setAllData]         = useState(EMPTY_ALL());
  const [loading,setLoading]         = useState(true);
  const [saveState,setSaveState]     = useState('idle');
  const [online,setOnline]           = useState(true);
  const [toasts,setToasts]           = useState([]);
  const [showWeekMgr,setShowWeekMgr] = useState(false);
  const [analysis,setAnalysis]       = useState({});
  const [aiPart,setAiPart]           = useState(null);
  const [aiLoading,setAiLoading]     = useState(false);
  const [expandedAI,setExpandedAI]   = useState({});
  const [expandedParts,setExpandedParts] = useState({인사:true,총무:true,직속:true});

  const addToast = useCallback((msg,type='success')=>{const id=genId();setToasts(p=>[...p,{id,msg,type}]);},[]);
  const rmToast  = useCallback(id=>setToasts(p=>p.filter(t=>t.id!==id)),[]);

  useEffect(()=>{const on=()=>setOnline(true),off=()=>setOnline(false);window.addEventListener('online',on);window.addEventListener('offline',off);return()=>{window.removeEventListener('online',on);window.removeEventListener('offline',off);};},[]);

  // 주차 목록
  useEffect(()=>{
    async function load(){try{const {data}=await dbCall('load_weeks');const ids=[...new Set((data||[]).map(r=>r.week_id))].sort();const cur=dateToWeekId(new Date());const all=ids.includes(cur)?ids:[...ids,cur].sort();setWeeks(all);setSelectedWeek(all[all.length-1]||cur);}catch(e){const cur=dateToWeekId(new Date());setWeeks([cur]);setSelectedWeek(cur);}}
    load();
  },[]);

  // ★ 핵심: 주차 변경 시 3개 파트 모두 한번에 로드
  useEffect(()=>{
    if(!selectedWeek)return;
    async function load(){
      setLoading(true);setAnalysis({});
      try{
        const {data:rows}=await dbCall('load_all',{week_id:selectedWeek});
        const newData=EMPTY_ALL();
        (rows||[]).forEach(r=>{
          if(PARTS.includes(r.part_name)){
            newData[r.part_name]={prev_work:toItems(r.prev_work),curr_work:toItems(r.curr_work),next_work:toItems(r.next_work),ax_case:r.ax_case||'',notices:r.notices||''};
          }
        });
        // 자동 이관: 데이터 없는 파트에 대해 전주 curr_work → 이번 주 prev_work
        const wIdx=weeks.indexOf(selectedWeek);
        if(wIdx>0){
          const needCarry=PARTS.filter(p=>!(rows||[]).find(r=>r.part_name===p));
          if(needCarry.length>0){
            try{
              const {data:prevRows}=await dbCall('load_all',{week_id:weeks[wIdx-1]});
              let carried=false;
              needCarry.forEach(p=>{
                const prevRow=prevRows?.find(r=>r.part_name===p);
                if(prevRow?.curr_work?.length){
                  const items=toItems(prevRow.curr_work);
                  newData[p]={...EMPTY_PART(),prev_work:items};
                  carried=true;
                }
              });
              if(carried){
                // 자동 저장
                await Promise.all(needCarry.filter(p=>newData[p].prev_work.length>0).map(p=>dbCall('save',{week_id:selectedWeek,part_name:p,prev_work:fromItems(newData[p].prev_work),curr_work:[],next_work:[],ax_case:'',notices:''})));
                addToast('전주 금주 진행 항목이 이번 주 전주 실적으로 자동 이관되었습니다');
              }
            }catch(e){console.error('carry-over:',e);}
          }
        }
        setAllData(newData);
      }catch(e){addToast('데이터 로드 실패: '+e.message,'error');}
      setLoading(false);
    }
    load();
  },[selectedWeek,weeks]); // eslint-disable-line

  // ★ 파트 데이터 수정 (공유 state 업데이트)
  const patchPart = useCallback((part,field)=>updater=>{
    setAllData(prev=>({...prev,[part]:{...prev[part],[field]:typeof updater==='function'?updater(prev[part][field]):updater}}));
  },[]);

  // ★ 전체 저장 (3개 파트 동시)
  const handleSave = useCallback(async()=>{
    setSaveState('saving');
    try{
      await Promise.all(PARTS.map(p=>dbCall('save',{week_id:selectedWeek,part_name:p,prev_work:fromItems(allData[p].prev_work),curr_work:fromItems(allData[p].curr_work),next_work:fromItems(allData[p].next_work),ax_case:allData[p].ax_case,notices:allData[p].notices})));
      setSaveState('saved');
    }catch(e){addToast('저장 실패: '+e.message,'error');setSaveState('error');}
    setTimeout(()=>setSaveState('idle'),2500);
  },[selectedWeek,allData,addToast]);

  // AI 분석
  const handleAnalyze = useCallback(async(part)=>{
    setAiPart(part);setAiLoading(true);setExpandedAI(p=>({...p,[part]:true}));
    const partData={prev_work:allData[part].prev_work,curr_work:allData[part].curr_work,next_work:allData[part].next_work};
    try{const res=await fetch('/api/analyze',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({reportData:partData,activeTab:part,selectedWeek})});const data=await res.json();if(data.error)throw new Error(data.error);setAnalysis(p=>({...p,[part]:data}));}
    catch(e){addToast('AI 분석 실패: '+e.message,'error');}
    setAiLoading(false);
  },[allData,selectedWeek,addToast]);

  useEffect(()=>{const h=e=>{if((e.ctrlKey||e.metaKey)&&e.key==='s'){e.preventDefault();handleSave();}};window.addEventListener('keydown',h);return()=>window.removeEventListener('keydown',h);},[handleSave]);

  const saveBg={idle:'#2563EB',saving:'#6B7280',saved:'#059669',error:'#DC2626'};
  const saveLb={idle:'전체 저장',saving:'저장 중...',saved:'저장됨 ✓',error:'저장 실패'};

  const VIEWS=[{k:'report',icon:<FileText size={14}/>,label:'보고서'},{k:'analytics',icon:<TrendingUp size={14}/>,label:'분석'},{k:'board',icon:<LayoutGrid size={14}/>,label:'현황판'},{k:'global',icon:<Globe size={14}/>,label:'전체 보기'}];

  return(
    <div style={{display:'flex',height:'100vh',background:'#F2F4F7',color:T.t1,overflow:'hidden',fontFamily:"'Pretendard','Noto Sans KR',-apple-system,sans-serif"}}>

      {/* ── Sidebar ── */}
      <aside style={{width:252,flexShrink:0,borderRight:'1px solid rgba(0,0,0,0.08)',display:'flex',flexDirection:'column',background:'#fff',boxShadow:'1px 0 0 rgba(0,0,0,0.04)'}}>

        {/* ★ 로고 — 다크 배경에 SUPERCAT 로고 명확히 표시 */}
        <div style={{padding:'18px 20px 16px',borderBottom:'1px solid rgba(0,0,0,0.07)'}}>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            {/* 다크 박스에 로고 — 흰 배경에서 잘 보이도록 */}
            <div style={{background:'#0D111A',borderRadius:11,padding:'7px 10px',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
              <img src="/supercat-logo.png" alt="SUPERCAT" style={{height:18,width:'auto',display:'block'}}/>
            </div>
            <div>
              <div style={{fontSize:14,fontWeight:800,color:T.t1,letterSpacing:'-0.2px',lineHeight:1.1}}>미래인재실</div>
              <div style={{fontSize:11,color:T.t3,marginTop:3,fontWeight:500}}>주간업무 보고 시스템</div>
            </div>
          </div>
        </div>

        {/* DB 상태 */}
        <div style={{padding:'9px 16px',borderBottom:'1px solid rgba(0,0,0,0.05)'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:6,fontSize:11,fontWeight:700,padding:'4px 9px',borderRadius:7,color:online?'#059669':'#DC2626',background:online?'#ECFDF5':'#FEF2F2',border:`1px solid ${online?'#A7F3D0':'#FECACA'}`}}>
            {online?<Wifi size={10}/>:<WifiOff size={10}/>}
            <span style={{width:5,height:5,borderRadius:'50%',background:online?'#059669':'#DC2626'}}/>
            {online?'DB 연결됨':'오프라인'}
          </div>
        </div>

        {/* 주차 목록 */}
        <div style={{padding:'14px 12px 8px',flex:1,overflowY:'auto'}}>
          <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:12,padding:'0 4px'}}>
            <span style={{fontSize:9,fontWeight:800,color:T.t4,letterSpacing:'0.18em'}}>WEEKS</span>
            <button onClick={()=>setShowWeekMgr(true)} style={{display:'flex',alignItems:'center',gap:4,padding:'5px 10px',borderRadius:8,border:'1px solid rgba(37,99,235,0.3)',background:'#EFF6FF',color:'#2563EB',cursor:'pointer',fontSize:11,fontWeight:700,transition:'all 0.15s'}}
              onMouseEnter={e=>{e.currentTarget.style.background='#DBEAFE';}} onMouseLeave={e=>{e.currentTarget.style.background='#EFF6FF';}}>
              <Plus size={12}/>주차 추가
            </button>
          </div>
          <nav style={{display:'flex',flexDirection:'column',gap:2,maxHeight:240,overflowY:'auto'}}>
            {weeks.map(w=>{const active=selectedWeek===w;return(
              <button key={w} onClick={()=>setSelectedWeek(w)} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 12px',borderRadius:10,border:active?'1px solid rgba(37,99,235,0.25)':'1px solid transparent',background:active?'#EFF6FF':'transparent',color:active?'#2563EB':T.t2,cursor:'pointer',textAlign:'left',transition:'all 0.15s'}}
                onMouseEnter={e=>{if(!active){e.currentTarget.style.background='#F9FAFB';e.currentTarget.style.color=T.t1;}}}
                onMouseLeave={e=>{if(!active){e.currentTarget.style.background='transparent';e.currentTarget.style.color=T.t2;}}}>
                <div><div style={{fontSize:12,fontWeight:700,fontFamily:'monospace',color:active?'#2563EB':T.t1}}>{w}</div>{active&&<div style={{fontSize:10,color:'#93C5FD',marginTop:2}}>{weekIdToRange(w)}</div>}</div>
                <ChevronRight size={13} style={{opacity:active?0.7:0,transition:'opacity 0.15s',color:'#2563EB'}}/>
              </button>
            );})}
            {!weeks.length&&<div style={{fontSize:13,color:T.t4,textAlign:'center',padding:'20px 8px'}}>주차를 추가해주세요</div>}
          </nav>
        </div>

        {/* 단축키 */}
        <div style={{padding:'14px 18px',borderTop:'1px solid rgba(0,0,0,0.07)'}}>
          <div style={{fontSize:9,fontWeight:700,color:T.t4,letterSpacing:'0.15em',marginBottom:10}}>SHORTCUTS</div>
          {[['전체 저장','⌘S'],['항목 편집','더블클릭'],['취소','Esc']].map(([l,k])=>(
            <div key={l} style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:7}}>
              <span style={{fontSize:12,color:T.t3}}>{l}</span>
              <kbd style={{background:'#F3F4F6',border:'1px solid rgba(0,0,0,0.1)',padding:'2px 7px',borderRadius:5,fontSize:10,fontFamily:'monospace',color:T.t2}}>{k}</kbd>
            </div>
          ))}
        </div>
      </aside>

      {/* ── Main ── */}
      <main style={{flex:1,display:'flex',flexDirection:'column',overflow:'hidden'}}>
        {/* 헤더 */}
        <header style={{padding:'13px 28px',borderBottom:'1px solid rgba(0,0,0,0.08)',background:'#fff',display:'flex',alignItems:'center',justifyContent:'space-between',flexShrink:0,boxShadow:'0 1px 0 rgba(0,0,0,0.05)'}}>
          <div>
            <h1 style={{fontSize:20,fontWeight:800,color:T.t1,margin:0,letterSpacing:'-0.4px'}}>주간업무 보고</h1>
            <div style={{display:'flex',alignItems:'center',gap:7,marginTop:4}}>
              <Calendar size={12} color="#2563EB"/>
              <span style={{fontSize:12,color:T.t2,fontFamily:'monospace'}}>{selectedWeek||'—'}</span>
              <span style={{color:'#D1D5DB'}}>·</span>
              <span style={{fontSize:12,color:T.t2}}>인사 · 총무 · 직속 파트</span>
            </div>
          </div>
          <div style={{display:'flex',alignItems:'center',gap:8}}>
            <div style={{display:'flex',gap:1,padding:3,background:'#F3F4F6',borderRadius:12,border:'1px solid rgba(0,0,0,0.08)'}}>
              {VIEWS.map(v=>(
                <button key={v.k} onClick={()=>setViewMode(v.k)} style={{display:'flex',alignItems:'center',gap:5,padding:'7px 14px',borderRadius:9,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,transition:'all 0.15s',background:viewMode===v.k?'#fff':'transparent',color:viewMode===v.k?T.t1:T.t3,boxShadow:viewMode===v.k?'0 1px 4px rgba(0,0,0,0.1)':'none'}}>
                  {v.icon}{v.label}
                </button>
              ))}
            </div>
            {saveState!=='idle'&&<span style={{fontSize:12,fontWeight:700,color:saveBg[saveState]}}>{saveLb[saveState]}</span>}
            <button onClick={handleSave} disabled={saveState==='saving'} style={{display:'flex',alignItems:'center',gap:6,background:saveBg[saveState],color:'#fff',padding:'9px 22px',borderRadius:10,border:'none',fontSize:13,fontWeight:700,cursor:saveState==='saving'?'not-allowed':'pointer',transition:'all 0.2s',boxShadow:saveState==='idle'?'0 2px 16px rgba(37,99,235,0.3)':'none'}}>
              <Save size={15}/>{saveLb[saveState]}
            </button>
          </div>
        </header>

        {/* 바디 */}
        <div style={{flex:1,overflowY:'auto',padding:'24px 28px'}}>

          {/* ── 보고서 — 3개 파트 동시 표시, allData 공유 ── */}
          {viewMode==='report'&&(
            loading?<Loading/>:(
              <>
                {PARTS.map(part=>{
                  const pc=PART_COLOR[part]; const partData=allData[part]; const expanded=expandedParts[part];
                  const totalItems=[...partData.prev_work,...partData.curr_work,...partData.next_work];
                  const doneN=totalItems.filter(i=>i.status==='완료').length; const delayN=totalItems.filter(i=>i.status==='지연').length;
                  const partAnalysis=analysis[part]||{};
                  const aiExpanded=expandedAI[part]; const isAiLoading=aiLoading&&aiPart===part;
                  return(
                    <div key={part} style={{marginBottom:28}}>
                      {/* 파트 섹션 헤더 */}
                      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:14}}>
                        <button onClick={()=>setExpandedParts(p=>({...p,[part]:!p[part]}))}
                          style={{display:'flex',alignItems:'center',gap:10,background:'transparent',border:'none',cursor:'pointer',padding:0}}>
                          <div style={{width:10,height:10,borderRadius:'50%',background:pc,boxShadow:`0 0 0 3px ${pc}22`}}/>
                          <span style={{fontSize:18,fontWeight:800,color:T.t1}}>{part} 파트</span>
                          {totalItems.length>0&&<span style={{fontSize:12,color:T.t3}}>총 {totalItems.length}건{doneN>0?` · 완료 ${doneN}`:''}{delayN>0&&<span style={{color:'#DC2626'}}> · 지연 {delayN}</span>}</span>}
                          <ChevronRight size={15} color={T.t3} style={{transform:expanded?'rotate(90deg)':'rotate(0)',transition:'transform 0.2s'}}/>
                        </button>
                        <div style={{display:'flex',alignItems:'center',gap:8}}>
                          <button onClick={()=>handleAnalyze(part)} style={{display:'flex',alignItems:'center',gap:5,padding:'6px 12px',borderRadius:8,border:'1px solid rgba(124,58,237,0.3)',background:'#F5F3FF',color:'#7C3AED',fontSize:12,fontWeight:700,cursor:'pointer',transition:'all 0.15s'}}
                            onMouseEnter={e=>{e.currentTarget.style.background='#EDE9FE';}} onMouseLeave={e=>{e.currentTarget.style.background='#F5F3FF';}}>
                            <Bot size={13}/>{isAiLoading?'분석 중...':'AI 분석'}
                          </button>
                        </div>
                      </div>
                      <div style={{height:1,background:`linear-gradient(90deg, ${pc}55, transparent)`,marginBottom:16}}/>

                      {expanded&&(
                        <>
                          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:16,marginBottom:14}}>
                            {['prev','curr','next'].map(k=>(
                              <WorkCard key={k} cardKey={k}
                                items={partData[`${k}_work`]}
                                onItemsChange={patchPart(part,`${k}_work`)}
                                onCarryOver={k==='curr'?()=>{if(!partData.curr_work.length){addToast('금주 진행 사항이 없습니다.','error');return;}if(!confirm('금주 진행 내용을 전주 실적으로 이관할까요?'))return;setAllData(prev=>({...prev,[part]:{...prev[part],prev_work:[...prev[part].curr_work],curr_work:[]}}));addToast(`${part} 파트 이관 완료`);}:undefined}
                                analysisData={partAnalysis[`${k}_work`]||[]}
                              />
                            ))}
                          </div>
                          {/* AI 분석 결과 */}
                          {aiExpanded&&partAnalysis.summary&&(
                            <div style={{background:'#fff',border:'1px solid #DDD6FE',borderRadius:14,overflow:'hidden',marginBottom:14,boxShadow:'0 2px 12px rgba(124,58,237,0.07)'}}>
                              <div style={{padding:'11px 18px',background:'#F5F3FF',borderBottom:'1px solid rgba(0,0,0,0.07)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                                <span style={{fontSize:13,fontWeight:700,color:'#7C3AED',display:'flex',alignItems:'center',gap:6}}><Bot size={14}/> AI 분석 — {part} 파트</span>
                                <IBtn icon={<X size={13}/>} onClick={()=>setExpandedAI(p=>({...p,[part]:false}))} color="#6B7280"/>
                              </div>
                              <div style={{padding:'14px 18px'}}>
                                <div style={{padding:'12px 16px',borderRadius:10,background:'#F5F3FF',border:'1px solid #DDD6FE',fontSize:13,color:'#6D28D9',lineHeight:1.7,marginBottom:12}}>{partAnalysis.summary}</div>
                                {['prev_work','curr_work','next_work'].map(key=>{
                                  const items=(partAnalysis[key]||[]).filter(x=>x.flags?.length); if(!items.length)return null;
                                  const label={prev_work:'전주 실적',curr_work:'금주 진행',next_work:'차주 예정'}[key];
                                  return(<div key={key} style={{marginBottom:10}}><div style={{fontSize:11,fontWeight:700,color:T.t3,marginBottom:7,letterSpacing:'0.08em'}}>{label}</div>{items.map(item=>(
                                    <div key={item.index} style={{padding:'10px 14px',borderRadius:10,background:'#F9FAFB',border:'1px solid rgba(0,0,0,0.07)',marginBottom:6}}>
                                      <div style={{display:'flex',gap:5,flexWrap:'wrap',marginBottom:5}}>{(item.flags||[]).map(f=><span key={f} style={{display:'inline-flex',alignItems:'center',gap:3,padding:'3px 9px',borderRadius:6,fontSize:11,fontWeight:700,color:f==='트래킹 누락'?'#DC2626':'#D97706',background:f==='트래킹 누락'?'#FEF2F2':'#FFFBEB',border:`1px solid ${f==='트래킹 누락'?'#FECACA':'#FCD34D'}`}}><Zap size={9}/>{f}</span>)}</div>
                                      {item.comment&&<div style={{fontSize:12,color:T.t2,lineHeight:1.6}}>{item.comment}</div>}
                                    </div>
                                  ))}</div>);
                                })}
                              </div>
                            </div>
                          )}
                          {/* AX 사례 + 공지 */}
                          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:14}}>
                            {[{f:'ax_case',icon:<Sparkles size={14} color="#7C3AED"/>,label:'AX 사례',c:'#7C3AED',bg:'#F5F3FF',b:'#DDD6FE',ph:'AX 적용 사례를 기록해 주세요...'},{f:'notices',icon:<Megaphone size={14} color="#DC2626"/>,label:'공지 사항',c:'#DC2626',bg:'#FEF2F2',b:'#FECACA',ph:'공지 사항을 입력해 주세요...'}].map(({f,icon,label,c,bg,b,ph})=>(
                              <div key={f} style={{background:'#fff',border:'1px solid rgba(0,0,0,0.08)',borderRadius:14,padding:18,transition:'border-color 0.2s'}}
                                onMouseEnter={e=>e.currentTarget.style.borderColor=b} onMouseLeave={e=>e.currentTarget.style.borderColor='rgba(0,0,0,0.08)'}>
                                <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                                  <div style={{padding:6,borderRadius:8,background:bg,border:`1px solid ${b}`}}>{icon}</div>
                                  <span style={{fontSize:13,fontWeight:700,color:T.t1}}>{part} · {label}</span>
                                </div>
                                <textarea value={partData[f]||''} onChange={e=>patchPart(part,f)(e.target.value)} placeholder={ph} style={{width:'100%',background:'#FAFAFA',border:'1px solid rgba(0,0,0,0.07)',borderRadius:9,padding:'9px 12px',color:T.t1,fontSize:13,lineHeight:1.7,resize:'none',height:80,outline:'none',fontFamily:'inherit',boxSizing:'border-box',transition:'border-color 0.15s'}}
                                  onFocus={e=>e.target.style.borderColor=b} onBlur={e=>e.target.style.borderColor='rgba(0,0,0,0.07)'}/>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            )
          )}

          {/* ★ 분석/현황판 — 동일한 allData 사용 (별도 DB 호출 없음) */}
          {viewMode==='analytics'&&<AnalyticsView selectedWeek={selectedWeek} allData={allData}/>}
          {viewMode==='board'&&<KanbanBoard allData={allData}/>}
          {viewMode==='global'&&<GlobalView/>}
        </div>
      </main>

      {showWeekMgr&&<WeekManager weeks={weeks} onClose={()=>setShowWeekMgr(false)} onAdd={w=>{setWeeks(p=>[...new Set([...p,w])].sort());setSelectedWeek(w);addToast(`주차 ${w} 추가됨`);}}/>}
      <div style={{position:'fixed',bottom:28,left:'50%',transform:'translateX(-50%)',display:'flex',flexDirection:'column',gap:8,zIndex:9999,alignItems:'center'}}>
        {toasts.map(t=><Toast key={t.id} msg={t.msg} type={t.type} onClose={()=>rmToast(t.id)}/>)}
      </div>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)}} @keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}} .animate-spin{animation:spin 1s linear infinite}`}</style>
    </div>
  );
}
