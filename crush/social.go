package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

/**
 * CRUSH_SOCIAL : v3.8.8 (Social Intelligence Mesh)
 * 
 * Implements agent peer-review commands (boost/like/post).
 */

func SocialCommand(args []string) {
	if len(args) < 3 {
		fmt.Println("Usage: crush social <action> <actor_id> <target_id>")
		fmt.Println("Actions: boost, like, post")
		return
	}

	action := args[0]
	actorID := args[1]
	targetID := args[2] // Could be a shard name or triplet ID

	dbPath := "data/SovereignIntelligence.db"
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		log.Fatalf("❌ Failed to open DB: %v", err)
	}
	defer db.Close()

	fmt.Printf(">> INITIATING SOCIAL %s BY %s ON %s...\n", action, actorID, targetID)

	switch action {
	case "like", "boost":
		// Increment peer_validations and update reputation_score
		// We add a simple heuristic: each like adds 1.0 to reputation
		query := `
			UPDATE intelligence_shards 
			SET peer_validations = peer_validations + 1,
				reputation_score = reputation_score + 1.0
			WHERE name = ?
		`
		res, err := db.Exec(query, targetID)
		if err != nil {
			log.Fatalf("❌ Social update failed: %v", err)
		}
		
		affected, _ := res.RowsAffected()
		if affected == 0 {
			// Try updating triplets if it's not a shard
			queryTriplets := `
				UPDATE os_triplets 
				SET peer_validations = peer_validations + 1,
					reputation_score = reputation_score + 1.0
				WHERE subject_id = ?
			`
			resTriplets, _ := db.Exec(queryTriplets, targetID)
			affectedTriplets, _ := resTriplets.RowsAffected()
			if affectedTriplets == 0 {
				fmt.Printf("❌ Target %s not found in shards or triplets.\n", targetID)
				return
			}
		}

		fmt.Printf("✅ SOCIAL %s CONFIRMED. Reputation increased for %s.\n", action, targetID)

	case "post":
		fmt.Println(">> SOCIAL POSTING NOT YET IMPLEMENTED IN CLI.")

	default:
		fmt.Printf("❌ Unknown social action: %s\n", action)
	}
}
