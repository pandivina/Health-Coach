import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import InstallPWA from '../components/InstallPWA'
import {
  Brain, Apple, Dumbbell, Moon, FlaskConical, Trophy,
  Check, ChevronDown, ChevronLeft, ChevronRight,
  Star, ArrowRight, Zap, Shield, Heart, Sparkles
} from 'lucide-react'

// ─── PALETA ──────────────────────────────────────────────────────────────────
const C = {
  bg:      '#FFFFFF',
  surface: '#F8FAFA',
  surface2:'#F0F4F4',
  primary: '#2EC4B6',
  pink:    '#FF8FA3',
  text:    '#1A2332',
  muted:   '#6B7280',
  light:   '#9CA3AF',
  border:  '#E5EBEB',
  grad:    'linear-gradient(135deg, #2EC4B6, #FF8FA3)',
  gradSoft:'linear-gradient(135deg, #f0fffe, #fff5f7)',
}

// ─── DATOS ───────────────────────────────────────────────────────────────────
const PANDI_STATES = [
  { id:'energized', label:'En forma', dot:'🟢', aura:['#2EC4B6','#4AE8D8'], glow:'rgba(46,196,182,0.5)', msg:'Hoy tienes energía para todo.', bg:'linear-gradient(160deg,#e0fffe,#f0fff8,#e8f5ff)', particle:'#2EC4B6', avatar:'/panda/avatar_happy.png', coachMsg:'Llevas 3 días con macros perfectos. Hoy es día de fuerza — tu cuerpo está listo.' },
  { id:'focused',   label:'Moderado', dot:'🟡', aura:['#F59E0B','#FCD34D'], glow:'rgba(245,158,11,0.5)',  msg:'Ritmo moderado. Ajustando tu plan.', bg:'linear-gradient(160deg,#fffbeb,#fef9e7,#fff8e1)', particle:'#F59E0B', avatar:'/panda/avatar_thinking.png', coachMsg:'Tu sueño fue corto anoche. Te propongo una sesión de movilidad en lugar de HIIT hoy.' },
  { id:'recovering',label:'Descansando',dot:'🔴', aura:['#FF8FA3','#FFB3C6'], glow:'rgba(255,143,163,0.5)', msg:'Hoy el descanso ES el entrenamiento.', bg:'linear-gradient(160deg,#fff0f3,#fff5f7,#fce4ec)', particle:'#FF8FA3', avatar:'/panda/avatar_sleep.png', coachMsg:'3 días con RPE alto. Pandi activa protocolo de recuperación. 45 min de estiramientos.' },
]

const SECTIONS = [
  { id:'sanctuary', emoji:'🏠', label:'Santuario', title:'Tu espejo biológico vivo', desc:'El Santuario refleja tu estado real. Descansa bien y Pandi brilla. Sobreentrénate y Pandi lo muestra. No es una mascota — eres tú.', avatar:'/panda/avatar_happy.png', color:'#2EC4B6', bg:'linear-gradient(135deg,#e0fffe,#f0fff8)', stats:[{e:'🟢',l:'Estado',v:'En forma'},{e:'✨',l:'Aura',v:'Energizada'},{e:'🎯',l:'Nivel',v:'5'}] },
  { id:'nutrition',  emoji:'🍎', label:'Nutrición', title:'Come con inteligencia clínica', desc:'Pandi sabe que tomas Ozempic, que tu ferritina está baja y que trabajas de noche. Tus macros se adaptan a tu realidad.', avatar:'/panda/avatar_coach.png', color:'#F97316', bg:'linear-gradient(135deg,#fff7ed,#ffedd5)', stats:[{e:'🔥',l:'Calorías',v:'1,240/1,800'},{e:'💪',l:'Proteína',v:'78/150g'},{e:'⚡',l:'Energía',v:'Óptima'}] },
  { id:'workout',    emoji:'💪', label:'Entrena', title:'El coach que te para cuando toca', desc:'Semáforo en rojo = Pandi bloquea el entreno intenso y te manda a movilidad. No es debilidad — es estrategia de rendimiento.', avatar:'/panda/encourage_1.png', color:'#6366F1', bg:'linear-gradient(135deg,#eef2ff,#e0e7ff)', stats:[{e:'🏋️',l:'Volumen',v:'4,200 kg'},{e:'🔥',l:'Quemadas',v:'380 kcal'},{e:'📈',l:'PRs',v:'3 esta semana'}] },
  { id:'sleep',      emoji:'😴', label:'Sueño', title:'Sin sueño, Pandi se apaga', desc:'El sueño alimenta el aura de Pandi. Cada hora que duermes bien se refleja en su brillo. El Coach ajusta tu plan según cómo dormiste.', avatar:'/panda/avatar_sleep.png', color:'#818CF8', bg:'linear-gradient(135deg,#f5f3ff,#ede9fe)', stats:[{e:'😴',l:'Anoche',v:'7.5h'},{e:'⭐',l:'Calidad',v:'4/5'},{e:'📊',l:'Media',v:'7.2h'}] },
  { id:'mood',       emoji:'🧘', label:'Bienestar', title:'Tu ánimo cambia el santuario', desc:'Un día difícil oscurece el ambiente de Pandi. Un día genial lo ilumina. Respiración, meditación y hábitos — todo conectado.', avatar:'/panda/avatar_love.png', color:'#EC4899', bg:'linear-gradient(135deg,#fdf2f8,#fce7f3)', stats:[{e:'😊',l:'Ánimo',v:'Bien'},{e:'🧘',l:'Meditación',v:'5 min'},{e:'⚡',l:'Hábitos',v:'4/5'}] },
  { id:'coach',      emoji:'🤖', label:'Coach IA', title:'Ve todo. Sabe todo. Actúa.', desc:'El Coach ve tu santuario, tus macros, tu sueño y tu ánimo en tiempo real. No espera a que preguntes — actúa antes de que lo necesites.', avatar:'/panda/coach_explain_1.png', color:'#2EC4B6', bg:'linear-gradient(135deg,#f0fffe,#e0fffe)', stats:[{e:'🧠',l:'Contexto',v:'Completo'},{e:'💬',l:'Mensajes',v:'Ilimitados'},{e:'⚡',l:'Respuesta',v:'Instantánea'}] },
]

const PARTICLES = Array.from({length:10},(_,i)=>{
  const a=(i/10)*Math.PI*2, r=100+(i%4)*12
  return { x:Math.cos(a)*r, y:Math.sin(a)*r, size:2.5+(i%3)*1.5, delay:i*0.2 }
})

