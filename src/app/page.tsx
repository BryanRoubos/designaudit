"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

const initialValues = {
  url: "",
};

export default function Home() {
  const router = useRouter();
  const [values, setValues] = useState(initialValues);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!values.url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/audit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(values),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error);
        return;
      }
      if (!data.id) {
        setError("Something went wrong. Please try again.");
        return;
      }

      router.push(`/results/${data.id}`);
    } catch (error) {
      console.error(error);
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
      <section className="max-w-xl mx-auto text-center">
        <h1 className="text-5xl font-bold text-zinc-900 mb-3 leading-tight">
          Is your website losing users?
        </h1>
        <p className="text-zinc-500 mb-8 text-base leading-relaxed">
          Scan any URL for accessibility failures, performance issues, and SEO
          gaps. Get a scored report with plain-English fixes in under 30
          seconds.
        </p>

        <form onSubmit={handleSubmit} className="flex gap-2 mb-3">
          <input
            name="url"
            type="text"
            placeholder="https://yourwebsite.com"
            onChange={handleInputChange}
            className="flex-1 border border-gray-200 rounded-lg px-4 py-3 text-sm text-zinc-800 placeholder-zinc-400 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-zinc-300"
          />
          <button
            type="submit"
            disabled={loading}
            className="bg-zinc-900 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors"
          >
            {loading ? "Scanning..." : "Scan"}
          </button>
        </form>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <p className="text-xs text-zinc-400 mt-4">
          Checks accessibility · performance · contrast · typography · SEO
        </p>
      </section>
    </main>
  );
}
