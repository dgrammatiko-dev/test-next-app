"use client";

import React, { useState, useEffect } from "react";
import { Inter } from "next/font/google";
import "./globals.css";
import Providers from "@/components/Providers";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";

const inter = Inter({ subsets: ["latin"] });

// export const metadata: Metadata = {
//   title: "Client App",
//   description: "Evaluation App with Tanstack Table",
// };

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  // Check auth status
  useEffect(() => {
    const authKey = sessionStorage.getItem("authKey");
    setIsAuthenticated(!!authKey);
  }, [pathname]);

  const handleLogout = () => {
    sessionStorage.removeItem("authKey");
    setIsAuthenticated(false);
    router.push("/");
  };

  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <nav className="bg-gray-800 text-white p-4 mb-6">
            <div className="container mx-auto flex justify-between items-center">
              <Link
                href={isAuthenticated ? "/dashboard" : "/"}
                className="text-xl font-bold hover:text-gray-300"
              >
                {isAuthenticated ? "Dashboard" : "Login"}
              </Link>
              <div>
                {isAuthenticated ? (
                  <>
                    <Link
                      href="/businesses"
                      className="mr-4 hover:text-gray-300"
                    >
                      Businesses
                    </Link>
                    <Link href="/staff" className="mr-4 hover:text-gray-300">
                      Staff
                    </Link>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="bg-red-500 hover:bg-red-700 text-white font-bold py-1 px-3 rounded text-sm"
                    >
                      Logout
                    </button>
                  </>
                ) : (
                  <span className="text-sm text-gray-400">Please log in</span>
                )}
              </div>
            </div>
          </nav>
          <main className="container mx-auto px-4">{children}</main>
        </Providers>
      </body>
    </html>
  );
}
