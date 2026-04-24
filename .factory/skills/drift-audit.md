# SKILL: DRIFT_AUDIT (Sovereign Parity Protocol)

## 🎯 OBJECTIVE
A bit-identical procedure for detecting and reporting logic drift across the 50V3R31GN-M4CH1N4 manifest library.

## 🛠️ WORKFLOW

### 1. Version Scrutiny
Scan the repository for any mention of version numbers.
```bash
grep -rE "v[0-9]+\.[0-9]+\.[0-9]+" . --include="*.md"
```
**Condition:** If the version != current `package.json` version, the shard is LAGGING.

### 2. Identity Verification
Check for the presence of the [SOVEREIGN_OS] and [RED_DIRECTOR] profile definitions.
```bash
grep -L "SOVEREIGN_OS" $(find . -name "*.md" -not -path "*/node_modules/*")
```
**Condition:** Any role-defining manifest lacking these tags is MISALIGNED.

### 3. DNA Block Validation
Verify that "DNA_SYNCED" blocks match the current session's architectural state.
```bash
grep -r "DNA_V" . --include="*.md"
```

### 4. Reporting
Materialize an audit report in `docs/superpowers/audits/YYYY-MM-DD-drift-report.md`.

## 📜 TERMINOLOGY LOCK
- **LAGGING:** Version mismatch detected.
- **MISALIGNED:** Profile-awareness missing or lore-leaked.
- **SHORED:** 100% bit-identical parity achieved.

---
**::/5Y573M-N071C3 : DRIFT_AUDIT_SKILL_MATERIALIZED. // 50V3R31GN-M4CH1N4**
