"use client";

import React, { ReactNode } from "react";

interface EditModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode; // Content of the modal (e.g., the form)
}

export function EditModal({
  isOpen,
  onClose,
  title,
  children,
}: EditModalProps) {
  if (!isOpen) return null;

  // Handle clicks outside the modal content to close it
  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  return (
    // Backdrop
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-opacity duration-300 ease-in-out"
      onClick={handleBackdropClick}
    >
      {/* Modal Content */}
      <div
        className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6 transform transition-all duration-300 ease-in-out scale-100"
        onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside content
      >
        {/* Header */}
        <div className="flex justify-between items-center border-b pb-3 mb-4">
          <h3 className="text-xl font-semibold text-gray-900">{title}</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-2xl leading-none focus:outline-none"
            aria-label="Close modal"
          >
            &times; {/* Simple close icon */}
          </button>
        </div>
        {/* Body */}
        <div>{children}</div>
      </div>
    </div>
  );
}
