# AM ERP — Authoritative Pilot Persistence & Production Deployment Strategy

**Document Reference:** `DOC-ARCH-PLT-3D-001`  
**Standard:** Enterprise Pilot Deployment & Financial Durability Standard (SAP S/4HANA / Microsoft Dynamics 365 Architecture Baseline)  
**Classification:** Operational Security, Infrastructure & Data Protection Manual  
**Target Engine:** Native SQLite (`DatabaseSync` via `node:sqlite`) running in Write-Ahead Logging (WAL) Mode  

---

## 1. Executive Summary & Non-Negotiable Invariant

### Core Directive
> **The pilot transaction database must NEVER disappear because of container restart, redeploy, or scaling.**  
> If the deployment environment cannot guarantee persistence, the system **MUST fail readiness** with an explicit operational message rather than silently operating with ephemeral transactional storage.

In retail and commercial ERP environments, transactions (invoices, tender split receipts, cashier shifts, inventory stock movements, double-entry GL journal vouchers) carry legal, statutory (ZATCA / ETA), and fiscal responsibilities. Silently booting a container on an ephemeral container filesystem (`overlay`, `rootfs`, or `tmpfs`) means any container recycle, auto-scaling event, crash, or rolling deployment causes **irrecoverable loss of financial records**.

AM ERP enforces an **authoritative storage persistence verification gate** at boot and runtime.

---

## 2. Storage Persistence Detection Architecture

### 2.1 Detection Mechanism

The `PilotDatabaseService` inspects the host filesystem and environment before serving live financial transactions:

```
+-------------------------------------------------------------------------+
|                  PilotDatabaseService.detectStoragePersistence()        |
+-------------------------------------------------------------------------+
                                   |
           +-----------------------+-----------------------+
           |                                               |
           v                                               v
[ Environment Flags Check ]                     [ Linux /proc/mounts Audit ]
 - PERSISTENT_STORAGE_CONFIRMED=true?             - Inspect path.resolve(dbPath)
 - PERSISTENCE_MODE=PERSISTENT_VOLUME?            - Match against mount table
 - PERSISTENT_DATA_PATH set?                      - Check for non-rootfs mount
 - SIMULATE_EPHEMERAL_STORAGE=true?               - Exclude: overlay, tmpfs, rootfs
           |                                               |
           +-----------------------+-----------------------+
                                   |
                                   v
           +-----------------------------------------------+
           | Storage Classification:                       |
           |   - PERSISTENT_VOLUME (Certified Durable)     |
           |   - EPHEMERAL_CONTAINER_FS (Ephemeral Hazard) |
           |   - SIMULATED_EPHEMERAL (Test Sandbox)        |
           +-----------------------------------------------+
                                   |
                                   v
           +-----------------------------------------------+
           | Readiness Decision:                           |
           |   - Production + Ephemeral -> NOT_READY (503) |
           |   - Production + Volume    -> READY (200)     |
           |   - Non-Prod + Ephemeral   -> READY (Advisory)|
           +-----------------------------------------------+
```

### 2.2 Filesystem Inspection Rules
1. **Linux `/proc/mounts` Inspection**:
   - Compares the absolute path of the SQLite database directory (`data/`) against the Linux container mount table.
   - Filesystems identified as `overlay`, `overlay2`, `tmpfs`, `rootfs`, or `ramfs` at root `/` indicate ephemeral container storage.
   - Dedicated mounts (e.g. `/app/data` mounted with `ext4`, `nfs`, `gcsfuse`, or cloud-attached block/volume devices) are certified as persistent.

2. **Environment Variable Hierarchy**:
   | Variable | Type | Description |
   |---|---|---|
   | `PERSISTENT_STORAGE_CONFIRMED` | Boolean (`true`/`false`) | Authoritative operator attestation that the storage volume mounted at `data/` is durable across container lifecycles. |
   | `PERSISTENT_DATA_PATH` | Path String | Absolute path to the mounted persistent directory. Overrides default `./data`. |
   | `REQUIRE_PERSISTENT_STORAGE` | Boolean (`true`/`false`) | Enforces failure if storage is not verified as persistent (defaults to `true` when `NODE_ENV=production`). |
   | `ALLOW_EPHEMERAL_STORAGE` | Boolean (`true`/`false`) | Emergency bypass switch for ephemeral CI/testing environments. Must **never** be used in live retail pilot production. |
   | `STRICT_PERSISTENCE_ABORT` | Boolean (`true`/`false`) | If `true`, the Node.js server process actively terminates (`process.exit(1)`) on boot if storage is ephemeral. |
   | `SIMULATE_EPHEMERAL_STORAGE` | Boolean (`true`/`false`) | Test harness flag for automated validation of 503 rejection and operational warnings. |

