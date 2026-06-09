# Salvation Army Emergency Services Asset Register Specification

## 1. System Overview

Build a Progressive Web Application for Salvation Army Emergency Services Victoria to manage assets, consumables, plant, fleet, deployments, maintenance, stock movements, QR scanning, document storage, audit history, and professional reporting.

The system must work on:
- Laptops/desktops
- iOS tablets/phones
- Android tablets/phones

It must support offline use and synchronise when internet connectivity returns.

---

## 2. User Roles

### System Admin
Can:
- Manage users
- Manage locations
- Manage asset categories
- Manage consumable categories
- Manage system settings
- View all reports
- Export reports
- Archive/soft delete records
- Access audit trail

### User
Can:
- Add assets
- Edit assets
- Add/edit consumable batches
- Record stock movements
- Check assets in/out
- Record deployments
- Record maintenance activities
- Upload documents/photos
- View dashboard and reports

No approval workflow is required. Users make changes directly, with a full audit trail.

---

## 3. Locations

The system must support multiple Victorian locations, including:
- Warehouses
- Storage facilities
- Temporary deployment locations

### Features
- Add location
- Edit location
- Soft delete/archive location
- View assets at location
- View consumables at location
- View stock thresholds by location
- Generate location-based reports

Future expansion should allow other states to be added later.

---

## 4. Asset Management

Non-consumable assets must be tracked individually.

### Asset Fields
- Unique Asset ID
- QR Code
- Asset Name
- Category
- Description
- Serial Number
- Make
- Model
- Purchase Date
- Purchase Cost
- Replacement Value
- Current Value (optional)
- Current Location
- Status
- Parent Asset Assignment
- Assigned Deployment (optional)
- Notes
- Photos/Documents
- Audit History

### Asset Statuses
- Available
- Deployed
- In Transit
- Under Maintenance
- Damaged
- Retired
- Lost/Stolen

---

## 5. Parent/Child Asset Relationships

Assets can be assigned to another asset or plant item.

### Examples
- Generator assigned to Trailer 01
- Radio kit assigned to Truck 02
- First aid kit assigned to Ute 03

### Requirements
- Parent asset tracking
- Child asset tracking
- Automatic movement with parent asset
- Assignment history

---

## 6. Consumables Management

Consumables are tracked by batch/lot.

### Examples
- Mattresses
- Blankets
- Sheets
- Hygiene Kits
- Food Packs

### Batch Fields
- Item Name
- Category
- Batch/Lot Number
- Quantity Received
- Quantity On Hand
- Unit Cost
- Replacement Cost
- Total Batch Value
- Date Received
- Supplier/Donor
- Expiry Date (optional)
- Location
- QR Code
- Stock Movement History
- Adjustment History
- Documents/Photos

### Requirements
- FIFO stock management
- Batch traceability
- Full movement history

---

## 7. Stock Movements

### Movement Types
- Received
- Issued
- Transferred
- Returned
- Adjusted
- Written Off
- Stocktake Variance

### Movement Fields
- Item/Batch
- Quantity
- From Location
- To Location
- Reason/Purpose
- Related Deployment (optional)
- User
- Date/Time
- Notes

### Movement Reasons
Configurable values including:
- Flood Response
- Fire Response
- Training Exercise
- Community Support
- Stock Transfer
- Maintenance
- Disposal/Write-Off

---

## 8. Minimum Stock Levels

Support minimum stock thresholds by consumable and location.

### Features
- Minimum stock level
- Current stock level
- Low stock alert
- Out-of-stock alert
- Dashboard alerts
- Low stock reports

---

## 9. Plant and Fleet Management

### Examples
- Trucks
- Utes
- Trailers
- Forklifts
- Generators

### Additional Fields
- Registration Number
- Registration Expiry
- Insurance Expiry
- Roadworthy/Compliance Date
- Odometer Reading
- Hour Meter Reading
- Fuel Type (optional)
- Service Provider
- Maintenance Schedule
- Attached Assets

---

## 10. Planned Maintenance

### Maintenance Schedule Fields
- Asset/Plant Item
- Maintenance Type
- Service Interval by Date
- Service Interval by Odometer/Hours
- Next Service Due Date
- Next Service Due Reading
- Service Provider
- Reminder Threshold
- Status

### Maintenance Record Fields
- Date
- Service Type
- Description
- Cost
- Supplier/Provider
- Odometer/Hour Reading
- Documents/Invoices
- Photos
- Notes
- Recorded By

### Alerts
- Maintenance Due Soon
- Overdue Maintenance
- Registration Expiry
- Insurance Expiry

---

## 11. Deployment Management

### Deployment Fields
- Deployment ID
- Deployment Name
- Purpose/Reason
- Deployment Location/Site
- Team Name
- Team Leader (optional)
- Contact Number (optional)
- Start Date/Time
- Expected Return Date/Time
- Actual Return Date/Time
- Status
- Plant/Vehicles Deployed
- Assets Assigned
- Consumables Issued
- Notes
- Damage/Fault Notes
- Documents/Photos

