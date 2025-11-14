# Project Management Enhancements - Phase 1: Monthly Revenue/Loss Tracking

## Overview
Phase 1 introduces a comprehensive monthly financial tracking system for projects, allowing users to record and monitor revenue and expenses on a monthly basis.

## Features Implemented

### 1. Monthly Financial Tracking
- Track monthly revenue and expenses for each project
- Automatic calculation of net profit/loss
- Unique constraint to prevent duplicate entries for the same month/year
- Historical tracking with year and month indexing

### 2. Database Schema

**Table: `project_monthly_financials`**
```sql
- id: BIGSERIAL PRIMARY KEY
- project_id: BIGINT (Foreign Key to projects)
- month: INTEGER (1-12)
- year: INTEGER (2000+)
- revenue: DECIMAL(12, 2)
- expenses: DECIMAL(12, 2)
- net_profit_loss: DECIMAL(12, 2) (Auto-calculated: revenue - expenses)
- notes: TEXT
- created_at: TIMESTAMP
- updated_at: TIMESTAMP
- UNIQUE(project_id, month, year)
```

### 3. API Methods Added

**projectsService.js**
- `getMonthlyFinancials(projectId)` - Fetch all monthly records for a project
- `addMonthlyFinancial(data)` - Add new monthly financial record
- `updateMonthlyFinancial(id, data)` - Update existing monthly record
- `deleteMonthlyFinancial(id)` - Delete monthly record

### 4. UI Components

**New Tab: "Monthly Updates"**
- View all monthly financial records across projects
- Add new monthly updates with revenue and expenses
- Edit existing monthly records
- Delete monthly records
- Real-time net profit/loss calculation
- Search and filter functionality

**Form Fields:**
- Project selection (dropdown)
- Month selection (dropdown)
- Year input
- Revenue amount
- Expenses amount
- Notes (optional)
- Live preview of net profit/loss

## Installation Steps

### 1. Run Database Migration
Execute the SQL file in your Supabase SQL Editor:
```bash
sql/project_monthly_financials.sql
```

### 2. Verify Tables
Check that the `project_monthly_financials` table is created:
```sql
SELECT * FROM project_monthly_financials LIMIT 1;
```

### 3. Test RLS Policies
Ensure Row Level Security policies are active and working correctly.

## Usage Guide

### Adding Monthly Financial Update

1. Navigate to Projects page
2. Click on "Monthly Updates" tab
3. Click "Add Monthly Update" button
4. Fill in the form:
   - Select project
   - Choose month and year
   - Enter revenue amount
   - Enter expenses amount
   - Add optional notes
5. Review the calculated net profit/loss
6. Click "Add Monthly Update"

### Editing Monthly Record

1. Go to "Monthly Updates" tab
2. Find the record you want to edit
3. Click "Edit" button
4. Update revenue, expenses, or notes
5. Click "Update Monthly Update"

Note: Project, month, and year cannot be changed when editing (to maintain data integrity)

### Viewing Monthly Data

The monthly updates table displays:
- Project name
- Period (Month Year)
- Revenue (green)
- Expenses (red)
- Net Profit/Loss (green if positive, red if negative)
- Notes
- Action buttons (Edit/Delete)

## Data Validation

- Month must be between 1-12
- Year must be 2000 or later
- Revenue and expenses must be non-negative
- Duplicate month/year for same project is prevented
- Net profit/loss is automatically calculated

## Security

- Row Level Security (RLS) enabled
- Only authenticated users can access
- All CRUD operations require authentication
- Audit trail via created_at and updated_at timestamps

## Next Phase

Phase 2 will implement:
- Project Calculator with advanced financial metrics
- Investment distribution calculations
- Member-wise profit/loss breakdown
- ROI calculations per member

## Technical Notes

- Uses PostgreSQL GENERATED ALWAYS AS for net_profit_loss calculation
- Indexed on project_id and year/month for fast queries
- Cascading delete when project is deleted
- Automatic timestamp updates via trigger

## Troubleshooting

**Issue: Duplicate entry error**
- Solution: Check if a record already exists for that project/month/year combination

**Issue: Cannot edit month/year**
- Solution: This is by design. Delete and create new record if needed

**Issue: Net profit/loss not updating**
- Solution: This is auto-calculated. Update revenue or expenses to recalculate

## Support

For issues or questions, refer to the main project documentation or contact the development team.
