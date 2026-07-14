# HotelHub - Quick Start Guide

## 🚀 Start the Application

### Terminal 1 - Start API Server
```bash
cd /path/to/Static\ Hotel\ Inventory
pnpm -F api dev
```
**API will run on:** `http://localhost:3001`

### Terminal 2 - Start Web App
```bash
cd /path/to/Static\ Hotel\ Inventory
pnpm -F web dev
```
**Web app will run on:** `http://localhost:3000`

---

## 🔐 Login URLs & Credentials

### 1️⃣ Tenant Login
**URL:** `http://localhost:3000/login/tenant`

| Field | Value |
|-------|-------|
| Tenant ID | `luxury-hotels-co` |
| Email | `admin@luxuryhotels.com` |
| Password | `password123` |

**Access:** Property management, rates, policies, finance

---

### 2️⃣ Admin Login  
**URL:** `http://localhost:3000/login/admin`

| Field | Value |
|-------|-------|
| Email | `admin@platform.com` |
| Password | `admin123` |

**Access:** Tenant management, approvals, configuration

---

### 3️⃣ Front Office Login (NEW)
**URL:** `http://localhost:3000/login/frontoffice`

| Field | Value |
|-------|-------|
| Email | `frontoffice@luxuryhotels.com` |
| Password | `password123` |

**Access:** Daily operations, bookings, B2B/B2C management

---

## 📍 Key URLs

| Page | URL | Purpose |
|------|-----|---------|
| Home | `http://localhost:3000` | Role selection |
| Tenant Dashboard | `http://localhost:3000/dashboard` | Property list |
| **Property Management** | `http://localhost:3000/dashboard/properties/:id` | **All 7 tabs** |
| Admin Dashboard | `http://localhost:3000/admin/dashboard` | Tenant management |
| Tenant Onboarding | `http://localhost:3000/onboard` | New tenant signup |
| Front Office | `http://localhost:3000/frontoffice/dashboard` | Booking management |

---

## 🔧 Access Property Management

1. Go to Tenant Login: `http://localhost:3000/login/tenant`
2. Use demo credentials above
3. Click **Hotels** in the sidebar
4. Click on a property (e.g., "The Luxury Plaza")
5. Browse 7 tabs:
   - ✅ Basic Info
   - ✅ Amenities
   - ✅ Rooms & Inventory
   - ✅ Rates (with calendar)
   - ✅ Images & Media
   - ✅ Policies
   - ✅ Finance

---

## 📋 What to Test

### In Property Management

#### Rates Tab (Most Complex)
```
1. Select Room Type: "Double"
2. Select Rate Type: "Domestic" or "International"
3. Click Start Date: Pick "Aug 1, 2026"
   → End Date picker becomes ENABLED
4. Click End Date: Pick "Aug 15, 2026"
   → Shows "after Aug 1, 2026"
5. Select Weekdays: Click Mon-Fri buttons
   → Shows "Selected: Monday, Tuesday..."
6. Enter Rate: "150.00"
7. Click "Add Rate Configuration"
   → Calendar shows "$150" on Aug 1-15 weekdays
   → Table lists the configuration
```

#### Finance Tab (Contract Duration Auto-Calculate)
```
1. Fill Finance Manager: Name, Phone, Email
2. Fill Salesperson: Name, Phone, Email
3. Fill Banking Details: All 4 fields
4. Enter Settlement Method: Describe transfer
5. Select Contract Start Date: "Sep 1, 2026"
   → End Date picker becomes ENABLED
6. Select Contract End Date: "Sep 30, 2026"
   → Duration field shows "29 days" automatically
7. Upload Contract Document: PDF or DOC
8. Click "Save Finance Details"
```

#### Rooms Tab (Room Amenities)
```
1. Select Room Type: "Double"
2. Enter Total Rooms: "50"
3. Enter Allocation: "30"
4. Check Amenities: AC, WiFi, TV, Safe
   → Selected amenities highlight in purple
5. Click "Add Room Type"
   → Room appears in list with amenities as tags
```

#### Images & Media Tab
```
1. Enter Image Label: "Swimming Pool"
2. Click "Upload Image File"
3. Select an image from your computer
4. Click "Add Media"
   → Image appears in gallery with label
   → Shows placeholder if no image selected
```

---

## 🌐 Front Office Portal Testing

