Product Requirements Document (PRD)
AgriConnect Uganda — MVP

Version: 1.1
Product: AgriConnect Uganda
Backend: Django + Django REST Framework
Web Frontend: React.js + TypeScript
Mobile: React Native + TypeScript
Database: PostgreSQL
Authentication: JWT
API Style: RESTful API
MVP Status: Development Specification

Currency: UGX (Ugandan Shillings) — All monetary values in the system are expressed in UGX unless explicitly stated otherwise.

Size Units: acres, hectares, square_meters — Farm and field sizes must use one of these accepted units.

0. Glossary

Term          Definition
─────────────────────────────────────────────────────────────────
Farm          A top-level agricultural unit owned by a farmer. Contains fields.
Field         A defined plot of land within a farm. Contains crops.
Crop          A planted crop record linked to a specific field and farm.
Activity      A farming action performed on a crop (weeding, fertilization, etc.)
Harvest       A recorded yield from a crop.
Sale          A recorded transaction where a farmer sells produce.
Expense       A recorded cost incurred on a farm or crop.
Listing       A produce advertisement posted by a farmer in the marketplace.
Order         A purchase request created by a buyer against a listing.
Market        A physical agricultural marketplace location.
Market Price  The price of a product at a specific market on a specific date.
Article       An agricultural knowledge content piece managed by admins.

1. Product Overview
1.1 Product Name

AgriConnect Uganda

1.2 Product Description

AgriConnect Uganda is a digital agricultural platform designed to help Ugandan farmers manage their farming activities, understand their farm finances, connect with buyers, and access agricultural market information.

The MVP will consist of a central Django REST Framework API consumed by two clients:
                    AGRICONNECT API
                  Django REST Framework
                           │
             ┌─────────────┴─────────────┐
             │                           │
             ▼                           ▼
      React Web Application       React Native Mobile
         TypeScript                  TypeScript
             │                           │
             └─────────────┬─────────────┘
                           │
                       PostgreSQL

The API will be the central source of business logic and data.

This means the web and mobile applications should not implement separate business rules. Both clients consume the same REST API.

2. Problem Statement

Farmers in Uganda face several challenges that affect their ability to manage farms and maximize the value of their agricultural production.

Major problems include:

Market information gaps

Farmers may lack easy access to current information about:

Produce prices
Different markets
Buyers
Market opportunities

Difficulty finding buyers

Farmers may have agricultural products ready for sale but lack an efficient way to connect with potential buyers.

Poor farm record keeping

Farmers may not maintain organized records for:

Farms
Fields
Crops
Farming activities
Expenses
Harvests
Sales

This makes it difficult to determine whether a farming activity is profitable.

Fragmented agricultural information

Agricultural information is often distributed across different sources, making it difficult for farmers to find relevant information efficiently.

Limited access to agricultural services

Farmers may have difficulty discovering suitable suppliers, transporters, agricultural experts, and other services.

3. Proposed Solution

AgriConnect will provide a centralized digital platform where farmers can:

Create and manage their farms.
Register fields and crops.
Record farming activities.
Record expenses.
Record harvests and sales.
Calculate basic farm profitability.
List agricultural produce for sale.
Search for produce and buyers.
Manage basic marketplace orders.
View agricultural market prices.
Access basic agricultural information.

The MVP will focus on three core value propositions:

Manage your farm → Understand your finances → Find better market opportunities

4. MVP Goals

The MVP should prove that AgriConnect can provide practical value to farmers and marketplace participants.

Primary goals
Goal 1 — Digital farm management

Allow farmers to maintain structured digital records of their farms and agricultural activities.

Goal 2 — Farm financial visibility

Allow farmers to track expenses, harvests, sales, revenue, and basic profit/loss.

Goal 3 — Farmer-to-buyer connection

Provide a marketplace where farmers can advertise agricultural produce and buyers can discover it.

Goal 4 — Market information

Provide agricultural product prices for selected Ugandan markets.

Goal 5 — Multi-platform accessibility
Make the same core functionality available through:

Web
Android/iOS mobile application

5. MVP Non-Goals

The following features will not be part of the initial MVP.

They may be introduced later.

Mobile money payments
Online payment processing
Full logistics management
Real-time GPS delivery tracking
AI crop disease detection
AI farming recommendations
USSD
SMS-based farming services
Agricultural lending
Insurance
Advanced cooperative management
IoT farm sensors
Drone integration
Advanced weather forecasting
Full e-commerce inventory management
International agricultural markets

This keeps the first version achievable.

6. Target Users
6.1 Farmer

The primary user.

A farmer can:

Manage farms
Manage fields
Manage crops
Record activities
Record expenses
Record harvests
Record sales
Create produce listings
Manage orders
View market prices

