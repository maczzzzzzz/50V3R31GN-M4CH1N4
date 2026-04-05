package main

import (
	"bufio"
	"context"
	"encoding/json"
	"fmt"
	"net"
	"os"
	"path/filepath"
	"sync"
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

func TestProxy_WriterSendsFrames(t *testing.T) {
	client, server := net.Pipe()
	defer client.Close()
	defer server.Close()

	p := &proxy{
		writerCh: make(chan []byte, 4),
		pending:  make(map[string]chan clawLinkPacket),
		timeout:  500 * time.Millisecond,
	}

	ctx, cancel := context.WithTimeout(context.Background(), 2*time.Second)
	defer cancel()

	go p.runWriter(ctx, client)

	p.writerCh <- []byte("{\"trace_id\":\"t1\",\"payload\":\"a\",\"checksum\":0}\n")
	p.writerCh <- []byte("{\"trace_id\":\"t2\",\"payload\":\"b\",\"checksum\":0}\n")

	scanner := bufio.NewScanner(server)
	var lines []string
	for scanner.Scan() {
		lines = append(lines, scanner.Text())
		if len(lines) == 2 {
			break
		}
	}

	if len(lines) != 2 {
		t.Fatalf("got %d frames, want 2", len(lines))
	}
	if lines[0] != "{\"trace_id\":\"t1\",\"payload\":\"a\",\"checksum\":0}" {
		t.Errorf("frame 0 = %q", lines[0])
	}
	if lines[1] != "{\"trace_id\":\"t2\",\"payload\":\"b\",\"checksum\":0}" {
		t.Errorf("frame 1 = %q", lines[1])
	}
}

func TestProxy_ConcurrentInFlightRequests(t *testing.T) {
	mockLn, err := net.Listen("tcp", "127.0.0.1:0")
	if err != nil {
		t.Fatalf("mock listen: %v", err)
	}
	defer mockLn.Close()

	go func() {
		for {
			conn, err := mockLn.Accept()
			if err != nil {
				return
			}
			go func(c net.Conn) {
				defer c.Close()
				sc := bufio.NewScanner(c)
				for sc.Scan() {
					var pkt clawLinkPacket
					if err := json.Unmarshal(sc.Bytes(), &pkt); err != nil {
						continue
					}
					resp := clawLinkPacket{
						TraceID: pkt.TraceID,
						Payload: fmt.Sprintf(`{"id":%q,"result":{"echo":true},"error":null}`, pkt.TraceID),
					}
					b, _ := json.Marshal(resp)
					c.Write(append(b, '\n'))
				}
			}(conn)
		}
	}()

	mockHost, mockPort, _ := net.SplitHostPort(mockLn.Addr().String())
	sockPath := filepath.Join(t.TempDir(), "proxy_test.sock")

	orig := Cfg
	Cfg.NodeAHost = mockHost
	Cfg.ClawlinkPort = mockPort
	Cfg.ClawlinkSock = sockPath
	Cfg.ClawlinkTimeout = 2000
	defer func() { Cfg = orig }()

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	errCh := make(chan error, 1)
	go func() { errCh <- runProxy(ctx) }()

	deadline := time.Now().Add(time.Second)
	for time.Now().Before(deadline) {
		if _, err := os.Stat(sockPath); err == nil {
			break
		}
		time.Sleep(10 * time.Millisecond)
	}

	type result struct {
		traceID string
		resp    string
	}
	results := make(chan result, 2)

	var wg sync.WaitGroup
	for i := 0; i < 2; i++ {
		wg.Add(1)
		go func() {
			defer wg.Done()
			c, err := net.DialTimeout("unix", sockPath, time.Second)
			if err != nil {
				results <- result{}
				return
			}
			defer c.Close()

			traceID := newTraceID()
			rpcPayload := fmt.Sprintf(`{"id":%q,"method":"ping","params":{}}`, traceID)
			pkt := clawLinkPacket{
				TraceID:  traceID,
				Payload:  rpcPayload,
				Checksum: payloadChecksum(rpcPayload),
			}
			b, _ := json.Marshal(pkt)
			c.Write(append(b, '\n'))

			sc := bufio.NewScanner(c)
			if sc.Scan() {
				results <- result{traceID: traceID, resp: sc.Text()}
			} else {
				results <- result{traceID: traceID}
			}
		}()
	}

	wg.Wait()

	for i := 0; i < 2; i++ {
		r := <-results
		if r.resp == "" {
			t.Errorf("client %d got no response", i)
			continue
		}
		var respPkt clawLinkPacket
		if err := json.Unmarshal([]byte(r.resp), &respPkt); err != nil {
			t.Errorf("client %d response parse error: %v", i, err)
			continue
		}
		if respPkt.TraceID != r.traceID {
			t.Errorf("client %d: got trace_id %q, want %q", i, respPkt.TraceID, r.traceID)
		}
	}

	cancel()
	<-errCh
}
