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
 * CRUSH_RECONSTRUCT : v3.7.0
 *
 * Full Go port of fast-reconstruct.py with complete parity.
 * Reconstructs the Obsidian Vault (RKG) from Akashik.db.
 */

const (
	DefaultVaultPath = "/home/nixos/50V3R31GN-M4CH1N4/data/vault/RKG"
	DefaultDBPath    = "data/Akashik.db"
)

type Reconstructor struct {
	DB        *sql.DB
	VaultPath string
	Timestamp string
}

func NewReconstructor(dbPath, vaultPath string) (*Reconstructor, error) {
	db, err := sql.Open("sqlite", dbPath)
	if err != nil {
		return nil, err
	}
	return &Reconstructor{
		DB:        db,
		VaultPath: vaultPath,
		Timestamp: time.Now().UTC().Format(time.RFC3339),
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
	fmt.Fprintf(f, "provenance: AKASHIK_DB\n")
	fmt.Fprintf(f, "generated_at: %s\n", r.Timestamp)
	for k, v := range extra {
		fmt.Fprintf(f, "%s: %s\n", k, v)
	}
	fmt.Fprintf(f, "---\n\n")
}

func (r *Reconstructor) ReconstructTriplets() int {
	fmt.Println(">> RECONSTRUCTING TRIPLET ENTITIES...")
	rows, err := r.DB.Query("SELECT subject_id, predicate, object_literal, COALESCE(district_id, '') FROM triplets WHERE predicate NOT LIKE 'PURGED_%'")
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

		baseDir := filepath.Join(r.VaultPath, "Districts", district, subfolder)
		if district == "" {
			baseDir = filepath.Join(r.VaultPath, "Global", subfolder)
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
	fmt.Println(">> RECONSTRUCTING NPC ENTITIES...")
	rows, err := r.DB.Query("SELECT name, COALESCE(faction,'Independent'), disposition, COALESCE(district_id,''), id, hp, sp, emp FROM npcs")
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
		baseDir := filepath.Join(r.VaultPath, "Districts", district, "Actors")
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

func main() {
	recon, err := NewReconstructor(DefaultDBPath, DefaultVaultPath)
	if err != nil {
		log.Fatal(err)
	}
	t := recon.ReconstructTriplets()
	n := recon.ReconstructNPCs()
	fmt.Printf("✅ RECONSTRUCTION COMPLETE: %d triplets, %d NPCs shored.\n", t, n)
}
