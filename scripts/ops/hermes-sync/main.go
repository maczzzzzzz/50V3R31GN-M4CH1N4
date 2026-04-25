// hermes-sync/main.go
//
// Phase 73.3 — IMPLEMENTATION_PLAN.md → Hermes Kanban Bridge
//
// Parses IMPLEMENTATION_PLAN.md for phase/task checkboxes and syncs
// card state to the hermes-kanban Obsidian plugin REST API (port 27124).
//
// Column mapping:
//   [ ]  → "To Do"
//   [x]  → "Done"
//   Phase header with 🛠️ → marks its tasks as "In Progress"
//
// Usage:
//   go run scripts/ops/hermes-sync/main.go --sync
//   HERMES_KANBAN_URL=http://node-c:27124 go run ... --sync
//
// Env vars:
//   HERMES_KANBAN_URL   default: http://localhost:27124
//   HERMES_KANBAN_BOARD default: Sovereign-Pipeline.md
//   IMPL_PLAN_PATH      default: IMPLEMENTATION_PLAN.md

package main

import (
	"bufio"
	"bytes"
	"encoding/json"
	"flag"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"regexp"
	"strings"
)

// ── Types ──────────────────────────────────────────────────────────────────

type Task struct {
	Phase  string
	Title  string
	Done   bool
	Column string // "To Do" | "Done" | "In Progress"
}

type CardPayload struct {
	BoardID  string   `json:"boardId"`
	Column   string   `json:"column"`
	Title    string   `json:"title"`
	Priority string   `json:"priority"`
	Tags     []string `json:"tags"`
}

type MovePayload struct {
	ID     string `json:"id"`
	Column string `json:"column"`
}

type APIResponse struct {
	OK      bool   `json:"ok"`
	Message string `json:"message"`
	Error   string `json:"error"`
}

type CardResult struct {
	ID     string `json:"id"`
	Title  string `json:"title"`
	Column string `json:"column"`
}

// ── Regexes ────────────────────────────────────────────────────────────────

var (
	// Matches: ## ✅ PHASE 72: ... or ## 🛠️ PHASE 73: ...
	phaseRe = regexp.MustCompile(`^##\s+(✅|🛠️|PHASE)\s+PHASE\s+([\d.]+):?\s+(.+)`)
	// Matches: - [ ] **Task N: Title** or - [x] **Task N: Title**
	taskRe = regexp.MustCompile(`^\s*-\s+\[([x ])\]\s+\*\*(.+?)\*\*`)
)

// ── Plan Parser ────────────────────────────────────────────────────────────

func parsePlan(path string) ([]Task, error) {
	f, err := os.Open(path)
	if err != nil {
		return nil, fmt.Errorf("open %s: %w", path, err)
	}
	defer f.Close()

	var tasks []Task
	var currentPhase string
	var phaseInProgress bool

	scanner := bufio.NewScanner(f)
	for scanner.Scan() {
		line := scanner.Text()

		if m := phaseRe.FindStringSubmatch(line); m != nil {
			marker := m[1]
			num := m[2]
			name := strings.TrimSpace(m[3])
			// Strip trailing status markers from name
			name = strings.TrimRight(name, " (COMPLETED)")
			currentPhase = fmt.Sprintf("Phase %s: %s", num, name)
			phaseInProgress = (marker == "🛠️")
			continue
		}

		if m := taskRe.FindStringSubmatch(line); m != nil && currentPhase != "" {
			done := m[1] == "x"
			title := strings.TrimSpace(m[2])

			col := "To Do"
			switch {
			case done:
				col = "Done"
			case phaseInProgress:
				col = "In Progress"
			}

			tasks = append(tasks, Task{
				Phase:  currentPhase,
				Title:  title,
				Done:   done,
				Column: col,
			})
		}
	}

	return tasks, scanner.Err()
}

// ── Kanban API Client ──────────────────────────────────────────────────────

