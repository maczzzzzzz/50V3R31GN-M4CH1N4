/**
 * decrypt-st3gg.js
 *
 * Foundry VTT Macro for decrypting ST3GG steganographic images.
 */

async function runDecryption() {
  const imageUrl = await new Promise((resolve) => {
    new Dialog({
      title: "Decryption Daemon v1.0",
      content: `
        <div style="font-family: monospace; background: #1a1a1a; color: #00f3ff; padding: 10px;">
          <p>SCANNING FOR ENCRYPTED FRAGMENTS...</p>
          <div class="form-group">
            <label>Image URL:</label>
            <input type="text" id="st3gg-url" name="st3gg-url" placeholder="assets/st3gg_drops/drop_..."/>
          </div>
        </div>
      `,
      buttons: {
        decrypt: {
          icon: '<i class="fas fa-unlock"></i>',
          label: "DECRYPT",
          callback: (html) => resolve(html.find("#st3gg-url").val())
        },
        cancel: {
          icon: '<i class="fas fa-times"></i>',
          label: "ABORT",
          callback: () => resolve(null)
        }
      },
      default: "decrypt"
    }).render(true);
  });

  if (!imageUrl) return;

  // Assume window.ASP_BRIDGE is the global instance of FoundryApiBridge
  // Note: Since we switched to esmodules, we might need to expose it or use a hook.
  if (!window.ASP_BRIDGE) {
    ui.notifications.error("ASP GM Agent Bridge not found.");
    return;
  }

  try {
    const response = await window.ASP_BRIDGE.sendRequest('decrypt_st3gg', { imagePath: imageUrl });
    
    ChatMessage.create({
      user: game.user.id,
      whisper: [game.user.id],
      content: `
        <div style="font-family: monospace; border: 1px solid #00f3ff; background: #001a1a; padding: 8px; color: #00f3ff;">
          <strong>[DECRYPTION SUCCESS]</strong><br/>
          <p>${response.secret}</p>
        </div>
      `,
      flavor: "Decryption Daemon Output"
    });
  } catch (err) {
    ui.notifications.error(`Decryption failed: ${err.message}`);
  }
}

runDecryption();
