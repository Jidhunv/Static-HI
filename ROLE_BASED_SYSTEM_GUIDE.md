# HotelHub - Role-Based User Management & Reporting System
## Complete Multi-Level Access Control & Analytics

---

## 🏗️ USER HIERARCHY & ROLES

### **Role Levels (1-5)**

```
LEVEL 1: ADMIN (Tenant Administrator)
├─ Full access to all features
├─ Can manage all users and roles
├─ Can view all reports
├─ Can manage B2B agents
├─ Can configure hotel settings
└─ Permissions: 16 core permissions

LEVEL 2: MIDOFFICE (Hotel Operations Manager)
├─ Manage hotel properties
├─ Configure rates & policies
├─ View occupancy reports
├─ Cannot access finance
├─ Permissions: 5 permissions

LEVEL 3A: FINANCE (Finance Manager)
├─ View all financial transactions
├─ Manage commissions & settlements
├─ Generate financial reports
├─ Cannot book or modify bookings
└─ Permissions: 4 permissions

LEVEL 3B: SALES (Sales Manager)
├─ View all booking data
├─ Monitor commission tracking
├─ See sales performance reports
├─ Cannot manage finances directly
└─ Permissions: 3 permissions

LEVEL 4: FRONTOFFICE (Front Desk Staff)
├─ Process check-ins/check-outs
├─ Confirm bookings
├─ Update guest information
├─ View property details only
└─ Permissions: 4 permissions

LEVEL 5: B2B AGENT (External Partner)
├─ Create own bookings
├─ View own commission tracking
├─ View own performance reports
├─ Cannot access other agents' data
└─ Permissions: 3 "own-only" permissions
```

---

## 🔐 PERMISSION SYSTEM

### **Core Permissions**
```
Admin Level:
✓ users.manage          - Create/update/delete users
✓ hotels.manage         - Add/edit properties
✓ bookings.view         - View all bookings
✓ bookings.manage       - Confirm/cancel bookings
✓ rates.manage          - Set rates and pricing
✓ policies.manage       - Configure policies
✓ finance.view          - View financial data
✓ finance.manage        - Approve payments
✓ reports.view          - Access all reports
✓ b2b_agents.manage     - Create/manage agents
✓ commissions.view      - View all commissions
✓ settlements.view      - View settlements
✓ settings.manage       - Configure tenant settings

Finance Level:
✓ finance.view          - View transactions
✓ finance.manage        - Process payments
✓ commissions.view      - View commissions
✓ settlements.view      - View settlements

Sales Level:
✓ bookings.view         - View all bookings
✓ reports.view          - View sales reports
✓ commissions.view      - View commission tracking

FrontOffice Level:
✓ bookings.view         - View bookings
✓ bookings.update_status - Confirm/check-in
✓ hotels.view           - View property info
✓ guests.manage         - Update guest details

B2B Agent Level:
✓ bookings.view_own     - View own bookings only
✓ commissions.view_own  - View own commissions
✓ reports.view_own      - View own performance
```

---

## 👥 USER TYPES & WORKFLOWS

### **1. TENANT ADMIN**
**Created:** Automatically on tenant creation
**Onboarding:**
- No special setup needed
- Full access from day 1
- Can create other users

**Actions:**
```
├─ Create/manage MidOffice users
├─ Create/manage Finance & Sales team
├─ Create/manage FrontOffice staff
├─ Create/manage B2B agents
├─ Configure all settings
├─ Approve/view all reports
└─ Manage commissions & settlements
```

**Dashboard Access:**
- Admin Dashboard (all data)
- Financial Overview
- Agent Performance
- Team Management

---

### **2. MIDOFFICE STAFF**
**Created:** By Admin
**Onboarding:**
```
Step 1: Admin invites user via email
Step 2: User creates password
Step 3: User can:
  ├─ Access assigned hotel(s)
  ├─ Configure rates
  ├─ Set policies
  ├─ View occupancy
  └─ Generate hotel reports
```

