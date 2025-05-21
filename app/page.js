"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import Camera from "./components/Camera";

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [showCamera, setShowCamera] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="fixed inset-0 overflow-hidden">
      <div className="absolute inset-0">
        <Image
          src="/narutoxpopia.jpeg"
          alt="Background"
          fill
          priority
          className="object-cover"
          quality={100}
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-orange-100/50 via-red-50/50 to-pink-100/50" />
      <main className="relative h-full flex items-center justify-center">
        <div className="w-full max-w-sm px-4 sm:px-6 md:px-8">
          <div className="flex flex-col items-center justify-center w-full gap-6">
            <button
              onClick={() => setShowCamera(true)}
              className="w-full p-4 text-center text-white transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 rounded-xl shadow-lg flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Image
                src="/camera.svg"
                alt="Camera icon"
                width={28}
                height={28}
                className="flex-shrink-0"
              />
              Take Picture of Receipt
            </button>

            <Link
              href="/analytics"
              className="w-full p-4 text-center text-white transition-all duration-300 transform hover:scale-105 bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 rounded-xl shadow-lg flex items-center justify-center gap-3 text-lg font-medium"
            >
              <Image
                src="/chart.svg"
                alt="Analytics icon"
                width={28}
                height={28}
                className="flex-shrink-0"
              />
              See Analytics
            </Link>
          </div>
        </div>

        {showCamera && <Camera onClose={() => setShowCamera(false)} />}
      </main>
    </div>
  );
}
