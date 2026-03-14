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
    <main className="min-h-screen flex flex-col items-center justify-center">
      <header className="flex items-center justify-center mb-8">
        <h1 className="text-3xl font-bold underline">Design Audit</h1>
      </header>
      <section>
        <h1 className="text-xl mb-4">Put in your URL</h1>
        <p className="text-l">Description of what and why and how</p>
        <form onSubmit={handleSubmit}>
          <input
            name="url"
            type="text"
            placeholder="Enter URL"
            onChange={handleInputChange}
          />
          {error && <p>{error}</p>}
          <button type="submit" disabled={loading}>
            {loading ? "Scanning..." : "Scan"}
          </button>
        </form>
      </section>
    </main>
  );
}
