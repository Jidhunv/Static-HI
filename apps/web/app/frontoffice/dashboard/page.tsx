'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Calendar, Users, DollarSign, BarChart3, LogOut, Check, Clock, X } from 'lucide-react';

interface Booking {
  id: string;
  guestName: string;
  roomType: string;
  checkInDate: string;
  checkOutDate: string;
  status: 'confirmed' | 'pending' | 'cancelled';
  totalAmount: number;
  source: 'b2b' | 'b2c';
}

interface Dashboard {
  todayCheckIns: number;
  todayCheckOuts: number;
  occupancy: number;
  revenue: number;
  bookings: Booking[];
}

export default function FrontOfficeDashboard() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'bookings' | 'b2b' | 'b2c'>('overview');

  useEffect(() => {
    const token = localStorage.getItem('frontoffice_token');
    const userData = localStorage.getItem('frontoffice_user');

    if (!token || !userData) {
      router.push('/login/frontoffice');
      return;
    }

    setUser(JSON.parse(userData));
    fetchDashboard();
  }, [router]);

  const fetchDashboard = async () => {
    try {
      const token = localStorage.getItem('frontoffice_token');
      const res = await fetch('http://localhost:3001/api/v1/frontoffice/dashboard', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.ok) {
        const data = await res.json();
        setDashboard(data);
      }
    } catch (err) {
      console.error('Failed to fetch dashboard:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('frontoffice_token');
    localStorage.removeItem('frontoffice_user');
    router.push('/login/frontoffice');
  };

  if (isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-3xl">🏨</div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">HotelHub Front Office</h1>
              <p className="text-xs text-slate-600 dark:text-slate-400">Property Management Portal</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-slate-900 dark:text-white">{user?.name}</p>
              <p className="text-xs text-slate-600 dark:text-slate-400">{user?.email}</p>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {/* Navigation Tabs */}
        <div className="flex gap-2 mb-6 border-b border-slate-200 dark:border-slate-700">
          {[
            { id: 'overview', label: 'Overview', icon: '📊' },
            { id: 'bookings', label: 'All Bookings', icon: '📅' },
            { id: 'b2b', label: 'B2B Bookings', icon: '🏢' },
            { id: 'b2c', label: 'B2C Bookings', icon: '👤' },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                selectedTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* OVERVIEW TAB */}
        {selectedTab === 'overview' && (
          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">Dashboard Overview</h2>

            {/* KPI Cards */}
            <div className="grid grid-cols-4 gap-4 mb-8">
              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Today's Check-ins</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {dashboard?.todayCheckIns || 0}
                    </p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Today's Check-outs</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {dashboard?.todayCheckOuts || 0}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Occupancy Rate</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      {dashboard?.occupancy || 0}%
                    </p>
                  </div>
                  <BarChart3 className="h-8 w-8 text-purple-500" />
                </div>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-slate-600 dark:text-slate-400 text-sm">Today's Revenue</p>
                    <p className="text-3xl font-bold text-slate-900 dark:text-white mt-1">
                      ${dashboard?.revenue || 0}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-600" />
                </div>
              </div>
            </div>

            {/* Today's Bookings Summary */}
            <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
              <h3 className="text-lg font-semibold text-slate-900 dark:text-white mb-4">Today's Bookings</h3>
              {dashboard?.bookings && dashboard.bookings.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="text-left p-3">Guest Name</th>
                        <th className="text-left p-3">Room Type</th>
                        <th className="text-left p-3">Check-in</th>
                        <th className="text-left p-3">Check-out</th>
                        <th className="text-left p-3">Source</th>
                        <th className="text-left p-3">Amount</th>
                        <th className="text-left p-3">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {dashboard.bookings.map(booking => (
                        <tr key={booking.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="p-3">{booking.guestName}</td>
                          <td className="p-3">{booking.roomType}</td>
                          <td className="p-3 text-xs">{booking.checkInDate}</td>
                          <td className="p-3 text-xs">{booking.checkOutDate}</td>
                          <td className="p-3">
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              booking.source === 'b2b'
                                ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                                : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                            }`}>
                              {booking.source.toUpperCase()}
                            </span>
                          </td>
                          <td className="p-3 font-semibold">${booking.totalAmount}</td>
                          <td className="p-3">
                            <div className="flex items-center gap-2">
                              {booking.status === 'confirmed' && (
                                <>
                                  <Check className="h-4 w-4 text-green-600" />
                                  <span className="text-green-600">Confirmed</span>
                                </>
                              )}
                              {booking.status === 'pending' && (
                                <>
                                  <Clock className="h-4 w-4 text-yellow-600" />
                                  <span className="text-yellow-600">Pending</span>
                                </>
                              )}
                              {booking.status === 'cancelled' && (
                                <>
                                  <X className="h-4 w-4 text-red-600" />
                                  <span className="text-red-600">Cancelled</span>
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-slate-600 dark:text-slate-400">No bookings for today</p>
              )}
            </div>
          </div>
        )}

        {/* ALL BOOKINGS TAB */}
        {selectedTab === 'bookings' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">All Bookings</h2>
            {dashboard?.bookings && dashboard.bookings.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-700">
                    <tr>
                      <th className="text-left p-3 font-semibold">Guest</th>
                      <th className="text-left p-3 font-semibold">Room</th>
                      <th className="text-left p-3 font-semibold">Check-in</th>
                      <th className="text-left p-3 font-semibold">Check-out</th>
                      <th className="text-left p-3 font-semibold">Source</th>
                      <th className="text-left p-3 font-semibold">Amount</th>
                      <th className="text-left p-3 font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.bookings.map(booking => (
                      <tr key={booking.id} className="border-b border-slate-200 dark:border-slate-700">
                        <td className="p-3">{booking.guestName}</td>
                        <td className="p-3">{booking.roomType}</td>
                        <td className="p-3 text-xs">{booking.checkInDate}</td>
                        <td className="p-3 text-xs">{booking.checkOutDate}</td>
                        <td className="p-3">
                          <span className={`px-2 py-1 rounded text-xs font-medium ${
                            booking.source === 'b2b'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300'
                              : 'bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300'
                          }`}>
                            {booking.source.toUpperCase()}
                          </span>
                        </td>
                        <td className="p-3 font-semibold">${booking.totalAmount}</td>
                        <td className="p-3">{booking.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">No bookings found</p>
            )}
          </div>
        )}

        {/* B2B BOOKINGS TAB */}
        {selectedTab === 'b2b' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">B2B Bookings</h2>
            {dashboard?.bookings && dashboard.bookings.filter(b => b.source === 'b2b').length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 bg-blue-50 dark:bg-blue-900/20">
                    <tr>
                      <th className="text-left p-3 font-semibold text-blue-700 dark:text-blue-300">Guest</th>
                      <th className="text-left p-3 font-semibold text-blue-700 dark:text-blue-300">Room</th>
                      <th className="text-left p-3 font-semibold text-blue-700 dark:text-blue-300">Check-in</th>
                      <th className="text-left p-3 font-semibold text-blue-700 dark:text-blue-300">Check-out</th>
                      <th className="text-left p-3 font-semibold text-blue-700 dark:text-blue-300">Amount</th>
                      <th className="text-left p-3 font-semibold text-blue-700 dark:text-blue-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.bookings.filter(b => b.source === 'b2b').map(booking => (
                      <tr key={booking.id} className="border-b border-slate-200 dark:border-slate-700">
                        <td className="p-3">{booking.guestName}</td>
                        <td className="p-3">{booking.roomType}</td>
                        <td className="p-3 text-xs">{booking.checkInDate}</td>
                        <td className="p-3 text-xs">{booking.checkOutDate}</td>
                        <td className="p-3 font-semibold">${booking.totalAmount}</td>
                        <td className="p-3">{booking.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">No B2B bookings found</p>
            )}
          </div>
        )}

        {/* B2C BOOKINGS TAB */}
        {selectedTab === 'b2c' && (
          <div className="bg-white dark:bg-slate-800 rounded-lg p-6 border border-slate-200 dark:border-slate-700">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-6">B2C Bookings</h2>
            {dashboard?.bookings && dashboard.bookings.filter(b => b.source === 'b2c').length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-slate-200 dark:border-slate-700 bg-purple-50 dark:bg-purple-900/20">
                    <tr>
                      <th className="text-left p-3 font-semibold text-purple-700 dark:text-purple-300">Guest</th>
                      <th className="text-left p-3 font-semibold text-purple-700 dark:text-purple-300">Room</th>
                      <th className="text-left p-3 font-semibold text-purple-700 dark:text-purple-300">Check-in</th>
                      <th className="text-left p-3 font-semibold text-purple-700 dark:text-purple-300">Check-out</th>
                      <th className="text-left p-3 font-semibold text-purple-700 dark:text-purple-300">Amount</th>
                      <th className="text-left p-3 font-semibold text-purple-700 dark:text-purple-300">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dashboard.bookings.filter(b => b.source === 'b2c').map(booking => (
                      <tr key={booking.id} className="border-b border-slate-200 dark:border-slate-700">
                        <td className="p-3">{booking.guestName}</td>
                        <td className="p-3">{booking.roomType}</td>
                        <td className="p-3 text-xs">{booking.checkInDate}</td>
                        <td className="p-3 text-xs">{booking.checkOutDate}</td>
                        <td className="p-3 font-semibold">${booking.totalAmount}</td>
                        <td className="p-3">{booking.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p className="text-slate-600 dark:text-slate-400">No B2C bookings found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
