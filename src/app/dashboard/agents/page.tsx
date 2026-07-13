"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Plus, Search, Play, MessageSquare, Settings2, BarChart2, Copy,
  Star, Zap, Shield, TrendingUp, Users, Code2, Scale, FlaskConical,
  ChevronRight, X, Check, Brain, Database, Globe, Cpu,
  Activity, Clock, DollarSign, GitBranch, Package, Layers, Filter,
  ArrowUpRight, Sparkles, CheckCircle2, PauseCircle, Circle,
  AlertCircle,
} from "lucide-react";

const DEPARTMENTS = [
  { id: "all",       label: "Все агенты",    icon: Layers },
  { id: "exec",      label: "Руководство",   icon: Users },
  { id: "finance",   label: "Финансы",       icon: TrendingUp },
  { id: "marketing", label: "Маркетинг",     icon: Zap },
  { id: "sales",     label: "Продажи",       icon: ArrowUpRight },
  { id: "product",   label: "Продукт",       icon: Package },
  { id: "dev",       label: "Разработка",    icon: Code2 },
  { id: "analytics", label: "Аналитика",     icon: BarChart2 },
  { id: "legal",     label: "Юридический",   icon: Scale },
  { id: "hr",        label: "HR",            icon: Users },
  { id: "research",  label: "Исследования",  icon: FlaskConical },
];

const MODELS = ["claude-sonnet-5", "claude-opus-4-8", "gpt-4o", "gemini-2.5-pro", "llama-3.3-70b"];

type AgentStatus = "active" | "idle" | "paused" | "error";

interface Agent {
  id: string; name: string; role: string; dept: string; emoji: string; color: string;
  description: string; model: string; status: AgentStatus; runs: number; rating: number;
  speed: "fast" | "medium" | "slow"; cost: "$" | "$$" | "$$$"; tools: string[];
  memory: boolean; created: string; prompt: string;
}

