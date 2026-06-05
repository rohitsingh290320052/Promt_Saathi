import { Link, useLocation } from "wouter";
import { Sparkles, History, LayoutTemplate, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", labelHi: "AI से पूछें", label: "Ask AI", icon: Sparkles },
  { href: "/templates", labelHi: "उदाहरण", label: "Examples", icon: LayoutTemplate },
  { href: "/history", labelHi: "मेरे जवाब", label: "My Answers", icon: History },
];

export default function Sidebar() {
  const [location] = useLocation();

  return (
    <aside className="w-60 border-r border-border bg-sidebar flex flex-col shrink-0 h-screen sticky top-0">
      <div className="p-5 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Zap className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-bold text-base leading-none text-foreground">PromptBridge</h1>
            <p className="text-xs text-muted-foreground mt-0.5">आपका AI सहायक</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {navItems.map(({ href, label, labelHi, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            data-testid={`nav-${label.toLowerCase().replace(" ", "-")}`}
            className={cn(
              "flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-colors",
              location === href
                ? "bg-primary text-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm leading-none">{labelHi}</div>
              <div className={cn("text-[11px] mt-0.5", location === href ? "text-primary-foreground/70" : "text-muted-foreground")}>{label}</div>
            </div>
          </Link>
        ))}
      </nav>

      <div className="p-4 border-t border-border space-y-3">
        <div className="rounded-xl bg-primary/10 border border-primary/20 p-3 space-y-2">
          <p className="text-xs font-bold text-primary">3 AI एक्सपर्ट्स एक साथ</p>
          <div className="space-y-1.5">
            {[
              { dot: "bg-emerald-500", label: "GPT-5 live" },
              { dot: "bg-amber-500", label: "Claude live" },
              { dot: "bg-orange-500", label: "DALL-E live" },
            ].map(({ dot, label }) => (
              <div key={label} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                <span className={cn("w-1.5 h-1.5 rounded-full animate-pulse", dot)} />
                {label}
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-xl bg-secondary/50 p-3 space-y-2">
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            💡 <span className="text-foreground/70 font-medium">Hindi या English</span> — कोई भी भाषा चलेगी!
          </p>
          <p className="text-[11px] text-muted-foreground leading-relaxed">
            ✨ जटिल काम? <span className="text-foreground/70 font-medium">प्रॉम्प्ट बनाएं</span> टैब से expert prompts बनाएं।
          </p>
        </div>
      </div>
    </aside>
  );
}