const FAQS = [
  { q:'¿En qué se diferencia Pandi de MyFitnessPal?', a:'Pandi usa tu perfil clínico completo — tratamientos médicos, analíticas, horarios laborales y sueño — para darte recomendaciones contextualizadas. No es un contador de calorías, es un coach que te conoce.' },
  { q:'¿Mis datos médicos están seguros?', a:'Sí. Datos cifrados en reposo y en tránsito. Cumplimos RGPD. Nunca vendemos ni compartimos tus datos.' },
  { q:'¿Sustituye al médico o nutricionista?', a:'No. Pandi es una herramienta de apoyo. Las recomendaciones son orientativas y complementan — no sustituyen — el consejo profesional.' },
  { q:'¿Puedo usarlo si tengo tratamientos médicos?', a:'Sí, y de hecho es donde más brilla. Registra tus tratamientos (GLP-1, tiroides, anticonceptivos…) y el Coach los tendrá en cuenta.' },
  { q:'¿Cómo funciona el período de prueba?', a:'7 días Premium completos sin tarjeta. Al finalizar, elige Premium o continúa con el plan gratuito.' },
]

// ─── COMPONENTES BASE ─────────────────────────────────────────────────────────

function PandiImg({ src, size=80, fallback='🐼' }) {
  const [err,setErr]=useState(false)
  if(err) return <span style={{fontSize:size*.6,display:'flex',alignItems:'center',justifyContent:'center',width:size,height:size}}>{fallback}</span>
  return <img src={src} alt="Pandi" style={{width:size,height:size,objectFit:'contain'}} onError={()=>setErr(true)} />
}

function AuraParticles({ color }) {
  return PARTICLES.map((p,i)=>(
    <motion.div key={i}
      style={{ position:'absolute',left:'50%',top:'50%',width:p.size,height:p.size,borderRadius:'50%',background:color,marginLeft:-p.size/2,marginTop:-p.size/2,boxShadow:`0 0 ${p.size*2}px ${color}` }}
      animate={{ x:[p.x*.8,p.x*1.1,p.x*.9,p.x], y:[p.y*.8,p.y*1.1,p.y*.9,p.y], opacity:[.25,.7,.4,.25], scale:[1,1.3,.9,1] }}
      transition={{ duration:3.5+(i%3)*.5, delay:p.delay, repeat:Infinity, ease:'easeInOut' }} />
  ))
}

