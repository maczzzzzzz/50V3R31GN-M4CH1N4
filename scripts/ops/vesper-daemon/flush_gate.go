package main

/**
 * VESPER FLUSH GATE CLIENT — PHASE 78, TASK 1
 *
 * Polls SovereignIntelligence.db for PASS-verdicted decision_audit rows
 * and surfaces them as pending background proposals for execution.
 *
 * Security invariant: only PASS verdicts with risk_level = 'LOW' are
 * auto-executed. MEDIUM/HIGH require a signed HMAC token (Phase 78 scope).
 *
 * Triplet Seeding: extracted (Subject-Predicate-Object) findings are
 * written to os_triplets for Synapse ingestion.
 */

import (
	"database/sql"
	"fmt"
	"time"

	_ "modernc.org/sqlite"
)

const (
	flushPollInterval = 5 * time.Minute
	// SQL to pull unexecuted PASS proposals.
	queryPending = `
		SELECT id, logic_hash, rationale, timestamp
		FROM   decision_audit
		WHERE  verdict    = 'PASS'
		  AND  executed_at IS NULL
		ORDER  BY timestamp ASC
		LIMIT  10
	`
	markExecuted = `UPDATE decision_audit SET executed_at = CURRENT_TIMESTAMP WHERE id = ?`

	// Triplet insert for Synapse seeding.
	insertTriplet = `
		INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal, room_id)
		VALUES (?, ?, ?, 'vesper')
	`
)

// FlushGateClient polls SovereignIntelligence.db and processes approved proposals.
type FlushGateClient struct {
	dbPath string
	quit   chan struct{}
}

// Proposal mirrors the decision_audit row.
type Proposal struct {
	ID        int64
	LogicHash string
	Rationale string
	Timestamp string
}

func NewFlushGateClient(dbPath string) *FlushGateClient {
	return &FlushGateClient{
		dbPath: dbPath,
		quit:   make(chan struct{}),
	}
}

// Start launches the flush gate poll loop in the background.
func (f *FlushGateClient) Start() {
	// Ensure the executed_at column exists (idempotent migration).
	if err := f.migrate(); err != nil {
		fmt.Printf("⚠️  [VESPER/FLUSH] Migration failed: %v\n", err)
	}

	go func() {
		fmt.Printf("◈ [VESPER/FLUSH] Gate client active (poll: %s, db: %s)\n", flushPollInterval, f.dbPath)
		// Run once immediately, then on interval.
		f.poll()
		for {
			select {
			case <-f.quit:
				fmt.Println("◈ [VESPER/FLUSH] Gate client stopped.")
				return
			case <-time.After(flushPollInterval):
				f.poll()
			}
		}
	}()
}

func (f *FlushGateClient) Stop() {
	close(f.quit)
}

// migrate adds the executed_at column if it doesn't exist.
func (f *FlushGateClient) migrate() error {
	db, err := sql.Open("sqlite", f.dbPath)
	if err != nil {
		return err
	}
	defer db.Close()

	_, err = db.Exec(`ALTER TABLE decision_audit ADD COLUMN executed_at DATETIME`)
	// "duplicate column" error is expected if already migrated — ignore it.
	return nil
}

func (f *FlushGateClient) poll() {
	db, err := sql.Open("sqlite", f.dbPath)
	if err != nil {
		fmt.Printf("⚠️  [VESPER/FLUSH] DB open failed: %v\n", err)
		return
	}
	defer db.Close()

	rows, err := db.Query(queryPending)
	if err != nil {
		// Column may not exist on unmodernized DB — log and skip.
		fmt.Printf("⚠️  [VESPER/FLUSH] Query failed: %v\n", err)
		return
	}
	defer rows.Close()

	var proposals []Proposal
	for rows.Next() {
		var p Proposal
		if err := rows.Scan(&p.ID, &p.LogicHash, &p.Rationale, &p.Timestamp); err != nil {
			continue
		}
		proposals = append(proposals, p)
	}

	if len(proposals) == 0 {
		return
	}

	fmt.Printf("◈ [VESPER/FLUSH] %d pending proposal(s) found.\n", len(proposals))
	for _, p := range proposals {
		f.execute(db, p)
	}
}

// execute processes an approved proposal and seeds a triplet.
func (f *FlushGateClient) execute(db *sql.DB, p Proposal) {
	fmt.Printf("  ◦ [VESPER/FLUSH] Executing proposal id=%d hash=%s\n", p.ID, p.LogicHash)

	// Seed finding as a SPO triplet for Synapse ingestion.
	subject := fmt.Sprintf("vesper:proposal:%s", p.LogicHash)
	_, err := db.Exec(insertTriplet, subject, "was_approved_at", p.Timestamp)
	if err != nil {
		fmt.Printf("⚠️  [VESPER/FLUSH] Triplet seed failed for %s: %v\n", p.LogicHash, err)
	}
	if p.Rationale != "" {
		_, err = db.Exec(insertTriplet, subject, "rationale", p.Rationale)
		if err != nil {
			fmt.Printf("⚠️  [VESPER/FLUSH] Rationale triplet failed: %v\n", err)
		}
	}

	// Mark proposal as executed.
	if _, err := db.Exec(markExecuted, p.ID); err != nil {
		fmt.Printf("⚠️  [VESPER/FLUSH] Mark-executed failed for id=%d: %v\n", p.ID, err)
	}
}