6.2 Buyer

A buyer can:

Create an account
Browse produce
Search/filter produce
View farmer listings
Contact farmers
Create orders
Track order status

6.3 Administrator

The administrator manages the platform.

Admins can:

Manage users
Manage marketplace listings
Manage agricultural products/categories
Manage markets
Manage market prices
Manage agricultural content
Moderate reported listings
View platform statistics

7. User Roles and Permissions

The MVP will use Role-Based Access Control (RBAC).
User
 │
 ├── Farmer
 │
 ├── Buyer
 │
 └── Administrator

A user should only access resources permitted by their role.

For example:
Farmer
 ├── Create farm
 ├── Create crop
 ├── Add expense
 ├── Add harvest
 ├── Create produce listing
 └── Manage own listings

Buyer
 ├── Browse listings
 ├── Search listings
 ├── Create orders
 └── Manage own orders

Admin
 ├── Manage users
 ├── Manage markets
 ├── Manage prices
 ├── Moderate listings
 └── Manage content

8. System Architecture

The architecture should follow a client-server model.
                   ┌──────────────────────┐
                   │      PostgreSQL      │
                   └──────────▲───────────┘
                              │
                              │
                   ┌──────────┴───────────┐
                   │    Django REST API   │
                   │                      │
                   │ Authentication       │
                   │ Business Logic       │
                   │ Validation            │
                   │ Permissions           │
                   │ Marketplace           │
                   │ Farm Management       │
                   │ Finance               │
                   │ Market Data           │
                   └──────────▲───────────┘
                              │
                    REST / JSON / HTTPS
                              │
             ┌────────────────┴────────────────┐
             │                                 │
      ┌──────▼───────┐                 ┌──────▼───────┐
      │ React Web     │                 │ React Native │
      │ TypeScript    │                 │ TypeScript   │
      └───────────────┘                 └──────────────┘

9. Backend Technology Requirements

The backend will use:

Core
Python
Django
Django REST Framework
PostgreSQL
Authentication
JWT
Access tokens
Refresh tokens
API
REST
JSON
HTTP status codes
Pagination
Filtering
Searching
Ordering

Development quality
Automated tests
API validation
Permissions
Error handling
Logging
Environment variables
API documentation

File Storage
Profile images and listing images will be stored using Django's built-in media file handling for the MVP.
For production, this can be upgraded to cloud storage (AWS S3, Cloudinary) without changing the API contract.

Maximum file sizes:
  Profile image: 5 MB
  Listing image: 10 MB
  Article image: 10 MB

Accepted image formats: JPEG, PNG, WebP

10. Frontend Technology Requirements
Web

The web application will use:

React
TypeScript
React Router
API client
Form validation
Responsive UI
Authentication state management
Mobile

The mobile application will use:

React Native
TypeScript
Navigation
API client
Secure authentication storage
Form validation
Responsive mobile UI
Both clients will consume the same API.

11. Core MVP Modules

The backend should be divided into logical Django applications.

A recommended initial structure is:
backend/
│
├── config/
│
├── apps/
│   ├── accounts/
│   ├── farms/
│   ├── marketplace/
│   ├── finance/
│   ├── markets/
│   └── content/
│
├── manage.py
├── requirements.txt
└── .env

12. Module 1 — Authentication & Accounts
12.1 Registration

Users can register as:

Farmer
Buyer

Admin accounts should preferably be created/managed securely rather than through public registration.

Required information:
Full name
Phone number
Email
Password
Role
Location

Phone Number Format
Phone numbers must be valid Ugandan numbers. Accepted formats:
  +256XXXXXXXXX (international format)
  0XXXXXXXXX (local format)

The system will normalize all phone numbers to +256XXXXXXXXX format before storage.

Password Policy
  Minimum length: 8 characters
  Must contain at least one uppercase letter
  Must contain at least one lowercase letter
  Must contain at least one digit
  Maximum length: 128 characters

12.2 Login

Users authenticate using their credentials.

The API returns:
{
  "access": "...",
  "refresh": "..."
}

12.3 JWT Authentication

The system will implement:

Access token
  Lifetime: 60 minutes
  Used for API authentication via Authorization: Bearer <token> header

Refresh token
  Lifetime: 7 days
  Used to obtain new access tokens

Token refresh
  POST /api/v1/auth/token/refresh/ with refresh token
  Returns new access token

Logout / Token Invalidation Strategy
The MVP will use a token blacklist approach:
  On logout, the refresh token is blacklisted in the database
  The access token expires naturally (short lifetime)
  Blacklisted tokens cannot be used to obtain new access tokens
  This ensures logout is server-side and secure

Protected endpoints
  Any endpoint requiring authentication must include the Authorization header
  Unauthenticated requests receive HTTP 401

