# HotelHub - Comprehensive Property Management System
## Testing & Implementation Guide

---

## 📋 System Overview

The Property Management System consists of three main portals:
1. **Tenant Portal** - Hotel chain management & configuration
2. **Admin Portal** - Super admin oversight (already built)
3. **Front Office Portal** - Daily property operations & bookings (NEW)

---

## 🔐 Login Portals

### 1. Tenant Login
**URL:** `http://localhost:3000/login/tenant`
- **Demo Credentials:**
  - Tenant ID: `luxury-hotels-co`
  - Email: `admin@luxuryhotels.com`
  - Password: `password123`
- **Access:** Property management, rates, amenities, policies, finance details

### 2. Admin Login
**URL:** `http://localhost:3000/login/admin`
- **Demo Credentials:**
  - Email: `admin@platform.com`
  - Password: `admin123`
- **Access:** Tenant management, onboarding, tenant approval/rejection

### 3. Front Office Login (NEW)
**URL:** `http://localhost:3000/login/frontoffice`
- **Demo Credentials:**
  - Email: `frontoffice@luxuryhotels.com`
  - Password: `password123`
- **Access:** Booking management, occupancy, revenue tracking

---

## 📊 Property Management Features

### Basic Info Tab
✅ Property name, description, website  
✅ Contact information (phone, email)  
✅ Location (country, state, city, area)  
✅ Geolocation (latitude, longitude)  
✅ Auto-save functionality  

### Amenities Tab
✅ 24 master amenities available  
✅ Multi-select checkbox interface  
✅ Property-level amenity management  

### Rooms & Inventory Tab
✅ Add room types (Single, Double, Suite, Deluxe, Presidential)  
✅ Total rooms vs allocation tracking  
✅ **Room-level amenities** (AC, WiFi, TV, Safe, etc.)  
✅ Room details display with amenities  

### Rates Tab (Advanced Features)
✅ **Dependent date pickers** - End date only selectable after start date  
✅ **Domestic & International rates** - Rate type selection  
✅ **Weekday selection** - Individual day toggles  
✅ **Calendar view** - Visual rate configuration display  
✅ **Rate configuration table** - All configured rates listed  

### Images & Media Tab (NEW)
✅ Upload hotel images  
✅ Label management (Lobby, Pool, Bedroom, etc.)  
✅ Media gallery with preview  
✅ Remove images functionality  

### Policies Tab (NEW)
✅ **Cancellation Policy** - Text area for cancellation terms  
✅ **Other Policies** - Facilities, check-in/out times, house rules  

### Finance Tab (NEW - Comprehensive)
**Finance Manager Details:**
- Name, Phone, Email

**Salesperson Contact:**
- Name, Phone, Email

**Banking Details:**
- Bank name, Account number, IFSC code, Beneficiary name

**Money Transfer & Settlement:**
- Settlement method description

**Contract Details:**
- Start date, End date
- Contract duration (auto-calculated in days)
- Contract document upload

---

## 🧪 Testing Workflow

### Step 1: Start Servers
```bash
# Terminal 1 - API Server
pnpm -F api dev

# Terminal 2 - Web App
pnpm -F web dev
```

### Step 2: Navigate to Property Management
1. Go to `http://localhost:3000/login/tenant`
2. Login with demo credentials
3. Click "Hotels" in sidebar
4. Click on a property to open management page

### Step 3: Test Each Tab

#### Test Basic Info
- [ ] Enter property name
- [ ] Add description, phone, email, website
- [ ] Select country, state, city, area
- [ ] Enter geolocation
- [ ] Click "Save Property Info"
- [ ] Verify success message

#### Test Amenities
- [ ] Check/uncheck amenities
- [ ] Click "Save Amenities"
- [ ] Verify amenities persist

#### Test Rooms
- [ ] Select room type
- [ ] Enter total rooms (e.g., 50)
- [ ] Enter allocation (e.g., 30)
- [ ] Select room amenities (AC, WiFi, TV, etc.)
- [ ] Click "Add Room Type"
- [ ] Verify room appears in inventory list
- [ ] Verify amenities display on room card

#### Test Rates
- [ ] Select room type (e.g., Double)
- [ ] Select rate type (Domestic/International)
- [ ] Click start date picker and select a date (e.g., Aug 1)
- [ ] **Verify end date picker is DISABLED until start date is selected**
- [ ] Select end date (e.g., Aug 15)
- [ ] Click weekday toggles to select (e.g., Mon-Fri)
- [ ] Enter rate (e.g., 150)
- [ ] Click "Add Rate Configuration"
- [ ] **Verify calendar shows rates on selected dates**
- [ ] Verify rate appears in "Configured Rates" table
- [ ] **Verify domestic rate shows as "DOM" in calendar**
- [ ] Add international rate on same dates (should both show on calendar)

#### Test Images & Media
- [ ] Enter image label (e.g., "Swimming Pool")
- [ ] Click "Upload Image File" and select an image
- [ ] Click "Add Media"
- [ ] Verify image appears in gallery with label
- [ ] Click remove to delete image

#### Test Policies
- [ ] Enter cancellation policy text
- [ ] Enter other policies/facilities
- [ ] Click "Save Policies"
- [ ] Verify success message

#### Test Finance
- [ ] Enter finance manager details (name, phone, email)
- [ ] Enter salesperson details
- [ ] Enter banking details (bank name, account number, IFSC, beneficiary)
- [ ] Enter settlement method description
- [ ] Select contract start date
- [ ] **Verify contract end date becomes enabled**
- [ ] Select contract end date
- [ ] **Verify contract duration calculates automatically**
- [ ] Upload contract document
- [ ] Click "Save Finance Details"
- [ ] Verify success message

---

## 🎯 Testing B2B & B2C Reads

