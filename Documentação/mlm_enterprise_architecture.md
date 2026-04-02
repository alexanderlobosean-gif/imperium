# 📘 MLM Marketing System -- Enterprise Architecture Documentation

## Stack Base

-   Frontend: Vite + React
-   Backend: Node.js (API Layer)
-   Database: Supabase (PostgreSQL)
-   Hosting: Netlify (Frontend)
-   Version Control: Git

------------------------------------------------------------------------

# 1. Financial Ledger System (CRITICAL)

## Goal

Never calculate balances in frontend.

### Create table:

financial_ledger

Fields: - id - user_id - type - amount - balance_before -
balance_after - reference_id - created_at

### Rule

Balance = SUM(financial_ledger.amount)

------------------------------------------------------------------------

# 2. Backend API (Node.js)

Create backend services:

/api - createDeposit - requestWithdrawal - transferBalance -
distributeCommissions

Frontend NEVER manipulates money directly.

Flow: React → Node API → Supabase DB

------------------------------------------------------------------------

# 3. MLM Structure (Closure Table)

Table: user_network

Fields: - user_id - ancestor_id - level

Benefits: - No recursion - Fast commission calculation - Scales to
millions of users

------------------------------------------------------------------------

# 4. Commission Distribution

Create backend service:

distribute_commissions()

Triggered when: - Deposit confirmed - Investment activated - Profit
generated

Executed ONLY server-side.

------------------------------------------------------------------------

# 5. Database Triggers

Example: AFTER INSERT ON deposits

Actions: - Create ledger entry - Trigger commission distribution -
Update balances

Ensures zero fraud.

------------------------------------------------------------------------

# 6. Multiple Wallet Balances

Create separated balances:

-   wallet_balance
-   yield_balance
-   bonus_balance
-   locked_balance

Never store a single balance.

------------------------------------------------------------------------

# 7. Security (RLS)

Enable Row Level Security.

Users CANNOT: - Insert confirmed deposits - Modify balances - Transfer
funds directly

Only Service Role allowed.

------------------------------------------------------------------------

# 8. Backend Responsibility Rules

Allowed in Frontend: - Read profile - View history

NOT allowed: - Create money - Transfer balance - Confirm deposits

All handled by Node backend.

------------------------------------------------------------------------

# 9. Background Jobs

Required jobs: - Daily ROI distribution - MLM commission validation -
Withdrawal verification

Tools: - Supabase Cron - Queue Worker

------------------------------------------------------------------------

# 10. Database Optimization

Indexes required: - user_id - ancestor_id - created_at - status

Prevents scaling failure.

------------------------------------------------------------------------

# 11. Event Driven Architecture

Core Events: - deposit_confirmed - investment_started -
commission_paid - withdrawal_requested

System reacts to events instead of direct calls.

------------------------------------------------------------------------

# Final Architecture

React (UI) ↓ Node.js Backend API ↓ Supabase PostgreSQL ↓ Triggers +
Events + Ledger

------------------------------------------------------------------------

# Enterprise Goal

Transform system into: - Secure Financial Platform - Scalable MLM
Engine - Fraud-resistant Architecture
