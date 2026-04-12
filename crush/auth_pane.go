package main

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	// ── High-Fidelity Cyberpunk Palette ──────────────────────────────────────
	colorNeonRed    = lipgloss.Color("#ff1a1a")
	colorDeepRed    = lipgloss.Color("#440000")
	colorBlackIce   = lipgloss.Color("#0a0a0a")
	colorGhostWhite = lipgloss.Color("#eeeeee")
	colorDimGrey    = lipgloss.Color("#333333")

	// ── Layout Components ────────────────────────────────────────────────────
	
	wsaBracketStyle = lipgloss.NewStyle().
		Foreground(colorNeonRed).
		Bold(true)

	wsaHeaderStyle = lipgloss.NewStyle().
		Foreground(colorBlackIce).
		Background(colorNeonRed).
		Bold(true).
		Padding(0, 2).
		MarginBottom(1)

	wsaLabelStyle = lipgloss.NewStyle().
		Foreground(colorDimGrey).
		Width(12).
		Align(lipgloss.Right).
		MarginRight(1)

	wsaValueStyle = lipgloss.NewStyle().
		Foreground(colorGhostWhite).
		Bold(true)

	wsaPayloadBoxStyle = lipgloss.NewStyle().
		Border(lipgloss.NormalBorder()).
		BorderForeground(colorDeepRed).
		Padding(1, 2).
		Width(60).
		Height(8).
		MarginTop(1)

	wsaStatusLineStyle = lipgloss.NewStyle().
		Foreground(colorNeonRed).
		Italic(true).
		MarginTop(1)

	wsaActionBtnStyle = lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(colorNeonRed).
		Padding(0, 2).
		MarginLeft(2).
		MarginRight(2)
)

type AuthModel struct {
	proposal *Proposal
	choice   ProposalStatus
	quitting bool
}

func (m AuthModel) Init() tea.Cmd {
	return nil
}

func (m AuthModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "y", "Y", "enter":
			m.choice = StatusApproved
			m.quitting = true
			return m, tea.Quit
		case "n", "N", "esc":
			m.choice = StatusRejected
			m.quitting = true
			return m, tea.Quit
		case "ctrl+c":
			return m, tea.Quit
		}
	}
	return m, nil
}

func (m AuthModel) View() string {
	// 1. Header
	header := wsaHeaderStyle.Render(" ◈ 50V3R31GN VSB_AU7H_P4N3 [GH057_IN73RF4C3] ")

	// 2. Info Grid
	originStr := "N0D3_B"
	if m.proposal.Origin == 1 {
		originStr = "57R47361C_47L45"
	}

	infoGrid := lipgloss.JoinVertical(lipgloss.Left,
		lipgloss.JoinHorizontal(lipgloss.Top, wsaLabelStyle.Render("OR161N:"), wsaValueStyle.Render(originStr)),
		lipgloss.JoinHorizontal(lipgloss.Top, wsaLabelStyle.Render("4C710N:"), wsaValueStyle.Render(fmt.Sprintf("%d", m.proposal.ActionType))),
		lipgloss.JoinHorizontal(lipgloss.Top, wsaLabelStyle.Render("ID_516N:"), wsaValueStyle.Render(fmt.Sprintf("%d", m.proposal.ID))),
	)

	// 3. Payload
	payloadRaw := strings.Trim(string(m.proposal.Payload[:]), "\x00")
	if len(payloadRaw) > 300 {
		payloadRaw = payloadRaw[:297] + "..."
	}
	payload := wsaPayloadBoxStyle.Render(payloadRaw)

	// 4. Status Bar
	status := wsaStatusLineStyle.Render(">> 5Y573M_P4U53D: 4W4171N6_0P3R470R_D3C1510N...")

	// 5. Actions
	actions := lipgloss.JoinHorizontal(lipgloss.Center,
		wsaActionBtnStyle.Render("[Y] 6R4N73D"),
		wsaActionBtnStyle.Render("[N] R3J3C73D"),
	)

	// 6. Assembly
	ui := lipgloss.JoinVertical(lipgloss.Center,
		header,
		infoGrid,
		payload,
		status,
		lipgloss.NewStyle().MarginTop(1).Render(actions),
	)

	// Decorative Brackets
	leftBracket := wsaBracketStyle.Render("⎡\n┃\n┃\n┃\n┃\n┃\n┃\n┃\n┃\n┃\n┃\n⎣")
	rightBracket := wsaBracketStyle.Render("⎤\n┃\n┃\n┃\n┃\n┃\n┃\n┃\n┃\n┃\n┃\n⎦")

	contentWithBrackets := lipgloss.JoinHorizontal(lipgloss.Center,
		leftBracket,
		lipgloss.NewStyle().Padding(0, 4).Render(ui),
		rightBracket,
	)

	// Final Centering
	return lipgloss.Place(100, 24, lipgloss.Center, lipgloss.Center, contentWithBrackets)
}

// RunAuthPane launches the Bubble Tea loop for a single proposal.
func RunAuthPane(p *Proposal) (ProposalStatus, error) {
	m := AuthModel{proposal: p}
	p_final, err := tea.NewProgram(m, tea.WithAltScreen()).Run()
	if err != nil {
		return StatusRejected, err
	}
	return p_final.(AuthModel).choice, nil
}
