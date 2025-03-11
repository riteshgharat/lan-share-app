import React from "react";

function Previewer({ imageUrl, onClose }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50">
      <div
        className="absolute inset-0 bg-black opacity-50"
        onClick={onClose}
      ></div>

      <div className="relative z-10 max-w-4xl max-h-[90vh] overflow-hidden">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 bg-white bg-opacity-80 hover:bg-opacity-100 rounded-full p-2 text-black transition-all duration-200 cursor-pointer"
          aria-label="Close preview"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
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

        <img
          src={imageUrl}
          alt="Preview"
          className="rounded-lg shadow-lg max-w-full max-h-[85vh] object-contain"
        />
      </div>
    </div>
  );
}

export default Previewer;
