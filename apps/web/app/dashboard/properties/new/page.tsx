'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Upload, Plus, Trash2, Calendar, MapPin, Compass } from 'lucide-react';
import Link from 'next/link';

interface HotelFormData {
  hotelName: string;
  hotelType: string;
  country: string;
  city: string;
  address: string;
  zipCode: string;
  starRating: string;
  checkInTime: string;
  checkOutTime: string;
  latitude: number;
  longitude: number;
  availabilityStartDate: string;
  availabilityEndDate: string;
  amenities: string[];
  salesContact: { name: string; email: string; isdCode: string; phone: string };
  operationsContact: { name: string; email: string; isdCode: string; phone: string };
  financeContact: { name: string; email: string; isdCode: string; phone: string };
  contractFile: File | null;
  contractDate: string;
  contractExpiry: string;
  roomTypes: { id: string; type: string; totalRooms: number; description: string; availabilityStartDate: string; availabilityEndDate: string; daysOfWeek: string[] }[];
  rateCards: {
    id: string;
    roomTypeId: string;
    baseRate: number;
    mealPlan: string;
    privateInventoryMarkup: number;
    publicInventoryMarkup: number;
    seasonStart: string;
    seasonEnd: string;
    activatedAt: string;
    deactivatedAt: string | null;
  }[];
  cancellationPolicy: string;
  termsAndConditions: string;
  additionalPolicies: string;
}

const COUNTRIES_MASTER = [
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'EG', name: 'Egypt' },
  { code: 'QA', name: 'Qatar' },
  { code: 'KW', name: 'Kuwait' },
];

const CITIES_MASTER: { [key: string]: { code: string; name: string }[] } = {
  'AE': [{ code: 'DXB', name: 'Dubai' }, { code: 'AUH', name: 'Abu Dhabi' }],
  'SA': [{ code: 'RUH', name: 'Riyadh' }, { code: 'JED', name: 'Jeddah' }],
  'EG': [{ code: 'CAI', name: 'Cairo' }, { code: 'ALX', name: 'Alexandria' }],
  'QA': [{ code: 'DOH', name: 'Doha' }],
  'KW': [{ code: 'KWT', name: 'Kuwait City' }],
};

const ISD_CODES = [
  { code: '+971', country: 'UAE' },
  { code: '+966', country: 'Saudi Arabia' },
  { code: '+20', country: 'Egypt' },
  { code: '+974', country: 'Qatar' },
  { code: '+965', country: 'Kuwait' },
];

const AMENITIES = ['WiFi', 'Pool', 'Gym', 'Restaurant', 'Spa', 'Business Center', 'Parking', 'Conference Room', 'Room Service', 'Concierge', 'Pet Friendly'];
const MEAL_PLANS = ['Room Only', 'Breakfast Included', 'Half Board', 'Full Board'];
const ROOM_TYPES_MASTER = [
  { id: '1', label: 'Standard Room' },
  { id: '2', label: 'Deluxe Room' },
  { id: '3', label: 'Suite' },
  { id: '4', label: 'Penthouse' },
];

const ROOM_COLORS: { [key: string]: string } = {
  'Standard Room': '#3B82F6',
  'Deluxe Room': '#8B5CF6',
  'Suite': '#EC4899',
  'Penthouse': '#F59E0B',
};

