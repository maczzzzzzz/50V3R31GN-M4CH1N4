{ config, pkgs, lib, ... }:

{
  # Sovereign Machina - Node B Network Vaccination
  # Purpose: Eliminate WSL2/China-routing latency and hangs.

  boot.kernel.sysctl = {
    # Aggressive TCP Keepalives: Detect dropped connections in 60s instead of 2 hours.
    "net.ipv4.tcp_keepalive_time" = lib.mkForce 60;
    "net.ipv4.tcp_keepalive_intvl" = lib.mkForce 10;
    "net.ipv4.tcp_keepalive_probes" = lib.mkForce 6;
    
    # TCP Fast Open: Reduce latency for subsequent requests
    "net.ipv4.tcp_fastopen" = lib.mkForce 3;
  };

  # Use systemd to enforce settings that WSL2/Tailscale often fight over
  systemd.services.vaccinate-network = {
    description = "Sovereign Machina - Network Vaccination Service";
    wantedBy = [ "multi-user.target" ];
    after = [ "network.target" "tailscaled.service" ];
    serviceConfig = {
      Type = "oneshot";
      RemainAfterExit = true;
      # Force MTU to 1400 and Force DNS to Cloudflare
      ExecStart = [
        "${pkgs.iproute2}/bin/ip link set dev eth0 mtu 1400"
        "${pkgs.bash}/bin/bash -c 'echo \"nameserver 1.1.1.1\" > /etc/resolv.conf'"
        "${pkgs.bash}/bin/bash -c 'echo \"nameserver 8.8.8.8\" >> /etc/resolv.conf'"
      ];
    };
  };
}
