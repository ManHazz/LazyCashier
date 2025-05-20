"use client";

import { Component } from "react";

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-orange-100 via-red-50 to-pink-100 p-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-red-50 border-l-4 border-red-500 p-4">
              <h2 className="text-lg font-semibold text-red-700">
                Something went wrong
              </h2>
              <button
                onClick={() => this.setState({ hasError: false })}
                className="mt-2 text-red-600 hover:text-red-800"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
