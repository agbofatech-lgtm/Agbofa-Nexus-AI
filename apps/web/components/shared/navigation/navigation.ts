import {
  BarChart3,
  BookOpen,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  Coins,
  Factory,
  Gauge,
  LayoutDashboard,
  Newspaper,
  Orbit,
  Radar,
  Scale,
  Send,
  Settings2,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

export type NavigationContext =
  | "command"
  | "reader"
  | "intelligence"
  | "newsroom"
  | "distribution"
  | "analytics"
  | "settings";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
}

export interface NavigationGroup {
  context: NavigationContext;
  label: string;
  description: string;
  items: readonly NavigationItem[];
}

export const primaryNavigation: readonly (NavigationItem & {
  context: NavigationContext;
})[] = [
  { label: "Reader", href: "/reader", icon: BookOpen, context: "reader" },
  {
    label: "Intelligence",
    href: "/ai-control",
    icon: BrainCircuit,
    context: "intelligence",
  },
  {
    label: "Newsroom",
    href: "/newsroom",
    icon: Newspaper,
    context: "newsroom",
  },
  {
    label: "Distribution",
    href: "/distribution",
    icon: Send,
    context: "distribution",
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    context: "analytics",
  },
  {
    label: "Settings",
    href: "/settings",
    icon: Settings2,
    context: "settings",
  },
] as const;

export const navigationGroups: readonly NavigationGroup[] = [
  {
    context: "command",
    label: "Command",
    description: "Cross-system overview and priority signals",
    items: [
      { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
      { label: "Reader", href: "/reader", icon: BookOpen },
      { label: "AI Control", href: "/ai-control", icon: BrainCircuit },
      { label: "Newsroom", href: "/newsroom", icon: Newspaper },
      { label: "Analytics", href: "/analytics", icon: Gauge },
    ],
  },
  {
    context: "reader",
    label: "Reader",
    description: "Evidence-aware stories and personal intelligence",
    items: [
      { label: "Intelligence Feed", href: "/reader", icon: BookOpen },
      { label: "Personalization", href: "/personalization", icon: Users },
      { label: "Truth Engine", href: "/truth", icon: Scale, badge: "DEMO" },
    ],
  },
  {
    context: "intelligence",
    label: "Intelligence",
    description: "AI operations, signals, and specialist workforces",
    items: [
      { label: "AI Control", href: "/ai-control", icon: BrainCircuit },
      { label: "Agent Workforce", href: "/agents", icon: Bot, badge: "28" },
      { label: "Predictive", href: "/predictive", icon: Orbit },
      { label: "Personalization", href: "/personalization", icon: Users },
      { label: "Multimodal", href: "/multimodal", icon: Sparkles },
    ],
  },
  {
    context: "newsroom",
    label: "Newsroom",
    description: "Origination, production, review, and verification",
    items: [
      { label: "Command Desk", href: "/newsroom", icon: Newspaper },
      { label: "Origination", href: "/newsroom/origination", icon: Radar },
      { label: "Content Factory", href: "/newsroom/factory", icon: Factory },
      {
        label: "Editorial Review",
        href: "/newsroom/review",
        icon: ClipboardCheck,
        badge: "DEMO",
      },
      { label: "Truth Engine", href: "/truth", icon: Scale },
    ],
  },
  {
    context: "distribution",
    label: "Distribution",
    description: "Publishing, growth, and revenue operations",
    items: [
      { label: "Distribution", href: "/distribution", icon: Send },
      { label: "Growth", href: "/growth", icon: TrendingUp },
      { label: "Monetization", href: "/monetization", icon: WalletCards },
    ],
  },
  {
    context: "analytics",
    label: "Analytics",
    description: "Audience, content, commercial, and AI cost views",
    items: [
      { label: "Analytics", href: "/analytics", icon: BarChart3 },
      { label: "AI Cost", href: "/ai-cost", icon: Coins },
    ],
  },
  {
    context: "settings",
    label: "Settings",
    description: "Workspace presentation and demo administration",
    items: [
      { label: "Workspace Settings", href: "/settings", icon: Settings2 },
      { label: "Profile", href: "/profile", icon: UserRound },
      { label: "Administration", href: "/admin", icon: Users },
    ],
  },
] as const;

const contextPrefixes: readonly [string, NavigationContext][] = [
  ["/reader", "reader"],
  ["/agents", "intelligence"],
  ["/ai-control", "intelligence"],
  ["/predictive", "intelligence"],
  ["/personalization", "intelligence"],
  ["/multimodal", "intelligence"],
  ["/newsroom", "newsroom"],
  ["/truth", "newsroom"],
  ["/distribution", "distribution"],
  ["/growth", "distribution"],
  ["/monetization", "distribution"],
  ["/analytics", "analytics"],
  ["/ai-cost", "analytics"],
  ["/settings", "settings"],
  ["/profile", "settings"],
  ["/admin", "settings"],
] as const;

export function getNavigationContext(pathname: string): NavigationContext {
  return (
    contextPrefixes.find(([prefix]) =>
      pathname === prefix || pathname.startsWith(`${prefix}/`),
    )?.[1] ?? "command"
  );
}

export function getNavigationGroup(pathname: string): NavigationGroup {
  const context = getNavigationContext(pathname);
  return (
    navigationGroups.find((group) => group.context === context) ??
    navigationGroups[0]!
  );
}

export function isNavigationItemActive(
  pathname: string,
  href: string,
): boolean {
  return (
    pathname === href ||
    (href !== "/dashboard" && pathname.startsWith(`${href}/`))
  );
}
