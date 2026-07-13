'use client';

import { DashboardKpis } from '@/components/dashboard/kpis';
import { RevenueChart } from '@/components/dashboard/revenue-chart';
import { BookingsTable } from '@/components/dashboard/bookings-table';
import { PropertyStats } from '@/components/dashboard/property-stats';

export default function DashboardPage() {
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p>Welcome back! Here's your performance overview.</p>
        </div>
      </div>

      {/* KPI Cards */}
      <DashboardKpis />

      {/* Revenue Chart */}
      <div className="chart-container">
        <RevenueChart />
      </div>

      {/* Property Stats & Recent Bookings */}
      <div className="dashboard-grid">
        <PropertyStats />
        <BookingsTable />
      </div>
    </div>
  );
}