### Access Front Office Portal
1. Go to `http://localhost:3000/login/frontoffice`
2. Login with: `frontoffice@luxuryhotels.com` / `password123`

### Front Office Dashboard Features
- **Overview Tab:**
  - [ ] Check today's check-ins count
  - [ ] Check today's check-outs count
  - [ ] View occupancy percentage
  - [ ] View today's revenue
  - [ ] See today's bookings table

- **All Bookings Tab:**
  - [ ] Verify all bookings display
  - [ ] Check guest names, room types, dates
  - [ ] Verify B2B/B2C source appears correctly

- **B2B Bookings Tab:**
  - [ ] Filter shows only B2B bookings
  - [ ] Blue color coding for B2B entries
  - [ ] Corporate/wholesale booking details visible

- **B2C Bookings Tab:**
  - [ ] Filter shows only B2C bookings
  - [ ] Purple color coding for B2C entries
  - [ ] Direct consumer booking details visible

---

## 🔌 API Endpoints Required

### Property Management Endpoints
```
PUT /properties/:id
- Update property info (name, description, phone, email, website, country, state, city, area, latitude, longitude)
- Update amenities array
- Update policies
- Update finance details

GET /properties/:id
- Retrieve full property details including rooms, rates, policies, finance

POST /properties/:id/rooms
- Add room type with amenities

PUT /properties/:id/rooms/:roomId
- Update room details and amenities

POST /properties/:id/rate-plans
- Create rate configuration with date range and weekdays

GET /properties/:id/rate-plans
- List all rate configurations for property
```

### Front Office Endpoints
```
POST /auth/frontoffice-login
- Email, password
- Returns: access_token, user object with name, email

GET /frontoffice/dashboard
- Returns: todayCheckIns, todayCheckOuts, occupancy, revenue
- Returns: bookings array with source (b2b/b2c)

GET /frontoffice/bookings?source=b2b|b2c
- Filter bookings by source
```

---

## 📱 UI Features Checklist

### Responsive Design
- [ ] Works on desktop (1280px)
- [ ] Works on tablet (768px)
- [ ] Works on mobile (375px)

### Dark Mode
- [ ] All tabs display correctly in dark mode
- [ ] Colors have proper contrast
- [ ] Icons are visible in dark mode

### Form Validation
- [ ] Required fields show error on submit
- [ ] Date validation works (end date after start date)
- [ ] File uploads show validation (max size)

### Accessibility
- [ ] Tab navigation works
- [ ] Form labels linked to inputs
- [ ] Error messages clear and visible

---

## 🔄 Data Flow

```
Tenant Login
    ↓
Tenant Dashboard (Properties List)
    ↓
Select Property
    ↓
Property Management Page (7 Tabs)
    ↓
Edit/Update Details
    ↓
Save to Backend API
    ↓
Front Office Staff Logs In
    ↓
View Dashboard (Check-ins, Check-outs, Occupancy)
    ↓
View B2B & B2C Bookings
    ↓
Manage Daily Operations
```

---

## ⚙️ Configuration Required

### Environment Variables
```env
# .env.local
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
DATABASE_URL=postgresql://...
JWT_SECRET=your-secret-key
```

### Database Migrations
```bash
# Apply pending migrations
pnpm -F db prisma migrate dev --name add_property_details

# Create Prisma client
pnpm -F db prisma generate
```

---

## 🚀 Deployment Checklist

- [ ] All API endpoints implemented
- [ ] Database migrations applied
- [ ] Frontend pages tested in all tabs
- [ ] Form validations working
- [ ] File uploads configured (S3/Cloud storage)
- [ ] Error handling implemented
- [ ] Loading states display correctly
- [ ] Dark mode fully tested
- [ ] Mobile responsiveness verified
- [ ] Security headers configured
- [ ] Rate limiting implemented
- [ ] CORS properly configured

---

## 📝 Key Features Summary

| Feature | Status | Tested |
|---------|--------|--------|
| Basic Property Info | ✅ Complete | Pending |
| Amenities Management | ✅ Complete | Pending |
| Room Inventory | ✅ Complete | Pending |
| Room Amenities | ✅ Complete | Pending |
| Rates with Calendar | ✅ Complete | Pending |
| Domestic/International Rates | ✅ Complete | Pending |
| Date Range Selection | ✅ Complete | Pending |
| Dependent Date Pickers | ✅ Complete | Pending |
| Media Gallery | ✅ Complete | Pending |
| Cancellation Policies | ✅ Complete | Pending |
| Other Policies | ✅ Complete | Pending |
| Finance Manager Details | ✅ Complete | Pending |
| Salesperson Contact | ✅ Complete | Pending |
| Banking Details | ✅ Complete | Pending |
| Contract Management | ✅ Complete | Pending |
| Front Office Portal | ✅ Complete | Pending |
| B2B/B2C Booking Read | ✅ Complete | Pending |

---

## 🆘 Troubleshooting

### Issue: End date picker disabled after selecting start date
**Solution:** Ensure the `min` attribute is properly set on the date input

### Issue: Room amenities not displaying
**Solution:** Verify room object includes `amenities` array in API response

### Issue: Calendar not showing rates
**Solution:** Check that `isDateInRange` function correctly matches dates and weekdays

### Issue: Front office login returns 401
**Solution:** Create `POST /auth/frontoffice-login` endpoint in API

---

## 📞 Support & Next Steps

1. **Implement Backend Endpoints** - Create all missing API routes
2. **Database Testing** - Verify all data persists correctly
3. **End-to-End Testing** - Test complete user workflows
4. **Performance Optimization** - Optimize queries and caching
5. **Mobile App** - Consider React Native version

---

**Last Updated:** 2026-07-13  
**Version:** 1.0.0  
**Status:** Ready for Testing
