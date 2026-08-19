import {
  BarChart3,
  Binoculars,
  BookOpen,
  Bot,
  BrainCircuit,
  ClipboardCheck,
  Coins,
  Factory,
  FlaskConical,
  LayoutDashboard,
  Newspaper,
  Orbit,
  Radar,
  Scale,
  ScanSearch,
  Send,
  Settings2,
  Sparkles,
  TrendingUp,
  UserRound,
  Users,
  WalletCards,
  type LucideIcon,
} from "lucide-react";

import { isFrontendFeatureEnabled } from "@/lib/config/feature-flags";
import type { FrontendFeatureFlag } from "@/types/feature-flags";

export type NavigationContext =
  "command" | "reader" | "intelligence" | "content" | "business" | "system";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  badge?: string;
  exact?: boolean;
  featureFlag?: FrontendFeatureFlag;
}

export interface PrimaryNavigationItem extends NavigationItem {
  matchPrefixes: readonly string[];
}

export interface NavigationGroup {
  context: Exclude<NavigationContext, "command" | "reader">;
  label: string;
  description: string;
  items: readonly NavigationItem[];
}

export interface NavigationContextDetails {
  label: string;
  description: string;
  icon: LucideIcon;
}

export const primaryNavigation: readonly PrimaryNavigationItem[] = [
  {
    label: "Reader",
    href: "/reader",
    icon: BookOpen,
    matchPrefixes: ["/reader"],
  },
  {
    label: "Intelligence",
    href: "/ai-control",
    icon: BrainCircuit,
    matchPrefixes: [
      "/ai-control",
      "/predictive",
      "/personalization",
      "/multimodal",
    ],
  },
  {
    label: "Newsroom",
    href: "/newsroom",
    icon: Newspaper,
    matchPrefixes: ["/newsroom", "/truth"],
  },
  {
    label: "Agents",
    href: "/agents",
    icon: Bot,
    featureFlag: "agents",
    matchPrefixes: ["/agents"],
  },
  {
    label: "Distribution",
    href: "/distribution",
    icon: Send,
    featureFlag: "distribution",
    matchPrefixes: ["/distribution", "/growth", "/monetization"],
  },
  {
    label: "Analytics",
    href: "/analytics",
    icon: BarChart3,
    featureFlag: "analytics",
    matchPrefixes: ["/analytics", "/experiments", "/ai-cost"],
  },
] as const;

export const mobileNavigation: readonly PrimaryNavigationItem[] =
  primaryNavigation.slice(0, 4);

