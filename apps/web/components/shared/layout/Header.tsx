"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  CheckCheck,
  ChevronDown,
  FlaskConical,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  User,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { TopNavigation } from "@/components/shared/navigation/TopNavigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

const searchableDestinations = [
  { label: "Command overview", href: "/dashboard", group: "Command" },
  { label: "Reader", href: "/reader", group: "Reader" },
  { label: "AI Control Center", href: "/ai-control", group: "Intelligence" },
  { label: "Agent workforce", href: "/agents", group: "Intelligence" },
  {
    label: "Predictive Intelligence",
    href: "/predictive",
    group: "Intelligence",
  },
  {
    label: "Personalization Intelligence",
    href: "/personalization",
    group: "Intelligence",
  },
  {
    label: "Multimodal Intelligence",
    href: "/multimodal",
    group: "Intelligence",
  },
  { label: "Newsroom", href: "/newsroom", group: "Newsroom" },
  { label: "Truth Engine", href: "/truth", group: "Newsroom" },
  { label: "Distribution", href: "/distribution", group: "Distribution" },
  { label: "Growth Command Center", href: "/growth", group: "Growth" },
  {
    label: "Opportunity Center",
    href: "/growth/opportunities",
    group: "Growth",
  },
  { label: "Trend Radar", href: "/growth/trends", group: "Growth" },
  { label: "Content Gap", href: "/growth/content-gap", group: "Growth" },
  { label: "Audience Intelligence", href: "/growth/audience", group: "Growth" },
  {
    label: "Competitor Intelligence",
    href: "/growth/competitors",
    group: "Growth",
  },
  { label: "Monetization", href: "/monetization", group: "Distribution" },
  { label: "Analytics", href: "/analytics", group: "Analytics" },
  { label: "AI Cost Intelligence", href: "/ai-cost", group: "Analytics" },
  { label: "Workspace settings", href: "/settings", group: "Settings" },
  { label: "Profile", href: "/profile", group: "Settings" },
  { label: "Administration", href: "/admin", group: "Settings" },
  { label: "Tenant Management", href: "/admin/tenants", group: "Settings" },
  { label: "User Management", href: "/admin/users", group: "Settings" },
] as const;

interface HeaderProps {
  navigationOpen: boolean;
  onOpenNavigation: () => void;
}