**Hotel Assignment:**
- Admin assigns user to specific hotels
- User can only manage assigned properties
- Can switch between assigned hotels

**Dashboard:**
```
MidOffice Dashboard
├─ Hotel Selection (dropdown)
├─ Occupancy Metrics
│  ├─ Current occupancy %
│  ├─ Room breakdown
│  └─ Revenue today
├─ Rate Management
│  ├─ Current rates
│  ├─ Adjust rates
│  └─ Rate history
├─ Policies
│  ├─ Cancellation policies
│  ├─ Check-in/out times
│  └─ Special conditions
└─ Reports
   ├─ Occupancy trends
   ├─ Revenue trends
   └─ Booking source breakdown
```

---

### **3. FINANCE TEAM**
**Created:** By Admin
**Responsibilities:**
```
├─ Monitor all financial transactions
├─ Approve commissions
├─ Process settlements
├─ Generate financial reports
├─ Track payments
└─ Manage agent settlements
```

**Dashboard:**
```
Finance Dashboard
├─ Financial Summary
│  ├─ Total revenue
│  ├─ Total commissions
│  └─ Platform share
├─ Commission Management
│  ├─ Pending commissions
│  ├─ Approved commissions
│  ├─ Paid commissions
│  └─ Approve/reject actions
├─ Settlement Tracking
│  ├─ Pending settlements
│  ├─ Approved settlements
│  ├─ Paid settlements
│  └─ Settlement reports
├─ B2B Agent Settlements
│  ├─ Agent list
│  ├─ Commission breakdown
│  ├─ Settlement status
│  └─ Payment history
└─ Reports
   ├─ Revenue by source
   ├─ Commission breakdown
   ├─ Agent payouts
   └─ Financial trends
```

---

### **4. SALES TEAM**
**Created:** By Admin
**Responsibilities:**
```
├─ Monitor booking performance
├─ Track commission earnings
├─ View sales metrics
├─ Compare performance
└─ Identify trends
```

**Permissions:**
- View own bookings (if assigned)
- View all bookings (if allowed)
- See own commission
- See team commission (if allowed)

**Dashboard:**
```
Sales Dashboard
├─ Sales Summary
│  ├─ Total bookings (period)
│  ├─ Conversion rate
│  ├─ Total revenue
│  └─ Total commission
├─ Booking Breakdown
│  ├─ By source (B2B/B2C)
│  ├─ By status
│  ├─ By room type
│  └─ By agent
├─ Commission Tracking
│  ├─ My commissions
│  ├─ Team commissions (if authorized)
│  ├─ Pending payouts
│  └─ Paid payouts
├─ Performance
│  ├─ Top performing agents
│  ├─ Booking trends
│  ├─ Revenue trends
│  └─ Conversion trends
└─ Reports
   ├─ Sales by period
   ├─ Agent comparison
   ├─ Source analysis
   └─ Commission analysis
```

---

### **5. FRONTOFFICE STAFF**
**Created:** By Admin
**Responsibilities:**
```
├─ Process check-ins
├─ Process check-outs
├─ Confirm bookings
├─ Update guest information
├─ Handle special requests
└─ Generate daily report
```

**Limited Access:**
- Cannot access rates or pricing
- Cannot access financial data
- Cannot see all tenant data
- Can only see property-specific info

**Dashboard:**
```
FrontOffice Dashboard
├─ Today's Schedule
│  ├─ Check-ins (with details)
│  ├─ Check-outs (with details)
│  ├─ Special requests
│  └─ VIP notes
├─ Current Occupancy
│  ├─ Occupied rooms
│  ├─ Available rooms
│  └─ Maintenance rooms
├─ Guest Management
│  ├─ Check-in form
│  ├─ Check-out form
│  ├─ Guest history
│  └─ Special notes
└─ Daily Report
   ├─ Check-ins completed
   ├─ Check-outs completed
   ├─ Issues logged
   └─ Tomorrow's preview
```

---

### **6. B2B AGENTS**
**Created:** By Admin as B2B Agent (External Partner)
**Onboarding Process:**

