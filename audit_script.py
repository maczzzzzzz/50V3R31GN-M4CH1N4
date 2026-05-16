import os
import re
import glob

NEW_GITHUB_USER = 'maczzgit'
OLD_GITHUB_USER = 'maczzzzzzz'
NEW_NODE_A_IP = '100.96.253.114'
OLD_NODE_A_IP = '100.90.196.70'
TARGET_VERSION = 'v0.1.0-alpha'

approved_benchmarks = ['93.2', '33.7', '205.2', '49.9', '8.8', '6.1']

def check_file(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            lines = f.readlines()
    except Exception as e:
        return []

    findings = []
    for i, line in enumerate(lines):
        line_num = i + 1
        orig_line = line.strip()
        if not orig_line: continue
        
        # 1. Old github user
        if OLD_GITHUB_USER in line:
            findings.append((line_num, "CRITICAL", f"Old GitHub username '{OLD_GITHUB_USER}' needs updating to '{NEW_GITHUB_USER}'", orig_line))
            
        # 2. Old Node A IP
        if '100.90.196.70' in line:
            findings.append((line_num, "CRITICAL", f"Old Node A IP '{OLD_NODE_A_IP}' needs updating to '{NEW_NODE_A_IP}'", orig_line))
            
        # 3. directors-forge
        if re.search(r'directors-forge', line, re.IGNORECASE):
            if 'EUTHANIZED' not in line.upper():
                findings.append((line_num, "CRITICAL", "'directors-forge' mentioned but not marked EUTHANIZED", orig_line))
                
        # 4. sovereign_vsb
        if re.search(r'sovereign_vsb', line, re.IGNORECASE):
            findings.append((line_num, "CRITICAL", "Deprecated service 'sovereign_vsb' mentioned", orig_line))
            
        # 5. Benchmarks
        if re.search(r'\b\d+\.\d+\s*t/s\b', line, re.IGNORECASE):
            nums = re.findall(r'\b(\d+\.\d+)\s*t/s\b', line, re.IGNORECASE)
            for n in nums:
                if n not in approved_benchmarks:
                    findings.append((line_num, "CRITICAL", f"Benchmark {n} t/s does not match current actuals", orig_line))

        # 6. Models / Hardware (We will use some heuristics)
        # Check Node A
        if re.search(r'\bNode A\b', line, re.IGNORECASE) and not re.search(r'node-a', filepath):
            if re.search(r'(llama\.cpp|ik_llama|Vulkan|CUDA|AVX|inference|t/s)', line, re.IGNORECASE):
                findings.append((line_num, "CRITICAL", "Node A should not have inference mentioned (Cache/state only)", orig_line))
            if re.search(r'(RX 9060|RTX 2060|Meteor Lake|Ryzen|DDR5)', line, re.IGNORECASE):
                findings.append((line_num, "CRITICAL", "Node A hardware mismatch (Should be GTX 1050 Ti 4GB, 16GB RAM)", orig_line))
                
        # Check Node B
        if re.search(r'\bNode B\b', line, re.IGNORECASE) and not re.search(r'node-b', filepath):
            if re.search(r'(RTX 2060|GTX 1050|Meteor Lake|DDR5)', line, re.IGNORECASE):
                findings.append((line_num, "CRITICAL", "Node B hardware mismatch (Should be Ryzen 9 5900XT, RX 9060 XT 16GB VRAM, 48GB DDR4)", orig_line))
            if re.search(r'(Carnice|Qwen|CUDA|AVX2|sm_75)', line, re.IGNORECASE):
                findings.append((line_num, "CRITICAL", "Node B model/inference mismatch (Should be Hermes-4-14B via Vulkan)", orig_line))
                
        # Check Node C
        if re.search(r'\bNode C\b', line, re.IGNORECASE) and not re.search(r'node-c', filepath):
            if re.search(r'(RX 9060|GTX 1050|Meteor Lake|5900XT|DDR5)', line, re.IGNORECASE):
                findings.append((line_num, "CRITICAL", "Node C hardware mismatch (Should be Ryzen 7 3700X, RTX 2060 6GB, 32GB DDR4)", orig_line))
            if re.search(r'(Hermes-4|Qwen|Vulkan|AVX2)', line, re.IGNORECASE):
                findings.append((line_num, "CRITICAL", "Node C model mismatch (Should be Carnice-9B-Function-Calling i1-Q4_K_M via CUDA)", orig_line))

        # Check Node D
        if re.search(r'\bNode D\b', line, re.IGNORECASE) and not re.search(r'node-d', filepath):
            if re.search(r'(RX 9060|RTX 2060|GTX 1050|5900XT|3700X|VRAM)', line, re.IGNORECASE):
                findings.append((line_num, "CRITICAL", "Node D hardware mismatch (Should be Meteor Lake, 48GB DDR5, NPU excluded)", orig_line))
            if re.search(r'(Hermes-4|Carnice-9B|Vulkan|CUDA|sm_75)', line, re.IGNORECASE):
                findings.append((line_num, "CRITICAL", "Node D model/inference mismatch (Should be Carnice-Qwen3.6 CPU AVX2)", orig_line))

        # 7. Flake
        if re.search(r'nixos-rebuild.*flake', line):
            findings.append((line_num, "CRITICAL", "Flake-based NixOS deployment mentioned as live", orig_line))
            
        # 9. Versions
        versions = re.findall(r'\bv\d+\.\d+\.\d+(?:-[a-zA-Z0-9]+)?\b', line)
        for v in versions:
            if v.lower() != TARGET_VERSION:
                if 'version' in line.lower() or 'alpha' in v.lower() or 'release' in line.lower() or 'GEMINI.md' in filepath:
                    if 'node_modules' not in filepath:
                        findings.append((line_num, "MODERATE", f"Stale version {v} (should be {TARGET_VERSION})", orig_line))

    return findings

md_files = glob.glob('**/*.md', recursive=True)
html_files = glob.glob('**/*.html', recursive=True)

all_files = md_files + html_files
all_files.sort()

clean_files_count = 0
for filepath in all_files:
    if '.git/' in filepath or 'node_modules/' in filepath or '.gemini/' in filepath or '.worktrees/' in filepath: continue
    
    findings = check_file(filepath)
    if findings:
        print(f"FILE: {filepath}")
        for f in findings:
            print(f"- Line {f[0]} [{f[1]}]: {f[2]}")
            text = f[3]
            if len(text) > 120: text = text[:117] + "..."
            print(f"  Text: {text}")
        print()
    else:
        clean_files_count += 1

print(f"Clean files: {clean_files_count}")
