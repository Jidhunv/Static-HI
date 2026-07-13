'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  ShoppingCart,
  Users,
  BarChart3,
  Settings,
  LogOut,
} from 'lucide-react';
import { AuthUser } from '@hotel/types';

interface SidebarProps {
  user: AuthUser | null;
  onLogout: () => void;
}

export function Sidebar({ user, onLogout }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/dashboard/properties', label: 'Hotels', icon: Building2 },
    { href: '/dashboard/b2b', label: 'B2B Marketplace', icon: ShoppingCart },
    { href: '/dashboard/team', label: 'Team', icon: Users },
    { href: '/dashboard/reports', label: 'Reports', icon: BarChart3 },
    { href: '/dashboard/settings', label: 'Settings', icon: Settings },
  ];

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <div className="logo-icon">🏨</div>
          <div className="logo-text">
            <div className="logo-title">HotelHub</div>
            <div className="logo-subtitle">Inventory</div>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section">
          <h3 className="nav-section-title">Main</h3>
          <ul className="nav-items">
            {navItems.slice(0, 4).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  <item.icon className="nav-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>

        <div className="nav-section">
          <h3 className="nav-section-title">Analytics</h3>
          <ul className="nav-items">
            {navItems.slice(4).map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`nav-item ${isActive(item.href) ? 'active' : ''}`}
                >
                  <item.icon className="nav-icon" />
                  <span>{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="tenant-info">
          <div className="tenant-avatar">{user?.tenantName?.[0]}</div>
          <div className="tenant-details">
            <div className="tenant-name">{user?.tenantName}</div>
            <div className="tenant-role">{user?.role}</div>
          </div>
        </div>
        <button className="logout-btn" onClick={onLogout}>
          <LogOut className="logout-icon" />
        </button>
      </div>
    </aside>
  );
}
