package main

import (
	"encoding/json"
	"log"
	"os"
	"exa-go" // Local SDK
)

// Simplified MCP Protocol structures
type JSONRPCMessage struct {
	JSONRPC string          `json:"jsonrpc"`
	Method  string          `json:"method,omitempty"`
	Params  json.RawMessage `json:"params,omitempty"`
	Result  json.RawMessage `json:"result,omitempty"`
	ID      interface{}     `json:"id,omitempty"`
}

func main() {
	apiKey := os.Getenv("EXA_API_KEY")
	if apiKey == "" {
		log.Fatal("EXA_API_KEY environment variable is required")
	}

	client := exa.NewClient(apiKey)

	// MCP Loop (Standard Input/Output)
	decoder := json.NewDecoder(os.Stdin)
	encoder := json.NewEncoder(os.Stdout)

	for {
		var msg JSONRPCMessage
		if err := decoder.Decode(&msg); err != nil {
			break
		}

		// Tool Dispatcher
		switch msg.Method {
		case "listTools":
			handleListTools(encoder, msg.ID)
		case "callTool":
			handleCallTool(encoder, msg.ID, msg.Params, client)
		}
	}
}

func handleListTools(enc *json.Encoder, id interface{}) {
	tools := []map[string]interface{}{
		{
			"name": "exa_search",
			"description": "Perform a semantic search of the web.",
			"inputSchema": map[string]interface{}{
				"type": "object",
				"properties": map[string]interface{}{
					"query": map[string]interface{}{"type": "string"},
					"num_results": map[string]interface{}{"type": "integer"},
				},
				"required": []string{"query"},
			},
		},
	}
	
	resp := JSONRPCMessage{
		JSONRPC: "2.0",
		ID:      id,
		Result:  mustMarshal(map[string]interface{}{"tools": tools}),
	}
	enc.Encode(resp)
}

func handleCallTool(enc *json.Encoder, id interface{}, params json.RawMessage, client *exa.Client) {
	var callParams struct {
		Name      string          `json:"name"`
		Arguments json.RawMessage `json:"arguments"`
	}
	if err := json.Unmarshal(params, &callParams); err != nil {
		enc.Encode(JSONRPCMessage{JSONRPC: "2.0", ID: id, Result: mustMarshal(map[string]string{"error": "invalid params: " + err.Error()})})
		return
	}

	var result interface{}
	var err error

	if callParams.Name == "exa_search" {
		var args struct {
			Query      string `json:"query"`
			NumResults int    `json:"num_results"`
		}
		if err := json.Unmarshal(callParams.Arguments, &args); err != nil {
			enc.Encode(JSONRPCMessage{JSONRPC: "2.0", ID: id, Result: mustMarshal(map[string]string{"error": "invalid arguments: " + err.Error()})})
			return
		}
		// Zero-trust: block empty queries before they reach the Exa API
		if args.Query == "" {
			enc.Encode(JSONRPCMessage{JSONRPC: "2.0", ID: id, Result: mustMarshal(map[string]string{"error": "query must not be empty"})})
			return
		}
		if args.NumResults == 0 { args.NumResults = 5 }

		result, err = client.Search(args.Query, exa.SearchOptions{
			NumResults: args.NumResults,
			Type:       "neural",
		})
	}

	if err != nil {
		enc.Encode(JSONRPCMessage{JSONRPC: "2.0", ID: id, Result: mustMarshal(map[string]string{"error": err.Error()})})
		return
	}

	enc.Encode(JSONRPCMessage{JSONRPC: "2.0", ID: id, Result: mustMarshal(result)})
}

func mustMarshal(v interface{}) json.RawMessage {
	b, _ := json.Marshal(v)
	return b
}
