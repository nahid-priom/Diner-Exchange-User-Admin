'use client';

import { useRef, useState } from 'react';
import { toast } from 'react-hot-toast';
import { XMarkIcon, ArrowUpTrayIcon, DocumentIcon, PhotoIcon } from '@heroicons/react/24/outline';
import { motion, AnimatePresence } from 'framer-motion';

export default function UploadModal({ order, type, onClose }) {
  const [file, setFile] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!file) {
      toast.error('Please select a file to upload');
      return;
    }

    setIsLoading(true);

    try {
      // 1. Upload the file to blob storage
      const formData = new FormData();
      formData.append('file', file);

      const uploadRes = await fetch('/user/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!uploadRes.ok) throw new Error('Upload failed');
      const { url: uploadedUrl } = await uploadRes.json();

      // 2. PATCH the order with the new file URL
      const patchRes = await fetch(`/user/api/orders/${order._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          [type === 'id' ? 'idFileUrl' : 'paymentReceiptUrl']: uploadedUrl,
        }),
      });

      if (!patchRes.ok) throw new Error('Failed to update order');

      toast.success(
        `${type === 'id' ? 'ID verification' : 'Payment receipt'} uploaded successfully!`,
        {
          style: { background: '#FF7B25', color: '#fff' },
          iconTheme: { primary: '#fff', secondary: '#FF7B25' },
        }
      );

      onClose(true); // Let parent refresh orders
    } catch (error) {
      toast.error('Upload failed. Please try again.');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const handleCancel = () => {
    if (!isLoading) {
      onClose();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          transition={{ duration: 0.2 }}
          className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Modal Header */}
          <div className="flex justify-between items-center border-b border-gray-100 p-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Upload {type === 'id' ? 'ID Verification' : 'Payment Receipt'}
              </h3>
              <p className="text-sm text-gray-500 mt-1">Order #{order._id || order.id}</p>
            </div>
            <button
              onClick={handleCancel}
              className="text-gray-400 hover:text-gray-500 transition-colors"
              disabled={isLoading}
            >
              <XMarkIcon className="h-6 w-6" />
            </button>
          </div>

          {/* Upload Form */}
          <form onSubmit={handleSubmit} className="p-5">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {type === 'id' ? 'ID Document' : 'Payment Proof'}
              </label>

              <div
                className={`border-2 border-dashed rounded-lg p-6 text-center transition-all ${isDragging ? 'border-orange bg-orange-50' : 'border-gray-300 hover:border-gray-400'}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={triggerFileInput}
              >
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleFileChange}
                  className="hidden"
                  ref={fileInputRef}
                  required
                />
                {file ? (
                  <div className="flex flex-col items-center">
                    {type === 'id' ? (
                      <PhotoIcon className="h-12 w-12 text-orange mb-3" />
                    ) : (
                      <DocumentIcon className="h-12 w-12 text-orange mb-3" />
                    )}
                    <p className="font-medium text-gray-900 truncate max-w-xs">{file.name}</p>
                    <p className="text-xs text-gray-500 mt-1">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFile(null);
                      }}
                      className="text-orange hover:text-orange-dark text-sm mt-3"
                    >
                      Change file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="mx-auto bg-gray-100 rounded-full p-3 w-14 h-14 flex items-center justify-center">
                      <ArrowUpTrayIcon className="h-6 w-6 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Drag and drop file here
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        or click to browse files
                      </p>
                      <p className="text-xs text-gray-400 mt-2">
                        JPG, PNG, or PDF (Max. 5MB)
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={handleCancel}
                className="px-4 py-2.5 text-sm font-medium text-gray-700 hover:text-gray-900 rounded-lg hover:bg-gray-50 transition-colors"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading || !file}
                className={`px-4 py-2.5 text-sm font-medium text-white rounded-lg transition-colors ${isLoading || !file ? 'bg-orange-300 cursor-not-allowed' : 'bg-orange hover:bg-orange-dark'}`}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Uploading...
                  </span>
                ) : 'Confirm Upload'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
