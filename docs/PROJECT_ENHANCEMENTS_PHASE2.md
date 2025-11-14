# Project Management Enhancements - Phase 2: Project Calculator & Investment Distribution

## Overview
Phase 2 introduces a comprehensive project calculator and investment distribution system with automatic percentage calculations and detailed completion reports.

## Features Implemented

### 1. Investment Percentage Tracking
- Automatic calculation of investment percentages for each member
- Real-time updates when investments are added/modified/deleted
- Database triggers ensure percentages are always accurate

### 2. Project Calculator
- Comprehensive financial metrics dashboard
- Member-wise investment distribution
- Profit/loss share calculations based on investment percentage
- Monthly trend analysis
- Break-even point calculation
- ROI per member

### 3. Project Completion Report
- Detailed financial summary
- Complete investment history with dates and percentages
- All revenue transactions
- All expense transactions
- Final distribution showing each member's return
- Exportable report data

### 4. Investment Distribution Logic
Distribution is based on actual investment amount in the project:
- Each member's share = (Their Investment / Total Investment) × 100
- Profit/Loss share = (Investment Percentage / 100) × Net Profit/Loss
- Final Return = Initial Investment + Profit/Loss Share

## Database Changes

### Updated Table: `project_investments`
```sql
Added column:
- investment_percentage: DECIMAL(5, 2) - Auto-calculated via trigger
```

### New Functions & Triggers
- `calculate_investment_percentages(project_id)` - Recalculates all percentages
- `update_investment_percentages()` - Trigger on INSERT/UPDATE
- `update_investment_percentages_on_delete()` - Trigger on DELETE

## API Methods Added

**projectsService.js**
- `calculateProjectMetrics(projectId)` - Calculate comprehensive project metrics
  - Returns: Financial overview, member distribution, monthly trends, break-even
- `generateCompletionReport(projectId)` - Generate detailed completion report
  - Returns: All transactions, distributions, and final calculations

## UI Components

### Project Calculator Modal
Accessible via "Calc" button on each project row.

**Sections:**
1. **Financial Overview**
   - Total Investment
   - Total Revenue
   - Total Expenses
   - Net Profit/Loss
   - ROI
   - Break-Even Point (in months)

2. **Member Investment Distribution**
   - Member name
   - Total investment amount
   - Investment percentage
   - Calculated profit/loss share

3. **Monthly Trend**
   - Month-by-month revenue, expenses, and net P/L
   - Visual trend analysis

### Completion Report Modal
Only available for projects with status "Completed".

**Sections:**
1. **Project Summary**
   - Project status
   - Duration
   - Report generation timestamp

2. **Financial Summary**
   - All key financial metrics

3. **Investment Details**
   - All investments with member, amount, date, and share percentage

4. **Revenue Details**
   - All revenue transactions with dates and descriptions

5. **Expense Details**
   - All expenses with reason, amount, date, and expense by

6. **Final Distribution**
   - Member-wise breakdown showing:
     - Initial investment
     - Share percentage
     - Profit/loss share
     - Final return amount

## Installation Steps

### 1. Run Database Migration
Execute the SQL file in your Supabase SQL Editor:
```bash
sql/project_member_investments.sql
```

### 2. Verify Triggers
Check that triggers are created:
```sql
SELECT * FROM pg_trigger WHERE tgname LIKE '%investment%';
```

### 3. Test Percentage Calculation
Add a test investment and verify percentage is calculated:
```sql
SELECT * FROM project_investments WHERE project_id = YOUR_PROJECT_ID;
```

## Usage Guide

### Using Project Calculator

1. Navigate to Projects page
2. Find the project you want to analyze
3. Click the "Calc" button in the Actions column
4. View comprehensive metrics:
   - Financial overview cards
   - Member distribution table
   - Monthly trend analysis

### Generating Completion Report

1. Mark project as "Completed" (edit project status)
2. Click the "Report" button (appears only for completed projects)
3. Review the detailed report with all sections
4. Use data for final distribution to members

### Understanding Investment Distribution

**Example:**
- Project Total Investment: ৳100,000
- Member A invests: ৳60,000 (60%)
- Member B invests: ৳40,000 (40%)
- Net Profit: ৳20,000

**Distribution:**
- Member A receives: ৳60,000 + (60% × ৳20,000) = ৳72,000
- Member B receives: ৳40,000 + (40% × ৳20,000) = ৳48,000

## Calculations Explained

### ROI (Return on Investment)
```
ROI = (Net Profit/Loss / Total Investment) × 100
```

### Investment Percentage
```
Member % = (Member Investment / Total Investment) × 100
```

### Profit/Loss Share
```
Member Share = (Member % / 100) × Net Profit/Loss
```

### Break-Even Point
```
Break-Even = |Net Loss| / Average Monthly Revenue
```
(Only calculated when project is in loss)

### Final Return
```
Final Return = Initial Investment + Profit/Loss Share
```

## Data Integrity

- Investment percentages automatically recalculate on any change
- Percentages always sum to 100% for each project
- Deletion of investment triggers recalculation for remaining members
- All calculations use DECIMAL for precision

## Security

- Calculator and reports respect existing RLS policies
- Only authenticated users can access
- No data modification in calculator/report views
- Read-only operations

## Performance Considerations

- Calculations are performed on-demand (not stored)
- Efficient queries with proper indexing
- Triggers execute only on affected project
- Large datasets may take a few seconds to calculate

## Next Phase

Phase 3 will implement:
- Export functionality (PDF/Excel)
- Email notifications for completed projects
- Automated distribution tracking
- Payment scheduling for distributions

## Troubleshooting

**Issue: Percentages don't add up to 100%**
- Solution: Run `SELECT calculate_investment_percentages(project_id)` manually

**Issue: Calculator shows 0 for all values**
- Solution: Ensure project has investments, revenues, or expenses recorded

**Issue: Report button not showing**
- Solution: Project status must be "Completed"

**Issue: Break-even shows 0**
- Solution: Break-even only calculates when project is in loss and has monthly data

## Technical Notes

- Uses PostgreSQL triggers for automatic percentage calculation
- Calculations performed server-side for accuracy
- All monetary values use DECIMAL(12, 2) for precision
- Report data includes ISO timestamp for audit trail

## Support

For issues or questions, refer to the main project documentation or contact the development team.
