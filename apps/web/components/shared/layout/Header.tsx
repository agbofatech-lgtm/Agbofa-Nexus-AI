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
import { useEffect, useRef, useState, type FormEvent } from "react";

import { TopNavigation } from "@/components/shared/navigation/TopNavigation";
import { ThemeToggle } from "@/components/theme/ThemeToggle";
import { useAuth } from "@/hooks/useAuth";
import { useGlobalCommandSearch } from "@/hooks/useGlobalCommandSearch";



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

  const {
    results: searchResults,
    loading: searchLoading,
    error: searchError,
  } = useGlobalCommandSearch(query);

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
            Search stories, intelligence, opportunities, agents, strategies, and workspace destinations
          </label>
          <input
            ref={searchInputRef}
            aria-controls={query ? "global-search-results" : undefined}
            autoComplete="off"
            id="global-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search Nexus OS"
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
              {searchLoading ? (
                <p className="search-results__empty" role="status">
                  Building frontend search projection…
                </p>
              ) : searchError ? (
                <p className="search-results__empty" role="alert">
                  {searchError}
                </p>
              ) : searchResults.length ? (
                searchResults.map((result) => (
                  <button
                    key={result.id}
                    aria-selected="false"
                    className="search-result"
                    onClick={() => navigateTo(result.href)}
                    role="option"
                    type="button"
                  >
                    <span>{result.label}</span>
                    <small>
                      {result.domain} · {result.executionReality}
                    </small>
                  </button>
                ))
              ) : (
                <p className="search-results__empty">
                  No frontend records match “{query}”.
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
