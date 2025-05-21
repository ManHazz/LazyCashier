const DeleteConfirmation = ({ isOpen, onClose, onConfirm, receipt }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-15 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm w-full mx-4">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Delete Receipt
        </h3>

        {receipt && (
          <div className="mb-6">
            <div className="aspect-[3/4] w-full bg-gray-100 rounded-lg overflow-hidden mb-4">
              <img
                src={receipt.imageUrl}
                alt="Receipt to delete"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="text-sm text-gray-600">
              <p>Date: {receipt.timestamp?.toDate().toLocaleString()}</p>
              <p>Amount: RM {receipt.price?.toFixed(2)}</p>
            </div>
          </div>
        )}

        <p className="text-gray-600 mb-6">
          Are you sure you want to delete this receipt?
        </p>
        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-600 hover:text-gray-800"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-red-600 hover:text-gray-800"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmation;