12.4 Profile

Users can manage:

Name
Phone
Email
Profile image
Location
Account information

Farmers will additionally maintain farming-related information.

13. Module 2 — Farm Management

A farmer can create one or more farms.

Farm

Attributes:
id
owner
name
location
district
subcounty
size
size_unit
farm_type
description
created_at
updated_at

14. Fields

Each farm can contain multiple fields.

Example:
Okello Family Farm
│
├── Field A
│   └── 4 acres
│
├── Field B
│   └── 3 acres
│
└── Field C
    └── 3 acres

Field information:
id
farm
name
size
size_unit
description
created_at
updated_at

15. Module 3 — Crop Management

Farmers can create crop records associated with fields.

Relationship: A Crop belongs to exactly one Field and one Farm.
The Farm reference is derived from the Field's parent farm. When creating a crop, the farmer provides the field_id; the system automatically resolves the farm_id from the field.

Crop record
id
farm (auto-resolved from field)
field (required, provided by farmer)
crop_type
variety
planting_date
expected_harvest_date
status
notes
created_at
updated_at

Possible statuses:
PLANNED
PLANTED
GROWING
READY_FOR_HARVEST
HARVESTED
COMPLETED
CANCELLED

16. Crop Activities

Farmers can record activities associated with crops.

Examples:

Land preparation
Planting
Weeding
Fertilization
Pest control
Irrigation
Harvesting

Activity:
id
crop
activity_type
date
description
cost
notes
created_at
updated_at

17. Module 4 — Farm Finance

The finance module will provide basic accounting functionality.

17.1 Expenses

Farmers can record:

Expense
farm
crop (optional)
category
amount
date
description
created_at
updated_at

Categories:

Seeds
Fertilizer
Pesticides
Labour
Transport
Equipment
Feed
Veterinary
Land preparation
Other

18. Harvest Records

Farmers can record harvested produce.

Harvest
farm
crop
quantity
unit
harvest_date
notes
created_at
updated_at

Example:

Crop: Maize
Quantity: 2,500
Unit: kg
Date: 20 September 2026

19. Sales Records

Farmers can record produce sales.

Sale
farmer (auto)
farm
crop
quantity
unit_price
total_amount (calculated)
buyer_name (optional, for offline sales)
buyer_contact (optional)
sale_date
created_at
updated_at

The system calculates:

Total = Quantity × Unit Price

20. Farm Profitability

The dashboard should provide basic calculations.

Total Expenses
       +
Total Revenue
       ↓
Profit / Loss

Example:

Total expenses: UGX 2,000,000

Revenue:        UGX 4,500,000

Profit:         UGX 2,500,000

The system should also allow filtering by:

Farm
Crop
Season/time period

21. Module 5 — Marketplace

The marketplace connects farmers and buyers.

21.1 Produce Categories

Initial categories might include:

Cereals
Legumes
Fruits
Vegetables
Roots and tubers
Coffee
Livestock
Other agricultural products

These should be database-driven rather than hard-coded.

22. Produce Listings

Farmers can create listings.

Example:

Product: Maize
Quantity: 2,500 kg
Price: UGX 1,400/kg
Location: Lira
Available from: 20/09/2026
Description: Dried maize grain
Image: (optional photo of produce)

Listing attributes:
id
farmer (auto)
product_name
category
quantity (original total quantity)
quantity_remaining (tracks unsold quantity, starts equal to quantity)
unit
price_per_unit
location
district
available_from
description
image (optional, max 10MB)
status
created_at
updated_at

Listing statuses:

DRAFT
ACTIVE
SOLD (auto-set when quantity_remaining reaches 0)
EXPIRED (auto-set when available_from passes a defined window, e.g., 90 days)
CANCELLED (set by farmer)

Listing Quantity Tracking
When a farmer creates a listing with quantity = 2500 kg:
  quantity_remaining starts at 2500 kg
  When a buyer places an order for 500 kg, quantity_remaining decreases to 2000 kg
  When quantity_remaining reaches 0, status auto-changes to SOLD
  Orders cannot be placed when quantity_remaining is 0 or status is not ACTIVE

Listing Images
Farmers can optionally upload one image per listing.
  Max file size: 10 MB
  Accepted formats: JPEG, PNG, WebP
  Images are served via Django media URL

Listing Expiration
  Listings have an automatic expiration window of 90 days from available_from date
  A management command (or Celery task) runs daily to mark expired listings
  Expired listings change status to EXPIRED and are no longer searchable by buyers
  Farmers can reactivate an expired listing by updating the available_from date

23. Marketplace Search

Buyers should be able to search listings by:

Product
Category
Location
Price
Quantity
Farmer
Date

Example:

