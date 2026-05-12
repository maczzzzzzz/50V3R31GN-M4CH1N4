import os

# 1. Fix sniffer.ts
sniffer_path = ".worktrees/phase3-implementation/sidecars/sovereign-sniffer/src/sniffer.ts"
with open(sniffer_path, "r") as f:
    content = f.read()
content = content.replace('modelName: "gpt-4o-mini",', 'modelName: "qwen2.5-coder-14b",\n    modelClientOptions: { baseURL: "http://100.120.225.12:8000/v1" },')
with open(sniffer_path, "w") as f:
    f.write(content)

# 2. Fix hermes-lcm.nix WorkingDirectory
nix_path = ".worktrees/phase3-implementation/nix/modules/hermes-lcm.nix"
with open(nix_path, "r") as f:
    content = f.read()
content = content.replace('WorkingDirectory = "/var/lib/hermes-lcm";', 'WorkingDirectory = "/home/nixos/.hermes/plugins/hermes-lcm";')
with open(nix_path, "w") as f:
    f.write(content)

# 3. Fix __main__.py logger instantiation
main_path = ".worktrees/phase3-implementation/sidecars/hermes-lcm/__main__.py"
with open(main_path, "r") as f:
    content = f.read()

# Move logger = logging.getLogger(__name__) up
lines = content.split('\n')
new_lines = []
logger_init = '    logger = logging.getLogger(__name__)'
# Remove the existing instantiation
lines = [l for l in lines if l != logger_init]

for line in lines:
    if 'log_file = "/var/log/hermes-lcm/service.log"' in line:
        new_lines.append(logger_init)
    new_lines.append(line)

with open(main_path, "w") as f:
    f.write('\n'.join(new_lines))

# 4. Fix directors-forge/src/main.rs Command::new("sniffer")
rust_path = ".worktrees/phase3-implementation/crates/modules/directors-forge/src/main.rs"
with open(rust_path, "r") as f:
    content = f.read()
content = content.replace('Command::new("sniffer")', 'Command::new("nix-shell")\n            .arg("-p")\n            .arg("nodejs")\n            .arg("--run")\n            .arg("npx tsx sidecars/sovereign-sniffer/src/cli.ts observe")')
content = content.replace('.arg("observe")\n', '')
with open(rust_path, "w") as f:
    f.write(content)

print("Fixes applied.")
