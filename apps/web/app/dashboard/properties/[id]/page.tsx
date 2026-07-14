'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api/client';
import { Plus, MapPin, Phone, Mail, Globe, X, FileText, DollarSign, Image as ImageIcon } from 'lucide-react';

const TABS = [
  { id: 'info', label: 'Basic Info' },
  { id: 'amenities', label: 'Amenities' },
  { id: 'rooms', label: 'Rooms & Inventory' },
  { id: 'rates', label: 'Rates' },
  { id: 'media', label: 'Images & Media' },
  { id: 'policies', label: 'Policies' },
  { id: 'finance', label: 'Finance' },
];

const COUNTRIES = ['US', 'IN', 'GB', 'SG', 'AU', 'CA'];
const ROOM_TYPES = ['Single', 'Double', 'Suite', 'Deluxe', 'Presidential'];
const WEEKDAYS = [
  { label: 'Monday', value: 'MON', short: 'M' },
  { label: 'Tuesday', value: 'TUE', short: 'T' },
  { label: 'Wednesday', value: 'WED', short: 'W' },
  { label: 'Thursday', value: 'THU', short: 'T' },
  { label: 'Friday', value: 'FRI', short: 'F' },
  { label: 'Saturday', value: 'SAT', short: 'S' },
  { label: 'Sunday', value: 'SUN', short: 'S' },
];

const MASTER_AMENITIES = [
  'WiFi', 'Swimming Pool', 'Gym', 'Spa', 'Restaurant', 'Bar', 'Conference Rooms',
  'Room Service', '24/7 Front Desk', 'Parking', 'Airport Transfer', 'Concierge',
  'Business Center', 'Laundry Service', 'Air Conditioning', 'Hot Water', 'TV',
  'Mini Bar', 'Safe', 'Work Desk', 'Bathtub', 'Shower', 'Hairdryer', 'Toiletries'
];

const ROOM_AMENITIES = [
  'AC', 'Heater', 'WiFi', 'TV', 'Mini Bar', 'Safe', 'Work Desk', 'Bathtub',
  'Shower', 'Hair Dryer', 'Toiletries', 'Room Service', 'Coffee Maker'
];

interface RateConfig {
  id?: string;
  roomType: string;
  rateTypes: ('domestic' | 'international')[];
  startDate: string;
  endDate: string;
  selectedWeekdays: string[];
  rate: number;
  allocation: number;
  isBlackoutPeriod?: boolean;
}

interface RoomType {
  type: string;
  totalRooms: number;
  allocation: number;
  amenities?: string[];
  image?: string;
}

interface FinanceContact {
  name: string;
  phone: string;
  email: string;
  role: 'manager' | 'salesperson';
}

