# ARCHITECTURE BASELINE v2.4 — AM BUSINESS PLATFORM
## GENERAL LEDGER & FINANCIAL CLOSING DOMAIN CERTIFIED ARCHITECTURE

**Status:** CERTIFIED & APPROVED  
**Version:** 2.4  
**Date:** 2026-08-13  
**Domain:** General Ledger (FI-GL) & Financial Closing  

---

### Executive Summary

Architecture Baseline v2.4 formalizes and certifies the complete General Ledger (FI-GL) and Financial Closing domain. The platform guarantees **Strict Double-Entry Bookkeeping Integrity**, **Immutable Auditability**, and **IAS 1 / IAS 8 / IAS 21 / IFRS Compliance**. Posted journals are strictly immutable and cannot be edited or deleted. Financial close execution requires 100% pre-close checklist compliance across all subledgers (Inventory, Procurement, AP, AR, GL, Event Queue).

---

### Core Domain Capabilities & Architectural Guarantees

1. **Journal Entry Idempotency & Unique Keys**
   - Enforces `idempotencyKey` on journal creation. Duplicate creation requests return the existing journal entry without duplicating records or audit events.
   - Deterministic key calculation fallback based on company, posting date, total debits, and line hash.

2. **Sequential Gapless Journal Numbering**
   - Company-, year-, and period-aware sequential journal numbering (`generateSequentialJournalNumber`).
   - Format: `JE-{COMPANY}-{YEAR}-{PERIOD}-{SEQUENCE}` guaranteeing zero sequence gaps.

3. **Journal Lock & Immutability Enforcement**
   - Posted and Reversed GL journals are permanently locked against direct modification or deletion.
   - API layer returns `HTTP 403 Forbidden` for any attempt to update or delete a `POSTED` or `REVERSED` journal. Corrective entries must be posted via explicit reversals.

4. **Multi-Subledger Financial Pre-Close Checklist**
   - Evaluates operational subledger readiness before period close:
     - Unposted DRAFT GL Journals cleared
     - Trial Balance mathematical balance (`Debit = Credit`)
     - Inventory domain period closed
     - Procurement domain open PO unbilled receipts cleared
     - Accounts Payable unposted supplier invoices cleared
     - Accounts Receivable unposted sales invoices cleared
     - Financial Event Queue empty (`pendingEvents = 0`)
     - Suspense and clearing accounts cleared (`balance = 0`)

5. **Period Reopen Governance & Justification**
   - Reopening a closed fiscal period requires mandatory business justification reason and controller approval.
   - Tracks `reopenCounter`, `lastReopenedReason`, `lastReopenedBy`, and `lastReopenedAt` with SHA-256 audit log records.

6. **Trial Balance Net Balance Mathematical Verification**
   - Verifies relation `OpeningNet + PeriodNet = ClosingNet` for every account.
   - Generates cryptographic SHA-256 trial balance verification hash.

7. **Suspense & Clearing Account Detection**
   - Scans Chart of Accounts for suspense, clearing, and temporary accounts with non-zero balances.
   - Rejects period close if unresolved clearing balances exist.

8. **IAS 21 Foreign Currency Valuation Snapshot**
   - Computes unrealized FX gains and losses on monetary accounts under IAS 21.
   - Generates immutable snapshot records with spot rate tables, revaluation results, and SHA-256 signatures (`createIAS21FXSnapshot`).

9. **Immutable Period Closing Data Bundle Snapshot**
   - Generates deep cryptographic snapshot bundles of Chart of Accounts, Trial Balance, Journal Counts, and FX rates upon period closure (`generateClosingSnapshot`).

10. **General Ledger Cryptographic Audit Trail**
    - Every GL action generates an append-only `GLAuditRecord` containing SHA-256 payload hash, correlation ID, timestamp, and user identity.

11. **Enterprise Quality Gate Test Suite**
    - `Phase26HardeningSuite` programmatically validates all 11 hardening criteria with 100% test pass rate.

---

### Certified Subsystems Overview

| Subsystem | Baseline Version | Status |
| :--- | :--- | :--- |
| Inventory Domain (Phase 2.2) | v2.2 | CERTIFIED & LOCKED |
| Procurement Domain (Phase 2.3) | v2.2 | CERTIFIED & LOCKED |
| Accounts Payable Domain (Phase 2.4) | v2.2 | CERTIFIED & LOCKED |
| Accounts Receivable & O2C Domain (Phase 2.5) | v2.3 | CERTIFIED & LOCKED |
| General Ledger & Financial Closing Domain (Phase 2.6) | v2.4 | CERTIFIED & HARDENED |
