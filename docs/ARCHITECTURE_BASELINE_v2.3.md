# ARCHITECTURE BASELINE v2.3 — AM BUSINESS PLATFORM
## ACCOUNTS RECEIVABLE & ORDER-TO-CASH DOMAIN CERTIFIED ARCHITECTURE

**Status:** CERTIFIED & APPROVED
**Version:** 2.3
**Date:** 2026-08-13
**Domain:** Accounts Receivable (FI-AR) & Order-to-Cash (O2C)

---

### Executive Summary

Architecture Baseline v2.3 formalizes and certifies the complete Accounts Receivable and Order-to-Cash (O2C) domain. The platform guarantees **Zero Direct General Ledger Posting**, enforcing that all revenue, receivables, tax obligations, and receipt financial events route through the central `FinancialEventEngine` to generate immutable, double-entry balanced journal entries.

---

### Core Domain Capabilities & Architectural Guarantees

1. **Customer Master & Credit Governance**
   - Centralized customer record with tax identification (ZATCA Phase 2 compliant), commercial registration, sales territory, and credit classification.
   - Real-time credit check engine validating credit limits, overdue grace periods, and block statuses with structured executive override workflows (`isOverrideAllowed`, `isOverridden`, `overrideReason`, `overriddenBy`, `overriddenAt`).

2. **Sales Invoice Lifecycle & ZATCA Integration**
   - Full lifecycle handling (`DRAFT`, `POSTED`, `PARTIALLY_PAID`, `PAID`, `CANCELLED`, `DISPUTED`).
   - Automated creation of immutable audit hashes (`SHA256-AR-INV-*`), ZATCA Phase 2 UUIDs, and QR cryptographic hashes.
   - Strict company-level duplicate invoice protection preventing duplicate external billing numbers (`validateDuplicateInvoice`).

3. **Receipt Allocation & Locking Mechanism**
   - Concurrent allocation lock protection (`isAllocationLocked`, `lockedBy`, `lockedAt`, `allocationLockReason`) preventing race conditions during simultaneous receipt application.
   - Supports both automated FIFO allocation and granular itemized allocation.

4. **Reversal Engine & Un-allocation Logic**
   - Append-only reversal audit trail for receipts (`reverseReceipt`).
   - Automated un-allocation and reinstatement of sales invoice open balances upon receipt reversal or cheque bounce.

5. **Customer Statements & SHA-256 Hashing**
   - Deterministic `statementHash` calculation based on customer identity, reporting range, opening/closing balances, and transaction counts.
   - Guarantees tamper-evident statement generation for customer verification and audit compliance.

6. **Days Sales Outstanding (DSO) & Aging Engine**
   - Real-time DSO calculation based on actual historical invoice velocity and aging bucket balances (`CURRENT`, `1_30`, `31_60`, `61_90`, `90_PLUS`).
   - Historical aging snapshot creation with cryptographic integrity hashes (`SHA256-AR-SNAP-*`).

7. **Collections Engine & Promise-to-Pay Lifecycle**
   - Structured collections activity tracking with lifecycle states (`REMINDER`, `CALL`, `PROMISE_TO_PAY`, `BROKEN_PROMISE`, `LEGAL_ACTION`, `CLOSED`).
   - Promise-to-Pay state machine (`PENDING`, `KEPT`, `BROKEN`, `CANCELLED`) with automated status updates upon receipt matching.

8. **IFRS 15 Revenue Recognition & Multi-Currency FX Realization**
   - Performance obligation tracking with deferred/recognized revenue schedules compliant with IFRS 15.
   - Realized FX gain/loss calculation engine (`calculateSettlementFXDifference`) for multi-currency settlement readiness.

---

### Certified Subsystems Overview

| Subsystem | Baseline Version | Status |
| :--- | :--- | :--- |
| General Ledger Core & Event Engine | v2.0 | CERTIFIED & LOCKED |
| Inventory Domain | v2.2 | CERTIFIED & LOCKED |
| Procurement Domain | v2.2 | CERTIFIED & LOCKED |
| Accounts Payable Domain | v2.2 | CERTIFIED & LOCKED |
| Accounts Receivable & O2C Domain | v2.3 | CERTIFIED & HARDENED |