GET /api/v1/marketplace/listings/?search=maize

Filtering:

?category=maize&district=lira

24. Marketplace Listing Details

A listing page should display:

Product
Quantity (remaining / total)
Price
Location
Farmer (name only, not phone/email)
Date listed
Availability
Description
Image (if available)
Contact/order options

The system should avoid exposing unnecessary private farmer information.

25. Module 6 — Orders

Buyers can create orders from active listings.

Basic flow:

Buyer
  ↓
Find listing
  ↓
Select quantity (must not exceed quantity_remaining)
  ↓
Submit order
  ↓
Farmer receives order notification
  ↓
Farmer accepts/rejects
  ↓
Order processed
  ↓
Buyer receives produce (offline)
  ↓
Farmer marks as completed
  ↓
Completed

Order statuses:

PENDING
ACCEPTED
REJECTED
CANCELLED
COMPLETED

Order attributes:
id
listing
buyer
quantity
total_price (calculated: quantity × listing.price_per_unit)
status
notes (optional message from buyer)
farmer_notes (optional message from farmer)
created_at
updated_at

Payment is not required in the MVP.

The MVP can treat payment and physical delivery as offline processes.

Order Quantity Validation
  Requested quantity must be > 0
  Requested quantity must not exceed listing.quantity_remaining
  When order is accepted, listing.quantity_remaining decreases by order quantity
  When order is rejected or cancelled, quantity is restored to listing

26. Module 7 — Market Information

The system will provide agricultural market information.

Markets

A market record contains:

name
district
location
description
status (active/inactive)
created_at
updated_at

Example:

Lira Main Market
Lira District

27. Market Prices

Administrators can add market prices.

Product
Market
Price
Unit
Date
Source
created_at
updated_at

Example:

Product: Maize
Market: Lira
Price: UGX 1,400
Unit: kg
Date: 10/09/2026

Farmers can view current prices.

28. Price History

The system should preserve historical prices rather than overwriting old values.

This allows:

June     UGX X
July     UGX X
August   UGX X
September UGX X

The web/mobile clients can later display this as a chart.

29. Module 8 — Agricultural Content

The MVP should contain a simple agricultural knowledge section.

Administrators can create:

Articles
Farming guides
Crop guides
Livestock guides
Pest information
Disease information

Example:

Title:
Maize Production Guide

Category:
Crops

Crop:
Maize

Image: (optional, max 10MB)

Content:
...

Users can browse and search the content.

30. Module 9 — Notifications

The MVP will implement basic in-app notifications to keep users informed of important events.

Notification Types:
  Order received (farmer) — when a buyer places an order on their listing
  Order accepted (buyer) — when a farmer accepts their order
  Order rejected (buyer) — when a farmer rejects their order
  Order completed (buyer) — when a farmer marks order as completed

Notification attributes:
id
user (recipient)
notification_type
title
message
is_read
related_object_type (listing, order, etc.)
related_object_id
created_at

Notification behavior:
  Notifications are created by the system when relevant events occur
  Users can mark notifications as read
  Users can view a list of their notifications with unread count
  Notifications are not sent via push notification or email in MVP (in-app only)

API Endpoints:
  GET    /api/v1/notifications/          — list notifications
  GET    /api/v1/notifications/unread/   — get unread count
  PATCH  /api/v1/notifications/{id}/     — mark as read
  POST   /api/v1/notifications/mark-all-read/ — mark all as read

31. Dashboard Requirements
Farmer Dashboard

The farmer should see:

My Farms
Active Crops
Total Expenses
Total Revenue
Estimated Profit
Active Listings
Pending Orders
Market Prices

Example:
┌─────────────────────────────────┐
│       FARMER DASHBOARD          │
├─────────────────────────────────┤
│ Farms             3             │
│ Active Crops      7             │
│ Expenses          UGX 2.4M      │
│ Revenue           UGX 4.8M      │
│ Profit            UGX 2.4M      │
│                                 │
│ Active Listings   5             │
│ Pending Orders    2             │
└─────────────────────────────────┘

32. Buyer Dashboard

The buyer dashboard should show:

Recent listings
Orders
Pending orders
Completed orders
Saved/favorite listings, if implemented

33. Admin Dashboard

The administrator should see:

Total users
Farmers
Buyers
Active listings
Orders
Markets
Market prices
Published articles
Reported listings

34. REST API Requirements

The API should use versioning.

Recommended base URL:

/api/v1/

Example:

/api/v1/auth/
/api/v1/farms/
/api/v1/marketplace/
/api/v1/markets/
/api/v1/content/
/api/v1/notifications/

35. API Response Format

All API responses must follow a consistent format.

Success Response (single object):
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "Okello Family Farm",
    ...
  }
}

