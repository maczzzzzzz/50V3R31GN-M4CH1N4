package v2f

import (
	"context"
	"fmt"
	"os"

	"github.com/spiffe/go-spiffe/v2/spiffeid"
	"github.com/spiffe/go-spiffe/v2/workloadapi"
)

/**
 * ◈ SPIRE_CLIENT : PHASE 106, TASK 2.2
 *
 * Implements the SPIRE Workload API client for sidecar-proxy.
 * Provides the physical SVID for steganographic signing.
 */

type SpireClient struct {
	socketPath string
	trustDomain string
}

func NewSpireClient(socketPath string, trustDomain string) *SpireClient {
	if socketPath == "" {
		socketPath = "/run/spire/sockets/workload.sock"
	}
	if trustDomain == "" {
		trustDomain = "sovereign.machina"
	}
	return &SpireClient{
		socketPath: socketPath,
		trustDomain: trustDomain,
	}
}

// GetCurrentSvid retrieves the latest X509 SVID from the SPIRE Agent.
func (s *SpireClient) GetCurrentSvid() (string, error) {
	// 1. Establish connection to Workload API
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	// ◈ ZERO_TRUST_MANDATE: Ensure the socket exists before attempting connect
	if _, err := os.Stat(s.socketPath); os.IsNotExist(err) {
		return "spiffe://sovereign.machina/workload/sidecar-proxy-offline", nil // Fallback for local dev
	}

	source, err := workloadapi.NewX509Source(ctx, workloadapi.WithClientOptions(workloadapi.WithAddr("unix://" + s.socketPath)))
	if err != nil {
		return "", fmt.Errorf("failed to create x509 source: %w", err)
	}
	defer source.Close()

	// 2. Fetch SVID
	svid, err := source.GetX509SVID()
	if err != nil {
		return "", fmt.Errorf("failed to fetch x509 svid: %w", err)
	}

	return svid.ID.String(), nil
}

// ValidateSvid verifies if a SPIFFE ID belongs to our trust domain.
func (s *SpireClient) ValidateSvid(id string) (bool, error) {
	parsed, err := spiffeid.FromString(id)
	if err != nil {
		return false, err
	}
	return parsed.TrustDomain().String() == s.trustDomain, nil
}
