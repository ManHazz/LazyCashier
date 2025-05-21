"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Camera from "./components/Camera";

export default function Home() {
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-pink-100">
      <div className="fixed inset-0 z-0">
        <Image
          src="/narutoxpopia.jpeg"
          alt="Background"
          fill
          priority
          className="object-cover"
          quality={100}
        />
      </div>
      <main className="relative z-10 min-h-screen flex items-center justify-center">
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

            <Link href="/analytics" className="w-full">
              <button className="w-full transform transition-all duration-200 hover:scale-105 flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-pink-500 shadow-lg">
                <Image
                  src="/chart.svg"
                  alt="Analytics icon"
                  width={24}
                  height={24}
                  className="mr-2"
                />
                See Analytics
              </button>
            </Link>
          </div>

          <div className="mt-12 text-center text-gray-500 text-sm">
            <p>Road To Japan !</p>
          </div>
        </div>

        {showCamera && <Camera onClose={() => setShowCamera(false)} />}
      </main>
    </div>
  );
}