Success Response (list with pagination):
{
  "status": "success",
  "data": [...],
  "pagination": {
    "count": 150,
    "page": 2,
    "page_size": 20,
    "total_pages": 8
  }
}

Error Response:
{
  "status": "error",
  "message": "Validation failed",
  "errors": {
    "field_name": ["Error message 1", "Error message 2"]
  }
}

Unprocessable Entity (422):
{
  "status": "error",
  "message": "Invalid input",
  "errors": {
    "amount": ["Amount must be greater than zero."]
  }
}

Not Found (404):
{
  "status": "error",
  "message": "Resource not found"
}

Permission Denied (403):
{
  "status": "error",
  "message": "You do not have permission to perform this action"
}

36. Initial API Endpoint Specification
Authentication
POST   /api/v1/auth/register/
POST   /api/v1/auth/login/
POST   /api/v1/auth/token/refresh/
POST   /api/v1/auth/logout/
GET    /api/v1/auth/me/
PATCH  /api/v1/auth/me/
Farms
GET     /api/v1/farms/
POST    /api/v1/farms/

GET     /api/v1/farms/{id}/
PATCH   /api/v1/farms/{id}/
DELETE  /api/v1/farms/{id}/
Fields
GET     /api/v1/farms/{farm_id}/fields/
POST    /api/v1/farms/{farm_id}/fields/

GET     /api/v1/fields/{id}/
PATCH   /api/v1/fields/{id}/
DELETE  /api/v1/fields/{id}/
Crops
GET     /api/v1/crops/
POST    /api/v1/crops/

GET     /api/v1/crops/{id}/
PATCH   /api/v1/crops/{id}/
DELETE  /api/v1/crops/{id}/
Crop Activities
GET     /api/v1/crops/{crop_id}/activities/
POST    /api/v1/crops/{crop_id}/activities/
Expenses
GET     /api/v1/finance/expenses/
POST    /api/v1/finance/expenses/

GET     /api/v1/finance/expenses/{id}/
PATCH   /api/v1/finance/expenses/{id}/
DELETE  /api/v1/finance/expenses/{id}/
Harvests
GET     /api/v1/finance/harvests/
POST    /api/v1/finance/harvests/

GET     /api/v1/finance/harvests/{id}/
PATCH   /api/v1/finance/harvests/{id}/
DELETE  /api/v1/finance/harvests/{id}/
Sales
GET     /api/v1/finance/sales/
POST    /api/v1/finance/sales/

GET     /api/v1/finance/sales/{id}/
PATCH   /api/v1/finance/sales/{id}/
DELETE  /api/v1/finance/sales/{id}/
Marketplace
GET     /api/v1/marketplace/listings/
POST    /api/v1/marketplace/listings/

GET     /api/v1/marketplace/listings/{id}/
PATCH   /api/v1/marketplace/listings/{id}/
DELETE  /api/v1/marketplace/listings/{id}/
Orders
GET     /api/v1/marketplace/orders/
POST    /api/v1/marketplace/orders/

GET     /api/v1/marketplace/orders/{id}/
PATCH   /api/v1/marketplace/orders/{id}/
Markets
GET     /api/v1/markets/
POST    /api/v1/markets/

GET     /api/v1/markets/{id}/
PATCH   /api/v1/markets/{id}/
DELETE  /api/v1/markets/{id}/
Market Prices
GET     /api/v1/markets/prices/
GET     /api/v1/markets/prices/{id}/

Admins:

POST    /api/v1/markets/prices/
PATCH   /api/v1/markets/prices/{id}/
DELETE  /api/v1/markets/prices/{id}/
Agricultural Content
GET     /api/v1/content/articles/
GET     /api/v1/content/articles/{id}/

Admins:

POST    /api/v1/content/articles/
PATCH   /api/v1/content/articles/{id}/
DELETE  /api/v1/content/articles/{id}/
Notifications
GET     /api/v1/notifications/
GET     /api/v1/notifications/unread/
PATCH   /api/v1/notifications/{id}/
POST    /api/v1/notifications/mark-all-read/

37. Frontend Web Requirements

The React TypeScript application should have the following major sections:

Web Application
│
├── Public
│   ├── Home
│   ├── Marketplace
│   ├── Market Prices
│   ├── Agricultural Guides
│   ├── Login
│   └── Register
│
├── Farmer
│   ├── Dashboard
│   ├── Farms
│   ├── Fields
│   ├── Crops
│   ├── Activities
│   ├── Expenses
│   ├── Harvests
│   ├── Sales
│   ├── Listings
│   ├── Orders
│   └── Notifications
│
├── Buyer
│   ├── Dashboard
│   ├── Marketplace
│   ├── Orders
│   └── Notifications
│
└── Admin
    ├── Dashboard
    ├── Users
    ├── Listings
    ├── Markets
    ├── Prices
    └── Content

