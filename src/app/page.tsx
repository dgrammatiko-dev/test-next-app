"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";

// FooBar Auth
interface AdminCredentials {
  email: string;
  password?: string;
}

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors
    setIsLoading(true);

    try {
      // FooBar Auth
      const res = await fetch("http://localhost:4444/admin");

      if (!res.ok) {
        throw new Error(`Server error: ${res.statusText}`);
      }

      const expectedCredentials: AdminCredentials = await res.json();

      // Compare entered credentials with the ones fetched from the mock server THIS IS NOT PRODUCTION READY!!!
      if (
        email === expectedCredentials.email &&
        password === expectedCredentials.password
      ) {
        // Store a unique key (e.g., JWT) in sessionStorage
        sessionStorage.setItem("authKey", expectedCredentials.email);
        // Redirect to dashboard
        router.push("/dashboard");
      } else {
        console.log("Invalid credentials");
        setError("Invalid email or password.");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err instanceof Error
          ? err.message
          : "An unexpected error occurred during login."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)]">
      <h1 className="text-3xl font-bold mb-8">Login</h1>
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-xs bg-white shadow-md rounded px-8 pt-6 pb-8 mb-4"
      >
        {error && <p className="text-red-500 text-xs italic mb-4">{error}</p>}
        <div className="mb-4">
          <label
            className="block text-gray-900 text-sm font-bold mb-2"
            htmlFor="email"
          >
            Email
          </label>
          <input
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
            id="email"
            type="email"
            placeholder="admin@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="mb-6">
          <label
            className="block text-gray-900 text-sm font-bold mb-2"
            htmlFor="password"
          >
            Password
          </label>
          <input
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 mb-3 leading-tight focus:outline-none focus:shadow-outline ${
              error ? "border-red-500" : ""
            }`}
            id="password"
            type="password"
            placeholder="******************"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={isLoading}
          />
        </div>
        <div className="flex items-center justify-between">
          <button
            className={`bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline ${
              isLoading ? "opacity-50 cursor-not-allowed" : ""
            }`}
            type="submit"
            disabled={isLoading}
          >
            {isLoading ? "Signing In..." : "Sign In"}
          </button>
        </div>
      </form>
      <p className="text-center text-gray-500 text-xs">
        &copy;2025 demo inc. All rights reserved.
      </p>
    </div>
  );
}
