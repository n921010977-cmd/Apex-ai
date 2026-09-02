"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { saveAsk } from "@/lib/ask-history";
import {
  Bot, Plus, Search, Play, MessageSquare, Settings2, BarChart2, Copy,
  Star, Zap, Shield, TrendingUp, Users, Code2, Scale, FlaskConical,
  ChevronRight, X, Check, Brain, Database, Globe, Cpu,
  Activity, Clock, DollarSign, GitBranch, Package, Layers, Filter,
  ArrowUpRight, Sparkles, CheckCircle2, PauseCircle, Circle,
  AlertCircle, Crown, Target, Briefcase, Megaphone, Rocket, PenLine,
  Palette, Share2, Mail, Handshake, Phone, Gem, Map, Microscope,
  Server, ShieldCheck, TestTube2, Smartphone, Eye, Atom, FileBarChart,
  BookOpen, UserSearch, GraduationCap, Telescope, Landmark, PieChart,
  type LucideIcon,
} from "lucide-react";

const AGENT_ICON_MAP: Record<string, LucideIcon> = {
  a1:  Crown,        // CEO
  a2:  Target,       // CSO
  a3:  Settings2,    // COO
  a4:  Briefcase,    // CFO
  a5:  Megaphone,    // CMO
  a6:  Cpu,          // CTO
  a7:  BarChart2,    // Financial Analyst
  a8:  TrendingUp,   // Investment Analyst
  a9:  Scale,        // Tax & Compliance
  a10: PieChart,     // Budget Controller
  a11: Landmark,     // Treasury Manager
  a12: Rocket,       // Growth Hacker
  a13: PenLine,      // Content Strategist
  a14: BarChart2,    // Performance Marketer
  a15: Palette,      // Brand Designer
  a16: Search,       // SEO Specialist
  a17: Share2,       // Social Media Manager
  a18: Mail,         // Email Marketing
  a19: Handshake,    // Account Executive
  a20: Phone,        // Sales Development Rep
  a21: Gem,          // Customer Success Manager
  a22: Zap,          // Revenue Operations
  a23: Map,          // Product Manager
  a24: Microscope,   // UX Researcher
  a25: Palette,      // UX/UI Designer
  a26: FileBarChart, // Product Analyst
  a27: Code2,        // Full-Stack Developer
  a28: Server,       // DevOps Engineer
  a29: ShieldCheck,  // Security Engineer
  a30: Brain,        // ML Engineer
  a31: Database,     // Backend Engineer
  a32: TestTube2,    // QA Engineer
  a33: Smartphone,   // Mobile Developer
  a34: BarChart2,    // Data Analyst
  a35: Eye,          // Business Intelligence
  a36: Atom,         // Data Scientist
  a37: Globe,        // Market Research Analyst
  a38: FileBarChart, // Reporting Specialist
  a39: Scale,        // Corporate Lawyer
  a40: BookOpen,     // IP & Patent Attorney
  a41: Shield,       // Contract Specialist
  a42: Users,        // HR Director
  a43: UserSearch,   // Recruiter
  a44: GraduationCap,// L&D Specialist
  a45: Microscope,   // Market Research Lead
  a46: Telescope,    // Competitive Intelligence
};

function AgentIcon({ agent, size = 20 }: { agent: { id: string; color: string }; size?: number }) {
  const Icon = AGENT_ICON_MAP[agent.id] ?? Bot;
  return <Icon size={size} color={agent.color} strokeWidth={1.8} />;
}

