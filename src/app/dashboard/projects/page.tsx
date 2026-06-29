import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card, CardContent } from "@/components/ui/Card";
import { Progress } from "@/components/ui/Progress";

const PROJECTS = [
  { id: "demo", name: "AI-Powered Fitness Platform", description: "Mobile app for personalized workout and nutrition planning using advanced AI", industry: "Mobile App · SaaS", score: 87, status: "complete", executives: 8, date: "2 hours ago", revenue: "$2.4M projected" },
  { id: "2", name: "SaaS Invoice Platform", description: "Automated invoicing and payment management for freelancers and agencies", industry: "SaaS · FinTech", score: 91, status: "complete", executives: 8, date: "Yesterday", revenue: "$1.8M projected" },
  { id: "3", name: "Local Restaurant Chain", description: "Expansion strategy for regional fast-casual dining concept", industry: "Restaurant · Food", score: 72, status: "in_progress", executives: 5, date: "In progress", revenue: "Calculating…" },
];

export default function ProjectsPage() {
  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white mb-1">My Projects</h1>
          <p className="text-sm text-white/35">All your business strategies in one place</p>
        </div>
        <Link href="/dashboard/new" className="inline-flex items-center gap-2 h-10 px-5 text-sm font-medium bg-gradient-to-r from-violet-600 to-blue-600 text-white rounded-xl hover:from-violet-500 hover:to-blue-500 transition-all duration-200">
          <svg className="size-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
          New Strategy
        </Link>
      </div>
      <div className="space-y-3">
        {PROJECTS.map((project) => (
          <Link key={project.id} href={`/dashboard/projects/${project.id}`}>
            <Card hover className="cursor-pointer">
              <CardContent className="p-5">
                <div className="flex items-center gap-5">
                  <div className="size-12 rounded-xl bg-gradient-to-br from-violet-600/20 to-blue-600/20 border border-violet-500/20 flex items-center justify-center flex-shrink-0">
                    <svg className="size-6 text-violet-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-semibold text-white">{project.name}</span>
                      <Badge variant={project.status === "complete" ? "success" : "warning"} dot size="sm">{project.status === "complete" ? "Complete" : "In Progress"}</Badge>
                    </div>
                    <p className="text-xs text-white/35 mb-0.5">{project.description}</p>
                    <div className="text-[10px] text-white/25">{project.industry} · {project.executives} executives · {project.date}</div>
                  </div>
                  <div className="flex items-center gap-8 flex-shrink-0">
                    <div className="text-center">
                      <div className="text-xl font-bold text-white">{project.score}</div>
                      <div className="text-[10px] text-white/25">Score</div>
                      <Progress value={project.score} size="sm" className="mt-1 w-16" />
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-emerald-400">{project.revenue}</div>
                      <div className="text-[10px] text-white/25">Projected Revenue</div>
                    </div>
                    <svg className="size-4 text-white/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 18l6-6-6-6" /></svg>
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