export const navigationGroups: readonly NavigationGroup[] = [
  {
    context: "intelligence",
    label: "Intelligence",
    description: "AI operations, signals, and specialist workforces",
    items: [
      { label: "AI Control", href: "/ai-control", icon: BrainCircuit },
      {
        label: "Agents",
        href: "/agents",
        icon: Bot,
        badge: "28",
        featureFlag: "agents",
      },
      { label: "Predictive", href: "/predictive", icon: Orbit },
      { label: "Personalization", href: "/personalization", icon: Users },
      { label: "Multimodal", href: "/multimodal", icon: Sparkles },
    ],
  },
  {
    context: "content",
    label: "Content",
    description: "Origination, production, review, and verification",
    items: [
      {
        label: "Newsroom",
        href: "/newsroom",
        icon: Newspaper,
        exact: true,
      },
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
    context: "business",
    label: "Business",
    description: "Distribution, growth, analytics, and revenue intelligence",
    items: [
      {
        label: "Distribution",
        href: "/distribution",
        icon: Send,
        featureFlag: "distribution",
      },
      {
        label: "Growth Overview",
        href: "/growth",
        icon: TrendingUp,
        exact: true,
        featureFlag: "growth",
      },
      {
        label: "Opportunities",
        href: "/growth/opportunities",
        icon: Binoculars,
        featureFlag: "opportunities",
      },
      {
        label: "Strategy Director",
        href: "/growth/strategy",
        icon: BrainCircuit,
        featureFlag: "strategyDirector",
      },
      {
        label: "Decision Center",
        href: "/growth/decisions",
        icon: Scale,
        featureFlag: "decisions",
      },
      { label: "Trend Radar", href: "/growth/trends", icon: Radar },
      {
        label: "Content Gap",
        href: "/growth/content-gap",
        icon: ScanSearch,
        featureFlag: "contentDNA",
      },
      {
        label: "Audience Intelligence",
        href: "/growth/audience",
        icon: Users,
        featureFlag: "audienceIntelligence",
      },
      {
        label: "Competitors",
        href: "/growth/competitors",
        icon: BarChart3,
        featureFlag: "competitorIntelligence",
      },
      {
        label: "Analytics",
        href: "/analytics",
        icon: BarChart3,
        featureFlag: "analytics",
      },
      {
        label: "Experiments",
        href: "/experiments",
        icon: FlaskConical,
        featureFlag: "experiments",
      },
      {
        label: "Monetization",
        href: "/monetization",
        icon: WalletCards,
        featureFlag: "monetization",
      },
    ],
  },
  {
    context: "system",
    label: "System",
    description: "Cost, administration, workspace, and identity presentation",
    items: [
      { label: "AI Cost", href: "/ai-cost", icon: Coins },
      { label: "Admin", href: "/admin", icon: Users },
      { label: "Settings", href: "/settings", icon: Settings2 },
      { label: "Profile", href: "/profile", icon: UserRound },
    ],
  },
] as const;

const contextDetails: Record<NavigationContext, NavigationContextDetails> = {
  command: {
    label: "Command",
    description: "Cross-system overview and priority signals",
    icon: LayoutDashboard,
  },
  reader: {
    label: "Reader",
    description: "Evidence-aware stories and personal intelligence",
    icon: BookOpen,
  },
  intelligence: {
    label: "Intelligence",
    description: "AI operations, predictions, and specialist workforces",
    icon: BrainCircuit,
  },
  content: {
    label: "Content",
    description: "Newsroom, origination, production, and verification",
    icon: Newspaper,
  },
  business: {
    label: "Business",
    description: "Distribution, growth, analytics, and monetization",
    icon: Send,
  },
  system: {
    label: "System",
    description: "Cost, administration, settings, and profile",
    icon: Settings2,
  },
};

const contextPrefixes: readonly [string, NavigationContext][] = [
  ["/reader", "reader"],
  ["/agents", "intelligence"],
  ["/ai-control", "intelligence"],
  ["/predictive", "intelligence"],
  ["/personalization", "intelligence"],
  ["/multimodal", "intelligence"],
  ["/newsroom", "content"],
  ["/truth", "content"],
  ["/distribution", "business"],
  ["/growth", "business"],
  ["/analytics", "business"],
  ["/experiments", "business"],
  ["/monetization", "business"],
  ["/ai-cost", "system"],
  ["/settings", "system"],
  ["/profile", "system"],
  ["/admin", "system"],
] as const;

function pathnameMatchesPrefix(pathname: string, prefix: string): boolean {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function getNavigationContext(pathname: string): NavigationContext {
  return (
    contextPrefixes.find(([prefix]) =>
      pathnameMatchesPrefix(pathname, prefix),
    )?.[1] ?? "command"
  );
}

export function getNavigationContextDetails(
  pathname: string,
): NavigationContextDetails {
  return contextDetails[getNavigationContext(pathname)];
}

export function isPrimaryNavigationActive(
  pathname: string,
  item: PrimaryNavigationItem,
): boolean {
  return item.matchPrefixes.some((prefix) =>
    pathnameMatchesPrefix(pathname, prefix),
  );
}

export function isNavigationItemVisible(item: NavigationItem): boolean {
  return item.featureFlag ? isFrontendFeatureEnabled(item.featureFlag) : true;
}

export function isNavigationItemActive(
  pathname: string,
  href: string,
  exact = false,
): boolean {
  return (
    pathname === href ||
    (!exact && href !== "/dashboard" && pathname.startsWith(`${href}/`))
  );
}
