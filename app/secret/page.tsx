"use client";

import { useState, useEffect } from "react";

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

// Change these to your own values
const CORRECT_PASSWORD = process.env.NEXT_PUBLIC_SECRET_PASSWORD || "madhavan2025";
const SECURITY_ANSWER = process.env.NEXT_PUBLIC_SECURITY_ANSWER || "chess";

export default function SecretPage() {
  const [stage, setStage] = useState<"password" | "security" | "dashboard">("password");
  const [password, setPassword] = useState("");
  const [securityAnswer, setSecurityAnswer] = useState("");
  const [error, setError] = useState("");
  const [visits, setVisits] = useState<Visit[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedVisit, setSelectedVisit] = useState<Visit | null>(null);

  // Set fake title
  useEffect(() => {
    document.title = "Personal Photos";
  }, []);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === CORRECT_PASSWORD) {
      setStage("security");
      setError("");
    } else {
      setError("Incorrect password");
    }
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (securityAnswer.toLowerCase().trim() === SECURITY_ANSWER.toLowerCase()) {
      setStage("dashboard");
      setError("");
      await fetchAnalytics();
    } else {
      setError("Incorrect answer");
    }
  };

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/secret-data", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          p: CORRECT_PASSWORD, 
          s: SECURITY_ANSWER 
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setVisits(data.visits || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  // Stats calculations
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

  // Password stage - looks like a photos login
  if (stage === "password") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-800 mb-2">📸 Personal Photos</h1>
          <p className="text-stone-500 text-sm mb-6">Enter password to view private album</p>
          <form onSubmit={handlePasswordSubmit}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full p-3 border border-stone-300 rounded-lg mb-3 text-stone-800"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full p-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              Continue
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Security question stage
  if (stage === "security") {
    return (
      <div className="min-h-screen bg-stone-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-xl shadow-lg w-full max-w-sm">
          <h1 className="text-xl font-semibold text-stone-800 mb-2">🔐 Security Check</h1>
          <p className="text-stone-500 text-sm mb-6">Answer your security question</p>
          <form onSubmit={handleSecuritySubmit}>
            <label className="block text-sm text-stone-600 mb-2">
              What game did you play competitively as a kid?
            </label>
            <input
              type="text"
              value={securityAnswer}
              onChange={(e) => setSecurityAnswer(e.target.value)}
              placeholder="Your answer"
              className="w-full p-3 border border-stone-300 rounded-lg mb-3 text-stone-800"
              autoFocus
            />
            {error && <p className="text-red-500 text-sm mb-3">{error}</p>}
            <button
              type="submit"
              className="w-full p-3 bg-stone-800 text-white rounded-lg hover:bg-stone-700"
            >
              Access Photos
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Dashboard stage
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="max-w-7xl mx-auto p-6">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">📊 Analytics Dashboard</h1>
          <button
            onClick={() => { setStage("password"); setPassword(""); setSecurityAnswer(""); }}
            className="text-zinc-400 hover:text-white text-sm"
          >
            Lock
          </button>
        </div>

        {loading ? (
          <p>Loading analytics...</p>
        ) : (
          <>
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

            {/* Panels */}
            <div className="grid grid-cols-3 gap-6 mb-8">
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

            {/* Map Links */}
            <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 mb-8">
              <h2 className="font-semibold mb-4">📍 Locations (Click for Google Maps)</h2>
              <div className="grid grid-cols-4 gap-2 max-h-48 overflow-y-auto text-sm font-mono">
                {visits
                  .filter((v) => v.location?.lat && v.location?.lon)
                  .map((v, i) => (
                    <a
                      key={i}
                      href={`https://www.google.com/maps?q=${v.location!.lat},${v.location!.lon}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-zinc-800 p-2 rounded hover:bg-zinc-700 text-blue-400"
                    >
                      {v.location!.city}: {v.location!.lat.toFixed(2)}, {v.location!.lon.toFixed(2)}
                    </a>
                  ))}
              </div>
            </div>

            {/* Recent Visits */}
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
                      <th className="text-left p-3">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {visits.slice(0, 50).map((visit, i) => (
                      <tr key={i} className="border-t border-zinc-800 hover:bg-zinc-800">
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
                        <td className="p-3">
                          <button
                            onClick={() => setSelectedVisit(visit)}
                            className="text-blue-400 hover:underline"
                          >
                            View
                          </button>
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
          </>
        )}
      </div>
    </div>
  );
}

