const fs = require('fs');
const path = require('path');
const os = require('os');

// Helper to detect local IPv4 address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  const candidates = [];

  for (const name of Object.keys(interfaces)) {
    const list = interfaces[name];
    for (const iface of list) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const lowerName = name.toLowerCase();
        // Ignore virtual network interfaces
        if (
          lowerName.includes('virtual') ||
          lowerName.includes('vbox') ||
          lowerName.includes('vmware') ||
          lowerName.includes('wsl') ||
          lowerName.includes('docker') ||
          lowerName.includes('hyper-v') ||
          lowerName.includes('pseudo') ||
          lowerName.includes('host-only')
        ) {
          continue;
        }
        candidates.push({ name, address: iface.address });
      }
    }
  }

  // Prioritize Wi-Fi and Ethernet
  candidates.sort((a, b) => {
    const aName = a.name.toLowerCase();
    const bName = b.name.toLowerCase();
    const aIsWiFi = aName.includes('wi-fi') || aName.includes('wlan') || aName.includes('wireless');
    const bIsWiFi = bName.includes('wi-fi') || bName.includes('wlan') || bName.includes('wireless');
    const aIsEth = aName.includes('ethernet') || aName.includes('lan');
    const bIsEth = bName.includes('ethernet') || bName.includes('lan');

    if (aIsWiFi && !bIsWiFi) return -1;
    if (!aIsWiFi && bIsWiFi) return 1;
    if (aIsEth && !bIsEth) return -1;
    if (!aIsEth && bIsEth) return 1;
    return 0;
  });

  if (candidates.length > 0) {
    return candidates[0].address;
  }
  return '127.0.0.1'; // Fallback
}

const localIP = getLocalIP();
console.log(`[PedalAnatolia] Detected local IP: ${localIP}`);

const envPath = path.join(__dirname, '../.env');
const envExamplePath = path.join(__dirname, '../.env.example');
const apiPath = path.join(__dirname, '../src/lib/api.ts');

const newBaseUrl = `http://${localIP}:8989`;

// 1. Update or Create client/.env
let envContent = '';
if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
  console.log('[PedalAnatolia] Reading existing .env file...');
} else if (fs.existsSync(envExamplePath)) {
  envContent = fs.readFileSync(envExamplePath, 'utf8');
  console.log('[PedalAnatolia] Existing .env not found. Creating .env from .env.example...');
} else {
  envContent = 'EXPO_PUBLIC_GRAPHHOPPER_BASE_URL=http://YOUR_WIFI_IP:8989\n';
  console.log('[PedalAnatolia] Creating new .env file...');
}

// Replace or append EXPO_PUBLIC_GRAPHHOPPER_BASE_URL
const urlRegex = /^EXPO_PUBLIC_GRAPHHOPPER_BASE_URL=.*$/m;
if (urlRegex.test(envContent)) {
  envContent = envContent.replace(urlRegex, `EXPO_PUBLIC_GRAPHHOPPER_BASE_URL=${newBaseUrl}`);
} else {
  envContent = `EXPO_PUBLIC_GRAPHHOPPER_BASE_URL=${newBaseUrl}\n` + envContent;
}

fs.writeFileSync(envPath, envContent, 'utf8');
console.log(`[PedalAnatolia] Updated client/.env: EXPO_PUBLIC_GRAPHHOPPER_BASE_URL=${newBaseUrl}`);

// 2. Update client/src/lib/api.ts fallback IP
if (fs.existsSync(apiPath)) {
  let apiContent = fs.readFileSync(apiPath, 'utf8');
  
  // Look for: return 'http://<IP>:8989'; // AUTO-UPDATED-IP-FALLBACK
  const apiFallbackRegex = /(return\s+['"`]http:\/\/)[0-9.]+(:\d+['"`];\s*\/\/\s*AUTO-UPDATED-IP-FALLBACK)/g;
  
  if (apiFallbackRegex.test(apiContent)) {
    apiContent = apiContent.replace(apiFallbackRegex, `$1${localIP}$2`);
    fs.writeFileSync(apiPath, apiContent, 'utf8');
    console.log(`[PedalAnatolia] Updated client/src/lib/api.ts fallback IP to ${localIP}`);
  } else {
    console.warn('[PedalAnatolia] Could not find AUTO-UPDATED-IP-FALLBACK marker in client/src/lib/api.ts');
  }
} else {
  console.error('[PedalAnatolia] Error: client/src/lib/api.ts not found.');
}