function PandiOrb({ state, size=160 }) {
  const r = size/2
  return (
    <div style={{ position:'relative',width:size,height:size,display:'flex',alignItems:'center',justifyContent:'center' }}>
      {[1,2,3].map(ring=>(
        <motion.div key={ring}
          style={{ position:'absolute',width:r*0.7+ring*r*0.22,height:r*0.7+ring*r*0.22,borderRadius:'50%',border:`${3-ring*.5}px solid ${state.aura[0]}` }}
          animate={{ scale:[1,1.07,1], opacity:[.25/ring,.4/ring,.25/ring] }}
          transition={{ duration:2.5+ring*.5,repeat:Infinity,ease:'easeInOut',delay:ring*.3 }} />
      ))}
      <AuraParticles color={state.particle} />
      <motion.div style={{ position:'absolute',width:r*.9,height:r*.9,borderRadius:'50%',background:`radial-gradient(circle,${state.glow} 0%,transparent 70%)`,filter:'blur(16px)' }}
        animate={{ scale:[1,1.15,1],opacity:[.5,.9,.5] }} transition={{ duration:3,repeat:Infinity,ease:'easeInOut' }} />
      <motion.div style={{ position:'relative',zIndex:2,width:r*.85,height:r*.85,borderRadius:'50%',background:'white',boxShadow:`0 0 30px ${state.glow},0 6px 24px rgba(0,0,0,.1)`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden' }}
        animate={{ y:[0,-5,0] }} transition={{ duration:4,repeat:Infinity,ease:'easeInOut' }}>
        <AnimatePresence mode="wait">
          <motion.div key={state.avatar} initial={{opacity:0,scale:.85}} animate={{opacity:1,scale:1}} exit={{opacity:0,scale:.85}} transition={{duration:.4}}
            style={{width:'100%',height:'100%',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <PandiImg src={state.avatar} size={r*.7} />
          </motion.div>
        </AnimatePresence>
      </motion.div>
      <div style={{ position:'absolute',bottom:-14,left:'50%',transform:'translateX(-50%)',background:'white',borderRadius:20,padding:'4px 12px',fontSize:10,fontWeight:700,color:C.text,whiteSpace:'nowrap',boxShadow:'0 4px 14px rgba(0,0,0,.1)',border:`1.5px solid ${state.aura[0]}40`,zIndex:3 }}>
        {state.dot} {state.label}
      </div>
    </div>
  )
}

// ─── CHAT ANIMADO ─────────────────────────────────────────────────────────────
function LiveChat({ state }) {
  const [step,setStep]=useState(0)
  const msgs = [
    { user:true,  text:'Tengo mucha ansiedad y no sé qué cenar.' },
    { user:false, text:state.coachMsg },
    { user:true,  text:'¿Y si no tengo tiempo?' },
    { user:false, text:'10 min son suficientes. Te mando la rutina ahora mismo 💪' },
  ]

  useEffect(()=>{ setStep(0); const t=setInterval(()=>setStep(s=>s<msgs.length-1?s+1:s),1800); return()=>clearInterval(t) },[state.id])

  return (
    <div style={{ background:'white',borderRadius:24,border:`1px solid ${C.border}`,boxShadow:'0 16px 64px rgba(0,0,0,.1)',overflow:'hidden',width:'100%',maxWidth:360 }}>
      {/* Header */}
      <div style={{ padding:'14px 18px',borderBottom:`1px solid ${C.border}`,background:C.surface,display:'flex',alignItems:'center',gap:12 }}>
        <div style={{ width:38,height:38,borderRadius:12,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0 }}>
          <PandiImg src="/panda/avatar_happy.png" size={30} />
        </div>
        <div style={{flex:1}}>
          <p style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>Pandi</p>
          <div style={{display:'flex',alignItems:'center',gap:5}}>
            <motion.div animate={{opacity:[1,.3,1]}} transition={{duration:1.5,repeat:Infinity}}
              style={{width:6,height:6,borderRadius:'50%',background:'#22C55E'}} />
            <p style={{fontSize:10,color:C.muted,margin:0}}>Ve lo que haces ahora mismo</p>
          </div>
        </div>
        <div style={{padding:'4px 10px',borderRadius:12,background:`${state.aura[0]}20`,border:`1px solid ${state.aura[0]}40`,fontSize:10,fontWeight:700,color:state.aura[0]}}>
          {state.dot} {state.label}
        </div>
      </div>
      {/* Mensajes */}
      <div style={{padding:'16px',display:'flex',flexDirection:'column',gap:10,minHeight:200}}>
        {msgs.slice(0,step+1).map((m,i)=>(
          <motion.div key={i} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{duration:.3}}
            style={{display:'flex',justifyContent:m.user?'flex-end':'flex-start'}}>
            {!m.user && <div style={{width:26,height:26,borderRadius:8,background:`${C.primary}20`,display:'flex',alignItems:'center',justifyContent:'center',marginRight:8,flexShrink:0,alignSelf:'flex-end'}}>
              <PandiImg src="/panda/avatar_happy.png" size={20} />
            </div>}
            <div style={{ maxWidth:'78%',padding:'9px 13px',borderRadius:16,fontSize:13,lineHeight:1.5,background:m.user?C.primary:'#F5F7FA',color:m.user?'#fff':C.text,borderBottomRightRadius:m.user?3:16,borderBottomLeftRadius:m.user?16:3 }}>
              {m.text}
            </div>
          </motion.div>
        ))}
        {step < msgs.length-1 && (
          <motion.div initial={{opacity:0}} animate={{opacity:1}} style={{display:'flex',gap:4,paddingLeft:34}}>
            {[0,1,2].map(i=>(
              <motion.div key={i} animate={{y:[0,-4,0]}} transition={{duration:.6,repeat:Infinity,delay:i*.15}}
                style={{width:6,height:6,borderRadius:'50%',background:C.primary}} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  )
}

// ─── CARRUSEL ─────────────────────────────────────────────────────────────────
function SectionCarousel() {
  const [active,setActive]=useState(0)
  const timer=useRef(null)
  const s=SECTIONS[active]

  function go(i){ clearInterval(timer.current); setActive((i+SECTIONS.length)%SECTIONS.length); timer.current=setInterval(()=>setActive(x=>(x+1)%SECTIONS.length),4500) }
  useEffect(()=>{ timer.current=setInterval(()=>setActive(i=>(i+1)%SECTIONS.length),4500); return()=>clearInterval(timer.current) },[])

  return (
    <div style={{width:'100%'}}>
      <div style={{position:'relative',borderRadius:28,overflow:'hidden',boxShadow:'0 20px 80px rgba(0,0,0,.12)'}}>
        <AnimatePresence mode="wait">
          <motion.div key={s.id} initial={{opacity:0,x:50}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-50}} transition={{duration:.35,ease:'easeInOut'}}
            style={{background:s.bg,padding:'32px 28px 24px',minHeight:280}}>
            <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:20}}>
              <div style={{width:46,height:46,borderRadius:14,background:`${s.color}20`,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>{s.emoji}</div>
              <div>
                <p style={{fontSize:11,fontWeight:800,color:s.color,margin:0,textTransform:'uppercase',letterSpacing:'.08em'}}>{s.label}</p>
                <p style={{fontSize:18,fontWeight:900,color:C.text,margin:'2px 0 0',lineHeight:1.15,letterSpacing:'-.02em'}}>{s.title}</p>
              </div>
            </div>
            <div style={{display:'flex',gap:18,alignItems:'flex-start',marginBottom:22}}>
              <div style={{width:80,height:80,borderRadius:'50%',background:`${s.color}15`,border:`2px solid ${s.color}25`,display:'flex',alignItems:'center',justifyContent:'center',overflow:'hidden',flexShrink:0}}>
                <PandiImg src={s.avatar} size={66} />
              </div>
              <p style={{fontSize:14,color:C.muted,lineHeight:1.65,margin:0,flex:1}}>{s.desc}</p>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:10}}>
              {s.stats.map(st=>(
                <div key={st.l} style={{background:'rgba(255,255,255,.75)',borderRadius:16,padding:'12px 10px',textAlign:'center',border:`1px solid ${s.color}20`,backdropFilter:'blur(8px)'}}>
                  <p style={{fontSize:18,margin:'0 0 3px'}}>{st.e}</p>
                  <p style={{fontSize:13,fontWeight:800,color:C.text,margin:0}}>{st.v}</p>
                  <p style={{fontSize:10,color:C.muted,margin:'2px 0 0'}}>{st.l}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </AnimatePresence>
        {[[-1,'left'],[1,'right']].map(([dir,side])=>(
          <button key={side} onClick={()=>go(active+dir)} style={{position:'absolute',[side]:10,top:'50%',transform:'translateY(-50%)',width:34,height:34,borderRadius:'50%',border:'none',background:'rgba(255,255,255,.92)',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'0 2px 12px rgba(0,0,0,.1)',zIndex:2}}>
            {dir===-1?<ChevronLeft size={16} color={C.muted}/>:<ChevronRight size={16} color={C.muted}/>}
          </button>
        ))}
        <div style={{position:'absolute',bottom:0,left:0,right:0,height:3,background:'rgba(0,0,0,.06)'}}>
          <motion.div key={active} initial={{width:'0%'}} animate={{width:'100%'}} transition={{duration:4.5,ease:'linear'}}
            style={{height:'100%',background:s.color}} />
        </div>
      </div>
      <div style={{display:'flex',gap:6,justifyContent:'center',marginTop:16,flexWrap:'wrap'}}>
        {SECTIONS.map((sec,i)=>(
          <button key={sec.id} onClick={()=>go(i)} style={{display:'flex',alignItems:'center',gap:5,padding:active===i?'7px 16px':'7px 12px',borderRadius:22,border:`2px solid ${active===i?sec.color:C.border}`,background:active===i?`${sec.color}15`:'rgba(255,255,255,.8)',color:active===i?sec.color:C.muted,fontSize:12,fontWeight:700,cursor:'pointer',transition:'all .25s'}}>
            <span style={{fontSize:14}}>{sec.emoji}</span>
            {active===i&&<span>{sec.label}</span>}
          </button>
        ))}
      </div>
    </div>
  )
}

// ─── SEMÁFORO VISUAL ──────────────────────────────────────────────────────────
function RecoveryLight({ state }) {
  return (
    <div style={{display:'flex',flexDirection:'column',gap:8,alignItems:'center'}}>
      {['🟢','🟡','🔴'].map((dot,i)=>{
        const active = (i===0&&state.id==='energized')||(i===1&&state.id==='focused')||(i===2&&state.id==='recovering')
        const colors = ['#2EC4B6','#F59E0B','#FF8FA3']
        return (
          <motion.div key={i}
            animate={{ scale:active?[1,1.2,1]:1, opacity:active?1:.25, boxShadow:active?`0 0 20px ${colors[i]},0 0 40px ${colors[i]}40`:'none' }}
            transition={{ duration:1.5,repeat:active?Infinity:0,ease:'easeInOut' }}
            style={{ width:20,height:20,borderRadius:'50%',background:colors[i] }} />
        )
      })}
    </div>
  )
}

// ─── CONTADOR ANIMADO ─────────────────────────────────────────────────────────
function AnimatedNumber({ value, suffix='' }) {
  const [display,setDisplay]=useState(0)
  useEffect(()=>{
    let start=0; const end=parseInt(value); const dur=1500; const step=dur/end
    const t=setInterval(()=>{ start+=Math.ceil(end/60); if(start>=end){setDisplay(end);clearInterval(t)}else setDisplay(start) },step>16?step:16)
    return()=>clearInterval(t)
  },[value])
  return <span>{display.toLocaleString()}{suffix}</span>
}

// ─── LANDING PRINCIPAL ────────────────────────────────────────────────────────
export default function Landing() {
  const [stateIdx,setStateIdx]=useState(0)
  const [openFaq,setOpenFaq]=useState(null)
  const state=PANDI_STATES[stateIdx]
  const heroRef=useRef(null)

  useEffect(()=>{ const t=setInterval(()=>setStateIdx(i=>(i+1)%PANDI_STATES.length),5000); return()=>clearInterval(t) },[])

  return (
    <div style={{background:C.bg,color:C.text,fontFamily:"'Outfit',system-ui,sans-serif",overflowX:'hidden'}}>

      {/* ── NAV ─────────────────────────────────────────────────────────────── */}
      <nav style={{position:'sticky',top:0,zIndex:100,background:'rgba(255,255,255,.92)',backdropFilter:'blur(20px)',borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',padding:'0 1.5rem',height:64,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
          <div style={{display:'flex',alignItems:'center',gap:10}}>
            <div style={{width:36,height:36,borderRadius:10,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center'}}>
              <PandiImg src="/panda/avatar_happy.png" size={28} />
            </div>
            <div>
              <span style={{fontWeight:900,fontSize:16,color:C.text,letterSpacing:'-.02em'}}>Pandi</span>
              <span style={{fontSize:10,color:C.muted,display:'block',lineHeight:1,marginTop:-1}}>Health Coach</span>
            </div>
          </div>
          <div style={{display:'none',gap:32}} className="nav-links">
            {[['Producto','#producto'],['Cómo funciona','#como-funciona'],['Beneficios','#beneficios'],['Precio','#precio']].map(([l,h])=>(
              <a key={l} href={h} style={{fontSize:14,fontWeight:500,color:C.muted,textDecoration:'none'}}>{l}</a>
            ))}
          </div>
          <div style={{display:'flex',alignItems:'center',gap:12}}>
            <Link to="/auth" style={{fontSize:14,fontWeight:500,color:C.muted,textDecoration:'none'}}>Iniciar sesión</Link>
            <Link to="/auth" style={{display:'flex',alignItems:'center',gap:6,padding:'9px 20px',borderRadius:14,background:C.grad,color:'#fff',fontWeight:700,fontSize:14,textDecoration:'none',boxShadow:`0 4px 20px ${C.primary}40`}}>
              Empieza gratis <ArrowRight size={14}/>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ─────────────────────────────────────────────────────────────── */}
      <section ref={heroRef} style={{position:'relative',overflow:'hidden',minHeight:'100vh',display:'flex',alignItems:'center'}}>
        <AnimatePresence mode="wait">
          <motion.div key={state.id} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} transition={{duration:1.8}}
            style={{position:'absolute',inset:0,background:state.bg,zIndex:0}} />
        </AnimatePresence>
        <motion.div animate={{x:[0,40,0],y:[0,-25,0]}} transition={{duration:10,repeat:Infinity,ease:'easeInOut'}}
          style={{position:'absolute',top:'-15%',right:'-8%',width:700,height:700,borderRadius:'50%',background:`radial-gradient(circle,${state.aura[0]}18 0%,transparent 65%)`,filter:'blur(70px)',zIndex:0}} />
        <motion.div animate={{x:[0,-25,0],y:[0,35,0]}} transition={{duration:12,repeat:Infinity,ease:'easeInOut',delay:1.5}}
          style={{position:'absolute',bottom:'-15%',left:'-8%',width:600,height:600,borderRadius:'50%',background:`radial-gradient(circle,${C.pink}12 0%,transparent 65%)`,filter:'blur(70px)',zIndex:0}} />

        <div style={{maxWidth:1200,margin:'0 auto',padding:'5rem 1.5rem 4rem',position:'relative',zIndex:1,width:'100%'}}>
          <div className="hero-grid" style={{display:'grid',gridTemplateColumns:'1fr',gap:60,alignItems:'center'}}>

            {/* LEFT */}
            <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center'}} className="hero-left">

              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.1}}
                style={{display:'inline-flex',alignItems:'center',gap:6,padding:'7px 18px',borderRadius:22,background:`${C.primary}12`,border:`1px solid ${C.primary}25`,fontSize:12,fontWeight:700,color:C.primary,marginBottom:28}}>
                <Zap size={12}/> Tu salud. Entendida.
              </motion.div>

              <motion.h1 initial={{opacity:0,y:30}} animate={{opacity:1,y:0}} transition={{delay:.2,duration:.7}}
                style={{margin:'0 0 24px',letterSpacing:'-.04em',lineHeight:.92}}>
                <span style={{display:'block',fontSize:'clamp(2.8rem,8vw,5.5rem)',fontWeight:900,color:C.text}}>
                  Pandi no registra
                </span>
                <span style={{display:'block',fontSize:'clamp(2.8rem,8vw,5.5rem)',fontWeight:900,color:C.text}}>
                  tu salud.
                </span>
                <span style={{display:'block',fontSize:'clamp(2.8rem,8vw,5.5rem)',fontWeight:900,background:C.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>
                  La vive contigo.
                </span>
              </motion.h1>

              <motion.p initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{delay:.35}}
                style={{fontSize:'clamp(1rem,1.8vw,1.15rem)',color:C.muted,lineHeight:1.75,margin:'0 0 28px',maxWidth:520}}>
                Entiende tu alimentación, sueño, energía y hábitos con recomendaciones que realmente encajan en tu vida.
              </motion.p>

              {/* Semáforo en vivo */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.45}}
                style={{display:'flex',alignItems:'center',gap:20,padding:'14px 24px',borderRadius:20,background:'rgba(255,255,255,.85)',border:`1px solid ${C.border}`,marginBottom:32,boxShadow:'0 4px 24px rgba(0,0,0,.06)'}}>
                <RecoveryLight state={state} />
                <div>
                  <p style={{fontSize:11,color:C.muted,margin:'0 0 2px',fontWeight:600,textTransform:'uppercase',letterSpacing:'.06em'}}>Semáforo de recuperación</p>
                  <AnimatePresence mode="wait">
                    <motion.p key={state.id} initial={{opacity:0,y:4}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-4}}
                      style={{fontSize:14,fontWeight:700,color:C.text,margin:0}}>
                      {state.msg}
                    </motion.p>
                  </AnimatePresence>
                </div>
              </motion.div>

              {/* Pandi orb */}
              <motion.div initial={{opacity:0,scale:.8}} animate={{opacity:1,scale:1}} transition={{delay:.3,duration:.7}} style={{marginBottom:24}}>
                <PandiOrb state={state} size={180} />
              </motion.div>

              {/* Selector */}
              <motion.div initial={{opacity:0}} animate={{opacity:1}} transition={{delay:.5}}
                style={{display:'flex',gap:8,justifyContent:'center',flexWrap:'wrap',marginBottom:36}}>
                {PANDI_STATES.map((s,i)=>(
                  <button key={s.id} onClick={()=>setStateIdx(i)} style={{padding:'8px 18px',borderRadius:22,cursor:'pointer',border:`2px solid ${stateIdx===i?s.aura[0]:C.border}`,background:stateIdx===i?`${s.aura[0]}15`:'rgba(255,255,255,.85)',color:stateIdx===i?s.aura[0]:C.muted,fontSize:12,fontWeight:700,transition:'all .2s'}}>
                    {s.dot} {s.label}
                  </button>
                ))}
              </motion.div>

              {/* CTAs */}
              <motion.div initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:.55}}
                style={{display:'flex',flexDirection:'column',alignItems:'center',gap:12}}>
                <div style={{display:'flex',gap:12,flexWrap:'wrap',justifyContent:'center'}}>
                  <Link to="/auth" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'16px 32px',borderRadius:18,background:C.grad,color:'#fff',fontWeight:800,fontSize:16,textDecoration:'none',boxShadow:`0 8px 32px ${C.primary}45`,letterSpacing:'-.01em'}}>
                    Dale vida a tu Pandi <ArrowRight size={17}/>
                  </Link>
                  <a href="#como-funciona" style={{display:'inline-flex',alignItems:'center',padding:'16px 24px',borderRadius:18,background:'rgba(255,255,255,.85)',border:`1.5px solid ${C.border}`,color:C.text,fontWeight:600,fontSize:15,textDecoration:'none'}}>
                    Ver cómo funciona
                  </a>
                </div>
                <p style={{fontSize:11,color:C.light,margin:0}}>✓ 7 días Premium gratis &nbsp;·&nbsp; ✓ Sin tarjeta &nbsp;·&nbsp; ✓ Cancela cuando quieras</p>
              </motion.div>
            </div>

            {/* RIGHT — Chat animado + Carrusel */}
            <motion.div initial={{opacity:0,x:40}} animate={{opacity:1,x:0}} transition={{delay:.4,duration:.8}}
              style={{display:'flex',flexDirection:'column',gap:28,alignItems:'center'}} className="hero-right">
              <LiveChat state={state} />
              <SectionCarousel />
            </motion.div>

          </div>
        </div>
      </section>

      {/* ── STATS ────────────────────────────────────────────────────────────── */}
      <section style={{background:C.surface,padding:'3rem 1.5rem',borderTop:`1px solid ${C.border}`,borderBottom:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1200,margin:'0 auto',display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:24}} className="stats-grid">
          {[{v:'500',s:'+',l:'usuarios en beta',e:'👥'},{v:'4',s:'.9★',l:'valoración media',e:'⭐'},{v:'4',s:'.8kg',l:'pérdida media en 90 días',e:'⚖️'},{v:'94',s:'%',l:'mejoran hábitos en 30 días',e:'📈'}].map(({v,s,l,e})=>(
            <div key={l} style={{textAlign:'center',padding:'24px 16px',borderRadius:20,background:'white',border:`1px solid ${C.border}`}}>
              <p style={{fontSize:28,margin:'0 0 4px'}}>{e}</p>
              <p style={{fontSize:28,fontWeight:900,color:C.primary,margin:'0 0 4px',letterSpacing:'-.02em'}}>
                <AnimatedNumber value={parseInt(v)} />{s}
              </p>
              <p style={{fontSize:12,color:C.muted,margin:0}}>{l}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── PROBLEMA ─────────────────────────────────────────────────────────── */}
      <section style={{padding:'6rem 1.5rem'}} id="producto">
        <div style={{maxWidth:1000,margin:'0 auto',textAlign:'center'}}>
          <motion.div initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}>
            <p style={{fontSize:12,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:16}}>El problema</p>
            <h2 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:900,color:C.text,margin:'0 0 16px',letterSpacing:'-.03em',lineHeight:1.1}}>
              La mayoría de apps te muestran datos.<br/>
              <span style={{background:C.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>Pandi te da respuestas.</span>
            </h2>
            <p style={{fontSize:16,color:C.muted,margin:'0 0 56px',lineHeight:1.7}}>Todas calculan calorías. Ninguna sabe que tomas Levotiroxina, trabajas de noche o que tu ferritina está baja.</p>
          </motion.div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(1,1fr)',gap:20}} className="problems-grid">
            {[
              {emoji:'🤖',title:'Consejos de copia-pega',desc:'"Come 2.000 kcal y haz ejercicio." El mismo plan para todos, sin importar quién eres.'},
              {emoji:'📊',title:'Datos sin contexto',desc:'Gráficas bonitas que no te dicen qué hacer. Información sin acción no es coaching.'},
              {emoji:'🏥',title:'Ignoran tu salud clínica',desc:'Tu tiroides, tus analíticas, tus tratamientos. Ninguna app los tiene en cuenta. Hasta ahora.'},
            ].map(({emoji,title,desc})=>(
              <motion.div key={title} initial={{opacity:0,y:20}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
                style={{borderRadius:24,padding:'28px',textAlign:'left',background:C.surface,border:`1px solid ${C.border}`}}>
                <span style={{fontSize:36,marginBottom:16,display:'block'}}>{emoji}</span>
                <p style={{fontSize:17,fontWeight:800,color:C.text,margin:'0 0 8px',letterSpacing:'-.02em'}}>{title}</p>
                <p style={{fontSize:14,color:C.muted,lineHeight:1.65,margin:0}}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CÓMO FUNCIONA ────────────────────────────────────────────────────── */}
      <section id="como-funciona" style={{background:C.surface,padding:'6rem 1.5rem',borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:56}}>
            <p style={{fontSize:12,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:16}}>Cómo funciona</p>
            <h2 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:900,color:C.text,margin:'0 0 16px',letterSpacing:'-.03em'}}>En marcha en menos de 2 minutos</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(1,1fr)',gap:24}} className="steps-grid">
            {[
              {n:'01',icon:'🐣',title:'Dale vida a tu Pandi',desc:'Calibramos tu perfil: altura, peso, objetivo, horarios, restricciones y tratamientos. Pandi nace reflejando quién eres.'},
              {n:'02',icon:'🧠',title:'Pandi aprende a conocerte',desc:'La IA calcula tu TDEE, macros óptimos y Pandi adopta tu estado biológico desde el primer registro.'},
              {n:'03',icon:'🚀',title:'Crecéis juntos cada día',desc:'Registra, entrena, duerme. Pandi analiza tus patrones y su estado refleja tu progreso real en tiempo real.'},
            ].map(({n,icon,title,desc},i)=>(
              <motion.div key={n} initial={{opacity:0,x:-20}} whileInView={{opacity:1,x:0}} viewport={{once:true}} transition={{delay:i*.15}}
                style={{display:'flex',gap:20,alignItems:'flex-start',padding:'28px',borderRadius:24,background:'white',border:`1px solid ${C.border}`}}>
                <div style={{width:52,height:52,borderRadius:16,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22,flexShrink:0}}>
                  {icon}
                </div>
                <div>
                  <p style={{fontSize:11,fontWeight:800,color:C.primary,margin:'0 0 4px',textTransform:'uppercase',letterSpacing:'.06em'}}>Paso {n}</p>
                  <p style={{fontSize:17,fontWeight:800,color:C.text,margin:'0 0 8px',letterSpacing:'-.02em'}}>{title}</p>
                  <p style={{fontSize:14,color:C.muted,lineHeight:1.65,margin:0}}>{desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── BENEFICIOS ───────────────────────────────────────────────────────── */}
      <section id="beneficios" style={{padding:'6rem 1.5rem'}}>
        <div style={{maxWidth:1000,margin:'0 auto',textAlign:'center'}}>
          <p style={{fontSize:12,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:16}}>Beneficios</p>
          <h2 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:900,color:C.text,margin:'0 0 56px',letterSpacing:'-.03em'}}>Lo que sentirás en tu día a día</h2>
          <div style={{display:'grid',gridTemplateColumns:'repeat(2,1fr)',gap:16}} className="benefits-grid">
            {[
              {e:'⚡',title:'Más energía constante',desc:'Sin picos ni bajones. Tu plan nutricional y de descanso se optimiza para tu ritmo real.'},
              {e:'🧘',title:'Mejores hábitos sin obsesión',desc:'Sin contar calorías ni pesarte cada día. Hábitos que se integran en tu vida, no que la controlan.'},
              {e:'🧠',title:'Menos estrés al decidir',desc:'El Coach te dice qué hacer y cuándo. Sin parálisis de análisis ni culpa.'},
              {e:'💪',title:'Rendimiento sin sobreentrenamiento',desc:'El semáforo de recuperación garantiza que cada sesión sea la correcta para ese día.'},
              {e:'🔬',title:'Claridad sobre tu salud',desc:'Tus analíticas, tratamientos y síntomas integrados en un sistema que los entiende.'},
              {e:'🏆',title:'Resultados reales a largo plazo',desc:'No en 30 días. En meses de consistencia guiada. Es un sistema, no una dieta.'},
            ].map(({e,title,desc})=>(
              <motion.div key={title} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
                style={{padding:'24px',borderRadius:20,background:C.surface,border:`1px solid ${C.border}`,textAlign:'left'}}>
                <p style={{fontSize:28,margin:'0 0 12px'}}>{e}</p>
                <p style={{fontSize:15,fontWeight:800,color:C.text,margin:'0 0 6px',letterSpacing:'-.02em'}}>{title}</p>
                <p style={{fontSize:13,color:C.muted,lineHeight:1.6,margin:0}}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── TESTIMONIOS ──────────────────────────────────────────────────────── */}
      <section style={{background:C.surface,padding:'6rem 1.5rem',borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:1000,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <p style={{fontSize:12,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:16}}>Testimonios</p>
            <h2 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:900,color:C.text,margin:0,letterSpacing:'-.03em'}}>Personas reales. Resultados reales.</h2>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(1,1fr)',gap:20}} className="testimonials-grid">
            {[
              {name:'Laura M.',role:'Enfermera, turno nocturno',avatar:'👩‍⚕️',text:'Por fin una app que entiende que trabajo de noche. El Coach adapta mis recomendaciones a mis turnos. 8 semanas y he perdido 3.2kg sin pasar hambre.'},
              {name:'Carlos R.',role:'Lleva Ozempic desde enero',avatar:'👨',text:'Con el GLP-1 mi apetito cayó mucho. El Coach tiene en cuenta el tratamiento y me ayuda a priorizar proteína. He ganado músculo mientras perdía grasa.'},
              {name:'Ana T.',role:'Tiroides, analíticas irregulares',avatar:'👩',text:'Subí mis analíticas y la IA detectó ferritina baja y vitamina D escasa. Me dio recomendaciones específicas que mi médica validó.'},
            ].map(({name,role,avatar,text})=>(
              <motion.div key={name} initial={{opacity:0,y:16}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
                style={{borderRadius:24,padding:'28px',background:'white',border:`1px solid ${C.border}`}}>
                <div style={{display:'flex',gap:2,marginBottom:16}}>
                  {[...Array(5)].map((_,i)=><Star key={i} size={14} fill={C.primary} style={{color:C.primary}}/>)}
                </div>
                <p style={{fontSize:15,color:C.text,lineHeight:1.7,margin:'0 0 20px'}}>"{text}"</p>
                <div style={{display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:12,background:C.surface2,display:'flex',alignItems:'center',justifyContent:'center',fontSize:22}}>{avatar}</div>
                  <div>
                    <p style={{fontWeight:700,fontSize:14,color:C.text,margin:0}}>{name}</p>
                    <p style={{fontSize:12,color:C.muted,margin:'2px 0 0'}}>{role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PRICING ──────────────────────────────────────────────────────────── */}
      <section id="precio" style={{padding:'6rem 1.5rem'}}>
        <div style={{maxWidth:800,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <p style={{fontSize:12,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:16}}>Precio</p>
            <h2 style={{fontSize:'clamp(1.8rem,4vw,2.8rem)',fontWeight:900,color:C.text,margin:'0 0 12px',letterSpacing:'-.03em'}}>Empieza gratis. Evoluciona cuando quieras.</h2>
            <p style={{fontSize:15,color:C.muted,margin:0}}>Sin compromisos. Sin letra pequeña.</p>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr',gap:20}} className="pricing-grid">
            <div style={{borderRadius:24,padding:'32px',background:'white',border:`1px solid ${C.border}`}}>
              <p style={{fontWeight:800,fontSize:18,color:C.text,margin:'0 0 4px'}}>Gratuito</p>
              <p style={{fontSize:36,fontWeight:900,color:C.text,margin:'0 0 4px',letterSpacing:'-.03em'}}>0€</p>
              <p style={{fontSize:13,color:C.muted,margin:'0 0 28px'}}>Para siempre</p>
              {['Diario nutricional manual','Coach IA (10 mensajes/día)','Entrenamiento básico','Sueño, ánimo e hidratación','Mascota Pandi'].map(f=>(
                <div key={f} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:`${C.primary}20`,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Check size={11} style={{color:C.primary}}/>
                  </div>
                  <p style={{fontSize:14,color:C.text,margin:0}}>{f}</p>
                </div>
              ))}
              <Link to="/auth" style={{display:'block',width:'100%',textAlign:'center',padding:'14px',borderRadius:14,background:C.surface2,border:`1px solid ${C.border}`,color:C.text,fontWeight:700,fontSize:15,textDecoration:'none',marginTop:24,boxSizing:'border-box'}}>Empezar gratis</Link>
            </div>
            <div style={{borderRadius:24,padding:'32px',background:C.text,border:`2px solid ${C.primary}`,position:'relative'}}>
              <div style={{position:'absolute',top:-14,left:'50%',transform:'translateX(-50%)',padding:'5px 18px',borderRadius:20,background:C.grad,color:'white',fontSize:11,fontWeight:800,whiteSpace:'nowrap'}}>MÁS POPULAR</div>
              <p style={{fontWeight:800,fontSize:18,color:'white',margin:'0 0 4px'}}>Premium</p>
              <div style={{display:'flex',alignItems:'baseline',gap:8,margin:'0 0 4px'}}>
                <p style={{fontSize:36,fontWeight:900,color:'white',margin:0,letterSpacing:'-.03em'}}>9,99€</p>
                <p style={{fontSize:14,color:'rgba(255,255,255,.5)',margin:0}}>/mes</p>
              </div>
              <p style={{fontSize:13,color:'rgba(255,255,255,.4)',margin:'0 0 28px'}}>59,99€/año · Ahorra 60%</p>
              {['Todo lo del plan gratuito','Coach IA ilimitado + contexto clínico','Análisis de foto de comida','Escáner de código de barras','Recetas personalizadas con IA','Interpretación de analíticas','Todas las mascotas desbloqueadas'].map(f=>(
                <div key={f} style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                  <div style={{width:18,height:18,borderRadius:'50%',background:C.primary,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0}}>
                    <Check size={10} color="white"/>
                  </div>
                  <p style={{fontSize:14,color:'white',margin:0}}>{f}</p>
                </div>
              ))}
              <Link to="/auth" style={{display:'block',width:'100%',textAlign:'center',padding:'14px',borderRadius:14,background:C.grad,color:'white',fontWeight:800,fontSize:15,textDecoration:'none',marginTop:24,boxSizing:'border-box',boxShadow:`0 8px 24px ${C.primary}40`}}>Probar 7 días gratis</Link>
            </div>
          </div>
          <p style={{textAlign:'center',fontSize:12,color:C.light,marginTop:16}}>El período de prueba no requiere tarjeta de crédito</p>
        </div>
      </section>

      {/* ── TRUST ────────────────────────────────────────────────────────────── */}
      <section style={{background:C.surface,padding:'4rem 1.5rem',borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:800,margin:'0 auto'}}>
          <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:24,textAlign:'center'}}>
            {[{icon:Shield,color:C.primary,title:'RGPD compliant',desc:'Datos cifrados. Nunca compartidos.'},{icon:Zap,color:'#F59E0B',title:'Siempre disponible',desc:'24/7, sin esperas.'},{icon:Heart,color:C.pink,title:'No es consejo médico',desc:'Herramienta de apoyo al bienestar.'}].map(({icon:Icon,color,title,desc})=>(
              <div key={title}>
                <div style={{width:44,height:44,borderRadius:14,background:`${color}15`,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 12px'}}>
                  <Icon size={20} style={{color}}/>
                </div>
                <p style={{fontWeight:700,fontSize:14,color:C.text,margin:'0 0 4px'}}>{title}</p>
                <p style={{fontSize:12,color:C.muted,margin:0}}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────────────── */}
      <section style={{padding:'6rem 1.5rem'}}>
        <div style={{maxWidth:700,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:48}}>
            <p style={{fontSize:12,fontWeight:800,color:C.primary,textTransform:'uppercase',letterSpacing:'.1em',marginBottom:16}}>FAQ</p>
            <h2 style={{fontSize:'clamp(1.8rem,4vw,2.4rem)',fontWeight:900,color:C.text,margin:0,letterSpacing:'-.03em'}}>Preguntas frecuentes</h2>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {FAQS.map(({q,a},i)=>(
              <div key={i} style={{borderRadius:18,overflow:'hidden',background:'white',border:`1px solid ${C.border}`}}>
                <button onClick={()=>setOpenFaq(openFaq===i?null:i)} style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',padding:'18px 22px',background:'none',border:'none',cursor:'pointer',textAlign:'left'}}>
                  <p style={{fontWeight:700,fontSize:15,color:C.text,margin:0,paddingRight:16}}>{q}</p>
                  <motion.div animate={{rotate:openFaq===i?180:0}} transition={{duration:.2}}>
                    <ChevronDown size={16} style={{color:C.muted,flexShrink:0}}/>
                  </motion.div>
                </button>
                <AnimatePresence>
                  {openFaq===i&&(
                    <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} transition={{duration:.25}}>
                      <div style={{padding:'0 22px 18px'}}>
                        <p style={{fontSize:14,color:C.muted,lineHeight:1.7,margin:0}}>{a}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA FINAL ────────────────────────────────────────────────────────── */}
      <section style={{padding:'6rem 1.5rem',background:C.surface,borderTop:`1px solid ${C.border}`}}>
        <div style={{maxWidth:700,margin:'0 auto'}}>
          <motion.div initial={{opacity:0,y:24}} whileInView={{opacity:1,y:0}} viewport={{once:true}}
            style={{borderRadius:32,padding:'56px 40px',textAlign:'center',background:C.gradSoft,border:`1px solid ${C.primary}20`,position:'relative',overflow:'hidden'}}>
            <motion.div animate={{scale:[1,1.15,1],opacity:[.15,.25,.15]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}
              style={{position:'absolute',top:'-30%',right:'-20%',width:400,height:400,borderRadius:'50%',background:`radial-gradient(circle,${C.primary}40 0%,transparent 70%)`,filter:'blur(60px)',zIndex:0}} />
            <div style={{position:'relative',zIndex:1}}>
              <div style={{width:72,height:72,borderRadius:22,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center',margin:'0 auto 24px',boxShadow:`0 8px 32px ${C.primary}40`}}>
                <PandiImg src="/panda/avatar_happy.png" size={56} />
              </div>
              <h2 style={{fontSize:'clamp(1.8rem,4vw,2.6rem)',fontWeight:900,color:C.text,margin:'0 0 16px',letterSpacing:'-.03em',lineHeight:1.1}}>
                Empieza a entender tu salud,<br/>
                <span style={{background:C.grad,WebkitBackgroundClip:'text',WebkitTextFillColor:'transparent',backgroundClip:'text'}}>un día a la vez.</span>
              </h2>
              <p style={{fontSize:16,color:C.muted,margin:'0 0 36px',lineHeight:1.7}}>Sin dietas extremas. Sin información abrumadora.<br/>Solo recomendaciones personalizadas que encajan en tu vida.</p>
              <Link to="/auth" style={{display:'inline-flex',alignItems:'center',gap:8,padding:'18px 40px',borderRadius:18,background:C.grad,color:'#fff',fontWeight:800,fontSize:17,textDecoration:'none',boxShadow:`0 12px 40px ${C.primary}45`,letterSpacing:'-.01em'}}>
                Empieza gratis ahora <ArrowRight size={18}/>
              </Link>
              <p style={{fontSize:12,color:C.light,marginTop:16}}>✓ 7 días Premium incluidos · ✓ Sin tarjeta · ✓ Cancela cuando quieras</p>
              <div style={{marginTop:20,maxWidth:340,marginLeft:'auto',marginRight:'auto'}}>
                <InstallPWA />
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── FOOTER ───────────────────────────────────────────────────────────── */}
      <footer style={{background:C.text,padding:'3rem 1.5rem 2rem'}}>
        <div style={{maxWidth:1200,margin:'0 auto'}}>
          <div style={{display:'flex',flexDirection:'column',gap:32,marginBottom:32}} className="footer-grid">
            <div>
              <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:12}}>
                <div style={{width:32,height:32,borderRadius:8,background:C.grad,display:'flex',alignItems:'center',justifyContent:'center'}}>
                  <PandiImg src="/panda/avatar_happy.png" size={24} />
                </div>
                <span style={{fontWeight:900,fontSize:16,color:'white',letterSpacing:'-.02em'}}>Pandi Health Coach</span>
              </div>
              <p style={{fontSize:13,color:'rgba(255,255,255,.45)',lineHeight:1.65,margin:'0 0 8px',maxWidth:280}}>Coaching de salud con IA personalizado con tus datos reales.</p>
              <p style={{fontSize:11,color:'rgba(255,255,255,.25)',lineHeight:1.6,margin:0,maxWidth:280}}>⚕️ Pandi no proporciona consejo médico. La información es orientativa y no sustituye al profesional sanitario.</p>
            </div>
            <div style={{display:'flex',gap:48}}>
              {{'Producto':[{label:'Funcionalidades',href:'#producto'},{label:'Precio',href:'#precio'},{label:'Privacidad',to:'/privacy'}],'Legal':[{label:'Términos de uso',to:'/terms'},{label:'Política de privacidad',to:'/privacy'},{label:'Disclaimer médico',to:'/disclaimer'}]}.constructor===Object&&
                Object.entries({'Producto':[{label:'Funcionalidades',href:'#producto'},{label:'Precio',href:'#precio'}],'Legal':[{label:'Términos',to:'/terms'},{label:'Privacidad',to:'/privacy'},{label:'Disclaimer',to:'/disclaimer'}]}).map(([section,links])=>(
                  <div key={section}>
                    <p style={{fontSize:11,fontWeight:800,color:'rgba(255,255,255,.3)',textTransform:'uppercase',letterSpacing:'.08em',margin:'0 0 12px'}}>{section}</p>
                    {links.map(({label,to,href})=>(
                      to ? <Link key={label} to={to} style={{display:'block',fontSize:13,color:'rgba(255,255,255,.5)',textDecoration:'none',marginBottom:8}}>{label}</Link>
                         : <a key={label} href={href} style={{display:'block',fontSize:13,color:'rgba(255,255,255,.5)',textDecoration:'none',marginBottom:8}}>{label}</a>
                    ))}
                  </div>
                ))
              }
            </div>
          </div>
          <div style={{borderTop:'1px solid rgba(255,255,255,.08)',paddingTop:20,display:'flex',flexDirection:'column',gap:8,alignItems:'center',textAlign:'center'}}>
            <p style={{fontSize:12,color:'rgba(255,255,255,.25)',margin:0}}>© 2026 Pandi Health Coach. Todos los derechos reservados.</p>
            <p style={{fontSize:12,color:'rgba(255,255,255,.2)',margin:0}}>Hecho con ❤️ en España · Powered by Anthropic Claude</p>
          </div>
        </div>
      </footer>

      {/* ── RESPONSIVE CSS ───────────────────────────────────────────────────── */}
      <style>{`
        @media (min-width: 900px) {
          .hero-grid { grid-template-columns: 1fr 1fr !important; }
          .hero-left { align-items: flex-start !important; text-align: left !important; }
          .nav-links { display: flex !important; }
          .stats-grid { grid-template-columns: repeat(4,1fr) !important; }
          .problems-grid { grid-template-columns: repeat(3,1fr) !important; }
          .steps-grid { grid-template-columns: repeat(3,1fr) !important; }
          .benefits-grid { grid-template-columns: repeat(3,1fr) !important; }
          .testimonials-grid { grid-template-columns: repeat(3,1fr) !important; }
          .pricing-grid { grid-template-columns: repeat(2,1fr) !important; }
          .footer-grid { flex-direction: row !important; justify-content: space-between; align-items: flex-start; }
        }
      `}</style>
    </div>
  )
}
