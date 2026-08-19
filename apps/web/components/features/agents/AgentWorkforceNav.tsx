"use client";

import { Boxes, GitBranch, Layers3, ShieldCheck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { label: "Workforce", href: "/agents", icon: Users, exact: true },
  { label: "Workflow", href: "/agents/workflow", icon: GitBranch, exact: false },
  { label: "Content", href: "/agents/detectors", icon: Layers3, exact: false },
  { label: "Verification", href: "/agents/verification", icon: ShieldCheck, exact: false },
  { label: "Distribution & Platform", href: "/agents/pipeline", icon: Boxes, exact: false },
] as const;

export function AgentWorkforceNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Agent workforce sections" className="agent-workforce-nav">
      {links.map((item) => {
        const Icon = item.icon;
        const active = item.exact ? pathname === item.href : pathname === item.href || pathname.startsWith(`${item.href}/`);
        return <Link aria-current={active ? "page" : undefined} href={item.href} key={item.href}><Icon aria-hidden="true" size={13} />{item.label}</Link>;
      })}
    </nav>
  );
}
