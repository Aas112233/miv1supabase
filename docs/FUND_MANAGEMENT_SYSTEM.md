# Fund Management System - Complete Guide

## Overview

The Fund Management System provides comprehensive tracking and management of club funds with approval workflows, member allocations, and transaction history.

## Features

### 6 Independent Funds
1. **Main Savings Fund** - Primary savings from member contributions
2. **Investment Fund** - Capital for project investments
3. **Project Revenue Fund** - Income from completed projects
4. **Operating Expense Fund** - Day-to-day operational costs
5. **Reserve Fund** - Emergency reserves
6. **Dividend Distribution Fund** - Member dividend payouts

### Key Capabilities
- ✅ Independent fund management (no hierarchy)
- ✅ Transaction approval workflow (admin approval required)
- ✅ Member-wise fund allocations based on share amounts
- ✅ Fund transfers between accounts
- ✅ Automatic balance calculation
- ✅ Historical balance tracking
- ✅ Integration with existing payments, investments, revenues, expenses

## Database Schema

### Tables

#### 1. funds
Stores fund information and current balances.

```sql
- id (UUID, PK)
- name (VARCHAR, UNIQUE)
- fund_type (VARCHAR)
- description (TEXT)
- current_balance (DECIMAL)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMP)
```

#### 2. fund_transactions
Records all fund transactions with approval status.

```sql
- id (UUID, PK)
- fund_id (UUID, FK → funds)
- transaction_type (VARCHAR)
- amount (DECIMAL)
- description (TEXT)
- transaction_date (DATE)
- status (VARCHAR: pending/approved/rejected)
- approved_by (UUID, FK → auth.users)
- approved_at (TIMESTAMP)
- rejection_reason (TEXT)
- source_type (VARCHAR)
- source_id (UUID)
- to_fund_id (UUID, FK → funds) - for transfers
- created_by (UUID, FK → auth.users)
- created_at, updated_at (TIMESTAMP)
```

#### 3. fund_balances
Historical balance snapshots for tracking.

```sql
- id (UUID, PK)
- fund_id (UUID, FK → funds)
- balance (DECIMAL)
- calculated_at (TIMESTAMP)
```

#### 4. member_fund_allocations
Member-wise fund allocations based on shares.

```sql
- id (UUID, PK)
- fund_id (UUID, FK → funds)
- member_id (UUID, FK → members)
- allocated_amount (DECIMAL)
- allocation_percentage (DECIMAL)
- last_calculated (TIMESTAMP)
```

## Transaction Types

### Master Data Entries
- **deposit** - Add money to fund
- **withdrawal** - Remove money from fund
- **transfer** - Move money between funds
- **allocation** - Allocate funds to members
- **adjustment** - Balance adjustments
- **expense** - Linked to expenses table
- **investment** - Linked to project_investments table

## Functions & Triggers

### calculate_fund_balance(fund_id)
Calculates current balance by summing approved transactions:
- Deposits/allocations: +amount
- Withdrawals/expenses/investments: -amount
- Transfers: -amount from source, +amount to destination

### calculate_member_allocation(fund_id, member_id)
Calculates member's share of fund:
```
allocation = (member_share / total_shares) × fund_balance
```

### Automatic Triggers
- **update_fund_balance()** - Updates fund balance on transaction approval
- **update_member_allocations()** - Recalculates member allocations on approval

## User Interface

### 5 Tabs

#### 1. Overview Tab
- Summary cards: Total Balance, Active Funds, Pending Approvals
- Fund cards grid showing each fund with balance

#### 2. Transactions Tab
- Filter by status (all/pending/approved/rejected)
- Add new transaction button
- Transaction history table
- Columns: Date, Fund, Type, Amount, Description, Status

#### 3. Transfers Tab
- Create transfers between funds
- Shows source fund balance
- Requires admin approval

#### 4. Members Tab
- View member allocations per fund
- Shows allocated amount and percentage
- Based on member share amounts

#### 5. Approvals Tab
- Pending transactions requiring approval
- Approve/Reject buttons (admin only)
- Rejection reason input

## API Methods

### fundsService.js

```javascript
// Get all funds
getFunds()

// Get fund by ID
getFundById(id)

// Get fund transactions (optional filters)
getFundTransactions(fundId, status)

// Create transaction
createFundTransaction(transaction)

// Approve transaction
approveTransaction(transactionId)

// Reject transaction
rejectTransaction(transactionId, reason)

// Get member allocations
getMemberAllocations(fundId)

// Get balance history
getFundBalanceHistory(fundId, limit)

// Get fund summary
getFundSummary()

// Create transfer
createTransfer(fromFundId, toFundId, amount, description)
```

## Data Migration

The system automatically migrates existing data:

### Payments → Main Savings Fund
All member payments linked as deposits.

### Investments → Investment Fund
All project investments linked as investment transactions.

### Revenues → Project Revenue Fund
All project revenues linked as deposits.

### Expenses → Operating Expense Fund
All expenses linked as expense transactions.

## Money Flow Examples

### Example 1: Member Payment
1. Member makes payment → payments table
2. Auto-creates transaction in Main Savings Fund
3. Status: approved (historical data)
4. Balance updates automatically

