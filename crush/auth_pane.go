package main

import (
	"fmt"
	"strings"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
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
		case "enter":
			m.choice = StatusApproved
			m.quitting = true
			return m, tea.Quit
		case "esc":
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
	header := headerStyle.Copy().
		Background(colorAccent).
		Foreground(colorWhite).
		Render("⟨ AUTHORIZATION REQUIRED ⟩")

	originStr := "Node B"
	if m.proposal.Origin == 1 {
		originStr = "Strategic Atlas"
	}

	content := fmt.Sprintf(
		"\n  ORIGIN: %s\n  ACTION: %d\n  ID:     %d\n\n  %s\n",
		lipgloss.NewStyle().Foreground(colorCyan).Render(originStr),
		m.proposal.ActionType,
		m.proposal.ID,
		lipgloss.NewStyle().Foreground(colorWhite).Render(strings.Trim(string(m.proposal.Payload[:]), "\x00")),
	)

	footer := "\n  [ENTER] TO SIGN | [ESC] TO ABORT"
	
	return paneStyle.BorderForeground(colorAccent).Render(header + content + footer)
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
