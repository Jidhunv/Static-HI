'use client';

import { Bell, Search, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import { AuthUser } from '@hotel/types';
import { useState } from 'react';

interface TopBarProps {
  user: AuthUser | null;
}

export function TopBar({ user }: TopBarProps) {
  const { theme, setTheme } = useTheme();
  const [notifications, setNotifications] = useState(0);

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="search-box">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder="Search hotels, bookings..."
            className="search-input"
          />
        </div>
      </div>

      <div className="topbar-right">
        <button
          className="topbar-btn notification-btn"
          title="Notifications"
        >
          <Bell className="topbar-icon" />
          {notifications > 0 && <span className="notification-badge">{notifications}</span>}
        </button>

        <button
          className="topbar-btn theme-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          title="Toggle theme"
        >
          {theme === 'dark' ? (
            <Sun className="topbar-icon" />
          ) : (
            <Moon className="topbar-icon" />
          )}
        </button>

        <div className="user-menu">
          <div className="user-avatar">{user?.firstName?.[0]}</div>
          <div className="user-info">
            <div className="user-name">{user?.firstName} {user?.lastName}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>
      </div>
    </header>
  );
}
