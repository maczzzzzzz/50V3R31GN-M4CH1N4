package main

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	_ "modernc.org/sqlite"
)

/**
 * CRUSH_RECONSTRUCT : v3.8.0 (Absolute Sociotomy)
 *
 * Enforces bit-identical separation between OS and RKG.
 * 1. Functional logic (OS) -> D:\Obsidian_Sovereign_OS
 * 2. Simulation lore (RED) -> D:\Obsidian_RKG
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
	// We list all root-level artifacts that are NOT allowed.
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
	fmt.Println(">> MIRRORING SUPERPOWER ARTERIES...")
	mirrors := map[string]string{
		"docs/superpowers/specs":    "Specs",
		"docs/superpowers/plans":    "Plans",
		"docs/superpowers/research": "Research",
		"akashik_guides":            "akashik_guides",
	}

	for src, target := range mirrors {
		targetPath := filepath.Join(r.OsVaultPath, target)
		r.ensureDir(targetPath)
		filepath.Walk(src, func(path string, info os.FileInfo, err error) error {
			if err != nil || info.IsDir() {
				return nil
			}
			rel, _ := filepath.Rel(src, path)
			dstPath := filepath.Join(targetPath, rel)
			r.ensureDir(filepath.Dir(dstPath))
			input, _ := os.ReadFile(path)
			_ = os.WriteFile(dstPath, input, 0644)
			return nil
		})
	}
}

func (r *Reconstructor) GenerateTrees(shardCount int) {
	fmt.Println(">> GENERATING HUB TREES...")

	// 1. OS_CORE.md
	coreContent := "# ◈ SOVEREIGN OS CORE\nPARENT :: [[NAVIGATOR]]\n---\n- [[PHASE_TREE]]\n- [[SPEC_TREE]]\n- [[PLAN_TREE]]\n- [[RESEARCH_TREE]]\n- [[SHARD_TREE]]\n- [[GUIDE_TREE]]\n"
	_ = os.WriteFile(filepath.Join(r.OsVaultPath, "OS_CORE.md"), []byte(coreContent), 0644)

	// 2. GUIDE_TREE.md
	guideContent := "# ◈ GUIDE TREE\nPARENT :: [[OS_CORE]]\n---\n- [[akashik_guides/00_system_setup/README|00_SYSTEM_SETUP]]\n- [[akashik_guides/01_crush_cli/reference-crush-cli|01_CRUSH_CLI]]\n- [[akashik_guides/02_deck_igniter/reference-deck-igniter|02_DECK_IGNITER]]\n- [[akashik_guides/03_omni_orchestrator/explanation-orchestrator|03_OMNI_ORCHESTRATOR]]\n- [[akashik_guides/04_unified_oracle/reference-oracle|04_UNIFIED_ORACLE]]\n- [[akashik_guides/05_red_trade_economy/explanation-economy|05_RED_TRADE_ECONOMY]]\n- [[akashik_guides/06_perception_systems/how-to-mission-swarm|06_PERCEPTION_SYSTEMS]]\n- [[akashik_guides/07_obsidian_vault/how-to-use-vault|07_OBSIDIAN_VAULT]]\n- [[akashik_guides/08_sovereign_identity/profiles-and-identity|08_SOVEREIGN_IDENTITY]]\n- [[akashik_guides/09_logseq_mesh/setup-logseq|09_LOGSEQ_MESH]]\n"
	_ = os.WriteFile(filepath.Join(r.OsVaultPath, "GUIDE_TREE.md"), []byte(guideContent), 0644)

	// 3. Dynamic Tree Hubs (Plans, Specs, Research, Shards)
	r.materializeDynamicTree("docs/superpowers/plans", "PLAN_TREE.md", "PLAN TREE", "Plans")
	r.materializeDynamicTree("docs/superpowers/specs", "SPEC_TREE.md", "SPEC TREE", "Specs")
	r.materializeDynamicTree("docs/superpowers/research", "RESEARCH_TREE.md", "RESEARCH TREE", "Research")
	r.materializeDynamicTree("docs/superpowers/shards", "SHARD_TREE.md", "SHARD TREE", "Shards")
}

func (r *Reconstructor) materializeDynamicTree(srcDir, filename, title, vaultFolder string) {
	content := fmt.Sprintf("# ◈ %s\nPARENT :: [[OS_CORE]]\n---\n\n", title)
	
	filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil || info.IsDir() || !strings.HasSuffix(info.Name(), ".md") {
			return nil
		}
		rel, _ := filepath.Rel(srcDir, path)
		cleanRel := strings.TrimSuffix(rel, ".md")
		// Correct link path for Obsidian
		link := fmt.Sprintf("- [[%s/%s|%s]]\n", vaultFolder, strings.ReplaceAll(cleanRel, "\\", "/"), info.Name())
		content += link
		return nil
	})

	_ = os.WriteFile(filepath.Join(r.OsVaultPath, filename), []byte(content), 0644)
}

func (r *Reconstructor) ReconstructTriplets() int {
	fmt.Println(">> RECONSTRUCTING RKG TRIPLET ENTITIES...")
	rows, err := r.AkashikDB.Query("SELECT subject_id, predicate, object_literal, COALESCE(district_id, '') FROM triplets WHERE predicate NOT LIKE 'PURGED_%'")
	if err != nil {
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
		return 0
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var name, faction, disposition, district, id string
		var hp, sp, emp int
		rows.Scan(&name, &faction, &disposition, &district, &id, &hp, &sp, &emp)
		filename := r.cleanFilename(name)
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
		return 0
	}
	defer rows.Close()

	count := 0
	for rows.Next() {
		var name, sector, content string
		rows.Scan(&name, &sector, &content)
		cleanName := strings.TrimPrefix(name, "Shard_")
		cleanName = strings.TrimPrefix(cleanName, "AbilityStone_")
		filename := r.cleanFilename(cleanName)
		targetFolder := "Shards"
		if sector == "BLUEPRINTS" {
			targetFolder = "Plans" 
		}
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

func (r *Reconstructor) GenerateKanban() {
	fmt.Println(">> SYNCHRONIZING KANBAN ROADMAP...")
	out, err := exec.Command("npx", "tsx", "scripts/ops/generate-kanban.ts").Output()
	if err != nil {
		fmt.Printf("❌ Kanban generation failed: %v\n", err)
		return
	}
	_ = os.WriteFile(filepath.Join(r.OsVaultPath, "Sovereign-Roadmap.md"), out, 0644)
}

func Reconstruct() {
	recon, err := NewReconstructor(DefaultDBPath, "data/SovereignIntelligence.db", DefaultOsVaultPath, DefaultRkgVaultPath)
	if err != nil {
		log.Fatal(err)
	}
	recon.CleanseOsVault()
	recon.MirrorManifests()
	recon.MirrorDirectories()
	t := recon.ReconstructTriplets()
	recon.ReconstructNPCs()
	s := recon.ReconstructShards()
	recon.GenerateTrees(s)
	recon.GenerateKanban()
	fmt.Printf("✅ ABSOLUTE SOCIOTOMY RESTORED: %d RKG triplets; %d OS shards shored.\n", t, s)
}