38. React Native Requirements

The mobile application will expose the most important farmer and buyer workflows.

Priority mobile screens:

Authentication
    ↓
Dashboard
    ↓
My Farms
    ↓
Crops
    ↓
Expenses
    ↓
Harvests
    ↓
Marketplace
    ↓
Orders
    ↓
Market Prices
    ↓
Notifications

The mobile application should be optimized for:

Small screens
Touch interaction
Lower bandwidth
Intermittent connectivity where practical
Simple navigation
Minimal unnecessary data transfer

39. Shared API Contract

Because we have both React Web and React Native clients, the API contract is extremely important.

Both applications should consume the same endpoints.
                 Django REST API
                       │
              ┌────────┴────────┐
              │                 │
          React Web        React Native
              │                 │
              └───────┬─────────┘
                      │
                Same JSON API

40. API Security Requirements

The backend must enforce security independently of the clients.

Required:

JWT authentication
Password hashing (bcrypt via Django's make_password)
Role-based permissions
Object-level ownership checks
Input validation
CSRF protection where applicable
CORS configuration
Rate limiting/throttling
Secure HTTP headers
Environment-based secrets
No passwords/tokens in logs
Database constraints
Soft deletes for important records

A farmer must not be able to manipulate another farmer's farm by simply changing an ID in the URL.

For example:

PATCH /api/v1/farms/25/

must verify:

Does the authenticated user own farm #25?

Soft Deletes
All models with a DELETE endpoint must use soft deletes:
  A boolean field `is_deleted` (default False) and `deleted_at` (nullable) are added
  DELETE sets is_deleted=True and deleted_at=timestamp
  All default queries filter out soft-deleted records
  Only admins can view or restore soft-deleted records
  This preserves data integrity and allows audit trails

This applies to:
  Farms, Fields, Crops, Activities, Expenses, Harvests, Sales
  Listings, Orders
  Articles

41. Validation Requirements

The API must validate data before saving it.

Examples:

Farm
Size must be greater than zero.
Required location fields must be supplied.
Crop
Planting date should not be invalid.
Crop must belong to a field owned by the farmer.
The system auto-resolves farm from field.
Expense
Amount must be positive.
Date must be valid.
Listing
Quantity must be greater than zero.
Price must be greater than zero.
Only farmers can create produce listings.
Order
Requested quantity must be greater than zero.
Requested quantity must not exceed listing.quantity_remaining.
Order can only be placed on ACTIVE listings.

42. Error Handling

The API should return consistent errors.

See Section 35 (API Response Format) for the exact error response structure.

All errors follow the same JSON format with status, message, and optional errors object.

43. Pagination

Large collections should not be returned in one response.

Default page size: 20
Maximum page size: 100

Example:

GET /api/v1/marketplace/listings/?page=2&page_size=20

The API should return pagination metadata.

This is particularly important for the marketplace.

44. Search, Filtering and Ordering

The marketplace should support:

Search
?search=maize
Filtering
?category=1
&district=Lira
&min_price=1000
&max_price=2000
Ordering
?ordering=price

or:

?ordering=-created_at

45. Database Requirements

PostgreSQL will be the primary database.

The high-level relationship model will resemble:
User
 │
 ├───────────────┐
 │               │
 ▼               ▼
Farm            Marketplace Listing
 │                       │
 ▼                       ▼
Field                   Order
 │
 ▼
Crop
 │
 ├── Crop Activity
 │
 └── Harvest

Farm
 │
 ├── Expense
 │
 └── Sale

Market
 │
 └── Market Price

Article
 │
 └── Category

User (notification recipient)
 │
 └── Notification

Database Migrations Workflow
  All schema changes must be made via Django migrations
  Never manually alter production database schema
  Migration files are committed to version control
  Run makemigrations in development, test migrations before applying to production
  Use Django's migration squashing for accumulated migrations before major releases
  Backward-compatible migrations preferred — avoid breaking existing API consumers

Database Indexing Strategy
  Index all foreign key fields
  Index fields used in filtering: district, status, created_at, category
  Index fields used in search: product_name, name (using PostgreSQL full-text search or trigram)
  Composite index on (listing_id, status) for order queries
  Composite index on (farm_id, is_deleted) for farm queries

46. Caching Strategy

The MVP will implement basic caching for frequently accessed, rarely changing data.

Cached data:
  Produce categories — cache for 24 hours
  Market list — cache for 24 hours
  Market prices — cache for 1 hour (prices change daily)
  Agricultural articles list — cache for 6 hours

Cache invalidation:
  Cache is invalidated when underlying data is updated (via Django signals or manual invalidation)
  Admin updates to categories/markets/prices immediately invalidate relevant cache

Cache backend:
  MVP uses Django's local-memory caching
  Production can upgrade to Redis without API changes

This reduces database load for read-heavy public endpoints.

47. Data Seeding

The system requires initial data to function properly.

Seeded data (via Django fixtures or management commands):
  Admin superuser account (created via createsuperuser command)
  Produce categories (Cereals, Legumes, Fruits, Vegetables, Roots and tubers, Coffee, Livestock, Other)
  Expense categories (Seeds, Fertilizer, Pesticides, Labour, Transport, Equipment, Feed, Veterinary, Land preparation, Other)
  Sample markets (at least 5 major Ugandan markets: Kampala, Lira, Gulu, Mbarara, Jinja)

Seeding approach:
  Use Django data migrations for categories (they rarely change)
  Use management commands for admin accounts and sample data
  Sample data is optional and only for development/demo environments

48. Rate Limiting / Throttling

The API must implement rate limiting to prevent abuse and ensure fair usage.

Throttle scopes and rates:

Anonymous (unauthenticated):
  Rate: 100 requests/hour
  Scope: ip-based

Authenticated (farmer/buyer):
  Rate: 1000 requests/hour
  Scope: user-based

Admin:
  Rate: 2000 requests/hour
  Scope: user-based

Burst rate (all users):
  30 requests/minute

Specific endpoint throttles:
  Login: 10 attempts per minute per IP (brute force protection)
  Register: 5 attempts per minute per IP
  Token refresh: 20 requests per minute per user

Throttle response:
HTTP 429 Too Many Requests
{
  "status": "error",
  "message": "Rate limit exceeded. Please try again later.",
  "retry_after": 3600
}

49. Testing Requirements

Testing is a first-class requirement.

Backend

We should implement:

Unit tests

Test:

Models
Utility functions
Business logic
Calculations
API tests

Test:

Authentication
Permissions
CRUD
Validation
Filtering
Searching
Ordering
Integration tests

Test workflows such as:

Register farmer
      ↓
Create farm
      ↓
Create field
      ↓
Create crop
      ↓
Record expense
      ↓
Record harvest
      ↓
Record sale
      ↓
Calculate profitability

Marketplace:

Register farmer
      ↓
Create listing
      ↓
Register buyer
      ↓
Search listing
      ↓
Create order
      ↓
Farmer accepts
      ↓
Complete order

50. Frontend Testing

React web:

Component tests
Form validation tests
API integration tests
Authentication tests
Protected-route tests

React Native:

Component tests
Navigation tests
Authentication tests
API integration tests

51. CI/CD Requirements

GitHub Actions should automatically execute checks when code is pushed or a pull request is opened.

Example:

Developer
    ↓
Git push
    ↓
GitHub
    ↓
GitHub Actions
    │
    ├── Backend tests
    ├── Frontend tests
    ├── Mobile tests
    ├── Linting
    ├── Type checking
    └── Build verification
    ↓
PASS / FAIL

Pull requests should not be merged if required checks fail.

52. Deployment Architecture

The MVP should be designed for deployment without Docker/containerization.

A possible deployment architecture is:

                 Internet
                    │
          ┌─────────┴─────────┐
          │                   │
          ▼                   ▼
    React Web              Mobile App
     Hosting                   │
          │                    │
          └──────────┬─────────┘
                     ▼
             Django REST API
                     │
                     ▼
                PostgreSQL

The backend, web application, and database can be deployed as separate services.

This keeps the deployment architecture straightforward while allowing the system to scale later.

53. Non-Functional Requirements
Performance

API responses should normally return within an acceptable response time under normal load.

The API should use:

Pagination
Database indexing
Efficient queries
Query optimization
Caching (see Section 46)
Scalability

The architecture should allow future addition of:

Mobile money
Weather
SMS/USSD
AI
Notifications
Logistics
Financing

without major architectural changes.

Availability

The production system should be designed to minimize downtime.

Security

User data must be protected through:

Authentication
Authorization
Encryption in transit
Secure password storage
Input validation
Secure token handling
Usability

The system should be usable by people with varying levels of digital literacy.

The UI should prioritize:

Simple navigation
Clear terminology
Large touch targets
Clear error messages
Minimal steps
Mobile responsiveness

54. Low-Connectivity Considerations

This is particularly important for the target market.

The MVP should minimize unnecessary data usage.

Web
Responsive design
Optimized images
Pagination
Avoid unnecessarily large API responses
Mobile

The architecture should eventually support:

Local caching
Offline viewing of previously loaded information
Queued operations
Synchronization when connectivity returns

Full offline synchronization does not have to be implemented in MVP, but the application should be designed so it can be added later.

55. MVP User Journeys
Farmer Journey
Register
   ↓
Complete profile
   ↓
Create farm
   ↓
Create field
   ↓
Add crop
   ↓
Record activities
   ↓
Record expenses
   ↓
Record harvest
   ↓
Record sale
   ↓
View profitability
   ↓
Create marketplace listing
   ↓
Receive buyer order notification
   ↓
Accept/reject order

56. Buyer Journey
Register
   ↓
Complete profile
   ↓
Browse marketplace
   ↓
Search produce
   ↓
Filter by location/product/price
   ↓
View listing
   ↓
Select quantity
   ↓
Create order
   ↓
Receive order accepted/rejected notification
   ↓
Complete transaction offline

57. Administrator Journey
Login
  ↓
Admin Dashboard
  ↓
Manage users
  ↓
Manage marketplace
  ↓
Manage markets
  ↓
Add market prices
  ↓
Manage agricultural content
  ↓
Moderate reported content

58. MVP Acceptance Criteria

The MVP can be considered functionally complete when:

Authentication
 Farmer can register.
 Buyer can register.
 Users can log in.
 Users can refresh JWT tokens.
 Users can log out (refresh token is blacklisted).
 Protected endpoints require authentication.
 Role permissions work correctly.
 Password policy is enforced.
 Phone numbers are validated and normalized.
Farm Management
 Farmer can create a farm.
 Farmer can update a farm.
 Farmer can delete a farm (soft delete).
 Farmer can create fields.
 Farmer can create crops (farm auto-resolved from field).
 Farmer can record crop activities.
Finance
 Farmer can create expenses.
 Farmer can record harvests.
 Farmer can record sales.
 System calculates revenue.
 System calculates expenses.
 System calculates basic profit/loss.
Marketplace
 Farmer can create listing with optional image.
 Farmer can update listing.
 Farmer can deactivate listing.
 Listing quantity_remaining tracks available stock.
 Buyer can search listings.
 Buyer can filter listings.
 Buyer can view listing details.
 Buyer can create an order (quantity validated against remaining).
 Farmer can accept/reject an order (quantity adjusted on accept).
 Order status can be updated.
 Notifications are created for order events.
Markets
 Admin can create markets.
 Admin can add market prices.
 Farmers can view prices.
 Historical prices remain available.
Content
 Admin can publish agricultural articles.
 Users can browse articles.
 Users can search articles.
Notifications
 Users receive in-app notifications for order events.
 Users can view notification list.
 Users can mark notifications as read.
Applications
 Web application consumes the API.
 Mobile application consumes the API.
 Authentication works on both clients.
 Main farmer workflows work on both platforms.

59. Recommended Development Phases

We should not build the whole system at once.

The implementation should follow this order.

Phase 1 — Project Foundation
Backend
 ├── Django project
 ├── DRF
 ├── PostgreSQL
 ├── Environment configuration
 ├── API versioning
 ├── API response format
 └── Testing setup

Frontend:

React + TypeScript
 ├── Routing
 ├── API client
 ├── Authentication architecture
 └── UI foundation

Mobile:

React Native + TypeScript
 ├── Navigation
 ├── API client
 └── Authentication architecture

Phase 2 — Accounts

Implement completely:

Registration (with phone validation and password policy)
Login
JWT (with token lifetimes)
Refresh
Logout (with token blacklist)
Profile
Roles
Permissions

Then test every endpoint.

Phase 3 — Farm Management

Implement:

Farms (with soft deletes)
Fields
Crops (with farm auto-resolution from field)
Crop Activities

Then connect them to the web application.

Then connect them to React Native.

Phase 4 — Finance

Implement:

Expenses
Harvests
Sales
Revenue
Profit/Loss

Then create the farmer financial dashboard.

Phase 5 — Marketplace

Implement:

Categories
Listings (with images, quantity tracking, expiration)
Search
Filtering
Orders (with quantity validation and adjustment)
Order statuses

This is one of the most important MVP phases.

Phase 6 — Market Information

Implement:

Markets
Market prices
Historical prices
Filtering
Price trends

Phase 7 — Agricultural Content

Implement:

Categories
Articles (with optional images)
Search
Admin content management

Phase 8 — Notifications

Implement:

Notification model
Order-related notifications
In-app notification list and unread count
Mark as read functionality

Phase 9 — Testing & Hardening

Perform:

Backend testing
Frontend testing
Mobile testing
Security testing
API validation
Permission testing
Performance testing
Error handling
Database optimization
Rate limiting verification
Caching verification

Phase 10 — Deployment

Deploy:

PostgreSQL
     ↓
Django REST API
     ↓
React Web
     ↓
React Native mobile build

GitHub Actions will automate quality checks and deployment workflows where appropriate.
