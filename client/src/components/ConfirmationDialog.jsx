import React from 'react';

const ConfirmationDialog = ({ isOpen, onClose, onConfirm, title, message }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-gray-900 w-full max-w-sm rounded-lg shadow-lg p-6 transform transition-all">
        <h3 className="text-lg font-medium text-white mb-2">{title}</h3>
        <p className="text-gray-300 mb-6">{message}</p>
        
        <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-3">
          <button
            onClick={onConfirm}
            className="w-full sm:w-1/2 bg-emerald-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-600 transition-colors"
          >
            Confirm
          </button>
          <button
            onClick={onClose}
            className="w-full sm:w-1/2 bg-gray-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-gray-700 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationDialog;
