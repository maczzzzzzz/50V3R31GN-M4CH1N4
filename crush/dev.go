package main

import (
	"fmt"
	"os"
	"os/exec"
)

// dev.go — Development and Testing Command Suite
// Implements 'crush dev' for forcing states, triggering daemons, and manual testing.

func runDev(args []string) int {
	if len(args) == 0 {
		printDevUsage()
		return 1
	}

	switch args[0] {
	case "trigger":
		if len(args) < 2 {
			fmt.Println("Usage: crush dev trigger [deadlock|dream]")
			return 1
		}
		switch args[1] {
		case "deadlock":
			traceID := "test-deadlock"
			if len(args) > 2 {
				traceID = args[2]
			}
			fmt.Printf("◈ [DEV] Forcing Deadlock for trace: %s\n", traceID)
			_, err := EmitSovereignHallCall(traceID, "DEV_SIMULATION_DEADLOCK")
			if err != nil {
				fmt.Printf("❌ Failed: %v\n", err)
				return 1
			}
			fmt.Println("✅ Deadlock triggered. Sovereign Hall meeting opened.")
			return 0

		case "dream":
			fmt.Println("◈ [DEV] Igniting Dream Cycle (Ouroboros)...")
			cmd := exec.Command("nix", "develop", "--command", "tsx", "scripts/dev/dream-daemon.ts")
			cmd.Stdout = os.Stdout
			cmd.Stderr = os.Stderr
			if err := cmd.Run(); err != nil {
				fmt.Printf("❌ Dream Cycle failed: %v\n", err)
				return 1
			}
			return 0
		default:
			fmt.Printf("Unknown trigger: %s\n", args[1])
			return 1
		}

	case "purge-cache":
		fmt.Println("◈ [DEV] Purging temporary logs and caches...")
		_ = exec.Command("rm", "-f", "data/logs/*.log").Run()
		_ = exec.Command("rm", "-f", "data/logs/*.tmp").Run()
		fmt.Println("✅ Caches purged.")
		return 0

	case "inject-triplet":
		if len(args) < 4 {
			fmt.Println("Usage: crush dev inject-triplet <subject> <predicate> <object>")
			return 1
		}
		sub, pred, obj := args[1], args[2], args[3]
		fmt.Printf("◈ [DEV] Injecting Triplet: [%s] -> [%s] -> [%s]\n", sub, pred, obj)
		
		sql := fmt.Sprintf("INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal, source_id) VALUES ('%s', '%s', '%s', 'DEV_INJECT');", sub, pred, obj)
		err := exec.Command("sqlite3", "data/SovereignIntelligence.db", sql).Run()
		if err != nil {
			fmt.Printf("❌ Injection failed: %v\n", err)
			return 1
		}
		fmt.Println("✅ Triplet shored.")
		return 0

	case "mmap-write":
		// Low-level VSB debug hook
		fmt.Println("◈ [DEV] VSB Manual Mmap write is locked in this build for safety. Use specific crush commands (e.g., radar).")
		return 0

	default:
		fmt.Printf("Unknown dev command: %s\n", args[0])
		printDevUsage()
		return 1
	}
}

func printDevUsage() {
	fmt.Println(`Usage: crush dev <subcommand>

Subcommands:
  trigger deadlock <id>       Force a Sovereign Hall meeting
  trigger dream               Force a Dream Cycle (Ouroboros loop)
  trigger shift <profile>     Force an Identity Switch packet into VSB
  simulate-agent <id> <s> <i> Inject a mock agent into the WebGL Swarm
  clear-audit                 Purge the decision_audit table
  purge-cache                 Clear temporary logs (*.log, *.tmp)
  inject-triplet <s> <p> <o>  Force a triplet into the RKG
  mmap-write                  (Locked)`)
}
gs) < 4 {
			fmt.Println("Usage: crush dev inject-triplet <subject> <predicate> <object>")
			return 1
		}
		sub, pred, obj := args[1], args[2], args[3]
		fmt.Printf("◈ [DEV] Injecting Triplet: [%s] -> [%s] -> [%s]\n", sub, pred, obj)
		
		sql := fmt.Sprintf("INSERT OR IGNORE INTO os_triplets (subject_id, predicate, object_literal, source_id) VALUES ('%s', '%s', '%s', 'DEV_INJECT');", sub, pred, obj)
		err := exec.Command("sqlite3", "data/SovereignIntelligence.db", sql).Run()
		if err != nil {
			fmt.Printf("❌ Injection failed: %v\n", err)
			return 1
		}
		fmt.Println("✅ Triplet shored.")
		return 0

	case "mmap-write":
		// Low-level VSB debug hook
		fmt.Println("◈ [DEV] VSB Manual Mmap write is locked in this build for safety. Use specific crush commands (e.g., radar).")
		return 0

	default:
		fmt.Printf("Unknown dev command: %s\n", args[0])
		printDevUsage()
		return 1
	}
}

func printDevUsage() {
	fmt.Println(`Usage: crush dev <subcommand>

Subcommands:
  trigger deadlock <id>  Force a Sovereign Hall meeting
  trigger dream          Force a Dream Cycle (Ouroboros loop)
  purge-cache            Clear temporary logs
  inject-triplet <s> <p> <o>  Force a triplet into the RKG
  mmap-write             (Locked)`)
}
