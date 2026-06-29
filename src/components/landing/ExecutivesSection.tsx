"use client";

const EXECUTIVES = [
  { role: "CEO", title: "Chief Executive Officer", description: "Coordinates the entire executive team, synthesizes all insights into a unified vision, and delivers the executive summary with key decisions.", responsibilities: ["Executive Strategy","Vision & Direction","Team Coordination","Final Decisions"], color: "from-violet-600 to-purple-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
  { role: "CFO", title: "Chief Financial Officer", description: "Builds complete financial models, revenue projections, cost analysis, and investment requirements for your business.", responsibilities: ["Revenue Projections","Budget Planning","Cash Flow","Investment Analysis"], color: "from-blue-600 to-cyan-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
  { role: "CMO", title: "Chief Marketing Officer", description: "Develops brand positioning, go-to-market strategy, customer acquisition funnels, and content marketing plans.", responsibilities: ["Brand Strategy","Customer Acquisition","Content Plan","Social Media"], color: "from-emerald-600 to-teal-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><path d="M22 12h-4l-3 9L9 3l-3 9H2" /></svg> },
  { role: "Business Analyst", title: "Market Intelligence", description: "Deep market research, competitor analysis, customer segmentation, industry trends, and business opportunity mapping.", responsibilities: ["Market Research","SWOT Analysis","Competitor Intel","Customer Persona"], color: "from-amber-600 to-orange-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" /></svg> },
  { role: "COO", title: "Chief Operations Officer", description: "Creates the operational roadmap, launch plan, process design, team structure, and 30/90-day execution timeline.", responsibilities: ["Launch Roadmap","Operations Design","Hiring Plan","Workflow Systems"], color: "from-pink-600 to-rose-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><circle cx="12" cy="12" r="3" /><path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" /></svg> },
  { role: "Sales Director", title: "Revenue & Growth", description: "Designs sales funnels, pricing models, lead generation strategies, and customer retention frameworks.", responsibilities: ["Sales Funnel","Pricing Strategy","Lead Generation","Retention Plans"], color: "from-indigo-600 to-blue-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><polyline points="22 7 13.5 15.5 8.5 10.5 2 17" /><polyline points="16 7 22 7 22 13" /></svg> },
  { role: "Legal Advisor", title: "Compliance & Structure", description: "Business structure recommendations, compliance considerations, IP protection, and risk identification. (Not legal advice.)", responsibilities: ["Business Structure","IP Strategy","Risk Analysis","Compliance Notes"], color: "from-slate-600 to-gray-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg> },
  { role: "CTO", title: "Chief Technology Officer", description: "Recommends the optimal technology stack, infrastructure design, automation opportunities, and technical roadmap.", responsibilities: ["Tech Stack","Infrastructure","Automation","Technical Roadmap"], color: "from-fuchsia-600 to-violet-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-6"><polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" /></svg> },
];

export function ExecutivesSection() {
  return (
    <section id="executives" className="relative py-32 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-violet-500/20 bg-violet-500/5 mb-6">
            <span className="text-xs text-violet-300 font-medium tracking-wide uppercase">AI Executive Board</span>
          </div>
          <h2 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">Meet Your Executive Team</h2>
          <p className="text-lg text-white/40 max-w-2xl mx-auto">Eight specialized AI executives, each an expert in their domain, collaborating to deliver a complete business strategy.</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {EXECUTIVES.map((exec) => (
            <div key={exec.role} className="group relative rounded-2xl p-px overflow-hidden cursor-default">
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${exec.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
              <div className="relative bg-[#0f0f0f] rounded-[15px] p-5 h-full flex flex-col gap-4 border border-white/[0.06] group-hover:border-transparent transition-colors duration-300">
                <div className={`size-11 rounded-xl bg-gradient-to-br ${exec.color} flex items-center justify-center text-white shadow-lg`}>
                  {exec.icon}
                </div>
                <div>
                  <div className={`text-xs font-bold uppercase tracking-widest mb-1 bg-gradient-to-r ${exec.color} bg-clip-text text-transparent`}>{exec.role}</div>
                  <div className="text-sm font-semibold text-white leading-snug">{exec.title}</div>
                </div>
                <p className="text-xs text-white/40 leading-relaxed flex-1">{exec.description}</p>
                <div className="flex flex-wrap gap-1.5">
                  {exec.responsibilities.map((r) => (
                    <span key={r} className="text-[10px] px-2 py-0.5 rounded-full bg-white/[0.04] text-white/35 border border-white/[0.06]">{r}</span>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