### Deployment Statuses
- Planned
- Active
- Returned
- Closed

---

## 12. QR Code Scanning

QR codes must be generated for:
- Assets
- Plant/Vehicles
- Consumable Batches
- Locations

### QR Features
- Scan to View
- Scan to Check In/Out
- Scan to Move Asset
- Scan During Stocktake
- Scan to Issue Consumables
- Print QR Labels

### Device Support
- iOS
- Android
- Tablets
- Mobile Phones
- Laptops with Camera Support

---

## 13. Offline Capability

The application must function offline on:
- Laptop
- Tablet
- Mobile Phone

### Offline Activities
- View cached data
- Scan QR codes
- Add/edit assets
- Record stock movements
- Check assets in/out
- Record deployments
- Record maintenance
- Upload photos/documents
- Perform stocktakes

### Synchronisation
When internet returns:
- Automatic sync
- Conflict handling
- Audit preservation
- No silent data loss

### Recommended Architecture
Progressive Web Application (PWA) with:
- Local database
- Sync engine
- Offline-first design

---

## 14. Document Storage

### Supported Attachments
- PDF
- JPG
- PNG
- DOCX
- XLSX
- Invoices
- Registration Certificates
- Insurance Certificates
- Compliance Documents
- User Manuals
- Warranty Documents

### Attachment Locations
- Assets
- Plant/Vehicles
- Maintenance Records
- Deployments
- Consumable Batches
- Locations

---

## 15. Dashboard

Users should see a live dashboard immediately after login.

### Dashboard Tiles
- Total Assets
- Assets by Status
- Total Consumable Stock
- Low Stock Items
- Out-of-Stock Items
- Upcoming Maintenance
- Overdue Maintenance
- Registration/Insurance Expiry
- Active Deployments
- Assets Overdue for Return
- Recent Asset Movements
- Recent Stock Movements

### Alerts
Alerts must be clickable and open the related records.

---

## 16. Audit Trail

Every important action must be recorded.

### Audit Fields
- User
- Date/Time
- Action Type
- Record Affected
- Old Value
- New Value
- Device/Source (optional)
- Offline Sync Reference (optional)

### Audited Modules
- Assets
- Consumables
- Locations
- Deployments
- Maintenance
- Users
- Stock Movements

---

## 17. Reporting

### Export Formats
- PDF
- XLSX
- CSV

### Branding
Support configurable:
- Salvation Army Logo
- Brand Colours
- Report Titles
- Generated Date/Time
- Prepared By
- Filters Applied
- Page Numbers

### Reports

#### Assets
- Asset Register
- Assets by Location
- Assets by Status
- Asset Replacement Value

#### Consumables
- Inventory Report
- Consumables by Location
- Low Stock Report
- Stock Movement Report
- Stocktake Variance Report

#### Maintenance
- Maintenance Due Report
- Maintenance History Report
- Registration Expiry Report
- Insurance Expiry Report

#### Deployments
- Deployment History
- Asset Check-In/Check-Out Report

#### Governance
- Audit Trail Report
- Document Register Report

---

## 18. Future Features

Not required for Version 1.

### Future Roadmap
- Configurable Forms
- Vehicle Pre-Departure Checklists
- Vehicle Return Checklists
- Maintenance Checklists
- Digital Signatures
- Safety Inspections
- Multi-State Support
- Personnel Register
- Approval Workflows

---

## 19. Core Data Entities

- User
- Role
- Permission
- Location
- Asset
- AssetCategory
- AssetAssignment
- ConsumableItem
- ConsumableBatch
- StockMovement
- StockThreshold
- PlantDetails
- MaintenanceSchedule
- MaintenanceRecord
- Deployment
- DeploymentAsset
- DeploymentConsumable
- DocumentAttachment
- AuditLog
- ReportTemplate
- SystemSetting

---

## 20. MVP Deliverables

Version 1 must deliver:

- Victoria-only operation
- System Admin and User roles
- Location management with soft delete
- Individual asset register
- Consumable batch tracking
- Stock movements
- Minimum stock alerts
- Fleet and plant management
- Planned maintenance
- Deployments
- QR code scanning
- Offline laptop/tablet/mobile support
- Document attachments
- Dashboard with alerts
- Full audit trail
- Professional PDF/XLSX/CSV reporting

---

## Recommended Technology Stack

### Frontend
- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui

### Backend
- Supabase
- PostgreSQL
- Row Level Security

### Mobile & Offline
- Progressive Web App (PWA)
- IndexedDB
- Service Workers

### File Storage
- Supabase Storage

### Reporting
- PDF Generation
- XLSX Export
- CSV Export

### Authentication
- Supabase Auth

### Hosting
- Vercel