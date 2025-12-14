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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simple client-side check - not meant to be secure, just a fun gate
    if (answer.toLowerCase().trim() === "shiba" || answer.toLowerCase().trim() === "shiba inu" || answer.toLowerCase().trim() === "shibainu") {
      setUnlocked(true);
      sessionStorage.setItem("personal_unlocked", "true");
      fetchPosts();
      setError("");
    } else {
      setError("That's not it! Feel free to message me if you'd like access.");
    }
  };

  if (!unlocked) {
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold">Personal</h1>
        
        <div className="border-2 border-[var(--color-charcoal)] p-6 rounded max-w-md">
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
          
          <p className="mt-6 text-sm text-[var(--color-charcoal)]/60">
            If you&apos;re interested in reading, feel free to message me and I&apos;ll let you in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Personal</h1>
      <p className="text-[var(--color-gold)]">Ramblings and personal writings.</p>

      <ul className="space-y-6">
        {posts.map((post) => (
          <li key={post.slug}>
            <Link href={`/personal/${post.slug}`} className="block group">
              <h2 className="text-lg font-medium group-hover:text-gold transition-colors">
                {post.title}
              </h2>
              <p className="text-sm text-charcoal/60 mt-1">{post.description}</p>
              <time className="text-sm text-charcoal/40">{post.date}</time>
            </Link>
          </li>
        ))}
      </ul>

      {posts.length === 0 && (
        <p className="text-charcoal/60">No posts yet.</p>
      )}
    </div>
  );
}

