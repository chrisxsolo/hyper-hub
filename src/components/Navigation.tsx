"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Brain, Camera, Dumbbell, Home } from "lucide-react";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/health", label: "Health", icon: Dumbbell },
  { href: "/photography", label: "Photography", icon: Camera },
  { href: "/stoicism", label: "Stoicism", icon: Brain },
];

export default function Navigation() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 glass border-b border-white/[0.06]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 sm:gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-400/80 to-orange-500/80 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <span className="text-sm font-bold text-white">H</span>
          </div>
          <span className="font-semibold text-sm tracking-wide text-white/90 group-hover:text-white transition-colors hidden xs:block sm:block">
            Hyper Hub
          </span>
        </Link>

        <nav className="flex items-center gap-0.5 sm:gap-1">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== "/" && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  active
                    ? "bg-amber-500/15 text-amber-300 border border-amber-500/20"
                    : "text-white/50 hover:text-white/80 hover:bg-white/[0.05]"
                }`}
              >
                <Icon size={14} />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