**Step 1: Admin Creates Agent**
```
POST /b2b/agents
Body:
{
  "name": "Global Travel Partners",
  "email": "contact@globaltravel.com",
  "phone": "+1-555-0100",
  "website": "www.globaltravel.com",
  "contactPerson": "John Smith",
  "commissionRate": 12,
  "commissionType": "percentage",
  "logoUrl": "https://storage.com/logo.png"  // Agent's logo
}
```

**Step 2: Agent Gets Logo Upload**
```
PUT /b2b/agents/:id
{
  "logoUrl": "https://storage.com/agent-logo.png",
  "primaryColor": "#1e40af",
  "secondaryColor": "#3b82f6"
}

// Agent's branding used in their:
├─ Agent Dashboard
├─ Booking confirmations
├─ Invoices & settlements
└─ Reports they generate
```

**Step 3: Admin Creates Agent Users**
```
POST /b2b/agents/:id/users
Body:
{
  "email": "user@globaltravel.com",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "admin"  // Can create other agent users
}

// Agent users get:
├─ Email invite
├─ Can set own password
├─ Access to agent portal
└─ Only see their own data
```

**Agent Dashboard:**
```
B2B Agent Dashboard
├─ Agent Profile
│  ├─ Commission rate: 12%
│  ├─ Logo: [Agent's logo]
│  ├─ Brand colors
│  └─ Contact info
├─ My Bookings
│  ├─ All bookings by me
│  ├─ Filter by status
│  ├─ Detailed view
│  └─ Cannot see other agents' bookings
├─ Commission Tracker
│  ├─ Pending commissions
│  ├─ Approved commissions
│  ├─ Paid commissions
│  ├─ Payment history
│  └─ Earning graph
├─ Performance Report
│  ├─ Total bookings
│  ├─ Conversion rate
│  ├─ Total revenue
│  ├─ Total earned commission
│  ├─ Average booking value
│  ├─ Bookings by month
│  └─ Property breakdown
└─ Settlement Status
   ├─ Monthly settlements
   ├─ Current period earnings
   ├─ Expected payout date
   └─ Historical payouts
```

---

## 📊 ROLE-SPECIFIC REPORTS

### **ADMIN REPORTS**
```
Tenant Overview Report
├─ Period: Custom date range
├─ Bookings
│  ├─ Total bookings
│  ├─ Confirmed bookings
│  └─ Conversion rate
├─ Financial Summary
│  ├─ Total revenue
│  ├─ Total commissions
│  ├─ Platform share (5%)
│  └─ Hotel share (70%)
├─ B2B Agent Status
│  ├─ Active agents: 15
│  ├─ KYC verified: 12
│  ├─ Pending KYC: 3
│  └─ Suspended: 0
└─ Trends
   ├─ Revenue trend graph
   ├─ Booking trend graph
   └─ Agent growth
```

**Can Export:** PDF, CSV, Excel

---

### **MIDOFFICE REPORTS**
```
Hotel Report (Property-Specific)
├─ Property Name & Code
├─ Occupancy Analysis
│  ├─ Occupancy rate (%)
│  ├─ Occupied nights
│  ├─ Total available nights
│  └─ Occupancy by room type
├─ Booking Analysis
│  ├─ Total bookings
│  ├─ By booking source (B2B/B2C)
│  ├─ By room type
│  └─ Booking trend
├─ Revenue Analysis
│  ├─ Total revenue
│  ├─ Average daily rate (ADR)
│  ├─ Revenue per available room (RevPAR)
│  └─ Revenue by room type
└─ Comparison
   └─ Period-over-period comparison
```

**Can View:**
- Multiple properties (tabbed)
- Custom date ranges
- Export options

---