---

## 3. SQLite Concurrency & ACID Durability Configuration

The transactional database uses Node 22 native `DatabaseSync` (`node:sqlite`) with zero external native C-bindings or dynamic linker dependencies.

### 3.1 Pragma Specifications

```sql
-- 1. Write-Ahead Logging (WAL)
-- Concurrently serves reader threads while POS writes append to the WAL journal
PRAGMA journal_mode = WAL;

-- 2. Synchronous Normal
-- Ensures critical transactions sync to disk on checkpoints without redundant disk sync pauses
PRAGMA synchronous = NORMAL;

-- 3. Busy Timeout
-- Prevents SQLITE_BUSY deadlocks during simultaneous cashier checkouts and inventory receipts
PRAGMA busy_timeout = 5000;

-- 4. Foreign Key Constraints
-- Enforces referential integrity across subledgers and receipt line items
PRAGMA foreign_keys = ON;
```

### 3.2 WAL Checkpointing Strategy
- **Passive Checkpointing**: Background incremental merge (`PRAGMA wal_checkpoint(PASSIVE)`).
- **Scheduled Truncate**: Full truncation on graceful container shutdown or manual operator trigger (`PRAGMA wal_checkpoint(TRUNCATE)`).
- **Automated Startup Verification**: On container boot, the database verifies that existing tables exist, reads past entities, and emits an immutable audit vault record.

---

## 4. Tamper-Evident SHA-256 Backup & Restore Vault

Every manual or scheduled snapshot creates an immutable payload with an authoritative cryptographic seal:

1. **Snapshot Structure**:
   - `metadata.backupId`: Formatted as `BKP-PLT-<timestamp>-<rand>`.
   - `metadata.checksumSha256`: SHA-256 hash calculated over the exact canonical serialized JSON payload.
   - `metadata.totalRecords`: Total count of entities across all subledger tables.
2. **Restore Verification**:
   - Before restoring any record into SQLite, `PilotDatabaseService.restoreBackup()` calculates the SHA-256 checksum of the incoming payload.
   - If `computedHash !== metadata.checksumSha256`, the transaction **aborts immediately** with an error to prevent corruption or tampering.
   - Restores are executed inside an atomic transaction; if any collection insertion fails, the entire database rollbacks to the prior state.

---

## 5. Health & Readiness Probe Behavior

Modern cloud platforms (Cloud Run, Kubernetes, AWS ECS) distinguish between **Liveness** and **Readiness**:

### 5.1 `/api/health` — Liveness Probe
- **Purpose**: Verifies that the Node.js HTTP server is up and responsive to requests.
- **Status Code**: Returns HTTP `200 OK` as long as the process is alive.
- **Payload**:
  ```json
  {
    "status": "ok",
    "timestamp": "2026-09-07T03:00:00.000Z",
    "engine": "AM ERP Enterprise Pilot Kernel",
    "database": {
      "status": "ACTIVE",
      "walMode": true,
      "storageType": "PERSISTENT_VOLUME",
      "isPersistent": true,
      "readinessStatus": "READY"
    }
  }
  ```

### 5.2 `/api/readiness` & `/api/v1/platform/pilot-readiness` — Readiness Probe
- **Purpose**: Verifies that the container is safe to receive customer and cashier traffic.
- **Success (`isPersistent = true` or `ALLOW_EPHEMERAL_STORAGE = true`)**:
  - Status Code: HTTP `200 OK`.
  - Result: `readinessStatus: "READY"`.
- **Failure (`isPersistent = false` in Production)**:
  - Status Code: HTTP `503 Service Unavailable`.
  - Result: `readinessStatus: "NOT_READY_EPHEMERAL"`.
  - Explicit Error Message:
    > `CRITICAL DEPLOYMENT SAFETY FAILURE: Persistent storage is not guaranteed. SQLite pilot database at '/app/data/pilot_erp.db' is operating on an ephemeral container filesystem (overlay/tmpfs). Container restart, scale-to-zero, or redeploy will cause permanent, unrecoverable data loss for all pilot transactions, receipts, and ledger journals.`
  - Remedy Instructions:
    1. Attach a persistent volume mount mapped to the container data directory.
    2. Set `PERSISTENT_STORAGE_CONFIRMED=true` once verified.
    3. For non-production CI tests only: configure `ALLOW_EPHEMERAL_STORAGE=true`.

---

## 6. Production Deployment Runbooks

### 6.1 Google Cloud Run Deployment

Cloud Run instances scale to zero by default and destroy container instances on idle. Persistent volume mounts are supported via **Cloud Storage FUSE** or **Google Cloud Filestore (NFS)**.

