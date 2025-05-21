"use client"; /*  */

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from "../../firebase/firebase-init";
import Image from "next/image";

const Camera = ({ onClose }) => {
  const webcamRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [detectedText, setDetectedText] = useState(null);
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  const [detectedPrice, setDetectedPrice] = useState(null);
  const [showPriceConfirmation, setShowPriceConfirmation] = useState(false);
  const [confirmedPrice, setConfirmedPrice] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    // Check if Firebase is properly initialized
    if (!app || !db) {
      setError(
        "Firebase is not properly initialized. Please check your configuration."
      );
      setIsFirebaseInitialized(false);
    } else {
      setIsFirebaseInitialized(true);
    }
  }, []);

  const downloadImage = (imageSrc) => {
    const link = document.createElement("a");
    link.href = imageSrc;
    link.download = `receipt-${Date.now()}.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const compressImage = useCallback(async (imageSrc) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.7));
      };
      img.onerror = () => {
        console.error("Error loading image for compression");
        resolve(imageSrc); // Fallback to original image if compression fails
      };
      img.src = imageSrc;
    });
  }, []);

  const blobToBase64 = (blob) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = reader.result;
        // Remove the data URL prefix (e.g., "data:image/jpeg;base64,")
        const base64 = base64String.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  };

  const performOCR = useCallback(
    async (imageSrc) => {
      try {
        const compressedImage = await compressImage(imageSrc);
        const imageResponse = await fetch(compressedImage);
        const blob = await imageResponse.blob();

        const formData = new FormData();
        formData.append("apikey", "K89690044888957");
        formData.append("language", "eng");
        formData.append("isOverlayRequired", "false");
        formData.append("base64Image", await blobToBase64(blob));
        formData.append("detectOrientation", "true");
        formData.append("scale", "true");
        formData.append("OCREngine", "2");
        formData.append("filetype", "jpg");

        const response = await fetch("https://api.ocr.space/parse/image", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result = await response.json();

        if (result.IsErroredOnProcessing) {
          throw new Error(result.ErrorMessage || "OCR processing failed");
        }

        if (!result.ParsedResults || result.ParsedResults.length === 0) {
          throw new Error("No text detected in the image");
        }

        return result.ParsedResults[0].ParsedText;
      } catch (error) {
        console.error("OCR Error:", error);
        throw error;
      }
    },
    [compressImage]
  );

  const handlePriceConfirmation = async () => {
    if (!confirmedPrice || isNaN(confirmedPrice) || confirmedPrice <= 0) {
      setError("Please enter a valid price");
      return;
    }

    setIsProcessing(true);
    setError(null);

    try {
      setIsUploading(true);
      const compressedImage = await compressImage(imgSrc);

      // Optimize the data being sent to Firestore
      const receiptData = {
        imageData: compressedImage,
        price: confirmedPrice,
        timestamp: serverTimestamp(),
        ocrText: detectedText,
        imageUrl: `data:image/jpeg;base64,${compressedImage.split(",")[1]}`,
      };

      // Remove original image data to reduce payload size
      delete receiptData.originalImageData;
      delete receiptData.originalImageUrl;

      const docRef = await addDoc(collection(db, "receipts"), receiptData);
      console.log("Document saved with ID:", docRef.id);

      onClose();
    } catch (firebaseError) {
      console.error("Firebase Error:", firebaseError);
      setError(`Error saving to database: ${firebaseError.message}`);
    } finally {
      setIsProcessing(false);
      setIsUploading(false);
    }
  };

  const capture = useCallback(async () => {
    if (!isFirebaseInitialized) {
      setError(
        "Firebase is not properly initialized. Please check your configuration."
      );
      return;
    }

    if (webcamRef.current) {
      const imageSrc = webcamRef.current.getScreenshot();
      setImgSrc(imageSrc);
      setIsProcessing(true);
      setError(null);
      setDetectedText(null);
      setDetectedPrice(null);
      setConfirmedPrice(null);

      try {
        const text = await performOCR(imageSrc);
        setDetectedText(text);

        const pricePatterns = [
          /RM\s*(\d+\.?\d*)/i,
          /(\d+\.?\d*)\s*RM/i,
          /Total\s*:?\s*RM\s*(\d+\.?\d*)/i,
          /Total\s*:?\s*(\d+\.?\d*)/i,
          /(\d+\.?\d*)/,
        ];

        let price = null;
        for (const pattern of pricePatterns) {
          const match = text.match(pattern);
          if (match) {
            price = parseFloat(match[1]);
            break;
          }
        }

        if (!price) {
          setError(
            "Could not detect price in the receipt. Please try again with a clearer image."
          );
          setIsProcessing(false);
          return;
        }

        setDetectedPrice(price);
        setConfirmedPrice(price);
        setShowPriceConfirmation(true);
      } catch (err) {
        console.error("OCR Error:", err);
        setError("Error processing image: " + err.message);
      } finally {
        setIsProcessing(false);
      }
    }
  }, [webcamRef, onClose, isFirebaseInitialized, performOCR]);

  const retake = () => {
    setImgSrc(null);
    setError(null);
    setDetectedText(null);
    setDetectedPrice(null);
    setConfirmedPrice(null);
    setShowPriceConfirmation(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4 shadow-2xl">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              Take Receipt Photo
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {!imgSrc
                ? "Position the receipt within the frame"
                : "Review your capture"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors p-2 rounded-full hover:bg-gray-100"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6">
            <div className="flex items-center">
              <svg
                className="h-5 w-5 mr-3 text-red-500"
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
              <span className="font-medium">{error}</span>
            </div>
          </div>
        )}

        <div className="relative aspect-[4/3] mb-6 bg-gray-100 rounded-lg overflow-hidden">
          {!imgSrc ? (
            <>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                className="w-full h-full object-cover"
                videoConstraints={{
                  facingMode: "environment",
                }}
              />
              {/* Camera Frame Guide */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute inset-4 border-2 border-white border-dashed rounded-lg opacity-75"></div>
                <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                  Align receipt within frame
                </div>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black bg-opacity-50 text-white px-4 py-2 rounded-full text-sm">
                  Make sure price is visible
                </div>
              </div>
            </>
          ) : (
            <img
              src={imgSrc}
              alt="Captured receipt"
              className="w-full h-full object-contain"
            />
          )}
          {isProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-75 flex items-center justify-center">
              <div className="text-center">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-white border-t-transparent mx-auto mb-4"></div>
                <p className="text-white font-medium text-lg">
                  Processing image...
                </p>
                <p className="text-white text-sm mt-2 opacity-75">
                  This may take a few seconds
                </p>
              </div>
            </div>
          )}
        </div>

        {detectedText && !showPriceConfirmation && (
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <p className="text-sm font-medium text-gray-700 mb-2">
              Detected Text:
            </p>
            <p className="text-sm font-mono bg-white p-3 rounded border border-gray-200 overflow-auto max-h-32">
              {detectedText}
            </p>
          </div>
        )}

        {showPriceConfirmation && (
          <div className="bg-blue-50 p-4 rounded-lg mb-6">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">
              Confirm Price
            </h3>
            <div className="flex items-center gap-4 mb-4">
              <div className="flex-1">
                <label
                  htmlFor="price"
                  className="block text-sm font-medium text-blue-900 mb-1"
                >
                  Reconfirm Price (RM)
                </label>
                <input
                  type="number"
                  id="price"
                  value={confirmedPrice}
                  onChange={(e) =>
                    setConfirmedPrice(parseFloat(e.target.value))
                  }
                  step="0.01"
                  min="0"
                  className="w-full text-gray-700 px-3 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter price"
                />
              </div>
              <div className="text-sm text-blue-700">
                <p>Detected Price:</p>
                <p className="font-semibold">RM {detectedPrice?.toFixed(2)}</p>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <button
                onClick={retake}
                className="px-4 py-2 text-blue-700 hover:text-blue-800 font-medium"
              >
                Retake
              </button>
              <button
                onClick={handlePriceConfirmation}
                disabled={isProcessing}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? "Saving..." : "Confirm & Save"}
              </button>
            </div>
          </div>
        )}

        {!showPriceConfirmation && (
          <div className="flex justify-center gap-4">
            {!imgSrc ? (
              <button
                onClick={capture}
                disabled={isProcessing || !isFirebaseInitialized}
                className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isProcessing ? (
                  <>
                    <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                        fill="none"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-5 h-5"
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
                    Take Photo
                  </>
                )}
              </button>
            ) : (
              <button
                onClick={retake}
                className="flex items-center gap-2 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors font-medium"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                  />
                </svg>
                Retake
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;