### **FINANCE REPORTS**
```
Financial Report
├─ Period: Custom range
├─ Bookings Summary
│  ├─ Total bookings
│  └─ Total amount
├─ Commission Tracking
│  ├─ Total commissions: $5,000
│  ├─ Pending: $1,200 (3 commissions)
│  ├─ Approved: $2,500 (5 commissions)
│  └─ Paid: $1,300 (4 commissions)
├─ Settlement Status
│  ├─ Current period payable
│  ├─ Pending approval
│  ├─ Approved but unpaid
│  └─ Paid to date
├─ Agent Breakdown
│  ├─ Agent A: $2,000 commission
│  ├─ Agent B: $1,500 commission
│  └─ Agent C: $1,500 commission
├─ Revenue Share
│  ├─ Hotel share: 70%
│  ├─ Agent share: 25%
│  └─ Platform share: 5%
└─ Action Items
   ├─ Approve commissions
   ├─ Process settlements
   └─ Generate invoices
```

---

### **SALES REPORTS**
```
Sales Report (Bookings & Commission)
├─ Summary
│  ├─ Total bookings
│  ├─ Confirmed: 18/20
│  ├─ Total revenue
│  └─ Total commission earned
├─ Booking Source Breakdown
│  ├─ B2B: 15 bookings (75%)
│  ├─ B2C: 5 bookings (25%)
│  └─ Walk-in: 0
├─ By Agent (if authorized to see team)
│  ├─ Agent A: 12 bookings
│  ├─ Agent B: 5 bookings
│  ├─ Agent C: 3 bookings
│  └─ Comparison chart
├─ Commission Breakdown
│  ├─ Total commission: $2,500
│  ├─ Pending: $500
│  ├─ Approved: $1,500
│  ├─ Paid: $500
│  └─ Payment timeline
└─ Performance Metrics
   ├─ Conversion rate: 90%
   ├─ Average booking value: $1,200
   └─ Top property: Hotel A (8 bookings)
```

**Permissions:**
- View own: Always
- View team: If granted by Admin
- Compare: With permission

---

### **FRONTOFFICE REPORTS**
```
Daily Operations Report
├─ Date: Today
├─ Check-ins
│  ├─ Expected: 5 guests
│  ├─ Completed: 5
│  ├─ Details: Name, Room, Time
│  └─ Issues: None
├─ Check-outs
│  ├─ Expected: 3 guests
│  ├─ Completed: 2
│  ├─ Pending: 1 (Room 305)
│  └─ Issues: Late checkout requested
├─ Current Status
│  ├─ Occupied rooms: 28/30
│  ├─ Available: 2
│  ├─ Maintenance: 0
│  └─ Occupancy rate: 93%
├─ Special Notes
│  ├─ VIP guests: 2
│  ├─ Special requests: 3
│  └─ Allergies/preferences: Updated
└─ Tomorrow's Preview
   ├─ Expected check-ins: 7
   ├─ Expected check-outs: 4
   └─ Occupancy forecast: 89%
```

**Limited to:** Own property
**Cannot see:** Pricing, Financial data

---

### **B2B AGENT REPORTS**
```
My Performance Report
├─ Agent: Global Travel Partners
├─ Period: Custom range
├─ Summary
│  ├─ Total bookings made: 45
│  ├─ Confirmed: 42
│  ├─ Conversion rate: 93%
│  └─ Total revenue: $54,000
├─ Commission Summary
│  ├─ Commission rate: 12%
│  ├─ Total earned: $6,480
│  ├─ Pending: $1,200 (2 bookings)
│  ├─ Approved: $3,600
│  └─ Paid: $1,680
├─ Booking Breakdown
│  ├─ By month
│  ├─ By property
│  ├─ By room type
│  └─ By status
├─ Top Performing Properties
│  ├─ Property A: 15 bookings
│  ├─ Property B: 12 bookings
│  ├─ Property C: 10 bookings
│  └─ Others: 8 bookings
└─ Earnings Timeline
   ├─ Monthly breakdown
   ├─ Cumulative earnings graph
   └─ Payment schedule
```

**Cannot see:**
- Other agents' data
- Platform financials
- Rate details

---

## 🗂️ DATABASE MODELS

