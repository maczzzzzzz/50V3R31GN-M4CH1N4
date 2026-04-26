package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"

	_ "modernc.org/sqlite"
)

/**
 * CRUSH_RECONSTRUCT : v3.8.7 (Namespace Isolation)
 *
 * Enforces absolute separation between static docs and dynamic DB shards.
 * Prevents Logseq namespace collisions.
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

func (r *Reconstructor) CleanseOsVault() {
	fmt.Println(">> INITIATING ABSOLUTE OS VAULT CLEANSE...")
	
	files, _ := os.ReadDir(r.OsVaultPath)
	allowlist := map[string]bool{
		"README.md":                true,
		"CHANGELOG.md":             true,
		"IMPLEMENTATION_PLAN.md":   true,
		"SOVEREIGN_VITAL_SIGNS.md": true,
		"SOVEREIGN-IDENTITY.md":    true,
		"NAVIGATOR.md":             true,
		"OS_CORE.md":               true,
		"SHARD_TREE.md":            true,
		"GUIDE_TREE.md":            true,
		"PLAN_TREE.md":             true,
		"SPEC_TREE.md":             true,
		"PHASE_TREE.md":            true,
		"RESEARCH_TREE.md":         true,
		"Sovereign-Roadmap.md":     true,
		"Specs":                    true,
		"Plans":                    true,
		"Research":                 true,
		"Shards":                   true,
		"akashik_guides":           true,
		".obsidian":                true,
	}

	for _, f := range files {
		if !allowlist[f.Name()] {
			path := filepath.Join(r.OsVaultPath, f.Name())
			_ = os.RemoveAll(path)
		}
	}

	// ◈ Task: Isolation - Wipe all doc folders to ensure zero orphans/collisions
	arteries := []string{"Specs", "Plans", "Research", "Shards"}
	for _, art := range arteries {
		path := filepath.Join(r.OsVaultPath, art)
		_ = os.RemoveAll(path)
		r.ensureDir(path)
	}
}

func (r *Reconstructor) MirrorManifests() {
	fmt.Println(">> MIRRORING CORE MANIFESTS...")
	manifests := []string{
		"README.md", "CHANGELOG.md", "IMPLEMENTATION_PLAN.md",
		"SOVEREIGN_VITAL_SIGNS.md", "SOVEREIGN-IDENTITY.md", "NAVIGATOR.md",
	}
	for _, f := range manifests {
		input, err := os.ReadFile(f)
		if err == nil {
			_ = os.WriteFile(filepath.Join(r.OsVaultPath, f), input, 0644)
		}
	}
}

func (r *Reconstructor) MirrorDirectories() {
	fmt.Println(">> MIRRORING SUPERPOWER ARTERIES (PARALLEL)...")
	mirrors := map[string]string{
		"docs/superpowers/specs":    "Specs",
		"docs/superpowers/plans":    "Plans",
		"docs/superpowers/research": "Research",
		"akashik_guides":            "akashik_guides",
	}

	var wg sync.WaitGroup
	for src, target := range mirrors {
		wg.Add(1)
		go func(s, t string) {
			defer wg.Done()
			targetPath := filepath.Join(r.OsVaultPath, t)
			r.ensureDir(targetPath)
			filepath.Walk(s, func(path string, info os.FileInfo, err error) error {
				if err != nil || info.IsDir() || strings.Contains(path, "/archive/") || strings.Contains(path, "\\archive\\") {
					return nil
				}
				rel, _ := filepath.Rel(s, path)
				dstPath := filepath.Join(targetPath, rel)
				r.ensureDir(filepath.Dir(dstPath))
				input, _ := os.ReadFile(path)
				_ = os.WriteFile(dstPath, input, 0644)
				return nil
			})
		}(src, target)
	}
	wg.Wait()
}

func (r *Reconstructor) GenerateTrees(shardCount int) {
	fmt.Println(">> GENERATING HUB TREES...")
	
	coreContent := "# ◈ SOVEREIGN OS CORE\nPARENT :: [[NAVIGATOR]]\n---\n- [[PHASE_TREE]]\n- [[SPEC_TREE]]\n- [[PLAN_TREE]]\n- [[RESEARCH_TREE]]\n- [[SHARD_TREE]]\n- [[GUIDE_TREE]]\n"
	_ = os.WriteFile(filepath.Join(r.OsVaultPath, "OS_CORE.md"), []byte(coreContent), 0644)

	var wg sync.WaitGroup
	wg.Add(4)
	go func() { defer wg.Done(); r.materializeDynamicTree("docs/superpowers/plans", "PLAN_TREE.md", "PLAN TREE", "Plans") }()
	go func() { defer wg.Done(); r.materializeDynamicTree("docs/superpowers/specs", "SPEC_TREE.md", "SPEC TREE", "Specs") }()
	go func() { defer wg.Done(); r.materializeDynamicTree("docs/superpowers/research", "RESEARCH_TREE.md", "RESEARCH TREE", "Research") }()
	go func() { defer wg.Done(); r.materializeDynamicTree("docs/superpowers/shards", "SHARD_TREE.md", "SHARD TREE", "Shards") }()
	wg.Wait()
}

func (r *Reconstructor) materializeDynamicTree(srcDir, filename, title, vaultFolder string) {
	content := fmt.Sprintf("# ◈ %s\nPARENT :: [[OS_CORE]]\n---\n\n", title)
	filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || !strings.HasSuffix(info.Name(), ".md") {
			return nil
		}
		rel, _ := filepath.Rel(srcDir, path)
		cleanRel := strings.TrimSuffix(rel, ".md")
		link := fmt.Sprintf("- [[%s/%s|%s]]\n", vaultFolder, strings.ReplaceAll(cleanRel, "\\", "/"), info.Name())
		content += link
		return nil
	})
	_ = os.WriteFile(filepath.Join(r.OsVaultPath, filename), []byte(content), 0644)
}

func (r *Reconstructor) ReconstructTriplets() int {
	fmt.Println(">> RECONSTRUCTING RKG TRIPLET ENTITIES...")
	rows, err := r.AkashikDB.Query("SELECT subject_id, predicate, object_literal, COALESCE(district_id, '') FROM triplets WHERE predicate NOT LIKE 'PURGED_%'")
	if err != nil { return 0 }
	defer rows.Close()

	count := 0
	for rows.Next() {
		var sub, pred, obj, district string
		rows.Scan(&sub, &pred, &obj, &district)
		filename := r.cleanFilename(sub)
		subfolder := "Lore"; if strings.Contains(strings.ToLower(sub), "weapon") || strings.Contains(strings.ToLower(sub), "armor") { subfolder = "Items" }
		baseDir := filepath.Join(r.RkgVaultPath, "Districts", district, subfolder)
		if district == "" { baseDir = filepath.Join(r.RkgVaultPath, "Global", subfolder) }
		r.ensureDir(baseDir)
		filePath := filepath.Join(baseDir, filename+".md")
		f, _ := os.OpenFile(filePath, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0644)
		fi, _ := f.Stat()
		if fi.Size() == 0 {
			r.writeFrontmatter(f, sub, "Entity", "AKASHIK_DB", []string{"rkg/lore"}, district, nil)
			fmt.Fprintf(f, "# %s\n\n### ◈ KNOWLEDGE TRIADS\n", sub)
		}
		fmt.Fprintf(f, "- **%s** :: [[%s]]\n", pred, obj)
		f.Close(); count++
	}
	return count
}

func (r *Reconstructor) ReconstructNPCs() int {
	fmt.Println(">> RECONSTRUCTING RKG NPC ENTITIES...")
	rows, err := r.AkashikDB.Query("SELECT name, COALESCE(faction,'Independent'), disposition, COALESCE(district_id,''), id, hp, sp, emp FROM npcs")
	if err != nil { return 0 }
	defer rows.Close()

	count := 0
	for rows.Next() {
		var name, faction, disposition, district, id string
		var hp, sp, emp int
		rows.Scan(&name, &faction, &disposition, &district, &id, &hp, &sp, &emp)
		filename := r.cleanFilename(name)
		baseDir := filepath.Join(r.RkgVaultPath, "Districts", district, "Actors"); r.ensureDir(baseDir)
		filePath := filepath.Join(baseDir, filename+".md")
		f, _ := os.Create(filePath)
		r.writeFrontmatter(f, name, "Actor", "AKASHIK_DB", []string{"rkg/actors", "faction/" + strings.ToLower(faction)}, district, map[string]string{"npc_id": id})
		fmt.Fprintf(f, "# %s\n\n- **Faction:** [[%s]]\n- **Disposition:** %s\n- **Status:** Alive\n\n### ◈ BIOMETRICS\n- **HP:** %d  **SP:** %d  **EMP:** %d\n", name, faction, disposition, hp, sp, emp)
		f.Close(); count++
	}
	return count
}

func (r *Reconstructor) ReconstructShards() int {
	fmt.Println(">> RECONSTRUCTING OS INTELLIGENCE SHARDS...")
	rows, err := r.SovereignDB.Query("SELECT name, sector, content FROM intelligence_shards")
	if err != nil { return 0 }
	defer rows.Close()

	count := 0
	for rows.Next() {
		var name, sector, content string
		rows.Scan(&name, &sector, &content)
		cleanName := strings.TrimPrefix(strings.TrimPrefix(name, "Shard_"), "AbilityStone_")
		filename := r.cleanFilename(cleanName)
		
		// ◈ Task: Isolation - All DB shards go to /Shards/ to prevent Plans/Specs collisions
		baseDir := filepath.Join(r.OsVaultPath, "Shards", sector); r.ensureDir(baseDir)
		filePath := filepath.Join(baseDir, filename+".md")
		
		f, _ := os.Create(filePath)
		r.writeFrontmatter(f, cleanName, "Intelligence_Shard", "SOVEREIGN_SYSTEM", []string{"shard", "sector/" + strings.ToLower(sector)}, sector, nil)
		fmt.Fprintf(f, "# %s\n\n- **Sector:** %s\n- **Type:** SYSTEM_AUTHORITY\n\n---\n\n%s", cleanName, sector, content)
		f.Close(); count++
	}
	return count
}

func (r *Reconstructor) GenerateKanban() {
	fmt.Println(">> SYNCHRONIZING KANBAN ROADMAP...")
	out, err := exec.Command("npx", "tsx", "scripts/ops/generate-kanban.ts").Output()
	if err != nil { fmt.Printf("❌ Kanban generation failed: %v\n", err); return }
	_ = os.WriteFile(filepath.Join(r.OsVaultPath, "Sovereign-Roadmap.md"), out, 0644)
}

func Reconstruct() {
	recon, err := NewReconstructor(DefaultDBPath, "data/SovereignIntelligence.db", DefaultOsVaultPath, DefaultRkgVaultPath)
	if err != nil { log.Fatal(err) }

	start := time.Now()
	recon.CleanseOsVault()

	var wg sync.WaitGroup
	wg.Add(4)

	go func() { defer wg.Done(); recon.MirrorManifests(); recon.MirrorDirectories() }()
	go func() { defer wg.Done(); recon.ReconstructTriplets(); recon.ReconstructNPCs() }()
	go func() { defer wg.Done(); s := recon.ReconstructShards(); recon.GenerateTrees(s) }()
	go func() { defer wg.Done(); recon.GenerateKanban() }()

	wg.Wait()
	fmt.Printf("✅ RECONSTRUCTION COMPLETE in %v. Total Parity Achieved.\n", time.Since(start))
}
