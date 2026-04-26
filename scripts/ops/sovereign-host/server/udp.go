package server

import (
	"fmt"
	"net"
	"sovereign-host/protocol"
)

type Handler func(*protocol.IntentPacket) (*protocol.ResultPacket, error)

type Server struct {
	conn     *net.UDPConn
	handlers map[protocol.IntentType]Handler
}

func NewServer(port int) (*Server, error) {
	addr, err := net.ResolveUDPAddr("udp", fmt.Sprintf(":%d", port))
	if err != nil {
		return nil, err
	}
	conn, err := net.ListenUDP("udp", addr)
	if err != nil {
		return nil, err
	}
	return &Server{
		conn:     conn,
		handlers: make(map[protocol.IntentType]Handler),
	}, nil
}

func (s *Server) RegisterHandler(t protocol.IntentType, h Handler) {
	s.handlers[t] = h
}

func (s *Server) Start() error {
	buf := make([]byte, 1024)
	fmt.Printf("◈ Machina-Host Sidecar listening on UDP %s\n", s.conn.LocalAddr())

	for {
		n, addr, err := s.conn.ReadFromUDP(buf)
		if err != nil {
			fmt.Printf("Read error: %v\n", err)
			continue
		}

		if n < protocol.HEADER_SIZE {
			continue
		}

		// Try to decode as IntentPacket
		packet, err := protocol.DecodeIntentPacket(buf[:n])
		if err != nil {
			// Could be a heartbeat or other packet type
			header, err := protocol.DecodeHeader(buf[:n])
			if err == nil && header.PacketType == protocol.PacketHeartbeat {
				s.sendAck(addr, header.SequenceID)
			}
			continue
		}

		go s.handleIntent(addr, packet)
	}
}

func (s *Server) handleIntent(addr *net.UDPAddr, p *protocol.IntentPacket) {
	handler, ok := s.handlers[p.IntentType]
	if !ok {
		s.sendError(addr, p, fmt.Errorf("no handler for intent type %v", p.IntentType))
		return
	}

	result, err := handler(p)
	if err != nil {
		s.sendError(addr, p, err)
		return
	}

	if result != nil {
		s.sendResult(addr, result)
	}
}

func (s *Server) sendAck(addr *net.UDPAddr, seqID uint32) {
	h := protocol.SovereignHeader{
		PacketType: protocol.PacketAck,
		SequenceID: seqID,
	}
	buf := make([]byte, protocol.HEADER_SIZE)
	h.Encode(buf)
	s.conn.WriteToUDP(buf, addr)
}

func (s *Server) sendResult(addr *net.UDPAddr, p *protocol.ResultPacket) {
	buf, err := p.Encode()
	if err != nil {
		return
	}
	s.conn.WriteToUDP(buf, addr)
}

func (s *Server) sendError(addr *net.UDPAddr, p *protocol.IntentPacket, err error) {
	res := &protocol.ResultPacket{
		Header: protocol.SovereignHeader{
			SequenceID: p.Header.SequenceID,
		},
		Status:     protocol.StatusError,
		SessionID:  p.SessionID,
		ResultCode: 500,
	}
	copy(res.Payload[:], err.Error())
	s.sendResult(addr, res)
}