export default function PropertyPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState('info');
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  // Basic Info
  const [info, setInfo] = useState({
    name: '', description: '',
    phone: '', email: '', website: '',
    country: 'US', state: '', city: '', area: '',
    latitude: '', longitude: '',
  });

  const [amenities, setAmenities] = useState<string[]>([]);

  // Rooms
  const [rooms, setRooms] = useState<RoomType[]>([]);
  const [newRoom, setNewRoom] = useState<RoomType>({ type: 'Single', totalRooms: 0, allocation: 0, amenities: [], image: '' });

  // Rates
  const [rateConfigs, setRateConfigs] = useState<RateConfig[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date());
  const [newRateConfig, setNewRateConfig] = useState<RateConfig>({
    roomType: 'Single',
    rateTypes: ['domestic'],
    startDate: '',
    endDate: '',
    selectedWeekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
    rate: 0,
    allocation: 0,
    isBlackoutPeriod: false,
  });

  // Media
  const [mediaItems, setMediaItems] = useState<Array<{ id: string; url: string; type: string; label: string }>>([]);
  const [newMediaLabel, setNewMediaLabel] = useState('');

  // Policies
  const [policies, setPolicies] = useState({
    cancellationPolicy: '',
    otherPolicies: '',
  });

  // Finance
  const [finance, setFinance] = useState({
    financeManager: { name: '', phone: '', email: '' },
    salesperson: { name: '', phone: '', email: '' },
    bankDetails: {
      bankName: '',
      accountNumber: '',
      ifscCode: '',
      beneficiaryName: '',
    },
    moneyTransfer: '',
    contractDetails: {
      startDate: '',
      endDate: '',
      contractUrl: '',
    },
  });

  const { data: property, isLoading } = useQuery({
    queryKey: ['property', params.id],
    queryFn: async () => {
      const res = await apiClient.get(`/properties/${params.id}`);
      return res.data;
    },
    onSuccess: (data) => {
      if (data) {
        setInfo({
          name: data.name || '',
          description: data.description || '',
          phone: data.phone || '',
          email: data.email || '',
          website: data.website || '',
          country: data.country || 'US',
          state: data.state || '',
          city: data.city || '',
          area: data.area || '',
          latitude: data.latitude || '',
          longitude: data.longitude || '',
        });
        setAmenities(data.amenities || []);
        setRooms(data.rooms || []);
      }
    },
  });

  const handleSaveInfo = async () => {
    setIsSaving(true);
    try {
      await apiClient.put(`/properties/${params.id}`, info);
      setSaveMessage('Property info saved successfully!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (err) {
      setSaveMessage('Error saving property info');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleAmenity = (amenity: string) => {
    setAmenities(prev =>
      prev.includes(amenity) ? prev.filter(a => a !== amenity) : [...prev, amenity]
    );
  };

  const handleAddRoom = () => {
    if (newRoom.totalRooms > 0 && newRoom.allocation > 0) {
      setRooms([...rooms, newRoom]);
      setNewRoom({ type: 'Single', totalRooms: 0, allocation: 0, amenities: [], image: '' });
    }
  };

  const handleToggleRoomAmenity = (amenity: string, roomIndex: number) => {
    const updatedRooms = [...rooms];
    const roomAmenities = updatedRooms[roomIndex].amenities || [];
    updatedRooms[roomIndex].amenities = roomAmenities.includes(amenity)
      ? roomAmenities.filter(a => a !== amenity)
      : [...roomAmenities, amenity];
    setRooms(updatedRooms);
  };

  const handleDeleteRoom = (index: number) => {
    setRooms(rooms.filter((_, i) => i !== index));
  };

  const handleToggleWeekday = (weekday: string) => {
    setNewRateConfig(prev => ({
      ...prev,
      selectedWeekdays: prev.selectedWeekdays.includes(weekday)
        ? prev.selectedWeekdays.filter(d => d !== weekday)
        : [...prev.selectedWeekdays, weekday]
    }));
  };

  const handleAddRateConfig = () => {
    if (!newRateConfig.startDate || !newRateConfig.endDate || newRateConfig.selectedWeekdays.length === 0 || (!newRateConfig.rate && !newRateConfig.isBlackoutPeriod)) {
      setSaveMessage('Please fill in all rate configuration fields');
      return;
    }
    setRateConfigs([...rateConfigs, { ...newRateConfig, id: Math.random().toString() }]);
    setNewRateConfig({
      roomType: 'Single',
      rateTypes: ['domestic'],
      startDate: '',
      endDate: '',
      selectedWeekdays: ['MON', 'TUE', 'WED', 'THU', 'FRI'],
      rate: 0,
      allocation: 0,
      isBlackoutPeriod: false,
    });
    setSaveMessage('Rate configuration added!');
    setTimeout(() => setSaveMessage(''), 3000);
  };

  const handleDeleteRateConfig = (id: string | undefined) => {
    setRateConfigs(rateConfigs.filter(config => config.id !== id));
  };

  // Media Handlers
  const handleAddMedia = () => {
    if (newMediaLabel.trim()) {
      setMediaItems([...mediaItems, {
        id: Math.random().toString(),
        url: 'https://via.placeholder.com/400x300?text=' + encodeURIComponent(newMediaLabel),
        type: 'image',
        label: newMediaLabel
      }]);
      setNewMediaLabel('');
    }
  };

  const handleDeleteMedia = (id: string) => {
    setMediaItems(mediaItems.filter(item => item.id !== id));
  };

  // Calendar Helper Functions
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const getWeekdayLabel = (dateStr: string) => {
    const date = new Date(dateStr + 'T00:00:00');
    return WEEKDAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]?.value || '';
  };

  const isDateInRange = (dateStr: string, config: RateConfig) => {
    if (!dateStr || !config.startDate || !config.endDate) return false;
    const date = new Date(dateStr);
    const start = new Date(config.startDate);
    const end = new Date(config.endDate);
    return date >= start && date <= end && config.selectedWeekdays.includes(getWeekdayLabel(dateStr));
  };

  const daysInMonth = getDaysInMonth(selectedMonth);
  const firstDay = getFirstDayOfMonth(selectedMonth);
  const monthName = selectedMonth.toLocaleString('default', { month: 'long', year: 'numeric' });
  const calendarDays = Array.from({ length: firstDay }, () => null).concat(
    Array.from({ length: daysInMonth }, (_, i) => i + 1)
  );

  // Get minimum date for end date picker
  const minEndDate = newRateConfig.startDate || undefined;

  if (isLoading) return <div className="p-6 text-slate-600">Loading property details...</div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-3xl font-bold">{info.name || 'Property Details'}</h1>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 dark:border-slate-700">
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                tab === t.id
                  ? 'border-purple-600 text-purple-600'
                  : 'border-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="mt-6 rounded-lg border border-slate-200 bg-white p-6 dark:border-slate-700 dark:bg-slate-800">
        {/* BASIC INFO TAB */}
        {tab === 'info' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Property Name *</label>
                <input
                  type="text"
                  value={info.name}
                  onChange={(e) => setInfo({ ...info, name: e.target.value })}
                  className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  placeholder="Hotel name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  value={info.website}
                  onChange={(e) => setInfo({ ...info, website: e.target.value })}
                  className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  placeholder="https://..."
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Description</label>
              <textarea
                value={info.description}
                onChange={(e) => setInfo({ ...info, description: e.target.value })}
                className="w-full h-24 rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                placeholder="Property description..."
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-slate-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Phone</label>
                  <input
                    type="tel"
                    value={info.phone}
                    onChange={(e) => setInfo({ ...info, phone: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-slate-500" />
                <div className="flex-1">
                  <label className="block text-sm font-medium mb-2">Email</label>
                  <input
                    type="email"
                    value={info.email}
                    onChange={(e) => setInfo({ ...info, email: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="contact@hotel.com"
                  />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-200 dark:border-slate-700 pt-6">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <MapPin className="h-4 w-4" />
                Location Details
              </h3>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Country *</label>
                  <select
                    value={info.country}
                    onChange={(e) => setInfo({ ...info, country: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  >
                    {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">State *</label>
                  <input
                    type="text"
                    value={info.state}
                    onChange={(e) => setInfo({ ...info, state: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="State"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">City *</label>
                  <input
                    type="text"
                    value={info.city}
                    onChange={(e) => setInfo({ ...info, city: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="City"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Area/Region *</label>
                  <input
                    type="text"
                    value={info.area}
                    onChange={(e) => setInfo({ ...info, area: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="Area/Region"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mt-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Latitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={info.latitude}
                    onChange={(e) => setInfo({ ...info, latitude: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="e.g., 40.7128"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Longitude</label>
                  <input
                    type="number"
                    step="0.0001"
                    value={info.longitude}
                    onChange={(e) => setInfo({ ...info, longitude: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="e.g., -74.0060"
                  />
                </div>
              </div>
            </div>

            {saveMessage && (
              <div className={`p-3 rounded text-sm ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {saveMessage}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleSaveInfo}
                disabled={isSaving}
                className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700 disabled:opacity-50"
              >
                {isSaving ? 'Saving...' : 'Save Property Info'}
              </button>
            </div>
          </div>
        )}

        {/* AMENITIES TAB */}
        {tab === 'amenities' && (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">Select all amenities available at your property</p>
            <div className="grid grid-cols-3 gap-3">
              {MASTER_AMENITIES.map((amenity) => (
                <label
                  key={amenity}
                  className="flex items-center gap-2 p-3 border border-slate-200 rounded hover:bg-slate-50 dark:border-slate-700 dark:hover:bg-slate-700 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={amenities.includes(amenity)}
                    onChange={() => handleToggleAmenity(amenity)}
                    className="w-4 h-4"
                  />
                  <span className="text-sm">{amenity}</span>
                </label>
              ))}
            </div>
            <button
              onClick={handleSaveInfo}
              className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
            >
              Save Amenities
            </button>
          </div>
        )}

        {/* ROOMS & INVENTORY TAB */}
        {tab === 'rooms' && (
          <div className="space-y-6">
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4 bg-slate-50 dark:bg-slate-700/50">
              <h3 className="font-semibold mb-4">Add New Room Type</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Room Type</label>
                  <select
                    value={newRoom.type}
                    onChange={(e) => setNewRoom({ ...newRoom, type: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  >
                    {ROOM_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Total Rooms</label>
                  <input
                    type="number"
                    min="1"
                    value={newRoom.totalRooms}
                    onChange={(e) => setNewRoom({ ...newRoom, totalRooms: parseInt(e.target.value) || 0 })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="e.g., 50"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium mb-2">Room Amenities</label>
                <div className="grid grid-cols-4 gap-2">
                  {ROOM_AMENITIES.map(amenity => (
                    <label key={amenity} className="flex items-center gap-2 p-2 border border-slate-300 rounded cursor-pointer hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={(newRoom.amenities || []).includes(amenity)}
                        onChange={() => setNewRoom({
                          ...newRoom,
                          amenities: (newRoom.amenities || []).includes(amenity)
                            ? (newRoom.amenities || []).filter(a => a !== amenity)
                            : [...(newRoom.amenities || []), amenity]
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">{amenity}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                onClick={handleAddRoom}
                className="mt-4 flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                Add Room Type
              </button>
            </div>

            <div>
              <h3 className="font-semibold mb-4">Room Inventory</h3>
              <div className="space-y-3">
                {rooms.length === 0 ? (
                  <p className="text-slate-600 text-sm">No room types added yet</p>
                ) : (
                  rooms.map((room, idx) => (
                    <div key={idx} className="border border-slate-200 dark:border-slate-700 rounded p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{room.type}</h4>
                          <p className="text-sm text-slate-600">Total Rooms: {room.totalRooms}</p>
                        </div>
                        <button
                          onClick={() => handleDeleteRoom(idx)}
                          className="text-red-600 hover:text-red-700 text-sm font-medium"
                        >
                          Remove
                        </button>
                      </div>
                      {room.amenities && room.amenities.length > 0 && (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {room.amenities.map(amenity => (
                            <span key={amenity} className="bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-300 text-xs px-2 py-1 rounded">
                              {amenity}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}

        {/* RATES TAB - WITH DEPENDENT DATE PICKERS */}
        {tab === 'rates' && (
          <div className="space-y-6">
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4 bg-slate-50 dark:bg-slate-700/50">
              <h3 className="font-semibold mb-4">Add Rate Configuration</h3>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Room Type *</label>
                  <select
                    value={newRateConfig.roomType}
                    onChange={(e) => setNewRateConfig({ ...newRateConfig, roomType: e.target.value })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  >
                    {ROOM_TYPES.map(rt => <option key={rt} value={rt}>{rt}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Rate Type *</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 p-2 border border-slate-300 rounded cursor-pointer hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={newRateConfig.rateTypes.includes('domestic')}
                        onChange={() => setNewRateConfig({
                          ...newRateConfig,
                          rateTypes: newRateConfig.rateTypes.includes('domestic')
                            ? newRateConfig.rateTypes.filter(t => t !== 'domestic')
                            : [...newRateConfig.rateTypes, 'domestic']
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">Domestic Rate</span>
                    </label>
                    <label className="flex items-center gap-2 p-2 border border-slate-300 rounded cursor-pointer hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
                      <input
                        type="checkbox"
                        checked={newRateConfig.rateTypes.includes('international')}
                        onChange={() => setNewRateConfig({
                          ...newRateConfig,
                          rateTypes: newRateConfig.rateTypes.includes('international')
                            ? newRateConfig.rateTypes.filter(t => t !== 'international')
                            : [...newRateConfig.rateTypes, 'international']
                        })}
                        className="w-4 h-4"
                      />
                      <span className="text-sm">International Rate</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Dependent Date Range - End Date only available after Start Date */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Start Date *</label>
                  <input
                    type="date"
                    value={newRateConfig.startDate}
                    onChange={(e) => setNewRateConfig({ ...newRateConfig, startDate: e.target.value, endDate: '' })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">End Date * {newRateConfig.startDate && '(after ' + newRateConfig.startDate + ')'}</label>
                  <input
                    type="date"
                    value={newRateConfig.endDate}
                    onChange={(e) => setNewRateConfig({ ...newRateConfig, endDate: e.target.value })}
                    min={newRateConfig.startDate || undefined}
                    disabled={!newRateConfig.startDate}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  {!newRateConfig.startDate && (
                    <p className="text-xs text-slate-500 mt-1">Select start date first</p>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Select Applicable Weekdays *</label>
                <div className="grid grid-cols-7 gap-2">
                  {WEEKDAYS.map((day) => (
                    <button
                      key={day.value}
                      onClick={() => handleToggleWeekday(day.value)}
                      className={`p-2 rounded text-center text-sm font-medium transition ${
                        newRateConfig.selectedWeekdays.includes(day.value)
                          ? 'bg-purple-600 text-white'
                          : 'bg-slate-200 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                      }`}
                      title={day.label}
                    >
                      {day.short}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-4">
                <label className="flex items-center gap-2 p-3 border border-slate-300 rounded cursor-pointer hover:bg-slate-50 dark:border-slate-600 dark:hover:bg-slate-700">
                  <input
                    type="checkbox"
                    checked={newRateConfig.isBlackoutPeriod || false}
                    onChange={() => setNewRateConfig({
                      ...newRateConfig,
                      isBlackoutPeriod: !newRateConfig.isBlackoutPeriod,
                      rate: !newRateConfig.isBlackoutPeriod ? 0 : newRateConfig.rate,
                      allocation: !newRateConfig.isBlackoutPeriod ? 0 : newRateConfig.allocation,
                    })}
                    className="w-4 h-4"
                  />
                  <span className="font-medium">Blackout Period (No Rates Available)</span>
                </label>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Rate (per night) {!newRateConfig.isBlackoutPeriod && '*'}</label>
                  <input
                    type="number"
                    step="0.01"
                    value={newRateConfig.rate}
                    onChange={(e) => setNewRateConfig({ ...newRateConfig, rate: parseFloat(e.target.value) || 0 })}
                    disabled={newRateConfig.isBlackoutPeriod}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., 150.00"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Allocation (for sale) {!newRateConfig.isBlackoutPeriod && '*'}</label>
                  <input
                    type="number"
                    min="1"
                    value={newRateConfig.allocation}
                    onChange={(e) => setNewRateConfig({ ...newRateConfig, allocation: parseInt(e.target.value) || 0 })}
                    disabled={newRateConfig.isBlackoutPeriod}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="e.g., 30"
                  />
                </div>
              </div>

              <button
                onClick={handleAddRateConfig}
                className="flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
              >
                <Plus className="h-4 w-4" />
                Add Rate Configuration
              </button>
            </div>

            {/* Calendar View */}
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4">
              <div className="mb-4 flex items-center justify-between">
                <h3 className="font-semibold">{monthName}</h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() - 1))}
                    className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    ← Prev
                  </button>
                  <button
                    onClick={() => setSelectedMonth(new Date())}
                    className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => setSelectedMonth(new Date(selectedMonth.getFullYear(), selectedMonth.getMonth() + 1))}
                    className="rounded border border-slate-300 px-3 py-1 text-sm hover:bg-slate-100 dark:border-slate-600 dark:hover:bg-slate-700"
                  >
                    Next →
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-slate-700 rounded overflow-hidden">
                <div className="grid grid-cols-7 gap-0 border border-slate-200 dark:border-slate-600">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="p-2 text-center text-xs font-semibold bg-slate-100 dark:bg-slate-600 border-r border-b border-slate-200 dark:border-slate-600">
                      {day}
                    </div>
                  ))}
                  {calendarDays.map((day, idx) => {
                    const dateStr = day ? `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}` : '';
                    const applicableRates = rateConfigs.filter(config => isDateInRange(dateStr, config));

                    return (
                      <div
                        key={idx}
                        className={`p-2 min-h-20 border-r border-b border-slate-200 dark:border-slate-600 text-xs ${
                          day
                            ? applicableRates.length > 0
                              ? 'bg-blue-50 dark:bg-blue-900/20'
                              : 'bg-white dark:bg-slate-700'
                            : 'bg-slate-50 dark:bg-slate-800'
                        }`}
                      >
                        {day && (
                          <>
                            <p className="font-semibold text-slate-700 dark:text-slate-300">{day}</p>
                            {applicableRates.length > 0 && (
                              <div className="mt-1 space-y-1">
                                {applicableRates.map((rate) => (
                                  <div key={rate.id} className={`p-1 rounded text-xs font-semibold ${
                                    rate.isBlackoutPeriod
                                      ? 'bg-red-200 dark:bg-red-700 text-red-900 dark:text-red-100'
                                      : 'bg-purple-200 dark:bg-purple-700 text-purple-900 dark:text-purple-100'
                                  }`}>
                                    {rate.roomType}{rate.isBlackoutPeriod ? ' (Closed)' : ` (${rate.rateTypes.map(t => t === 'domestic' ? 'DOM' : 'INT').join('/')}): $${rate.rate}`}
                                  </div>
                                ))}
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Rate Configurations List */}
            {rateConfigs.length > 0 && (
              <div className="border border-slate-200 dark:border-slate-700 rounded p-4">
                <h3 className="font-semibold mb-4">Configured Rates</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-slate-200 dark:border-slate-700">
                      <tr>
                        <th className="text-left p-2">Room Type</th>
                        <th className="text-left p-2">Rate Types</th>
                        <th className="text-left p-2">Date Range</th>
                        <th className="text-left p-2">Weekdays</th>
                        <th className="text-left p-2">Status</th>
                        <th className="text-left p-2">Rate</th>
                        <th className="text-left p-2">Allocation</th>
                        <th className="text-left p-2">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rateConfigs.map((config) => (
                        <tr key={config.id} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700">
                          <td className="p-2 font-medium">{config.roomType}</td>
                          <td className="p-2">
                            <div className="flex flex-wrap gap-1">
                              {config.rateTypes.map(type => (
                                <span key={type} className="bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 px-2 py-1 rounded text-xs">
                                  {type === 'domestic' ? 'DOM' : 'INT'}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="p-2">{config.startDate} to {config.endDate}</td>
                          <td className="p-2">{config.selectedWeekdays.map(d => WEEKDAYS.find(w => w.value === d)?.short).join(', ')}</td>
                          <td className="p-2">
                            {config.isBlackoutPeriod ? (
                              <span className="bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs font-semibold">
                                Blackout
                              </span>
                            ) : (
                              <span className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs">
                                Active
                              </span>
                            )}
                          </td>
                          <td className="p-2 font-semibold">{config.isBlackoutPeriod ? '—' : `$${config.rate.toFixed(2)}`}</td>
                          <td className="p-2 font-semibold">{config.isBlackoutPeriod ? '—' : config.allocation}</td>
                          <td className="p-2">
                            <button
                              onClick={() => handleDeleteRateConfig(config.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <X className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* IMAGES & MEDIA TAB */}
        {tab === 'media' && (
          <div className="space-y-6">
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4 bg-slate-50 dark:bg-slate-700/50">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <ImageIcon className="h-4 w-4" />
                Upload Images
              </h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Image Label/Description *</label>
                  <input
                    type="text"
                    value={newMediaLabel}
                    onChange={(e) => setNewMediaLabel(e.target.value)}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="e.g., Hotel Lobby, Swimming Pool, Bedroom"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Upload Image File</label>
                  <input
                    type="file"
                    accept="image/*"
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  />
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG, WebP (Max 5MB)</p>
                </div>
                <button
                  onClick={handleAddMedia}
                  className="flex items-center gap-2 rounded bg-purple-600 px-4 py-2 text-white hover:bg-purple-700"
                >
                  <Plus className="h-4 w-4" />
                  Add Media
                </button>
              </div>
            </div>

            {/* Media Gallery */}
            <div>
              <h3 className="font-semibold mb-4">Media Gallery</h3>
              {mediaItems.length === 0 ? (
                <div className="text-center p-8 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded">
                  <ImageIcon className="h-8 w-8 text-slate-400 mx-auto mb-2" />
                  <p className="text-slate-600 dark:text-slate-400">No images uploaded yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4">
                  {mediaItems.map((item) => (
                    <div key={item.id} className="border border-slate-200 dark:border-slate-700 rounded overflow-hidden">
                      <img src={item.url} alt={item.label} className="w-full h-40 object-cover" />
                      <div className="p-3">
                        <p className="text-sm font-medium truncate">{item.label}</p>
                        <button
                          onClick={() => handleDeleteMedia(item.id)}
                          className="mt-2 w-full text-red-600 hover:text-red-700 text-sm font-medium py-1"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* POLICIES TAB */}
        {tab === 'policies' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium mb-2">Cancellation Policy *</label>
              <textarea
                value={policies.cancellationPolicy}
                onChange={(e) => setPolicies({ ...policies, cancellationPolicy: e.target.value })}
                className="w-full h-32 rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                placeholder="Describe your cancellation policy in detail..."
              />
              <p className="text-xs text-slate-500 mt-1">e.g., Free cancellation up to 48 hours before arrival. After 48 hours, 100% charge applies.</p>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Other Policies & Facilities</label>
              <textarea
                value={policies.otherPolicies}
                onChange={(e) => setPolicies({ ...policies, otherPolicies: e.target.value })}
                className="w-full h-32 rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                placeholder="Additional policies, facilities, special conditions, check-in/check-out times, house rules, etc..."
              />
            </div>

            <button
              onClick={() => {
                setSaveMessage('Policies saved successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
              }}
              className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
            >
              Save Policies
            </button>

            {saveMessage && (
              <div className={`p-3 rounded text-sm ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        )}

        {/* FINANCE TAB */}
        {tab === 'finance' && (
          <div className="space-y-6">
            {/* Finance Manager */}
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4">
              <h3 className="font-semibold mb-4">Finance Manager Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={finance.financeManager.name}
                    onChange={(e) => setFinance({ ...finance, financeManager: { ...finance.financeManager, name: e.target.value } })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="Manager name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={finance.financeManager.phone}
                    onChange={(e) => setFinance({ ...finance, financeManager: { ...finance.financeManager, phone: e.target.value } })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={finance.financeManager.email}
                    onChange={(e) => setFinance({ ...finance, financeManager: { ...finance.financeManager, email: e.target.value } })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="finance@hotel.com"
                  />
                </div>
              </div>
            </div>

            {/* Salesperson Contact */}
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4">
              <h3 className="font-semibold mb-4">Salesperson Contact Details</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Name *</label>
                  <input
                    type="text"
                    value={finance.salesperson.name}
                    onChange={(e) => setFinance({ ...finance, salesperson: { ...finance.salesperson, name: e.target.value } })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="Salesperson name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Phone *</label>
                  <input
                    type="tel"
                    value={finance.salesperson.phone}
                    onChange={(e) => setFinance({ ...finance, salesperson: { ...finance.salesperson, phone: e.target.value } })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="+1 (555) 000-0000"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Email *</label>
                  <input
                    type="email"
                    value={finance.salesperson.email}
                    onChange={(e) => setFinance({ ...finance, salesperson: { ...finance.salesperson, email: e.target.value } })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                    placeholder="sales@hotel.com"
                  />
                </div>
              </div>
            </div>

            {/* Banking Details */}
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4">
              <h3 className="font-semibold mb-4">Banking Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Bank Name *</label>
                    <input
                      type="text"
                      value={finance.bankDetails.bankName}
                      onChange={(e) => setFinance({ ...finance, bankDetails: { ...finance.bankDetails, bankName: e.target.value } })}
                      className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                      placeholder="e.g., State Bank of India"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Beneficiary Name *</label>
                    <input
                      type="text"
                      value={finance.bankDetails.beneficiaryName}
                      onChange={(e) => setFinance({ ...finance, bankDetails: { ...finance.bankDetails, beneficiaryName: e.target.value } })}
                      className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                      placeholder="Account holder name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">Account Number *</label>
                    <input
                      type="text"
                      value={finance.bankDetails.accountNumber}
                      onChange={(e) => setFinance({ ...finance, bankDetails: { ...finance.bankDetails, accountNumber: e.target.value } })}
                      className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                      placeholder="Account number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">IFSC Code *</label>
                    <input
                      type="text"
                      value={finance.bankDetails.ifscCode}
                      onChange={(e) => setFinance({ ...finance, bankDetails: { ...finance.bankDetails, ifscCode: e.target.value } })}
                      className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                      placeholder="e.g., SBIN0001234"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Money Transfer Details */}
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4">
              <h3 className="font-semibold mb-4">Money Transfer & Settlement</h3>
              <div>
                <label className="block text-sm font-medium mb-2">Settlement Method *</label>
                <textarea
                  value={finance.moneyTransfer}
                  onChange={(e) => setFinance({ ...finance, moneyTransfer: e.target.value })}
                  className="w-full h-24 rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  placeholder="Describe how money will be transferred (e.g., Weekly settlement, Immediate transfer on booking confirmation, etc.)"
                />
              </div>
            </div>

            {/* Contract Details */}
            <div className="border border-slate-200 dark:border-slate-700 rounded p-4">
              <h3 className="font-semibold mb-4">Contract Details</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Contract Start Date *</label>
                  <input
                    type="date"
                    value={finance.contractDetails.startDate}
                    onChange={(e) => setFinance({ ...finance, contractDetails: { ...finance.contractDetails, startDate: e.target.value } })}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contract End Date *</label>
                  <input
                    type="date"
                    value={finance.contractDetails.endDate}
                    onChange={(e) => setFinance({ ...finance, contractDetails: { ...finance.contractDetails, endDate: e.target.value } })}
                    min={finance.contractDetails.startDate || undefined}
                    disabled={!finance.contractDetails.startDate}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Contract Duration</label>
                  <input
                    type="text"
                    disabled
                    value={finance.contractDetails.startDate && finance.contractDetails.endDate
                      ? `${Math.floor((new Date(finance.contractDetails.endDate).getTime() - new Date(finance.contractDetails.startDate).getTime()) / (1000 * 60 * 60 * 24))} days`
                      : '-'}
                    className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700 bg-slate-100 dark:bg-slate-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Contract Document *</label>
                <input
                  type="file"
                  accept=".pdf,.doc,.docx"
                  className="w-full rounded border border-slate-300 px-3 py-2 dark:border-slate-600 dark:bg-slate-700"
                />
                <p className="text-xs text-slate-500 mt-1">PDF, DOC, DOCX (Max 10MB)</p>
              </div>
            </div>

            <button
              onClick={() => {
                setSaveMessage('Finance details saved successfully!');
                setTimeout(() => setSaveMessage(''), 3000);
              }}
              className="rounded bg-purple-600 px-6 py-2 text-white hover:bg-purple-700"
            >
              Save Finance Details
            </button>

            {saveMessage && (
              <div className={`p-3 rounded text-sm ${saveMessage.includes('Error') ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
                {saveMessage}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
