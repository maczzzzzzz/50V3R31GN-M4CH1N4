package main

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
)

var (
	wsaTitleStyle = lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#ff1a1a")).
		Border(lipgloss.DoubleBorder()).
		Padding(0, 1)

	wsaContentStyle = lipgloss.NewStyle().
		Border(lipgloss.NormalBorder()).
		BorderForeground(lipgloss.Color("#440000")).
		Padding(1, 2)
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
	title := wsaTitleStyle.Render("⟨ AUTHORIZATION REQUIRED ⟩")

	originStr := "Node B"
	if m.proposal.Origin == 1 {
		originStr = "Strategic Atlas"
	}

	info := fmt.Sprintf(
		"ORIGIN: %s\nACTION: %d\nID:     %d",
		lipgloss.NewStyle().Foreground(colorRed).Render(originStr),
		m.proposal.ActionType,
		m.proposal.ID,
	)

	payload := strings.Trim(string(m.proposal.Payload[:]), "\x00")
	
	content := wsaContentStyle.Render(
		info + "\n\n" + lipgloss.NewStyle().Foreground(colorWhite).Render(payload),
	)

	help := lipgloss.NewStyle().
		Foreground(colorDim).
		Render("\n  [Y/ENTER] GRANTED | [N/ESC] REJECTED")

	ui := lipgloss.JoinVertical(lipgloss.Center, title, content, help)
	
	// Center the entire UI in a fixed-size terminal area (simulated)
	return lipgloss.Place(80, 20, lipgloss.Center, lipgloss.Center, ui)
}

// RunAuthPane launches the Bubble Tea loop for a single proposal.
func RunAuthPane(p *Proposal) (ProposalStatus, error) {
	m := AuthModel{proposal: p}
	p_final, err := tea.NewProgram(m).Run()
	if err != nil {
		return StatusRejected, err
	}
	return p_final.(AuthModel).choice, nil
}