### Access Front Office
1. Go to: `http://localhost:3000/login/frontoffice`
2. Use credentials: `frontoffice@luxuryhotels.com` / `password123`

### Test Dashboard
- **Overview Tab**
  - See today's check-ins/check-outs
  - View occupancy %
  - View daily revenue
  - Browse today's bookings

- **All Bookings Tab**
  - See all bookings
  - Filter by guest name, date range
  - See B2B/B2C source color-coded

- **B2B Bookings Tab**
  - Filter B2B only (blue)
  - Corporate rate information
  - Wholesale details

- **B2C Bookings Tab**
  - Filter B2C only (purple)
  - Direct consumer bookings
  - Consumer rates

---

## 🎨 Visual Indicators

### Status Colors
| Status | Color | Meaning |
|--------|-------|---------|
| Confirmed | 🟢 Green | Booking confirmed |
| Pending | 🟡 Yellow | Awaiting approval |
| Cancelled | 🔴 Red | Booking cancelled |
| B2B Source | 🔵 Blue | Business-to-Business |
| B2C Source | 🟣 Purple | Business-to-Consumer |

### Room Amenities (as Tags)
```
AC | WiFi | TV | Safe | Mini Bar | Hot Water | Work Desk
```

### Rate Type Display
```
Domestic = "DOM"
International = "INT"
```

---

## 🐛 Common Issues & Fixes

### Issue: "End date picker is disabled"
**Solution:** Make sure you selected a start date first. The end date picker only activates after start date is set.

### Issue: "Amenities don't show on room"
**Solution:** Uncheck "No amenities selected" in the room form. Select at least one amenity checkbox.

### Issue: "Calendar shows no rates"
**Solution:** 
1. Verify start and end dates are set
2. Check that selected weekdays match calendar date
3. Confirm rate amount is not zero

### Issue: "Contract duration not calculating"
**Solution:** Make sure you have both start AND end dates selected. End date must be after start date.

### Issue: "Front office login fails"
**Solution:** 
1. Ensure API server is running on port 3001
2. Check that email exactly matches: `frontoffice@luxuryhotels.com`
3. Password is: `password123`

---

## 📊 Sample Rate Configurations to Create

### Configuration 1: Summer Domestic Rates
```
Room Type: Double
Rate Type: Domestic
Start: Jul 1, 2026
End: Aug 31, 2026
Weekdays: Mon-Fri
Rate: $150/night
```

### Configuration 2: Summer International Rates
```
Room Type: Double
Rate Type: International
Start: Jul 1, 2026
End: Aug 31, 2026
Weekdays: Sat-Sun
Rate: $200/night
```

### Configuration 3: Suite Weekend Rate
```
Room Type: Suite
Rate Type: International
Start: Oct 1, 2026
End: Dec 31, 2026
Weekdays: Sat-Sun
Rate: $250/night
```

---

## ✅ Testing Checklist

### Property Management
- [ ] Tenant login successful
- [ ] Can navigate to property
- [ ] Basic Info tab saves correctly
- [ ] Can select and save amenities
- [ ] Can add room types with amenities
- [ ] Date pickers work (dependent selection)
- [ ] Calendar shows rates correctly
- [ ] Can add multiple rate types
- [ ] Policies save correctly
- [ ] Finance details save correctly
- [ ] Contract duration auto-calculates
- [ ] Images upload and display

### Front Office
- [ ] Front office login successful
- [ ] Dashboard loads with stats
- [ ] B2B bookings filter works
- [ ] B2C bookings filter works
- [ ] Booking details display correctly
- [ ] Color coding is visible

---

## 🚨 Important Notes

1. **Database Connection:** Ensure PostgreSQL is running
2. **Port Conflicts:** If ports 3000 or 3001 in use, change in config
3. **Environment Variables:** Check `.env` files are set up
4. **File Uploads:** Images upload to memory in dev mode (use S3 in production)
5. **Dark Mode:** Toggle with system preference or app settings

---

## 📞 Quick Help

### Need to reset data?
```bash
pnpm -F db prisma db push --skip-generate
```

### Need to generate new Prisma client?
```bash
pnpm -F db prisma generate
```

### Check API is running?
```
curl http://localhost:3001/api/v1/health
```

### Check Web app is running?
```
curl http://localhost:3000
```

---

**Ready to test? Start with the tenant login and navigate to property management!** 🚀

For detailed testing instructions, see: `PROPERTY_MANAGEMENT_GUIDE.md`
