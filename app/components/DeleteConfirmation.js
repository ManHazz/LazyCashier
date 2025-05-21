"use client";

import Image from "next/image";

const DeleteConfirmation = ({ isOpen, onClose, onConfirm, receipt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-75">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">
          Delete Receipt
        </h2>

        {receipt?.imageUrl && (
          <div className="relative aspect-[4/3] w-full mb-4 rounded-lg overflow-hidden">
            <Image
              src={receipt.imageUrl}
              alt="Receipt to delete"
              fill
              className="object-contain"
            />
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this receipt? This action cannot be
          undone.
        </p>

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:text-gray-800 font-medium"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
