#!/usr/bin/env bash
# Director's Forge - Tool Factory (CLI Printing Press)
# Integration with Sovereign Sniffer for automated API reverse-engineering

set -euo pipefail

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
SNIFFER_DIR="$PROJECT_ROOT/sidecars/sovereign-sniffer"
TOOLS_DIR="$PROJECT_ROOT/data/tools"

# Logging
log_info() {
    echo -e "${CYAN}:: $1${NC}"
}

log_success() {
    echo -e "${GREEN}:: ✓ $1${NC}"
}

log_error() {
    echo -e "${RED}:: ✗ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}:: ⚠ $1${NC}"
}

# Ensure directories exist
mkdir -p "$TOOLS_DIR"

# Secure temp files
TMP_SNIFFER_OUTPUT=$(mktemp /tmp/forge-sniffer.XXXXXX.json)
TMP_OPENAPI_SPEC=$(mktemp /tmp/forge-openapi.XXXXXX.json)
trap 'rm -f "$TMP_SNIFFER_OUTPUT" "$TMP_OPENAPI_SPEC"' EXIT

# Check if Sniffer is built
check_sniffer() {
    if [ ! -f "$SNIFFER_DIR/dist/cli.js" ]; then
        log_info "Building Sovereign Sniffer..."
        cd "$SNIFFER_DIR"
        npm run build
        cd "$PROJECT_ROOT"
        log_success "Sovereign Sniffer built"
    fi
}

# Forge tool from URL using Sniffer
forge_from_url() {
    local url="$1"
    local tool_name="$2"
    local description="${3:-Auto-generated tool from $url}"
    local output_file="$TOOLS_DIR/${tool_name}.json"

    log_info "Forging tool: $tool_name"
    log_info "Source URL: $url"

    # Use the provided API schema for API discovery
    local schema_file="$SNIFFER_DIR/example-api-schema.json"

    if [ ! -f "$schema_file" ]; then
        log_error "API schema file not found: $schema_file"
        return 1
    fi

    # Use Sniffer to observe the URL
    log_info "Running Sovereign Sniffer..."
    local sniffer_output
    sniffer_output=$(node "$SNIFFER_DIR/dist/cli.js" observe \
        -u "$url" \
        -s "$schema_file" \
        -o $TMP_SNIFFER_OUTPUT 2>&1)

    if [ $? -eq 0 ]; then
        log_success "Sniffer analysis complete"

        # Validate JSON output
        if ! jq empty $TMP_SNIFFER_OUTPUT 2>/dev/null; then
            log_error "Sniffer output is not valid JSON"
            log_error "Output: $(cat $TMP_SNIFFER_OUTPUT)"
            return 1
        fi

        # Generate tool spec from sniffer output
        cat > "$output_file" << EOF
{
  "name": "$tool_name",
  "description": "$description",
  "version": "1.0.0",
  "source": {
    "url": "$url",
    "discovered_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "method": "sovereign-sniffer"
  },
  "endpoints": $(cat $TMP_SNIFFER_OUTPUT),
  "metadata": {
    "forge_version": "1.0.0",
    "node_b_ip": "100.66.173.31"
  }
}
EOF

        # Validate generated tool spec
        if ! jq empty "$output_file" 2>/dev/null; then
            log_error "Generated tool spec is not valid JSON"
            return 1
        fi

        log_success "Tool forged: $output_file"
        echo "$output_file"
    else
        log_error "Sniffer failed: $sniffer_output"
        return 1
    fi
}

# Forge tool from OpenAPI spec
forge_from_openapi() {
    local spec_url="$1"
    local tool_name="$2"
    local description="${3:-Auto-generated tool from OpenAPI spec}"
    local output_file="$TOOLS_DIR/${tool_name}.json"

    log_info "Forging tool from OpenAPI spec: $tool_name"

    # Fetch and validate spec
    if ! curl -sfL "$spec_url" -o $TMP_OPENAPI_SPEC; then
        log_error "Failed to fetch OpenAPI spec from $spec_url"
        return 1
    fi

    # Generate tool spec
    cat > "$output_file" << EOF
{
  "name": "$tool_name",
  "description": "$description",
  "version": "1.0.0",
  "source": {
    "openapi_spec": "$spec_url",
    "discovered_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
    "method": "openapi-import"
  },
  "openapi_spec": $(cat $TMP_OPENAPI_SPEC),
  "metadata": {
    "forge_version": "1.0.0",
    "node_b_ip": "100.66.173.31"
  }
}
EOF
    log_success "Tool forged: $output_file"
    echo "$output_file"
}

# List forged tools
list_tools() {
    log_info "Forged tools in $TOOLS_DIR:"
    echo ""
    if [ -d "$TOOLS_DIR" ] && [ "$(ls -A "$TOOLS_DIR" 2>/dev/null)" ]; then
        for tool_file in "$TOOLS_DIR"/*.json; do
            local tool_name
            tool_name=$(jq -r '.name' "$tool_file" 2>/dev/null || echo "Unknown")
            local description
            description=$(jq -r '.description' "$tool_file" 2>/dev/null || echo "No description")
            local source
            source=$(jq -r '.source.url // .source.openapi_spec // .source.method' "$tool_file" 2>/dev/null || echo "Unknown")

            echo -e "${GREEN}▸ $tool_name${NC}"
            echo "  $description"
            echo "  Source: $source"
            echo ""
        done
    else
        log_warning "No forged tools found"
    fi
}

# Main CLI
case "${1:-help}" in
    url)
        if [ $# -lt 3 ]; then
            log_error "Usage: $0 url <url> <tool-name> [description]"
            exit 1
        fi
        check_sniffer
        forge_from_url "$2" "$3" "${4:-}"
        ;;
    openapi)
        if [ $# -lt 3 ]; then
            log_error "Usage: $0 openapi <spec-url> <tool-name> [description]"
            exit 1
        fi
        forge_from_openapi "$2" "$3" "${4:-}"
        ;;
    list)
        list_tools
        ;;
    help|*)
        cat << EOF
Director's Forge - Tool Factory (CLI Printing Press)
Integration with Sovereign Sniffer for automated API reverse-engineering

USAGE:
    $0 <command> [arguments]

COMMANDS:
    url <url> <tool-name> [description]
        Forge a tool from a URL using Sovereign Sniffer
        Automatically discovers API endpoints via browser automation

    openapi <spec-url> <tool-name> [description]
        Forge a tool from an OpenAPI specification

    list
        List all forged tools

EXAMPLES:
    # Forge tool from API documentation
    $0 url https://api.example.com/docs example-api "Example API Tool"

    # Forge tool from OpenAPI spec
    $0 openapi https://api.example.com/openapi.json example-api "Example API Tool"

    # List forged tools
    $0 list

NODE B CONFIGURATION:
    IP: 100.66.173.31
    Artery: Tailscale Zero-Trust Network
EOF
        ;;
esac
