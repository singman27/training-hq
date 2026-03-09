import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Area, AreaChart, RadarChart, PolarGrid, PolarAngleAxis, Radar } from "recharts";
import { loadLocal, saveData, initialLoad, exportData, importData } from "./storage";
import { supabase } from "./supabaseClient";
import { PHASES, ST, SCHED, SUPPS, RECOV, DOW, PAIN_AREAS, KEY_LIFTS, INBODY_FIELDS, PADEL_SHOTS, TACTICAL_PRINCIPLES, TACTICAL_FOCUS_OPTIONS } from "./data";

/* ════════════════════════════════════════════════════════════════════════════
   HELPERS
   ════════════════════════════════════════════════════════════════════════════ */

function dk(d){ return d instanceof Date ? d.toISOString().split("T")[0] : d; }
function ws(d){ const w=new Date(d); w.setDate(d.getDate()-d.getDay()+1); w.setHours(0,0,0,0); return w; }
function sunOf(d){ const w=new Date(d); w.setDate(d.getDate()-d.getDay()); w.setHours(0,0,0,0); return w; }

/* ════════════════════════════════════════════════════════════════════════════ */

export default function App({ session }) {
  const [phase, setPhase] = useState(1);
  const [view, setView] = useState("today");
  const [logs, setLogs] = useState({});
  const [overrides, setOverrides] = useState({});
  const [inbody, setInbody] = useState([]);
  const [checkins, setCheckins] = useState({});
  const [painLog, setPainLog] = useState({});
  const [exitChecked, setExitChecked] = useState({});
  const [selDay, setSelDay] = useState(null);
  const [expEx, setExpEx] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalDate, setModalDate] = useState(null);
  const [swapMode, setSwapMode] = useState(null);
  const [showInbodyForm, setShowInbodyForm] = useState(false);
  const [ibForm, setIbForm] = useState({});
  const [showCheckinForm, setShowCheckinForm] = useState(false);
  const [ciForm, setCiForm] = useState({energy:3,sleep:3,motivation:3,pain:"",win:""});
  const [showPainForm, setShowPainForm] = useState(false);
  const [pfAreas, setPfAreas] = useState({});
  const [loaded, setLoaded] = useState(false);
  // Padel state
  const [padel, setPadel] = useState({ matches:[], shots:{}, focus:{}, videos:[], tournaments:[] });
  const [padelView, setPadelView] = useState("matches");
  const [showMatchForm, setShowMatchForm] = useState(false);
  const [matchForm, setMatchForm] = useState({});
  const [showShotForm, setShowShotForm] = useState(false);
  const [shotForm, setShotForm] = useState({});
  const [showFocusForm, setShowFocusForm] = useState(false);
  const [focusForm, setFocusForm] = useState({area:"",notes:""});
  const [showVideoForm, setShowVideoForm] = useState(false);
  const [videoForm, setVideoForm] = useState({});
  const [showTournForm, setShowTournForm] = useState(false);
  const [tournForm, setTournForm] = useState({});

  const fileInputRef = useRef(null);

  useEffect(()=>{
    // Load from localStorage immediately for fast render
    const local = loadLocal();
    setLogs(local.logs||{}); setPhase(local.phase||1); setOverrides(local.ov||{});
    setInbody(local.ib||[]); setCheckins(local.ci||{}); setPainLog(local.pain||{});
    setExitChecked(local.ec||{}); setPadel(local.padel||{matches:[],shots:{},focus:{},videos:[],tournaments:[]});
    setLoaded(true);

    // Then sync with Supabase in the background
    initialLoad().then(d => {
      if (d) {
        setLogs(d.logs||{}); setPhase(d.phase||1); setOverrides(d.ov||{});
        setInbody(d.ib||[]); setCheckins(d.ci||{}); setPainLog(d.pain||{});
        setExitChecked(d.ec||{}); setPadel(d.padel||{matches:[],shots:{},focus:{},videos:[],tournaments:[]});
      }
    });
  },[]);

  const save = useCallback((upd={})=>{
    const st = { logs: upd.logs??logs, phase: upd.phase??phase, ov: upd.ov??overrides, ib: upd.ib??inbody, ci: upd.ci??checkins, pain: upd.pain??painLog, ec: upd.ec??exitChecked, padel: upd.padel??padel };
    if(upd.logs!==undefined)setLogs(st.logs);if(upd.phase!==undefined)setPhase(st.phase);if(upd.ov!==undefined)setOverrides(st.ov);if(upd.ib!==undefined)setInbody(st.ib);if(upd.ci!==undefined)setCheckins(st.ci);if(upd.pain!==undefined)setPainLog(st.pain);if(upd.ec!==undefined)setExitChecked(st.ec);if(upd.padel!==undefined)setPadel(st.padel);
    saveData(st);
  },[logs,phase,overrides,inbody,checkins,painLog,exitChecked,padel]);

  const today = new Date();
  const todayKey = dk(today);
  const phaseObj = PHASES.find(p=>p.id===phase);
  const schedule = SCHED[phase];
  const wsDate = ws(today);
  const weekDates = useMemo(()=>Array.from({length:7},(_,i)=>{const d=new Date(wsDate);d.setDate(wsDate.getDate()+i);return dk(d);}),[wsDate]);
  const weekInPhase = useMemo(()=>{const ranges={1:1,2:7,3:15,4:23,5:29};const base=ranges[phase]||1;return Math.max(1,Math.floor((today-wsDate)/(7*864e5))+1);},[phase,today,wsDate]);
  const isDeload = weekInPhase%3===0;

  const getSession = useCallback((dateKey)=>{
    if(overrides[dateKey]) return overrides[dateKey];
    const d=new Date(dateKey+"T12:00:00"); const idx=(d.getDay()+6)%7;
    return schedule[idx]||schedule[0];
  },[overrides,schedule]);

  const todaySession = getSession(todayKey);
  const dl = logs[todayKey]||{};
  const wuL = todaySession?.wu?.length||0;
  const exL = todaySession?.ex?.length||0;
  const total = wuL+exL;
  const doneC = Object.values(dl.exercises||{}).filter(e=>e?.done).length;
  const pct = total>0?Math.round((doneC/total)*100):0;

  const toggle=(dk2,idx)=>{const d={...(logs[dk2]||{})};const e={...(d.exercises||{})};e[idx]={...(e[idx]||{}),done:!e[idx]?.done};d.exercises=e;save({logs:{...logs,[dk2]:d}});};
  const updEx=(dk2,idx,f,v)=>{const d={...(logs[dk2]||{})};const e={...(d.exercises||{})};e[idx]={...(e[idx]||{}),[f]:v};d.exercises=e;save({logs:{...logs,[dk2]:d}});};
  const updSess=(dk2,f,v)=>{save({logs:{...logs,[dk2]:{...(logs[dk2]||{}),[f]:v}}});};

  const weekStats=useMemo(()=>{let s=0,rS=0,ld=0;weekDates.forEach(k=>{const l=logs[k];if(l?.rpe){s++;rS+=+l.rpe;ld+=(+l.rpe)*(+(l.duration)||getSession(k)?.d||60);}});return{s,ar:s?(rS/s).toFixed(1):"—",ld};},[weekDates,logs,getSession]);

  // Consistency: 4-week rolling
  const consistency = useMemo(()=>{
    let planned=0,completed=0;
    for(let i=0;i<28;i++){const d=new Date(today);d.setDate(today.getDate()-i);const k=dk(d);const sess=getSession(k);if(sess?.ty!=="rest")planned++;const l=logs[k];if(l?.rpe)completed++;}
    return planned>0?Math.round((completed/planned)*100):0;
  },[today,logs,getSession]);

  // Exercise progression
  const liftHistory = useMemo(()=>{
    const data={};
    Object.entries(logs).forEach(([date,dl2])=>{
      if(!date.match(/^\d{4}-\d{2}-\d{2}$/)||!dl2.exercises)return;
      Object.values(dl2.exercises).forEach(e=>{
        if(e?.weight && e?.done){
          const matched = KEY_LIFTS.find(l => {
            const sess = getSession(date);
            const allEx = [...(sess?.wu||[]),...(sess?.ex||[])];
            const idx = Object.keys(dl2.exercises).find(k => dl2.exercises[k] === e);
            const exObj = allEx[+idx];
            return exObj && exObj.n && exObj.n.toLowerCase().includes(l.toLowerCase().split(" ")[0].toLowerCase());
          });
          if(!matched){
            KEY_LIFTS.forEach(l=>{
              if(e.note && e.note.toLowerCase().includes(l.toLowerCase().split("/")[0].toLowerCase().split(" ")[0])){
                if(!data[l])data[l]=[];
                data[l].push({date,weight:+e.weight,reps:e.repsActual||""});
              }
            });
          }
        }
      });
    });
    return data;
  },[logs,getSession]);

  // History
  const histData=useMemo(()=>Object.entries(logs).filter(([k,v])=>k.match(/^\d{4}-\d{2}-\d{2}$/)&&v.rpe).map(([k,v])=>({date:k,rpe:+v.rpe,dur:+(v.duration||60),load:(+v.rpe)*+(v.duration||60),exD:Object.values(v.exercises||{}).filter(e=>e?.done).length})).sort((a,b)=>a.date.localeCompare(b.date)),[logs]);

  const weeklyHist=useMemo(()=>{const w={};histData.forEach(e=>{const d=new Date(e.date+"T12:00:00");const wk=dk(ws(d));if(!w[wk])w[wk]={wk,s:0,tl:0,tr:0};w[wk].s++;w[wk].tl+=e.load;w[wk].tr+=e.rpe;});return Object.values(w).map(x=>({...x,ar:(x.tr/x.s).toFixed(1),lb:x.wk.slice(5)})).sort((a,b)=>a.wk.localeCompare(b.wk)).slice(-12);},[histData]);

  // Pain trend
  const painTrend = useMemo(()=>{
    return Object.entries(painLog).filter(([k])=>k.match(/^\d{4}-\d{2}-\d{2}$/)).map(([date,areas])=>{
      const vals = Object.values(areas).filter(v=>typeof v==="number");
      return { date, avg: vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):0, max: vals.length?Math.max(...vals):0, lb: date.slice(5) };
    }).sort((a,b)=>a.date.localeCompare(b.date)).slice(-20);
  },[painLog]);

  const handleSwap=(dk2)=>{if(!swapMode){setSwapMode(dk2);return;}if(swapMode===dk2){setSwapMode(null);return;}const s1=getSession(swapMode),s2=getSession(dk2);save({ov:{...overrides,[swapMode]:s2,[dk2]:s1}});setSwapMode(null);};

  const [cType,setCType]=useState("yoga"),[cTitle,setCTitle]=useState(""),[cDur,setCDur]=useState("60"),[cNotes,setCNotes]=useState("");
  const addCustom=()=>{const s={day:DOW[new Date(modalDate+"T12:00:00").getDay()],t:cTitle||ST[cType]?.l||"Custom",s:cNotes||"",ty:cType,d:+cDur||60,rp:"—",wu:[{n:"Self-directed warm-up",d:"5–10 min"}],ex:[{n:cTitle||ST[cType]?.l,s:1,r:`${cDur} min`,te:"",no:cNotes}]};save({ov:{...overrides,[modalDate]:s}});setShowModal(false);setCTitle("");setCDur("60");setCNotes("");};

  const S={bg:"#060606",card:"#0c0c0c",bd:"#181818",tx:"#e4e4e4",dm:"#555",ac:phaseObj?.c||"#10b981",fn:"'Outfit',sans-serif"};
  const inp={background:"#0f0f0f",border:`1px solid ${S.bd}`,borderRadius:6,padding:"6px 10px",color:S.tx,fontSize:13,fontFamily:S.fn};
  const chip=(a,c)=>({padding:"6px 0",borderRadius:7,border:"none",background:a?(c||S.ac)+"15":"transparent",color:a?c||S.ac:S.dm,fontSize:10,fontWeight:700,cursor:"pointer",textTransform:"uppercase",letterSpacing:1.1});

  /* ── Render session ──────────────────────────────────────────── */

  const renderSess=(sess,dk2)=>{
    const dl2=logs[dk2]||{};const st=ST[sess.ty]||ST.custom;
    return(<div>
      <div style={{display:"flex",gap:8,alignItems:"center",mb:12,marginBottom:12}}>
        <span style={{fontSize:24}}>{st.i}</span>
        <div style={{flex:1}}><div style={{fontSize:17,fontWeight:700,color:S.tx}}>{sess.t}</div><div style={{fontSize:11,color:S.dm}}>{sess.s} • {sess.d}min • RPE {sess.rp}</div></div>
        <span style={{background:st.c+"12",border:`1px solid ${st.c}25`,borderRadius:5,padding:"2px 8px",fontSize:9,color:st.c,fontWeight:700,textTransform:"uppercase"}}>{sess.ty}</span>
      </div>
      {isDeload&&sess.ty==="gym"&&<div style={{background:"#f59e0b10",border:"1px solid #f59e0b20",borderRadius:7,padding:"7px 11px",marginBottom:12,fontSize:11,color:"#f59e0b"}}>⚡ DELOAD — Cut volume 40–50%, keep intensity</div>}
      {sess.wu?.length>0&&<><div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1.5,margin:"10px 0 5px"}}>Warm-Up</div>
        {sess.wu.map((w,i)=>{const dn=dl2.exercises?.[i]?.done;return(<div key={i} onClick={()=>toggle(dk2,i)} style={{display:"flex",alignItems:"center",gap:7,padding:"5px 9px",marginBottom:2,borderRadius:5,background:dn?"#10b98106":"transparent",cursor:"pointer"}}><div style={{width:16,height:16,borderRadius:4,border:dn?"2px solid #10b981":"1.5px solid #2a2a2a",background:dn?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0}}>{dn&&"✓"}</div><span style={{fontSize:12,color:dn?S.dm:S.tx,textDecoration:dn?"line-through":"none",flex:1}}>{w.n}</span><span style={{fontSize:10,color:S.dm}}>{w.d}</span></div>);})}</>}
      <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1.5,margin:"12px 0 5px"}}>Exercises</div>
      {sess.ex.map((ex,i)=>{const idx=(sess.wu?.length||0)+i;const dn=dl2.exercises?.[idx]?.done;const ed=dl2.exercises?.[idx]||{};const isE=expEx===`${dk2}-${idx}`;
        return(<div key={i} style={{marginBottom:3,borderRadius:7,background:dn?"#10b98106":S.card,border:`1px solid ${dn?"#10b98112":S.bd}`,overflow:"hidden"}}>
          <div onClick={()=>toggle(dk2,idx)} style={{display:"flex",alignItems:"center",gap:7,padding:"7px 10px",cursor:"pointer"}}>
            <div style={{width:18,height:18,borderRadius:5,border:dn?"2px solid #10b981":"1.5px solid #2a2a2a",background:dn?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0,fontWeight:700}}>{dn&&"✓"}</div>
            <div style={{flex:1}}><div style={{fontSize:13,fontWeight:600,color:dn?"#444":S.tx,textDecoration:dn?"line-through":"none"}}>{ex.n}</div><div style={{fontSize:10,color:S.dm,marginTop:1}}>{ex.s>1?`${ex.s}×${ex.r}`:ex.r}{ex.te?` • ${ex.te}`:""}{ex.no?` • ${ex.no}`:""}</div></div>
            <div onClick={e=>{e.stopPropagation();setExpEx(isE?null:`${dk2}-${idx}`);}} style={{padding:"2px 7px",borderRadius:4,background:"#ffffff06",fontSize:9,color:S.dm,cursor:"pointer",fontWeight:700}}>{isE?"▲":"LOG"}</div>
          </div>
          {isE&&<div style={{padding:"0 10px 8px",display:"flex",gap:5,flexWrap:"wrap"}}>
            <input placeholder="Weight" value={ed.weight||""} onClick={e=>e.stopPropagation()} onChange={e=>updEx(dk2,idx,"weight",e.target.value)} style={{...inp,width:68,fontSize:12}}/>
            <input placeholder="Reps" value={ed.repsActual||""} onClick={e=>e.stopPropagation()} onChange={e=>updEx(dk2,idx,"repsActual",e.target.value)} style={{...inp,width:68,fontSize:12}}/>
            <input placeholder="Notes" value={ed.note||""} onClick={e=>e.stopPropagation()} onChange={e=>updEx(dk2,idx,"note",e.target.value)} style={{...inp,flex:1,minWidth:70,fontSize:12}}/>
          </div>}
        </div>);})}
      <div style={{marginTop:14,padding:12,borderRadius:7,background:S.card,border:`1px solid ${S.bd}`}}>
        <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:7}}>Session Log</div>
        <div style={{display:"flex",gap:7,flexWrap:"wrap",alignItems:"flex-end"}}>
          <div><label style={{fontSize:9,color:S.dm}}>RPE</label><input type="number" min="1" max="10" value={dl2.rpe||""} onChange={e=>updSess(dk2,"rpe",e.target.value)} style={{...inp,display:"block",width:55,marginTop:2,fontSize:12}}/></div>
          <div><label style={{fontSize:9,color:S.dm}}>Min</label><input type="number" value={dl2.duration||sess.d||""} onChange={e=>updSess(dk2,"duration",e.target.value)} style={{...inp,display:"block",width:62,marginTop:2,fontSize:12}}/></div>
          <div><label style={{fontSize:9,color:S.dm}}>Load</label><div style={{fontSize:16,fontWeight:800,color:S.ac,marginTop:2}}>{dl2.rpe&&dl2.duration?dl2.rpe*dl2.duration:dl2.rpe?dl2.rpe*(sess.d||60):"—"}</div></div>
        </div>
        <textarea placeholder="Notes — how did you feel?" value={dl2.notes||""} onChange={e=>updSess(dk2,"notes",e.target.value)} style={{...inp,width:"100%",marginTop:7,resize:"vertical",minHeight:36,boxSizing:"border-box",fontSize:12}}/>
      </div>
    </div>);
  };

  if(!loaded) return <div style={{minHeight:"100vh",background:S.bg,display:"flex",alignItems:"center",justifyContent:"center",color:S.dm,fontFamily:S.fn}}>Loading...</div>;

  /* ════════════════════════════════════════════════════════════════════════ */

  return(<div style={{minHeight:"100vh",background:S.bg,color:S.tx,fontFamily:S.fn}}>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet"/>
    <style>{`input::-webkit-outer-spin-button,input::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}input[type=number]{-moz-appearance:textfield;}`}</style>

    {/* Header */}
    <div style={{background:`linear-gradient(180deg,#0e0e0e,${S.bg})`,borderBottom:`1px solid ${S.bd}`,padding:"12px 14px 8px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:18,fontWeight:900,letterSpacing:2.5,background:`linear-gradient(135deg,${S.ac},#ddd)`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>TRAINING HQ</div>
          <div style={{fontSize:10,color:S.dm,marginTop:1}}>Phase {phase} • Wk {weekInPhase}{isDeload?" ⚡DELOAD":""} • <span style={{color:consistency>=80?"#10b981":consistency>=60?"#f59e0b":"#ef4444"}}>{consistency}% consistent</span></div>
        </div>
        <div style={{display:"flex",gap:6,alignItems:"center"}}>
          <select value={phase} onChange={e=>save({phase:+e.target.value})} style={{...inp,fontSize:11,padding:"4px 7px"}}>{PHASES.map(p=><option key={p.id} value={p.id}>Phase {p.id}</option>)}</select>
          <button onClick={()=>supabase.auth.signOut()} style={{background:"transparent",border:`1px solid ${S.bd}`,borderRadius:6,padding:"4px 8px",color:S.dm,fontSize:10,cursor:"pointer",fontWeight:600,whiteSpace:"nowrap"}}>Sign out</button>
        </div>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:2,marginTop:8}}>
        {[["today","Today"],["week","Week"],["insights","Insights"],["padel","Padel"],["body","Body"],["checkin","Check-in"],["phases","Phases"],["plan","Supps"]].map(([v,l])=>(
          <button key={v} onClick={()=>setView(v)} style={chip(view===v, v==="padel"?"#f59e0b":undefined)}>{v==="padel"?"🎾 "+l:l}</button>
        ))}
      </div>
    </div>

    <div style={{padding:"12px 14px",maxWidth:540,margin:"0 auto"}}>

      {/* ═══ TODAY ═══ */}
      {view==="today"&&todaySession&&(<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}><span style={{fontSize:12,color:S.dm}}>{today.toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</span><span style={{fontSize:12,fontWeight:700,color:S.ac}}>{pct}%</span></div>
        <div style={{height:3,background:S.bd,borderRadius:2,marginBottom:14,overflow:"hidden"}}><div style={{height:"100%",width:`${pct}%`,background:S.ac,borderRadius:2,transition:"width .3s"}}/></div>
        {renderSess(todaySession, todayKey)}
      </div>)}

      {/* ═══ WEEK ═══ */}
      {view==="week"&&(<div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
          {[["Sessions",weekStats.s,S.ac],["Avg RPE",weekStats.ar,"#e4e4e4"],["Load",weekStats.ld||"—","#f59e0b"]].map(([l,v,c],i)=>(
            <div key={i} style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:7,padding:"8px",textAlign:"center"}}><div style={{fontSize:20,fontWeight:800,color:c}}>{v}</div><div style={{fontSize:9,color:S.dm}}>{l}</div></div>
          ))}
        </div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
          <span style={{fontSize:11,color:S.dm,fontWeight:600}}>This Week</span>
          <button onClick={()=>setSwapMode(swapMode?null:"pick")} style={{...chip(!!swapMode,"#f59e0b"),padding:"3px 9px",fontSize:9}}>{swapMode&&swapMode!=="pick"?"TAP TO SWAP":swapMode==="pick"?"CANCEL":"↕ SWAP"}</button>
        </div>
        {weekDates.map((dk2,i)=>{const sess=getSession(dk2);const dl2=logs[dk2]||{};const isT=dk2===todayKey;const st=ST[sess.ty]||ST.custom;const eT=(sess.wu?.length||0)+(sess.ex?.length||0);const eD=Object.values(dl2.exercises||{}).filter(e=>e?.done).length;const isSS=swapMode===dk2;const isST2=swapMode&&swapMode!=="pick"&&swapMode!==dk2;
          return(<div key={dk2} style={{marginBottom:3}}>
            <div style={{display:"flex",alignItems:"center",gap:7,padding:"8px 10px",borderRadius:7,background:isSS?S.ac+"12":isT?S.ac+"06":S.card,border:`1px solid ${isSS?S.ac+"35":isT?S.ac+"18":S.bd}`,cursor:"pointer"}}
              onClick={()=>{if(swapMode&&swapMode!=="pick")handleSwap(dk2);else if(swapMode==="pick")setSwapMode(dk2);else setSelDay(selDay===dk2?null:dk2);}}>
              <span style={{fontSize:16}}>{st.i}</span>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:isT?S.ac:S.tx}}>{DOW[new Date(dk2+"T12:00:00").getDay()].slice(0,3)}{isT?" ←":""}</div><div style={{fontSize:10,color:S.dm}}>{sess.t}</div></div>
              {isST2&&<span style={{fontSize:9,color:"#f59e0b",fontWeight:700,background:"#f59e0b12",padding:"2px 6px",borderRadius:3}}>TAP</span>}
              {dl2.rpe&&<span style={{fontSize:10,color:S.dm,background:"#ffffff06",padding:"1px 5px",borderRadius:3}}>RPE {dl2.rpe}</span>}
              <span style={{fontSize:10,color:eD===eT&&eT>0?"#10b981":S.dm}}>{eD}/{eT}</span>
            </div>
            {selDay===dk2&&!swapMode&&<div style={{padding:"8px 0"}}>
              <div style={{display:"flex",gap:5,marginBottom:8}}>
                <button onClick={()=>{setModalDate(dk2);setShowModal(true);}} style={{...chip(false),border:`1px solid ${S.bd}`,borderRadius:5,padding:"4px 10px",fontSize:9}}>+ Custom</button>
                {overrides[dk2]&&<button onClick={()=>{const o={...overrides};delete o[dk2];save({ov:o});}} style={{...chip(false),border:"1px solid #ef444425",borderRadius:5,padding:"4px 10px",fontSize:9,color:"#ef4444"}}>Reset</button>}
              </div>
              {renderSess(sess,dk2)}
            </div>}
          </div>);})}
      </div>)}

      {/* ═══ INSIGHTS ═══ */}
      {view==="insights"&&(<div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Training Insights</div>

        {/* Consistency */}
        <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px",marginBottom:10,display:"flex",alignItems:"center",gap:14}}>
          <div style={{position:"relative",width:56,height:56,flexShrink:0}}>
            <svg width="56" height="56" viewBox="0 0 56 56"><circle cx="28" cy="28" r="24" fill="none" stroke={S.bd} strokeWidth="4"/><circle cx="28" cy="28" r="24" fill="none" stroke={consistency>=80?"#10b981":consistency>=60?"#f59e0b":"#ef4444"} strokeWidth="4" strokeDasharray={`${consistency*1.508} 200`} strokeLinecap="round" transform="rotate(-90 28 28)"/></svg>
            <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:14,fontWeight:800,color:S.tx}}>{consistency}%</div>
          </div>
          <div><div style={{fontSize:13,fontWeight:700}}>4-Week Consistency</div><div style={{fontSize:11,color:S.dm}}>Target ≥85%. {consistency>=85?"You're on track.":consistency>=70?"Close — keep showing up.":"Let's get more sessions in."}</div></div>
        </div>

        {weeklyHist.length>1?<>
          <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px",marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Weekly Training Load</div>
            <ResponsiveContainer width="100%" height={140}><AreaChart data={weeklyHist}><defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={S.ac} stopOpacity={.25}/><stop offset="100%" stopColor={S.ac} stopOpacity={0}/></linearGradient></defs><CartesianGrid strokeDasharray="3 3" stroke="#141414"/><XAxis dataKey="lb" tick={{fontSize:9,fill:S.dm}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:9,fill:S.dm}} axisLine={false} tickLine={false} width={35}/><Tooltip contentStyle={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:7,fontSize:11,color:S.tx}}/><Area type="monotone" dataKey="tl" stroke={S.ac} fill="url(#lg)" strokeWidth={2} name="Load (AU)"/></AreaChart></ResponsiveContainer>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:10}}>
            <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px"}}>
              <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Sessions/Week</div>
              <ResponsiveContainer width="100%" height={100}><BarChart data={weeklyHist}><XAxis dataKey="lb" tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false}/><YAxis hide domain={[0,7]}/><Tooltip contentStyle={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:7,fontSize:10,color:S.tx}}/><Bar dataKey="s" fill={S.ac} radius={[3,3,0,0]} name="Sessions"/></BarChart></ResponsiveContainer>
            </div>
            <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px"}}>
              <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Avg RPE Trend</div>
              <ResponsiveContainer width="100%" height={100}><LineChart data={weeklyHist}><XAxis dataKey="lb" tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false}/><YAxis hide domain={[0,10]}/><Tooltip contentStyle={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:7,fontSize:10,color:S.tx}}/><Line type="monotone" dataKey="ar" stroke="#f59e0b" strokeWidth={2} dot={{r:2,fill:"#f59e0b"}} name="Avg RPE"/></LineChart></ResponsiveContainer>
            </div>
          </div>
        </>:<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"24px 16px",textAlign:"center",color:S.dm,marginBottom:10}}><div style={{fontSize:24,marginBottom:6}}>📊</div><div style={{fontSize:13,fontWeight:600,color:S.tx,marginBottom:3}}>Log sessions to see trends</div><div style={{fontSize:11}}>RPE + duration needed. Charts appear after 2+ weeks.</div></div>}

        {/* Exercise progression */}
        <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,margin:"14px 0 6px"}}>Exercise Progression</div>
        {Object.keys(liftHistory).length>0 ? Object.entries(liftHistory).map(([name,entries])=>(
          <div key={name} style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 12px",marginBottom:6}}>
            <div style={{fontSize:12,fontWeight:600,marginBottom:6}}>{name}</div>
            <ResponsiveContainer width="100%" height={80}><LineChart data={entries}><XAxis dataKey="date" tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false} width={30}/><Tooltip contentStyle={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:7,fontSize:10,color:S.tx}}/><Line type="monotone" dataKey="weight" stroke={S.ac} strokeWidth={2} dot={{r:2}} name="Weight"/></LineChart></ResponsiveContainer>
          </div>
        )) : <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"16px",textAlign:"center",color:S.dm,fontSize:11}}>Log weights via the "LOG" button on exercises. Progression charts will appear here for key lifts.</div>}

        {histData.length>0&&<><div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,margin:"14px 0 6px"}}>Recent Sessions</div>
          {histData.slice(-10).reverse().map((e,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:2,borderRadius:5,background:S.card,border:`1px solid ${S.bd}`}}><span style={{fontSize:11,color:S.dm,width:48,flexShrink:0}}>{new Date(e.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span><div style={{flex:1}}><span style={{fontSize:12}}>RPE {e.rpe}</span><span style={{fontSize:10,color:S.dm,marginLeft:6}}>{e.dur}m</span></div><span style={{fontSize:12,fontWeight:700,color:S.ac}}>{e.load}</span></div>))}
        </>}
      </div>)}

      {/* ═══ BODY ═══ */}
      {view==="body"&&(<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:700}}>Body Composition</div>
          <button onClick={()=>{setIbForm({date:todayKey});setShowInbodyForm(true);}} style={{background:S.ac,color:"#000",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ InBody Scan</button>
        </div>

        {inbody.length>0?<>
          {/* Latest scan card */}
          {(()=>{const latest=inbody[inbody.length-1];const prev=inbody.length>1?inbody[inbody.length-2]:null;
            return(<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"14px",marginBottom:10}}>
              <div style={{fontSize:10,color:S.dm,marginBottom:8}}>Latest: {new Date(latest.date+"T12:00:00").toLocaleDateString("en-US",{month:"long",day:"numeric",year:"numeric"})}</div>
              <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                {INBODY_FIELDS.filter(f=>latest[f.k]).map(f=>{const diff=prev&&prev[f.k]?(latest[f.k]-prev[f.k]).toFixed(1):null;
                  return(<div key={f.k} style={{background:"#ffffff04",borderRadius:6,padding:"8px",textAlign:"center"}}>
                    <div style={{fontSize:16,fontWeight:800,color:S.tx}}>{latest[f.k]}<span style={{fontSize:10,color:S.dm,marginLeft:2}}>{f.u}</span></div>
                    <div style={{fontSize:9,color:S.dm}}>{f.l}</div>
                    {diff&&<div style={{fontSize:10,fontWeight:600,color:+diff>0?(f.k==="smm"||f.k==="tbw"?"#10b981":"#ef4444"):(f.k==="smm"||f.k==="tbw"?"#ef4444":"#10b981"),marginTop:2}}>{+diff>0?"+":""}{diff}{f.u}</div>}
                  </div>);
                })}
              </div>
            </div>);})()}

          {/* Trends */}
          {inbody.length>1&&<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px",marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Body Composition Trend</div>
            <ResponsiveContainer width="100%" height={160}><LineChart data={inbody}>
              <CartesianGrid strokeDasharray="3 3" stroke="#141414"/><XAxis dataKey="date" tick={{fontSize:8,fill:S.dm}} tickFormatter={v=>v.slice(5)} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false} width={30}/>
              <Tooltip contentStyle={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:7,fontSize:10,color:S.tx}}/>
              {inbody[0]?.smm&&<Line type="monotone" dataKey="smm" stroke="#10b981" strokeWidth={2} dot={{r:2}} name="SMM (kg)"/>}
              {inbody[0]?.bfp&&<Line type="monotone" dataKey="bfp" stroke="#ef4444" strokeWidth={2} dot={{r:2}} name="BF%"/>}
              {inbody[0]?.weight&&<Line type="monotone" dataKey="weight" stroke="#3b82f6" strokeWidth={2} dot={{r:2}} name="Weight (kg)"/>}
            </LineChart></ResponsiveContainer>
          </div>}

          {/* All scans */}
          <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>All Scans</div>
          {[...inbody].reverse().map((scan,i)=>(<div key={i} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 10px",marginBottom:3,borderRadius:6,background:S.card,border:`1px solid ${S.bd}`}}>
            <span style={{fontSize:11,color:S.dm,width:70,flexShrink:0}}>{new Date(scan.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"2-digit"})}</span>
            <span style={{fontSize:11,flex:1}}>{scan.weight?`${scan.weight}kg`:""}{scan.smm?` • SMM ${scan.smm}`:""}{scan.bfp?` • BF ${scan.bfp}%`:""}</span>
            <button onClick={()=>{const nb=[...inbody];nb.splice(inbody.length-1-i,1);save({ib:nb});}} style={{background:"transparent",border:"none",color:"#ef4444",fontSize:10,cursor:"pointer",padding:2}}>✕</button>
          </div>))}
        </>:<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"24px 16px",textAlign:"center",color:S.dm}}>
          <div style={{fontSize:24,marginBottom:6}}>📏</div><div style={{fontSize:13,fontWeight:600,color:S.tx,marginBottom:3}}>No InBody scans yet</div><div style={{fontSize:11}}>Add your first monthly scan to track body composition changes.</div>
        </div>}

        {/* Pain Tracker */}
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"20px 0 10px"}}>
          <div style={{fontSize:15,fontWeight:700}}>Pain & Discomfort</div>
          <button onClick={()=>{setPfAreas({});setShowPainForm(true);}} style={{background:"#ef4444",color:"#fff",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Log Pain</button>
        </div>

        {painTrend.length>1&&<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px",marginBottom:10}}>
          <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Pain Trend (avg & max)</div>
          <ResponsiveContainer width="100%" height={100}><LineChart data={painTrend}><CartesianGrid strokeDasharray="3 3" stroke="#141414"/><XAxis dataKey="lb" tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false}/><YAxis domain={[0,5]} tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false} width={20}/><Tooltip contentStyle={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:7,fontSize:10,color:S.tx}}/><Line type="monotone" dataKey="avg" stroke="#f59e0b" strokeWidth={2} dot={{r:2}} name="Avg"/><Line type="monotone" dataKey="max" stroke="#ef4444" strokeWidth={2} dot={{r:2}} name="Max"/></LineChart></ResponsiveContainer>
        </div>}

        {Object.entries(painLog).filter(([k])=>k.match(/^\d{4}/)).length>0&&<>
          <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>Recent Entries</div>
          {Object.entries(painLog).filter(([k])=>k.match(/^\d{4}/)).sort((a,b)=>b[0].localeCompare(a[0])).slice(0,10).map(([date,areas])=>(
            <div key={date} style={{padding:"7px 10px",marginBottom:3,borderRadius:6,background:S.card,border:`1px solid ${S.bd}`}}>
              <div style={{fontSize:10,color:S.dm,marginBottom:3}}>{new Date(date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
              <div style={{display:"flex",gap:4,flexWrap:"wrap"}}>{Object.entries(areas).filter(([_,v])=>typeof v==="number"&&v>0).map(([area,val])=>(
                <span key={area} style={{padding:"2px 7px",borderRadius:4,fontSize:10,fontWeight:600,background:val>=4?"#ef444418":val>=2?"#f59e0b15":"#10b98110",color:val>=4?"#ef4444":val>=2?"#f59e0b":"#10b981"}}>{area} {val}/5</span>
              ))}</div>
            </div>
          ))}</>}
      </div>)}

      {/* ═══ CHECK-IN ═══ */}
      {view==="checkin"&&(<div>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
          <div style={{fontSize:15,fontWeight:700}}>Weekly Check-in</div>
          <button onClick={()=>{setCiForm({energy:3,sleep:3,motivation:3,pain:"",win:""});setShowCheckinForm(true);}} style={{background:S.ac,color:"#000",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ This Week</button>
        </div>

        {Object.keys(checkins).length>0?<>
          {/* Radar of latest */}
          {(()=>{const keys=Object.keys(checkins).sort();const latest=checkins[keys[keys.length-1]];if(!latest)return null;
            const radar=[{sub:"Energy",v:latest.energy},{sub:"Sleep",v:latest.sleep},{sub:"Motivation",v:latest.motivation}];
            return(<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px",marginBottom:10}}>
              <div style={{fontSize:10,color:S.dm,marginBottom:4}}>Week of {keys[keys.length-1]}</div>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <ResponsiveContainer width={140} height={120}><RadarChart data={radar}><PolarGrid stroke="#1a1a1a"/><PolarAngleAxis dataKey="sub" tick={{fontSize:9,fill:S.dm}}/><Radar dataKey="v" stroke={S.ac} fill={S.ac} fillOpacity={.15} strokeWidth={2}/></RadarChart></ResponsiveContainer>
                <div style={{flex:1}}>
                  {latest.pain&&<div style={{fontSize:11,color:"#f59e0b",marginBottom:4}}>Pain: {latest.pain}</div>}
                  {latest.win&&<div style={{fontSize:12,color:S.tx}}>🏆 {latest.win}</div>}
                </div>
              </div>
            </div>);})()}

          {/* Trend */}
          {Object.keys(checkins).length>1&&<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px",marginBottom:10}}>
            <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Wellbeing Trend</div>
            <ResponsiveContainer width="100%" height={120}><LineChart data={Object.entries(checkins).sort((a,b)=>a[0].localeCompare(b[0])).slice(-12).map(([k,v])=>({wk:k.slice(5),...v}))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#141414"/><XAxis dataKey="wk" tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false}/><YAxis domain={[0,5]} tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false} width={20}/><Tooltip contentStyle={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:7,fontSize:10,color:S.tx}}/>
              <Line type="monotone" dataKey="energy" stroke="#10b981" strokeWidth={2} dot={{r:2}} name="Energy"/>
              <Line type="monotone" dataKey="sleep" stroke="#3b82f6" strokeWidth={2} dot={{r:2}} name="Sleep"/>
              <Line type="monotone" dataKey="motivation" stroke="#f59e0b" strokeWidth={2} dot={{r:2}} name="Motivation"/>
            </LineChart></ResponsiveContainer>
          </div>}

          {/* History */}
          <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:6}}>All Check-ins</div>
          {Object.entries(checkins).sort((a,b)=>b[0].localeCompare(a[0])).map(([wk,ci])=>(
            <div key={wk} style={{padding:"8px 10px",marginBottom:3,borderRadius:6,background:S.card,border:`1px solid ${S.bd}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}><span style={{fontSize:10,color:S.dm}}>Wk {wk}</span>
                <div style={{display:"flex",gap:6}}>{[["⚡",ci.energy],["😴",ci.sleep],["🔥",ci.motivation]].map(([e,v],i)=><span key={i} style={{fontSize:10}}>{e}{v}/5</span>)}</div>
              </div>
              {ci.pain&&<div style={{fontSize:10,color:"#f59e0b"}}>Pain: {ci.pain}</div>}
              {ci.win&&<div style={{fontSize:11,color:S.tx,marginTop:2}}>🏆 {ci.win}</div>}
            </div>
          ))}
        </>:<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"24px 16px",textAlign:"center",color:S.dm}}><div style={{fontSize:24,marginBottom:6}}>📋</div><div style={{fontSize:13,fontWeight:600,color:S.tx,marginBottom:3}}>No check-ins yet</div><div style={{fontSize:11}}>Do a quick weekly pulse check every Sunday — 30 seconds to track how you're feeling.</div></div>}
      </div>)}

      {/* ═══ PHASES ═══ */}
      {view==="phases"&&(<div>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Phase Progression</div>
        {PHASES.map(p=>{const act=p.id===phase;const ec=exitChecked[p.id]||{};const met=p.exit.filter((_,i)=>ec[i]).length;const pctE=Math.round((met/p.exit.length)*100);
          return(<div key={p.id} style={{marginBottom:8,borderRadius:9,background:act?p.c+"06":S.card,border:`1px solid ${act?p.c+"20":S.bd}`,padding:"12px 14px"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:5}}>
              <div><span style={{fontSize:9,fontWeight:700,color:p.c,textTransform:"uppercase",letterSpacing:1}}>Phase {p.id} • {p.wk}</span><div style={{fontSize:14,fontWeight:700,marginTop:1}}>{p.name}</div></div>
              <div style={{textAlign:"right"}}>{act&&<span style={{background:p.c,color:"#000",fontSize:8,fontWeight:800,padding:"2px 7px",borderRadius:10,textTransform:"uppercase"}}>Active</span>}
                <div style={{fontSize:10,color:pctE===100?"#10b981":S.dm,marginTop:3}}>{met}/{p.exit.length} criteria</div></div>
            </div>
            <div style={{fontSize:11,color:S.dm,marginBottom:8}}>{p.desc}</div>
            {act&&<div style={{height:3,background:S.bd,borderRadius:2,marginBottom:8,overflow:"hidden"}}><div style={{height:"100%",width:`${pctE}%`,background:p.c,transition:"width .3s"}}/></div>}
            {p.exit.map((c,i)=>(
              <div key={i} onClick={()=>{const ne={...exitChecked,[p.id]:{...(exitChecked[p.id]||{}),[i]:!ec[i]}};save({ec:ne});}} style={{display:"flex",alignItems:"center",gap:7,padding:"4px 0",cursor:"pointer"}}>
                <div style={{width:16,height:16,borderRadius:4,border:ec[i]?`2px solid ${p.c}`:"1.5px solid #2a2a2a",background:ec[i]?p.c:"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0}}>{ec[i]&&"✓"}</div>
                <span style={{fontSize:11,color:ec[i]?"#777":S.tx,textDecoration:ec[i]?"line-through":"none"}}>{c}</span>
              </div>
            ))}
          </div>);
        })}
      </div>)}

      {/* ═══ SUPPS ═══ */}
      {view==="plan"&&(()=>{
        // Compute supplement streak & weekly stats
        const suppStats = (()=>{
          let streak=0, weekDays=0, weekComplete=0, monthDays=0, monthComplete=0;
          // Streak: count backwards from yesterday (today still in progress)
          for(let d=1;d<=90;d++){
            const dt=new Date(today);dt.setDate(today.getDate()-d);const k=dk(dt);
            const allTaken=SUPPS.every((_,i)=>logs[`${k}-s-${i}`]);
            if(allTaken)streak++;else break;
          }
          // If today is all done, add it
          if(SUPPS.every((_,i)=>logs[`${todayKey}-s-${i}`]))streak++;
          // 7-day
          for(let d=0;d<7;d++){
            const dt=new Date(today);dt.setDate(today.getDate()-d);const k=dk(dt);
            weekDays++;
            if(SUPPS.every((_,i)=>logs[`${k}-s-${i}`]))weekComplete++;
          }
          // 30-day
          for(let d=0;d<30;d++){
            const dt=new Date(today);dt.setDate(today.getDate()-d);const k=dk(dt);
            monthDays++;
            if(SUPPS.every((_,i)=>logs[`${k}-s-${i}`]))monthComplete++;
          }
          return { streak, weekComplete, weekDays, monthComplete, monthDays };
        })();
        const recovStats = (()=>{
          let weekDays=0,weekComplete=0;
          for(let d=0;d<7;d++){
            const dt=new Date(today);dt.setDate(today.getDate()-d);const k=dk(dt);
            weekDays++;
            if(RECOV.every((_,i)=>logs[`${k}-r-${i}`]))weekComplete++;
          }
          return { weekComplete, weekDays };
        })();
        const todaySupDone = SUPPS.filter((_,i)=>logs[`${todayKey}-s-${i}`]).length;
        const todayRecDone = RECOV.filter((_,i)=>logs[`${todayKey}-r-${i}`]).length;

        return(<div>
          {/* Streak & Stats */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
            <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:suppStats.streak>0?"#10b981":S.dm}}>{suppStats.streak}</div>
              <div style={{fontSize:9,color:S.dm}}>Day Streak 🔥</div>
            </div>
            <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:suppStats.weekComplete>=6?"#10b981":suppStats.weekComplete>=4?"#f59e0b":"#ef4444"}}>{suppStats.weekComplete}/7</div>
              <div style={{fontSize:9,color:S.dm}}>This Week</div>
            </div>
            <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
              <div style={{fontSize:22,fontWeight:800,color:suppStats.monthComplete>=25?"#10b981":suppStats.monthComplete>=20?"#f59e0b":"#ef4444"}}>{suppStats.monthComplete}/30</div>
              <div style={{fontSize:9,color:S.dm}}>Last 30 Days</div>
            </div>
          </div>

          {/* 7-day dots */}
          <div style={{display:"flex",gap:4,justifyContent:"center",marginBottom:16}}>
            {Array.from({length:7},(_,d)=>{
              const dt=new Date(today);dt.setDate(today.getDate()-(6-d));const k=dk(dt);
              const allDone=SUPPS.every((_2,i)=>logs[`${k}-s-${i}`]);
              const isToday=k===todayKey;
              return(<div key={d} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:3}}>
                <div style={{width:28,height:28,borderRadius:7,background:allDone?"#10b981":isToday?S.ac+"15":"#ffffff06",border:`1.5px solid ${allDone?"#10b981":isToday?S.ac+"40":"#1a1a1a"}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:allDone?"#fff":S.dm,fontWeight:700}}>{allDone?"✓":""}</div>
                <span style={{fontSize:8,color:isToday?S.ac:S.dm}}>{DOW[dt.getDay()].slice(0,2)}</span>
              </div>);
            })}
          </div>

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8}}>
            <div style={{fontSize:15,fontWeight:700}}>Daily Supplements</div>
            <span style={{fontSize:11,color:todaySupDone===SUPPS.length?"#10b981":S.dm,fontWeight:600}}>{todaySupDone}/{SUPPS.length} today</span>
          </div>
          {SUPPS.map((s,i)=>{const k=`${todayKey}-s-${i}`,tk=logs[k];
            return(<div key={i} onClick={()=>save({logs:{...logs,[k]:!tk}})} style={{display:"flex",alignItems:"center",gap:8,padding:"8px 10px",marginBottom:3,borderRadius:7,background:tk?"#10b98106":S.card,border:`1px solid ${tk?"#10b98112":S.bd}`,cursor:"pointer"}}>
              <div style={{width:18,height:18,borderRadius:5,border:tk?"2px solid #10b981":"1.5px solid #2a2a2a",background:tk?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,color:"#fff",flexShrink:0}}>{tk&&"✓"}</div>
              <div style={{flex:1}}><div style={{fontSize:12,fontWeight:600,color:tk?"#444":S.tx}}>{s.n}</div><div style={{fontSize:10,color:S.dm}}>{s.d} • {s.t}</div></div>
            </div>);
          })}

          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",margin:"18px 0 8px"}}>
            <div style={{fontSize:15,fontWeight:700}}>Recovery</div>
            <span style={{fontSize:11,color:todayRecDone===RECOV.length?"#3b82f6":S.dm,fontWeight:600}}>{todayRecDone}/{RECOV.length} today{recovStats.weekComplete>0?` • ${recovStats.weekComplete}/7 this week`:""}</span>
          </div>
          {RECOV.map((item,i)=>{const k=`${todayKey}-r-${i}`,done=logs[k];
            return(<div key={i} onClick={()=>save({logs:{...logs,[k]:!done}})} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 10px",marginBottom:2,borderRadius:5,background:done?"#3b82f606":"transparent",cursor:"pointer"}}>
              <div style={{width:16,height:16,borderRadius:4,border:done?"2px solid #3b82f6":"1.5px solid #2a2a2a",background:done?"#3b82f6":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:9,color:"#fff",flexShrink:0}}>{done&&"✓"}</div>
              <span style={{fontSize:11,color:done?S.dm:S.tx}}>{item}</span>
            </div>);
          })}
        </div>);
      })()}
    {/* ═══ PADEL ═══ */}
      {view==="padel"&&(()=>{
        const pc = "#f59e0b";
        const matches = padel.matches||[];
        const shots = padel.shots||{};
        const focus = padel.focus||{};
        const videos = padel.videos||[];
        const tournaments = padel.tournaments||[];
        const winRate = matches.length>0 ? Math.round(matches.filter(m=>m.result==="W").length/matches.length*100) : 0;
        const last10 = matches.slice(-10);
        const last10W = last10.filter(m=>m.result==="W").length;

        // Shot trend data
        const shotDates = Object.keys(shots).sort();
        const shotTrend = shotDates.map(d => {const s=shots[d]; return { date:d.slice(5), ...s };});

        // Tactical principle avg from recent matches
        const recentWithTP = matches.filter(m=>m.principles).slice(-5);
        const tpAvg = TACTICAL_PRINCIPLES.map((p,i)=>{
          const vals = recentWithTP.map(m=>(m.principles||{})[i]).filter(v=>v!==undefined);
          return { principle: p.length>25?p.slice(0,25)+"…":p, avg: vals.length?(vals.reduce((a,b)=>a+b,0)/vals.length).toFixed(1):0 };
        });

        return(<div>
          {/* Sub-nav */}
          <div style={{display:"flex",gap:3,marginBottom:14,overflowX:"auto"}}>
            {[["matches","Matches"],["shots","Shots"],["focus","Focus"],["video","Video"],["results","Results"]].map(([v,l])=>(
              <button key={v} onClick={()=>setPadelView(v)} style={{padding:"6px 12px",borderRadius:6,border:`1px solid ${padelView===v?pc+"40":S.bd}`,background:padelView===v?pc+"12":"transparent",color:padelView===v?pc:S.dm,fontSize:11,fontWeight:700,cursor:"pointer",whiteSpace:"nowrap"}}>{l}</button>
            ))}
          </div>

          {/* ── MATCHES ── */}
          {padelView==="matches"&&(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:15,fontWeight:700}}>Match Log</div>
              <button onClick={()=>{setMatchForm({date:todayKey,result:"W",oppLevel:"intermediate",score:"",tacticalFocus:"",learned:"",principles:{}});setShowMatchForm(true);}} style={{background:pc,color:"#000",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Log Match</button>
            </div>

            {/* Stats */}
            {matches.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
              <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:800,color:pc}}>{matches.length}</div>
                <div style={{fontSize:9,color:S.dm}}>Matches</div>
              </div>
              <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:800,color:winRate>=60?"#10b981":winRate>=40?pc:"#ef4444"}}>{winRate}%</div>
                <div style={{fontSize:9,color:S.dm}}>Win Rate</div>
              </div>
              <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:800,color:S.tx}}>{last10W}/{last10.length}</div>
                <div style={{fontSize:9,color:S.dm}}>Last 10</div>
              </div>
            </div>}

            {/* Tactical radar from recent matches */}
            {recentWithTP.length>0&&<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px",marginBottom:12}}>
              <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Tactical Self-Assessment (Last 5 Matches Avg)</div>
              <ResponsiveContainer width="100%" height={200}><RadarChart data={tpAvg}><PolarGrid stroke="#1a1a1a"/><PolarAngleAxis dataKey="principle" tick={{fontSize:7,fill:S.dm}}/><Radar dataKey="avg" stroke={pc} fill={pc} fillOpacity={.15} strokeWidth={2}/></RadarChart></ResponsiveContainer>
            </div>}

            {/* Match list */}
            {matches.length>0?[...matches].reverse().map((m,i)=>(
              <div key={i} style={{padding:"10px 12px",marginBottom:4,borderRadius:8,background:S.card,border:`1px solid ${S.bd}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div style={{display:"flex",gap:6,alignItems:"center"}}>
                    <span style={{width:28,height:28,borderRadius:7,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,background:m.result==="W"?"#10b98115":"#ef444415",color:m.result==="W"?"#10b981":"#ef4444"}}>{m.result}</span>
                    <div>
                      <div style={{fontSize:12,fontWeight:600,color:S.tx}}>{m.score||"No score"}</div>
                      <div style={{fontSize:10,color:S.dm}}>vs {m.oppLevel} • {new Date(m.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                    </div>
                  </div>
                  <button onClick={()=>{const nm=[...matches];nm.splice(matches.length-1-i,1);save({padel:{...padel,matches:nm}});}} style={{background:"transparent",border:"none",color:"#ef4444",fontSize:10,cursor:"pointer"}}>✕</button>
                </div>
                {m.tacticalFocus&&<div style={{fontSize:10,color:pc,marginBottom:2}}>Focus: {m.tacticalFocus}</div>}
                {m.learned&&<div style={{fontSize:11,color:S.dm}}>💡 {m.learned}</div>}
              </div>
            )):<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"24px 16px",textAlign:"center",color:S.dm}}><div style={{fontSize:24,marginBottom:6}}>🎾</div><div style={{fontSize:13,fontWeight:600,color:S.tx,marginBottom:3}}>No matches logged yet</div><div style={{fontSize:11}}>Log your first match to start tracking progress.</div></div>}
          </div>)}

          {/* ── SHOTS ── */}
          {padelView==="shots"&&(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:15,fontWeight:700}}>Shot Development</div>
              <button onClick={()=>{const init={};PADEL_SHOTS.forEach(s=>{init[s.k]=3;});setShotForm({date:todayKey,...init});setShowShotForm(true);}} style={{background:pc,color:"#000",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Monthly Rating</button>
            </div>

            {/* Latest ratings */}
            {shotDates.length>0&&(()=>{const latest=shots[shotDates[shotDates.length-1]];const prev=shotDates.length>1?shots[shotDates[shotDates.length-2]]:null;
              return(<div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:6,marginBottom:14}}>
                {PADEL_SHOTS.map(s=>{const val=latest?.[s.k]||0;const prevVal=prev?.[s.k];const diff=prevVal!==undefined?(val-prevVal):null;
                  return(<div key={s.k} style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px"}}>
                    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                      <div style={{fontSize:13,fontWeight:600,color:S.tx}}>{s.l}</div>
                      <div style={{fontSize:18,fontWeight:800,color:val>=4?"#10b981":val>=3?pc:"#ef4444"}}>{val}/5</div>
                    </div>
                    <div style={{fontSize:9,color:S.dm,marginTop:2}}>{s.d}</div>
                    {diff!==null&&diff!==0&&<div style={{fontSize:10,fontWeight:600,color:diff>0?"#10b981":"#ef4444",marginTop:3}}>{diff>0?"+":""}{diff} from previous</div>}
                  </div>);
                })}
              </div>);
            })()}

            {/* Trend chart */}
            {shotTrend.length>1&&<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"12px",marginBottom:12}}>
              <div style={{fontSize:9,fontWeight:700,color:S.dm,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Shot Development Trend</div>
              <ResponsiveContainer width="100%" height={160}><LineChart data={shotTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#141414"/><XAxis dataKey="date" tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false}/><YAxis domain={[0,5]} tick={{fontSize:8,fill:S.dm}} axisLine={false} tickLine={false} width={20}/><Tooltip contentStyle={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:7,fontSize:10,color:S.tx}}/>
                {PADEL_SHOTS.map((s,i)=>{const colors=["#10b981","#3b82f6","#f59e0b","#ef4444","#a855f7","#06b6d4"];return <Line key={s.k} type="monotone" dataKey={s.k} stroke={colors[i]} strokeWidth={2} dot={{r:2}} name={s.l}/>;
                })}
              </LineChart></ResponsiveContainer>
            </div>}

            {shotDates.length===0&&<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"24px 16px",textAlign:"center",color:S.dm}}><div style={{fontSize:24,marginBottom:6}}>📊</div><div style={{fontSize:13,fontWeight:600,color:S.tx,marginBottom:3}}>No shot ratings yet</div><div style={{fontSize:11}}>Rate your 6 key shots monthly to track development.</div></div>}
          </div>)}

          {/* ── FOCUS ── */}
          {padelView==="focus"&&(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:15,fontWeight:700}}>Weekly Tactical Focus</div>
              <button onClick={()=>{setFocusForm({area:"",week:dk(ws(today)),notes:"",executed:false,rating:3});setShowFocusForm(true);}} style={{background:pc,color:"#000",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ This Week</button>
            </div>

            {Object.keys(focus).length>0?Object.entries(focus).sort((a,b)=>b[0].localeCompare(a[0])).map(([wk,f])=>(
              <div key={wk} style={{padding:"12px 14px",marginBottom:6,borderRadius:8,background:S.card,border:`1px solid ${S.bd}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                  <span style={{fontSize:10,color:S.dm}}>Week of {new Date(wk+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</span>
                  <div style={{display:"flex",alignItems:"center",gap:4}}>
                    {f.executed&&<span style={{fontSize:9,color:"#10b981",background:"#10b98112",padding:"2px 6px",borderRadius:4,fontWeight:700}}>EXECUTED</span>}
                    <span style={{fontSize:11,fontWeight:700,color:pc}}>{f.rating}/5</span>
                  </div>
                </div>
                <div style={{fontSize:13,fontWeight:600,color:pc,marginBottom:3}}>🎯 {f.area}</div>
                {f.notes&&<div style={{fontSize:11,color:S.dm}}>{f.notes}</div>}
              </div>
            )):<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"24px 16px",textAlign:"center",color:S.dm}}><div style={{fontSize:24,marginBottom:6}}>🎯</div><div style={{fontSize:13,fontWeight:600,color:S.tx,marginBottom:3}}>No focus weeks logged</div><div style={{fontSize:11}}>Pick one tactical area to focus on each week.</div></div>}
          </div>)}

          {/* ── VIDEO ── */}
          {padelView==="video"&&(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:15,fontWeight:700}}>Video Study Log</div>
              <button onClick={()=>{setVideoForm({date:todayKey,type:"pro",title:"",takeaways:"",apply:""});setShowVideoForm(true);}} style={{background:pc,color:"#000",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Log Study</button>
            </div>

            {/* Stats */}
            {videos.length>0&&<div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6,marginBottom:14}}>
              <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:pc}}>{videos.length}</div><div style={{fontSize:9,color:S.dm}}>Sessions</div></div>
              <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:S.tx}}>{videos.filter(v=>v.type==="pro").length}</div><div style={{fontSize:9,color:S.dm}}>Pro Matches</div></div>
              <div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:8,padding:"10px 8px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:"#3b82f6"}}>{videos.filter(v=>v.type==="own").length}</div><div style={{fontSize:9,color:S.dm}}>Own Footage</div></div>
            </div>}

            {videos.length>0?[...videos].reverse().map((v,i)=>(
              <div key={i} style={{padding:"10px 12px",marginBottom:4,borderRadius:8,background:S.card,border:`1px solid ${S.bd}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div>
                    <div style={{fontSize:12,fontWeight:600,color:S.tx}}>{v.title||"Untitled"}</div>
                    <div style={{fontSize:10,color:S.dm}}>{v.type==="pro"?"🎬 Pro match":v.type==="own"?"📱 Own footage":"📺 Tutorial"} • {new Date(v.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric"})}</div>
                  </div>
                  <button onClick={()=>{const nv=[...videos];nv.splice(videos.length-1-i,1);save({padel:{...padel,videos:nv}});}} style={{background:"transparent",border:"none",color:"#ef4444",fontSize:10,cursor:"pointer"}}>✕</button>
                </div>
                {v.takeaways&&<div style={{fontSize:11,color:pc,marginTop:3}}>💡 {v.takeaways}</div>}
                {v.apply&&<div style={{fontSize:11,color:S.dm,marginTop:2}}>→ Apply: {v.apply}</div>}
              </div>
            )):<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"24px 16px",textAlign:"center",color:S.dm}}><div style={{fontSize:24,marginBottom:6}}>🎬</div><div style={{fontSize:13,fontWeight:600,color:S.tx,marginBottom:3}}>No video studies logged</div><div style={{fontSize:11}}>Study Galán, Tapia, or your own matches weekly.</div></div>}
          </div>)}

          {/* ── RESULTS ── */}
          {padelView==="results"&&(<div>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <div style={{fontSize:15,fontWeight:700}}>SNPL / Tournaments</div>
              <button onClick={()=>{setTournForm({date:todayKey,name:"",division:"",result:"",partner:"",notes:""});setShowTournForm(true);}} style={{background:pc,color:"#000",border:"none",borderRadius:6,padding:"6px 14px",fontSize:11,fontWeight:700,cursor:"pointer"}}>+ Add Result</button>
            </div>

            {tournaments.length>0?[...tournaments].reverse().map((t,i)=>(
              <div key={i} style={{padding:"12px 14px",marginBottom:6,borderRadius:8,background:S.card,border:`1px solid ${S.bd}`}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:4}}>
                  <div>
                    <div style={{fontSize:13,fontWeight:700,color:S.tx}}>{t.name}</div>
                    <div style={{fontSize:10,color:S.dm}}>{t.division} • {new Date(t.date+"T12:00:00").toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})}</div>
                  </div>
                  <button onClick={()=>{const nt=[...tournaments];nt.splice(tournaments.length-1-i,1);save({padel:{...padel,tournaments:nt}});}} style={{background:"transparent",border:"none",color:"#ef4444",fontSize:10,cursor:"pointer"}}>✕</button>
                </div>
                <div style={{fontSize:14,fontWeight:700,color:pc,marginBottom:2}}>{t.result}</div>
                {t.partner&&<div style={{fontSize:10,color:S.dm}}>Partner: {t.partner}</div>}
                {t.notes&&<div style={{fontSize:11,color:S.dm,marginTop:3}}>{t.notes}</div>}
              </div>
            )):<div style={{background:S.card,border:`1px solid ${S.bd}`,borderRadius:9,padding:"24px 16px",textAlign:"center",color:S.dm}}><div style={{fontSize:24,marginBottom:6}}>🏆</div><div style={{fontSize:13,fontWeight:600,color:S.tx,marginBottom:3}}>No tournament results yet</div><div style={{fontSize:11}}>Join the SNPL and start logging results.</div></div>}
          </div>)}
        </div>);
      })()}
    </div>

    {/* ══ MODALS ══════════════════════════════════════════════════════════ */}

    {/* ── Padel Match Form ── */}
    {showMatchForm&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowMatchForm(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:400,maxHeight:"85vh",overflow:"auto"}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Log Match</div>
        <div style={{display:"flex",gap:8,marginBottom:10}}>
          <div style={{flex:1}}><label style={{fontSize:10,color:S.dm}}>Date</label><input type="date" value={matchForm.date||todayKey} onChange={e=>setMatchForm({...matchForm,date:e.target.value})} style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
          <div><label style={{fontSize:10,color:S.dm}}>Result</label><div style={{display:"flex",gap:3,marginTop:3}}>{["W","L"].map(r=>(<button key={r} onClick={()=>setMatchForm({...matchForm,result:r})} style={{padding:"7px 16px",borderRadius:6,border:`1px solid ${matchForm.result===r?(r==="W"?"#10b981":"#ef4444")+"40":S.bd}`,background:matchForm.result===r?(r==="W"?"#10b981":"#ef4444")+"12":"transparent",color:matchForm.result===r?(r==="W"?"#10b981":"#ef4444"):S.dm,fontSize:13,fontWeight:700,cursor:"pointer"}}>{r}</button>))}</div></div>
        </div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Score</label><input value={matchForm.score||""} onChange={e=>setMatchForm({...matchForm,score:e.target.value})} placeholder="e.g. 6-3 6-4" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Opponent Level</label>
          <div style={{display:"flex",gap:3,marginTop:3,flexWrap:"wrap"}}>{["beginner","intermediate","advanced","strong"].map(l=>(<button key={l} onClick={()=>setMatchForm({...matchForm,oppLevel:l})} style={{padding:"5px 10px",borderRadius:5,border:`1px solid ${matchForm.oppLevel===l?"#f59e0b40":S.bd}`,background:matchForm.oppLevel===l?"#f59e0b12":"transparent",color:matchForm.oppLevel===l?"#f59e0b":S.dm,fontSize:10,fontWeight:600,cursor:"pointer",textTransform:"capitalize"}}>{l}</button>))}</div>
        </div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Tactical Focus</label><input value={matchForm.tacticalFocus||""} onChange={e=>setMatchForm({...matchForm,tacticalFocus:e.target.value})} placeholder="What were you working on?" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>

        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm,display:"block",marginBottom:6}}>Tactical Principles (1–5)</label>
          {TACTICAL_PRINCIPLES.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
              <span style={{fontSize:10,color:S.dm,flex:1,minWidth:0}}>{p}</span>
              <div style={{display:"flex",gap:2}}>{[1,2,3,4,5].map(v=>(<button key={v} onClick={()=>setMatchForm({...matchForm,principles:{...(matchForm.principles||{}),[i]:v}})} style={{width:24,height:24,borderRadius:4,border:`1px solid ${(matchForm.principles||{})[i]===v?"#f59e0b30":S.bd}`,background:(matchForm.principles||{})[i]===v?"#f59e0b15":"transparent",color:(matchForm.principles||{})[i]===v?"#f59e0b":S.dm,fontSize:10,fontWeight:700,cursor:"pointer"}}>{v}</button>))}</div>
            </div>
          ))}
        </div>

        <div style={{marginBottom:12}}><label style={{fontSize:10,color:S.dm}}>Key Takeaway</label><textarea value={matchForm.learned||""} onChange={e=>setMatchForm({...matchForm,learned:e.target.value})} placeholder="What did you learn?" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box",minHeight:50,resize:"vertical"}}/></div>
        <div style={{display:"flex",gap:6}}><button onClick={()=>setShowMatchForm(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>{save({padel:{...padel,matches:[...(padel.matches||[]),matchForm]}});setShowMatchForm(false);}} style={{flex:1,padding:9,borderRadius:7,border:"none",background:"#f59e0b",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save Match</button></div>
      </div>
    </div>}

    {/* ── Shot Rating Form ── */}
    {showShotForm&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowShotForm(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:380,maxHeight:"85vh",overflow:"auto"}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Monthly Shot Rating</div>
        <div style={{fontSize:10,color:S.dm,marginBottom:12}}>Rate your confidence 1–5 on each shot</div>
        <div style={{marginBottom:12}}><label style={{fontSize:10,color:S.dm}}>Date</label><input type="date" value={shotForm.date||todayKey} onChange={e=>setShotForm({...shotForm,date:e.target.value})} style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        {PADEL_SHOTS.map(s=>(
          <div key={s.k} style={{marginBottom:10}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
              <div><div style={{fontSize:12,fontWeight:600,color:S.tx}}>{s.l}</div><div style={{fontSize:9,color:S.dm}}>{s.d}</div></div>
            </div>
            <div style={{display:"flex",gap:3}}>{[1,2,3,4,5].map(v=>(<button key={v} onClick={()=>setShotForm({...shotForm,[s.k]:v})} style={{flex:1,padding:"8px 0",borderRadius:6,border:`1px solid ${shotForm[s.k]===v?"#f59e0b40":S.bd}`,background:shotForm[s.k]===v?"#f59e0b15":"transparent",color:shotForm[s.k]===v?"#f59e0b":S.dm,fontSize:13,fontWeight:700,cursor:"pointer"}}>{v}</button>))}</div>
          </div>
        ))}
        <div style={{display:"flex",gap:6,marginTop:4}}><button onClick={()=>setShowShotForm(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>{const {date,...ratings}=shotForm;save({padel:{...padel,shots:{...(padel.shots||{}),[date]:ratings}}});setShowShotForm(false);}} style={{flex:1,padding:9,borderRadius:7,border:"none",background:"#f59e0b",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button></div>
      </div>
    </div>}

    {/* ── Focus Form ── */}
    {showFocusForm&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowFocusForm(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:380,maxHeight:"85vh",overflow:"auto"}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Weekly Tactical Focus</div>
        <div style={{fontSize:10,color:S.dm,marginBottom:4}}>Pick ONE area to focus on this week</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:12,maxHeight:150,overflow:"auto"}}>
          {TACTICAL_FOCUS_OPTIONS.map(o=>(<button key={o} onClick={()=>setFocusForm({...focusForm,area:o})} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${focusForm.area===o?"#f59e0b35":S.bd}`,background:focusForm.area===o?"#f59e0b10":"transparent",color:focusForm.area===o?"#f59e0b":S.dm,fontSize:10,fontWeight:600,cursor:"pointer"}}>{o}</button>))}
        </div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Execution rating (1–5)</label>
          <div style={{display:"flex",gap:3,marginTop:3}}>{[1,2,3,4,5].map(v=>(<button key={v} onClick={()=>setFocusForm({...focusForm,rating:v})} style={{flex:1,padding:"8px 0",borderRadius:6,border:`1px solid ${focusForm.rating===v?"#f59e0b40":S.bd}`,background:focusForm.rating===v?"#f59e0b15":"transparent",color:focusForm.rating===v?"#f59e0b":S.dm,fontSize:13,fontWeight:700,cursor:"pointer"}}>{v}</button>))}</div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:10,cursor:"pointer"}} onClick={()=>setFocusForm({...focusForm,executed:!focusForm.executed})}>
          <div style={{width:20,height:20,borderRadius:5,border:focusForm.executed?"2px solid #10b981":"1.5px solid #2a2a2a",background:focusForm.executed?"#10b981":"transparent",display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,color:"#fff"}}>{focusForm.executed&&"✓"}</div>
          <span style={{fontSize:12,color:S.tx}}>Consistently executed this week</span>
        </div>
        <div style={{marginBottom:12}}><label style={{fontSize:10,color:S.dm}}>Notes</label><textarea value={focusForm.notes||""} onChange={e=>setFocusForm({...focusForm,notes:e.target.value})} placeholder="How did it go? What situations came up?" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box",minHeight:50,resize:"vertical"}}/></div>
        <div style={{display:"flex",gap:6}}><button onClick={()=>setShowFocusForm(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>{const wk=focusForm.week||dk(ws(today));save({padel:{...padel,focus:{...(padel.focus||{}),[wk]:focusForm}}});setShowFocusForm(false);}} style={{flex:1,padding:9,borderRadius:7,border:"none",background:"#f59e0b",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button></div>
      </div>
    </div>}

    {/* ── Video Form ── */}
    {showVideoForm&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowVideoForm(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:380}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Log Video Study</div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Date</label><input type="date" value={videoForm.date||todayKey} onChange={e=>setVideoForm({...videoForm,date:e.target.value})} style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Type</label>
          <div style={{display:"flex",gap:3,marginTop:3}}>{[["pro","🎬 Pro Match"],["own","📱 Own Footage"],["tutorial","📺 Tutorial"]].map(([v,l])=>(<button key={v} onClick={()=>setVideoForm({...videoForm,type:v})} style={{flex:1,padding:"6px 0",borderRadius:5,border:`1px solid ${videoForm.type===v?"#f59e0b35":S.bd}`,background:videoForm.type===v?"#f59e0b10":"transparent",color:videoForm.type===v?"#f59e0b":S.dm,fontSize:10,fontWeight:600,cursor:"pointer"}}>{l}</button>))}</div>
        </div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Title / Player</label><input value={videoForm.title||""} onChange={e=>setVideoForm({...videoForm,title:e.target.value})} placeholder="e.g. Galán vs Tapia — QF" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Key Takeaways</label><textarea value={videoForm.takeaways||""} onChange={e=>setVideoForm({...videoForm,takeaways:e.target.value})} placeholder="What stood out?" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box",minHeight:40,resize:"vertical"}}/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:10,color:S.dm}}>What to apply next session</label><input value={videoForm.apply||""} onChange={e=>setVideoForm({...videoForm,apply:e.target.value})} placeholder="One concrete thing to try" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{display:"flex",gap:6}}><button onClick={()=>setShowVideoForm(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>{save({padel:{...padel,videos:[...(padel.videos||[]),videoForm]}});setShowVideoForm(false);}} style={{flex:1,padding:9,borderRadius:7,border:"none",background:"#f59e0b",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button></div>
      </div>
    </div>}

    {/* ── Tournament Form ── */}
    {showTournForm&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowTournForm(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:380}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Log Tournament / SNPL Result</div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Date</label><input type="date" value={tournForm.date||todayKey} onChange={e=>setTournForm({...tournForm,date:e.target.value})} style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Tournament / League</label><input value={tournForm.name||""} onChange={e=>setTournForm({...tournForm,name:e.target.value})} placeholder="e.g. SNPL Season 3, APPT Singapore" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Division / Category</label><input value={tournForm.division||""} onChange={e=>setTournForm({...tournForm,division:e.target.value})} placeholder="e.g. Open 3, Masters 50+" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Result</label><input value={tournForm.result||""} onChange={e=>setTournForm({...tournForm,result:e.target.value})} placeholder="e.g. Quarter-finals, 5W-3L, Champions" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Partner</label><input value={tournForm.partner||""} onChange={e=>setTournForm({...tournForm,partner:e.target.value})} placeholder="Partner name" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:10,color:S.dm}}>Notes</label><textarea value={tournForm.notes||""} onChange={e=>setTournForm({...tournForm,notes:e.target.value})} placeholder="Reflections, what worked, what to improve" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box",minHeight:50,resize:"vertical"}}/></div>
        <div style={{display:"flex",gap:6}}><button onClick={()=>setShowTournForm(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>{save({padel:{...padel,tournaments:[...(padel.tournaments||[]),tournForm]}});setShowTournForm(false);}} style={{flex:1,padding:9,borderRadius:7,border:"none",background:"#f59e0b",color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button></div>
      </div>
    </div>}

    {/* Custom session */}
    {showModal&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowModal(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:360}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Custom Session</div>
        <div style={{fontSize:10,color:S.dm,marginBottom:10}}>{modalDate&&new Date(modalDate+"T12:00:00").toLocaleDateString("en-US",{weekday:"long",month:"short",day:"numeric"})}</div>
        <div style={{display:"flex",gap:3,flexWrap:"wrap",marginBottom:10}}>
          {["yoga","pilates","swim","court","cardio","gym","custom"].map(t=>(<button key={t} onClick={()=>setCType(t)} style={{padding:"4px 10px",borderRadius:5,border:`1px solid ${cType===t?(ST[t]?.c||"#fff")+"35":S.bd}`,background:cType===t?(ST[t]?.c||"#fff")+"10":"transparent",color:cType===t?ST[t]?.c||"#fff":S.dm,fontSize:10,fontWeight:600,cursor:"pointer"}}>{ST[t]?.i} {ST[t]?.l}</button>))}
        </div>
        <input value={cTitle} onChange={e=>setCTitle(e.target.value)} placeholder={ST[cType]?.l+" session"} style={{...inp,width:"100%",marginBottom:8,boxSizing:"border-box"}}/>
        <input type="number" value={cDur} onChange={e=>setCDur(e.target.value)} placeholder="Duration" style={{...inp,width:"100%",marginBottom:8,boxSizing:"border-box"}}/>
        <textarea value={cNotes} onChange={e=>setCNotes(e.target.value)} placeholder="Notes..." style={{...inp,width:"100%",minHeight:40,resize:"vertical",boxSizing:"border-box",marginBottom:12}}/>
        <div style={{display:"flex",gap:6}}><button onClick={()=>setShowModal(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={addCustom} style={{flex:1,padding:9,borderRadius:7,border:"none",background:S.ac,color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Add</button></div>
      </div>
    </div>}

    {/* InBody form */}
    {showInbodyForm&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowInbodyForm(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:360,maxHeight:"80vh",overflow:"auto"}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Log InBody Scan</div>
        <div style={{marginBottom:10}}><label style={{fontSize:10,color:S.dm}}>Scan Date</label><input type="date" value={ibForm.date||todayKey} onChange={e=>setIbForm({...ibForm,date:e.target.value})} style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        {INBODY_FIELDS.map(f=>(<div key={f.k} style={{marginBottom:8}}><label style={{fontSize:10,color:S.dm}}>{f.l} {f.u&&`(${f.u})`}</label><input type="number" step="0.1" value={ibForm[f.k]||""} onChange={e=>setIbForm({...ibForm,[f.k]:+e.target.value})} style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>))}
        <div style={{display:"flex",gap:6,marginTop:4}}><button onClick={()=>setShowInbodyForm(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>{const nb=[...inbody,ibForm].sort((a,b)=>a.date.localeCompare(b.date));save({ib:nb});setShowInbodyForm(false);setIbForm({});}} style={{flex:1,padding:9,borderRadius:7,border:"none",background:S.ac,color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button></div>
      </div>
    </div>}

    {/* Weekly check-in form */}
    {showCheckinForm&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowCheckinForm(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:360}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:12}}>Weekly Check-in</div>
        {[["energy","⚡ Energy Level"],["sleep","😴 Sleep Quality"],["motivation","🔥 Motivation"]].map(([k,l])=>(
          <div key={k} style={{marginBottom:12}}>
            <div style={{fontSize:11,fontWeight:600,color:S.dm,marginBottom:4}}>{l}</div>
            <div style={{display:"flex",gap:4}}>{[1,2,3,4,5].map(v=>(<button key={v} onClick={()=>setCiForm({...ciForm,[k]:v})} style={{flex:1,padding:"8px 0",borderRadius:6,border:`1px solid ${ciForm[k]===v?S.ac+"40":S.bd}`,background:ciForm[k]===v?S.ac+"15":"transparent",color:ciForm[k]===v?S.ac:S.dm,fontSize:13,fontWeight:700,cursor:"pointer"}}>{v}</button>))}</div>
          </div>
        ))}
        <div style={{marginBottom:10}}><label style={{fontSize:11,fontWeight:600,color:S.dm}}>Any pain/discomfort?</label><input value={ciForm.pain} onChange={e=>setCiForm({...ciForm,pain:e.target.value})} placeholder="e.g. Knee 2/10 after squats" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{marginBottom:12}}><label style={{fontSize:11,fontWeight:600,color:S.dm}}>Biggest win this week</label><input value={ciForm.win} onChange={e=>setCiForm({...ciForm,win:e.target.value})} placeholder="e.g. Hit squat PR, no knee pain" style={{...inp,display:"block",width:"100%",marginTop:3,boxSizing:"border-box"}}/></div>
        <div style={{display:"flex",gap:6}}><button onClick={()=>setShowCheckinForm(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>{const wk=dk(sunOf(today));save({ci:{...checkins,[wk]:ciForm}});setShowCheckinForm(false);}} style={{flex:1,padding:9,borderRadius:7,border:"none",background:S.ac,color:"#000",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button></div>
      </div>
    </div>}

    {/* Pain form */}
    {showPainForm&&<div style={{position:"fixed",inset:0,background:"#000c",display:"flex",alignItems:"center",justifyContent:"center",zIndex:100,padding:16}} onClick={()=>setShowPainForm(false)}>
      <div onClick={e=>e.stopPropagation()} style={{background:"#111",border:`1px solid ${S.bd}`,borderRadius:12,padding:18,width:"100%",maxWidth:360,maxHeight:"80vh",overflow:"auto"}}>
        <div style={{fontSize:15,fontWeight:700,marginBottom:4}}>Log Pain / Discomfort</div>
        <div style={{fontSize:10,color:S.dm,marginBottom:12}}>Rate each area 0–5 (0 = none, 5 = severe). Only tap areas with issues.</div>
        {PAIN_AREAS.map(area=>(
          <div key={area} style={{marginBottom:6}}>
            <div style={{fontSize:11,fontWeight:600,color:S.dm,marginBottom:3}}>{area}</div>
            <div style={{display:"flex",gap:3}}>{[0,1,2,3,4,5].map(v=>(<button key={v} onClick={()=>setPfAreas({...pfAreas,[area]:pfAreas[area]===v?undefined:v})} style={{width:36,padding:"6px 0",borderRadius:5,border:`1px solid ${pfAreas[area]===v?(v>=4?"#ef4444":v>=2?"#f59e0b":"#10b981")+"40":S.bd}`,background:pfAreas[area]===v?(v>=4?"#ef4444":v>=2?"#f59e0b":"#10b981")+"12":"transparent",color:pfAreas[area]===v?(v>=4?"#ef4444":v>=2?"#f59e0b":"#10b981"):S.dm,fontSize:12,fontWeight:700,cursor:"pointer"}}>{v}</button>))}</div>
          </div>
        ))}
        <div style={{display:"flex",gap:6,marginTop:10}}><button onClick={()=>setShowPainForm(false)} style={{flex:1,padding:9,borderRadius:7,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:12,fontWeight:600,cursor:"pointer"}}>Cancel</button><button onClick={()=>{const filtered=Object.fromEntries(Object.entries(pfAreas).filter(([_,v])=>v!==undefined&&v>0));save({pain:{...painLog,[todayKey]:filtered}});setShowPainForm(false);}} style={{flex:1,padding:9,borderRadius:7,border:"none",background:"#ef4444",color:"#fff",fontSize:12,fontWeight:700,cursor:"pointer"}}>Save</button></div>
      </div>
    </div>}

    {/* ─── Data Management ─────────────────────────────────────── */}
    <div style={{textAlign:"center",padding:"16px 14px 10px",borderTop:`1px solid ${S.bd}`,margin:"0 auto",maxWidth:540}}>
      <div style={{display:"flex",gap:6,justifyContent:"center",marginBottom:8}}>
        <button onClick={exportData} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:10,fontWeight:600,cursor:"pointer"}}>Export Backup</button>
        <button onClick={()=>fileInputRef.current?.click()} style={{padding:"6px 14px",borderRadius:6,border:`1px solid ${S.bd}`,background:"transparent",color:S.dm,fontSize:10,fontWeight:600,cursor:"pointer"}}>Import Backup</button>
        <input ref={fileInputRef} type="file" accept=".json" style={{display:"none"}} onChange={async(e)=>{
          const file=e.target.files?.[0]; if(!file)return;
          try{ const d=await importData(file); setLogs(d.logs||{}); setPhase(d.phase||1); setOverrides(d.ov||{}); setInbody(d.ib||[]); setCheckins(d.ci||{}); setPainLog(d.pain||{}); setExitChecked(d.ec||{}); alert("Backup restored!"); }
          catch(err){ alert("Import failed: "+err.message); }
          e.target.value="";
        }}/>
      </div>
      <div style={{fontSize:9,color:"#222",marginTop:6}}>Signed in as {session?.user?.email} • Synced via Supabase</div>
    </div>
  </div>);
}
