import { VisualMonitorService } from '../core/visual-monitor-service.js';
import 'dotenv/config';

async function main() {
  const vm = new VisualMonitorService();
  try {
    console.log('📡 Connecting to Neural Uplink...');
    await vm.connect();
    const client = vm.getClient();
    const { Runtime } = client;

    console.log('🔍 Scanning UI elements...');
    const expression = `
      (function() {
        try {
          const elements = Array.from(document.querySelectorAll('input, button, select'))
            .map(el => ({
              tag: el.tagName,
              name: el.getAttribute('name') || '',
              id: el.id,
              type: el.getAttribute('type') || '',
              text: el.innerText || ''
            }));
          return JSON.stringify(elements);
        } catch (e) {
          return JSON.stringify({ error: e.message });
        }
      })()
    `;

    const { result } = await Runtime.evaluate({ expression });
    
    if (result.type === 'string' && result.value) {
      const elements = JSON.parse(result.value);
      console.log('\n📍 CURRENT VISIBLE ELEMENTS:');
      console.table(elements);

      if (elements.some((el: any) => el.name === 'password' || el.name === 'adminPassword')) {
        console.log('\n✅ Login fields detected.');
      } else {
        console.log('\n⚠️  No login fields detected.');
      }
    } else {
      console.error('❌ Diagnostic Failed: Renderer returned non-string or empty result.', result);
    }

  } catch (e: any) {
    console.error('❌ Diagnostic Failed:', e.message);
  } finally {
    await vm.disconnect().catch(() => {});
  }
}

main();
