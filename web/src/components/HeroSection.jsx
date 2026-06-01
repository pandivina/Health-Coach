import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight, Zap, ChevronLeft, ChevronRight } from 'lucide-react'

const C = {
  primary: '#2EC4B6',
  pink:    '#FF8FA3',
  text:    '#1F2937',
  muted:   '#6B7280',
  light:   '#9CA3AF',
  border:  '#E5E7EB',
  grad:    'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
}

const PANDI_STATES = [
  { id: 'energized', label: 'En forma 🟢', aura: ['#2EC4B6','#4AE8D8','#00F5E9'], glow: 'rgba(46,196,182,0.6)', msg: 'Hoy tienes energía para todo.', bg: 'linear-gradient(160deg,#e0fffe 0%,#f0fff8 40%,#e8f5ff 100%)', particle: '#2EC4B6', avatar: '/panda/avatar_happy.png' },
  { id: 'focused',   label: 'Moderado 🟡', aura: ['#F59E0B','#FCD34D','#FEF08A'], glow: 'rgba(245,158,11,0.55)', msg: 'Ritmo moderado. El Coach ajusta tu plan.', bg: 'linear-gradient(160deg,#fffbeb 0%,#fef9e7 40%,#fff8e1 100%)', particle: '#F59E0B', avatar: '/panda/avatar_thinking.png' },
  { id: 'recovering',label: 'Descansando 🔴', aura: ['#FF8FA3','#FFB3C6','#FFD6E0'], glow: 'rgba(255,143,163,0.55)', msg: 'Hoy el descanso ES el entrenamiento.', bg: 'linear-gradient(160deg,#fff0f3 0%,#fff5f7 40%,#fce4ec 100%)', particle: '#FF8FA3', avatar: '/panda/avatar_sleep.png' },
]

const SECTIONS = [
  { id:'sanctuary', emoji:'🏠', label:'Santuario', title:'Tu espejo biológico', desc:'El Santuario refleja tu estado real. Si descansas bien, Pandi brilla. Si te sobreentrenas, Pandi lo muestra. No es una mascota — eres tú.', avatar:'/panda/avatar_happy.png', color:'#2EC4B6', bg:'linear-gradient(135deg,#e0fffe,#f0fff8)', stats:[{e:'🟢',l:'Estado',v:'En forma'},{e:'✨',l:'Aura',v:'Energizada'},{e:'🎯',l:'Nivel',v:'5'}] },
  { id:'nutrition',  emoji:'🍎', label:'Nutrición', title:'Come con inteligencia clínica', desc:'Pandi sabe que tomas Ozempic, que tu ferritina está baja y que trabajas de noche. Tus macros se adaptan a tu realidad.', avatar:'/panda/avatar_coach.png', color:'#F97316', bg:'linear-gradient(135deg,#fff7ed,#ffedd5)', stats:[{e:'🔥',l:'Calorías',v:'1,240/1,800'},{e:'💪',l:'Proteína',v:'78/150g'},{e:'⚡',l:'Energía',v:'Óptima'}] },
  { id:'workout',    emoji:'💪', label:'Entrena', title:'El coach que te para cuando toca', desc:'Si tu semáforo está en rojo, Pandi bloquea el entreno intenso y te manda a movilidad. No es debilidad — es estrategia.', avatar:'/panda/encourage_1.png', color:'#6366F1', bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)', stats:[{e:'🏋️',l:'Volumen',v:'4,200 kg'},{e:'🔥',l:'Quemadas',v:'380 kcal'},{e:'📈',l:'PRs',v:'3 esta semana'}] },
  { id:'sleep',      emoji:'😴', label:'Sueño', title:'Sin sueño, Pandi se apaga', desc:'El sueño alimenta el aura de Pandi. Cada hora que duermes bien se refleja en su brillo. El Coach ajusta tu día según cómo dormiste.', avatar:'/panda/avatar_sleep.png', color:'#818CF8', bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)', stats:[{e:'😴',l:'Anoche',v:'7.5h'},{e:'⭐',l:'Calidad',v:'4/5'},{e:'📊',l:'Media',v:'7.2h'}] },
  { id:'mood',       emoji:'🧘', label:'Bienestar', title:'Tu ánimo cambia el santuario', desc:'Un día difícil oscurece el ambiente de Pandi. Un día genial lo ilumina. Respiración, meditación y hábitos — todo conectado.', avatar:'/panda/avatar_love.png', color:'#EC4899', bg:'linear-gradient(135deg,#fdf2f8,#fce7f3)', stats:[{e:'😊',l:'Ánimo',v:'Bien'},{e:'🧘',l:'Meditación',v:'5 min'},{e:'⚡',l:'Hábitos',v:'4/5'}] },
  { id:'coach',      emoji:'🤖', label:'Coach IA', title:'Ve todo. Sabe todo. Actúa.', desc:'El Coach ve tu santuario, tus macros, tu sueño y tu ánimo en tiempo real. No espera a que preguntes — actúa antes.', avatar:'/panda/coach_explain_1.png', color:'#2EC4B6', bg:'linear-gradient(135deg,#f0fffe,#e0fffe)', stats:[{e:'🧠',l:'Contexto',v:'Completo'},{e:'💬',l:'Mensajes',v:'Ilimitados'},{e:'⚡',l:'Respuesta',v:'Instantánea'}] },
]

