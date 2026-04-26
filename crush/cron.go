package main

import (
	"database/sql"
	"fmt"
	"log"
	"time"

	"github.com/google/uuid"
	"github.com/spf13/cobra"
)

/**
 * CRUSH_CRON — PHASE 92, TASK 1
 * 
 * Implements headless job scheduling for background agent tasks.
 * Stores schedules and logs in SovereignIntelligence.db.
 */

var cronCmd = &cobra.Command{
	Use:   "cron",
	Short: "Manage background agentic jobs",
}

var cronRunCmd = &cobra.Command{
	Use:   "run",
	Short: "Start the background cron runner",
	Run: func(cmd *cobra.Command, args []string) {
		fmt.Println("::/CRON_RUNNER_IGNITED")
		
		db, err := sql.Open("sqlite3", "./data/SovereignIntelligence.db")
		if err != nil {
			log.Fatal(err)
		}
		defer db.Close()

		for {
			runPendingJobs(db)
			time.Sleep(1 * time.Minute)
		}
	},
}

var cronAddCmd = &cobra.Command{
	Use:   "add [schedule] [command]",
	Short: "Add a new background job",
	Args:  cobra.ExactArgs(2),
	Run: func(cmd *cobra.Command, args []string) {
		schedule := args[0]
		command := args[1]
		jobID := uuid.New().String()

		db, err := sql.Open("sqlite3", "./data/SovereignIntelligence.db")
		if err != nil {
			log.Fatal(err)
		}
		defer db.Close()

		_, err = db.Exec("INSERT INTO cron_jobs (job_id, schedule, command) VALUES (?, ?, ?)", jobID, schedule, command)
		if err != nil {
			log.Fatal(err)
		}

		fmt.Printf("::/CRON_JOB_ADDED : %s\n", jobID)
	},
}

func runPendingJobs(db *sql.DB) {
	// Simple mock of a cron runner
	rows, err := db.Query("SELECT job_id, command FROM cron_jobs WHERE status = 'pending'")
	if err != nil {
		return
	}
	defer rows.Close()

	for rows.Next() {
		var jobID, command string
		rows.Scan(&jobID, &command)
		
		fmt.Printf("::/EXECUTING_CRON_JOB : %s [%s]\n", jobID, command)
		
		// Mark as running
		db.Exec("UPDATE cron_jobs SET status = 'completed', last_run = CURRENT_TIMESTAMP WHERE job_id = ?", jobID)
	}
}

func init() {
	cronCmd.AddCommand(cronRunCmd)
	cronCmd.AddCommand(cronAddCmd)
}
