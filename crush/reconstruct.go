package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

/**
 * CRUSH_RECONSTRUCT : v3.8.0 (Sociotomy Hardened)
 *
 * Enforces strict separation between OS and RKG vaults.
 * Functional logic (OS) -> SovereignIntelligence.db -> D:\Obsidian_Sovereign_OS
 * Simulation lore (RED) -> Akashik.db -> D:\Obsidian_RKG
 */

const (
	DefaultOsVaultPath  = "/mnt/d/Obsidian_Sovereign_OS"
	DefaultRkgVaultPath = "/mnt/d/Obsidian_RKG"
	DefaultDBPath       = "data/Akashik.db"
)

type Reconstructor struct {
	AkashikDB    *sql.DB
	SovereignDB  *sql.DB
	OsVaultPath  string
	RkgVaultPath string
	Timestamp    string
}

func NewReconstructor(akashikPath, sovereignPath, osPath, rkgPath string) (*Reconstructor, error) {
	adb, err := sql.Open("sqlite", akashikPath)
	if err != nil {
		return nil, err
	}
	sdb, err := sql.Open("sqlite", sovereignPath)
	if err != nil {
		return nil, err
	}
	return &Reconstructor{
		AkashikDB:    adb,
		SovereignDB:  sdb,
		OsVaultPath:  osPath,
		RkgVaultPath: rkgPath,
		Timestamp:    time.Now().UTC().Format(time.RFC3339),
	}, nil
}

func (r *Reconstructor) cleanFilename(name string) string {
	name = strings.ReplaceAll(name, " ", "_")
	name = strings.ReplaceAll(name, "/", "_")
	name = strings.ReplaceAll(name, "\"", "")
	if len(name) > 200 {
		return name[:200]
	}
	return name
}

func (r *Reconstructor) ensureDir(path string) {
	os.MkdirAll(path, 0755)
}

func (r *Reconstructor) writeFrontmatter(f *os.File, subject, typeStr, source string, tags []string, district string, extra map[string]string) {
	fmt.Fprintf(f, "---\n")
	fmt.Fprintf(f, "subject: %s\n", subject)
	fmt.Fprintf(f, "type: %s\n", typeStr)
	fmt.Fprintf(f, "source: %s\n", source)
	if district != "" {
		fmt.Fprintf(f, "district: %s\n", district)
	}
	fmt.Fprintf(f, "tags: [%s]\n", strings.Join(tags, ", "))
	fmt.Fprintf(f, "sovereign: true\n")
	fmt.Fprintf(f, "provenance: SOVEREIGN_DB\n")
	fmt.Fprintf(f, "generated_at: %s\n", r.Timestamp)
	for k, v := range extra {
		fmt.Fprintf(f, "%s: %s\n", k, v)
	}
	fmt.Fprintf(f, "---\n\n")
}

func (r *Reconstructor) ReconstructTriplets() int {
	fmt.Println(">> RECONSTRUCTING RKG TRIPLET ENTITIES...")
	rows, err := r.AkashikDB.Query("SELECT subject_id, predicate, object_literal, COALESCE(district_id, '') FROM triplets WHERE predicate NOT LIKE 'PURGED_%'")
	if err != nil {
		log.Printf("❌ [RECONSTRUCT] Triplets query failed: %v", err)
		return 0
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var sub, pred, obj, district string
		rows.Scan(&sub, &pred, &obj, &district)

		filename := r.cleanFilename(sub)
		subfolder := "Lore"
		if strings.Contains(strings.ToLower(sub), "weapon") || strings.Contains(strings.ToLower(sub), "armor") {
			subfolder = "Items"
		}

		// ARTERY_TARGET: RKG VAULT
		baseDir := filepath.Join(r.RkgVaultPath, "Districts", district, subfolder)
		if district == "" {
			baseDir = filepath.Join(r.RkgVaultPath, "Global", subfolder)
		}

		r.ensureDir(baseDir)
		filePath := filepath.Join(baseDir, filename+".md")

		f, _ := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		fi, _ := f.Stat()
		if fi.Size() == 0 {
			r.writeFrontmatter(f, sub, "Entity", "AKASHIK_DB", []string{"rkg/lore"}, district, nil)
			fmt.Fprintf(f, "# %s\n\n### ◈ KNOWLEDGE TRIADS\n", sub)
		}
		fmt.Fprintf(f, "- **%s** :: [[%s]]\n", pred, obj)
		f.Close()
		count++
	}
	return count
}

