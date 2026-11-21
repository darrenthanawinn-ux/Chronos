'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import { Activity, AlertTriangle, ArrowDownRight, ArrowUpRight, Crosshair, Download, Eye, FastForward, Flame, Pause, Play, Radio, RotateCcw, ScanLine, Shield, Target, Waves, X } from 'lucide-react'

type MapKey = 'Ascent' | 'Lotus' | 'Haven'
type Tool = 'smoke' | 'flash' | 'stun'
type Drop = { x: number; y: number; tool: Tool; time: number }

const scenarios: { map: MapKey; opponent: string; mode: string; start: number; sites: string[] }[] = [
  { map: 'Ascent', opponent: 'FNATIC', mode: 'FULL BUY', start: 91, sites: ['A SITE', 'B SITE'] },
  { map: 'Lotus', opponent: 'PAPER REX', mode: 'A-RUMBLE', start: 76, sites: ['A SITE', 'B SITE', 'C SITE'] },
  { map: 'Haven', opponent: 'G2 ESPORTS', mode: 'OPERATOR SETUP', start: 84, sites: ['A SITE', 'B SITE', 'C SITE'] },
]
const tells = [
  { time: 72, tag: '01:12', title: 'SOVA RECON → A MAIN', detail: 'Jett holds A-Ramp Operator', chance: '84%', color: 'amber' },
  { time: 54, tag: '00:54', title: 'OMEN SMOKE → TREE', detail: 'Late B rotate in 7/9 rounds', chance: '78%', color: 'cyan' },
  { time: 38, tag: '00:38', title: 'KILLJOY ALARM BOT', detail: 'A Lobby anchor commits', chance: '71%', color: 'red' },
]
const ghostStarts = [
  { x: .15, y: .19 }, { x: .25, y: .78 }, { x: .43, y: .3 }, { x: .68, y: .18 }, { x: .78, y: .76 },
]

function formatTime(value: number) { return `0:${Math.max(0, Math.floor(value)).toString().padStart(2, '0')}` }