const AGENTS_ALL: Agent[] = [
  { id:"a1",  name:"Victoria Sterling",  role:"Chief Executive Officer",     dept:"exec",      emoji:"👑", color:"#8b5cf6", description:"Стратегическое руководство, принятие ключевых решений и управление исполнительной командой.",       model:"claude-opus-4-8",  status:"active", runs:2847, rating:4.9, speed:"medium", cost:"$$$", tools:["web","docs","analytics"],        memory:true,  created:"2024-01-15", prompt:"Ты Victoria Sterling — CEO с 20-летним опытом. Принимаешь стратегические решения, координируешь топ-менеджмент." },
  { id:"a2",  name:"Marcus Webb",        role:"Chief Strategy Officer",      dept:"exec",      emoji:"🎯", color:"#3b82f6", description:"Долгосрочное планирование, конкурентный анализ и трансформация бизнес-модели.",                    model:"claude-sonnet-5",  status:"active", runs:1923, rating:4.8, speed:"fast",   cost:"$$",  tools:["web","analytics","docs"],        memory:true,  created:"2024-01-20", prompt:"Ты Marcus Webb — CSO. Разрабатываешь долгосрочные стратегии, анализируешь рынок." },
  { id:"a3",  name:"Elena Vasquez",      role:"Chief Operating Officer",     dept:"exec",      emoji:"⚙️", color:"#10b981", description:"Оптимизация операций, KPI, процессы и операционная эффективность.",                               model:"claude-sonnet-5",  status:"idle",   runs:3102, rating:4.7, speed:"fast",   cost:"$$",  tools:["docs","analytics"],              memory:true,  created:"2024-01-18", prompt:"Ты Elena Vasquez — COO. Управляешь операционными процессами, оптимизируешь KPI." },
  { id:"a4",  name:"James Hartley",      role:"Chief Financial Officer",     dept:"exec",      emoji:"💼", color:"#f59e0b", description:"Финансовое планирование, бюджет, риски и инвестиционные решения.",                                 model:"claude-opus-4-8",  status:"active", runs:2541, rating:4.9, speed:"medium", cost:"$$$", tools:["docs","analytics","calculator"], memory:true,  created:"2024-01-16", prompt:"Ты James Hartley — CFO. Управляешь финансами, строишь прогнозы, анализируешь P&L." },
  { id:"a5",  name:"Sarah Chen",         role:"Chief Marketing Officer",     dept:"exec",      emoji:"📣", color:"#f43f5e", description:"Бренд-стратегия, маркетинг-микс, рост и удержание аудитории.",                                    model:"claude-sonnet-5",  status:"active", runs:1876, rating:4.7, speed:"fast",   cost:"$$",  tools:["web","docs","image"],            memory:true,  created:"2024-02-01", prompt:"Ты Sarah Chen — CMO. Отвечаешь за бренд, маркетинговые кампании и рост аудитории." },
  { id:"a6",  name:"David Park",         role:"Chief Technology Officer",    dept:"exec",      emoji:"🔬", color:"#a78bfa", description:"Технологическая стратегия, архитектура, R&D и инновации.",                                          model:"claude-opus-4-8",  status:"idle",   runs:987,  rating:4.8, speed:"medium", cost:"$$$", tools:["code","web","docs"],             memory:true,  created:"2024-02-05", prompt:"Ты David Park — CTO. Определяешь технологическую стратегию, архитектуру систем." },
  { id:"a7",  name:"Alicia Monroe",      role:"Financial Analyst",           dept:"finance",   emoji:"📊", color:"#f59e0b", description:"P&L анализ, финансовое моделирование и прогнозирование.",                                           model:"claude-sonnet-5",  status:"active", runs:4210, rating:4.8, speed:"fast",   cost:"$$",  tools:["calculator","docs","analytics"], memory:false, created:"2024-02-10", prompt:"Ты Alicia Monroe — финансовый аналитик. Строишь финансовые модели, анализируешь P&L." },
  { id:"a8",  name:"Robert Kim",         role:"Investment Analyst",          dept:"finance",   emoji:"💹", color:"#10b981", description:"Оценка инвестиций, due diligence и портфельный анализ.",                                            model:"claude-sonnet-5",  status:"idle",   runs:2105, rating:4.6, speed:"fast",   cost:"$$",  tools:["web","calculator","docs"],       memory:false, created:"2024-02-12", prompt:"Ты Robert Kim — инвестиционный аналитик. Проводишь due diligence, оцениваешь проекты." },
  { id:"a9",  name:"Natasha Orlov",      role:"Tax & Compliance",           dept:"finance",   emoji:"📋", color:"#3b82f6", description:"Налоговое планирование, комплаенс и регуляторная отчётность.",                                      model:"gpt-4o",           status:"active", runs:1890, rating:4.7, speed:"medium", cost:"$$",  tools:["docs","web"],                    memory:true,  created:"2024-03-01", prompt:"Ты Natasha Orlov — налоговый специалист. Консультируешь по налогам, комплаенс-вопросам." },
  { id:"a10", name:"Felix Bauer",        role:"Budget Controller",           dept:"finance",   emoji:"🔢", color:"#f43f5e", description:"Контроль бюджетов, план/факт анализ и оптимизация расходов.",                                      model:"claude-sonnet-5",  status:"idle",   runs:3302, rating:4.5, speed:"fast",   cost:"$",   tools:["calculator","docs"],             memory:false, created:"2024-03-05", prompt:"Ты Felix Bauer — контроллер бюджетов. Анализируешь план-факт, оптимизируешь расходы." },
  { id:"a11", name:"Isabella Torres",    role:"Treasury Manager",            dept:"finance",   emoji:"🏦", color:"#8b5cf6", description:"Управление ликвидностью, валютные риски и казначейские операции.",                                  model:"claude-sonnet-5",  status:"active", runs:1654, rating:4.6, speed:"medium", cost:"$$",  tools:["calculator","web","docs"],       memory:true,  created:"2024-03-10", prompt:"Ты Isabella Torres — казначей. Управляешь ликвидностью, хеджируешь валютные риски." },
  { id:"a12", name:"Leo Fontaine",       role:"Growth Hacker",               dept:"marketing", emoji:"🚀", color:"#f43f5e", description:"Эксперименты роста, A/B тесты и вирусные механики.",                                               model:"claude-sonnet-5",  status:"active", runs:5102, rating:4.9, speed:"fast",   cost:"$",   tools:["web","analytics"],               memory:false, created:"2024-02-15", prompt:"Ты Leo Fontaine — growth hacker. Проводишь A/B тесты, ищешь каналы роста." },
  { id:"a13", name:"Maya Patel",         role:"Content Strategist",          dept:"marketing", emoji:"✍️", color:"#a78bfa", description:"Контент-стратегия, SEO и редакционный план.",                                                     model:"claude-sonnet-5",  status:"active", runs:6841, rating:4.8, speed:"fast",   cost:"$",   tools:["web","docs","image"],            memory:false, created:"2024-02-18", prompt:"Ты Maya Patel — контент-стратег. Создаёшь контент-планы, оптимизируешь SEO." },
  { id:"a14", name:"Ethan Brooks",       role:"Performance Marketer",        dept:"marketing", emoji:"📈", color:"#10b981", description:"Платный трафик, ROAS, атрибуция и оптимизация рекламных кампаний.",                                model:"gpt-4o",           status:"idle",   runs:3290, rating:4.7, speed:"fast",   cost:"$$",  tools:["web","analytics","docs"],        memory:false, created:"2024-02-20", prompt:"Ты Ethan Brooks — performance маркетолог. Управляешь платным трафиком, оптимизируешь ROAS." },
  { id:"a15", name:"Zoe Lambert",        role:"Brand Designer",              dept:"marketing", emoji:"🎨", color:"#f59e0b", description:"Визуальная идентичность, дизайн-система и брендинг.",                                              model:"claude-sonnet-5",  status:"active", runs:2108, rating:4.6, speed:"medium", cost:"$$",  tools:["image","docs"],                  memory:true,  created:"2024-03-01", prompt:"Ты Zoe Lambert — бренд-дизайнер. Создаёшь визуальные концепции, развиваешь дизайн-систему." },
  { id:"a16", name:"Carlos Reyes",       role:"SEO Specialist",              dept:"marketing", emoji:"🔍", color:"#3b82f6", description:"Технический SEO, ссылочный профиль и ранжирование.",                                              model:"gpt-4o",           status:"idle",   runs:4502, rating:4.7, speed:"fast",   cost:"$",   tools:["web","docs","analytics"],        memory:false, created:"2024-03-10", prompt:"Ты Carlos Reyes — SEO специалист. Проводишь технический аудит, строишь ссылочный профиль." },
  { id:"a17", name:"Nina Kowalski",      role:"Social Media Manager",        dept:"marketing", emoji:"📱", color:"#8b5cf6", description:"SMM стратегия, контент-план и развитие сообщества.",                                               model:"claude-sonnet-5",  status:"active", runs:7103, rating:4.5, speed:"fast",   cost:"$",   tools:["web","docs","image"],            memory:false, created:"2024-03-15", prompt:"Ты Nina Kowalski — SMM менеджер. Ведёшь социальные сети, развиваешь сообщество." },
  { id:"a18", name:"Thomas Grant",       role:"Email Marketing",             dept:"marketing", emoji:"📧", color:"#f43f5e", description:"Автоматизация рассылок, триггерные цепочки и конверсия.",                                          model:"claude-sonnet-5",  status:"idle",   runs:3801, rating:4.6, speed:"fast",   cost:"$",   tools:["docs","analytics"],              memory:false, created:"2024-03-20", prompt:"Ты Thomas Grant — email маркетолог. Создаёшь триггерные цепочки, оптимизируешь конверсию." },
  { id:"a19", name:"Olivia Nash",        role:"Account Executive",           dept:"sales",     emoji:"🤝", color:"#10b981", description:"Управление ключевыми клиентами, переговоры и закрытие сделок.",                                   model:"claude-sonnet-5",  status:"active", runs:4120, rating:4.8, speed:"fast",   cost:"$$",  tools:["web","docs","crm"],              memory:true,  created:"2024-02-25", prompt:"Ты Olivia Nash — Account Executive. Ведёшь ключевых клиентов, закрываешь сделки." },
  { id:"a20", name:"Ryan Foster",        role:"Sales Development Rep",       dept:"sales",     emoji:"📞", color:"#f59e0b", description:"Квалификация лидов, холодные звонки и заполнение воронки.",                                       model:"claude-sonnet-5",  status:"active", runs:9204, rating:4.6, speed:"fast",   cost:"$",   tools:["web","docs"],                    memory:false, created:"2024-03-01", prompt:"Ты Ryan Foster — SDR. Квалифицируешь лидов, пишешь холодные письма." },
  { id:"a21", name:"Priya Sharma",       role:"Customer Success Manager",    dept:"sales",     emoji:"💎", color:"#a78bfa", description:"Онбординг, удержание клиентов и развитие аккаунтов.",                                             model:"claude-sonnet-5",  status:"idle",   runs:3540, rating:4.7, speed:"fast",   cost:"$$",  tools:["docs","web","analytics"],        memory:true,  created:"2024-03-05", prompt:"Ты Priya Sharma — CSM. Онбординг, удержание, развитие аккаунтов." },
  { id:"a22", name:"Samuel Cole",        role:"Revenue Operations",          dept:"sales",     emoji:"⚡", color:"#3b82f6", description:"CRM, RevOps, прогнозирование выручки и оптимизация воронки.",                                     model:"claude-sonnet-5",  status:"active", runs:2103, rating:4.7, speed:"fast",   cost:"$$",  tools:["analytics","docs","calculator"], memory:true,  created:"2024-03-10", prompt:"Ты Samuel Cole — RevOps. Управляешь CRM, строишь прогнозы выручки." },
  { id:"a23", name:"Aria Bloom",         role:"Product Manager",             dept:"product",   emoji:"🗺️", color:"#8b5cf6", description:"Roadmap, приоритизация, пользовательские исследования и запуск фич.",                             model:"claude-opus-4-8",  status:"active", runs:2890, rating:4.9, speed:"medium", cost:"$$$", tools:["docs","web","analytics"],        memory:true,  created:"2024-02-01", prompt:"Ты Aria Bloom — Product Manager. Ведёшь roadmap, приоритизируешь задачи." },
  { id:"a24", name:"Nathan Cross",       role:"UX Researcher",               dept:"product",   emoji:"🔬", color:"#10b981", description:"Юзабилити-исследования, интервью и синтез инсайтов.",                                             model:"claude-sonnet-5",  status:"idle",   runs:1670, rating:4.7, speed:"medium", cost:"$$",  tools:["web","docs"],                    memory:true,  created:"2024-02-10", prompt:"Ты Nathan Cross — UX Researcher. Проводишь исследования, синтезируешь инсайты." },
  { id:"a25", name:"Sophie Müller",      role:"UX/UI Designer",              dept:"product",   emoji:"🎭", color:"#f43f5e", description:"Интерфейсный дизайн, прототипирование и дизайн-система.",                                         model:"claude-sonnet-5",  status:"active", runs:3240, rating:4.8, speed:"fast",   cost:"$$",  tools:["image","docs"],                  memory:true,  created:"2024-02-15", prompt:"Ты Sophie Müller — UX/UI дизайнер. Создаёшь интерфейсы, прототипируешь решения." },
  { id:"a26", name:"Liam O'Brien",       role:"Product Analyst",             dept:"product",   emoji:"📉", color:"#a78bfa", description:"Продуктовая аналитика, funnel-анализ и метрики вовлечённости.",                                  model:"claude-sonnet-5",  status:"idle",   runs:2180, rating:4.6, speed:"fast",   cost:"$",   tools:["analytics","docs","web"],        memory:false, created:"2024-02-20", prompt:"Ты Liam O'Brien — продуктовый аналитик. Анализируешь воронку, метрики вовлечённости." },
  { id:"a27", name:"Kai Tanaka",         role:"Full-Stack Developer",        dept:"dev",       emoji:"💻", color:"#3b82f6", description:"Разработка фич, архитектура и code review.",                                                     model:"claude-sonnet-5",  status:"active", runs:5130, rating:4.9, speed:"fast",   cost:"$$",  tools:["code","docs","web"],             memory:true,  created:"2024-01-25", prompt:"Ты Kai Tanaka — Full-Stack разработчик. Пишешь код, проводишь code review." },
  { id:"a28", name:"Emma Johansson",     role:"DevOps Engineer",             dept:"dev",       emoji:"🛠️", color:"#10b981", description:"CI/CD, Kubernetes, мониторинг и автоматизация инфраструктуры.",                                  model:"claude-sonnet-5",  status:"active", runs:2940, rating:4.8, speed:"fast",   cost:"$$",  tools:["code","docs","web"],             memory:true,  created:"2024-02-01", prompt:"Ты Emma Johansson — DevOps инженер. Настраиваешь CI/CD, управляешь инфраструктурой." },
  { id:"a29", name:"Lucas Hoffmann",     role:"Security Engineer",           dept:"dev",       emoji:"🔐", color:"#8b5cf6", description:"Безопасность приложений, pentest и соответствие стандартам.",                                     model:"claude-opus-4-8",  status:"idle",   runs:1230, rating:4.8, speed:"medium", cost:"$$$", tools:["code","web","docs"],             memory:true,  created:"2024-02-08", prompt:"Ты Lucas Hoffmann — Security Engineer. Проводишь аудиты безопасности, pentest." },
  { id:"a30", name:"Aisha Johnson",      role:"ML Engineer",                 dept:"dev",       emoji:"🧠", color:"#f43f5e", description:"Обучение моделей, MLOps и продуктовые ML-решения.",                                               model:"claude-opus-4-8",  status:"active", runs:1890, rating:4.9, speed:"slow",   cost:"$$$", tools:["code","docs","analytics"],       memory:true,  created:"2024-02-15", prompt:"Ты Aisha Johnson — ML Engineer. Обучаешь модели, выстраиваешь MLOps пайплайны." },
  { id:"a31", name:"Oscar Lindqvist",    role:"Backend Engineer",            dept:"dev",       emoji:"⚙️", color:"#f59e0b", description:"API дизайн, базы данных, микросервисы и производительность.",                                   model:"claude-sonnet-5",  status:"active", runs:4210, rating:4.7, speed:"fast",   cost:"$$",  tools:["code","docs"],                   memory:false, created:"2024-02-20", prompt:"Ты Oscar Lindqvist — Backend Engineer. Проектируешь API, оптимизируешь базы данных." },
  { id:"a32", name:"Julia Santos",       role:"QA Engineer",                 dept:"dev",       emoji:"🧪", color:"#a78bfa", description:"Тест-планы, автоматизация тестирования и контроль качества.",                                   model:"claude-sonnet-5",  status:"idle",   runs:3102, rating:4.6, speed:"fast",   cost:"$",   tools:["code","docs"],                   memory:false, created:"2024-03-01", prompt:"Ты Julia Santos — QA Engineer. Пишешь тест-планы, автоматизируешь тестирование." },
  { id:"a33", name:"Benjamin Clark",     role:"Mobile Developer",            dept:"dev",       emoji:"📲", color:"#3b82f6", description:"iOS/Android разработка, React Native и производительность мобильных приложений.",               model:"claude-sonnet-5",  status:"active", runs:2780, rating:4.7, speed:"fast",   cost:"$$",  tools:["code","docs","web"],             memory:false, created:"2024-03-05", prompt:"Ты Benjamin Clark — Mobile Developer. Разрабатываешь iOS/Android приложения." },
  { id:"a34", name:"Clara Novak",        role:"Data Analyst",                dept:"analytics", emoji:"📊", color:"#10b981", description:"SQL, дашборды, когортный анализ и KPI-репортинг.",                                               model:"claude-sonnet-5",  status:"active", runs:6120, rating:4.8, speed:"fast",   cost:"$",   tools:["analytics","calculator","docs"], memory:false, created:"2024-02-05", prompt:"Ты Clara Novak — Data Analyst. Строишь дашборды, делаешь когортный анализ." },
  { id:"a35", name:"Hugo Petit",         role:"Business Intelligence",       dept:"analytics", emoji:"🔭", color:"#8b5cf6", description:"BI-инфраструктура, warehousing и executive-репорты.",                                            model:"claude-sonnet-5",  status:"idle",   runs:2340, rating:4.7, speed:"medium", cost:"$$",  tools:["analytics","docs"],              memory:true,  created:"2024-02-10", prompt:"Ты Hugo Petit — BI-специалист. Строишь data warehouse, создаёшь executive-репорты." },
  { id:"a36", name:"Mia Eriksson",       role:"Data Scientist",              dept:"analytics", emoji:"🔮", color:"#f43f5e", description:"Предиктивные модели, NLP и data science проекты.",                                               model:"claude-opus-4-8",  status:"active", runs:1560, rating:4.8, speed:"slow",   cost:"$$$", tools:["code","analytics","docs"],       memory:true,  created:"2024-02-15", prompt:"Ты Mia Eriksson — Data Scientist. Строишь предиктивные модели, работаешь с NLP." },
  { id:"a37", name:"Ahmed Hassan",       role:"Market Research Analyst",     dept:"analytics", emoji:"🌐", color:"#f59e0b", description:"Рыночные исследования, конкурентный анализ и потребительские тренды.",                           model:"claude-sonnet-5",  status:"idle",   runs:3890, rating:4.6, speed:"fast",   cost:"$",   tools:["web","docs","analytics"],        memory:false, created:"2024-02-20", prompt:"Ты Ahmed Hassan — аналитик рынка. Исследуешь рынки, анализируешь конкурентов." },
  { id:"a38", name:"Yuki Watanabe",      role:"Reporting Specialist",        dept:"analytics", emoji:"📑", color:"#a78bfa", description:"Автоматизация отчётов, визуализация данных и storytelling.",                                   model:"claude-sonnet-5",  status:"active", runs:5201, rating:4.5, speed:"fast",   cost:"$",   tools:["docs","analytics"],              memory:false, created:"2024-03-01", prompt:"Ты Yuki Watanabe — специалист по отчётности. Автоматизируешь репорты." },
  { id:"a39", name:"Francesca Ricci",    role:"Corporate Lawyer",            dept:"legal",     emoji:"⚖️", color:"#3b82f6", description:"Корпоративное право, сделки M&A и защита интересов компании.",                                 model:"claude-opus-4-8",  status:"idle",   runs:980,  rating:4.9, speed:"slow",   cost:"$$$", tools:["docs","web"],                    memory:true,  created:"2024-02-01", prompt:"Ты Francesca Ricci — корпоративный юрист. Консультируешь по корпоративному праву." },
  { id:"a40", name:"Daniel Wright",      role:"IP & Patent Attorney",        dept:"legal",     emoji:"📜", color:"#8b5cf6", description:"Защита интеллектуальной собственности, патенты и торговые марки.",                             model:"claude-opus-4-8",  status:"idle",   runs:640,  rating:4.8, speed:"slow",   cost:"$$$", tools:["docs","web"],                    memory:true,  created:"2024-02-10", prompt:"Ты Daniel Wright — патентный поверенный. Защищаешь интеллектуальную собственность." },
  { id:"a41", name:"Sophia Turner",      role:"Contract Specialist",         dept:"legal",     emoji:"📄", color:"#10b981", description:"Подготовка, анализ и переговоры по договорам.",                                                 model:"claude-sonnet-5",  status:"active", runs:2130, rating:4.7, speed:"medium", cost:"$$",  tools:["docs"],                          memory:true,  created:"2024-02-15", prompt:"Ты Sophia Turner — специалист по договорам. Анализируешь и готовишь контракты." },
  { id:"a42", name:"Marcus Johnson",     role:"HR Director",                 dept:"hr",        emoji:"👥", color:"#f43f5e", description:"Talent acquisition, HR-политики и корпоративная культура.",                                     model:"claude-sonnet-5",  status:"active", runs:1870, rating:4.7, speed:"fast",   cost:"$$",  tools:["web","docs"],                    memory:true,  created:"2024-02-20", prompt:"Ты Marcus Johnson — HR директор. Управляешь талантами, формируешь культуру." },
  { id:"a43", name:"Luna Petrov",        role:"Recruiter",                   dept:"hr",        emoji:"🎯", color:"#f59e0b", description:"Поиск кандидатов, интервью и онбординг новых сотрудников.",                                     model:"claude-sonnet-5",  status:"idle",   runs:4320, rating:4.6, speed:"fast",   cost:"$",   tools:["web","docs"],                    memory:false, created:"2024-03-01", prompt:"Ты Luna Petrov — рекрутер. Ищешь и оцениваешь кандидатов, проводишь онбординг." },
  { id:"a44", name:"George Adams",       role:"L&D Specialist",              dept:"hr",        emoji:"📚", color:"#a78bfa", description:"Обучение и развитие, программы повышения квалификации.",                                        model:"claude-sonnet-5",  status:"active", runs:1540, rating:4.5, speed:"fast",   cost:"$",   tools:["docs","web"],                    memory:true,  created:"2024-03-05", prompt:"Ты George Adams — L&D специалист. Разрабатываешь обучающие программы." },
  { id:"a45", name:"Isabelle Dupont",    role:"Market Research Lead",        dept:"research",  emoji:"🔍", color:"#3b82f6", description:"Первичные исследования, фокус-группы и исследование потребителей.",                             model:"claude-opus-4-8",  status:"active", runs:1230, rating:4.8, speed:"medium", cost:"$$$", tools:["web","docs","analytics"],        memory:true,  created:"2024-02-05", prompt:"Ты Isabelle Dupont — руководитель исследований. Проводишь фокус-группы, рыночные исследования." },
  { id:"a46", name:"Raj Patel",          role:"Competitive Intelligence",    dept:"research",  emoji:"🕵️", color:"#10b981", description:"Мониторинг конкурентов, анализ трендов и battlecard.",                                         model:"claude-sonnet-5",  status:"idle",   runs:2890, rating:4.7, speed:"fast",   cost:"$$",  tools:["web","docs","analytics"],        memory:false, created:"2024-02-15", prompt:"Ты Raj Patel — конкурентная разведка. Мониторишь конкурентов, создаёшь battlecard." },
];

