"use client";

import { useState, useEffect, useRef } from "react";
import Script from "next/script";

// Escape HTML to prevent XSS
function escapeHtml(str: string): string {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

interface Visit {
  timestamp: string;
  ip: string;
  page: string;
  referrer: string | null;
  entryReferrer: string | null;
  entryPage: string | null;
  utm: { source: string | null; medium: string | null; campaign: string | null } | null;
  userAgent: string;
  location: {
    country: string;
    countryCode: string;
    region: string;
    city: string;
    zip: string;
    lat: number;
    lon: number;
    timezone: string;
    isp: string;
    org: string;
  } | null;
}

export default function SecretPage() {
  const [stage, setStage] = useState<"password" | "security" | "dashboard">("password");
  const [password, setPassword] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [authToken, setAuthToken] = useState("");
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);

  useEffect(() => {
    document.title = "Personal Photos";
  }, []);

  // Live update every 30 seconds when on dashboard (seamless background refresh)
  useEffect(() => {
    if (stage !== "dashboard" || !authToken) return;

    const interval = setInterval(() => {
      fetchAnalytics(true); // true = background refresh
    }, 30000);

    return () => clearInterval(interval);
  }, [stage, authToken]);

  // Initialize map when leaflet is loaded and we have visits
  useEffect(() => {
    if (leafletLoaded && visits.length > 0 && mapRef.current && !mapInstanceRef.current) {
      const L = (window as any).L;
      if (!L) return;

      const map = L.map(mapRef.current).setView([20, 0], 2);
      L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
        attribution: "© OpenStreetMap contributors © CARTO",
      }).addTo(map);

      visits.forEach((v) => {
        if (v.location?.lat && v.location?.lon) {
          L.circleMarker([v.location.lat, v.location.lon], {
            radius: 6,
            fillColor: "#8B7355",
            color: "#2D2A26",
            weight: 1,
            opacity: 1,
            fillOpacity: 0.8,
          })
            .bindPopup(
              `<b>${escapeHtml(v.location.city)}, ${escapeHtml(v.location.country)}</b><br>${escapeHtml(v.page)}<br><small>${escapeHtml(new Date(v.timestamp).toLocaleString())}</small>`
            )
            .addTo(map);
        }
      });

      mapInstanceRef.current = map;
    }
  }, [leafletLoaded, visits]);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("/api/secret-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "password", password }),
      });
      
      if (res.ok) {
        setStage("security");
        setError("");
      } else {
        setError("Incorrect password");
      }
    } catch {
      setError("Error verifying password");
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    
    try {
      const res = await fetch("/api/secret-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "security", password, securityAnswer }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setAuthToken(data.token);
        setStage("dashboard");
        setError("");
        setVisits(data.visits || []);
        setLastUpdate(new Date());
      } else {
        setError("Incorrect answer");
      }
    } catch {
      setError("Error verifying answer");
    }
  };

  const fetchAnalytics = async (isBackgroundRefresh = false) => {
    if (!authToken) return;
    // Only show loading on initial load, not background refreshes
    if (!isBackgroundRefresh && visits.length === 0) setLoading(true);
    
    try {
      const res = await fetch("/api/secret-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ step: "fetch", token: authToken }),
      });
      
      if (res.ok) {
        const data = await res.json();
        setVisits(data.visits || []);
        setLastUpdate(new Date());
      }
    } catch (e) {
      // Silently fail on background refresh
      if (!isBackgroundRefresh) console.error(e);
    }
    if (!isBackgroundRefresh) setLoading(false);
  };

  const countryStats = visits.reduce((acc, v) => {
    const country = v.location?.country || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const cityStats = visits.reduce((acc, v) => {
    if (v.location?.city) {
      const key = `${v.location.city}, ${v.location.countryCode}`;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  const pageStats = visits.reduce((acc, v) => {
    acc[v.page] = (acc[v.page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Password stage
  if (stage === "password") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold">📸 Personal Photos</h1>
        <p className="text-[var(--color-gold)] mt-2 mb-6">Enter password to view private album</p>
        <form onSubmit={handlePasswordSubmit} className="space-y-4 w-full max-w-sm">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full p-3 border-2 border-[var(--color-charcoal)] bg-transparent rounded"
            autoFocus
          />
          {error && <p className="text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full p-3 bg-[var(--color-charcoal)] text-[var(--color-cream)] rounded hover:bg-[var(--color-gold)] transition-colors"
          >
            Continue
          </button>
        </form>
      </div>
    );
  }

  // Security question stage
  if (stage === "security") {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center">
        <h1 className="text-2xl font-bold">🔐 Security Check</h1>
        <p className="text-[var(--color-gold)] mt-2 mb-6">Answer your security question</p>
        <form onSubmit={handleSecuritySubmit} className="space-y-4 w-full max-w-sm">
          <label className="block text-sm text-left">
            What game did you play competitively as a kid?
          </label>
          <input
            type="text"
            value={securityAnswer}
            onChange={(e) => setSecurityAnswer(e.target.value)}
            placeholder="Your answer"
            className="w-full p-3 border-2 border-[var(--color-charcoal)] bg-transparent rounded"
            autoFocus
          />
          {error && <p className="text-red-600">{error}</p>}
          <button
            type="submit"
            className="w-full p-3 bg-[var(--color-charcoal)] text-[var(--color-cream)] rounded hover:bg-[var(--color-gold)] transition-colors"
          >
            Access Photos
          </button>
        </form>
      </div>
    );
  }

  // Dashboard
  return (
    <>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
      />
      <Script
        src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
        onLoad={() => setLeafletLoaded(true)}
      />

      <div className="space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Analytics</h1>
            {lastUpdate && (
              <p className="text-sm text-[var(--color-gold)]">
                Updated {lastUpdate.toLocaleTimeString()} · Auto-refreshes every 30s
              </p>
            )}
          </div>
          <button
            onClick={() => {
              setStage("password");
              setPassword("");
              setSecurityAnswer("");
              setAuthToken("");
              mapInstanceRef.current = null;
            }}
            className="text-[var(--color-gold)] hover:text-[var(--color-charcoal)]"
          >
            Lock
          </button>
        </div>

        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <>
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="border-2 border-[var(--color-charcoal)] p-4 rounded">
                <p className="text-sm text-[var(--color-gold)]">Total Visits</p>
                <p className="text-3xl font-bold">{visits.length}</p>
              </div>
              <div className="border-2 border-[var(--color-charcoal)] p-4 rounded">
                <p className="text-sm text-[var(--color-gold)]">Countries</p>
                <p className="text-3xl font-bold">{Object.keys(countryStats).length}</p>
              </div>
              <div className="border-2 border-[var(--color-charcoal)] p-4 rounded">
                <p className="text-sm text-[var(--color-gold)]">Cities</p>
                <p className="text-3xl font-bold">{Object.keys(cityStats).length}</p>
              </div>
              <div className="border-2 border-[var(--color-charcoal)] p-4 rounded">
                <p className="text-sm text-[var(--color-gold)]">Pages</p>
                <p className="text-3xl font-bold">{Object.keys(pageStats).length}</p>
              </div>
            </div>

            {/* Map */}
            <div
              ref={mapRef}
              className="h-80 rounded border-2 border-[var(--color-charcoal)]"
              style={{ background: "#e8e4dc" }}
            />

            {/* Panels */}
            <div className="grid grid-cols-3 gap-6">
              <div className="border-2 border-[var(--color-charcoal)] p-4 rounded">
                <h2 className="font-bold mb-4">🌍 By Country</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(countryStats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([country, count]) => (
                      <div key={country} className="flex justify-between text-sm">
                        <span>{country}</span>
                        <span className="text-[var(--color-gold)]">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="border-2 border-[var(--color-charcoal)] p-4 rounded">
                <h2 className="font-bold mb-4">🏙️ By City</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(cityStats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([city, count]) => (
                      <div key={city} className="flex justify-between text-sm">
                        <span>{city}</span>
                        <span className="text-[var(--color-gold)]">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
              <div className="border-2 border-[var(--color-charcoal)] p-4 rounded">
                <h2 className="font-bold mb-4">📄 By Page</h2>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {Object.entries(pageStats)
                    .sort((a, b) => b[1] - a[1])
                    .map(([page, count]) => (
                      <div key={page} className="flex justify-between text-sm">
                        <span>{page}</span>
                        <span className="text-[var(--color-gold)]">{count}</span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Recent Visits */}
            <div className="border-2 border-[var(--color-charcoal)] rounded overflow-hidden">
              <h2 className="font-bold p-4 border-b-2 border-[var(--color-charcoal)]">Recent Visits</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-[var(--color-charcoal)] text-[var(--color-cream)]">
                    <tr>
                      <th className="text-left p-3">Time</th>
                      <th className="text-left p-3">Location</th>
                      <th className="text-left p-3">Page</th>
                      <th className="text-left p-3">ISP</th>
                      <th className="text-left p-3">Map</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.slice(0, 50).map((visit, i) => (
                      <tr
                        key={i}
                        className="border-t border-[var(--color-charcoal)]/20 hover:bg-[var(--color-charcoal)]/5 cursor-pointer"
                        onClick={() => setSelectedVisit(visit)}
                      >
                        <td className="p-3 text-[var(--color-gold)]">
                          {new Date(visit.timestamp).toLocaleString()}
                        </td>
                        <td className="p-3">
                          {visit.location
                            ? `${visit.location.city}, ${visit.location.region}, ${visit.location.countryCode}`
                            : "Unknown"}
                        </td>
                        <td className="p-3">{visit.page}</td>
                        <td className="p-3 text-[var(--color-gold)]">{visit.location?.isp || "-"}</td>
                        <td className="p-3">
                          {visit.location && (
                            <a
                              href={`https://www.google.com/maps?q=${visit.location.lat},${visit.location.lon}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-[var(--color-gold)] hover:underline"
                              onClick={(e) => e.stopPropagation()}
                            >
                              View
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal */}
            {selectedVisit && (
              <div
                className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
                onClick={() => setSelectedVisit(null)}
              >
                <div
                  className="bg-[var(--color-cream)] p-6 rounded border-2 border-[var(--color-charcoal)] max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                  onClick={(e) => e.stopPropagation()}
                >
                  <h3 className="text-xl font-bold mb-4">Visit Details</h3>
                  <pre className="bg-[var(--color-charcoal)] text-[var(--color-cream)] p-4 rounded text-sm overflow-x-auto">
                    {JSON.stringify(selectedVisit, null, 2)}
                  </pre>
                  {selectedVisit.location && (
                    <a
                      href={`https://www.google.com/maps?q=${selectedVisit.location.lat},${selectedVisit.location.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-block mt-4 px-4 py-2 bg-[var(--color-charcoal)] text-[var(--color-cream)] rounded hover:bg-[var(--color-gold)]"
                    >
                      Open in Google Maps →
                    </a>
                  )}
                  <button
                    onClick={() => setSelectedVisit(null)}
                    className="block mt-4 text-[var(--color-gold)] hover:underline"
                  >
                    Close
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}
