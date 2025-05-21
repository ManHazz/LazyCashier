"use client"; /*  */

import { useRef, useState, useCallback, useEffect } from "react";
import Webcam from "react-webcam";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { app, db } from "../../firebase/firebase-init";

const Camera = ({ onClose }) => {
  const webcamRef = useRef(null);
  const fileInputRef = useRef(null);
  const [imgSrc, setImgSrc] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [detectedText, setDetectedText] = useState(null);
  const [isFirebaseInitialized, setIsFirebaseInitialized] = useState(false);
  const [detectedPrice, setDetectedPrice] = useState(null);
  const [showPriceConfirmation, setShowPriceConfirmation] = useState(false);
  const [confirmedPrice, setConfirmedPrice] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isGalleryMode, setIsGalleryMode] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
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
      img.src = imageSrc;
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
    });
  }, []);

  const blobToBase64 = (blob, callback) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result;
      callback(base64String.split(",")[1]);
    };
    reader.onerror = (error) => {
      console.error("Error reading blob:", error);
      callback(null);
    };
    reader.readAsDataURL(blob);
  };

  const performOCR = useCallback(
    async (imageSrc) => {
      try {
        const compressedImage = await compressImage(imageSrc);

        // Convert base64 to Blob
        const base64Response = await fetch(compressedImage);
        const blob = await base64Response.blob();

        // Create FormData with the blob
        const formData = new FormData();
        formData.append("image", blob, "receipt.jpg");

        console.log("Sending OCR request...");
        const ocrResponse = await fetch("/api/ocr", {
          method: "POST",
          body: formData,
        });

        const result = await ocrResponse.json();

        if (!ocrResponse.ok) {
          console.error("OCR API Error:", result);
          throw new Error(
            result.error || `HTTP error! status: ${ocrResponse.status}`
          );
        }

        if (!result.text) {
          throw new Error("No text detected in the image");
        }

        return result.text;
      } catch (error) {
        console.error("OCR Error:", error);
        throw new Error(`OCR processing failed: ${error.message}`);
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

      const receiptData = {
        imageData: compressedImage,
        price: confirmedPrice,
        timestamp: serverTimestamp(),
        ocrText: detectedText,
        imageUrl: `data:image/jpeg;base64,${compressedImage.split(",")[1]}`,
      };

      delete receiptData.originalImageData;
      delete receiptData.originalImageUrl;

      const docRef = await addDoc(collection(db, "receipts"), receiptData);
      console.log("Document saved with ID:", docRef.id);

      // Show success message
      setShowSuccess(true);

      // Close modal after 2 seconds
      setTimeout(() => {
        onClose();
      }, 2000);
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

  const handleGallerySelect = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Image size should be less than 10MB");
      return;
    }

    setIsProcessing(true);
    setError(null);
    setDetectedText(null);
    setDetectedPrice(null);
    setConfirmedPrice(null);

    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const imageSrc = e.target.result;
        setImgSrc(imageSrc);

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
      };

      reader.onerror = () => {
        setError("Error reading the image file");
        setIsProcessing(false);
      };

      reader.readAsDataURL(file);
    } catch (err) {
      console.error("File reading error:", err);
      setError("Error reading the image file");
      setIsProcessing(false);
    }
  };

  const toggleMode = () => {
    setIsGalleryMode(!isGalleryMode);
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
              {isGalleryMode ? "Select Receipt Photo" : "Take Receipt Photo"}
            </h2>
            <p className="text-sm text-gray-500 mt-1">
              {!imgSrc
                ? isGalleryMode
                  ? "Choose a receipt image from your gallery"
                  : "Position the receipt within the frame"
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
              {!isGalleryMode ? (
                <>
                  <Webcam
                    ref={webcamRef}
                    screenshotFormat="image/jpeg"
                    className="w-full h-full object-cover"
                    videoConstraints={{
                      facingMode: "environment",
                    }}
                  />
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
                <div className="w-full h-full flex flex-col items-center justify-center p-6">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleGallerySelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="flex flex-col items-center gap-4 p-6 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 transition-colors"
                  >
                    <svg
                      className="w-12 h-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-gray-600 font-medium">
                      Click to select image
                    </span>
                    <span className="text-sm text-gray-500">
                      Supports JPG, PNG up to 10MB
                    </span>
                  </button>
                </div>
              )}
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
              <>
                <button
                  onClick={toggleMode}
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
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                  {isGalleryMode ? "Switch to Camera" : "Choose from Gallery"}
                </button>
                {!isGalleryMode && (
                  <button
                    onClick={capture}
                    disabled={isProcessing || !isFirebaseInitialized}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {isProcessing ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5"
                          viewBox="0 0 24 24"
                        >
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
                )}
              </>
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

        {showSuccess && (
          <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-6 max-w-sm w-full mx-4 shadow-2xl text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                Receipt Saved!
              </h3>
              <p className="text-gray-600">
                Your receipt has been successfully saved.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Camera;
