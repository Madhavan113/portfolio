"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

interface PersonalPost {
  slug: string;
  title: string;
  date: string;
  description: string;
}

export default function PersonalPage() {
  const [answer, setAnswer] = useState("");
  const [unlocked, setUnlocked] = useState(false);
  const [error, setError] = useState("");
  const [posts, setPosts] = useState<PersonalPost[]>([]);

  useEffect(() => {
    // Check if already unlocked in session
    const isUnlocked = sessionStorage.getItem("personal_unlocked");
    if (isUnlocked === "true") {
      setUnlocked(true);
      fetchPosts();
    }
  }, []);

  const fetchPosts = async () => {
    const res = await fetch("/api/personal-posts");
    const data = await res.json();
    setPosts(data.posts || []);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const res = await fetch("/api/personal-posts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ answer }),
      });

      if (res.ok) {
        const data = await res.json();
        setUnlocked(true);
        sessionStorage.setItem("personal_unlocked", "true");
        setPosts(data.posts || []);
      } else {
        setError("That's not it! Feel free to message me if you'd like access.");
      }
    } catch {
      setError("Something went wrong. Try again.");
    }
  };

  if (!unlocked) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Personal</h1>

        <div className="glass p-6 rounded max-w-md">
          <p className="mb-4 text-[var(--color-gold)]">
            This section contains personal writings and ramblings.
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <label className="block text-sm">
              What is my favorite dog breed?
            </label>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Your answer"
              className="w-full p-3 border-2 border-[var(--color-charcoal)] bg-transparent rounded"
              autoFocus
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              className="w-full p-3 bg-[var(--color-charcoal)] text-[var(--color-cream)] rounded hover:bg-[var(--color-gold)] transition-colors"
            >
              Enter
            </button>
          </form>

          <p className="mt-6 text-sm text-[var(--color-charcoal)]/68">
            If you&apos;re interested in reading, feel free to message me and I&apos;ll let you in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <header className="space-y-3">
        <h1 className="text-2xl font-bold">Personal</h1>
        <p className="text-[var(--color-gold)]">Ramblings and personal writings.</p>
      </header>

      <ul className="space-y-4">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link
              href={`/personal/${post.slug}`}
              className="group block rounded-2xl border border-charcoal/10 bg-white/55 px-5 py-4 transition-colors hover:border-charcoal/20 hover:bg-white/72"
            >
              <h2 className="text-lg font-medium group-hover:text-gold transition-colors">
                {post.title}
              </h2>
              <p className="mt-2 text-sm text-charcoal/68">{post.description}</p>
              <time className="text-sm text-charcoal/50">{post.date}</time>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length === 0 && (
        <p className="text-charcoal/65">No posts yet.</p>
      )}
    </div>
  );
}

