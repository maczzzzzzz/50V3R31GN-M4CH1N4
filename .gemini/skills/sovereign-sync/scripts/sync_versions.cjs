const fs = require('fs');
const path = require('path');

function bumpVersion(targetVersion) {
  // 1. Update package.json
  const pkgPath = path.join(process.cwd(), 'package.json');
  if (fs.existsSync(pkgPath)) {
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    const oldVersion = pkg.version;
    pkg.version = targetVersion;
    fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 2) + '\n');
    console.log(`Updated package.json: ${oldVersion} -> ${targetVersion}`);
  }

  // 2. Update guides in akashik_guides/
  updateMarkdownVersions(path.join(process.cwd(), 'akashik_guides'), targetVersion);

  // 3. Update docs/IMPLEMENTATION_PLAN.md
  const planPath = path.join(process.cwd(), 'docs/IMPLEMENTATION_PLAN.md');
  if (fs.existsSync(planPath)) {
    let content = fs.readFileSync(planPath, 'utf8');
    const original = content;
    content = content.replace(/\*\*Version:\*\* (?:v)?\d+\.\d+\.\d+/g, `**Version:** ${targetVersion}`);
    if (content !== original) {
      fs.writeFileSync(planPath, content);
      console.log(`Updated docs/IMPLEMENTATION_PLAN.md: ${targetVersion}`);
    }
  }

  // 4. Update Cargo.toml files in sidecars
  const sidecars = ['sidecar-atlas', 'sidecar-cyberdeck', 'sidecar-netrunning', 'sovereign-sdk', 'zeroclaw'];
  sidecars.forEach(dir => {
    const cargoPath = path.join(process.cwd(), dir, 'Cargo.toml');
    if (fs.existsSync(cargoPath)) {
      let content = fs.readFileSync(cargoPath, 'utf8');
      const original = content;
      content = content.replace(/^version = "\d+\.\d+\.\d+"/m, `version = "${targetVersion}"`);
      if (content !== original) {
        fs.writeFileSync(cargoPath, content);
        console.log(`Updated ${dir}/Cargo.toml: ${targetVersion}`);
      }
    }
  });

  // 5. Update GEMINI.md hardware map
  const geminiPath = path.join(process.cwd(), 'GEMINI.md');
  if (fs.existsSync(geminiPath)) {
    let content = fs.readFileSync(geminiPath, 'utf8');
    const original = content;
    content = content.replace(/HARDWARE MAP \(v\d+\.\d+\.\d+\)/g, `HARDWARE MAP (v${targetVersion})`);
    if (content !== original) {
      fs.writeFileSync(geminiPath, content);
      console.log(`Updated GEMINI.md hardware map version: ${targetVersion}`);
    }
  }
}

function updateMarkdownVersions(dir, targetVersion) {
  if (!fs.existsSync(dir)) return;
  const files = walk(dir);
  files.forEach(file => {
    if (file.endsWith('.md')) {
      let content = fs.readFileSync(file, 'utf8');
      const original = content;
      // Match "**Version:** x.y.z" or "**Version:** v.x.y.z"
      content = content.replace(/\*\*Version:\*\* (?:v)?\d+\.\d+\.\d+/g, `**Version:** ${targetVersion}`);
      if (content !== original) {
        fs.writeFileSync(file, content);
        console.log(`Updated version in guide: ${path.relative(process.cwd(), file)}`);
      }
    }
  });
}

function walk(dir) {
  let results = [];
  if (!fs.existsSync(dir)) return results;
  const list = fs.readdirSync(dir);
  list.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    if (stat && stat.isDirectory()) {
      results = results.concat(walk(filePath));
    } else {
      results.push(filePath);
    }
  });
  return results;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node sync_versions.cjs <target-version>');
  process.exit(1);
}

bumpVersion(args[0]);
