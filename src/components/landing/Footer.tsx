import Link from "next/link";

export function Footer() {
  return (
    <footer className="relative border-t border-white/[0.06] py-16 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-10 mb-12">
          <div className="col-span-2">
            <div className="flex items-center gap-3 mb-4">
              <div className="size-9 rounded-xl bg-gradient-to-br from-violet-600 to-blue-500 flex items-center justify-center">
                <svg className="size-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </svg>
              </div>
              <div>
                <div className="text-sm font-bold text-white">Business Command Center</div>
                <div className="text-[10px] text-white/30 tracking-widest uppercase">AI Executive Board</div>
              </div>
            </div>
            <p className="text-sm text-white/35 leading-relaxed max-w-xs">The AI Operating System for entrepreneurs, founders, and companies ready to scale.</p>
          </div>
          {[
            { heading: "Product", links: ["Features","Executives","Reports","Pricing","Changelog"] },
            { heading: "Company", links: ["About","Blog","Careers","Press","Contact"] },
            { heading: "Legal", links: ["Privacy Policy","Terms of Service","Cookie Policy","Disclaimer"] },
          ].map((col) => (
            <div key={col.heading}>
              <h4 className="text-xs font-semibold text-white/50 uppercase tracking-widest mb-4">{col.heading}</h4>
              <ul className="flex flex-col gap-2.5">
                {col.links.map((item) => (
                  <li key={item}><Link href="#" className="text-sm text-white/30 hover:text-white/70 transition-colors">{item}</Link></li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="pt-8 border-t border-white/[0.05] flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/20">© 2025 Business Command Center. All rights reserved.</p>
          <div className="flex items-center gap-4">
            {["Twitter","LinkedIn","GitHub"].map((s) => (
              <Link key={s} href="#" className="text-xs text-white/25 hover:text-white/60 transition-colors">{s}</Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