const PARTICLES = Array.from({length:12},(_,i)=>{
  const a=(i/12)*Math.PI*2, r=110+(i%4)*10
  return { x:Math.cos(a)*r, y:Math.sin(a)*r, size:3+(i%3)*1.5, delay:i*0.18 }
})

function AuraParticles({ color }) {
  return PARTICLES.map((p,i)=>(
    <motion.div key={i} style={{ position:'absolute', left:'50%', top:'50%', width:p.size, height:p.size, borderRadius:'50%', background:color, marginLeft:-p.size/2, marginTop:-p.size/2, boxShadow:`0 0 ${p.size*2}px ${color}` }}
      animate={{ x:[p.x*.8,p.x*1.1,p.x*.9,p.x], y:[p.y*.8,p.y*1.1,p.y*.9,p.y], opacity:[.3,.8,.5,.3], scale:[1,1.3,.9,1] }}
      transition={{ duration:3.5+(i%3)*.5, delay:p.delay, repeat:Infinity, ease:'easeInOut' }} />
  ))
}

function PandiOrb({ state }) {
  const [err,setErr]=useState(false)
  return (
    <div style={{ position:'relative', width:180, height:180, display:'flex', alignItems:'center', justifyContent:'center' }}>
      {[1,2,3].map(r=>(
        <motion.div key={r} style={{ position:'absolute', width:100+r*28, height:100+r*28, borderRadius:'50%', border:`${4-r}px solid ${state.aura[r-1]}` }}
          animate={{ scale:[1,1.08,1], opacity:[.3/r,.5/r,.3/r] }}
          transition={{ duration:2.5+r*.5, repeat:Infinity, ease:'easeInOut', delay:r*.3 }} />
      ))}
      <AuraParticles color={state.particle} />
      <motion.div style={{ position:'absolute', width:130, height:130, borderRadius:'50%', background:`radial-gradient(circle,${state.glow} 0%,transparent 70%)`, filter:'blur(18px)' }}
        animate={{ scale:[1,1.15,1], opacity:[.6,1,.6] }} transition={{ duration:3, repeat:Infinity, ease:'easeInOut' }} />
      <motion.div style={{ position:'relative', zIndex:2, width:110, height:110, borderRadius:'50%', background:'white', boxShadow:`0 0 40px ${state.glow},0 8px 32px rgba(0,0,0,.1)`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden' }}
        animate={{ y:[0,-6,0] }} transition={{ duration:4, repeat:Infinity, ease:'easeInOut' }}>
        <AnimatePresence mode="wait">
          <motion.img key={state.avatar} src={state.avatar} alt="Pandi"
            initial={{ opacity:0, scale:.85 }} animate={{ opacity:1, scale:1 }} exit={{ opacity:0, scale:.85 }}
            transition={{ duration:.4 }}
            style={{ width:90, height:90, objectFit:'contain' }}
            onError={e=>{ e.target.style.display='none' }} />
        </AnimatePresence>
      </motion.div>
      <div style={{ position:'absolute', bottom:-12, left:'50%', transform:'translateX(-50%)', background:'white', borderRadius:20, padding:'4px 14px', fontSize:10, fontWeight:700, color:C.text, whiteSpace:'nowrap', boxShadow:'0 4px 16px rgba(0,0,0,.12)', border:`1.5px solid ${state.aura[0]}40`, zIndex:3 }}>
        {state.label}
      </div>
    </div>
  )
}

function SectionPandi({ avatar, color }) {
  const [err,setErr]=useState(false)
  return (
    <div style={{ width:80, height:80, borderRadius:'50%', background:`${color}15`, border:`2px solid ${color}30`, display:'flex', alignItems:'center', justifyContent:'center', overflow:'hidden', flexShrink:0 }}>
      {err ? <span style={{fontSize:40}}>🐼</span>
           : <img src={avatar} alt="Pandi" style={{width:66,height:66,objectFit:'contain'}} onError={()=>setErr(true)} />}
    </div>
  )
}

function SectionCarousel() {
  const [active,setActive]=useState(0)
  const timer=useRef(null)
  const s=SECTIONS[active]

  function go(i){ clearInterval(timer.current); setActive((i+SECTIONS.length)%SECTIONS.length); timer.current=setInterval(()=>setActive(x=>(x+1)%SECTIONS.length),4500) }
  useEffect(()=>{ timer.current=setInterval(()=>setActive(i=>(i+1)%SECTIONS.length),4500); return()=>clearInterval(timer.current) },[])

  return (
    <div style={{ width:'100%' }}>
      {/* Card */}
      <div style={{ position:'relative', borderRadius:28, overflow:'hidden', boxShadow:'0 16px 64px rgba(0,0,0,.12)', minHeight:280 }}>
        <AnimatePresence mode="wait">
          <motion.div key={s.id}
            initial={{ opacity:0, x:50 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0, x:-50 }}
            transition={{ duration:.35, ease:'easeInOut' }}
            style={{ background:s.bg, padding:'32px 28px 28px' }}>

            {/* Label */}
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:20 }}>
              <div style={{ width:44, height:44, borderRadius:14, background:`${s.color}20`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{s.emoji}</div>
              <div>
                <p style={{ fontSize:11, fontWeight:800, color:s.color, margin:0, textTransform:'uppercase', letterSpacing:'.08em' }}>{s.label}</p>
                <p style={{ fontSize:18, fontWeight:900, color:C.text, margin:'2px 0 0', lineHeight:1.15, letterSpacing:'-.02em' }}>{s.title}</p>
              </div>
            </div>

            {/* Pandi + desc */}
            <div style={{ display:'flex', gap:20, alignItems:'flex-start', marginBottom:24 }}>
              <SectionPandi avatar={s.avatar} color={s.color} />
              <p style={{ fontSize:14, color:C.muted, lineHeight:1.65, margin:0, flex:1 }}>{s.desc}</p>
            </div>

            {/* Stats */}
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
              {s.stats.map(st=>(
                <div key={st.l} style={{ background:'rgba(255,255,255,.75)', borderRadius:16, padding:'12px 10px', textAlign:'center', border:`1px solid ${s.color}20`, backdropFilter:'blur(8px)' }}>
                  <p style={{ fontSize:18, margin:'0 0 3px' }}>{st.e}</p>
                  <p style={{ fontSize:13, fontWeight:800, color:C.text, margin:0 }}>{st.v}</p>
                  <p style={{ fontSize:10, color:C.muted, margin:'2px 0 0' }}>{st.l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Flechas */}
        {[[-1,'left',8],[1,'right',8]].map(([dir,side,pos])=>(
          <button key={side} onClick={()=>go(active+dir)} style={{ position:'absolute', [side]:pos, top:'50%', transform:'translateY(-50%)', width:36, height:36, borderRadius:'50%', border:'none', background:'rgba(255,255,255,.92)', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 2px 12px rgba(0,0,0,.12)', zIndex:2 }}>
            {dir===-1 ? <ChevronLeft size={18} color={C.muted}/> : <ChevronRight size={18} color={C.muted}/>}
          </button>
        ))}

        {/* Progress bar */}
        <div style={{ position:'absolute', bottom:0, left:0, right:0, height:3, background:'rgba(0,0,0,.06)' }}>
          <motion.div key={active} initial={{ width:'0%' }} animate={{ width:'100%' }} transition={{ duration:4.5, ease:'linear' }}
            style={{ height:'100%', background:s.color }} />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:6, justifyContent:'center', marginTop:18, flexWrap:'wrap' }}>
        {SECTIONS.map((sec,i)=>(
          <button key={sec.id} onClick={()=>go(i)} style={{ display:'flex', alignItems:'center', gap:5, padding: active===i ? '7px 16px' : '7px 12px', borderRadius:22, border:`2px solid ${active===i ? sec.color : C.border}`, background: active===i ? `${sec.color}18` : 'rgba(255,255,255,.7)', color: active===i ? sec.color : C.muted, fontSize:12, fontWeight:700, cursor:'pointer', transition:'all .25s' }}>
            <span style={{fontSize:15}}>{sec.emoji}</span>
            {active===i && <span>{sec.label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function HeroSection() {
  const [stateIdx,setStateIdx]=useState(0)
  const state=PANDI_STATES[stateIdx]

  useEffect(()=>{ const t=setInterval(()=>setStateIdx(i=>(i+1)%PANDI_STATES.length),5000); return()=>clearInterval(t) },[])

  return (
    <section style={{ position:'relative', overflow:'hidden', minHeight:'100vh', display:'flex', alignItems:'center' }}>

      {/* Fondo */}
      <AnimatePresence mode="wait">
        <motion.div key={state.id} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:1.5}}
          style={{ position:'absolute', inset:0, background:state.bg, zIndex:0 }} />
      </AnimatePresence>
      <motion.div animate={{x:[0,30,0],y:[0,-20,0]}} transition={{duration:8,repeat:Infinity,ease:'easeInOut'}}
        style={{ position:'absolute', top:'-15%', right:'-8%', width:600, height:600, borderRadius:'50%', background:`radial-gradient(circle,${state.aura[0]}20 0%,transparent 70%)`, filter:'blur(60px)', zIndex:0 }} />
      <motion.div animate={{x:[0,-20,0],y:[0,30,0]}} transition={{duration:10,repeat:Infinity,ease:'easeInOut',delay:1}}
        style={{ position:'absolute', bottom:'-15%', left:'-8%', width:500, height:500, borderRadius:'50%', background:`radial-gradient(circle,${C.pink}15 0%,transparent 70%)`, filter:'blur(60px)', zIndex:0 }} />

      <div style={{ maxWidth:1200, margin:'0 auto', padding:'5rem 2rem 4rem', position:'relative', zIndex:1, width:'100%' }}>

        {/* Grid 2 columnas en desktop */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr', gap:56, alignItems:'center' }}
          className="hero-grid">

          {/* LEFT — Texto + Pandi */}
          <div style={{ display:'flex', flexDirection:'column', alignItems:'center', textAlign:'center' }}>

            {/* Badge */}
            <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.1}}
              style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'7px 18px', borderRadius:22, background:`${C.primary}15`, border:`1px solid ${C.primary}30`, fontSize:12, fontWeight:700, color:C.primary, marginBottom:24 }}>
              <Zap size={13}/> El primer coach que te refleja biológicamente
            </motion.div>

            {/* H1 — 2 líneas */}
            <motion.h1 initial={{opacity:0,y:28}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.6}}
              style={{ margin:'0 0 20px', letterSpacing:'-.035em', lineHeight:.95 }}>
              <span style={{ display:'block', fontSize:'clamp(3.2rem,9vw,6rem)', fontWeight:900, color:C.text, whiteSpace:'nowrap' }}>
                Pandi no registra tu salud.
              </span>
              <span style={{ display:'block', fontSize:'clamp(3.2rem,9vw,6rem)', fontWeight:900, background:C.grad, WebkitBackgroundClip:'text', WebkitTextFillColor:'transparent', backgroundClip:'text', whiteSpace:'nowrap' }}>
                La vive contigo.
              </span>
            </motion.h1>

            {/* Subtítulo */}
            <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.35}}
              style={{ fontSize:'clamp(.95rem,1.8vw,1.15rem)', color:C.muted, lineHeight:1.7, margin:'0 0 20px', maxWidth:540 }}>
              Cuando descansas bien, Pandi brilla. Cuando te sobreentrenas, Pandi te frena.<br/>
              Es el espejo biológico de tu mejor versión.
            </motion.p>

            {/* Ticker */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.45}} style={{marginBottom:28}}>
              <AnimatePresence mode="wait">
                <motion.div key={state.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-8}} transition={{duration:.35}}
                  style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 18px', borderRadius:22, background:'rgba(255,255,255,.85)', border:`1px solid ${state.aura[0]}30`, fontSize:13, fontWeight:600, boxShadow:'0 2px 12px rgba(0,0,0,.06)' }}>
                  <motion.div animate={{scale:[1,1.3,1]}} transition={{duration:2,repeat:Infinity}}
                    style={{ width:9, height:9, borderRadius:'50%', background:state.aura[0], flexShrink:0 }} />
                  <span style={{color:C.text}}>{state.msg}</span>
                </motion.div>
              </AnimatePresence>
            </motion.div>

            {/* Pandi orb */}
            <motion.div initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} transition={{delay:.3,duration:.6}} style={{marginBottom:24}}>
              <PandiOrb state={state} />
            </motion.div>

            {/* Estado selector */}
            <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.5}}
              style={{ display:'flex', gap:8, justifyContent:'center', flexWrap:'wrap', marginBottom:32 }}>
              {PANDI_STATES.map((s,i)=>(
                <button key={s.id} onClick={()=>setStateIdx(i)} style={{ padding:'7px 16px', borderRadius:22, cursor:'pointer', border:`2px solid ${stateIdx===i ? s.aura[0] : C.border}`, background:stateIdx===i ? `${s.aura[0]}15` : 'rgba(255,255,255,.8)', color:stateIdx===i ? s.aura[0] : C.muted, fontSize:12, fontWeight:700, transition:'all .2s' }}>
                  {s.id==='energized'?'🟢 Energizado':s.id==='focused'?'🟡 Moderado':'🔴 Descansando'}
                </button>
              ))}
            </motion.div>

            {/* CTAs */}
            <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.55}}
              style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:12 }}>
              <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
                <Link to="/auth" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'16px 32px', borderRadius:18, background:C.grad, color:'#fff', fontWeight:800, fontSize:16, textDecoration:'none', boxShadow:`0 8px 32px ${C.primary}50` }}>
                  Dale vida a tu Pandi <ArrowRight size={17}/>
                </Link>
                <a href="#como-funciona" style={{ display:'inline-flex', alignItems:'center', padding:'16px 24px', borderRadius:18, background:'rgba(255,255,255,.85)', border:`1.5px solid ${C.border}`, color:C.text, fontWeight:600, fontSize:15, textDecoration:'none' }}>
                  Ver cómo funciona
                </a>
              </div>
              <p style={{ fontSize:11, color:C.light, margin:0 }}>✓ 7 días Premium gratis &nbsp;·&nbsp; ✓ Sin tarjeta &nbsp;·&nbsp; ✓ Cancela cuando quieras</p>
            </motion.div>
          </div>

          {/* RIGHT — Carrusel */}
          <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:.4,duration:.7}}>
            <SectionCarousel />
          </motion.div>

        </div>
      </div>

      {/* CSS para 2 columnas en desktop */}
      <style>{`
        @media (min-width: 900px) {
          .hero-grid {
            grid-template-columns: 1fr 1fr !important;
            text-align: left !important;
          }
          .hero-grid > div:first-child {
            align-items: flex-start !important;
            text-align: left !important;
          }
        }
      `}</style>
    </section>
  )
}
