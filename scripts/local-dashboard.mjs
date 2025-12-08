import http from 'http';
import { list } from '@vercel/blob';

const PORT = 3333;

// Fetch all visits from blob storage
async function getVisits() {
  const { blobs } = await list({ prefix: 'visits/', limit: 1000 });
  
  const visits = await Promise.all(
    blobs.map(async (blob) => {
      try {
        const res = await fetch(blob.url);
        return await res.json();
      } catch {
        return null;
      }
    })
  );
  
  return visits
    .filter(v => v !== null)
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
}

// Generate the dashboard HTML
function generateHTML(visits) {
  // Stats
  const countries = {};
  const cities = {};
  const pages = {};
  
  visits.forEach(v => {
    if (v.location) {
      countries[v.location.country] = (countries[v.location.country] || 0) + 1;
      cities[`${v.location.city}, ${v.location.countryCode}`] = (cities[`${v.location.city}, ${v.location.countryCode}`] || 0) + 1;
    }
    pages[v.page] = (pages[v.page] || 0) + 1;
  });

  const sortedCountries = Object.entries(countries).sort((a, b) => b[1] - a[1]);
  const sortedCities = Object.entries(cities).sort((a, b) => b[1] - a[1]);
  const sortedPages = Object.entries(pages).sort((a, b) => b[1] - a[1]);
  
  // Coordinates for map
  const coordinates = visits
    .filter(v => v.location?.lat && v.location?.lon)
    .map(v => ({
      lat: v.location.lat,
      lon: v.location.lon,
      city: v.location.city,
      country: v.location.country,
      page: v.page,
      time: v.timestamp
    }));

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Analytics Dashboard (Local)</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0a0a0a; color: #e5e5e5; }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    h1 { font-size: 28px; margin-bottom: 24px; }
    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; margin-bottom: 24px; }
    .stat-card { background: #18181b; padding: 20px; border-radius: 8px; border: 1px solid #27272a; }
    .stat-card .label { color: #71717a; font-size: 14px; margin-bottom: 4px; }
    .stat-card .value { font-size: 32px; font-weight: 700; }
    #map { height: 400px; border-radius: 8px; margin-bottom: 24px; }
    .panels { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 24px; }
    .panel { background: #18181b; padding: 16px; border-radius: 8px; border: 1px solid #27272a; max-height: 300px; overflow-y: auto; }
    .panel h2 { font-size: 16px; margin-bottom: 12px; }
    .panel-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #27272a; font-size: 14px; }
    .panel-row:last-child { border-bottom: none; }
    .panel-row .count { color: #71717a; }
    table { width: 100%; border-collapse: collapse; background: #18181b; border-radius: 8px; overflow: hidden; }
    th, td { text-align: left; padding: 12px 16px; border-bottom: 1px solid #27272a; font-size: 14px; }
    th { background: #27272a; font-weight: 600; }
    tr:hover { background: #27272a; }
    .mono { font-family: monospace; }
    .muted { color: #71717a; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
  </style>
</head>
<body>
  <div class="container">
    <h1>📊 Analytics Dashboard <span style="font-size: 14px; color: #71717a;">(Local)</span></h1>
    
    <div class="stats-grid">
      <div class="stat-card">
        <div class="label">Total Visits</div>
        <div class="value">${visits.length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Countries</div>
        <div class="value">${Object.keys(countries).length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Cities</div>
        <div class="value">${Object.keys(cities).length}</div>
      </div>
      <div class="stat-card">
        <div class="label">Pages</div>
        <div class="value">${Object.keys(pages).length}</div>
      </div>
    </div>
    
    <div id="map"></div>
    
    <div class="panels">
      <div class="panel">
        <h2>🌍 By Country</h2>
        ${sortedCountries.map(([country, count]) => `
          <div class="panel-row">
            <span>${country}</span>
            <span class="count">${count}</span>
          </div>
        `).join('')}
      </div>
      <div class="panel">
        <h2>🏙️ By City</h2>
        ${sortedCities.slice(0, 20).map(([city, count]) => `
          <div class="panel-row">
            <span>${city}</span>
            <span class="count">${count}</span>
          </div>
        `).join('')}
      </div>
      <div class="panel">
        <h2>📄 By Page</h2>
        ${sortedPages.map(([page, count]) => `
          <div class="panel-row">
            <span class="mono">${page}</span>
            <span class="count">${count}</span>
          </div>
        `).join('')}
      </div>
    </div>
    
    <h2 style="margin-bottom: 16px;">Recent Visits</h2>
    <table>
      <thead>
        <tr>
          <th>Time</th>
          <th>Location</th>
          <th>Page</th>
          <th>ISP</th>
          <th>Map</th>
        </tr>
      </thead>
      <tbody>
        ${visits.slice(0, 100).map(v => `
          <tr>
            <td class="muted">${new Date(v.timestamp).toLocaleString()}</td>
            <td>${v.location ? `${v.location.city}, ${v.location.region}, ${v.location.countryCode}` : 'Unknown'}</td>
            <td class="mono">${v.page}</td>
            <td class="muted">${v.location?.isp || '-'}</td>
            <td>${v.location ? `<a href="https://www.google.com/maps?q=${v.location.lat},${v.location.lon}" target="_blank">View</a>` : '-'}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  </div>
  
  <script>
    const coordinates = ${JSON.stringify(coordinates)};
    
    const map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '© OpenStreetMap contributors © CARTO'
    }).addTo(map);
    
    coordinates.forEach(c => {
      L.circleMarker([c.lat, c.lon], {
        radius: 6,
        fillColor: '#3b82f6',
        color: '#1d4ed8',
        weight: 1,
        opacity: 1,
        fillOpacity: 0.8
      })
      .bindPopup(\`<b>\${c.city}, \${c.country}</b><br>\${c.page}<br><small>\${new Date(c.time).toLocaleString()}</small>\`)
      .addTo(map);
    });
  </script>
</body>
</html>`;
}

// Create server
const server = http.createServer(async (req, res) => {
  if (req.url === '/' || req.url === '/dashboard') {
    console.log('📊 Fetching analytics data from Vercel Blob...');
    
    try {
      const visits = await getVisits();
      console.log(`✅ Found ${visits.length} visits`);
      
      const html = generateHTML(visits);
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    } catch (error) {
      console.error('❌ Error:', error.message);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end(`Error: ${error.message}\n\nMake sure BLOB_READ_WRITE_TOKEN is set.`);
    }
  } else {
    res.writeHead(404);
    res.end('Not found');
  }
});

server.listen(PORT, () => {
  console.log(`\n🚀 Analytics Dashboard running at: http://localhost:${PORT}\n`);
  console.log('Open this URL in your browser to view visitor data.\n');
});

