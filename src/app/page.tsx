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
  const [step, setStep] = useState(0);

  const steps = [
    "Opening the page...",
    "Running accessibility checks...",
    "Analysing contrast and typography...",
    "Running performance analysis...",
    "Generating fix suggestions...",
  ];

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!values.url) {
      setError("Please enter a URL");
      return;
    }

    setLoading(true);
    setStep(0);
    let interval: ReturnType<typeof setInterval> | null = null;

    try {
      interval = setInterval(() => {
        setStep((prev) => (prev < steps.length - 1 ? prev + 1 : prev));
      }, 5000);
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
      if (interval) clearInterval(interval);
      setLoading(false);
      setStep(0);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
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
            className="bg-zinc-900 text-white px-5 py-3 rounded-lg text-sm font-medium hover:bg-zinc-700 disabled:opacity-50 transition-colors whitespace-nowrap"
          >
            {loading ? "Scanning..." : "Scan"}
          </button>
        </form>

        {loading && (
          <div className="mt-6 flex flex-col items-center gap-3">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-zinc-900 h-1.5 rounded-full transition-all duration-1000"
                style={{ width: `${((step + 1) / steps.length) * 100}%` }}
              />
            </div>
            <p className="text-sm text-zinc-500">{steps[step]}</p>
          </div>
        )}
        {!loading && error && (
          <p className="text-red-500 text-sm mt-3">{error}</p>
        )}

        <p className="text-xs text-zinc-400 mt-4">
          Checks accessibility · performance · contrast · typography · SEO
        </p>
      </section>
    </main>
  );
}
