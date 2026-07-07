"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence, Reorder, useDragControls } from "framer-motion";
import Link from "next/link";

// ─── Count-up ─────────────────────────────────────────────────────────────────
function useCountUp(to: number, active = true, dur = 1100) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    if (!active) { setVal(0); return; }
    let raf = 0; let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / dur, 1);
      setVal(Math.round((1 - Math.pow(1 - p, 3)) * to));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, active, dur]);
  return val;
}

// ─── Score ring ───────────────────────────────────────────────────────────────
function ScoreRing({ score, color, size = 52 }: { score: number; color: string; size?: number }) {
  const r = (size - 7) / 2;
  const circ = 2 * Math.PI * r;
  const [n, setN] = useState(0);
  useEffect(() => {
    let raf = 0; let t0: number | null = null;
    const step = (ts: number) => {
      if (t0 === null) t0 = ts;
      const p = Math.min((ts - t0) / 1200, 1);
      setN(Math.round((1 - Math.pow(1 - p, 3)) * score));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [score]);
  return (
    <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
      <svg width={size} height={size} style={{ transform: "rotate(-90deg)" }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth={3.5}/>
        <motion.circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={3.5} strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${circ}` }}
          animate={{ strokeDasharray: `${(score/100)*circ} ${circ}` }}
          transition={{ duration: 1.2, ease: [0.22,1,0.36,1] }}/>
      </svg>
      <div style={{ position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center" }}>
        <span style={{ fontSize: size*0.28, fontWeight:800, color, fontVariantNumeric:"tabular-nums",lineHeight:1 }}>{n}</span>
      </div>
    </div>
  );
}

// ─── Drag handle icon ─────────────────────────────────────────────────────────
function GripIcon() {
  return (
    <svg width="10" height="16" viewBox="0 0 10 16" fill="none" style={{ flexShrink:0 }}>
      {[0,1].flatMap(col => [0,1,2,3].map(row => (
        <circle key={`${col}${row}`} cx={col*5+2.5} cy={row*4+2} r="1.4" fill="rgba(255,255,255,0.2)"/>
      )))}
    </svg>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────
const EXECUTIVES_INIT = [
  { role:"CEO", shortRole:"CEO", title:"Исполнительный директор", name:"Sophia Reeves", years:"20+",
    color:"#8b5cf6", rgb:"139,92,246",
    expertise:["Стратегия роста","Видение","Инвесторы"],
    bio:"Координирует всю команду, синтезирует инсайты в единую стратегию и формирует финальное решение. 20+ лет опыта масштабирования стартапов от идеи до Series B.",
    insights:["Фокусируйтесь на одном сегменте в первые 12 месяцев","Привлекайте инвесторов только при наличии метрик роста","Командная культура важнее любой стратегии"],
    completedProjects:3, avgScore:87 },
  { role:"CFO", shortRole:"CFO", title:"Финансовый директор", name:"Marcus Chen", years:"25+",
    color:"#3b82f6", rgb:"59,130,246",
    expertise:["Финмодели","Unit-экономика","Капитал"],
    bio:"Строит финансовые модели, прогнозы выручки, анализирует затраты и инвестиционные требования. Помог 20+ компаниям привлечь $500M+.",
    insights:["LTV/CAC > 3:1 — минимальный порог для масштабирования","Runway минимум 18 месяцев перед следующим раундом","Gross margin с первого дня — ключевой сигнал"],
    completedProjects:3, avgScore:91 },
  { role:"CMO", shortRole:"CMO", title:"Директор по маркетингу", name:"Elena Torres", years:"18+",
    color:"#10b981", rgb:"16,185,129",
    expertise:["Go-to-market","Brand","Performance"],
    bio:"Разрабатывает позиционирование бренда, стратегию выхода на рынок и воронки привлечения. Вывела 10+ продуктов от 0 до 1M пользователей.",
    insights:["Начинайте с 1-2 каналов привлечения","Контент-маркетинг даёт лучший ROI долгосрочно","NPS и word-of-mouth — самые дешёвые источники роста"],
    completedProjects:3, avgScore:84 },
  { role:"COO", shortRole:"COO", title:"Операционный директор", name:"James Wright", years:"22+",
    color:"#f59e0b", rgb:"245,158,11",
    expertise:["Операции","Процессы","Масштабирование"],
    bio:"Создаёт операционный роадмап, план запуска, дизайн процессов и структуру команды. Строил системы для компаний от 5 до 500 сотрудников.",
    insights:["Документируйте процессы с первого дня","Автоматизируйте всё, что повторяется > 3 раз/неделю","OKR работают только если команда понимает зачем"],
    completedProjects:3, avgScore:79 },
  { role:"CTO", shortRole:"CTO", title:"Технический директор", name:"Aiden Park", years:"15+",
    color:"#ec4899", rgb:"236,72,153",
    expertise:["Архитектура","AI/ML","DevOps"],
    bio:"Рекомендует технологический стек, инфраструктуру и технический роадмап. Строил масштабируемые системы для продуктов с миллионами пользователей.",
    insights:["MVP должен быть ugly — красота приходит с пониманием юзеров","Технический долг убивает стартапы — рефакторьте постоянно","Безопасность данных с первого дня"],
    completedProjects:3, avgScore:90 },
  { role:"Business Analyst", shortRole:"BA", title:"Бизнес-аналитик", name:"Priya Sharma", years:"12+",
    color:"#f97316", rgb:"249,115,22",
    expertise:["Анализ рынка","SWOT","Конкуренты"],
    bio:"Глубокий анализ рынка, конкурентная разведка, сегментация аудитории и маппинг возможностей. Специализируется на поиске незанятых ниш.",
    insights:["Изучите 10 конкурентов перед запуском","TAM > $1B — минимальный рынок для венчура","Один customer interview стоит 100 опросов"],
    completedProjects:3, avgScore:85 },
  { role:"Sales Director", shortRole:"SD", title:"Директор по продажам", name:"Carlos Mendes", years:"20+",
    color:"#6366f1", rgb:"99,102,241",
    expertise:["Sales funnel","Pricing","Лиды"],
    bio:"Разрабатывает воронки продаж, модели ценообразования и системы удержания клиентов. Закрыл сделки на суммарно $50M+.",
    insights:["Первые 10 продаж делайте лично","Цена слишком низкая — ошибка большинства стартапов","Follow-up решает: 80% продаж закрываются после 5-го контакта"],
    completedProjects:3, avgScore:83 },
  { role:"Legal Advisor", shortRole:"LA", title:"Юридический советник", name:"Diana Volkov", years:"30+",
    color:"#64748b", rgb:"100,116,139",
    expertise:["Структура","IP","Compliance"],
    bio:"Рекомендации по структуре бизнеса, защите интеллектуальной собственности и регуляторным требованиям. 30+ лет практики в корпоративном праве.",
    insights:["Delaware C-Corp — стандарт для венчурных инвестиций","Зарегистрируйте торговую марку до запуска","NDA имеют смысл только при раскрытии конфиденциальных данных"],
    completedProjects:3, avgScore:81 },
  { role:"CISO", shortRole:"CI", title:"Директор по безопасности", name:"Viktor Stern", years:"20+",
    color:"#ef4444", rgb:"239,68,68",
    expertise:["Кибербезопасность","Риски","Compliance"],
    bio:"Оценивает угрозы безопасности, разрабатывает политики защиты данных. Защитил системы 40+ корпораций.",
    insights:["Zero-trust архитектура — стандарт для любого SaaS","GDPR и SOC2 проще внедрить с нуля","Фишинг — причина 90% взломов: обучайте команду"],
    completedProjects:2, avgScore:88 },
  { role:"CPO", shortRole:"CP", title:"Директор по продукту", name:"Yuki Tanaka", years:"15+",
    color:"#a78bfa", rgb:"167,139,250",
    expertise:["Product strategy","UX","Roadmap"],
    bio:"Формирует продуктовую стратегию, приоритизирует фичи и выстраивает OKR-систему. Создал продукты с аудиторией 5M+ пользователей.",
    insights:["Jobs-to-be-done важнее демографических метрик","Не добавляйте фичи без данных","PMF — когда 40%+ пользователей расстроятся, если продукт исчезнет"],
    completedProjects:2, avgScore:86 },
  { role:"CHRO", shortRole:"HR", title:"Директор по персоналу", name:"Sarah Mitchell", years:"25+",
    color:"#f43f5e", rgb:"244,63,94",
    expertise:["Талант","Культура","Орг.дизайн"],
    bio:"Строит HR-систему, культуру компании и программы удержания талантов. Помогла 30+ стартапам масштабировать команды без потери качества.",
    insights:["Культурный fit важнее навыков","Прозрачность зарплат снижает текучку на 40%","Нанимайте медленно, увольняйте быстро"],
    completedProjects:2, avgScore:82 },
  { role:"CDO", shortRole:"CD", title:"Директор по данным", name:"Alex Rivera", years:"18+",
    color:"#06b6d4", rgb:"6,182,212",
    expertise:["Data strategy","Analytics","MLOps"],
    bio:"Формирует стратегию работы с данными, архитектуру аналитики и модели ML. Построил data-платформы с объёмом данных 10TB+.",
    insights:["Начните с одной North Star metric","Data governance с первого дня","Не строите хранилища — строите продукты на данных"],
    completedProjects:2, avgScore:88 },
  { role:"VP Engineering", shortRole:"VP", title:"VP Engineering", name:"Noah Kim", years:"20+",
    color:"#84cc16", rgb:"132,204,22",
    expertise:["Eng. management","Agile","Платформы"],
    bio:"Управляет инженерными командами и технической культурой. Руководил командами 50+ инженеров на стадиях Series C+.",
    insights:["Скорость падает без Code Review","Психологическая безопасность — основа команды","Мониторинг важнее новых фичей в production"],
    completedProjects:2, avgScore:86 },
  { role:"Growth Hacker", shortRole:"GH", title:"Специалист по росту", name:"Mia Patel", years:"10+",
    color:"#fb923c", rgb:"251,146,60",
    expertise:["Viral loops","A/B тесты","Retention"],
    bio:"Находит точки роста, строит вирусные механики и оптимизирует конверсию воронки. Обеспечила рост x10 для 8 стартапов на pre-PMF.",
    insights:["Retention — самый важный показатель","Сначала ищите product-channel fit","Каждый эксперимент требует гипотезу до запуска"],
    completedProjects:2, avgScore:89 },
  { role:"IR Manager", shortRole:"IR", title:"Директор по IR", name:"Christopher Lee", years:"35+",
    color:"#a855f7", rgb:"168,85,247",
    expertise:["Investor relations","Due diligence","Питч-деки"],
    bio:"Специализируется на подготовке к раундам, построении отношений с инвесторами и due diligence. Участвовал в сделках $2B+ суммарно.",
    insights:["Инвесторы покупают команду на ранних стадиях","Питч-дек — история с числами, не слайды","Тёплое знакомство повышает шанс встречи в 5 раз"],
    completedProjects:2, avgScore:84 },
];

type Exec = typeof EXECUTIVES_INIT[number];

// ─── Org chart layout ─────────────────────────────────────────────────────────
const NW = 120, NH = 58;
const GRAPH_LAYOUT: Record<string, { x: number; y: number; parent: string | null; badge: string }> = {
  "CEO":              { x:660,  y:44,  parent:null,  badge:"CEO" },
  "CFO":              { x:148,  y:198, parent:"CEO", badge:"CFO" },
  "CMO":              { x:420,  y:198, parent:"CEO", badge:"CMO" },
  "COO":              { x:718,  y:198, parent:"CEO", badge:"COO" },
  "CTO":              { x:1060, y:198, parent:"CEO", badge:"CTO" },
  "Business Analyst": { x:80,   y:370, parent:"CFO", badge:"BA"  },
  "IR Manager":       { x:214,  y:370, parent:"CFO", badge:"IR"  },
  "Sales Director":   { x:354,  y:370, parent:"CMO", badge:"SD"  },
  "Growth Hacker":    { x:486,  y:370, parent:"CMO", badge:"GH"  },
  "Legal Advisor":    { x:586,  y:370, parent:"COO", badge:"LA"  },
  "CHRO":             { x:718,  y:370, parent:"COO", badge:"HR"  },
  "VP Engineering":   { x:850,  y:370, parent:"COO", badge:"VP"  },
  "CISO":             { x:950,  y:370, parent:"CTO", badge:"CI"  },
  "CPO":              { x:1060, y:370, parent:"CTO", badge:"CP"  },
  "CDO":              { x:1170, y:370, parent:"CTO", badge:"CD"  },
};
const CANVAS_W = 1300, CANVAS_H = 460;
const execByRole = Object.fromEntries(EXECUTIVES_INIT.map(e => [e.role, e]));

// ─── Draggable exec card (list view) ─────────────────────────────────────────
function ExecCard({ exec, index, isSelected, onSelect }: {
  exec: Exec; index: number; isSelected: boolean; onSelect: () => void;
}) {
  const controls = useDragControls();
  return (
    <Reorder.Item
      value={exec}
      dragListener={false}
      dragControls={controls}
      as="div"
      style={{ listStyle:"none" }}
      whileDrag={{ scale:1.02, zIndex:50, boxShadow:"0 24px 60px rgba(0,0,0,0.55)", opacity:0.95 }}
      transition={{ type:"spring", stiffness:260, damping:22 }}
    >
      <motion.div
        initial={{ opacity:0, y:18 }}
        animate={{ opacity:1, y:0 }}
        transition={{ duration:0.5, delay:index*0.04, ease:[0.22,1,0.36,1] }}
        whileHover={{ y:-3, transition:{ duration:0.2 } }}
        onClick={onSelect}
        style={{
          display:"flex", alignItems:"center", gap:12,
          padding:"14px 16px",
          borderRadius:16,
          cursor:"pointer",
          background: isSelected ? `rgba(${exec.rgb},0.07)` : "rgba(255,255,255,0.025)",
          border: isSelected
            ? `1px solid rgba(${exec.rgb},0.32)`
            : `1px solid rgba(255,255,255,0.07)`,
          boxShadow:"0 2px 16px rgba(0,0,0,0.28), inset 0 1px 0 rgba(255,255,255,0.04)",
          transition:"background 0.18s, border-color 0.18s",
          position:"relative", overflow:"hidden",
        }}
      >
        {/* Selected top bevel */}
        {isSelected && (
          <div style={{ position:"absolute",top:0,left:"8%",right:"8%",height:1,
            background:`linear-gradient(90deg,transparent,rgba(${exec.rgb},0.5),transparent)` }}/>
        )}

        {/* Drag handle */}
        <div
          onPointerDown={e => controls.start(e)}
          style={{ cursor:"grab", padding:"4px 2px", touchAction:"none", flexShrink:0 }}
          onClick={e => e.stopPropagation()}
        >
          <GripIcon/>
        </div>

        {/* Color bar */}
        <div style={{ width:3, height:36, borderRadius:2, background:exec.color, flexShrink:0, opacity:0.7 }}/>

        {/* Icon */}
        <div style={{
          width:40, height:40, borderRadius:12, flexShrink:0,
          display:"flex", alignItems:"center", justifyContent:"center",
          background:`rgba(${exec.rgb},0.1)`,
          border:`1px solid rgba(${exec.rgb},0.22)`,
          fontSize:11, fontWeight:800, color:exec.color,
          boxShadow:"0 2px 8px rgba(0,0,0,0.2)",
        }}>
          {exec.shortRole}
        </div>

        {/* Info */}
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:3 }}>
            <span style={{ fontSize:13, fontWeight:700, color:"rgba(255,255,255,0.92)", letterSpacing:"-0.01em" }}>{exec.name}</span>
            <span style={{ fontSize:9, fontWeight:700, padding:"2px 7px", borderRadius:20,
              background:`rgba(${exec.rgb},0.1)`, border:`1px solid rgba(${exec.rgb},0.2)`,
              color:exec.color, letterSpacing:"0.06em" }}>{exec.shortRole}</span>
          </div>
          <div style={{ fontSize:11, color:"rgba(255,255,255,0.35)", marginBottom:6 }}>{exec.title}</div>
          <div style={{ display:"flex", gap:5, flexWrap:"wrap" }}>
            {exec.expertise.map(t => (
              <span key={t} style={{ fontSize:9.5, padding:"2px 7px", borderRadius:20,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                color:"rgba(255,255,255,0.4)" }}>{t}</span>
            ))}
          </div>
        </div>

        {/* Score ring */}
        <ScoreRing score={exec.avgScore} color={exec.color} size={46}/>

        {/* Online dot + projects */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", gap:6, flexShrink:0 }}>
          <div style={{ width:7, height:7, borderRadius:"50%", background:"#10b981",
            boxShadow:"0 0 6px rgba(16,185,129,0.7)" }}/>
          <div style={{ fontSize:9, color:"rgba(255,255,255,0.25)", textAlign:"center" }}>
            {exec.completedProjects} пр.
          </div>
        </div>

        {/* Chat link */}
        <Link
          href={`/dashboard/chat?agent=${exec.shortRole.toLowerCase()}`}
          onClick={e => e.stopPropagation()}
          style={{
            height:34, padding:"0 14px", borderRadius:10,
            display:"flex", alignItems:"center", gap:6,
            background:`rgba(${exec.rgb},0.12)`,
            border:`1px solid rgba(${exec.rgb},0.25)`,
            color:exec.color, fontSize:11, fontWeight:600,
            textDecoration:"none", flexShrink:0, whiteSpace:"nowrap",
            transition:"background 0.15s",
          }}
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8" width="11" height="11">
            <path d="M14 8c0 3.1-2.7 5.5-6 5.5a7 7 0 01-2-.3L2 14l1.1-3.2A5 5 0 012 8c0-3.1 2.7-5.5 6-5.5S14 4.9 14 8z"/>
          </svg>
          Чат
        </Link>
      </motion.div>
    </Reorder.Item>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────
function DetailPanel({ exec, onClose }: { exec: Exec; onClose: () => void }) {
  const { color, rgb } = exec;
  return (
    <motion.div
      key={exec.role}
      initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:8 }}
      transition={{ duration:0.38, ease:[0.22,1,0.36,1] }}
      style={{
        borderRadius:20, padding:"24px", position:"relative", overflow:"hidden",
        background:`rgba(255,255,255,0.022)`,
        border:`1px solid rgba(${rgb},0.2)`,
        boxShadow:"0 4px 32px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)",
      }}
    >
      <div style={{ position:"absolute",top:0,left:"6%",right:"6%",height:1,
        background:`linear-gradient(90deg,transparent,rgba(${rgb},0.5),transparent)` }}/>

      {/* Close */}
      <button onClick={onClose} style={{
        position:"absolute", top:16, right:16, width:28, height:28, borderRadius:8,
        border:"1px solid rgba(255,255,255,0.08)", background:"rgba(255,255,255,0.04)",
        color:"rgba(255,255,255,0.4)", cursor:"pointer", fontSize:14, display:"flex",
        alignItems:"center", justifyContent:"center",
      }}>×</button>

      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fit,minmax(260px,1fr))", gap:24 }}>
        {/* Bio */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:14, marginBottom:16 }}>
            <div style={{
              width:52, height:52, borderRadius:14, flexShrink:0,
              background:`rgba(${rgb},0.14)`, border:`1px solid rgba(${rgb},0.32)`,
              display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:13, fontWeight:800, color,
            }}>{exec.shortRole}</div>
            <div>
              <div style={{ fontSize:16, fontWeight:800, color:"#fff" }}>{exec.name}</div>
              <div style={{ fontSize:11, color:"rgba(255,255,255,0.38)", marginTop:2 }}>{exec.title}</div>
              <div style={{ display:"inline-flex", alignItems:"center", gap:4, marginTop:6,
                padding:"2px 8px", borderRadius:20,
                background:"rgba(16,185,129,0.1)", border:"1px solid rgba(16,185,129,0.22)" }}>
                <div style={{ width:5, height:5, borderRadius:"50%", background:"#10b981" }}/>
                <span style={{ fontSize:9, color:"#10b981", fontWeight:700 }}>Активен</span>
              </div>
            </div>
            <div style={{ marginLeft:"auto", display:"flex", flexDirection:"column", alignItems:"center", gap:4 }}>
              <ScoreRing score={exec.avgScore} color={color} size={56}/>
              <span style={{ fontSize:8, color:"rgba(255,255,255,0.25)" }}>балл</span>
            </div>
          </div>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.45)", lineHeight:1.75, marginBottom:14 }}>{exec.bio}</p>
          <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
            {exec.expertise.map(e => (
              <span key={e} style={{ fontSize:9.5, padding:"3px 10px", borderRadius:20,
                background:`rgba(${rgb},0.1)`, border:`1px solid rgba(${rgb},0.22)`, color }}>{e}</span>
            ))}
          </div>
        </div>

        {/* Insights */}
        <div>
          <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.18em",
            color:"rgba(255,255,255,0.25)", marginBottom:14 }}>Ключевые инсайты</div>
          <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
            {exec.insights.map((ins, i) => (
              <motion.div key={i}
                initial={{ opacity:0, x:-8 }} animate={{ opacity:1, x:0 }}
                transition={{ delay:0.1+i*0.09, duration:0.4, ease:[0.22,1,0.36,1] }}
                style={{ display:"flex", gap:10, alignItems:"flex-start" }}>
                <div style={{
                  width:20, height:20, borderRadius:"50%", flexShrink:0,
                  background:`rgba(${rgb},0.14)`, border:`1px solid rgba(${rgb},0.28)`,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  fontSize:9, fontWeight:800, color,
                }}>{i+1}</div>
                <p style={{ fontSize:12, color:"rgba(255,255,255,0.5)", lineHeight:1.65, margin:0 }}>{ins}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Stats + actions */}
        <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 }}>
            {[
              { label:"Проектов", value:exec.completedProjects },
              { label:"Средний балл", value:exec.avgScore },
              { label:"Лет опыта", value:exec.years },
              { label:"Точность", value:`${95+(exec.avgScore%5)}.${exec.avgScore%10}%` },
            ].map(s => (
              <div key={s.label} style={{
                padding:"12px 10px", borderRadius:12, textAlign:"center",
                background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)",
              }}>
                <div style={{ fontSize:18, fontWeight:800, color:"#fff", fontVariantNumeric:"tabular-nums" }}>{s.value}</div>
                <div style={{ fontSize:8.5, color:"rgba(255,255,255,0.28)", marginTop:3 }}>{s.label}</div>
              </div>
            ))}
          </div>

          <Link href={`/dashboard/chat?agent=${exec.shortRole.toLowerCase()}`} style={{
            height:44, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center", gap:8,
            background:`linear-gradient(135deg,rgba(${rgb},0.8),rgba(${rgb},0.5))`,
            border:`1px solid rgba(${rgb},0.4)`,
            color:"#fff", fontWeight:700, fontSize:12, textDecoration:"none",
          }}>
            <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" width="14" height="14">
              <path d="M18 10c0 3.866-3.582 7-8 7a9 9 0 01-2.5-.35L3 17l1.35-4.05A6.5 6.5 0 013 10c0-3.866 3.582-7 8-7s7 3.134 7 7z"/>
            </svg>
            Обсудить с {exec.name.split(" ")[0]}
          </Link>
          <Link href="/dashboard/new" style={{
            height:38, borderRadius:12, display:"flex", alignItems:"center", justifyContent:"center",
            background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
            color:"rgba(255,255,255,0.55)", fontWeight:600, fontSize:12, textDecoration:"none",
          }}>
            Брифовать совет по новому проекту
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default function ExecutivesPage() {
  const [items, setItems] = useState<Exec[]>(EXECUTIVES_INIT);
  const [view, setView] = useState<"grid"|"org">("grid");
  const [selected, setSelected] = useState<string|null>(null);
  const [query, setQuery] = useState("");
  const [zoom, setZoom] = useState(1);
  const [entered, setEntered] = useState(false);
  const detailRef = useRef<HTMLDivElement>(null);

  useEffect(() => { const t = setTimeout(() => setEntered(true), 60); return () => clearTimeout(t); }, []);

  const selExec = selected ? execByRole[selected] : null;

  const q = query.trim().toLowerCase();
  const matches = (role: string) => {
    if (!q) return true;
    const e = execByRole[role];
    return e?.name.toLowerCase().includes(q)
      || e?.role.toLowerCase().includes(q)
      || e?.title.toLowerCase().includes(q)
      || e?.expertise.some(x => x.toLowerCase().includes(q))
      || false;
  };

  const filteredItems = q ? items.filter(e => matches(e.role)) : items;

  const avgScore = Math.round(EXECUTIVES_INIT.reduce((s, e) => s+e.avgScore,0) / EXECUTIVES_INIT.length);
  const totalProjects = EXECUTIVES_INIT.reduce((s, e) => s+e.completedProjects, 0);
  const animAgents = useCountUp(EXECUTIVES_INIT.length);
  const animScore = useCountUp(avgScore);
  const animProjects = useCountUp(totalProjects);

  const selLayout = selected ? GRAPH_LAYOUT[selected] : null;
  const selColor = selExec?.color ?? "#6366f1";
  const selRgb = selExec?.rgb ?? "99,102,241";

  return (
    <div style={{ padding:"20px 24px 56px", maxWidth:1340, margin:"0 auto" }}>

      {/* ── Header ── */}
      <motion.div
        initial={{ opacity:0, y:-10 }} animate={{ opacity:1, y:0 }}
        transition={{ duration:0.45, ease:[0.22,1,0.36,1] }}
        style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between",
          gap:16, marginBottom:20, flexWrap:"wrap" }}
      >
        {/* Title */}
        <div>
          <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
            <span style={{ fontSize:10, fontWeight:700, letterSpacing:"0.16em",
              textTransform:"uppercase", color:"rgba(255,255,255,0.28)" }}>Apex AI</span>
            <span style={{ display:"inline-flex", alignItems:"center", gap:5, padding:"2px 9px",
              borderRadius:20, background:"rgba(16,185,129,0.08)", border:"1px solid rgba(16,185,129,0.2)" }}>
              <span style={{ width:5, height:5, borderRadius:"50%", background:"#10b981",
                animation:"exec-pulse 2s ease-in-out infinite" }}/>
              <span style={{ fontSize:9, fontWeight:700, color:"#10b981" }}>Все активны</span>
            </span>
          </div>
          <h1 style={{ fontSize:22, fontWeight:800, letterSpacing:"-0.02em", color:"#fff", margin:0 }}>
            Исполнительный совет
          </h1>
          <p style={{ fontSize:12, color:"rgba(255,255,255,0.3)", margin:"4px 0 0" }}>
            {view === "grid"
              ? "Перетаскивайте агентов для изменения порядка — нажмите на карточку для просмотра профиля"
              : "Организационная структура совета — кликните на агента"}
          </p>
        </div>

        {/* Controls */}
        <div style={{ display:"flex", flexDirection:"column", gap:10, alignItems:"flex-end" }}>
          {/* KPIs */}
          <div style={{ display:"flex", gap:8 }}>
            {[
              { label:"Агентов", value:animAgents, color:"#8b5cf6" },
              { label:"Ср. балл", value:animScore, color:"#3b82f6" },
              { label:"Проектов", value:animProjects, color:"#10b981" },
            ].map(k => (
              <div key={k.label} style={{
                padding:"8px 14px", borderRadius:12, textAlign:"center", minWidth:70,
                background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)",
              }}>
                <div style={{ fontSize:18, fontWeight:800, color:k.color, lineHeight:1, fontVariantNumeric:"tabular-nums" }}>{k.value}</div>
                <div style={{ fontSize:9, color:"rgba(255,255,255,0.28)", marginTop:3 }}>{k.label}</div>
              </div>
            ))}
          </div>

          {/* Search + view toggle */}
          <div style={{ display:"flex", gap:8, alignItems:"center" }}>
            <div style={{ position:"relative" }}>
              <svg viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,0.28)" strokeWidth="1.6"
                style={{ width:12, height:12, position:"absolute", left:10, top:"50%", transform:"translateY(-50%)", pointerEvents:"none" }}>
                <circle cx="7" cy="7" r="5"/><path d="M11 11l3 3"/>
              </svg>
              <input value={query} onChange={e => setQuery(e.target.value)}
                placeholder="Поиск агента / навыка…"
                style={{ width:210, height:32, padding:"0 12px 0 30px", borderRadius:10,
                  background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                  color:"#fff", fontSize:12, outline:"none" }}
                onFocus={e => (e.currentTarget.style.borderColor="rgba(99,102,241,0.5)")}
                onBlur={e => (e.currentTarget.style.borderColor="rgba(255,255,255,0.08)")}/>
            </div>

            {/* View toggle pill */}
            <div style={{ display:"inline-flex", padding:3, borderRadius:10,
              background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.07)" }}>
              {(["grid","org"] as const).map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  position:"relative", padding:"4px 12px", borderRadius:8,
                  border:"none", background:"transparent", cursor:"pointer",
                  fontSize:11, fontWeight:600,
                  color: view===v ? "#fff" : "rgba(255,255,255,0.35)",
                  transition:"color 0.15s",
                }}>
                  {view===v && (
                    <motion.span layoutId="view-pill"
                      style={{ position:"absolute",inset:0,borderRadius:8,
                        background:"linear-gradient(135deg,#6366f1,#4f46e5)",
                        boxShadow:"0 2px 10px rgba(99,102,241,0.3)" }}
                      transition={{ type:"spring", stiffness:420, damping:32 }}/>
                  )}
                  <span style={{ position:"relative", zIndex:1 }}>
                    {v==="grid" ? "Список" : "Оргчарт"}
                  </span>
                </button>
              ))}
            </div>

            {view==="org" && ["+","−","⊡"].map((lbl,i) => (
              <button key={i} onClick={() => {
                if (lbl==="+") setZoom(z => Math.min(1.5,z+0.15));
                else if (lbl==="−") setZoom(z => Math.max(0.5,z-0.15));
                else setZoom(1);
              }} style={{
                width:32, height:32, borderRadius:9, fontSize: lbl==="⊡" ? 13 : 17,
                background:"rgba(255,255,255,0.04)", border:"1px solid rgba(255,255,255,0.08)",
                color:"rgba(255,255,255,0.55)", cursor:"pointer", fontWeight:700,
                display:"flex", alignItems:"center", justifyContent:"center",
              }}>{lbl}</button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* ── Content ── */}
      <AnimatePresence mode="wait">
        {view==="grid" ? (
          <motion.div key="grid"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.25 }}
            style={{ marginBottom:16 }}
          >
            <Reorder.Group
              axis="y"
              values={filteredItems}
              onReorder={newOrder => {
                if (!q) setItems(newOrder);
              }}
              style={{ display:"flex", flexDirection:"column", gap:6, padding:0, margin:0 }}
            >
              {filteredItems.map((exec, i) => (
                <ExecCard
                  key={exec.role}
                  exec={exec}
                  index={i}
                  isSelected={selected===exec.role}
                  onSelect={() => setSelected(s => s===exec.role ? null : exec.role)}
                />
              ))}
            </Reorder.Group>

            {q && filteredItems.length===0 && (
              <div style={{ padding:"48px 24px", textAlign:"center",
                color:"rgba(255,255,255,0.25)", fontSize:13 }}>
                Агентов по запросу «{q}» не найдено
              </div>
            )}
          </motion.div>

        ) : (
          <motion.div key="org"
            initial={{ opacity:0 }} animate={{ opacity:1 }} exit={{ opacity:0 }}
            transition={{ duration:0.25 }}
          >
            <div style={{
              borderRadius:18, border:"1px solid rgba(255,255,255,0.07)",
              overflow:"hidden", position:"relative", marginBottom:16,
              background:"radial-gradient(ellipse at 50% 0%,rgba(20,14,48,0.97) 0%,rgba(5,5,12,0.99) 70%)",
            }}>
              <div style={{ overflowX:"auto", overflowY:"hidden" }}>
                <div style={{ width:CANVAS_W, height:CANVAS_H+10, position:"relative",
                  transform:`scale(${zoom})`, transformOrigin:"top left", transition:"transform 0.22s" }}>

                  {/* Dot grid */}
                  <svg style={{ position:"absolute",inset:0,width:"100%",height:"100%",pointerEvents:"none" }}>
                    <defs>
                      <pattern id="exec-dot-grid" width="28" height="28" patternUnits="userSpaceOnUse">
                        <circle cx="1" cy="1" r="0.9" fill="rgba(255,255,255,0.045)"/>
                      </pattern>
                      <filter id="exec-glow-f">
                        <feGaussianBlur stdDeviation="2" result="b"/>
                        <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
                      </filter>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#exec-dot-grid)"/>

                    {/* Edges */}
                    {Object.entries(GRAPH_LAYOUT).map(([role, layout]) => {
                      if (!layout.parent) return null;
                      const parent = GRAPH_LAYOUT[layout.parent];
                      if (!parent) return null;
                      const x1=parent.x, y1=parent.y+NH/2, x2=layout.x, y2=layout.y-NH/2;
                      const my=(y1+y2)/2;
                      const active = role===selected || layout.parent===selected;
                      const ec = execByRole[role];
                      const edgeColor = active ? (selExec?.color??"#6366f1") : `rgba(${ec?.rgb??"99,102,241"},0.25)`;
                      const d=`M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
                      return (
                        <g key={role}>
                          <path d={d} fill="none" stroke={edgeColor}
                            strokeWidth={active?1.8:1}
                            filter={active?"url(#exec-glow-f)":"none"}
                            style={{ transition:"stroke 0.28s,stroke-width 0.28s" }}/>
                          {active && (
                            <circle r="2.5" fill={selExec?.color??"#6366f1"} filter="url(#exec-glow-f)">
                              <animateMotion dur="2s" repeatCount="indefinite" path={d}/>
                              <animate attributeName="opacity" values="0;1;1;0" dur="2s" repeatCount="indefinite"/>
                            </circle>
                          )}
                          <polygon points={`${x2-3.5},${y2+2} ${x2+3.5},${y2+2} ${x2},${y2-6}`}
                            fill={active?(selExec?.color??"#6366f1"):`rgba(${ec?.rgb??"255,255,255"},0.28)`}
                            style={{ transition:"fill 0.28s" }}/>
                        </g>
                      );
                    })}
                  </svg>

                  {/* Nodes */}
                  {Object.entries(GRAPH_LAYOUT).map(([role, layout], idx) => {
                    const exec = execByRole[role];
                    if (!exec) return null;
                    const isSel = role===selected;
                    const dimmed = !matches(role);
                    return (
                      <motion.div key={role}
                        onClick={() => setSelected(s => s===role?null:role)}
                        whileHover={{ scale:1.05, y:-2 }}
                        transition={{ type:"spring", stiffness:320, damping:22 }}
                        initial={{ opacity:0, scale:0.8 }}
                        animate={{ opacity:entered?(dimmed?0.2:1):0, scale:1 }}
                        style={{
                          position:"absolute",
                          left:layout.x-NW/2, top:layout.y-NH/2,
                          width:NW, height:NH,
                          borderRadius:11,
                          background: isSel
                            ? `rgba(${exec.rgb},0.14)`
                            : "rgba(255,255,255,0.03)",
                          border: isSel
                            ? `1px solid rgba(${exec.rgb},0.5)`
                            : `1px solid rgba(${exec.rgb},0.3)`,
                          boxShadow: isSel
                            ? `0 4px 24px rgba(${exec.rgb},0.18), inset 0 1px 0 rgba(255,255,255,0.06)`
                            : "0 2px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)",
                          cursor:"pointer",
                          filter:dimmed?"grayscale(0.8)":"none",
                          zIndex:isSel?10:1,
                          transition:"border 0.22s,box-shadow 0.22s,background 0.22s",
                          transitionDelay:`${idx*28}ms`,
                          userSelect:"none",
                        }}>
                        <div style={{ position:"absolute",top:5,left:6,
                          fontSize:7,fontWeight:800,color:exec.color,
                          background:`rgba(${exec.rgb},0.15)`,borderRadius:4,padding:"1px 5px",
                          letterSpacing:"0.05em" }}>{layout.badge}</div>
                        <div style={{ position:"absolute",top:7,right:7,
                          width:6,height:6,borderRadius:"50%",background:"#10b981",
                          boxShadow:"0 0 6px rgba(16,185,129,0.8)",
                          animation:"exec-pulse 2.4s ease-in-out infinite" }}/>
                        <div style={{ position:"absolute",bottom:14,left:0,right:0,
                          textAlign:"center",fontSize:11.5,fontWeight:800,
                          color:isSel?exec.color:"rgba(255,255,255,0.88)",
                          textOverflow:"ellipsis",overflow:"hidden",whiteSpace:"nowrap",
                          paddingInline:6,transition:"color 0.2s" }}>{exec.shortRole}</div>
                        <div style={{ position:"absolute",bottom:4,left:0,right:0,
                          textAlign:"center",fontSize:8.5,color:"rgba(255,255,255,0.25)" }}>
                          {exec.avgScore}
                        </div>
                      </motion.div>
                    );
                  })}

                  {/* Tooltip popup */}
                  {selExec && selLayout && (() => {
                    const popW=258;
                    let px=selLayout.x-NW/2;
                    let py=selLayout.y+NH/2+12;
                    if (px+popW>CANVAS_W-8) px=CANVAS_W-popW-8;
                    if (py+200>CANVAS_H) py=selLayout.y-NH/2-212;
                    return (
                      <motion.div
                        initial={{ opacity:0, scale:0.9 }} animate={{ opacity:1, scale:1 }}
                        transition={{ type:"spring", stiffness:340, damping:24 }}
                        style={{
                          position:"absolute",left:px,top:py,width:popW,
                          background:"rgba(8,8,20,0.97)",
                          border:`1px solid rgba(${selRgb},0.35)`,
                          borderRadius:12,zIndex:30,
                          boxShadow:`0 12px 40px rgba(0,0,0,0.6),0 0 18px rgba(${selRgb},0.1)`,
                          padding:"12px 14px",
                        }}>
                        <div style={{ fontSize:8.5,fontWeight:800,color:selColor,
                          letterSpacing:"0.12em",textTransform:"uppercase",marginBottom:10 }}>
                          {selExec.shortRole} · Профиль агента
                        </div>
                        {[["Имя",selExec.name],["Должность",selExec.title],
                          ["Опыт",`${selExec.years} лет`],["Статус","Активен"],
                          ["Балл",`${(selExec.avgScore/20).toFixed(1)} / 5.0`],
                          ["Проектов",`${selExec.completedProjects} завершено`],
                        ].map(([k,v]) => (
                          <div key={k} style={{ display:"flex",justifyContent:"space-between",
                            gap:8,marginBottom:4,fontSize:9.5 }}>
                            <span style={{ color:"rgba(255,255,255,0.32)" }}>{k}</span>
                            <span style={{ color:k==="Статус"?"#10b981":"rgba(255,255,255,0.8)",
                              fontWeight:k==="Статус"?700:400,textAlign:"right",
                              maxWidth:150,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{v}</span>
                          </div>
                        ))}
                      </motion.div>
                    );
                  })()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Detail panel ── */}
      <div ref={detailRef}/>
      <AnimatePresence>
        {selExec && (
          <DetailPanel
            exec={selExec}
            onClose={() => setSelected(null)}
          />
        )}
      </AnimatePresence>

      <style>{`
        @keyframes exec-pulse { 0%,100%{opacity:0.6} 50%{opacity:1} }
      `}</style>
    </div>
  );
}