#### Option A: Cloud Storage FUSE Volume Mount
```bash
# 1. Create a Cloud Storage bucket for ERP persistence
gcloud storage buckets create gs://am-erp-pilot-data --location=me-central1

# 2. Deploy Cloud Run service with dedicated volume mount
gcloud run deploy am-erp \
  --image=gcr.io/my-project/am-erp:production \
  --add-volume=name=erp-data,type=cloud-storage,bucket=am-erp-pilot-data \
  --add-volume-mount=volume=erp-data,mount-path=/app/data \
  --set-env-vars=NODE_ENV=production,PERSISTENT_STORAGE_CONFIRMED=true,PERSISTENT_DATA_PATH=/app/data \
  --port=3000 \
  --min-instances=1 \
  --max-instances=1
```
*Note: Set `--min-instances=1` and `--max-instances=1` for single-node SQLite transactional pilot stability.*

#### Option B: Google Cloud Filestore (NFS) Mount
```bash
# Deploy with NFS volume mount for maximum POS disk IOPS
gcloud run deploy am-erp \
  --image=gcr.io/my-project/am-erp:production \
  --add-volume=name=erp-nfs,type=nfs,location=10.0.0.2:/vol1 \
  --add-volume-mount=volume=erp-nfs,mount-path=/app/data \
  --set-env-vars=NODE_ENV=production,PERSISTENT_STORAGE_CONFIRMED=true \
  --min-instances=1 \
  --max-instances=1
```

---

### 6.2 Docker & Docker Compose Deployment

#### Docker Run
```bash
# Create durable Docker named volume
docker volume create am_erp_pilot_data

# Run container with volume mounted to /app/data
docker run -d \
  --name am-erp-retail-pilot \
  -p 3000:3000 \
  -v am_erp_pilot_data:/app/data \
  -e NODE_ENV=production \
  -e PERSISTENT_STORAGE_CONFIRMED=true \
  am-erp:latest
```

#### Docker Compose (`docker-compose.yml`)
```yaml
version: '3.8'

services:
  erp-app:
    image: am-erp:production
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - PERSISTENT_STORAGE_CONFIRMED=true
      - REQUIRE_PERSISTENT_STORAGE=true
      - DATA_DIR=/app/data
    volumes:
      - erp_pilot_data:/app/data
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/readiness"]
      interval: 15s
      timeout: 5s
      retries: 3
    restart: unless-stopped

volumes:
  erp_pilot_data:
    driver: local
```

---

### 6.3 Kubernetes (K8s) Deployment

```yaml
apiVersion: v1
kind: PersistentVolumeClaim
metadata:
  name: am-erp-pvc
  namespace: retail-pos
spec:
  accessModes:
    - ReadWriteOnce
  resources:
    requests:
      storage: 20Gi
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: am-erp-deployment
  namespace: retail-pos
spec:
  replicas: 1  # Authoritative single-writer for pilot SQLite
  selector:
    matchLabels:
      app: am-erp
  template:
    metadata:
      labels:
        app: am-erp
    spec:
      containers:
        - name: erp
          image: am-erp:production
          ports:
            - containerPort: 3000
          env:
            - name: NODE_ENV
              value: "production"
            - name: PERSISTENT_STORAGE_CONFIRMED
              value: "true"
            - name: REQUIRE_PERSISTENT_STORAGE
              value: "true"
          volumeMounts:
            - name: storage-volume
              mountPath: /app/data
          livenessProbe:
            httpGet:
              path: /api/health
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 10
          readinessProbe:
            httpGet:
              path: /api/readiness
              port: 3000
            initialDelaySeconds: 5
            periodSeconds: 5
      volumes:
        - name: storage-volume
          persistentVolumeClaim:
            claimName: am-erp-pvc
```

---

## 7. Operational Audit Checklist (Pre-Flight Gate)

Before accepting commercial retail pilot transactions, the site engineer must certify:

- [x] Database file resides on dedicated persistent volume (`/app/data/pilot_erp.db`).
- [x] SQLite connection confirmed in `WAL` mode (`PRAGMA journal_mode = WAL`).
- [x] `PRAGMA busy_timeout = 5000` active.
- [x] `/api/readiness` returns HTTP 200 with `status: "ready"`.
- [x] `CHK-PLT-09` pre-flight check in `/api/v1/platform/pilot-readiness` is `PASSED`.
- [x] Automated nightly backup snapshot pipeline configured with SHA-256 verification.
- [x] Container orchestrator configured with `replicas: 1` to ensure single-writer ACID guarantees.

**Certified by Enterprise Architecture & Platform Operations Board**
