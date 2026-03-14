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

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setValues({
      ...values,
      [name]: value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const response = await fetch("/api/audit", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(values),
    });
    const data = await response.json();
    router.push(`/results/${data.id}`);

    setLoading(false);
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
          <button type="submit">Submit</button>
        </form>
      </section>
    </main>
  );
}
