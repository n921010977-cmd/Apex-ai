import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";

// ─── sitemap.xml ──────────────────────────────────────────────────────────────
// Только реально существующие публичные страницы. Личный кабинет, админка,
// страницы оплаты и ссылки с токенами сюда не попадают (см. robots.ts).

const PUBLIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] }[] = [
  { path: "/",               priority: 1.0, changeFrequency: "weekly"  },
  { path: "/pricing",        priority: 0.9, changeFrequency: "weekly"  },
  { path: "/features",       priority: 0.8, changeFrequency: "monthly" },
  { path: "/use-cases",      priority: 0.8, changeFrequency: "monthly" },
  { path: "/login",          priority: 0.4, changeFrequency: "yearly"  },
  { path: "/register",       priority: 0.6, changeFrequency: "yearly"  },
  { path: "/legal",          priority: 0.3, changeFrequency: "yearly"  },
  { path: "/legal/terms",    priority: 0.3, changeFrequency: "yearly"  },
  { path: "/legal/privacy",  priority: 0.3, changeFrequency: "yearly"  },
  { path: "/legal/cookies",  priority: 0.2, changeFrequency: "yearly"  },
  { path: "/legal/offer",    priority: 0.2, changeFrequency: "yearly"  },
  { path: "/legal/consent",  priority: 0.2, changeFrequency: "yearly"  },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();
  return PUBLIC_PATHS.map(p => ({
    url: `${siteUrl()}${p.path === "/" ? "" : p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));
}
