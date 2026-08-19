"use client";

import { BrainCircuit, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Provider Control", href: "/ai-control", icon: BrainCircuit },
  { label: "Autonomy Simulation", href: "/ai-control/autonomy", icon: ShieldCheck },
] as const;

export function AIControlWorkspaceNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="AI control sections" className="ai-control-workspace-nav">
      {links.map((item) => {
        const Icon = item.icon;
        const active = pathname === item.href;
        return (
          <Link aria-current={active ? "page" : undefined} href={item.href} key={item.href}>
            <Icon aria-hidden="true" size={13} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
