{ pkgs, ... }:

let
  # SPIRE Configuration Invariants
  trustDomain = "sovereign.machina";
  serverSocketPath = "/run/spire/sockets/server.sock";
  registrationUdsPath = "/run/spire/sockets/registration.sock";
in
{
  # Materialize SPIRE Server Environment
  environment.systemPackages = [ pkgs.spire ];

  # ◈ SPIRE SERVER CONFIGURATION
  # Note: In a production Sovereign Mesh, this would use the TPM 2.0 attestor.
  # For the initial Hardgate, we establish the socket-based control plane.
  environment.etc."spire/server.conf".text = ''
    server {
        bind_address = "127.0.0.1"
        bind_port = "8081"
        trust_domain = "${trustDomain}"
        data_dir = "/var/lib/spire/server"
        log_level = "DEBUG"
        socket_path = "${serverSocketPath}"
        
        ca_key_type = "rsa-4096"
        
        # ◈ HYBRID_IDENTITY: Use our static Root CA as the UPSTREAM CA
        upstream_bundle = true
    }

    plugins {
        DataStore "sql" {
            plugin_data {
                database_type = "sqlite3"
                connection_string = "/var/lib/spire/server/datastore.sqlite3"
            }
        }

        NodeAttestor "join_token" {}

        KeyManager "memory" {}

        # ◈ PARSELTONGUE_ATTESTOR: Placeholder for Dialect-based verification
        # NodeAttestor "unix" {}
    }
  '';

  # Systemd service for SPIRE Server (to be managed by Node D ignition)
  systemd.services.spire-server = {
    description = "Sovereign SPIRE Server";
    after = [ "network.target" ];
    wantedBy = [ "multi-user.target" ];
    serviceConfig = {
      ExecStart = "${pkgs.spire}/bin/spire-server run -config /etc/spire/server.conf";
      Restart = "on-failure";
      StateDirectory = "spire/server";
      RuntimeDirectory = "spire/sockets";
    };
  };
}
