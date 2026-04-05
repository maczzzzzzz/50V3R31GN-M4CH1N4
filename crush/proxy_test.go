package main

import (
	"testing"
	"time"
)

func TestProxy_RegisterAndDeliver(t *testing.T) {
	p := &proxy{
		pending:  make(map[string]chan clawLinkPacket),
		writerCh: make(chan []byte, 1),
		timeout:  200 * time.Millisecond,
	}

	ch := p.register("trace-abc")

	go func() {
		time.Sleep(10 * time.Millisecond)
		p.deliver(clawLinkPacket{
			TraceID: "trace-abc",
			Payload: `{"id":"trace-abc","result":{"pong":true},"error":null}`,
		})
	}()

	select {
	case pkt := <-ch:
		if pkt.TraceID != "trace-abc" {
			t.Errorf("got trace_id %q, want trace-abc", pkt.TraceID)
		}
	case <-time.After(300 * time.Millisecond):
		t.Fatal("timeout: deliver never fired")
	}
}

func TestProxy_DeliverUnknownTraceIDDropped(t *testing.T) {
	p := &proxy{
		pending: make(map[string]chan clawLinkPacket),
	}
	// Must not panic or block
	p.deliver(clawLinkPacket{TraceID: "ghost-id"})
}

func TestProxy_CancelAllRejectsAllPending(t *testing.T) {
	p := &proxy{
		pending:  make(map[string]chan clawLinkPacket),
		writerCh: make(chan []byte, 1),
		timeout:  200 * time.Millisecond,
	}

	ch1 := p.register("t1")
	ch2 := p.register("t2")

	p.cancelAll()

	for i, ch := range []chan clawLinkPacket{ch1, ch2} {
		select {
		case pkt := <-ch:
			if pkt.TraceID == "" {
				t.Errorf("chan %d: cancelAll sent packet with empty trace_id", i)
			}
		case <-time.After(100 * time.Millisecond):
			t.Errorf("chan %d: cancelAll did not unblock pending", i)
		}
	}
}

func TestNewTraceID_IsUnique(t *testing.T) {
	seen := make(map[string]bool)
	for i := 0; i < 100; i++ {
		id := newTraceID()
		if seen[id] {
			t.Errorf("duplicate trace_id: %s", id)
		}
		seen[id] = true
		if len(id) < 30 {
			t.Errorf("trace_id too short: %q", id)
		}
	}
}
