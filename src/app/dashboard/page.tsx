"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  // Auth
  useEffect(() => {
    if (!sessionStorage.getItem("authKey")) {
      router.replace("/");
    }
  }, [router]);

  if (typeof window !== "undefined" && !sessionStorage.getItem("authKey")) {
    return <div className="text-center p-10">Redirecting...</div>;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-8">Welcome! Select an option below:</p>

      <div className="flex space-x-4">
        <Link href="/businesses">
          <button
            type="button"
            className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline">
            View Businesses
          </button>
        </Link>

        <Link href="/staff">
          <button
            type="button"
            className="bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline">
            View Staff
          </button>
        </Link>
      </div>
    </div>
  );
}
