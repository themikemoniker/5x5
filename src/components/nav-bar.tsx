"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gavel, Briefcase } from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "Catalog", icon: Gavel },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 max-w-7xl">
        <div className="flex items-center h-14 gap-6">
          <Link href="/" className="font-bold text-lg flex items-center gap-2">
            <Gavel className="h-5 w-5" />
            Tax Lien Catalog
          </Link>
          <div className="flex items-center gap-1 ml-4">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive =
                href === "/" ? pathname === "/" : pathname.startsWith(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </Link>
              );
            })}
          </div>
        </div>
      </div>
    </nav>
  );
}