export default function HotelNewPage() {
  const [currentTab, setCurrentTab] = useState(0);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [geolocating, setGeolocating] = useState(false);
  const [showMap, setShowMap] = useState(false);
  const [form, setForm] = useState<HotelFormData>({
    hotelName: '', hotelType: 'Luxury', country: '', city: '', address: '', zipCode: '', starRating: '5',
    checkInTime: '14:00', checkOutTime: '11:00', latitude: 0, longitude: 0, availabilityStartDate: '', availabilityEndDate: '', amenities: [],
    salesContact: { name: '', email: '', isdCode: '+971', phone: '' },
    operationsContact: { name: '', email: '', isdCode: '+971', phone: '' },
    financeContact: { name: '', email: '', isdCode: '+971', phone: '' },
    contractFile: null, contractDate: '', contractExpiry: '',
    roomTypes: [], rateCards: [],
    cancellationPolicy: '', termsAndConditions: '', additionalPolicies: '',
  });

  const tabs = ['Basic Info', 'Contacts', 'Contract', 'Rooms', 'Rates', 'Policies'];
  const citiesForSelectedCountry = form.country ? CITIES_MASTER[form.country] || [] : [];

  const handleGeolocation = async () => {
    setGeolocating(true);
    try {
      const position = await new Promise<GeolocationCoordinates>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(pos => resolve(pos.coords), reject);
      });
      setForm(prev => ({ ...prev, latitude: position.latitude, longitude: position.longitude }));
      setShowMap(true);
    } catch (error) {
      alert('Unable to get location. Please enable geolocation and try again.');
    } finally {
      setGeolocating(false);
    }
  };

  const isDateRangeValid = () => {
    if (!form.availabilityStartDate || !form.availabilityEndDate) return true;
    return new Date(form.availabilityStartDate) <= new Date(form.availabilityEndDate);
  };

  const getDateRangeError = () => {
    if (!form.availabilityStartDate || !form.availabilityEndDate) return '';
    if (new Date(form.availabilityStartDate) > new Date(form.availabilityEndDate)) {
      return 'End date must be after or equal to start date';
    }
    return '';
  };

  const isRoomDateRangeValid = (room: any) => {
    if (!room.availabilityStartDate || !room.availabilityEndDate) return true;
    return new Date(room.availabilityStartDate) <= new Date(room.availabilityEndDate);
  };

  const getRoomDateRangeError = (room: any) => {
    if (!room.availabilityStartDate || !room.availabilityEndDate) return '';
    if (new Date(room.availabilityStartDate) > new Date(room.availabilityEndDate)) {
      return 'End date must be after or equal to start date';
    }
    return '';
  };

  const checkRoomDateRangeDuplication = (roomId: string) => {
    const currentRoom = form.roomTypes.find(r => r.id === roomId);
    if (!currentRoom || !currentRoom.availabilityStartDate || !currentRoom.availabilityEndDate) return false;

    const currentStart = new Date(currentRoom.availabilityStartDate);
    const currentEnd = new Date(currentRoom.availabilityEndDate);
    const currentDays = (currentRoom.daysOfWeek || []).length === 0 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : currentRoom.daysOfWeek;

    return form.roomTypes.some(room => {
      if (room.id === roomId || !room.availabilityStartDate || !room.availabilityEndDate) return false;
      const otherStart = new Date(room.availabilityStartDate);
      const otherEnd = new Date(room.availabilityEndDate);
      const otherDays = (room.daysOfWeek || []).length === 0 ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] : room.daysOfWeek;
      const daysOverlap = currentDays.some(day => otherDays.includes(day));
      const datesOverlap = !(currentEnd < otherStart || currentStart > otherEnd);
      return datesOverlap && daysOverlap;
    });
  };

  const toggleRoomDayOfWeek = (roomId: string, day: string) => {
    setForm({
      ...form,
      roomTypes: form.roomTypes.map(room =>
        room.id === roomId
          ? { ...room, daysOfWeek: room.daysOfWeek.includes(day) ? room.daysOfWeek.filter(d => d !== day) : [...room.daysOfWeek, day] }
          : room
      ),
    });
  };

  const checkRateCardDateOverlap = (rateCardId: string, roomTypeId: string, seasonStart: string, seasonEnd: string) => {
    if (!seasonStart || !seasonEnd) return false;
    const currentStart = new Date(seasonStart);
    const currentEnd = new Date(seasonEnd);

    return form.rateCards.some(rate => {
      if (rate.id === rateCardId || rate.roomTypeId !== roomTypeId || !rate.seasonStart || !rate.seasonEnd) return false;
      const otherStart = new Date(rate.seasonStart);
      const otherEnd = new Date(rate.seasonEnd);
      return !(currentEnd < otherStart || currentStart > otherEnd);
    });
  };

  const toggleAmenity = (amenity: string) => {
    setForm({ ...form, amenities: form.amenities.includes(amenity) ? form.amenities.filter(a => a !== amenity) : [...form.amenities, amenity] });
  };

  const addRoomType = () => {
    setForm({ ...form, roomTypes: [...form.roomTypes, { id: Date.now().toString(), type: '', totalRooms: 0, description: '', availabilityStartDate: '', availabilityEndDate: '', daysOfWeek: [] }] });
  };

  const updateRoomType = (id: string, field: string, value: string | number) => {
    setForm({ ...form, roomTypes: form.roomTypes.map(rt => rt.id === id ? { ...rt, [field]: value } : rt) });
  };

  const deleteRoomType = (id: string) => {
    setForm({ ...form, roomTypes: form.roomTypes.filter(rt => rt.id !== id) });
  };

  const addRateCard = () => {
    const now = new Date().toISOString();
    setForm({ ...form, rateCards: [...form.rateCards, { id: Date.now().toString(), roomTypeId: '', baseRate: 0, mealPlan: 'Room Only', privateInventoryMarkup: 0, publicInventoryMarkup: 0, seasonStart: '', seasonEnd: '', activatedAt: now, deactivatedAt: null }] });
  };

  const updateRateCard = (id: string, field: string, value: string | number) => {
    setForm({ ...form, rateCards: form.rateCards.map(rc => rc.id === id ? { ...rc, [field]: value } : rc) });
  };

  const deleteRateCard = (id: string) => {
    setForm({ ...form, rateCards: form.rateCards.filter(rc => rc.id !== id) });
  };

  const handleSubmit = () => {
    if (!isDateRangeValid()) {
      alert('❌ Please ensure the availability end date is after or equal to the start date.');
      return;
    }
    if (!form.availabilityStartDate || !form.availabilityEndDate) {
      alert('❌ Please fill in the availability period (both start and end dates).');
      return;
    }
    const invalidRooms = form.roomTypes.filter(room => !isRoomDateRangeValid(room));
    if (invalidRooms.length > 0) {
      alert('❌ Please ensure all room types have valid availability periods.');
      return;
    }
    const incompleteRooms = form.roomTypes.filter(room => !room.availabilityStartDate || !room.availabilityEndDate);
    if (incompleteRooms.length > 0) {
      alert('❌ Please fill in availability dates for all room types.');
      return;
    }
    const duplicateRooms = form.roomTypes.filter(room => checkRoomDateRangeDuplication(room.id));
    if (duplicateRooms.length > 0) {
      alert('❌ Room types have overlapping date ranges. Please adjust the dates to avoid conflicts.');
      return;
    }
    console.log('Hotel created:', form);
    alert('✓ Hotel created successfully!');
  };

  const ContactSection = ({ title, icon, contact, color, updateContact }: any) => (
    <div className={`p-6 bg-${color}-50 rounded-lg border border-${color}-200`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <span className={`bg-${color}-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs`}>✓</span>
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-4">
        <input type="text" placeholder="Name" value={contact.name} onChange={(e) => updateContact('name', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <input type="email" placeholder="Email" value={contact.email} onChange={(e) => updateContact('email', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        <select value={contact.isdCode} onChange={(e) => updateContact('isdCode', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
          {ISD_CODES.map(c => <option key={c.code} value={c.code}>{c.code} ({c.country})</option>)}
        </select>
        <div className="flex gap-2">
          <span className="px-3 py-2 border border-gray-300 rounded-lg bg-gray-50 text-sm font-medium">{contact.isdCode}</span>
          <input type="tel" placeholder="Phone" value={contact.phone} onChange={(e) => updateContact('phone', e.target.value)} className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
      </div>
    </div>
  );

  return (
    <div>
      <div className="mb-8">
        <Link href="/dashboard/properties" className="text-blue-600 hover:text-blue-700 text-sm font-medium mb-4 inline-block">← Back to Properties</Link>
        <h1 className="text-3xl font-bold text-gray-900">Create New Hotel</h1>
        <p className="text-gray-600 mt-2">Complete all sections to add your hotel</p>
      </div>

      <div className="mb-8 bg-white rounded-lg shadow">
        <div className="flex border-b overflow-x-auto">
          {tabs.map((tab, idx) => (
            <button key={idx} onClick={() => setCurrentTab(idx)} className={`flex-1 px-4 py-4 text-center font-medium transition whitespace-nowrap ${currentTab === idx ? 'border-b-2 border-blue-600 text-blue-600' : 'text-gray-600 hover:text-gray-900'}`}>
              <div className="flex items-center justify-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">{idx + 1}</span>
                <span className="hidden sm:inline">{tab}</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-8">
        {/* TAB 1 */}
        {currentTab === 0 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Basic Information & Hotel Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <input type="text" placeholder="Hotel Name *" value={form.hotelName} onChange={(e) => setForm({ ...form, hotelName: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.hotelType} onChange={(e) => setForm({ ...form, hotelType: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Luxury</option><option>Standard</option><option>Budget</option><option>Resort</option>
              </select>
              <select value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value, city: '' })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50">
                <option value="">Select Country *</option>
                {COUNTRIES_MASTER.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <select value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} disabled={!form.country} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50 disabled:bg-gray-100">
                <option value="">Select City *</option>
                {citiesForSelectedCountry.map(c => <option key={c.code} value={c.code}>{c.name}</option>)}
              </select>
              <input type="text" placeholder="Address *" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} className="col-span-2 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="text" placeholder="Zip Code" value={form.zipCode} onChange={(e) => setForm({ ...form, zipCode: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <select value={form.starRating} onChange={(e) => setForm({ ...form, starRating: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>3 Stars</option><option>4 Stars</option><option>5 Stars</option>
              </select>
              <input type="time" value={form.checkInTime} onChange={(e) => setForm({ ...form, checkInTime: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="time" value={form.checkOutTime} onChange={(e) => setForm({ ...form, checkOutTime: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="bg-blue-50 p-6 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-4">
                <MapPin className="w-5 h-5 text-blue-600" />
                <h3 className="text-lg font-semibold text-gray-900">Location Preview</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <input type="number" placeholder="Latitude" value={form.latitude || ''} onChange={(e) => setForm({ ...form, latitude: parseFloat(e.target.value) || 0 })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="number" placeholder="Longitude" value={form.longitude || ''} onChange={(e) => setForm({ ...form, longitude: parseFloat(e.target.value) || 0 })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <button onClick={handleGeolocation} disabled={geolocating} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-4">
                <Compass className="w-5 h-5" />
                {geolocating ? 'Getting Location...' : 'Get Current Location'}
              </button>
              {form.latitude !== 0 && form.longitude !== 0 && (
                <div className="space-y-2">
                  <button onClick={() => setShowMap(!showMap)} className="w-full px-4 py-2 text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50">
                    {showMap ? '📍 Hide Map' : '📍 Show Map'}
                  </button>
                  {showMap && (
                    <iframe width="100%" height="300" frameBorder="0" src={`https://maps.google.com/maps?q=${form.latitude},${form.longitude}&z=15&output=embed`} className="rounded-lg border border-blue-200"></iframe>
                  )}
                  <p className="text-sm text-gray-700 pt-2">📍 Coordinates: {form.latitude.toFixed(4)}, {form.longitude.toFixed(4)}</p>
                </div>
              )}
            </div>
            <div className={`p-6 rounded-lg border-2 ${isDateRangeValid() ? 'border-green-300 bg-green-50' : 'border-red-300 bg-red-50'}`}>
              <label className="block text-sm font-medium text-gray-900 mb-4">Availability Period *</label>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <input type="date" value={form.availabilityStartDate} onChange={(e) => setForm({ ...form, availabilityStartDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Start Date" />
                  <p className="text-xs text-gray-600 mt-1">From Date</p>
                </div>
                <div>
                  <input type="date" value={form.availabilityEndDate} onChange={(e) => setForm({ ...form, availabilityEndDate: e.target.value })} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="End Date" />
                  <p className="text-xs text-gray-600 mt-1">To Date</p>
                </div>
              </div>
              {getDateRangeError() && (
                <p className="text-sm text-red-700 font-medium mt-3">❌ {getDateRangeError()}</p>
              )}
              {form.availabilityStartDate && form.availabilityEndDate && isDateRangeValid() && (
                <p className="text-sm text-green-700 font-medium mt-3">✓ Valid availability period</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">Amenities</label>
              <div className="grid grid-cols-3 gap-3">
                {AMENITIES.map(a => (
                  <label key={a} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-50 rounded">
                    <input type="checkbox" checked={form.amenities.includes(a)} onChange={() => toggleAmenity(a)} className="w-4 h-4 rounded" />
                    <span className="text-sm text-gray-700">{a}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 2 */}
        {currentTab === 1 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contact Information</h2>
            <ContactSection title="Sales Contact" icon="💼" color="blue" contact={form.salesContact} updateContact={(f: string, v: string) => setForm({ ...form, salesContact: { ...form.salesContact, [f]: v } })} />
            <ContactSection title="Operations Contact" icon="⚙️" color="green" contact={form.operationsContact} updateContact={(f: string, v: string) => setForm({ ...form, operationsContact: { ...form.operationsContact, [f]: v } })} />
            <ContactSection title="Finance Contact" icon="💰" color="purple" contact={form.financeContact} updateContact={(f: string, v: string) => setForm({ ...form, financeContact: { ...form.financeContact, [f]: v } })} />
          </div>
        )}

        {/* TAB 3 */}
        {currentTab === 2 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Contract Details</h2>
            <div className="grid grid-cols-2 gap-6">
              <input type="date" value={form.contractDate} onChange={(e) => setForm({ ...form, contractDate: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
              <input type="date" value={form.contractExpiry} onChange={(e) => setForm({ ...form, contractExpiry: e.target.value })} className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-blue-500 hover:bg-blue-50 transition">
              <Upload className="w-8 h-8 mx-auto text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">Drag and drop your contract (PDF, DOC, DOCX)</p>
              <input type="file" accept=".pdf,.doc,.docx" onChange={(e) => setForm({ ...form, contractFile: e.target.files?.[0] || null })} className="hidden" id="contract-file" />
              <label htmlFor="contract-file" className="cursor-pointer">{form.contractFile && <p className="mt-2 text-sm text-green-600 font-medium">✓ {form.contractFile.name}</p>}</label>
            </div>
          </div>
        )}

        {/* TAB 4 */}
        {currentTab === 3 && (
          <div className="space-y-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Room Types & Allocation</h2>
              <button onClick={addRoomType} className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"><Plus className="w-5 h-5" />Add Room Type</button>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">Room types loaded from Master Data</div>
            {form.roomTypes.length === 0 ? <div className="text-center py-8 text-gray-500">No rooms yet. Click "Add Room Type"</div> : form.roomTypes.map((room, idx) => (
              <div key={room.id} className="p-6 border border-gray-200 rounded-lg space-y-4">
                <div className="flex justify-between mb-4"><h3 className="text-lg font-semibold">Room Type {idx + 1}</h3><button onClick={() => deleteRoomType(room.id)} className="text-red-600"><Trash2 className="w-5 h-5" /></button></div>
                <div className="grid grid-cols-3 gap-4">
                  <select value={room.type} onChange={(e) => updateRoomType(room.id, 'type', e.target.value)} className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-blue-50">
                    <option value="">Select Room Type</option>
                    {ROOM_TYPES_MASTER.map(rt => <option key={rt.id} value={rt.label}>{rt.label}</option>)}
                  </select>
                  <input type="number" min="1" value={room.totalRooms} onChange={(e) => updateRoomType(room.id, 'totalRooms', parseInt(e.target.value))} placeholder="Total Rooms" className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  <div className="px-3 py-2 border border-gray-300 rounded-lg bg-green-50 text-green-700 font-medium">Active</div>
                </div>
                <textarea value={room.description} onChange={(e) => updateRoomType(room.id, 'description', e.target.value)} placeholder="Description..." rows={2} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className={`p-4 rounded-lg border-2 ${checkRoomDateRangeDuplication(room.id) ? 'border-red-300 bg-red-50' : isRoomDateRangeValid(room) ? 'border-green-300 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
                  <label className="block text-sm font-medium text-gray-900 mb-3">Availability Period *</label>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <input type="date" value={room.availabilityStartDate} onChange={(e) => updateRoomType(room.id, 'availabilityStartDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <p className="text-xs text-gray-600 mt-1">From Date</p>
                    </div>
                    <div>
                      <input type="date" value={room.availabilityEndDate} onChange={(e) => updateRoomType(room.id, 'availabilityEndDate', e.target.value)} className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <p className="text-xs text-gray-600 mt-1">To Date</p>
                    </div>
                  </div>
                  <label className="block text-sm font-medium text-gray-900 mb-2">Days of Week (Leave empty for all days)</label>
                  <div className="grid grid-cols-4 gap-2 mb-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer p-2 hover:bg-gray-100 rounded">
                        <input type="checkbox" checked={(room.daysOfWeek || []).includes(day)} onChange={() => toggleRoomDayOfWeek(room.id, day)} className="w-4 h-4 rounded" />
                        <span className="text-xs text-gray-700">{day}</span>
                      </label>
                    ))}
                  </div>
                  {checkRoomDateRangeDuplication(room.id) && (
                    <p className="text-sm text-red-700 font-medium mt-3">⚠️ Date range overlaps with another room type</p>
                  )}
                  {getRoomDateRangeError(room) && (
                    <p className="text-sm text-red-700 font-medium mt-3">❌ {getRoomDateRangeError(room)}</p>
                  )}
                  {room.availabilityStartDate && room.availabilityEndDate && isRoomDateRangeValid(room) && !checkRoomDateRangeDuplication(room.id) && (
                    <p className="text-sm text-green-700 font-medium mt-3">✓ Valid availability period</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 5 - Rate Cards */}
        {currentTab === 4 && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-gray-900">Rate Cards & Pricing Calendar</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Select Room Type *</label>
                <select onChange={(e) => {
                  if (e.target.value) {
                    const selectedRoomTypeId = e.target.value;
                    const existingRatesForRoom = form.rateCards.filter(r => r.roomTypeId === selectedRoomTypeId);
                    if (existingRatesForRoom.length > 0) {
                      const roomTypeName = form.roomTypes.find(rt => rt.id === selectedRoomTypeId)?.type || 'Unknown';
                      alert(`${roomTypeName} already has rates. Add another season?`);
                    }
                    const newRateCards = MEAL_PLANS.map(mealPlan => ({
                      id: Date.now().toString() + Math.random(),
                      roomTypeId: selectedRoomTypeId,
                      baseRate: 0,
                      mealPlan,
                      privateInventoryMarkup: 0,
                      b2cMarkup: 0,
                      publicMarkup: 0,
                      seasonStart: '',
                      seasonEnd: '',
                      activatedAt: new Date().toISOString(),
                      deactivatedAt: null
                    }));
                    setForm({ ...form, rateCards: [...form.rateCards, ...newRateCards] });
                    e.target.value = '';
                  }
                }} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">-- Select Room Type --</option>
                  {form.roomTypes.map(rt => <option key={rt.id} value={rt.id}>{rt.type}</option>)}
                </select>
              </div>
              <div className="text-sm text-gray-600 italic">📅 Select a room type from dropdown to add rates for different seasons</div>
            </div>

            {form.rateCards.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Rate Calendar</h3>
                  <div className="flex gap-2">
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="px-4 py-2 font-medium text-gray-700">{calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                    <button onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1))} className="p-2 hover:bg-gray-100 rounded"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                </div>

                <div className="grid grid-cols-7 gap-1 mb-4">
                  {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                    <div key={day} className="text-center font-semibold text-gray-600 py-2">{day}</div>
                  ))}
                </div>

                {form.rateCards.some(r => !r.seasonStart || !r.seasonEnd) && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
                    <p className="text-sm text-yellow-800">📅 <strong>Tip:</strong> Set Season Start and Season End dates below to display rates on the calendar.</p>
                  </div>
                )}

                <div className="grid grid-cols-7 gap-1">
                  {(() => {
                    const year = calendarMonth.getFullYear();
                    const month = calendarMonth.getMonth();
                    const firstDay = new Date(year, month, 1);
                    const lastDay = new Date(year, month + 1, 0);
                    const daysInMonth = lastDay.getDate();
                    const startingDayOfWeek = firstDay.getDay();
                    const days = [];

                    for (let i = 0; i < startingDayOfWeek; i++) {
                      days.push(<div key={`empty-${i}`} className="bg-gray-50 p-2 min-h-20"></div>);
                    }

                    for (let day = 1; day <= daysInMonth; day++) {
                      const currentDate = new Date(year, month, day);
                      const ratesForDay = form.rateCards.filter(rate => {
                        if (!rate.seasonStart || !rate.seasonEnd) return false;
                        const start = new Date(rate.seasonStart);
                        const end = new Date(rate.seasonEnd);
                        const startTime = new Date(rate.seasonStart).getTime();
                        const endTime = new Date(rate.seasonEnd).getTime();
                        const currentTime = currentDate.getTime();
                        return currentTime >= startTime && currentTime <= endTime;
                      });

                      days.push(
                        <div key={day} className="border border-gray-200 rounded p-2 min-h-20 bg-white hover:bg-gray-50">
                          <div className="text-sm font-semibold text-gray-900 mb-1">{day}</div>
                          <div className="space-y-1">
                            {ratesForDay.map((rate, idx) => {
                              const roomType = form.roomTypes.find(rt => rt.id === rate.roomTypeId)?.type || 'Unknown';
                              const activatedDate = new Date(rate.activatedAt).toLocaleDateString();
                              const deactivatedDate = rate.deactivatedAt ? new Date(rate.deactivatedAt).toLocaleDateString() : 'Active';
                              return (
                                <div key={idx} className="text-xs rounded px-1.5 py-1 text-white truncate" style={{ backgroundColor: ROOM_COLORS[roomType] || '#6B7280' }} title={`${roomType}\n${rate.mealPlan}\n$${rate.baseRate}\n\nActivated: ${activatedDate}\nStatus: ${deactivatedDate}`}>
                                  ${rate.baseRate}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    }
                    return days;
                  })()}
                </div>

                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  {Object.entries(ROOM_COLORS).map(([roomType, color]) => (
                    <div key={roomType} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: color }}></div>
                      <span className="text-sm text-gray-700">{roomType}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {form.rateCards.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Rate History & Timeline</h3>
                <div className="space-y-3">
                  {[...form.rateCards].sort((a, b) => new Date(b.activatedAt).getTime() - new Date(a.activatedAt).getTime()).map((rate, idx) => {
                    const roomType = form.roomTypes.find(rt => rt.id === rate.roomTypeId)?.type || 'Unknown';
                    const activatedDate = new Date(rate.activatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                    const activatedTime = new Date(rate.activatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
                    const deactivatedDate = rate.deactivatedAt ? new Date(rate.deactivatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : null;
                    const deactivatedTime = rate.deactivatedAt ? new Date(rate.deactivatedAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }) : null;
                    const isActive = !rate.deactivatedAt;

                    return (
                      <div key={rate.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        <div className="flex-shrink-0">
                          <div className="flex items-center justify-center h-10 w-10 rounded-full" style={{ backgroundColor: ROOM_COLORS[roomType] || '#6B7280', opacity: isActive ? 1 : 0.5 }}>
                            <span className="text-white text-sm font-bold">${rate.baseRate}</span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-gray-900">{roomType} - {rate.mealPlan}</p>
                          <p className="text-xs text-gray-600 mt-1">
                            <span className="font-medium">Activated:</span> {activatedDate} at {activatedTime}
                          </p>
                          {deactivatedDate && (
                            <p className="text-xs text-gray-600">
                              <span className="font-medium">Deactivated:</span> {deactivatedDate} at {deactivatedTime}
                            </p>
                          )}
                          {isActive && (
                            <p className="text-xs text-green-600 font-medium mt-1">✓ Currently Active</p>
                          )}
                        </div>
                        <div className="flex-shrink-0 text-right">
                          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${isActive ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'}`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {form.roomTypes.length === 0 ? <div className="text-center py-8 bg-gray-50 rounded-lg">Add room types first in Tab 4</div> : form.rateCards.length === 0 ? <div className="text-center py-8 text-gray-500">No rate cards yet</div> : (() => {
              const groupedByRoomType = form.rateCards.reduce((acc: any, rate) => {
                if (!acc[rate.roomTypeId]) acc[rate.roomTypeId] = [];
                acc[rate.roomTypeId].push(rate);
                return acc;
              }, {});

              return Object.entries(groupedByRoomType).map(([roomTypeId, rates]: any, idx) => {
                const roomType = form.roomTypes.find(rt => rt.id === roomTypeId);
                const firstRate = rates[0];
                const hasDateOverlap = firstRate && checkRateCardDateOverlap(firstRate.id, roomTypeId, firstRate.seasonStart, firstRate.seasonEnd);
                return (
                  <div key={roomTypeId} className={`p-6 rounded-lg space-y-4 ${hasDateOverlap ? 'border-2 border-red-400 bg-red-50' : 'border-2 border-blue-300 bg-blue-50'}`}>
                    <div className="flex justify-between items-start mb-6">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900">{roomType?.type || 'Unknown Room'}</h3>
                        <p className="text-sm text-gray-600 mt-1">Rate card for all meal types</p>
                      </div>
                      <button onClick={() => {
                        setForm({ ...form, rateCards: form.rateCards.filter(r => r.roomTypeId !== roomTypeId) });
                      }} className="text-red-600 hover:text-red-700"><Trash2 className="w-5 h-5" /></button>
                    </div>

                    {hasDateOverlap && (
                      <div className="p-3 bg-red-100 border border-red-400 rounded-lg">
                        <p className="text-sm text-red-700 font-medium">⚠️ Date range overlaps with another rate card for this room type. Please adjust the dates to avoid conflicts.</p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4 p-4 bg-blue-100 rounded-lg">
                      <div><label className="block text-sm font-medium mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" />Season Start</label><input type="date" value={firstRate.seasonStart} onChange={(e) => {
                        setForm({ ...form, rateCards: form.rateCards.map(r => r.roomTypeId === roomTypeId ? { ...r, seasonStart: e.target.value } : r) });
                      }} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                      <div><label className="block text-sm font-medium mb-2 flex items-center gap-2"><Calendar className="w-4 h-4" />Season End</label><input type="date" value={firstRate.seasonEnd} onChange={(e) => {
                        setForm({ ...form, rateCards: form.rateCards.map(r => r.roomTypeId === roomTypeId ? { ...r, seasonEnd: e.target.value } : r) });
                      }} className="w-full px-3 py-2 border border-gray-300 rounded-lg" /></div>
                    </div>

                    <div className="overflow-x-auto border border-gray-300 rounded-lg">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gray-100 border-b border-gray-300">
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Meal Type</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-900">Base Rate ($)</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-blue-900">B2B Markup (%)</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-purple-900">B2C Markup (%)</th>
                            <th className="px-4 py-3 text-left text-sm font-semibold text-red-900">Public Markup (%)</th>
                          </tr>
                        </thead>
                        <tbody>
                          {MEAL_PLANS.map((mealPlan, idx) => {
                            const rateForMeal = rates.find((r: any) => r.mealPlan === mealPlan);
                            return (
                              <tr key={mealPlan} className={`border-b border-gray-300 ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'} hover:bg-blue-50`}>
                                <td className="px-4 py-3 text-sm font-medium text-gray-900">{mealPlan}</td>
                                <td className="px-4 py-3">
                                  <input type="number" min="0" step="0.01" value={rateForMeal ? (isNaN(rateForMeal.baseRate) ? '' : rateForMeal.baseRate) : ''} onChange={(e) => {
                                    if (rateForMeal) {
                                      setForm({ ...form, rateCards: form.rateCards.map(r => r.id === rateForMeal.id ? { ...r, baseRate: e.target.value ? parseFloat(e.target.value) : 0 } : r) });
                                    }
                                  }} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                </td>
                                <td className="px-4 py-3">
                                  <input type="number" min="0" step="0.01" value={rateForMeal ? (isNaN(rateForMeal.privateInventoryMarkup) ? '' : rateForMeal.privateInventoryMarkup) : ''} onChange={(e) => {
                                    if (rateForMeal) {
                                      setForm({ ...form, rateCards: form.rateCards.map(r => r.id === rateForMeal.id ? { ...r, privateInventoryMarkup: e.target.value ? parseFloat(e.target.value) : 0 } : r) });
                                    }
                                  }} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                </td>
                                <td className="px-4 py-3">
                                  <input type="number" min="0" step="0.01" value={rateForMeal ? (isNaN(rateForMeal.b2cMarkup ?? 0) ? '' : rateForMeal.b2cMarkup ?? 0) : ''} onChange={(e) => {
                                    if (rateForMeal) {
                                      setForm({ ...form, rateCards: form.rateCards.map(r => r.id === rateForMeal.id ? { ...r, b2cMarkup: e.target.value ? parseFloat(e.target.value) : 0 } : r) });
                                    }
                                  }} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-purple-500" />
                                </td>
                                <td className="px-4 py-3">
                                  <input type="number" min="0" step="0.01" value={rateForMeal ? (isNaN(rateForMeal.publicMarkup ?? 0) ? '' : rateForMeal.publicMarkup ?? 0) : ''} onChange={(e) => {
                                    if (rateForMeal) {
                                      setForm({ ...form, rateCards: form.rateCards.map(r => r.id === rateForMeal.id ? { ...r, publicMarkup: e.target.value ? parseFloat(e.target.value) : 0 } : r) });
                                    }
                                  }} placeholder="0.00" className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-red-500" />
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}

        {/* TAB 6 */}
        {currentTab === 5 && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Cancellation Policies & Terms</h2>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Cancellation Policy *</label><textarea value={form.cancellationPolicy} onChange={(e) => setForm({ ...form, cancellationPolicy: e.target.value })} rows={6} placeholder="Define your cancellation policy..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Terms & Conditions *</label><textarea value={form.termsAndConditions} onChange={(e) => setForm({ ...form, termsAndConditions: e.target.value })} rows={8} placeholder="Define your terms..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Additional Policies</label><textarea value={form.additionalPolicies} onChange={(e) => setForm({ ...form, additionalPolicies: e.target.value })} rows={6} placeholder="Any other policies..." className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500" /></div>
          </div>
        )}
      </div>

      <div className="mt-8 flex gap-4 justify-between">
        <button onClick={() => setCurrentTab(Math.max(0, currentTab - 1))} disabled={currentTab === 0} className="flex items-center gap-2 px-6 py-3 border border-gray-300 rounded-lg font-medium hover:bg-gray-50 disabled:opacity-50 transition"><ChevronLeft className="w-5 h-5" />Previous</button>
        <div className="flex gap-2">{tabs.map((_, idx) => <button key={idx} onClick={() => setCurrentTab(idx)} className={`w-2 h-2 rounded-full transition ${currentTab === idx ? 'bg-blue-600 w-6' : 'bg-gray-300 hover:bg-gray-400'}`} />)}</div>
        {currentTab < tabs.length - 1 ? <button onClick={() => setCurrentTab(currentTab + 1)} className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition">Next<ChevronRight className="w-5 h-5" /></button> : <button onClick={handleSubmit} className="px-6 py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition">Create Hotel ✓</button>}
      </div>
    </div>
  );
}