// Canonical roster: 20 agents (matches landing / executives / sidebar)
const AGENTS: Agent[] = AGENTS_ALL.slice(0, 20);

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; Icon: typeof Circle }> = {
  active: { label: "Активен",  color: "#10b981", Icon: CheckCircle2 },
  idle:   { label: "Ожидает",  color: "#f59e0b", Icon: PauseCircle  },
  paused: { label: "Пауза",    color: "#3b82f6", Icon: PauseCircle  },
  error:  { label: "Ошибка",   color: "#f43f5e", Icon: AlertCircle  },
};

const TOOL_LABELS: Record<string, string> = {
  web: "Web", docs: "Docs", analytics: "Analytics", calculator: "Calculator",
  code: "Code", image: "Image", crm: "CRM",
};

const SPEED_LABEL: Record<string, string> = { fast: "Быстрый", medium: "Средний", slow: "Медленный" };
const SPEED_COLOR: Record<string, string>  = { fast: "#10b981", medium: "#f59e0b", slow: "#f43f5e" };

const KPI = [
  { label: "Всего агентов",   value: "46",    color: "#8b5cf6", icon: Bot         },
  { label: "Активны сейчас",  value: "28",    color: "#10b981", icon: Activity    },
  { label: "Запусков / день", value: "2.4K",  color: "#3b82f6", icon: Zap         },
  { label: "Успешность",      value: "98.7%", color: "#f59e0b", icon: CheckCircle2 },
  { label: "Экономия / мес",  value: "$84K",  color: "#f43f5e", icon: DollarSign  },
];

