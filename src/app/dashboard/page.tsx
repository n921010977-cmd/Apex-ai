import Link from "next/link";
import { Progress } from "@/components/ui/Progress";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";

const RECENT_PROJECTS = [
  { id: "demo", name: "AI-Powered Fitness App", description: "Mobile app for personalized workout and nutrition plans", score: 84, status: "complete", date: "2 hours ago" },
  { id: "2", name: "SaaS Invoice Platform", description: "Automated invoicing for freelancers and agencies", score: 91, status: "complete", date: "Yesterday" },
  { id: "3", name: "Local Restaurant Chain", description: "Expansion strategy for regional fast-casual concept", score: 72, status: "in_progress", date: "In progress" },
];

const STATS = [
  { label: "Strategies Created", value: "3", change: "+2 this month", positive: true, gradient: "from-violet-600 to-purple-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></svg> },
  { label: "Avg Business Score", value: "82", change: "+5 pts improvement", positive: true, gradient: "from-amber-500 to-orange-500", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" /></svg> },
  { label: "Reports This Month", value: "1 / 3", change: "2 remaining", positive: false, gradient: "from-blue-600 to-cyan-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg> },
  { label: "Projected Revenue", value: "$2.4M", change: "Combined across projects", positive: true, gradient: "from-emerald-600 to-teal-600", icon: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="size-5"><line x1="12" y1="1" x2="12" y2="23" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg> },
];

export default function DashboardPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">Good morning, Founder</h1>
          <p className="text-sm text-white/35">Your executive board is ready to work.</p>
        </div>
        <Link href="/dashboard/new" className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200 hover:shadow-lg hover:shadow-violet-500/25">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Strategy
        </Link>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-8">
        {STATS.map((stat) => (
          <Card key={stat.label} className="p-4">
            <CardContent className="p-0">
              <div className="flex items-start justify-between mb-3">
                <div className={`size-9 rounded-xl bg-gradient-to-br ${stat.gradient} flex items-center justify-center text-white opacity-90`}>{stat.icon}</div>
              </div>
              <div className="text-2xl font-bold text-white mb-0.5">{stat.value}</div>
              <div className="text-xs text-white/35">{stat.label}</div>
              <div className={`text-xs mt-1 ${stat.positive ? "text-emerald-400" : "text-white/30"}`}>{stat.change}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <div className="xl:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white">Recent Projects</h2>
            <Link href="/dashboard/projects" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
          </div>
          <div className="space-y-3">
            {RECENT_PROJECTS.map((project) => (
              <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
                <Card hover className="cursor-pointer">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="size-10 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                        <svg className="size-5 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-sm font-semibold text-white truncate">{project.name}</span>
                          <Badge variant={project.status === "complete" ? "success" : "warning"} dot>{project.status === "complete" ? "Complete" : "In Progress"}</Badge>
                        </div>
                        <p className="text-xs text-white/35 mb-3">{project.description}</p>
                        <div className="flex items-center gap-3">
                          <div className="flex-1"><Progress value={project.score} showLabel size="sm" /></div>
                          <span className="text-xs text-white/25 flex-shrink-0">{project.date}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <Link href="/dashboard/new">
            <Card hover className="mt-3 cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center gap-2 text-center">
                <div className="size-10 rounded-xl border border-dashed border-white/[0.12] flex items-center justify-center">
                  <svg className="size-5 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                </div>
                <span className="text-sm text-white/30">Start a new strategy</span>
                <span className="text-xs text-white/20">Describe your business idea and let your executive board get to work</span>
              </CardContent>
            </Card>
          </Link>
        </div>

        <div className="space-y-5">
          <Card>
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold text-white mb-4">Your Executive Board</h3>
              <div className="space-y-2.5">
                {[
                  { role: "CEO", name: "Executive Director", color: "#7c3aed" },
                  { role: "CFO", name: "Chief Financial", color: "#3b82f6" },
                  { role: "CMO", name: "Chief Marketing", color: "#10b981" },
                  { role: "COO", name: "Chief Operations", color: "#f59e0b" },
                  { role: "CTO", name: "Chief Technology", color: "#ec4899" },
                ].map((exec) => (
                  <div key={exec.role} className="flex items-center gap-3">
                    <div className="size-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0" style={{ background: `${exec.color}25`, border: `1px solid ${exec.color}30` }}>
                      <span style={{ color: exec.color }}>{exec.role[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-medium text-white/70">{exec.role}</div>
                      <div className="text-[10px] text-white/30">{exec.name}</div>
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="size-1.5 rounded-full bg-emerald-400" />
                      <span className="text-[10px] text-white/30">Active</span>
                    </div>
                  </div>
                ))}
              </div>
              <Link href="/dashboard/new" className="mt-4 w-full inline-flex items-center justify-center gap-2 h-9 text-xs font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all duration-200">
                <svg className="size-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                Brief the Board
              </Link>
            </CardContent>
          </Card>

          <div className="relative rounded-2xl p-px overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-violet-600 to-blue-600 opacity-20" />
            <div className="relative bg-[#0f0f0f] rounded-[15px] p-5 border border-violet-500/20">
              <div className="text-xs font-bold uppercase tracking-widest text-violet-400 mb-2">Upgrade to Pro</div>
              <p className="text-sm text-white/60 mb-4 leading-relaxed">Unlimited reports, advanced financials, white-label exports, and priority processing.</p>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-3xl font-bold text-white">$49</span>
                <span className="text-sm text-white/30">/month</span>
              </div>
              <button className="w-full h-9 text-xs font-semibold bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-lg hover:from-violet-500 hover:to-blue-500 transition-all duration-200">Upgrade Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