func queryCards(baseURL, board, column string) ([]CardResult, error) {
	q := url.Values{}
	q.Set("boardId", board)
	if column != "" {
		q.Set("column", column)
	}

	resp, err := http.Get(baseURL + "/query?" + q.Encode())
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	var results []CardResult
	if err := json.Unmarshal(body, &results); err != nil {
		// API might return an error object instead of array
		return nil, fmt.Errorf("query parse error: %w (body: %s)", err, body)
	}
	return results, nil
}

func createCard(baseURL, board string, task Task) error {
	tagSlug := strings.ToLower(
		strings.ReplaceAll(
			strings.ReplaceAll(task.Phase, " ", "-"),
			":", "",
		),
	)
	payload := CardPayload{
		BoardID:  board,
		Column:   task.Column,
		Title:    task.Title,
		Priority: "medium",
		Tags:     []string{"sovereign", tagSlug},
	}
	body, _ := json.Marshal(payload)

	resp, err := http.Post(baseURL+"/cards", "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result APIResponse
	json.NewDecoder(resp.Body).Decode(&result)
	if !result.OK {
		return fmt.Errorf("create failed: %s", result.Error)
	}
	return nil
}

func moveCard(baseURL, cardID, targetColumn string) error {
	payload := MovePayload{ID: cardID, Column: targetColumn}
	body, _ := json.Marshal(payload)

	resp, err := http.Post(baseURL+"/cards/move", "application/json", bytes.NewReader(body))
	if err != nil {
		return err
	}
	defer resp.Body.Close()

	var result APIResponse
	json.NewDecoder(resp.Body).Decode(&result)
	if !result.OK {
		return fmt.Errorf("move failed: %s", result.Error)
	}
	return nil
}

func syncCard(baseURL, board string, task Task) error {
	// Search all columns for an existing card with this title
	for _, col := range []string{"To Do", "In Progress", "Done"} {
		cards, err := queryCards(baseURL, board, col)
		if err != nil {
			continue
		}
		for _, c := range cards {
			if strings.EqualFold(c.Title, task.Title) {
				if c.Column == task.Column {
					return nil // already in the right column
				}
				return moveCard(baseURL, c.ID, task.Column)
			}
		}
	}
	// Card doesn't exist — create it
	return createCard(baseURL, board, task)
}

// ── Main ───────────────────────────────────────────────────────────────────

func main() {
	sync := flag.Bool("sync", false, "Sync IMPLEMENTATION_PLAN.md → Hermes Kanban")
	flag.Parse()

	if !*sync {
		fmt.Fprintln(os.Stderr, "Usage: hermes-sync --sync")
		os.Exit(1)
	}

	kanbanURL := os.Getenv("HERMES_KANBAN_URL")
	if kanbanURL == "" {
		kanbanURL = "http://localhost:27124"
	}
	board := os.Getenv("HERMES_KANBAN_BOARD")
	if board == "" {
		board = "Sovereign-Pipeline.md"
	}
	planPath := os.Getenv("IMPL_PLAN_PATH")
	if planPath == "" {
		planPath = "IMPLEMENTATION_PLAN.md"
	}

	tasks, err := parsePlan(planPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "[hermes-sync] FATAL: %v\n", err)
		os.Exit(1)
	}

	fmt.Printf("[hermes-sync] %d tasks parsed → %s (board: %s)\n",
		len(tasks), kanbanURL, board)

	ok, failed := 0, 0
	for _, task := range tasks {
		if err := syncCard(kanbanURL, board, task); err != nil {
			fmt.Fprintf(os.Stderr, "  ✗ [%s] %s: %v\n", task.Column, task.Title, err)
			failed++
		} else {
			fmt.Printf("  ✓ [%s] %s\n", task.Column, task.Title)
			ok++
		}
	}

	fmt.Printf("[hermes-sync] Done — %d synced, %d failed.\n", ok, failed)
	if failed > 0 {
		os.Exit(1)
	}
}