const DEPARTMENTS = [
  { id: "all",       label: "All Agents",    icon: Layers },
  { id: "exec",      label: "Executive",     icon: Users },
  { id: "finance",   label: "Finance",       icon: TrendingUp },
  { id: "marketing", label: "Marketing",     icon: Zap },
  { id: "sales",     label: "Sales",         icon: ArrowUpRight },
  { id: "product",   label: "Product",       icon: Package },
  { id: "dev",       label: "Development",   icon: Code2 },
  { id: "analytics", label: "Analytics",     icon: BarChart2 },
  { id: "legal",     label: "Legal",         icon: Scale },
  { id: "hr",        label: "HR",            icon: Users },
  { id: "research",  label: "Research",      icon: FlaskConical },
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
  { id:"a1",  name:"Sophia Rivers",      role:"Chief Executive Officer",     dept:"exec",      emoji:"👑", color:"#7C3AED", description:"Strategic leadership, key decision-making, and managing the executive team.",       model:"claude-opus-4-8",  status:"active", runs:0, rating:0, speed:"medium", cost:"$$$", tools:["web","docs","analytics"],        memory:true,  created:"2024-01-15", prompt:"You are Sophia Rivers — a CEO with 20 years of experience. You make strategic decisions and coordinate the executive team." },
  { id:"a2",  name:"Marcus Webb",        role:"Chief Strategy Officer",      dept:"exec",      emoji:"🎯", color:"#3b82f6", description:"Long-term planning, competitive analysis, and business model transformation.",                    model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["web","analytics","docs"],        memory:true,  created:"2024-01-20", prompt:"You are Marcus Webb — CSO. You build long-term strategies and analyze the market." },
  { id:"a3",  name:"James Wright",       role:"Chief Operating Officer",     dept:"exec",      emoji:"⚙️", color:"#f59e0b", description:"Operational optimization, KPIs, processes, and operational efficiency.",                               model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["docs","analytics"],              memory:true,  created:"2024-01-18", prompt:"You are James Wright — COO. You manage operational processes and optimize KPIs." },
  { id:"a4",  name:"Marcus Chen",        role:"Chief Financial Officer",     dept:"exec",      emoji:"💼", color:"#3b82f6", description:"Financial planning, budget, risk, and investment decisions.",                                 model:"claude-opus-4-8",  status:"active", runs:0, rating:0, speed:"medium", cost:"$$$", tools:["docs","analytics","calculator"], memory:true,  created:"2024-01-16", prompt:"You are Marcus Chen — CFO. You manage finances, build forecasts, and analyze P&L." },
  { id:"a5",  name:"Elena Torres",       role:"Chief Marketing Officer",     dept:"exec",      emoji:"📣", color:"#10b981", description:"Brand strategy, marketing mix, audience growth and retention.",                                    model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["web","docs","image"],            memory:true,  created:"2024-02-01", prompt:"You are Elena Torres — CMO. You own the brand, marketing campaigns, and audience growth." },
  { id:"a6",  name:"Aiden Park",         role:"Chief Technology Officer",    dept:"exec",      emoji:"🔬", color:"#a855f7", description:"Technology strategy, architecture, R&D, and innovation.",                                          model:"claude-opus-4-8",  status:"idle",   runs:0, rating:0, speed:"medium", cost:"$$$", tools:["code","web","docs"],             memory:true,  created:"2024-02-05", prompt:"You are Aiden Park — CTO. You define technology strategy and system architecture." },
  { id:"a7",  name:"Alicia Monroe",      role:"Financial Analyst",           dept:"finance",   emoji:"📊", color:"#f59e0b", description:"P&L analysis, financial modeling, and forecasting.",                                           model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["calculator","docs","analytics"], memory:false, created:"2024-02-10", prompt:"You are Alicia Monroe — a financial analyst. You build financial models and analyze P&L." },
  { id:"a8",  name:"Robert Kim",         role:"Investment Analyst",          dept:"finance",   emoji:"💹", color:"#10b981", description:"Investment evaluation, due diligence, and portfolio analysis.",                                            model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["web","calculator","docs"],       memory:false, created:"2024-02-12", prompt:"You are Robert Kim — an investment analyst. You run due diligence and evaluate projects." },
  { id:"a9",  name:"Natasha Orlov",      role:"Tax & Compliance",           dept:"finance",   emoji:"📋", color:"#3b82f6", description:"Tax planning, compliance, and regulatory reporting.",                                      model:"gpt-4o",           status:"active", runs:0, rating:0, speed:"medium", cost:"$$",  tools:["docs","web"],                    memory:true,  created:"2024-03-01", prompt:"You are Natasha Orlov — a tax specialist. You advise on taxes and compliance matters." },
  { id:"a10", name:"Felix Bauer",        role:"Budget Controller",           dept:"finance",   emoji:"🔢", color:"#f43f5e", description:"Budget control, plan/actual analysis, and expense optimization.",                                      model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$",   tools:["calculator","docs"],             memory:false, created:"2024-03-05", prompt:"You are Felix Bauer — a budget controller. You analyze plan-vs-actual and optimize expenses." },
  { id:"a11", name:"Isabella Torres",    role:"Treasury Manager",            dept:"finance",   emoji:"🏦", color:"#D946EF", description:"Liquidity management, currency risk, and treasury operations.",                                  model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"medium", cost:"$$",  tools:["calculator","web","docs"],       memory:true,  created:"2024-03-10", prompt:"You are Isabella Torres — a treasurer. You manage liquidity and hedge currency risk." },
  { id:"a12", name:"Leo Fontaine",       role:"Growth Hacker",               dept:"marketing", emoji:"🚀", color:"#f43f5e", description:"Growth experiments, A/B tests, and viral mechanics.",                                               model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$",   tools:["web","analytics"],               memory:false, created:"2024-02-15", prompt:"You are Leo Fontaine — a growth hacker. You run A/B tests and hunt for growth channels." },
  { id:"a13", name:"Maya Patel",         role:"Content Strategist",          dept:"marketing", emoji:"✍️", color:"#a78bfa", description:"Content strategy, SEO, and editorial planning.",                                                     model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$",   tools:["web","docs","image"],            memory:false, created:"2024-02-18", prompt:"You are Maya Patel — a content strategist. You build content plans and optimize SEO." },
  { id:"a14", name:"Ethan Brooks",       role:"Performance Marketer",        dept:"marketing", emoji:"📈", color:"#10b981", description:"Paid traffic, ROAS, attribution, and ad campaign optimization.",                                model:"gpt-4o",           status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["web","analytics","docs"],        memory:false, created:"2024-02-20", prompt:"You are Ethan Brooks — a performance marketer. You manage paid traffic and optimize ROAS." },
  { id:"a15", name:"Zoe Lambert",        role:"Brand Designer",              dept:"marketing", emoji:"🎨", color:"#f59e0b", description:"Visual identity, design system, and branding.",                                              model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"medium", cost:"$$",  tools:["image","docs"],                  memory:true,  created:"2024-03-01", prompt:"You are Zoe Lambert — a brand designer. You create visual concepts and grow the design system." },
  { id:"a16", name:"Carlos Reyes",       role:"SEO Specialist",              dept:"marketing", emoji:"🔍", color:"#3b82f6", description:"Technical SEO, backlink profile, and ranking.",                                              model:"gpt-4o",           status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$",   tools:["web","docs","analytics"],        memory:false, created:"2024-03-10", prompt:"You are Carlos Reyes — an SEO specialist. You run technical audits and build the backlink profile." },
  { id:"a17", name:"Nina Kowalski",      role:"Social Media Manager",        dept:"marketing", emoji:"📱", color:"#D946EF", description:"SMM strategy, content calendar, and community growth.",                                               model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$",   tools:["web","docs","image"],            memory:false, created:"2024-03-15", prompt:"You are Nina Kowalski — an SMM manager. You run social media and grow the community." },
  { id:"a18", name:"Thomas Grant",       role:"Email Marketing",             dept:"marketing", emoji:"📧", color:"#f43f5e", description:"Email automation, trigger sequences, and conversion.",                                          model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$",   tools:["docs","analytics"],              memory:false, created:"2024-03-20", prompt:"You are Thomas Grant — an email marketer. You build trigger sequences and optimize conversion." },
  { id:"a19", name:"Olivia Nash",        role:"Account Executive",           dept:"sales",     emoji:"🤝", color:"#10b981", description:"Key account management, negotiation, and closing deals.",                                   model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["web","docs","crm"],              memory:true,  created:"2024-02-25", prompt:"You are Olivia Nash — an Account Executive. You manage key accounts and close deals." },
  { id:"a20", name:"Ryan Foster",        role:"Sales Development Rep",       dept:"sales",     emoji:"📞", color:"#f59e0b", description:"Lead qualification, cold calling, and filling the pipeline.",                                       model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$",   tools:["web","docs"],                    memory:false, created:"2024-03-01", prompt:"You are Ryan Foster — an SDR. You qualify leads and write cold emails." },
  { id:"a21", name:"Priya Sharma",       role:"Customer Success Manager",    dept:"sales",     emoji:"💎", color:"#a78bfa", description:"Onboarding, customer retention, and account growth.",                                             model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["docs","web","analytics"],        memory:true,  created:"2024-03-05", prompt:"You are Priya Sharma — a CSM. You handle onboarding, retention, and account growth." },
  { id:"a22", name:"Samuel Cole",        role:"Revenue Operations",          dept:"sales",     emoji:"⚡", color:"#3b82f6", description:"CRM, RevOps, revenue forecasting, and funnel optimization.",                                     model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["analytics","docs","calculator"], memory:true,  created:"2024-03-10", prompt:"You are Samuel Cole — RevOps. You manage the CRM and build revenue forecasts." },
  { id:"a23", name:"Aria Bloom",         role:"Product Manager",             dept:"product",   emoji:"🗺️", color:"#D946EF", description:"Roadmap, prioritization, user research, and feature launches.",                             model:"claude-opus-4-8",  status:"active", runs:0, rating:0, speed:"medium", cost:"$$$", tools:["docs","web","analytics"],        memory:true,  created:"2024-02-01", prompt:"You are Aria Bloom — a Product Manager. You own the roadmap and prioritize the backlog." },
  { id:"a24", name:"Nathan Cross",       role:"UX Researcher",               dept:"product",   emoji:"🔬", color:"#10b981", description:"Usability research, interviews, and insight synthesis.",                                             model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"medium", cost:"$$",  tools:["web","docs"],                    memory:true,  created:"2024-02-10", prompt:"You are Nathan Cross — a UX Researcher. You run studies and synthesize insights." },
  { id:"a25", name:"Sophie Müller",      role:"UX/UI Designer",              dept:"product",   emoji:"🎭", color:"#f43f5e", description:"Interface design, prototyping, and the design system.",                                         model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["image","docs"],                  memory:true,  created:"2024-02-15", prompt:"You are Sophie Müller — a UX/UI designer. You design interfaces and prototype solutions." },
  { id:"a26", name:"Liam O'Brien",       role:"Product Analyst",             dept:"product",   emoji:"📉", color:"#a78bfa", description:"Product analytics, funnel analysis, and engagement metrics.",                                  model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$",   tools:["analytics","docs","web"],        memory:false, created:"2024-02-20", prompt:"You are Liam O'Brien — a product analyst. You analyze the funnel and engagement metrics." },
  { id:"a27", name:"Kai Tanaka",         role:"Full-Stack Developer",        dept:"dev",       emoji:"💻", color:"#3b82f6", description:"Feature development, architecture, and code review.",                                                     model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["code","docs","web"],             memory:true,  created:"2024-01-25", prompt:"You are Kai Tanaka — a Full-Stack developer. You write code and run code reviews." },
  { id:"a28", name:"Emma Johansson",     role:"DevOps Engineer",             dept:"dev",       emoji:"🛠️", color:"#10b981", description:"CI/CD, Kubernetes, monitoring, and infrastructure automation.",                                  model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["code","docs","web"],             memory:true,  created:"2024-02-01", prompt:"You are Emma Johansson — a DevOps engineer. You set up CI/CD and manage infrastructure." },
  { id:"a29", name:"Lucas Hoffmann",     role:"Security Engineer",           dept:"dev",       emoji:"🔐", color:"#D946EF", description:"Application security, pentesting, and standards compliance.",                                     model:"claude-opus-4-8",  status:"idle",   runs:0, rating:0, speed:"medium", cost:"$$$", tools:["code","web","docs"],             memory:true,  created:"2024-02-08", prompt:"You are Lucas Hoffmann — a Security Engineer. You run security audits and pentests." },
  { id:"a30", name:"Aisha Johnson",      role:"ML Engineer",                 dept:"dev",       emoji:"🧠", color:"#f43f5e", description:"Model training, MLOps, and product ML solutions.",                                               model:"claude-opus-4-8",  status:"active", runs:0, rating:0, speed:"slow",   cost:"$$$", tools:["code","docs","analytics"],       memory:true,  created:"2024-02-15", prompt:"You are Aisha Johnson — an ML Engineer. You train models and build MLOps pipelines." },
  { id:"a31", name:"Oscar Lindqvist",    role:"Backend Engineer",            dept:"dev",       emoji:"⚙️", color:"#f59e0b", description:"API design, databases, microservices, and performance.",                                   model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["code","docs"],                   memory:false, created:"2024-02-20", prompt:"You are Oscar Lindqvist — a Backend Engineer. You design APIs and optimize databases." },
  { id:"a32", name:"Julia Santos",       role:"QA Engineer",                 dept:"dev",       emoji:"🧪", color:"#a78bfa", description:"Test plans, test automation, and quality control.",                                   model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$",   tools:["code","docs"],                   memory:false, created:"2024-03-01", prompt:"You are Julia Santos — a QA Engineer. You write test plans and automate testing." },
  { id:"a33", name:"Benjamin Clark",     role:"Mobile Developer",            dept:"dev",       emoji:"📲", color:"#3b82f6", description:"iOS/Android development, React Native, and mobile app performance.",               model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["code","docs","web"],             memory:false, created:"2024-03-05", prompt:"You are Benjamin Clark — a Mobile Developer. You build iOS/Android apps." },
  { id:"a34", name:"Clara Novak",        role:"Data Analyst",                dept:"analytics", emoji:"📊", color:"#10b981", description:"SQL, dashboards, cohort analysis, and KPI reporting.",                                               model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$",   tools:["analytics","calculator","docs"], memory:false, created:"2024-02-05", prompt:"You are Clara Novak — a Data Analyst. You build dashboards and run cohort analysis." },
  { id:"a35", name:"Hugo Petit",         role:"Business Intelligence",       dept:"analytics", emoji:"🔭", color:"#D946EF", description:"BI infrastructure, warehousing, and executive reporting.",                                            model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"medium", cost:"$$",  tools:["analytics","docs"],              memory:true,  created:"2024-02-10", prompt:"You are Hugo Petit — a BI specialist. You build the data warehouse and create executive reports." },
  { id:"a36", name:"Mia Eriksson",       role:"Data Scientist",              dept:"analytics", emoji:"🔮", color:"#f43f5e", description:"Predictive models, NLP, and data science projects.",                                               model:"claude-opus-4-8",  status:"active", runs:0, rating:0, speed:"slow",   cost:"$$$", tools:["code","analytics","docs"],       memory:true,  created:"2024-02-15", prompt:"You are Mia Eriksson — a Data Scientist. You build predictive models and work with NLP." },
  { id:"a37", name:"Ahmed Hassan",       role:"Market Research Analyst",     dept:"analytics", emoji:"🌐", color:"#f59e0b", description:"Market research, competitive analysis, and consumer trends.",                           model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$",   tools:["web","docs","analytics"],        memory:false, created:"2024-02-20", prompt:"You are Ahmed Hassan — a market analyst. You research markets and analyze competitors." },
  { id:"a38", name:"Yuki Watanabe",      role:"Reporting Specialist",        dept:"analytics", emoji:"📑", color:"#a78bfa", description:"Report automation, data visualization, and storytelling.",                                   model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$",   tools:["docs","analytics"],              memory:false, created:"2024-03-01", prompt:"You are Yuki Watanabe — a reporting specialist. You automate reports." },
  { id:"a39", name:"Francesca Ricci",    role:"Corporate Lawyer",            dept:"legal",     emoji:"⚖️", color:"#3b82f6", description:"Corporate law, M&A deals, and protecting the company's interests.",                                 model:"claude-opus-4-8",  status:"idle",   runs:0, rating:0, speed:"slow",   cost:"$$$", tools:["docs","web"],                    memory:true,  created:"2024-02-01", prompt:"You are Francesca Ricci — a corporate lawyer. You advise on corporate law matters." },
  { id:"a40", name:"Daniel Wright",      role:"IP & Patent Attorney",        dept:"legal",     emoji:"📜", color:"#D946EF", description:"Intellectual property protection, patents, and trademarks.",                             model:"claude-opus-4-8",  status:"idle",   runs:0, rating:0, speed:"slow",   cost:"$$$", tools:["docs","web"],                    memory:true,  created:"2024-02-10", prompt:"You are Daniel Wright — a patent attorney. You protect intellectual property." },
  { id:"a41", name:"Sophia Turner",      role:"Contract Specialist",         dept:"legal",     emoji:"📄", color:"#10b981", description:"Contract drafting, review, and negotiation.",                                                 model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"medium", cost:"$$",  tools:["docs"],                          memory:true,  created:"2024-02-15", prompt:"You are Sophia Turner — a contract specialist. You review and prepare contracts." },
  { id:"a42", name:"Marcus Johnson",     role:"HR Director",                 dept:"hr",        emoji:"👥", color:"#f43f5e", description:"Talent acquisition, HR policies, and corporate culture.",                                     model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["web","docs"],                    memory:true,  created:"2024-02-20", prompt:"You are Marcus Johnson — an HR Director. You manage talent and shape the culture." },
  { id:"a43", name:"Luna Petrov",        role:"Recruiter",                   dept:"hr",        emoji:"🎯", color:"#f59e0b", description:"Candidate sourcing, interviews, and onboarding new hires.",                                     model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$",   tools:["web","docs"],                    memory:false, created:"2024-03-01", prompt:"You are Luna Petrov — a recruiter. You source and evaluate candidates and run onboarding." },
  { id:"a44", name:"George Adams",       role:"L&D Specialist",              dept:"hr",        emoji:"📚", color:"#a78bfa", description:"Training and development, upskilling programs.",                                        model:"claude-sonnet-5",  status:"active", runs:0, rating:0, speed:"fast",   cost:"$",   tools:["docs","web"],                    memory:true,  created:"2024-03-05", prompt:"You are George Adams — an L&D specialist. You design training programs." },
  { id:"a45", name:"Isabelle Dupont",    role:"Market Research Lead",        dept:"research",  emoji:"🔍", color:"#3b82f6", description:"Primary research, focus groups, and consumer studies.",                             model:"claude-opus-4-8",  status:"active", runs:0, rating:0, speed:"medium", cost:"$$$", tools:["web","docs","analytics"],        memory:true,  created:"2024-02-05", prompt:"You are Isabelle Dupont — a research lead. You run focus groups and market studies." },
  { id:"a46", name:"Raj Patel",          role:"Competitive Intelligence",    dept:"research",  emoji:"🕵️", color:"#10b981", description:"Competitor monitoring, trend analysis, and battlecards.",                                         model:"claude-sonnet-5",  status:"idle",   runs:0, rating:0, speed:"fast",   cost:"$$",  tools:["web","docs","analytics"],        memory:false, created:"2024-02-15", prompt:"You are Raj Patel — competitive intelligence. You monitor competitors and build battlecards." },
];

// Canonical roster: 20 agents (matches landing / executives / sidebar)
const AGENTS: Agent[] = AGENTS_ALL.slice(0, 20);

const STATUS_CONFIG: Record<AgentStatus, { label: string; color: string; Icon: typeof Circle }> = {
  active: { label: "Active",  color: "#10b981", Icon: CheckCircle2 },
  idle:   { label: "Idle",    color: "#f59e0b", Icon: PauseCircle  },
  paused: { label: "Paused",  color: "#3b82f6", Icon: PauseCircle  },
  error:  { label: "Error",   color: "#f43f5e", Icon: AlertCircle  },
};

const TOOL_LABELS: Record<string, string> = {
  web: "Web", docs: "Docs", analytics: "Analytics", calculator: "Calculator",
  code: "Code", image: "Image", crm: "CRM",
};

const SPEED_LABEL: Record<string, string> = { fast: "Fast", medium: "Medium", slow: "Slow" };

const KPI = [
  { label: "Total Agents",    value: "46",    color: "#D946EF", icon: Bot         },
  { label: "Active Now",      value: "28",    color: "#10b981", icon: Activity    },
  { label: "Runs / Day",      value: "2.4K",  color: "#3b82f6", icon: Zap         },
  { label: "Success Rate",    value: "98.7%", color: "#f59e0b", icon: CheckCircle2 },
  { label: "Savings / Month", value: "$84K",  color: "#f43f5e", icon: DollarSign  },
];

function StatusDot({ status }: { status: AgentStatus }) {
  const { color } = STATUS_CONFIG[status];
  return (
    <span style={{ width: 7, height: 7, borderRadius: "50%", background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0, display: "inline-block" }} />
  );
}

function AgentCard({ agent, selected, fav, onFav, onClick, onRun, onChat, onConfigure }: {
  agent: Agent; selected: boolean; fav: boolean; onFav: () => void; onClick: () => void;
  onRun: () => void; onChat: () => void; onConfigure: () => void;
}) {
  const { color: statusColor, label: statusLabel } = STATUS_CONFIG[agent.status];
  const deptLabel = DEPARTMENTS.find(d => d.id === agent.dept)?.label ?? agent.dept;
  const isActive = agent.status === "active";
  const [hov, setHov] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.94 }}
      onHoverStart={() => setHov(true)}
      onHoverEnd={() => setHov(false)}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      onClick={onClick}
      className="agent-card"
      style={{
        background: selected
          ? `linear-gradient(150deg, ${agent.color}12, rgba(255,255,255,0.02) 55%)`
          : hov ? "rgba(255,255,255,0.035)" : "rgba(255,255,255,0.022)",
        border: `1px solid ${selected ? agent.color + "55" : hov ? agent.color + "38" : "rgba(255,255,255,0.06)"}`,
        borderRadius: 16, padding: "15px 16px 15px 18px", cursor: "pointer", position: "relative", overflow: "hidden",
        transition: "border-color 0.22s, background 0.22s, transform 0.22s",
        transform: hov ? "translateY(-4px)" : "translateY(0)",
        boxShadow: hov
          ? `0 18px 44px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.05)`
          : "0 1px 2px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.04)",
      }}
    >
      {/* left status rail */}
      <span aria-hidden style={{ position: "absolute", left: 0, top: 14, bottom: 14, width: 3, borderRadius: 3,
        background: `linear-gradient(180deg, ${agent.color}, ${statusColor})`, opacity: selected || hov ? 1 : 0.55, transition: "opacity 0.22s" }} />

      {/* header: icon tile + name + status pill */}
      <div style={{ display: "flex", alignItems: "flex-start", gap: 12 }}>
        {/* icon tile with status ring */}
        <div style={{ position: "relative", flexShrink: 0, width: 48, height: 48 }}>
          {isActive && (
            <motion.span aria-hidden
              animate={{ opacity: [0.5, 0.15, 0.5], scale: [1, 1.12, 1] }}
              transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
              style={{ position: "absolute", inset: -3, borderRadius: 16, border: `1.5px solid ${agent.color}`, pointerEvents: "none" }} />
          )}
          <div style={{ width: 48, height: 48, borderRadius: 14, display: "flex", alignItems: "center", justifyContent: "center",
            background: `linear-gradient(140deg, ${agent.color}30, ${agent.color}0d)`, border: `1px solid ${agent.color}45`,
            boxShadow: `0 6px 18px ${agent.color}26, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
            <AgentIcon agent={agent} size={22} />
          </div>
          <span style={{ position: "absolute", bottom: -2, right: -2, width: 12, height: 12, borderRadius: "50%",
            background: statusColor, border: "2.5px solid #0B0C12", boxShadow: `0 0 8px ${statusColor}` }} />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ flex: 1, minWidth: 0, fontSize: 14, fontWeight: 700, color: "#fff", letterSpacing: "-0.01em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.name}</span>
            {/* status pill */}
            <span style={{ display: "inline-flex", alignItems: "center", gap: 4, flexShrink: 0, fontSize: 9.5, fontWeight: 700, padding: "2px 7px", borderRadius: 6,
              color: statusColor, background: `${statusColor}14`, border: `1px solid ${statusColor}2e`, letterSpacing: "0.02em" }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor }} />
              {statusLabel}
            </span>
          </div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 2, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{agent.role}</div>
          <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", lineHeight: 1.5, marginTop: 7, marginBottom: 0, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
            {agent.description}
          </p>
        </div>
      </div>

      {/* meta strip: model · dept · runs · rating */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 13, paddingTop: 12, borderTop: "1px solid rgba(255,255,255,0.06)" }}>
        <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, color: "rgba(255,255,255,0.4)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", maxWidth: 110 }}>
          {agent.model.split("-").slice(0, 2).join("-")}
        </span>
        <span style={{ width: 3, height: 3, borderRadius: "50%", background: "rgba(255,255,255,0.2)", flexShrink: 0 }} />
        <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", whiteSpace: "nowrap" }}>{deptLabel}</span>
        {/* Только реальные данные: сколько раз ВЫ запускали этого агента.
            Выдуманных рейтингов и чужих счётчиков здесь быть не должно. */}
        <span style={{ marginLeft: "auto", fontSize: 10, color: "rgba(255,255,255,0.3)", fontVariantNumeric: "tabular-nums", flexShrink: 0 }}>
          {agent.runs > 0 ? `${agent.runs} runs` : "not run yet"}
        </span>
      </div>

      {/* actions — revealed on hover */}
      <motion.div
        initial={false}
        animate={{ height: hov ? 44 : 0, opacity: hov ? 1 : 0, marginTop: hov ? 11 : 0 }}
        transition={{ duration: 0.24, ease: [0.22, 1, 0.36, 1] }}
        style={{ overflow: "hidden" }}
      >
        <div style={{ display: "flex", gap: 6 }}>
          <button
            onClick={(e) => { e.stopPropagation(); onRun(); }}
            style={{ flex: 1.3, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 34, borderRadius: 9, fontSize: 11.5, fontWeight: 700, cursor: "pointer",
              background: `linear-gradient(135deg, ${agent.color}e6, ${agent.color}99)`, border: "none", color: "#fff",
              boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 12px ${agent.color}33` }}
          >
            <Play size={11} fill="currentColor" /> Run
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onChat(); }}
            style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 6, height: 34, borderRadius: 9, fontSize: 11.5, fontWeight: 600, cursor: "pointer",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)" }}
          >
            <MessageSquare size={11} /> Chat
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onFav(); }}
            title={fav ? "Remove from favorites" : "Add to favorites"}
            style={{ width: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34, borderRadius: 9, cursor: "pointer",
              background: fav ? "rgba(245,158,11,0.14)" : "rgba(255,255,255,0.05)", border: `1px solid ${fav ? "rgba(245,158,11,0.35)" : "rgba(255,255,255,0.1)"}`, color: fav ? "#f59e0b" : "rgba(255,255,255,0.5)" }}
          >
            <Star size={12} fill={fav ? "#f59e0b" : "none"} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onConfigure(); }}
            title="Configure"
            style={{ width: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", height: 34, borderRadius: 9, cursor: "pointer",
              background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.5)" }}
          >
            <Settings2 size={12} />
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function AgentDetail({ agent, onClose, onRun, onChat, onConfigure, onClone }: {
  agent: Agent; onClose: () => void;
  onRun: () => void; onChat: () => void; onConfigure: () => void; onClone: () => void;
}) {
  const [tab, setTab] = useState<"overview"|"prompt"|"tools"|"stats">("overview");
  const { label: statusLabel, color: statusColor } = STATUS_CONFIG[agent.status];
  const isActive = agent.status === "active";

  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 30 }}
      transition={{ type: "spring", stiffness: 260, damping: 28 }}
      style={{ width: 340, flexShrink: 0, display: "flex", flexDirection: "column", background: "rgba(255,255,255,0.018)", borderLeft: "1px solid rgba(255,255,255,0.06)", overflow: "hidden", position: "relative" }}
    >
      {/* top accent in agent color */}
      <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${agent.color}, transparent)` }} />

      <div style={{ padding: "16px 20px", borderBottom: "1px solid rgba(255,255,255,0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(255,255,255,0.8)" }}>Agent Details</span>
        <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}><X size={14} /></button>
      </div>

      <div style={{ padding: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
          {/* animated icon tile with status ring */}
          <div style={{ position: "relative", width: 60, height: 60, flexShrink: 0 }}>
            {isActive && (
              <motion.span aria-hidden animate={{ opacity: [0.5, 0.15, 0.5], scale: [1, 1.12, 1] }} transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                style={{ position: "absolute", inset: -3, borderRadius: 18, border: `1.5px solid ${agent.color}` }} />
            )}
            <motion.div initial={{ scale: 0.7, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", stiffness: 300, damping: 18 }}
              style={{ width: 60, height: 60, borderRadius: 16, display: "flex", alignItems: "center", justifyContent: "center",
                background: `linear-gradient(140deg, ${agent.color}30, ${agent.color}0d)`, border: `1px solid ${agent.color}45`, boxShadow: `0 8px 22px ${agent.color}2e, inset 0 1px 0 rgba(255,255,255,0.1)` }}>
              <AgentIcon agent={agent} size={26} />
            </motion.div>
            <span style={{ position: "absolute", bottom: -2, right: -2, width: 13, height: 13, borderRadius: "50%", background: statusColor, border: "2.5px solid #0B0C12", boxShadow: `0 0 8px ${statusColor}` }} />
          </div>
          <div>
            <div style={{ fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em", marginBottom: 3 }}>{agent.name}</div>
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>{agent.role}</div>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10.5, fontWeight: 700, padding: "2px 8px", borderRadius: 6, color: statusColor, background: `${statusColor}14`, border: `1px solid ${statusColor}2e` }}>
              <span style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor }} /> {statusLabel}
            </span>
          </div>
        </div>
      </div>

      <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.06)", position: "relative" }}>
        {(["overview","prompt","tools","stats"] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)} style={{ flex: 1, padding: "11px 0", fontSize: 11, fontWeight: tab === t ? 700 : 500, cursor: "pointer", background: "none", border: "none", position: "relative", color: tab === t ? agent.color : "rgba(255,255,255,0.35)", transition: "color 0.15s" }}>
            {t === "overview" ? "Overview" : t === "prompt" ? "Prompt" : t === "tools" ? "Tools" : "Stats"}
            {tab === t && <motion.span layoutId="agent-tab-underline" transition={{ type: "spring", stiffness: 400, damping: 32 }}
              style={{ position: "absolute", left: 12, right: 12, bottom: -1, height: 2, borderRadius: 2, background: agent.color }} />}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: 20 }}>
        <AnimatePresence mode="wait">
          {tab === "overview" && (
            <motion.div key="ov" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <p style={{ fontSize: 12, color: "rgba(255,255,255,0.5)", lineHeight: 1.7, marginBottom: 20 }}>{agent.description}</p>
              {([["Model", agent.model], ["Speed", SPEED_LABEL[agent.speed]], ["Cost", agent.cost], ["Memory", agent.memory ? "Enabled" : "Disabled"], ["Created", agent.created], ["Department", DEPARTMENTS.find(d => d.id === agent.dept)?.label ?? agent.dept]] as [string,string][]).map(([k,v]) => (
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
              <button style={{ marginTop: 12, width: "100%", padding: "8px 0", borderRadius: 8, fontSize: 12, cursor: "pointer", background: "rgba(217,70,239,0.1)", border: "1px solid rgba(217,70,239,0.2)", color: "#a78bfa", fontWeight: 500 }}>
                Edit Prompt
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
                <div style={{ fontSize: 11, fontWeight: 600, color: "rgba(255,255,255,0.5)", marginBottom: 8 }}>Memory</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 28, height: 16, borderRadius: 8, background: agent.memory ? "#D946EF" : "rgba(255,255,255,0.1)", position: "relative" }}>
                    <div style={{ position: "absolute", top: 2, left: agent.memory ? 14 : 2, width: 12, height: 12, borderRadius: "50%", background: "white", transition: "left 0.2s" }} />
                  </div>
                  <span style={{ fontSize: 11, color: agent.memory ? "#a78bfa" : "rgba(255,255,255,0.3)" }}>{agent.memory ? "Enabled" : "Disabled"}</span>
                </div>
              </div>
            </motion.div>
          )}
          {tab === "stats" && (
            <motion.div key="st" initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.07 } } }}>
              {[
                { label: "Your Runs",        value: agent.runs.toLocaleString(), color: "#D946EF", pct: Math.min(100, agent.runs * 5) },
                { label: "Model",            value: agent.model,                 color: "#3b82f6", pct: 100 },
                { label: "Department",       value: DEPARTMENTS.find(d => d.id === agent.dept)?.label ?? agent.dept,       color: "#10b981", pct: 100 },
                { label: "Conversation Memory", value: agent.memory ? "enabled" : "disabled", color: "#f59e0b", pct: agent.memory ? 100 : 20 },
              ].map((s) => (
                <motion.div key={s.label} variants={{ hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } }} transition={{ ease: [0.22, 1, 0.36, 1] }}
                  style={{ marginBottom: 12, padding: 14, borderRadius: 12, background: `${s.color}0d`, border: `1px solid ${s.color}22` }}>
                  <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", marginBottom: 8 }}>
                    <span style={{ fontSize: 10, color: "rgba(255,255,255,0.35)" }}>{s.label}</span>
                    <span style={{ fontSize: 19, fontWeight: 800, color: s.color, fontVariantNumeric: "tabular-nums" }}>{s.value}</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 2, background: "rgba(255,255,255,0.06)", overflow: "hidden" }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${s.pct}%` }} transition={{ duration: 1, ease: [0.22, 1, 0.36, 1], delay: 0.15 }}
                      style={{ height: "100%", borderRadius: 2, background: s.color }} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ padding: "16px 20px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button onClick={onRun} style={{ padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", background: `linear-gradient(135deg, ${agent.color}, ${agent.color}bb)`, border: "none", color: "white", display: "flex", alignItems: "center", justifyContent: "center", gap: 6, boxShadow: `inset 0 1px 0 rgba(255,255,255,0.2), 0 3px 12px ${agent.color}33` }}>
          <Play size={12} fill="currentColor" /> Run
        </button>
        <button onClick={onChat} style={{ padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)", color: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <MessageSquare size={12} /> Chat
        </button>
        <button onClick={onConfigure} style={{ padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Settings2 size={12} /> Configure
        </button>
        <button onClick={onClone} style={{ padding: "9px 0", borderRadius: 10, fontSize: 12, fontWeight: 500, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)", color: "rgba(255,255,255,0.5)", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
          <Copy size={12} /> Clone
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
  const [runCopied, setRunCopied] = useState(false);

  const RUN_PROMPTS = [
    "Give 3 concrete recommendations for your area.",
    "What 3 risks do you see, and how would you address them?",
    "Draft a weekly plan for your area.",
  ];
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Instant paint from the localStorage cache, then reconcile with the server
  // (authoritative) so custom agents + favorites sync across devices.
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

    (async () => {
      try {
        const [cRes, fRes] = await Promise.all([fetch("/api/agents/custom"), fetch("/api/agents/favorites")]);
        if (cRes.ok) {
          const d = await cRes.json();
          if (d.success && Array.isArray(d.agents) && d.agents.length) {
            setAgents([...d.agents, ...AGENTS]);
            try { localStorage.setItem("apex-custom-agents", JSON.stringify(d.agents)); } catch { /* ignore */ }
          }
        }
        if (fRes.ok) {
          const d = await fRes.json();
          if (d.success && Array.isArray(d.favorites)) {
            setFavs(new Set(d.favorites));
            try { localStorage.setItem("apex-fav-agents", JSON.stringify(d.favorites)); } catch { /* ignore */ }
          }
        }
      } catch { /* offline — keep the localStorage view */ }
    })();
  }, []);

  const toggleFav = (id: string) => {
    setFavs(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      const arr = [...next];
      try { localStorage.setItem("apex-fav-agents", JSON.stringify(arr)); } catch { /* ignore */ }
      fetch("/api/agents/favorites", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ favorites: arr }) }).catch(() => {});
      return next;
    });
  };

  const persistCustom = (list: Agent[]) => {
    const custom = list.filter((a) => a.id.startsWith("c"));
    try { localStorage.setItem("apex-custom-agents", JSON.stringify(custom)); } catch { /* ignore */ }
  };

  // Persist a single custom agent to the server (best-effort — localStorage
  // already holds it, so the UI stays responsive if the request fails).
  const saveCustomAgent = (agent: Agent) => {
    fetch("/api/agents/custom", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ agent }) }).catch(() => {});
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

  const configureAgent = (a: Agent) => { setSelected(a); showToast(`Settings opened: ${a.name}`); };

  const cloneAgent = (a: Agent) => {
    const copy: Agent = { ...a, id: `c${Date.now()}`, name: `${a.name} (copy)`, runs: 0, status: "idle" };
    setAgents((prev) => { const next = [copy, ...prev]; persistCustom(next); return next; });
    saveCustomAgent(copy);
    showToast(`Cloned: ${copy.name}`);
  };

  const createAgent = () => {
    if (!newAgent.name.trim() || !newAgent.role.trim()) { showToast("Fill in the name and role"); return; }
    const created: Agent = {
      id: `c${Date.now()}`, name: newAgent.name.trim(), role: newAgent.role.trim(), dept: newAgent.dept,
      emoji: "🤖", color: "#D946EF", description: newAgent.description.trim() || "Custom AI agent.",
      model: newAgent.model, status: "active", runs:0, rating:0, speed: "fast", cost: "$$",
      tools: ["web", "docs"], memory: true, created: new Date().toISOString().slice(0, 10),
      prompt: newAgent.prompt.trim() || `You are ${newAgent.name}, ${newAgent.role}. You help solve tasks professionally.`,
    };
    setAgents((prev) => { const next = [created, ...prev]; persistCustom(next); return next; });
    saveCustomAgent(created);
    setShowCreate(false);
    setNewAgent({ name: "", role: "", dept: "exec", model: MODELS[0], description: "", prompt: "" });
    showToast(`Agent created: ${created.name}`);
  };

  // ── real backend run: stream AI response via /api/chat/direct ──
  const openRun = (a: Agent) => {
    setRunAgent(a);
    setRunOutput("");
    setRunInput("Run a rapid analysis of your area of responsibility and give 3 concrete recommendations.");
  };

  const executeRun = async () => {
    if (!runAgent || !runInput.trim() || running) return;
    const question = runInput.trim();
    setRunning(true);
    setRunOutput("");
    const persona = `${runAgent.prompt}\n\nRespond in English, professionally and specifically. Use markdown, give clear steps and numbers where relevant.`;
    try {
      const res = await fetch("/api/chat/direct", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: runInput, agentId: runAgent.id, persona, history: [] }),
      });
      if (!res.ok || !res.body) {
        let err = "Service unavailable";
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
            else if (ev.type === "error") { acc = `⚠️ ${ev.message ?? "Error"}`; setRunOutput(acc); }
          } catch { /* ignore */ }
        }
      }
      if (!acc.trim()) setRunOutput("Empty response. Please try again.");
      setAgents((prev) => prev.map((x) => x.id === runAgent.id ? { ...x, runs: x.runs + 1 } : x));
      // Save the ask to История so it isn't lost.
      if (acc.trim() && !acc.startsWith("⚠️")) {
        saveAsk({ id: `ask-${Date.now()}`, kind: "agent", question, date: Date.now(),
          agentSlug: runAgent.id, agentName: runAgent.name, agentRole: runAgent.role, color: runAgent.color, answer: acc });
      }
    } catch {
      setRunOutput("⚠️ Error connecting to the AI service.");
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
        <div style={{ position: "absolute", top: -160, right: -100, width: 600, height: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(217,70,239,0.06) 0%, transparent 70%)" }} />
        <div style={{ position: "absolute", bottom: -200, left: -100, width: 500, height: 500, borderRadius: "50%", background: "radial-gradient(circle, rgba(16,185,129,0.04) 0%, transparent 70%)" }} />
      </div>

      {/* Header */}
      <div style={{ position: "relative", zIndex: 10, flexShrink: 0, padding: "20px 28px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
              <div style={{ width: 32, height: 32, borderRadius: 10, background: "linear-gradient(135deg, #7C3AED, #6D28D9)", display: "flex", alignItems: "center", justifyContent: "center" }}>
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
              style={{ padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "linear-gradient(135deg, #D946EF, #3b82f6)", border: "none", color: "white", display: "flex", alignItems: "center", gap: 6, boxShadow: "0 4px 16px rgba(217,70,239,0.35)" }}
            >
              <Plus size={14} /> Create Agent
            </button>
          </div>
        </div>

        {/* KPIs */}
        <div style={{ display: "flex", gap: 14, marginBottom: 16 }}>
          {KPI.map((k) => {
            const Icon = k.icon;
            const value = k.label === "Total Agents" ? String(agents.length)
              : k.label === "Active Now" ? String(agents.filter(a => a.status === "active").length)
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
                  placeholder="Search agents..."
                  style={{ width: "100%", padding: "8px 12px 8px 34px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "white", outline: "none", boxSizing: "border-box" }}
                />
              </div>
              {/* статус */}
              <div style={{ display: "flex", gap: 4, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 10, padding: 3 }}>
                {([["all", "All"], ["active", "Active"], ["idle", "Idle"], ["paused", "Paused"]] as const).map(([v, l]) => (
                  <button key={v} onClick={() => setStatusFilter(v as any)}
                    style={{ padding: "5px 10px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer", border: "none",
                      background: statusFilter === v ? "rgba(124,58,237,0.2)" : "transparent",
                      color: statusFilter === v ? "#a5b4fc" : "rgba(255,255,255,0.4)", transition: "all .15s" }}>
                    {l}
                  </button>
                ))}
              </div>
              {/* сортировка */}
              <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
                style={{ padding: "8px 12px", borderRadius: 10, fontSize: 11.5, fontWeight: 600, cursor: "pointer", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.65)", outline: "none" }}>
                <option value="popular" style={{ background: "#0a0c15" }}>By Runs</option>
                <option value="rating" style={{ background: "#0a0c15" }}>By Rating</option>
                <option value="name" style={{ background: "#0a0c15" }}>By Name</option>
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
                      background: on ? "rgba(124,58,237,0.14)" : "rgba(255,255,255,0.03)",
                      border: `1px solid ${on ? "rgba(124,58,237,0.4)" : "rgba(255,255,255,0.07)"}`,
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
            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.25)", marginBottom: 12 }}>{filtered.length} agents</div>
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
                <div style={{ fontSize: 13 }}>No agents found</div>
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
              onConfigure={() => showToast("Edit it in the \"Prompt\" tab")}
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
              style={{ width: 560, background: "#0a0c15", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 20, boxShadow: "0 32px 80px rgba(0,0,0,0.8)", overflow: "hidden" }}
            >
              <div style={{ padding: "20px 24px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.9)", marginBottom: 2 }}>Create New Agent</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.3)" }}>Step {createStep + 1} of 3</div>
                </div>
                <button onClick={() => setShowCreate(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}><X size={16} /></button>
              </div>

              <div style={{ display: "flex", borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                {["Basics", "Model & Tools", "System Prompt"].map((s, i) => (
                  <div
                    key={s}
                    style={{ flex: 1, padding: "10px", textAlign: "center", fontSize: 11, fontWeight: 500, cursor: "pointer", borderBottom: `2px solid ${i === createStep ? "#D946EF" : "transparent"}`, color: i === createStep ? "#a78bfa" : i < createStep ? "#10b981" : "rgba(255,255,255,0.25)" }}
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
                        {([["Agent Name","name","Victoria Sterling"],["Role","role","Chief Executive Officer"]] as [string,string,string][]).map(([lbl,key,ph]) => (
                          <div key={key}>
                            <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>{lbl}</div>
                            <input value={(newAgent as any)[key]} onChange={(e) => setNewAgent({...newAgent,[key]:e.target.value})} placeholder={ph} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", boxSizing: "border-box" }} />
                          </div>
                        ))}
                        <div style={{ gridColumn: "span 2" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Department</div>
                          <select value={newAgent.dept} onChange={(e) => setNewAgent({...newAgent,dept:e.target.value})} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, background: "#111420", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none" }}>
                            {DEPARTMENTS.filter(d => d.id !== "all").map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                          </select>
                        </div>
                        <div style={{ gridColumn: "span 2" }}>
                          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 6 }}>Description</div>
                          <textarea value={newAgent.description} onChange={(e) => setNewAgent({...newAgent,description:e.target.value})} placeholder="Briefly describe the agent's tasks..." rows={3} style={{ width: "100%", padding: "9px 12px", borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", resize: "none", boxSizing: "border-box" }} />
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {createStep === 1 && (
                    <motion.div key="s1" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <div style={{ marginBottom: 16 }}>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Language Model</div>
                        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                          {MODELS.map((m) => (
                            <label key={m} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: newAgent.model === m ? "rgba(217,70,239,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${newAgent.model === m ? "rgba(217,70,239,0.3)" : "rgba(255,255,255,0.07)"}` }}>
                              <input type="radio" checked={newAgent.model === m} onChange={() => setNewAgent({...newAgent,model:m})} style={{ accentColor: "#D946EF" }} />
                              <span style={{ fontSize: 12, color: newAgent.model === m ? "#a78bfa" : "rgba(255,255,255,0.55)" }}>{m}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>Tools</div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                          {Object.entries(TOOL_LABELS).map(([key, label]) => (
                            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, padding: "9px 12px", borderRadius: 10, cursor: "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                              <input type="checkbox" style={{ accentColor: "#D946EF" }} />
                              <span style={{ fontSize: 11, color: "rgba(255,255,255,0.55)" }}>{label}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                  {createStep === 2 && (
                    <motion.div key="s2" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
                      <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 8 }}>System Prompt</div>
                      <textarea value={newAgent.prompt} onChange={(e) => setNewAgent({...newAgent,prompt:e.target.value})} placeholder="You are [name] — [role]. Your tasks: ..." rows={8} style={{ width: "100%", padding: 12, borderRadius: 10, fontSize: 12, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", resize: "none", lineHeight: 1.7, boxSizing: "border-box" }} />
                      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                        {["Expert","Consultant","Analyst"].map((t) => (
                          <button key={t} onClick={() => setNewAgent({...newAgent,prompt:`You are ${newAgent.name || "an agent"}, a ${t.toLowerCase()}. Role: ${newAgent.role || "[role]"}. You help solve tasks professionally.`})} style={{ padding: "6px 12px", borderRadius: 8, fontSize: 11, cursor: "pointer", background: "rgba(217,70,239,0.08)", border: "1px solid rgba(217,70,239,0.18)", color: "#a78bfa" }}>
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
                  {createStep > 0 ? "Back" : "Cancel"}
                </button>
                <button onClick={() => createStep < 2 ? setCreateStep(createStep + 1) : createAgent()} style={{ padding: "9px 20px", borderRadius: 10, fontSize: 12, fontWeight: 600, cursor: "pointer", background: "linear-gradient(135deg, #D946EF, #3b82f6)", border: "none", color: "white", display: "flex", alignItems: "center", gap: 6 }}>
                  {createStep < 2 ? "Next" : "Create Agent"} <ChevronRight size={13} />
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
              transition={{ type: "spring", stiffness: 260, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              style={{ width: 640, maxWidth: "100%", maxHeight: "88vh", display: "flex", flexDirection: "column", background: "#0a0c15", border: `1px solid ${runAgent.color}33`, borderRadius: 22, boxShadow: `0 32px 80px rgba(0,0,0,0.7), 0 0 0 1px ${runAgent.color}12`, overflow: "hidden", position: "relative" }}
            >
              {/* top accent */}
              <div aria-hidden style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${runAgent.color}, transparent)` }} />

              {/* header: icon tile + identity */}
              <div style={{ padding: "18px 22px", borderBottom: "1px solid rgba(255,255,255,0.07)", display: "flex", alignItems: "center", gap: 13 }}>
                <div style={{ position: "relative", width: 46, height: 46, flexShrink: 0 }}>
                  {running && (
                    <motion.span aria-hidden animate={{ rotate: 360 }} transition={{ duration: 2.2, repeat: Infinity, ease: "linear" }}
                      style={{ position: "absolute", inset: -3, borderRadius: 15, background: `conic-gradient(from 0deg, transparent, ${runAgent.color}, transparent 60%)`,
                        WebkitMask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))", mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), #000 calc(100% - 2px))" }} />
                  )}
                  <motion.div animate={running ? { scale: [1, 1.06, 1] } : { scale: 1 }} transition={running ? { duration: 1.8, repeat: Infinity, ease: "easeInOut" } : { duration: 0.3 }}
                    style={{ width: 46, height: 46, borderRadius: 13, display: "flex", alignItems: "center", justifyContent: "center", background: `linear-gradient(140deg, ${runAgent.color}30, ${runAgent.color}0d)`, border: `1px solid ${runAgent.color}45`, boxShadow: `0 6px 18px ${runAgent.color}2e` }}>
                    <AgentIcon agent={runAgent} size={22} />
                  </motion.div>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>{runAgent.name}</div>
                  <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>{runAgent.role} · <span style={{ fontFamily: "var(--font-geist-mono), monospace" }}>{runAgent.model.split("-").slice(0,2).join("-")}</span></div>
                </div>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 7, color: running ? runAgent.color : "#10b981", background: running ? `${runAgent.color}14` : "rgba(16,185,129,0.12)", border: `1px solid ${running ? runAgent.color + "30" : "rgba(16,185,129,0.3)"}` }}>
                  <span style={{ width: 5, height: 5, borderRadius: "50%", background: running ? runAgent.color : "#10b981", animation: running ? "ec-think 1s ease-in-out infinite" : "none" }} />
                  {running ? "working" : "ready"}
                </span>
                <button onClick={() => !running && setRunAgent(null)} style={{ background: "none", border: "none", cursor: running ? "not-allowed" : "pointer", color: "rgba(255,255,255,0.3)", padding: 4 }}><X size={16} /></button>
              </div>

              {/* ask box */}
              <div style={{ padding: "16px 22px", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginBottom: 7 }}>Ask {runAgent.name.split(" ")[0]}</div>
                <textarea maxLength={1000}
                  value={runInput}
                  onChange={(e) => setRunInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) executeRun(); }}
                  rows={2}
                  disabled={running}
                  placeholder={`For example: ${RUN_PROMPTS[0]}`}
                  style={{ width: "100%", padding: "11px 13px", borderRadius: 11, fontSize: 13, background: "rgba(255,255,255,0.035)", border: "1px solid rgba(255,255,255,0.1)", color: "white", outline: "none", resize: "none", lineHeight: 1.6, boxSizing: "border-box", fontFamily: "inherit" }}
                  onFocus={(e) => (e.currentTarget.style.borderColor = `${runAgent.color}80`)}
                  onBlur={(e) => (e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)")}
                />
                {/* quick prompts */}
                <div style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}>
                  {RUN_PROMPTS.map((p) => (
                    <button key={p} onClick={() => !running && setRunInput(p)} disabled={running}
                      style={{ fontSize: 10.5, padding: "4px 9px", borderRadius: 7, cursor: running ? "default" : "pointer", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
                      {p.length > 34 ? p.slice(0, 32) + "…" : p}
                    </button>
                  ))}
                </div>
                <button
                  onClick={executeRun}
                  disabled={running || !runInput.trim()}
                  style={{ marginTop: 11, height: 40, padding: "0 20px", borderRadius: 11, fontSize: 12.5, fontWeight: 700, cursor: running || !runInput.trim() ? "not-allowed" : "pointer",
                    background: running || !runInput.trim() ? "rgba(255,255,255,0.06)" : `linear-gradient(135deg, ${runAgent.color}, ${runAgent.color}bb)`,
                    border: "none", color: running || !runInput.trim() ? "rgba(255,255,255,0.4)" : "white", display: "inline-flex", alignItems: "center", gap: 7,
                    boxShadow: running || !runInput.trim() ? "none" : `0 4px 14px ${runAgent.color}40, inset 0 1px 0 rgba(255,255,255,0.2)` }}
                >
                  <Play size={12} fill="currentColor" /> {running ? "Agent working…" : "Ask Agent"}
                </button>
              </div>

              {/* answer */}
              <div style={{ flex: 1, overflowY: "auto", padding: "18px 22px", minHeight: 170 }}>
                {runOutput ? (
                  <div>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
                      <span style={{ fontFamily: "var(--font-geist-mono), monospace", fontSize: 9.5, letterSpacing: "0.12em", color: "rgba(255,255,255,0.3)", textTransform: "uppercase" }}>{runAgent.name.split(" ")[0]}'s Answer</span>
                      {!running && (
                        <button onClick={() => { navigator.clipboard?.writeText(runOutput).then(() => { setRunCopied(true); setTimeout(() => setRunCopied(false), 1500); }).catch(() => {}); }}
                          style={{ display: "flex", alignItems: "center", gap: 5, fontSize: 11, cursor: "pointer", background: "transparent", border: "none", color: runCopied ? "#10b981" : "rgba(255,255,255,0.4)" }}>
                          {runCopied ? <><Check size={12} /> Copied</> : <><Copy size={12} /> Copy</>}
                        </button>
                      )}
                    </div>
                    <p style={{ fontSize: 13.5, color: "rgba(255,255,255,0.82)", lineHeight: 1.75, whiteSpace: "pre-wrap", margin: 0 }}>
                      {runOutput}
                      {running && <span style={{ display: "inline-block", width: 2, height: 14, background: runAgent.color, marginLeft: 2, verticalAlign: "middle", animation: "ec-pulse 1s step-end infinite" }} />}
                    </p>
                  </div>
                ) : running ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 9, color: "rgba(255,255,255,0.45)", fontSize: 12.5 }}>
                    {[0,1,2].map((j) => (
                      <motion.span key={j} animate={{ opacity: [0.3,1,0.3], y: [0,-2,0] }} transition={{ duration: 1.2, repeat: Infinity, delay: j*0.15 }} style={{ width: 6, height: 6, borderRadius: "50%", background: runAgent.color, display: "inline-block" }} />
                    ))}
                    {runAgent.name.split(" ")[0]} is analyzing…
                  </div>
                ) : (
                  <div style={{ color: "rgba(255,255,255,0.28)", fontSize: 12.5, textAlign: "center", paddingTop: 44 }}>
                    Ask a question — {runAgent.name} will answer from their area of expertise.
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
            style={{ position: "fixed", top: 18, left: "50%", transform: "translateX(-50%)", zIndex: 200, padding: "9px 18px", borderRadius: 12, background: "rgba(20,18,32,0.96)", border: "1px solid rgba(217,70,239,0.32)", color: "white", fontSize: 12.5, fontWeight: 600, boxShadow: "0 8px 32px rgba(0,0,0,0.5)", backdropFilter: "blur(12px)" }}
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
