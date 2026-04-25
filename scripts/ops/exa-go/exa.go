package exa

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
)

const BaseURL = "https://api.exa.ai"

type SearchOptions struct {
	NumResults           int      `json:"numResults,omitempty"`
	IncludeDomains       []string `json:"includeDomains,omitempty"`
	ExcludeDomains       []string `json:"excludeDomains,omitempty"`
	StartCrawlDate       string   `json:"startCrawlDate,omitempty"`
	EndCrawlDate         string   `json:"endCrawlDate,omitempty"`
	StartPublishedDate   string   `json:"startPublishedDate,omitempty"`
	EndPublishedDate     string   `json:"endPublishedDate,omitempty"`
	UseAutoprompt        bool     `json:"useAutoprompt,omitempty"`
	Type                 string   `json:"type,omitempty"`
}

type SearchRequest struct {
	Query string `json:"query"`
	SearchOptions
}

type SearchResult struct {
	ID            string  `json:"id"`
	URL           string  `json:"url"`
	Title         string  `json:"title"`
	Author        string  `json:"author"`
	PublishedDate string  `json:"publishedDate"`
	Score         float64 `json:"score"`
}

type SearchResponse struct {
	Results []SearchResult `json:"results"`
}

type Client struct {
	APIKey string
	HTTP   *http.Client
}

func NewClient(apiKey string) *Client {
	return &Client{
		APIKey: apiKey,
		HTTP:   &http.Client{},
	}
}

func (c *Client) Search(query string, opts SearchOptions) (*SearchResponse, error) {
	reqBody := SearchRequest{
		Query:         query,
		SearchOptions: opts,
	}
	
	jsonBody, err := json.Marshal(reqBody)
	if err != nil {
		return nil, err
	}

	req, err := http.NewRequest("POST", BaseURL+"/search", bytes.NewBuffer(jsonBody))
	if err != nil {
		return nil, err
	}

	req.Header.Set("x-api-key", c.APIKey)
	req.Header.Set("Content-Type", "application/json")

	resp, err := c.HTTP.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("exa api error: %s", resp.Status)
	}

	var searchResp SearchResponse
	if err := json.NewDecoder(resp.Body).Decode(&searchResp); err != nil {
		return nil, err
	}

	return &searchResp, nil
}
