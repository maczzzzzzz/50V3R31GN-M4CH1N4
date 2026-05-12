{ config, pkgs, lib, ... }:

with lib;

let
  cfg = config.services.hermes-lcm;
in
{
  options.services.hermes-lcm = {
    enable = mkOption {
      type = types.bool;
      default = false;
      description = "Enable Hermes-LCM (Lossless Context Management) service";
    };

    dbPath = mkOption {
      type = types.path;
      default = "/var/lib/hermes-lcm/memory.db";
      description = "Path to the Hermes-LCM SQLite database";
    };

    isPrimary = mkOption {
      type = types.bool;
      default = false;
      description = "Whether this node is the primary storage node (Node A)";
    };

    syncNodes = mkOption {
      type = types.listOf types.str;
      default = [];
      description = "List of Tailnet IPs to sync database to (for primary node)";
    };

    primaryNode = mkOption {
      type = types.nullOr types.str;
      default = null;
      description = "Tailnet IP of primary node (for sync nodes)";
    };

    syncInterval = mkOption {
      type = types.str;
      default = "*/5 * * * *";
      description = "Cron schedule for database sync (default: every 5 minutes)";
    };

    sshUser = mkOption {
      type = types.str;
      default = "maczz";
      description = "SSH user for rsync sync";
    };

    syncScript = mkOption {
      type = types.str;
      internal = true;
      default = "";
      description = "Generated shell script for database synchronization.";
    };
  };

  config = mkIf cfg.enable {
    # Install dependencies
    environment.systemPackages = with pkgs; [
      python3
      python3Packages.pip
      python3Packages.tenacity
      rsync
      openssh
    ];

    # Create Hermes-LCM directory structure
    systemd.tmpfiles.rules = [
      "d /var/lib/hermes-lcm 0755 nixos nixos -"
      "d /var/log/hermes-lcm 0755 nixos nixos -"
      "d /var/lib/hermes-lcm/sync 0755 nixos nixos -"
    ];

    # Hermes-LCM systemd service
    systemd.services.hermes-lcm = {
      description = "Hermes-LCM - Lossless Context Management Provider";
      after = [ "network.target" "tailscale.service" ];
      wants = [ "network-online.target" ];

      serviceConfig = {
        Type = "simple";
        User = "maczz";
        Group = "maczz";
        WorkingDirectory = "/home/nixos/.hermes/plugins/hermes-lcm";
        ExecStart = "${pkgs.python3}/bin/python3 -m hermes_lcm_provider --db-path ${cfg.dbPath}";
        Restart = "on-failure";
        RestartSec = "5s";

        # Environment Variables
        Environment = [
          "HERMES_LCM_DB_PATH=${cfg.dbPath}"
          "HERMES_LCM_LOG_LEVEL=INFO"
          "HERMES_LCM_IS_PRIMARY=${if cfg.isPrimary then "true" else "false"}"
        ] ++ lib.optional (cfg.primaryNode != null) "HERMES_LCM_PRIMARY_NODE=${cfg.primaryNode}";

        # Security Hardening
        ProtectSystem = "strict";
        ProtectHome = "true";
        PrivateTmp = "true";
        NoNewPrivileges = "true";
        ReadOnlyPaths = "/";
        ReadWritePaths = "/var/lib/hermes-lcm /var/log/hermes-lcm /var/lib/hermes-lcm/sync";

        # Resource Limits
        MemoryMax = "2G";
        CPUQuota = "200%";
      };
    };

    # Database Sync Service (Primary Node Only)
    systemd.services.hermes-lcm-sync = mkIf cfg.isPrimary {
      description = "Hermes-LCM Database Sync to Sync Nodes";
      after = [ "hermes-lcm.service" "network-online.target" ];
      requires = [ "hermes-lcm.service" ];

      serviceConfig = {
        Type = "oneshot";
        User = "maczz";
        ExecStart = "${pkgs.bash}/bin/bash -c '${cfg.syncScript}'";
      };
    };

    # Sync Timer (Primary Node Only)
    systemd.timers.hermes-lcm-sync = mkIf cfg.isPrimary {
      description = "Timer for Hermes-LCM database sync";
      wantedBy = [ "timers.target" ];
      timerConfig = {
        OnCalendar = cfg.syncInterval;
        Persistent = true;
      };
    };

    # Sync Script Generation
    services.hermes-lcm.syncScript = mkIf cfg.isPrimary (
      concatStringsSep "\n" (map (node: ''
        echo "Syncing Hermes-LCM database to ${node}..."
        
        # Verify SSH key exists
        SSH_KEY="/etc/ssh/ssh_host_ed25519_key"
        if [ ! -f "$SSH_KEY" ]; then
          echo "Error: SSH key not found at $SSH_KEY"
          exit 1
        fi

        if [ ! -r "$SSH_KEY" ]; then
          echo "Error: SSH key not readable at $SSH_KEY"
          exit 1
        fi

        rsync -avz --delete \
          -e "ssh -o StrictHostKeyChecking=accept-new -i $SSH_KEY" \
          ${cfg.dbPath} \
          ${cfg.sshUser}@${node}:/var/lib/hermes-lcm/memory.db

        if [ $? -eq 0 ]; then
          echo "Sync to ${node} complete."
        else
          echo "Error: Sync to ${node} failed"
          exit 1
        fi
      '') cfg.syncNodes)
    );

    # Network Access (if needed for remote access)
    networking.firewall.allowedTCPPorts = lib.optional (!cfg.isPrimary) 9119;
  };
}
