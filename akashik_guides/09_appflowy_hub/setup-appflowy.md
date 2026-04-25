# ◈ SETUP: APPFLOWY SOVEREIGN HUB
**Version:** 1.0.0
**Aesthetic:** Gruvbox (Canonical)

## 🎯 OBJECTIVE
To provide a structured project management and documentation environment that is 100% local-first and shored to the Sovereign mesh.

---

## 🚀 1. INSTALLATION (WINDOWS HOST)
If you have not already installed the AppFlowy Desktop client, follow these steps:

1. **Download:** Get the latest release for Windows from [AppFlowy Releases](https://github.com/AppFlowy-IO/AppFlowy/releases).
2. **Install:** Run the installer or extract the portable version to your D: drive (Recommended: \`D:\AppFlowy\`).
3. **Launch:** Open \`AppFlowy.exe\`.

---

## ⚡ 2. CONNECTING TO THE ARTERY
To use the Sovereign local-first backend (Task 76.4):

1. **Ignite Backend:** In your WSL terminal, run:
   \`\`\`bash
   systemctl --user start sovereign-flowy
   \`\`\`
2. **Client Config:** 
   - Open AppFlowy Desktop.
   - Go to **Settings -> Cloud Settings**.
   - Set the **Server URL** to: \`http://10.0.0.12:3000\`.
3. **Login:** Use any username/password (The local-first port currently uses a permissive auth gate shored in the OS DB).

---

## 🎨 3. AESTHETIC TAKEOVER (GRUVB0X)
1. Go to **Settings -> Appearance**.
2. Click **Import Theme**.
3. Select the file at: \`/home/nixos/50V3R31GN-M4CH1N4/config/appflowy/gruvbox-dark.json\`.
4. Set the theme to **"Sovereign Gruvbox Dark"**.

---
**::/5Y573M-N071C3 : HUB_GUIDE_SHORED. THE_HUB_IS_READY. // 50V3R31GN-M4CH1N4**
EOF