export function Header({ navigationOpen, onOpenNavigation }: HeaderProps) {
  const router = useRouter();
  const { session, signOut } = useAuth();
  const displayName = session?.user.name ?? "Nexus User";
  const initials = displayName
    .split(" ")
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();
  const [query, setQuery] = useState("");
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(2);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const searchResults = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return [];
    return searchableDestinations
      .filter((item) =>
        `${item.label} ${item.group}`.toLowerCase().includes(normalized),
      )
      .slice(0, 6);
  }, [query]);

  useEffect(() => {
    const closeMenus = (event: PointerEvent) => {
      if (!headerRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
      }
    };
    const onGlobalKeyDown = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        searchInputRef.current?.focus();
      }
      if (event.key === "Escape") {
        setNotificationsOpen(false);
        setUserMenuOpen(false);
        setQuery("");
        searchInputRef.current?.blur();
      }
    };

    document.addEventListener("pointerdown", closeMenus);
    document.addEventListener("keydown", onGlobalKeyDown);
    return () => {
      document.removeEventListener("pointerdown", closeMenus);
      document.removeEventListener("keydown", onGlobalKeyDown);
    };
  }, []);

  const navigateTo = (href: string) => {
    router.push(href);
    setQuery("");
  };

  const onSearch = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const firstResult = searchResults[0];
    if (firstResult) navigateTo(firstResult.href);
  };

  return (
    <header ref={headerRef} className="app-header">
      <div className="app-header__left">
        <button
          aria-controls="workspace-navigation"
          aria-expanded={navigationOpen}
          aria-label="Open navigation"
          className="app-header__menu icon-button"
          onClick={onOpenNavigation}
          type="button"
        >
          <Menu size={20} />
        </button>
        <Link
          aria-label="Agbofa Nexus AI dashboard"
          className="app-header__mobile-brand"
          href="/dashboard"
        >
          <Sparkles size={17} />
          <span>NEXUS</span>
        </Link>
        <TopNavigation />
      </div>

      <div className="app-header__actions">
        <form className="global-search" onSubmit={onSearch} role="search">
          <Search
            aria-hidden="true"
            className="global-search__icon"
            size={16}
          />
          <label className="sr-only" htmlFor="global-search">
            Search workspace destinations
          </label>
          <input
            ref={searchInputRef}
            aria-controls={query ? "global-search-results" : undefined}
            autoComplete="off"
            id="global-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search stories, agents, workflows"
            type="search"
            value={query}
          />
          <kbd>⌘ K</kbd>
          {query ? (
            <button
              aria-label="Clear search"
              className="global-search__clear"
              onClick={() => setQuery("")}
              type="button"
            >
              <X size={14} />
            </button>
          ) : null}
          {query ? (
            <div
              className="search-results glass-dark"
              id="global-search-results"
              role="listbox"
            >
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    key={result.href}
                    aria-selected="false"
                    className="search-result"
                    onClick={() => navigateTo(result.href)}
                    role="option"
                    type="button"
                  >
                    <span>{result.label}</span>
                    <small>{result.group}</small>
                  </button>
                ))
              ) : (
                <p className="search-results__empty">
                  No destinations match “{query}”.
                </p>
              )}
            </div>
          ) : null}
        </form>

        <div className="header-popover-anchor">
          <button
            aria-controls="demo-notifications"
            aria-expanded={notificationsOpen}
            aria-label={`Demo notifications, ${unreadNotifications} unread`}
            className="icon-button notification-button"
            onClick={() => {
              setNotificationsOpen((open) => !open);
              setUserMenuOpen(false);
            }}
            type="button"
          >
            <Bell size={18} />
            {unreadNotifications > 0 ? (
              <span aria-hidden="true" className="notification-button__dot" />
            ) : null}
          </button>
          {notificationsOpen ? (
            <div
              aria-label="Demo notifications"
              className="header-popover notifications-panel glass-dark"
              id="demo-notifications"
              role="region"
            >
              <div className="header-popover__heading">
                <div>
                  <strong>Demo notifications</strong>
                  <span>Local interface examples · not live events</span>
                </div>
                <button
                  className="text-action"
                  disabled={unreadNotifications === 0}
                  onClick={() => setUnreadNotifications(0)}
                  type="button"
                >
                  <CheckCheck size={14} /> Mark read
                </button>
              </div>
              <div
                className={
                  unreadNotifications > 0
                    ? "notification-item notification-item--unread"
                    : "notification-item"
                }
              >
                {unreadNotifications > 0 ? (
                  <span className="notification-item__signal" />
                ) : null}
                <div>
                  <strong>Frontend foundation available</strong>
                  <p>
                    Navigation and presentation layers are available for review.
                  </p>
                  <time>Demo event</time>
                </div>
              </div>
              <div
                className={
                  unreadNotifications > 0
                    ? "notification-item notification-item--unread"
                    : "notification-item"
                }
              >
                {unreadNotifications > 0 ? (
                  <span className="notification-item__signal notification-item__signal--blue" />
                ) : null}
                <div>
                  <strong>Development adapters active</strong>
                  <p>
                    No backend, provider, or production event stream is
                    connected.
                  </p>
                  <time>Demo event</time>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <ThemeToggle />

        <div className="header-popover-anchor">
          <button
            aria-controls="workspace-user-menu"
            aria-expanded={userMenuOpen}
            aria-label="Open user menu"
            className="user-trigger"
            onClick={() => {
              setUserMenuOpen((open) => !open);
              setNotificationsOpen(false);
            }}
            type="button"
          >
            <span className="user-avatar">{initials}</span>
            <span className="user-trigger__copy">
              <strong>{displayName}</strong>
              <small>{session?.user.role ?? "User"} · demo</small>
            </span>
            <ChevronDown size={14} />
          </button>
          {userMenuOpen ? (
            <div
              aria-label="Workspace account"
              className="header-popover user-menu glass-dark"
              id="workspace-user-menu"
              role="menu"
            >
              <div className="user-menu__identity">
                <span className="user-avatar user-avatar--large">
                  {initials}
                </span>
                <div>
                  <strong>{displayName}</strong>
                  <span>
                    {session?.user.email ?? "Demo workspace identity"}
                  </span>
                </div>
              </div>
              <div className="user-menu__authority">
                <FlaskConical size={13} /> Browser-local demo session
              </div>
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                role="menuitem"
              >
                <User size={16} /> Profile
              </Link>
              <Link
                href="/settings"
                onClick={() => setUserMenuOpen(false)}
                role="menuitem"
              >
                <Settings size={16} /> Settings
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setUserMenuOpen(false);
                  router.replace("/");
                }}
                role="menuitem"
                type="button"
              >
                <LogOut size={16} /> Sign out of demo
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
