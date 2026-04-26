package main

import (
	"database/sql"
	"fmt"
	"log"

	_ "modernc.org/sqlite"
)

/**
 * CRUSH_SPATIAL : v3.8.0 (Neural Promenade)
 * 
 * Implements room-scale proximity queries using SQLite RTREE.
 */

type SpatialResult struct {
	SourceTable string
	SourceID    string
	Label       string
	Distance    float64
}

func QueryProximity(dbPath string, x, y, z, radius float64) ([]SpatialResult, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}
	defer db.Close()

	// 1. Spatial Search via RTREE
	// minX <= x+r AND maxX >= x-r ...
	query := `
		SELECT m.source_table, m.source_id, m.label
		FROM spatial_palace_nodes n
		JOIN spatial_node_mapping m ON n.id = m.id
		WHERE n.minX <= ? AND n.maxX >= ?
		  AND n.minY <= ? AND n.maxY >= ?
		  AND n.minZ <= ? AND n.maxZ >= ?
	`
	rows, err := db.Query(query, x+radius, x-radius, y+radius, y-radius, z+radius, z-radius)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	var results []SpatialResult
	for rows.Next() {
		var r SpatialResult
		if err := rows.Scan(&r.SourceTable, &r.SourceID, &r.Label); err != nil {
			continue
		}
		results = append(results, r)
	}

	return results, nil
}

func SpatialCommand(args []string) {
	if len(args) < 4 {
		fmt.Println("Usage: crush spatial <x> <y> <z> <radius>")
		return
	}

	var x, y, z, r float64
	fmt.Sscanf(args[0], "%f", &x)
	fmt.Sscanf(args[1], "%f", &y)
	fmt.Sscanf(args[2], "%f", &z)
	fmt.Sscanf(args[3], "%f", &r)

	fmt.Printf(">> QUERYING SPATIAL PROXIMITY AT (%.2f, %.2f, %.2f) RADIUS %.2f...\n", x, y, z, r)
	
	results, err := QueryProximity("data/SovereignIntelligence.db", x, y, z, r)
	if err != nil {
		log.Fatalf("❌ Spatial query failed: %v", err)
	}

	fmt.Printf(">> FOUND %d NODES IN PROXIMITY:\n", len(results))
	for _, res := range results {
		fmt.Printf("● [%s] %s (%s)\n", res.SourceTable, res.Label, res.SourceID)
	}
}
