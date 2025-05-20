"use client";

import { useState, useEffect } from "react";
import {
  collection,
  query,
  orderBy,
  onSnapshot,
  addDoc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "../../firebase/firebase-init";
import Link from "next/link";
import ErrorBoundary from "../components/ErrorBoundary";

export default function AnalyticsPage() {
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [totalTransactions, setTotalTransactions] = useState(0);
  const [totalExpenses, setTotalExpenses] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [recentReceipts, setRecentReceipts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newExpense, setNewExpense] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    setError(null);

    // Use real-time listeners for receipts
    const receiptsUnsubscribe = onSnapshot(
      query(collection(db, "receipts"), orderBy("timestamp", "desc")),
      (snapshot) => {
        let revenue = 0;
        const receipts = [];

        snapshot.forEach((doc) => {
          const data = doc.data();
          revenue += data.price || 0;
          receipts.push({
            id: doc.id,
            ...data,
          });
        });

        setTotalRevenue(revenue);
        setTotalTransactions(receipts.length);
        setRecentReceipts(receipts.slice(0, 2));
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching receipts:", err);
        setError("Failed to load receipts data");
        setLoading(false);
      }
    );

    // Use real-time listener for expenses
    const expensesUnsubscribe = onSnapshot(
      query(collection(db, "expenses"), orderBy("timestamp", "desc")),
      (snapshot) => {
        let expenses = 0;
        snapshot.forEach((doc) => {
          const data = doc.data();
          expenses += data.amount || 0;
        });

        setTotalExpenses(expenses);
        setTotalProfit(totalRevenue - expenses);
      },
      (err) => {
        console.error("Error fetching expenses:", err);
        setError("Failed to load expenses data");
      }
    );

    // Cleanup listeners on unmount
    return () => {
      receiptsUnsubscribe();
      expensesUnsubscribe();
    };
  }, [totalRevenue]); // Only depend on totalRevenue for profit calculation

  const handleExpenseSubmit = async (e) => {
    e.preventDefault();

    if (!newExpense || isNaN(newExpense) || parseFloat(newExpense) <= 0) {
      setError("Please enter a valid expense amount");
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);

      const expenseAmount = parseFloat(newExpense);

      // Add new expense record
      await addDoc(collection(db, "expenses"), {
        amount: expenseAmount,
        timestamp: serverTimestamp(),
        type: "total",
      });

      setNewExpense("");
    } catch (err) {
      console.error("Error adding expense:", err);
      setError("Failed to update expenses");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-pink-100 p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-center items-center h-[60vh]">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-orange-500 border-t-transparent"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-pink-100 p-8">
        <div className="max-w-4xl mx-auto">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 mb-6">
              <div className="flex items-center">
                <svg
                  className="h-5 w-5 text-red-500 mr-2"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
                <span className="text-red-700">{error}</span>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center mb-10">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Analytics
              </h1>
              <p className="text-gray-600">Track your business performance</p>
            </div>
            <Link
              href="/"
              className="p-2 bg-white text-gray-700 rounded-lg shadow-sm hover:bg-gray-50 transition-colors"
              title="Back to Home"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                />
              </svg>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
            <div className="bg-white rounded-lg shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Revenue
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                RM {totalRevenue.toFixed(2)}
              </p>
              <div className="absolute top-1/2 -translate-y-1/2 right-6">
                <div className="w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Expenses
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                RM {totalExpenses.toFixed(2)}
              </p>
              <div className="absolute top-1/2 -translate-y-1/2 right-6">
                <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-red-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 14l-7 7m0 0l-7-7m7 7V3"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Profit
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                RM {totalProfit.toFixed(2)}
              </p>
              <div className="absolute top-1/2 -translate-y-1/2 right-6">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-green-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6 relative">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Total Transactions
                </h3>
              </div>
              <p className="text-3xl font-bold text-gray-900">
                {totalTransactions}
              </p>
              <div className="absolute top-1/2 -translate-y-1/2 right-6">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-10 h-10 text-blue-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
                    />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6 mb-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Update Total Expenses
            </h3>
            <form onSubmit={handleExpenseSubmit} className="flex gap-4">
              <div className="flex-1">
                <input
                  type="number"
                  value={newExpense}
                  onChange={(e) => setNewExpense(e.target.value)}
                  placeholder="Enter total expenses"
                  step="0.01"
                  min="0"
                  className="w-full px-4 py-2 text-gray-500 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-6 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? "Updating..." : "Update Expenses"}
              </button>
            </form>
          </div>

          <div className="bg-white rounded-lg shadow-sm p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Recent Receipts
              </h3>
              <Link
                href="/receipts"
                className="text-orange-600 hover:text-orange-700 font-medium"
              >
                View All →
              </Link>
            </div>
            <div className="space-y-4">
              {recentReceipts.map((receipt) => (
                <div
                  key={receipt.id}
                  className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                >
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden">
                    <img
                      src={receipt.imageUrl}
                      alt="Receipt"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-gray-500">
                      {receipt.timestamp?.toDate().toLocaleString()}
                    </p>
                    <p className="font-medium text-gray-900">
                      RM {receipt.price?.toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
}