### Example 2: Project Investment
1. Admin creates investment → project_investments table
2. Auto-creates transaction in Investment Fund
3. Status: approved
4. Investment Fund balance decreases

### Example 3: Fund Transfer
1. User creates transfer request
2. Transaction created with status: pending
3. Admin approves transfer
4. Source fund balance decreases
5. Destination fund balance increases
6. Member allocations recalculated

### Example 4: New Expense
1. User adds expense
2. Transaction created in Operating Expense Fund
3. Status: pending
4. Admin approves
5. Fund balance updates
6. Member allocations recalculated

## Approval Workflow

### Transaction Lifecycle
1. **Created** - User submits transaction (status: pending)
2. **Pending** - Awaits admin approval
3. **Approved** - Admin approves → balance updates
4. **Rejected** - Admin rejects with reason

### Approval Rules
- All new transactions require admin approval
- Historical migrated data auto-approved
- Only approved transactions affect balances
- Rejected transactions don't affect balances

## Security

### Row Level Security (RLS)
- All tables have RLS enabled
- Users can view all funds and transactions
- Only admins can approve/reject transactions
- Users can create transactions (pending approval)

### Policies
```sql
-- View access for authenticated users
"Users can view funds"
"Users can view transactions"

-- Admin-only management
"Admins can manage funds"
"Admins can manage transactions"
```

## Installation

### Step 1: Run SQL Migration
```bash
# In Supabase SQL Editor
Run: sql/fund_management_system.sql
```

### Step 2: Verify Installation
```sql
-- Check funds created
SELECT * FROM funds ORDER BY name;

-- Check transactions migrated
SELECT fund_id, transaction_type, COUNT(*), SUM(amount) 
FROM fund_transactions 
GROUP BY fund_id, transaction_type;

-- Verify balances
SELECT f.name, f.current_balance, calculate_fund_balance(f.id) 
FROM funds f;
```

### Step 3: Access UI
Navigate to `/funds` in the application.

## Usage Guide

### Adding a Transaction
1. Go to Funds → Transactions tab
2. Click "Add Transaction"
3. Select fund, type, amount, description, date
4. Submit (status: pending)
5. Admin approves from Approvals tab

### Transferring Between Funds
1. Go to Funds → Transfers tab
2. Click "New Transfer"
3. Select source and destination funds
4. Enter amount and description
5. Submit (status: pending)
6. Admin approves from Approvals tab

### Viewing Member Allocations
1. Go to Funds → Members tab
2. View each member's allocation per fund
3. Allocations auto-calculated based on shares

### Approving Transactions
1. Go to Funds → Approvals tab
2. Review pending transactions
3. Click "Approve" or "Reject"
4. For rejection, enter reason
5. Balance updates automatically on approval

## Calculations

### Fund Balance
```
Balance = SUM(approved_transactions)
Where:
  deposits/allocations = +amount
  withdrawals/expenses/investments = -amount
  transfers_out = -amount
  transfers_in = +amount
```

### Member Allocation
```
Member Allocation = (Member Share / Total Shares) × Fund Balance

Example:
Member A: 10 shares
Total Shares: 100 shares
Fund Balance: ৳100,000

Member A Allocation = (10/100) × 100,000 = ৳10,000
```

## Reporting

### Available Reports
- Fund balance summary
- Transaction history by fund
- Member allocation breakdown
- Pending approvals list
- Balance history trends

### Export Options
Currently view-only. Future: PDF/Excel export.

## Best Practices

### For Admins
1. Review pending transactions daily
2. Provide clear rejection reasons
3. Monitor fund balances regularly
4. Verify member allocations periodically

### For Users
1. Provide detailed transaction descriptions
2. Select correct fund and transaction type
3. Verify amounts before submission
4. Check approval status regularly

## Troubleshooting

### Balance Mismatch
```sql
-- Recalculate all fund balances
UPDATE funds SET current_balance = calculate_fund_balance(id);
```

### Missing Allocations
```sql
-- Recalculate member allocations for a fund
-- (Automatically done on transaction approval)
```

### Transaction Not Approved
- Check Approvals tab for pending status
- Contact admin for approval
- Verify transaction details are correct

## Future Enhancements

Planned features (not yet implemented):
- [ ] Scheduled recurring transactions
- [ ] Budget limits per fund
- [ ] Email notifications for approvals
- [ ] PDF export of reports
- [ ] Fund performance analytics
- [ ] Multi-currency support
- [ ] Bulk transaction import
- [ ] Automated reconciliation

## Technical Notes

### Performance
- Indexes on fund_id, status, transaction_date
- Balance calculation cached in funds table
- Historical snapshots in fund_balances table

### Data Integrity
- Foreign key constraints
- Check constraints on amounts (> 0)
- Unique constraints on fund names
- Triggers maintain calculated fields

### Scalability
- Designed for 1000+ transactions
- Efficient queries with proper indexing
- Pagination recommended for large datasets

## Support

For issues or questions:
1. Check this documentation
2. Review SQL migration file
3. Check browser console for errors
4. Verify Supabase connection
5. Contact system administrator