func (r *Reconstructor) ReconstructNPCs() int {
	fmt.Println(">> RECONSTRUCTING RKG NPC ENTITIES...")
	rows, err := r.AkashikDB.Query("SELECT name, COALESCE(faction,'Independent'), disposition, COALESCE(district_id,''), id, hp, sp, emp FROM npcs")
	if err != nil {
		log.Printf("❌ [RECONSTRUCT] NPCs query failed: %v", err)
		return 0
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var name, faction, disposition, district, id string
		var hp, sp, emp int
		rows.Scan(&name, &faction, &disposition, &district, &id, &hp, &sp, &emp)

		filename := r.cleanFilename(name)
		
		// ARTERY_TARGET: RKG VAULT
		baseDir := filepath.Join(r.RkgVaultPath, "Districts", district, "Actors")
		r.ensureDir(baseDir)
		filePath := filepath.Join(baseDir, filename+".md")

		f, _ := os.Create(filePath)
		r.writeFrontmatter(f, name, "Actor", "AKASHIK_DB", []string{"rkg/actors", "faction/" + strings.ToLower(faction)}, district, map[string]string{"npc_id": id})
		fmt.Fprintf(f, "# %s\n\n- **Faction:** [[%s]]\n- **Disposition:** %s\n- **Status:** Alive\n\n### ◈ BIOMETRICS\n- **HP:** %d  **SP:** %d  **EMP:** %d\n", name, faction, disposition, hp, sp, emp)
		f.Close()
		count++
	}
	return count
}

func (r *Reconstructor) ReconstructShards() int {
	fmt.Println(">> RECONSTRUCTING OS INTELLIGENCE SHARDS...")
	rows, err := r.SovereignDB.Query("SELECT name, sector, content FROM intelligence_shards")
	if err != nil {
		log.Printf("❌ [RECONSTRUCT] Shards query failed: %v", err)
		return 0
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var name, sector, content string
		rows.Scan(&name, &sector, &content)

		// ALIGNMENT: Strip technical prefixes for vault aesthetic
		cleanName := strings.TrimPrefix(name, "Shard_")
		cleanName = strings.TrimPrefix(cleanName, "AbilityStone_")
		filename := r.cleanFilename(cleanName)
		
		// ALIGNMENT: Map sectors to superpower counterpart folders in OS VAULT
		targetFolder := "Shards"
		if sector == "BLUEPRINTS" {
			targetFolder = "Plans" 
		}

		// ARTERY_TARGET: OS VAULT
		baseDir := filepath.Join(r.OsVaultPath, targetFolder, sector)
		r.ensureDir(baseDir)
		filePath := filepath.Join(baseDir, filename+".md")

		f, _ := os.Create(filePath)
		r.writeFrontmatter(f, cleanName, "Intelligence_Shard", "SOVEREIGN_SYSTEM", []string{"shard", "sector/" + strings.ToLower(sector)}, sector, nil)
		fmt.Fprintf(f, "# %s\n\n- **Sector:** %s\n- **Type:** SYSTEM_AUTHORITY\n\n---\n\n%s", cleanName, sector, content)
		f.Close()
		count++
	}
	return count
}

func Reconstruct() {
	recon, err := NewReconstructor(DefaultDBPath, "data/SovereignIntelligence.db", DefaultOsVaultPath, DefaultRkgVaultPath)
	if err != nil {
		log.Fatal(err)
	}
	t := recon.ReconstructTriplets()
	n := recon.ReconstructNPCs()
	s := recon.ReconstructShards()
	fmt.Printf("✅ SOCIOTOMY RESTORED: %d RKG triplets, %d NPCs shored to RKG; %d shards shored to OS.\n", t, n, s)
}