function MapCanvas({ time, drops, selectedTool, onDrop, scenario, selectedTell }: { time: number; drops: Drop[]; selectedTool: Tool; onDrop: (x: number, y: number) => void; scenario: typeof scenarios[number]; selectedTell: number | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef(0)
  const draw = useCallback(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const rect = canvas.getBoundingClientRect()
    const dpr = window.devicePixelRatio || 1
    canvas.width = rect.width * dpr
    canvas.height = rect.height * dpr
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.scale(dpr, dpr)
    const w = rect.width, h = rect.height
    ctx.fillStyle = '#090f18'; ctx.fillRect(0, 0, w, h)
    ctx.strokeStyle = 'rgba(78,111,137,.10)'; ctx.lineWidth = 1
    for (let x = 0; x < w; x += 24) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke() }
    for (let y = 0; y < h; y += 24) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke() }
    const mapScale = Math.min(w / 760, h / 470), ox = (w - 760 * mapScale) / 2, oy = (h - 470 * mapScale) / 2
    ctx.save(); ctx.translate(ox, oy); ctx.scale(mapScale, mapScale)
    const walls = [
      [72,65,188,65],[260,65,305,65],[370,65,495,65],[550,65,690,65], [72,65,72,155],[72,210,72,390],
      [690,65,690,170],[690,220,690,390],[72,390,220,390],[270,390,360,390],[410,390,515,390],[570,390,690,390],
      [188,65,188,150],[188,212,188,278],[188,340,188,390],[305,65,305,150],[305,208,305,285],[305,338,305,390],
      [495,65,495,150],[495,205,495,280],[495,335,495,390],[550,65,550,145],[550,208,550,290],[550,340,550,390],
      [72,155,135,155],[188,150,260,150],[305,150,380,150],[435,150,495,150],[550,145,620,145],[620,145,620,220],
      [72,278,140,278],[188,278,260,278],[305,285,380,285],[435,280,495,280],[550,290,620,290],[620,220,690,220],
      [72,210,135,210],[135,155,135,210],[135,210,188,210],[260,150,260,210],[260,210,305,210],
      [410,150,410,210],[380,210,435,210],[380,210,380,285],[410,285,435,285],
      [140,278,140,340],[140,340,188,340],[260,278,260,338],[260,338,305,338], [435,280,435,335],[435,335,495,335],
      [550,290,550,340],[550,340,620,340], [355,150,355,210],[355,285,355,390],
    ]
    ctx.lineCap = 'round'; ctx.lineWidth = 5; ctx.strokeStyle = '#263748'
    walls.forEach(([x1,y1,x2,y2]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke() })
    ctx.lineWidth = 1; ctx.strokeStyle = 'rgba(123,161,184,.18)'
    walls.forEach(([x1,y1,x2,y2]) => { ctx.beginPath(); ctx.moveTo(x1,y1); ctx.lineTo(x2,y2); ctx.stroke() })
    const sites = scenario.sites
    const sitePositions = sites.length === 2 ? [[175,180],[485,238]] : [[175,180],[380,225],[585,265]]
    sitePositions.forEach(([x,y], i) => {
      ctx.fillStyle = 'rgba(0,174,239,.045)'; ctx.fillRect(x-27,y-25,54,50)
      ctx.strokeStyle = 'rgba(0,174,239,.42)'; ctx.setLineDash([4,4]); ctx.strokeRect(x-27,y-25,54,50); ctx.setLineDash([])
      ctx.fillStyle = '#53c9f2'; ctx.font = 'bold 11px monospace'; ctx.textAlign = 'center'; ctx.fillText(sites[i].replace(' SITE',''),x,y+4)
    })
    const labels = [[82,132,'A MAIN'],[96,228,'A LOBBY'],[228,130,'TREE'],[280,247,'MID'],[400,125,'MARKET'],[610,125,'B MAIN'],[620,316,'B LOBBY'],[466,310,'CT SPAWN'],[235,365,'ATTACK SPAWN']]
    ctx.font = '9px monospace'; ctx.fillStyle = 'rgba(147,170,189,.6)'; ctx.textAlign = 'center'
    labels.forEach(([x,y,label])=>ctx.fillText(label as string,x as number,y as number))
    const pulse = (performance.now() % 1800) / 1800
    const op = [610,115]
    if (!drops.some(d => d.tool === 'smoke' && Math.hypot(d.x*760-op[0], d.y*470-op[1]) < 110)) {
      ctx.fillStyle = 'rgba(255,42,95,.10)'; ctx.beginPath(); ctx.moveTo(op[0],op[1]); ctx.lineTo(op[0]-150,op[1]+205); ctx.lineTo(op[0]+85,op[1]+215); ctx.closePath(); ctx.fill()
      ctx.strokeStyle = 'rgba(255,42,95,.48)'; ctx.setLineDash([5,6]); ctx.beginPath(); ctx.moveTo(op[0],op[1]); ctx.lineTo(op[0]-90+Math.sin(pulse*6.28)*25,op[1]+190); ctx.stroke(); ctx.setLineDash([])
      ctx.fillStyle='#ff4970'; ctx.beginPath(); ctx.arc(op[0],op[1],5,0,Math.PI*2); ctx.fill()
    }
    const paths = [ [[120,175],[220,178],[255,210],[340,215]], [[170,340],[220,315],[265,270],[340,240]], [[380,105],[375,170],[390,210],[460,230]], [[610,105],[570,150],[530,190],[480,220]], [[630,340],[590,300],[550,265],[500,235]] ]
    ghostStarts.forEach((_, i) => {
      const phase = ((time + i*11) % 95) / 95
      const p = paths[i]; const seg = phase*3; const idx = Math.min(2,Math.floor(seg)); const f = seg-idx
      let x = p[idx][0] + (p[idx+1][0]-p[idx][0])*f, y = p[idx][1] + (p[idx+1][1]-p[idx][1])*f
      const blocked = drops.find(d => d.tool === 'smoke' && Math.hypot(d.x*760-x,d.y*470-y)<70)
      if (blocked) { x += Math.sin(pulse*6.28+i)*25; y += 24 }
      ctx.strokeStyle='rgba(255,42,95,.2)'; ctx.lineWidth=1; ctx.setLineDash([3,5]); ctx.beginPath(); ctx.moveTo(p[0][0],p[0][1]); p.forEach(pt=>ctx.lineTo(pt[0],pt[1])); ctx.stroke(); ctx.setLineDash([])
      const glow=ctx.createRadialGradient(x,y,1,x,y,17); glow.addColorStop(0,'rgba(255,42,95,.8)'); glow.addColorStop(1,'rgba(255,42,95,0)'); ctx.fillStyle=glow; ctx.beginPath(); ctx.arc(x,y,17,0,Math.PI*2); ctx.fill()
      ctx.fillStyle='#ff3a68'; ctx.beginPath(); ctx.arc(x,y,5.5,0,Math.PI*2); ctx.fill(); ctx.strokeStyle='#ffd2dc'; ctx.lineWidth=1; ctx.stroke()
      ctx.fillStyle='#fff'; ctx.font='bold 8px monospace'; ctx.textAlign='center'; ctx.fillText(['D','I','C','S','R'][i],x,y+3)
    })
    drops.forEach(d=>{
      const x=d.x*760,y=d.y*470
      ctx.beginPath(); ctx.arc(x,y,d.tool==='smoke'?27:17,0,Math.PI*2); ctx.fillStyle=d.tool==='smoke'?'rgba(0,174,239,.18)':d.tool==='flash'?'rgba(245,158,11,.17)':'rgba(245,158,11,.11)'; ctx.fill()
      ctx.strokeStyle=d.tool==='smoke'?'rgba(0,174,239,.85)':'rgba(245,158,11,.8)'; ctx.lineWidth=1.5; ctx.stroke()
      ctx.beginPath(); ctx.arc(x,y,4,0,Math.PI*2); ctx.fillStyle=d.tool==='smoke'?'#00aeef':'#f59e0b'; ctx.fill()
    })
    ctx.restore()
    animationRef.current = requestAnimationFrame(draw)
  }, [time,drops,scenario])
  useEffect(()=>{ animationRef.current=requestAnimationFrame(draw); return ()=>cancelAnimationFrame(animationRef.current) },[draw])
  return <canvas ref={canvasRef} onClick={e=>{const r=e.currentTarget.getBoundingClientRect();onDrop((e.clientX-r.left)/r.width,(e.clientY-r.top)/r.height)}} className="map-canvas" aria-label={`Interactive ${scenario.map} tactical map. Click to place selected counter utility.`} />
}

