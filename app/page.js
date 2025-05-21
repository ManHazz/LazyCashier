"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Camera from "./components/Camera";

export default function Home() {
  const [showCamera, setShowCamera] = useState(false);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-100 via-red-50 to-pink-100">
      <main className="flex flex-col items-center justify-center w-full max-w-sm px-4 py-8">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center space-x-4">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-orange-500 to-red-500 text-transparent bg-clip-text">
              NARUTO
            </h1>
            <span className="text-4xl font-bold text-red-500">×</span>
            <h1 className="text-5xl font-bold bg-gradient-to-r from-red-500 to-pink-500 text-transparent bg-clip-text">
              POPIA
            </h1>
          </div>
          <p className="text-gray-600 italic mt-2">enak banget</p>
        </div>

        <div className="flex flex-col items-center space-y-6 w-full">
          <button
            onClick={() => setShowCamera(true)}
            className="w-64 transform transition-all duration-200 hover:scale-105 flex items-center justify-center px-6 py-4 border border-transparent text-base font-medium rounded-xl text-white bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 shadow-lg"
          >
            <Image
              src="/camera.svg"
              alt="Camera icon"
              width={24}
              height={24}
              className="mr-2"
            />
            Take Picture of Receipt
          </button>

          <Link href="/analytics" className="w-64">
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

        <button
          onClick={() => setShowCamera(true)}
          className="fixed bottom-6 right-6 bg-white p-4 rounded-full shadow-lg hover:bg-gray-100 transition-colors"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>

        {showCamera && <Camera onClose={() => setShowCamera(false)} />}
      </main>
    </div>
  );
}
