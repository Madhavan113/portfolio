"use client";

import { useState, useEffect } from "react";

interface Visit {
  timestamp: string;
  ip: string;
  page: string;
  referrer: string | null;
  entryReferrer: string | null;
  entryPage: string | null;
  utm: {
    source: string | null;
    medium: string | null;
    campaign: string | null;
  } | null;
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

export default function Dashboard() {
  const [secret, setSecret] = useState("");
  const [authenticated, setAuthenticated] = useState(false);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  const fetchAnalytics = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/analytics", {
        headers: { Authorization: `Bearer ${secret}` },
      });

      if (!res.ok) {
        if (res.status === 401) {
          setError("Invalid secret key");
          setAuthenticated(false);
        } else {
          setError("Failed to fetch analytics");
        }
        return;
      }

      const data = await res.json();
      setVisits(data.visits);
      setAuthenticated(true);
      localStorage.setItem("analytics_secret", secret);
    } catch {
      setError("Failed to connect");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const saved = localStorage.getItem("analytics_secret");
    if (saved) {
      setSecret(saved);
    }
  }, []);

  // Group visits by country
  const countryStats = visits.reduce((acc, visit) => {
    const country = visit.location?.country || "Unknown";
    acc[country] = (acc[country] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Group visits by city
  const cityStats = visits.reduce((acc, visit) => {
    if (visit.location?.city) {
      const key = `${visit.location.city}, ${visit.location.countryCode}`;
      acc[key] = (acc[key] || 0) + 1;
    }
    return acc;
  }, {} as Record<string, number>);

  // Group visits by page
  const pageStats = visits.reduce((acc, visit) => {
    acc[visit.page] = (acc[visit.page] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  if (!authenticated) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="bg-zinc-900 p-8 rounded-lg border border-zinc-800 w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6">🔒 Analytics Dashboard</h1>
          <p className="text-zinc-400 mb-4 text-sm">
            Enter your ANALYTICS_SECRET to view visitor data.
          </p>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            placeholder="Enter secret key..."
            className="w-full p-3 bg-zinc-800 border border-zinc-700 rounded mb-4 text-white"
            onKeyDown={(e) => e.key === "Enter" && fetchAnalytics()}
          />
          {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
          <button
            onClick={fetchAnalytics}
            disabled={loading || !secret}
            className="w-full p-3 bg-white text-black font-medium rounded hover:bg-zinc-200 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Access Dashboard"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>
          <button
            onClick={() => {
              setAuthenticated(false);
              localStorage.removeItem("analytics_secret");
            }}
            className="text-zinc-400 hover:text-white text-sm"
          >
            Logout
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <p className="text-zinc-400 text-sm">Total Visits</p>
            <p className="text-3xl font-bold">{visits.length}</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <p className="text-zinc-400 text-sm">Countries</p>
            <p className="text-3xl font-bold">{Object.keys(countryStats).length}</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <p className="text-zinc-400 text-sm">Cities</p>
            <p className="text-3xl font-bold">{Object.keys(cityStats).length}</p>
          </div>
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <p className="text-zinc-400 text-sm">Pages</p>
            <p className="text-3xl font-bold">{Object.keys(pageStats).length}</p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-8">
          {/* Countries */}
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <h2 className="font-semibold mb-4">🌍 By Country</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(countryStats)
                .sort((a, b) => b[1] - a[1])
                .map(([country, count]) => (
                  <div key={country} className="flex justify-between text-sm">
                    <span>{country}</span>
                    <span className="text-zinc-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Cities */}
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <h2 className="font-semibold mb-4">🏙️ By City</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(cityStats)
                .sort((a, b) => b[1] - a[1])
                .map(([city, count]) => (
                  <div key={city} className="flex justify-between text-sm">
                    <span>{city}</span>
                    <span className="text-zinc-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>

          {/* Pages */}
          <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
            <h2 className="font-semibold mb-4">📄 By Page</h2>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {Object.entries(pageStats)
                .sort((a, b) => b[1] - a[1])
                .map(([page, count]) => (
                  <div key={page} className="flex justify-between text-sm">
                    <span className="font-mono">{page}</span>
                    <span className="text-zinc-400">{count}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        {/* Map placeholder - coordinates list */}
        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 mb-8">
          <h2 className="font-semibold mb-4">📍 Location Coordinates</h2>
          <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto text-sm font-mono">
            {visits
              .filter((v) => v.location?.lat && v.location?.lon)
              .map((v, i) => (
                <div
                  key={i}
                  className="bg-zinc-800 p-2 rounded cursor-pointer hover:bg-zinc-700"
                  onClick={() => setSelectedVisit(v)}
                >
                  {v.location!.city}: {v.location!.lat.toFixed(2)}, {v.location!.lon.toFixed(2)}
                </div>
              ))}
          </div>
        </div>

        {/* Recent Visits Table */}
        <div className="bg-zinc-900 rounded-lg border border-zinc-800 overflow-hidden">
          <h2 className="font-semibold p-4 border-b border-zinc-800">Recent Visits</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-zinc-800">
                <tr>
                  <th className="text-left p-3">Time</th>
                  <th className="text-left p-3">Location</th>
                  <th className="text-left p-3">Page</th>
                  <th className="text-left p-3">ISP</th>
                  <th className="text-left p-3">Source</th>
                </tr>
              </thead>
              <tbody>
                {visits.slice(0, 50).map((visit, i) => (
                  <tr
                    key={i}
                    className="border-t border-zinc-800 hover:bg-zinc-800 cursor-pointer"
                    onClick={() => setSelectedVisit(visit)}
                  >
                    <td className="p-3 text-zinc-400">
                      {new Date(visit.timestamp).toLocaleString()}
                    </td>
                    <td className="p-3">
                      {visit.location
                        ? `${visit.location.city}, ${visit.location.region}, ${visit.location.countryCode}`
                        : "Unknown"}
                    </td>
                    <td className="p-3 font-mono">{visit.page}</td>
                    <td className="p-3 text-zinc-400">{visit.location?.isp || "-"}</td>
                    <td className="p-3 text-zinc-400">
                      {visit.utm?.source || visit.entryReferrer || "Direct"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detail Modal */}
        {selectedVisit && (
          <div
            className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50"
            onClick={() => setSelectedVisit(null)}
          >
            <div
              className="bg-zinc-900 p-6 rounded-lg border border-zinc-700 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-bold mb-4">Visit Details</h3>
              <pre className="bg-zinc-800 p-4 rounded text-sm overflow-x-auto">
                {JSON.stringify(selectedVisit, null, 2)}
              </pre>
              {selectedVisit.location && (
                <a
                  href={`https://www.google.com/maps?q=${selectedVisit.location.lat},${selectedVisit.location.lon}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500"
                >
                  Open in Google Maps →
                </a>
              )}
              <button
                onClick={() => setSelectedVisit(null)}
                className="block mt-4 text-zinc-400 hover:text-white"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

