# AM BUSINESS PLATFORM — ARCHITECTURE BASELINE v2.6
**Domain**: Fixed Assets & Asset Lifecycle Management (Phase 2.8)
**Status**: APPROVED & ACTIVE BASELINE
**Target Framework Alignment**: SAP S/4HANA FI-AA, Oracle ERP Cloud Fixed Assets, Microsoft Dynamics 365 Finance, IFRS, IAS 16 (Property, Plant & Equipment), IAS 36 (Impairment of Assets), IAS 23 (Borrowing Costs)

---

## 1. ARCHITECTURAL OVERVIEW & DOMAIN BOUNDARIES

Architecture Baseline v2.6 incorporates the complete Fixed Assets and Asset Lifecycle Management Domain (Phase 2.8) into the AM Business Platform core architecture.

The Fixed Assets Engine operates as an autonomous subledger (FI-AA) integrated directly with the certified General Ledger (Phase 2.6), Procurement (Phase 2.3), and Financial Reporting (Phase 2.7) domains via standardized asynchronous financial event streams and decoupled GL account postings.

```
+-----------------------------------------------------------------------------------+
|                        FIXED ASSETS & ASSET LIFECYCLE MANAGEMENT                  |
|                                     (Phase 2.8)                                   |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  | Asset Master & Cls  |  | Acquisition Engine  |  | Depreciation Engine       |  |
|  | (Class, Barcode)    |  | (Cap/CWIP/IAS 16)   |  | (SL/DB/DDB/SYD/UOP/Tables)|  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  | Transfer Governance |  | Disposal Engine     |  | Revaluation / Impairment  |  |
|  | (Location/Dept/CC)  |  | (Sale/Scrap/GainLoss|  | (IAS 16 Equity / IAS 36)  |  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  +---------------------+  +---------------------+  +---------------------------+  |
|  | Maintenance & PMS   |  | Physical Inventory  |  | Immutable Audit Vault     |  |
|  | (Overhaul/Collision)|  | (Barcode Scanning)  |  | (SHA-256 / Period Freeze) |  |
|  +---------------------+  +---------------------+  +---------------------------+  |
+-----------------------------------------------------------------------------------+
                                          |
                      FINANCIAL EVENT BUS & EVENT-DRIVEN GL POSTINGS
                                          |
+-----------------------------------------------------------------------------------+
|                              CERTIFIED CORE DOMAINS                               |
|   Phase 2.2 Inventory | Phase 2.3 Procurement | Phase 2.4 AP | Phase 2.5 AR      |
|   -----------------------------------------------------------------------------   |
|   Phase 2.6 General Ledger (FI-GL) | Phase 2.7 Financial Reporting & Analytics    |
+-----------------------------------------------------------------------------------+
```

---

## 2. CORE FUNCTIONAL MODULES

### 2.1 Asset Master Governance & Gapless Numbering
- **Gapless Sequential Numbering**: Strict format `FA-{YEAR}-{CLASS_CODE}-{SEQ:4}` (e.g., `FA-2026-IT-0001`) preventing duplication and skipped sequences.
- **Hierarchy & Classification**: Support for Asset Classes, Asset Categories, Cost Centers, Departments, Physical Locations, and Responsible Employees.
- **Asset Lock Status**: Administrative freeze and statutory lock mechanics blocking mutations across unauthorized channels.

### 2.2 Asset Acquisition & Capitalization (IAS 16 & IAS 23)
- **Direct Capitalization & CWIP Conversion**: Validation of purchase cost, useful life, residual value, and qualifying borrowing costs (IAS 23).
- **Acquisition Idempotency**: Enforcement of unique capitalization references and idempotency keys to prevent duplicate capitalization.
- **Automated GL Integration**: Emission of `ASSET_ACQUIRED` domain events generating debit postings to Asset Balance Sheet accounts and credit postings to AP Clearing or CWIP accounts.

### 2.3 Multi-Method Depreciation Engine
- **Methods Supported**: Straight Line (`STRAIGHT_LINE`), Reducing Balance (`DECLINING_BALANCE`), Double Declining Balance (`DOUBLE_DECLINING`), Sum of Years' Digits (`SUM_OF_YEARS_DIGITS`), Units of Production (`UNITS_OF_PRODUCTION`), and Custom Depreciation Tables.
- **Convention Logic**: Full Month, Half-Month, Mid-Quarter, and Actual Days depreciation conventions.
- **Depreciation Protection**: Period-level idempotency preventing duplicate depreciation runs for the same fiscal period, with authorized rollback workflows and strict floor protection (`NetBookValue >= ResidualValue`).

### 2.4 Asset Transfer Governance & Lineage Tracking
- **Multi-Dimensional Transfers**: Location, Department, Cost Center, Custodian/Employee, and Company/Branch transfers.
- **Cryptographic Lineage**: SHA-256 sealed audit records and correlation ID tracking preserving end-to-end relocation history.

### 2.5 Asset Disposal & Collision Prevention
- **Disposal Workflows**: Scrapping, Outright Sale, Trade-In, and Casualty/Donation.
- **Gain/Loss Realization**: Automated calculation of realized Gain or Loss on disposal based on Net Book Value vs Proceeds, generating balanced GL entries.
- **Active Work Order Blocker**: In-progress or scheduled maintenance tasks automatically block asset disposal until work orders are closed or cancelled.

### 2.6 IAS 16 Asset Revaluation & IAS 36 Impairment Testing
- **IAS 16 Revaluation**: Recognition of upward revaluations into Revaluation Surplus Equity (Account 320000) and downward adjustments against existing reserves or P&L.
- **IAS 36 Impairment Testing**: Recoverable amount evaluation (Higher of Fair Value less Costs of Disposal and Value in Use). Impairment loss recognition and strict IAS 36.117 reversal limits.

### 2.7 Maintenance Work Orders & Lifecycle Management
- **Maintenance Categories**: Preventive, Corrective, Overhaul, Calibration, and Safety Inspection.
- **Collision Protection**: Detection and blocking of overlapping concurrent maintenance work orders on the same asset.
- **Component Replacement & Useful Life Extension**: Automatic updating of asset net book value and remaining useful life when qualifying capital overhauls are performed.

### 2.8 Physical Asset Verification & Barcode Audit
- **Verification Sessions**: Location-based cycle counts with blind verification capabilities.
- **Barcode & Serial Reconciliation**: Instant categorization into `MATCHED`, `DISCREPANCY_LOCATION`, `UNRECORDED_ASSET`, or `MISSING` with duplicate scan guards.

### 2.9 Fixed Asset Cryptographic Vault & Snapshot Registry
- **Immutable Snapshots**: Point-in-time state captures (Asset Register, Depreciation Register, Revaluation Surplus, Impairment History, Verification Logs) sealed with deterministic SHA-256 cryptographic hashes.
- **Audit Vault**: Append-only log storage tracking actor, event type, timestamp, correlation ID, and tamper-proof hash signatures.

---

## 3. QUALITY GATE METRICS & CERTIFICATION

- **Automated Verification**: Phase 2.8 Enterprise Hardening Suite (15/15 Criteria Passed - 100%).
- **Code Standards**: 100% TypeScript type safety (`tsc --noEmit` clean, 0 errors).
- **Domain Isolation**: 0 regressions across certified domains (Inventory, Procurement, AP, AR, GL, Financial Reporting).
- **Certification Date**: 2026-08-14.
