"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bell,
  BookOpen,
  Bot,
  BrainCircuit,
  CheckCheck,
  ChevronDown,
  LogOut,
  Menu,
  Search,
  Settings,
  Sparkles,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState, type FormEvent } from "react";

import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";

interface HeaderLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

const headerLinks: readonly HeaderLink[] = [
  { label: "Reader", href: "/reader", icon: BookOpen },
  { label: "Intelligence", href: "/intelligence", icon: BrainCircuit },
  { label: "Agents", href: "/agents", icon: Bot },
];

const searchableDestinations = [
  { label: "Command overview", href: "/dashboard", group: "Command" },
  { label: "Reader", href: "/reader", group: "Command" },
  { label: "AI Intelligence", href: "/intelligence", group: "Intelligence" },
  { label: "Agent workforce", href: "/agents", group: "Intelligence" },
  { label: "Newsroom", href: "/newsroom", group: "Content" },
  { label: "Truth review", href: "/review", group: "Content" },
  { label: "Analytics", href: "/analytics", group: "Business" },
  { label: "Operations", href: "/operations", group: "System" },
] as const;

interface HeaderProps {
  onOpenNavigation: () => void;
}

export function Header({ onOpenNavigation }: HeaderProps) {
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
      .slice(0, 5);
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
        <nav aria-label="Workspace shortcuts" className="app-header__links">
          {headerLinks.map((link) => {
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                className="app-header__link"
                href={link.href}
              >
                <Icon size={15} />
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>

      <div className="app-header__actions">
        <form className="global-search" onSubmit={onSearch} role="search">
          <Search
            aria-hidden="true"
            className="global-search__icon"
            size={16}
          />
          <label className="sr-only" htmlFor="global-search">
            Search Nexus
          </label>
          <input
            ref={searchInputRef}
            autoComplete="off"
            id="global-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Nexus..."
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
            <div className="search-results glass-dark">
              {searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    key={result.href}
                    className="search-result"
                    onClick={() => navigateTo(result.href)}
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
            aria-expanded={notificationsOpen}
            aria-label={`Notifications, ${unreadNotifications} unread`}
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
            <div className="header-popover notifications-panel glass-dark">
              <div className="header-popover__heading">
                <div>
                  <strong>Notifications</strong>
                  <span>{unreadNotifications} unread</span>
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
                  <strong>Foundation workspace ready</strong>
                  <p>Your cinematic command shell is online.</p>
                  <time>Just now</time>
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
                  <strong>Theme preference synchronized</strong>
                  <p>Dark and light modes are available.</p>
                  <time>2 min ago</time>
                </div>
              </div>
            </div>
          ) : null}
        </div>

        <ThemeToggle />

        <div className="header-popover-anchor">
          <button
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
              <small>{session?.user.role ?? "User"}</small>
            </span>
            <ChevronDown size={14} />
          </button>
          {userMenuOpen ? (
            <div className="header-popover user-menu glass-dark">
              <div className="user-menu__identity">
                <span className="user-avatar user-avatar--large">
                  {initials}
                </span>
                <div>
                  <strong>{displayName}</strong>
                  <span>
                    {session?.user.email ?? "Authenticated workspace"}
                  </span>
                </div>
              </div>
              <Link href="/profile">
                <User size={16} /> Profile
              </Link>
              <Link href="/settings">
                <Settings size={16} /> Settings
              </Link>
              <button
                onClick={() => {
                  signOut();
                  setUserMenuOpen(false);
                  router.replace("/");
                }}
                type="button"
              >
                <LogOut size={16} /> Sign out
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
