import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2">
          <span className="text-xl font-bold">Apex AI</span>
          <Badge variant="secondary">Beta</Badge>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          <Link href="#features" className="text-muted-foreground hover:text-foreground transition-colors">
            Features
          </Link>
          <Link href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="#about" className="text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
        </nav>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm">Log in</Button>
          <Button size="sm">Get started</Button>
        </div>
      </div>
    </header>
  );
}