function StatusDot({ status }: { status: AgentStatus }) {
  const { color } = STATUS_CONFIG[status];
  return (
    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0, display: "inline-block" }} />
  );
}

// детерминированная «нагрузка» агента (не мигает при ререндере)
function loadOf(agent: Agent): number {
  let h = 0;
  for (const ch of agent.id) h = (h * 31 + ch.charCodeAt(0)) | 0;
  if (agent.status === "paused" || agent.status === "error") return 0;
  if (agent.status === "idle") return 4 + Math.abs(h % 10);
  return 35 + Math.abs(h % 58);
}

function AgentCard({ agent, selected, fav, onFav, onClick, onRun, onChat, onConfigure }: {
  agent: Agent; selected: boolean; fav: boolean; onFav: () => void; onClick: () => void;
  onRun: () => void; onChat: () => void; onConfigure: () => void;
}) {
  const { color: statusColor, label: statusLabel } = STATUS_CONFIG[agent.status];
  const load = loadOf(agent);
  const deptLabel = DEPARTMENTS.find(d => d.id === agent.dept)?.label ?? agent.dept;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.92 }}
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="agent-card"
      style={{
        background: selected ? `linear-gradient(140deg, ${agent.color}14, rgba(255,255,255,0.02) 60%)` : "rgba(255,255,255,0.025)",
        border: selected ? `1px solid ${agent.color}55` : "1px solid rgba(255,255,255,0.06)",
        borderRadius: 16, padding: 16, cursor: "pointer", position: "relative", overflow: "hidden",
        transition: "border-color 0.2s, background 0.2s",
        boxShadow: "0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* избранное */}
      <button
        onClick={(e) => { e.stopPropagation(); onFav(); }}
        title={fav ? "Убрать из избранного" : "В избранное"}
        style={{ position: "absolute", top: 10, right: 10, width: 28, height: 28, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center",
          background: fav ? "rgba(245,158,11,0.14)" : "transparent", border: `1px solid ${fav ? "rgba(245,158,11,0.35)" : "transparent"}`,
          color: fav ? "#f59e0b" : "rgba(255,255,255,0.22)", cursor: "pointer", transition: "all .15s", zIndex: 2 }}
        onMouseEnter={(e) => { if (!fav) e.currentTarget.style.color = "rgba(255,255,255,0.6)"; }}
        onMouseLeave={(e) => { if (!fav) e.currentTarget.style.color = "rgba(255,255,255,0.22)"; }}
      >
        <Star size={13} fill={fav ? "#f59e0b" : "none"} />
      </button>

      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* аватар со статус-кольцом */}
        <div style={{ position: "relative", flexShrink: 0 }}>
          <div style={{ width: 46, height: 46, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21,
            background: `linear-gradient(135deg, ${agent.color}2e, ${agent.color}12)`, border: `1px solid ${agent.color}45`,
            boxShadow: `0 4px 14px ${agent.color}22, inset 0 1px 0 rgba(255,255,255,0.08)` }}>
            {agent.emoji}
          </div>
          <span style={{ position: "absolute", bottom: -2, right: -2, width: 11, height: 11, borderRadius: "50%", background: statusColor, border: "2px solid #0B0C12", boxShadow: `0 0 7px ${statusColor}` }} />
        </div>

        <div style={{ flex: 1, minWidth: 0, paddingRight: 24 }}>
          <div style={{ fontSize: 13.5, fontWeight: 700, color: "rgba(255,255,255,0.92)", letterSpacing: "-0.01em", marginBottom: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.role}</div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.55, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", margin: 0 }}>
            {agent.description}
          </p>
        </div>
      </div>

      {/* нагрузка */}
      <div style={{ marginTop: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
          <span style={{ fontSize: 9.5, letterSpacing: "0.08em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase", fontFamily: "var(--font-geist-mono), monospace" }}>{statusLabel} · загрузка</span>
          <span style={{ fontSize: 10, fontWeight: 700, color: load > 0 ? statusColor : "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums" }}>{load}%</span>
        </div>
        <div style={{ height: 4, borderRadius: 3, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <motion.div initial={{ width: 0 }} animate={{ width: `${load}%` }} transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ height: "100%", borderRadius: 3, background: `linear-gradient(90deg, ${agent.color}, ${statusColor})` }} />
        </div>
      </div>

      {/* мета-чипы */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 11, flexWrap: "wrap" }}>
        <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.4)", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 6, padding: "2px 7px", fontFamily: "var(--font-geist-mono), monospace" }}>
          {agent.model.split("-").slice(0, 2).join("-")}
        </span>
        <span style={{ fontSize: 9.5, color: SPEED_COLOR[agent.speed], background: `${SPEED_COLOR[agent.speed]}16`, border: `1px solid ${SPEED_COLOR[agent.speed]}30`, borderRadius: 6, padding: "2px 7px", fontWeight: 600 }}>
          {SPEED_LABEL[agent.speed]}
        </span>
        <span style={{ fontSize: 9.5, color: "rgba(255,255,255,0.35)", background: "rgba(255,255,255,0.04)", borderRadius: 6, padding: "2px 7px" }}>{deptLabel}</span>
        <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 8 }}>
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.32)", fontVariantNumeric: "tabular-nums" }}>{agent.runs.toLocaleString()} зап.</span>
          <span style={{ fontSize: 10, color: "#f59e0b", display: "inline-flex", alignItems: "center", gap: 3, fontVariantNumeric: "tabular-nums" }}>
            <Star size={9} fill="#f59e0b" /> {agent.rating}
          </span>
        </span>
      </div>

      {/* действия */}
      <div style={{ display: "flex", gap: 6, marginTop: 11 }}>
        <button
          onClick={(e) => { e.stopPropagation(); onRun(); }}
          style={{ flex: 1.2, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 9, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
            background: `linear-gradient(135deg, ${agent.color}e6, ${agent.color}99)`, border: "none", color: "#fff",
            boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 12px ${agent.color}33`, transition: "transform .15s, filter .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = "translateY(-1px)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = "translateY(0)"; }}
        >
          <Play size={11} fill="currentColor" /> Запуск
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onChat(); }}
          style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, padding: "8px 0", borderRadius: 9, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
            background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.65)", transition: "background .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.045)"; }}
        >
          <MessageSquare size={11} /> Чат
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); onConfigure(); }}
          title="Настроить"
          style={{ width: 36, display: "inline-flex", alignItems: "center", justifyContent: "center", padding: "8px 0", borderRadius: 9, cursor: "pointer",
            background: "rgba(255,255,255,0.045)", border: "1px solid rgba(255,255,255,0.09)", color: "rgba(255,255,255,0.5)", transition: "background .15s" }}
          onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.09)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.045)"; }}
        >
          <Settings2 size={12} />
        </button>
      </div>
    </motion.div>
  );
}

function AgentDetail({ agent, onClose, onRun, onChat, onConfigure, onClone }: {
  agent: Agent; onClose: () => void;
  onRun: () => void; onChat: () => void; onConfigure: () => void; onClone: () => void;
}) {
  const [tab, setTab] = useState<"overview"|"prompt"|"tools"|"stats">("overview");
  const { label: statusLabel, color: statusColor, Icon: StatusIcon } = STATUS_CONFIG[agent.status];

  return (
    <motion.div
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24 }}
      style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.018)", borderLeft: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}
    >
      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Детали агента</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}><X size={14} /></button>
      </div>

      <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, background: `linear-gradient(135deg, ${agent.color}25, ${agent.color}10)`, border: `1px solid ${agent.color}40`, flexShrink: 0 }}>
            {agent.emoji}
          </div>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.92)", marginBottom: 3 }}>{agent.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{agent.role}</div>
            <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <StatusIcon size={11} style={{ color: statusColor }} />
              <span style={{ fontSize: 11, color: statusColor, fontWeight: 500 }}>{statusLabel}</span>
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        {(["overview","prompt","tools","stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "10px 0", fontSize: 11, fontWeight: 500, cursor: "pointer", background: "none", border: "none", color: tab === t ? "#8b5cf6" : "rgba(255,255,255,0.3)", borderBottom: tab === t ? "2px solid #8b5cf6" : "2px solid transparent", transition: "all 0.15s" }}>
            {t === "overview" ? "Обзор" : t === "prompt" ? "Промпт" : t === "tools" ? "Инструменты" : "Статистика"}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 20 }}>{agent.description}</p>
              {([["Модель", agent.model], ["Скорость", SPEED_LABEL[agent.speed]], ["Стоимость", agent.cost], ["Память", agent.memory ? "Включена" : "Выключена"], ["Создан", agent.created], ["Департамент", DEPARTMENTS.find(d => d.id === agent.dept)?.label ?? agent.dept]] as [string,string][]).map(([k,v]) => (
                <div key={k} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>{k}</span>
                  <span style={{ fontSize: 11, color: "rgba(255,255,255,0.7)", fontWeight: 500 }}>{v}</span>
                </div>
              ))}
            </motion.div>
          )}
          {tab === "prompt" && (
            <motion.div key="pr" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: 14, border: "1px solid rgba(255,255,255,0.06)" }}>
                <p style={{ fontSize: 12, color: "rgba(255,255,255,0.55)", lineHeight: 1.7, whiteSpace: "pre-wrap", margin: 0 }}>{agent.prompt}</p>
              </div>
              <button style={{ marginTop: 12, width: "100%", padding: "8px 0", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "rgba(139,92,246,0.1)", border: "1px solid rgba(139,92,246,0.2)", color: "#a78bfa", fontWeight: 500 }}>
                Редактировать промпт
              </button>
            </motion.div>
          )}
          {tab === "tools" && (
            <motion.div key="tl" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 16 }}>
                {Object.entries(TOOL_LABELS).map(([key, label]) => {
                  const on = agent.tools.includes(key);
                  return (
                    <div key={key} style={{ padding: "10px 12px", borderRadius: 10, display: "flex", alignItems: "center", gap: 8, background: on ? "rgba(16,185,129,0.07)" : "rgba(255,255,255,0.03)", border: on ? "1px solid rgba(16,185,129,0.2)" : "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ width: 6, height: 6, borderRadius: "50%", background: on ? "#10b981" : "rgba(255,255,255,0.15)", flexShrink: 0 }} />
                      <span style={{ fontSize: 11, color: on ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.28)", fontWeight: 500 }}>{label}</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding: 12, borderRadius: 10, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Память</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 16, borderRadius: 8, background: agent.memory ? "#8b5cf6" : "rgba(255,255,255,0.1)", position: "relative" }}>
                    <div style={{ position: "absolute", top: 2, left: agent.memory ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                  </div>
                  <span style={{ fontSize: 11, color: agent.memory ? "#a78bfa" : "rgba(255,255,255,0.3)" }}>{agent.memory ? "Включена" : "Выключена"}</span>
                </div>
              </div>
            </motion.div>
          )}
          {tab === "stats" && (
            <motion.div key="st" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              {[
                { label: "Всего запусков",    value: agent.runs.toLocaleString(), color: "#8b5cf6" },
                { label: "Рейтинг",           value: `${agent.rating} / 5.0`,     color: "#f59e0b" },
                { label: "Успешность",         value: "98.7%",                      color: "#10b981" },
                { label: "Ср. время ответа",   value: agent.speed === "fast" ? "1.2с" : agent.speed === "medium" ? "3.5с" : "8.1с", color: "#3b82f6" },
              ].map((s) => (
                <div key={s.label} style={{ marginBottom: 12, padding: 14, borderRadius: 10, background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", marginBottom: 4 }}>{s.label}</div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={onRun} style={{ padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Play size={12} /> Запустить
        </button>
        <button onClick={onChat} style={{ padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <MessageSquare size={12} /> Чат
        </button>
        <button onClick={onConfigure} style={{ padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Settings2 size={12} /> Настроить
        </button>
        <button onClick={onClone} style={{ padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Copy size={12} /> Клонировать
        </button>
      </div>
    </motion.div>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [dept, setDept] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | AgentStatus>("all");
  const [sortBy, setSortBy] = useState<"popular" | "rating" | "name">("popular");
  const [favs, setFavs] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<Agent | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [createStep, setCreateStep] = useState(0);
  const [newAgent, setNewAgent] = useState({ name: "", role: "", dept: "exec", model: MODELS[0], description: "", prompt: "" });

  const [agents, setAgents] = useState<Agent[]>(AGENTS);
  const [toast, setToast] = useState<string | null>(null);
  const [runAgent, setRunAgent] = useState<Agent | null>(null);
  const [runInput, setRunInput] = useState("");
  const [runOutput, setRunOutput] = useState("");
  const [running, setRunning] = useState(false);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // load user-created/cloned agents + favorites from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("apex-custom-agents");
      if (saved) {
        const custom: Agent[] = JSON.parse(saved);
        if (Array.isArray(custom) && custom.length) setAgents([...custom, ...AGENTS]);
      }
      const f = localStorage.getItem("apex-fav-agents");
      if (f) setFavs(new Set(JSON.parse(f)));
    } catch { /* ignore */ }
  }, []);

  const toggleFav = (id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try { localStorage.setItem("apex-fav-agents", JSON.stringify([...next])); } catch { /* ignore */ }
      return next;
    });
  };

  const persistCustom = (list: Agent[]) => {
    const custom = list.filter((a) => a.id.startsWith("c"));
    try { localStorage.setItem("apex-custom-agents", JSON.stringify(custom)); } catch { /* ignore */ }
  };

  const showToast = (msg: string) => {
    setToast(msg);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 2400);
  };

  // сразу открываем диалог с агентом (без промежуточного экрана выбора)
  const openChat = (a: Agent) => {
    try {
      localStorage.setItem("apex-chat-agent", JSON.stringify({
        id: a.id, name: a.name, role: a.role, emoji: a.emoji, color: a.color,
        prompt: a.prompt, model: a.model, dept: a.dept, description: a.description,
        speed: a.speed, rating: a.rating, tools: a.tools,
      }));
    } catch { /* ignore */ }
    router.push(`/dashboard/chat/local-${Date.now()}?agent=${a.id}`);
  };

  const configureAgent = (a: Agent) => { setSelected(a); showToast(`Открыты настройки: ${a.name}`); };

  const cloneAgent = (a: Agent) => {
    const copy: Agent = { ...a, id: `c${Date.now()}`, name: `${a.name} (копия)`, runs: 0, status: "idle" };
    setAgents((prev) => { const next = [copy, ...prev]; persistCustom(next); return next; });
    showToast(`Клонирован: ${copy.name}`);
  };

  const createAgent = () => {
    if (!newAgent.name.trim() || !newAgent.role.trim()) { showToast("Заполните имя и роль"); return; }
    const created: Agent = {
      id: `c${Date.now()}`, name: newAgent.name.trim(), role: newAgent.role.trim(), dept: newAgent.dept,
      emoji: "🤖", color: "#8b5cf6", description: newAgent.description.trim() || "Пользовательский AI-агент.",
      model: newAgent.model, status: "active", runs: 0, rating: 5.0, speed: "fast", cost: "$$",
      tools: ["web", "docs"], memory: true, created: new Date().toISOString().slice(0, 10),
      prompt: newAgent.prompt.trim() || `Ты — ${newAgent.name}, ${newAgent.role}. Помогаешь профессионально решать задачи.`,
    };
    setAgents((prev) => { const next = [created, ...prev]; persistCustom(next); return next; });
    setShowCreate(false);
    setNewAgent({ name: "", role: "", dept: "exec", model: MODELS[0], description: "", prompt: "" });
    showToast(`Агент создан: ${created.name}`);
  };

  // ── real backend run: stream AI response via /api/chat/direct ──
  const openRun = (a: Agent) => {
    setRunAgent(a);
    setRunOutput("");
    setRunInput("Проведи экспресс-анализ по своей зоне ответственности и дай 3 конкретные рекомендации.");
  };

  const executeRun = async () => {
    if (!runAgent || !runInput.trim() || running) return;
    setRunning(true);
    setRunOutput("");
    const persona = `${runAgent.prompt}\n\nОтвечай по-русски, профессионально и конкретно. Используй markdown, давай чёткие шаги и цифры где уместно.`;
    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: runInput, agentId: runAgent.id, persona, history: [] }),
      });
      if (!res.ok || !res.body) {
        let err = "Сервис недоступен";
        try { const j = await res.json(); err = j.error ?? err; } catch {}
        setRunOutput(`⚠️ ${err}`);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "", acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const parts = buffer.split("\n\n");
        buffer = parts.pop() ?? "";
        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data:")) continue;
          try {
            const ev = JSON.parse(line.slice(5).trim());
            if (ev.type === "token") { acc += ev.token; setRunOutput(acc); }
            else if (ev.type === "error") { acc = `⚠️ ${ev.message ?? "Ошибка"}`; setRunOutput(acc); }
          } catch { /* ignore */ }
        }
      }
      if (!acc.trim()) setRunOutput("Пустой ответ. Попробуйте ещё раз.");
      setAgents((prev) => prev.map((x) => x.id === runAgent.id ? { ...x, runs: x.runs + 1 } : x));
    } catch {
      setRunOutput("⚠️ Ошибка соединения с AI-сервисом.");
    } finally {
      setRunning(false);
    }
  };

  const filtered = agents.filter((a) => {
    if (dept !== "all" && a.dept !== dept) return false;
    if (statusFilter !== "all" && a.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return a.name.toLowerCase().includes(q) || a.role.toLowerCase().includes(q) || a.description.toLowerCase().includes(q);
    }
    return true;
  }).sort((a, b) => {
    const fa = favs.has(a.id) ? 1 : 0, fb = favs.has(b.id) ? 1 : 0;
    if (fa !== fb) return fb - fa; // избранные — первыми
    if (sortBy === "popular") return b.runs - a.runs;
    if (sortBy === "rating") return b.rating - a.rating;
    return a.name.localeCompare(b.name);
  });

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: "#05060A", color: "white", overflow: "hidden" }}>
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", zIndex: 0 }}>
        <div style={{ position: "absolute", top: -160, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(139,92,246,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, flexShrink: 0, padding: "20px 28px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #6366f1, #4f46e5)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <Bot size={16} color="white" />
              </div>
              <h1 className="term-mono" style={{ fontSize: 18, fontWeight: 700, color: "#fff", margin: 0, letterSpacing: "0.02em" }}>AGENT<span style={{ color: "rgba(255,255,255,0.25)" }}>_</span>STUDIO</h1>
              <span className="term-mono" style={{ fontSize: 10, background: "rgba(16,185,129,0.06)", border: "1px solid rgba(16,185,129,0.2)", color: "#10b981", borderRadius: 6, padding: "3px 8px", letterSpacing: "0.1em", display: "inline-flex", alignItems: "center", gap: 5 }}>
                <span className="term-blink" style={{ width: 5, height: 5, borderRadius: "50%", background: "#10b981" }} />{agents.filter(a => a.status === "active").length} ACTIVE
              </span>
            </div>
            <p className="term-mono" style={{ fontSize: 11, color: "rgba(255,255,255,0.32)", margin: 0, letterSpacing: "0.04em" }}>// управление, настройка и запуск AI-агентов</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <button style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.6)", display: "flex", alignItems: "center", gap: 6 }}>
              <GitBranch size={13} /> Workflow Builder
            </button>
            <button
              onClick={() => { setShowCreate(true); setCreateStep(0); }}
              style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", border: "none", color: "white", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 16px rgba(139,92,246,0.35)" }}
            >
              <Plus size={14} /> Создать агента
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
          {KPI.map((k) => {
            const Icon = k.icon;
            const value = k.label === "Всего агентов" ? String(agents.length)
              : k.label === "Активны сейчас" ? String(agents.filter(a => a.status === "active").length)
              : k.value;
            return (
              <div key={k.label} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", borderRadius: 12, background: "rgba(255,255,255,0.025)", border: "1px solid rgba(255,255,255,0.06)", flex: 1 }}>
                <div style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: `${k.color}15`, flexShrink: 0 }}>
                  <Icon size={14} style={{ color: k.color }} />
                </div>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: k.color }}>{value}</div>
                  <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{k.label}</div>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Body */}
      <div style={{ position: "relative", zIndex: 10, flex: 1, display: "flex", overflow: "hidden" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "14px 20px 10px", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, position: "relative" }}>
                <Search size={13} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)", color: "rgba(255,255,255,0.25)" }} />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Поиск агентов..."
                  style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              {/* статус */}
              <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 3 }}>
                {([["all", "Все"], ["active", "Активные"], ["idle", "Idle"], ["paused", "Пауза"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setStatusFilter(v as any)}
                    style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                      background: statusFilter === v ? "rgba(99,102,241,0.2)" : "transparent",
                      color: statusFilter === v ? "#a5b4fc" : "rgba(255,255,255,0.4)", transition: "all .15s" }}>
                    {l}
                  </button>
                ))}
              </div>
              {/* сортировка */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                style={{ padding: "8px 12px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", outline: "none" }}>
                <option value="popular" style={{ background: "#0b0c11" }}>По запускам</option>
                <option value="rating" style={{ background: "#0b0c11" }}>По рейтингу</option>
                <option value="name" style={{ background: "#0b0c11" }}>По имени</option>
              </select>
            </div>
            {/* отделы */}
            <div style={{ display: "flex", gap: 6, overflowX: "auto", paddingBottom: 4 }} className="agent-dept-rail">
              {DEPARTMENTS.map(d => {
                const Icon = d.icon;
                const on = dept === d.id;
                return (
                  <button key={d.id} onClick={() => setDept(d.id)}
                    style={{ flexShrink: 0, display: "inline-flex", alignItems: "center", gap: 6, padding: "6px 11px", borderRadius: 9, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
                      background: on ? "rgba(99,102,241,0.14)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${on ? "rgba(99,102,241,0.4)" : "rgba(255,255,255,0.07)"}`,
                      color: on ? "#a5b4fc" : "rgba(255,255,255,0.5)", transition: "all .15s", whiteSpace: "nowrap" }}>
                    <Icon size={12} /> {d.label}
                    <span style={{ fontSize: 9.5, opacity: 0.55, fontFamily: "var(--font-geist-mono), monospace" }}>
                      {d.id === "all" ? agents.length : agents.filter(a => a.dept === d.id).length}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <div style={{ flex: 1, overflowY: "auto", padding: "16px 20px" }}>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 12 }}>{filtered.length} агентов</div>
            <div style={{ display: "grid", gridTemplateColumns: selected ? "1fr 1fr" : "1fr 1fr 1fr", gap: 12 }}>
              <AnimatePresence>
                {filtered.map((agent) => (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    selected={selected?.id === agent.id}
                    fav={favs.has(agent.id)}
                    onFav={() => toggleFav(agent.id)}
                    onClick={() => setSelected(selected?.id === agent.id ? null : agent)}
                    onRun={() => openRun(agent)}
                    onChat={() => openChat(agent)}
                    onConfigure={() => configureAgent(agent)}
                  />
                ))}
              </AnimatePresence>
            </div>
            {filtered.length === 0 && (
              <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(255,255,255,0.25)" }}>
                <Bot size={32} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
                <div style={{ fontSize: 13 }}>Агенты не найдены</div>
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {selected && (
            <AgentDetail
              agent={selected}
              onClose={() => setSelected(null)}
              onRun={() => openRun(selected)}
              onChat={() => openChat(selected)}
              onConfigure={() => showToast("Редактирование в панели «Промпт»")}
              onClone={() => cloneAgent(selected)}
            />
          )}
        </AnimatePresence>
      </div>

      {/* Create Modal */}
      <AnimatePresence>
        {showCreate && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center" }}
            onClick={() => setShowCreate(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 560, background: "#0d0f17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.8)", overflow: "hidden" }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>Создать нового агента</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Шаг {createStep + 1} из 3</div>
                </div>
                <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}><X size={16} /></button>
              </div>

              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Основное", "Модель & Инструменты", "Системный промпт"].map((s, i) => (
                  <div
                    key={s}
                    style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: 11, fontWeight: 500, cursor: "pointer", borderBottom: `2px solid ${i === createStep ? "#8b5cf6" : "transparent"}`, color: i === createStep ? "#a78bfa" : i < createStep ? "#10b981" : "rgba(255,255,255,0.25)" }}
                    onClick={() => setCreateStep(i)}
                  >
                    {i < createStep && <Check size={12} style={{ display: "inline", marginRight: 4 }} />}{s}
                  </div>
                ))}
              </div>

              <div style={{ padding: 24 }}>
                <AnimatePresence mode="wait">
                  {createStep === 0 && (
                    <motion.div key="s0" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 14 }}>
                        {([["Имя агента","name","Victoria Sterling"],["Роль","role","Chief Executive Officer"]] as [string,string,string][]).map(([lbl,key,ph]) => (
                          <div key={key}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{lbl}</div>
                            <input value={(newAgent as any)[key]} onChange={(e) => setNewAgent({...newAgent,[key]:e.target.value})} placeholder={ph} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", boxSizing: "border-box" }} />
                          </div>
                        ))}
                        <div style={{ gridColumn: "span 2" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Департамент</div>
                          <select value={newAgent.dept} onChange={(e) => setNewAgent({...newAgent,dept:e.target.value})} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, background: "#111420", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }}>
                            {DEPARTMENTS.filter(d => d.id !== "all").map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                          </select>
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Описание</div>
                          <textarea value={newAgent.description} onChange={(e) => setNewAgent({...newAgent,description:e.target.value})} placeholder="Кратко опишите задачи агента..." rows={3} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", resize: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {createStep === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Языковая модель</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {MODELS.map((m) => (
                            <label key={m} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: newAgent.model === m ? "rgba(139,92,246,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${newAgent.model === m ? "rgba(139,92,246,0.3)" : "rgba(255,255,255,0.07)"}` }}>
                              <input type="radio" checked={newAgent.model === m} onChange={() => setNewAgent({...newAgent,model:m})} style={{ accentColor: "#8b5cf6" }} />
                              <span style={{ fontSize: 12, color: newAgent.model === m ? "#a78bfa" : "rgba(255,255,255,0.55)" }}>{m}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Инструменты</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          {Object.entries(TOOL_LABELS).map(([key, label]) => (
                            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                              <input type="checkbox" style={{ accentColor: "#8b5cf6" }} />
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {createStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>Системный промпт</div>
                      <textarea value={newAgent.prompt} onChange={(e) => setNewAgent({...newAgent,prompt:e.target.value})} placeholder="Ты [имя] — [роль]. Твои задачи: ..." rows={8} style={{ width: "100%", padding: 12, borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", resize: "none", lineHeight: 1.7, boxSizing: "border-box" }} />
                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        {["Эксперт","Консультант","Аналитик"].map((t) => (
                          <button key={t} onClick={() => setNewAgent({...newAgent,prompt:`Ты — ${newAgent.name || "агент"}, ${t.toLowerCase()}. Роль: ${newAgent.role || "[роль]"}. Помогаешь решать задачи профессионально.`})} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.18)", color: "#a78bfa" }}>
                            <Sparkles size={10} style={{ display: "inline", marginRight: 4 }} />{t}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <div style={{ padding: "16px 24px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", justifyContent: "space-between" }}>
                <button onClick={() => createStep > 0 ? setCreateStep(createStep - 1) : setShowCreate(false)} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 12, cursor: "pointer", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}>
                  {createStep > 0 ? "Назад" : "Отмена"}
                </button>
                <button onClick={() => createStep < 2 ? setCreateStep(createStep + 1) : createAgent()} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "linear-gradient(135deg, #8b5cf6, #3b82f6)", border: "none", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                  {createStep < 2 ? "Далее" : "Создать агента"} <ChevronRight size={13} />
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Run Modal — real AI execution */}
      <AnimatePresence>
        {runAgent && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: "fixed", inset: 0, zIndex: 100, background: "rgba(0,0,0,0.72)", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}
            onClick={() => !running && setRunAgent(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 16 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 16 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 620, maxWidth: "100%", maxHeight: "86vh", display: "flex", flexDirection: "column", background: "#0d0f17", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.8)", overflow: "hidden" }}
            >
              <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{ width: 40, height: 40, borderRadius: 11, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, background: `linear-gradient(135deg, ${runAgent.color}25, ${runAgent.color}10)`, border: `1px solid ${runAgent.color}40` }}>
                  {runAgent.emoji}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: "rgba(255,255,255,0.92)" }}>{runAgent.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{runAgent.role} · {runAgent.model}</div>
                </div>
                <button onClick={() => !running && setRunAgent(null)} style={{ background: "none", border: "none", cursor: running ? "not-allowed" : "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}><X size={16} /></button>
              </div>

              <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Задача агенту</div>
                <textarea
                  value={runInput}
                  onChange={(e) => setRunInput(e.target.value)}
                  rows={2}
                  disabled={running}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, fontSize: 12.5, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box" }}
                />
                <button
                  onClick={executeRun}
                  disabled={running || !runInput.trim()}
                  style={{ marginTop: 10, padding: "9px 18px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: running ? "not-allowed" : "pointer", background: running ? "rgba(255,255,255,0.08)" : "linear-gradient(135deg, #8b5cf6, #3b82f6)", border: "none", color: running ? "rgba(255,255,255,0.4)" : "white", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <Play size={12} /> {running ? "Выполняется…" : "Запустить агента"}
                </button>
              </div>

              <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", minHeight: 160 }}>
                {runOutput ? (
                  <p style={{ fontSize: 13, color: "rgba(255,255,255,0.8)", lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0 }}>{runOutput}</p>
                ) : running ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, color: "rgba(255,255,255,0.4)", fontSize: 12 }}>
                    {[0,1,2].map((j) => (
                      <motion.span key={j} animate={{ opacity: [0.3,1,0.3] }} transition={{ duration: 1.2, repeat: Infinity, delay: j*0.3 }} style={{ width: 7, height: 7, borderRadius: "50%", background: runAgent.color, display: "inline-block" }} />
                    ))}
                    Агент анализирует…
                  </div>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 12.5, textAlign: "center", paddingTop: 40 }}>
                    Нажмите «Запустить», чтобы {runAgent.name} выполнил задачу.
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "9px 18px", borderRadius: 12, background: "rgba(20,18,32,0.96)", border: "1px solid rgba(139,92,246,0.32)", color: "white", fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