### **New Models Created**
```sql
TenantRole
├─ tenantId
├─ name (Admin, MidOffice, Finance, etc.)
├─ description
├─ permissions (JSON array)
├─ level (1-5)
└─ users (relation)

B2BAgent
├─ tenantId
├─ name (Company name)
├─ email, phone, website
├─ logoUrl ← Agent's branding
├─ primaryColor, secondaryColor
├─ commissionRate, commissionType
├─ status (active, suspended)
├─ kycVerified, kycDocuments
└─ users, bookings, commissions (relations)

B2BAgentUser
├─ agentId
├─ email, password
├─ firstName, lastName
├─ role (admin, user)
└─ status

Commission
├─ bookingId, b2bAgentId, tenantId
├─ bookingAmount, commissionRate
├─ commissionAmount (calculated)
├─ status (pending, approved, paid)
├─ paidAt, paidAmount
└─ breakdown (JSON)

Settlement
├─ tenantId, b2bAgentId
├─ startDate, endDate, period
├─ totalBookingAmount, totalCommission
├─ totalPayable, totalPaid, balance
└─ status (pending, approved, paid)

Booking (Enhanced)
├─ b2bAgentId ← Track which agent booked
└─ commission (relation)
```

---

## 🔌 API ENDPOINTS

### **Role Management**
```javascript
GET    /roles                          // List roles
POST   /roles                          // Create role
GET    /roles/:id                      // Get role details
PUT    /roles/:id                      // Update role

GET    /users/:id/permissions          // Get user permissions
GET    /users/:id/roles                // Get user roles
POST   /users/:id/roles                // Assign role to user
```

### **B2B Agent Management**
```javascript
POST   /b2b/agents                     // Create agent
GET    /b2b/agents                     // List agents
GET    /b2b/agents/:id                 // Get agent details
PUT    /b2b/agents/:id                 // Update agent (logo, colors)
POST   /b2b/agents/:id/users           // Add user to agent
GET    /b2b/agents/:id/users           // List agent users
POST   /b2b/agents/:id/verify-kyc      // Verify KYC
PUT    /b2b/agents/:id/commission      // Update commission
POST   /b2b/agents/:id/suspend         // Suspend agent
POST   /b2b/agents/:id/activate        // Activate agent
GET    /b2b/agents/:id/metrics         // Get performance metrics
```

### **Reports**
```javascript
GET    /reports/admin                  // Admin overview
GET    /reports/midoffice/:propertyId  // Hotel report
GET    /reports/finance                // Financial report
GET    /reports/sales                  // Sales report
GET    /reports/frontoffice            // Daily operations
GET    /reports/agent/:agentId         // Agent performance

// Filters
?startDate=2026-07-01&endDate=2026-07-31
?format=json|csv|pdf
?propertyId=xxx
?agentId=xxx
?viewOwnOnly=true
```

### **Commission Management**
```javascript
GET    /commissions                    // List commissions
POST   /commissions/:id/approve        // Approve commission
POST   /commissions/:id/pay            // Mark as paid
GET    /settlements                    // List settlements
POST   /settlements/:id/approve        // Approve settlement
```

---

## 📈 KEY FEATURES

✅ **6-Level Role Hierarchy**
- Clear separation of responsibilities
- Granular permission control
- Role-based data visibility

✅ **B2B Agent Management**
- Self-service branding (logo + colors)
- Commission tracking
- KYC verification workflow
- Multi-user per agent

✅ **Financial Tracking**
- Commission calculation on booking
- Settlement aggregation by period
- Payment status tracking
- Revenue share breakdown

✅ **Role-Specific Dashboards**
- Admin: Full visibility
- MidOffice: Hotel operations
- Finance: Payments & settlements
- Sales: Bookings & commission
- FrontOffice: Daily operations
- B2B Agent: Own performance

✅ **Comprehensive Reporting**
- Period-based analysis
- Export capabilities
- Trend analysis
- Comparative reports

---

**Status:** ✅ Backend services created  
**Next:** Create API controllers and frontend dashboards

---

*See COMPLETE_SYSTEM_SUMMARY.md for full implementation status*