function PanelTitle({ icon: Icon, children, trailing }: { icon: typeof Activity; children: React.ReactNode; trailing?: React.ReactNode }) { return <div className="panel-title"><span className="panel-title-icon"><Icon size={13}/></span><span>{children}</span>{trailing && <span className="panel-trailing">{trailing}</span>}</div> }

export default function ChronosDashboard() {
  const [scenarioIndex,setScenarioIndex]=useState(0)
  const [economy,setEconomy]=useState('ALL')
  const [time,setTime]=useState(64)
  const [playing,setPlaying]=useState(true)
  const [speed,setSpeed]=useState(1)
  const [tool,setTool]=useState<Tool>('smoke')
  const [drops,setDrops]=useState<Drop[]>([])
  const [selectedTell,setSelectedTell]=useState<number|null>(null)
  const [briefOpen,setBriefOpen]=useState(false)
  const [simulated,setSimulated]=useState(false)
  const scenario=scenarios[scenarioIndex]
  useEffect(()=>{ if(!playing)return; const id=window.setInterval(()=>setTime(t=>t<=0?scenario.start:t- speed),1000); return()=>window.clearInterval(id) },[playing,speed,scenario.start])
  const placeUtility=(x:number,y:number)=>setDrops(prev=>[...prev,{x,y,tool,time}])
  const sim=()=>{setSimulated(true);setPlaying(false)}
  const win=simulated?Math.min(82,41.2+drops.length*14.3):41.2
  const copyBrief=async()=>{ const text=`CHRONOS // ZERO-HOUR — ${scenario.map} vs ${scenario.opponent}\nCounter-strat: ${drops.map(d=>`${d.tool.toUpperCase()} at ${formatTime(d.time)}`).join(', ')||'No utility placed'}\nKill-switch: Eliminate Omen before 1:15\nRound win probability: ${win.toFixed(1)}% (+${(win-41.2).toFixed(1)} pts)`; await navigator.clipboard?.writeText(text) }
  return <main className="chronos-shell">
    <header className="command-header">
      <div className="brand"><div className="brand-mark"><Crosshair size={18}/><i/></div><div><div className="brand-name">CHRONOS <span>//</span> ZERO-HOUR</div><div className="brand-sub">TACTICAL INTELLIGENCE SYSTEM <b>v2.4.0</b></div></div></div>
      <div className="header-divider"/>
      <label className="scenario-select"><span>SCENARIO</span><select value={scenarioIndex} onChange={e=>{setScenarioIndex(Number(e.target.value));setTime(scenarios[Number(e.target.value)].start);setDrops([]);setSimulated(false)}} aria-label="Select match scenario">{scenarios.map((s,i)=><option value={i} key={s.map}>{s.map} — vs. {s.opponent} ({s.mode})</option>)}</select></label>
      <div className="economy-pills" aria-label="Round economy filter">{['ALL','PISTOL','ECO','FULL BUY'].map(p=><button key={p} onClick={()=>setEconomy(p)} className={economy===p?'active':''}>{p}</button>)}</div>
      <div className="header-right"><div className="source-badge"><span className="source-dot"/> BUILT WITH <b>JETBRAINS AIR</b><i/> GRID TELEMETRY</div><button className="export-button" onClick={()=>setBriefOpen(true)}><Download size={14}/> EXPORT PREP BRIEF</button></div>
    </header>
    <div className="workspace-grid">
      <aside className="left-rail">
        <section className="panel vulnerability"><PanelTitle icon={AlertTriangle} trailing={<span className="live-tag">ANALYSIS</span>}>KILL-SWITCH PROFILE</PanelTitle><div className="vuln-body"><div className="confidence-ring"><svg viewBox="0 0 72 72"><circle cx="36" cy="36" r="30"/><circle className="progress" cx="36" cy="36" r="30"/></svg><div><strong>91</strong><small>%</small></div></div><div className="vuln-copy"><span className="eyebrow red-text">#01 STATISTICAL WEAKNESS</span><h3>OMEN PICK-OFF</h3><p>Eliminating enemy Omen before <b>1:15</b> drops their retake win-rate from <b className="red-text">64%</b> to <b className="cyan-text">12%</b>.</p></div></div><div className="vuln-foot"><span>CONFIDENCE INDEX</span><b>0.91 <span className="green-text">HIGH</span></b></div></section>
        <section className="panel tells-panel"><PanelTitle icon={ScanLine} trailing={<span className="muted">3 RULES</span>}>BEHAVIORAL TELLS</PanelTitle><div className="tell-list">{tells.map((tell,i)=><button className={`tell-card ${selectedTell===i?'selected':''}`} key={tell.tag} onClick={()=>{setSelectedTell(i);setTime(tell.time);setPlaying(false)}}><div className="tell-top"><span className={`tell-time ${tell.color}`}>{tell.tag}</span><span className="tell-chance">{tell.chance}</span></div><strong>{tell.title}</strong><span>{tell.detail}</span><div className={`tell-rule ${tell.color}`}>IF TRIGGERED <ArrowDownRight size={11}/></div></button>)}</div><div className="tell-footer"><span className="tiny-bars"><i/><i/><i/><i/><i/><i/><i/></span><span>MINED FROM 47 MATCHES</span></div></section>
        <section className="panel operator-panel"><PanelTitle icon={Eye}>OPERATOR TENDENCY</PanelTitle><div className="operator-profile"><div className="operator-avatar">OP<span>+</span></div><div><strong>DERKE <span className="op-tag">OPERATOR</span></strong><span>FNATIC · JETT</span></div></div><div className="operator-stats"><div><span>PREFERRED ANGLE</span><b>A-RAMP <i className="red-dot"/></b></div><div><span>AVG. PEEK</span><b className="mono">01:18</b></div><div><span>SMOKE ROTATION</span><b className="mono">+4.8s</b></div></div><div className="operator-bar"><span/></div></section>
      </aside>
      <section className="center-stage">
        <div className="map-topline"><div className="map-location"><span className="map-live"><i/> LIVE SIMULATION</span><span className="map-name">{scenario.map.toUpperCase()} <small>/{scenario.opponent}</small></span></div><div className="map-coords"><span>GRID: <b>12.4.08</b></span><span>ROUND <b>19</b></span><span>DEF <b className="cyan-text">C9</b></span><span>ATK <b className="red-text">{scenario.opponent.slice(0,3)}</b></span></div></div>
        <div className="map-wrap"><MapCanvas time={time} drops={drops} selectedTool={tool} onDrop={placeUtility} scenario={scenario} selectedTell={selectedTell}/><div className="map-corner top-left">SECTOR 04 <span>·</span> {scenario.map.toUpperCase()}</div><div className="map-corner top-right"><span className="crosshair-small">⌖</span> LIVE FEED <i/></div><div className="map-coord-label">X 0{Math.floor(time/10)}.4 / Y 02.8</div><div className="map-legend"><span><i className="legend-enemy"/> ENEMY GHOST</span><span><i className="legend-op"/> OP SIGHTLINE</span><span><i className="legend-c9"/> C9 UTILITY</span></div><div className="utility-dock"><div className="dock-label">C9 COUNTER-UTILITY</div>{([{key:'smoke' as Tool,icon:Waves,label:'SMOKE'},{key:'flash' as Tool,icon:Flame,label:'FLASH'},{key:'stun' as Tool,icon:Radio,label:'STUN'}]).map(({key,icon:Icon,label})=><button key={key} className={`tool-button ${tool===key?'selected':''}`} onClick={()=>setTool(key)}><Icon size={14}/><span>{label}</span></button>)}<button className="resim-button" onClick={sim}><Target size={13}/> RE-SIMULATE</button></div></div>
        <div className="timeline-panel"><div className="timeline-controls"><button className="play-button" onClick={()=>setPlaying(!playing)} aria-label={playing?'Pause simulation':'Play simulation'}>{playing?<Pause size={14}/>:<Play size={14}/>}</button><button className={`speed-button ${speed===2?'active':''}`} onClick={()=>setSpeed(speed===1?2:1)}>{speed}× <FastForward size={12}/></button><span className="timer-display">{formatTime(time)}</span></div><div className="timeline-track-wrap"><input aria-label="Round timer scrubber" className="timeline-range" type="range" min="0" max={scenario.start} value={time} onChange={e=>{setTime(Number(e.target.value));setPlaying(false)}}/><div className="timeline-markers"><i style={{left:'24%'}} title="Utility cast"/><i style={{left:'51%'}} title="Operator peek"/><i style={{left:'78%'}} title="Rotation trigger"/></div><div className="timeline-labels"><span>1:40</span><div><i/>UTILITY CAST <i/>OP PEEK <i/>ROTATION</div><span>0:00</span></div></div><button className="reset-button" onClick={()=>{setTime(scenario.start);setDrops([]);setSimulated(false);setPlaying(true)}}><RotateCcw size={13}/> RESET</button></div>
      </section>
      <aside className="right-rail"><section className="panel probability-panel"><PanelTitle icon={Activity} trailing={<span className="live-tag"><i/> LIVE</span>}>ROUND WIN PROBABILITY</PanelTitle><div className="probability-compare"><div className="probability-side"><span>BASELINE</span><strong>41.2<span>%</span></strong><div className="prob-bar"><i style={{width:'41.2%'}}/></div><small>ENEMY SETUP</small></div><div className="prob-arrow"><ArrowUpRight size={18}/></div><div className="probability-side c9-side"><span>WITH C9</span><strong>{win.toFixed(1)}<span>%</span></strong><div className="prob-bar"><i style={{width:`${win}%`}}/></div><small>{simulated?'COUNTER ACTIVE':'COUNTER-STRAT'}</small></div></div><div className={`delta-chip ${simulated?'surge':''}`}><ArrowUpRight size={13}/> +{(win-41.2).toFixed(1)}% <span>WIN PROBABILITY SURGE</span></div><div className="prob-foot"><span><i className="legend-enemy"/> BASELINE ENEMY SETUP</span><span><i className="legend-c9"/> C9 COUNTER-STRAT</span></div></section>
        <section className="panel impact-panel"><PanelTitle icon={Crosshair}>COUNTER-STRAT IMPACT</PanelTitle><div className="impact-metrics"><div className="metric-card"><span>OP SIGHTLINE DENIAL</span><strong>{drops.some(d=>d.tool==='smoke')?'82':'—'}<small>%</small></strong><div className="metric-mini"><span className="mini-line cyan-line"/></div><small className="metric-note">{drops.some(d=>d.tool==='smoke')?'A-RAMP BLOCKED':'AWAITING UTILITY'}</small></div><div className="metric-card"><span>ROTATION DELAY</span><strong>{drops.length?`+${(drops.length*2.4).toFixed(1)}`:'—'}<small>s</small></strong><div className="metric-mini"><span className="mini-line amber-line"/></div><small className="metric-note">ENEMY PATH DISRUPTION</small></div><div className="metric-card"><span>EXECUTE DISRUPTION</span><strong>{drops.length?Math.min(99,drops.length*31):'—'}<small>/100</small></strong><div className="metric-mini"><span className="mini-line red-line"/></div><small className="metric-note">{drops.length?'TACTICAL ADVANTAGE':'NO COUNTER-PLAY'}</small></div></div></section>
        <section className="panel telemetry-panel"><PanelTitle icon={Radio} trailing={<span className="telemetry-count">LIVE STREAM</span>}>GRID TELEMETRY</PanelTitle><div className="telemetry-feed"><div><time>00:{String(time).padStart(2,'0')}.842</time><span className="log-cyan">[POS]</span> <span>EN-03</span> <b>x: 0{Math.floor(time/10)}.4 y: 02.8</b></div><div><time>00:{String(Math.max(0,time-1)).padStart(2,'0')}.128</time><span className="log-red">[CAST]</span> <span>EN-02</span> <b>RECON_BOLT → A-MAIN</b></div><div><time>00:{String(Math.max(0,time-3)).padStart(2,'0')}.591</time><span className="log-amber">[READ]</span> <span>MODEL</span> <b>FAKE A / HIT B <i>84%</i></b></div><div><time>00:{String(Math.max(0,time-5)).padStart(2,'0')}.020</time><span className="log-muted">[PATH]</span> <span>EN-01</span> <b>ROTATION VECTOR LOCKED</b></div>{drops.map((d,i)=><div key={`${d.time}-${i}`}><time>00:{String(d.time).padStart(2,'0')}.917</time><span className="log-cyan">[C9]</span> <span>COACH</span> <b>{d.tool.toUpperCase()} DEPLOYED · {Math.round(d.x*100)},{Math.round(d.y*100)}</b></div>)}{simulated&&<div><time>00:{String(time).padStart(2,'0')}.002</time><span className="log-cyan">[SIM]</span> <span>ENGINE</span> <b>PATH RECALCULATED <i>+{(win-41.2).toFixed(1)}%</i></b></div>}</div><div className="telemetry-status"><span><i/> STREAMING</span><span>GRID API · MOCK DATA</span></div></section>
        <div className="data-note"><Shield size={12}/> SIMULATED DEMO DATA <span>·</span> NOT LIVE GRID TELEMETRY</div>
      </aside>
    </div>
    {briefOpen&&<div className="modal-backdrop" role="presentation" onClick={()=>setBriefOpen(false)}><section className="brief-modal" role="dialog" aria-modal="true" aria-labelledby="brief-title" onClick={e=>e.stopPropagation()}><div className="brief-head"><div><span className="eyebrow cyan-text">CLOUD9 COACHING INTELLIGENCE</span><h2 id="brief-title">PRE-MATCH BRIEF <span>//</span> {scenario.map.toUpperCase()}</h2></div><button className="close-modal" onClick={()=>setBriefOpen(false)} aria-label="Close brief"><X size={18}/></button></div><div className="brief-meta"><span>OPPONENT <b>{scenario.opponent}</b></span><span>ROUND TYPE <b>{scenario.mode}</b></span><span>PREP ID <b>CHR-019-AX7</b></span></div><div className="brief-highlight"><div className="brief-ring">91<small>%</small></div><div><span className="red-text eyebrow">KILL-SWITCH TARGET</span><h3>ELIMINATE OMEN BEFORE 1:15</h3><p>Enemy retake success falls from 64% to 12% when Omen is removed early.</p></div></div><div className="brief-section"><h4>COUNTER-STRAT DEPLOYMENT</h4>{drops.length?drops.map((d,i)=><div className="brief-row" key={i}><span className="cyan-text">C9 {d.tool.toUpperCase()}</span><b>{formatTime(d.time)}</b><span>Sector {Math.round(d.x*100)}.{Math.round(d.y*100)}</span></div>):<div className="brief-row"><span className="muted">No utility placed — add counter-utility on the tactical map.</span></div>}</div><div className="brief-result"><span>PROJECTED ROUND WIN PROBABILITY</span><strong>{win.toFixed(1)}<small>%</small></strong><b>+{(win-41.2).toFixed(1)} PTS VS BASELINE</b></div><div className="brief-actions"><button className="export-button" onClick={()=>window.print()}><Download size={14}/> PRINT BRIEF</button><button className="copy-button" onClick={copyBrief}>COPY SUMMARY</button></div><div className="brief-disclaimer">MOCK GRID TELEMETRY · FOR COACHING SIMULATION ONLY</div></section></div>}
  </main>
}
