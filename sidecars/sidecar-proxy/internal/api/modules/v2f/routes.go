package v2f

import (
	"image"
	_ "image/png" // Register PNG decoder
	"net/http"
	"os"

	"github.com/gin-gonic/gin"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/api/modules"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/config"
	"github.com/router-for-me/CLIProxyAPI/v6/internal/security/v2f"
	log "github.com/sirupsen/logrus"
)

/**
 * ◈ V2F_MODULE : PHASE 106, TASK 2.3
 *
 * Provides the Visual Second Factor (V2F) telemetry endpoint.
 * Injects steganographic identity tokens into visual frames.
 */

type V2fModule struct {
	spire *v2f.SpireClient
	secretKey string
}

func NewV2fModule() *V2fModule {
	return &V2fModule{
		spire: v2f.NewSpireClient("", ""),
		secretKey: "SOVEREIGN_M4CH1N4_V2F_SECRET", // Shared secret with hermes-router
	}
}

func (m *V2fModule) Name() string {
	return "V2F"
}

func (m *V2fModule) Register(ctx modules.Context) error {
	m.RegisterRoutes(ctx.Engine)
	return nil
}

func (m *V2fModule) OnConfigUpdated(cfg *config.Config) error {
	return nil
}

func (m *V2fModule) RegisterRoutes(engine *gin.Engine) {
	v2fAPI := engine.Group("/api/v2f")
	
	// ◈ V2F_PULSE: Returns a steganographically signed frame
	v2fAPI.GET("/pulse", m.handlePulse)
}

func (m *V2fModule) handlePulse(c *gin.Context) {
	// 1. Retrieve Current SVID
	svid, err := m.spire.GetCurrentSvid()
	if err != nil {
		log.Errorf("◈ [V2F] Failed to fetch SVID: %v", err)
		c.JSON(500, gin.H{"error": "identity_severed"})
		return
	}

	// 2. Load Base Frame
	// Note: In Phase 106, we use a static brand-identity frame as the pulse carrier.
	// In Phase 107+, this will be the live 1Hz IDE frame stream.
	framePath := "assets/brand-identity/pulse-carrier.png"
	if _, err := os.Stat(framePath); os.IsNotExist(err) {
		// Mock frame if assets are missing
		c.JSON(404, gin.H{"error": "pulse_carrier_missing"})
		return
	}

	f, err := os.Open(framePath)
	if err != nil {
		c.JSON(500, gin.H{"error": "frame_load_failed"})
		return
	}
	defer f.Close()

	img, _, err := image.Decode(f)
	if err != nil {
		c.JSON(500, gin.H{"error": "frame_decode_failed"})
		return
	}

	// 3. Sign Frame
	signedFrame, err := v2f.SignFrame(img, svid, m.secretKey)
	if err != nil {
		log.Errorf("◈ [V2F] Steganographic signing failed: %v", err)
		c.JSON(500, gin.H{"error": "st3gg_failed"})
		return
	}

	// 4. Return Image
	c.Data(http.StatusOK, "image/png", signedFrame)
}
