package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
)

// logseq.go — Phase 85, Task 2: The Logseq Artery (Local HTTP Bridge)
// This file implements the bridge between 'crush' and the local Logseq HTTP API.
// Requires Logseq -> Settings -> Features -> HTTP API Server: ON

const LogseqApiUrl = "http://localhost:12315/api"

type LogseqRequest struct {
	Method string        `json:"method"`
	Args   []interface{} `json:"args"`
}

func runLogseqQuery(token string, method string, args []interface{}) (string, error) {
	reqBody := LogseqRequest{
		Method: method,
		Args:   args,
	}
	jsonData, _ := json.Marshal(reqBody)

	req, err := http.NewRequest("POST", LogseqApiUrl, bytes.NewBuffer(jsonData))
	if err != nil {
		return "", err
	}
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+token)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		return "", fmt.Errorf("Logseq API unreachable. Ensure HTTP server is running on port 12315: %v", err)
	}
	defer resp.Body.Close()

	body, _ := io.ReadAll(resp.Body)
	return string(body), nil
}

func runLogseq(args []string) int {
	token := os.Getenv("LOGSEQ_TOKEN")
	if token == "" {
		fmt.Println("❌ ERROR: LOGSEQ_TOKEN not found in environment.")
		return 1
	}

	if len(args) == 0 {
		fmt.Println("Usage: crush logseq [query|insert] <args...>")
		return 1
	}

	switch args[0] {
	case "query":
		if len(args) < 2 {
			fmt.Println("Usage: crush logseq query <datalog_query>")
			return 1
		}
		res, err := runLogseqQuery(token, "logseq.DB.datascriptQuery", []interface{}{args[1]})
		if err != nil {
			fmt.Printf("❌ Error: %v\n", err)
			return 1
		}
		fmt.Println(res)
		return 0

	case "insert":
		if len(args) < 3 {
			fmt.Println("Usage: crush logseq insert <page_name> <content>")
			return 1
		}
		// Method: logseq.Editor.appendBlockInPage(pageName, content)
		res, err := runLogseqQuery(token, "logseq.Editor.appendBlockInPage", []interface{}{args[1], args[2]})
		if err != nil {
			fmt.Printf("❌ Error: %v\n", err)
			return 1
		}
		fmt.Println(res)
		return 0

	default:
		fmt.Printf("Unknown Logseq command: %s\n", args[0])
		return 1
	}
}
