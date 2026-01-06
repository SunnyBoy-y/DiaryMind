import React, { useState } from 'react';
import { Upload, FileText, Check, AlertCircle, Loader2 } from 'lucide-react';

const DocumentUploader = () => {
  const [file, setFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [status, setStatus] = useState(null); // 'success', 'error'
  const [message, setMessage] = useState('');

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setStatus(null);
      setMessage('');
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setStatus(null);
    setMessage('');

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/rag/ingest', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        setStatus('success');
        setMessage('文档已成功上传并开始处理。');
        setFile(null);
        // Reset file input if needed
        document.getElementById('doc-upload-input').value = '';
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || '上传失败');
      }
    } catch (error) {
      console.error('Upload error:', error);
      setStatus('error');
      setMessage(error.message || '上传过程中发生错误。');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="bg-white border-2 border-black p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] rounded-lg transition-all hover:translate-y-[-2px] hover:shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
      <h3 className="font-bold font-handwriting text-lg mb-3 flex items-center gap-2">
        <Upload size={20} />
        记忆库扩充
      </h3>
      
      <div className="flex flex-col gap-3">
        <div className="relative">
          <input
            id="doc-upload-input"
            type="file"
            accept=".pdf,.doc,.docx,.txt,.md"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
          <label
            htmlFor="doc-upload-input"
            className={`flex items-center justify-center gap-2 w-full p-4 border-2 border-dashed border-gray-400 rounded cursor-pointer hover:border-black hover:bg-gray-50 transition-all font-handwriting ${
              uploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {file ? (
              <span className="font-bold text-black truncate">{file.name}</span>
            ) : (
              <span className="text-gray-500">点击选择 PDF/Doc 文档</span>
            )}
          </label>
        </div>

        {file && !uploading && !status && (
          <button
            onClick={handleUpload}
            className="bg-black text-white font-bold font-handwriting py-2 px-4 rounded border-2 border-black hover:bg-gray-800 transition-all shadow-[2px_2px_0px_0px_rgba(0,0,0,0.5)] active:translate-x-[1px] active:translate-y-[1px] active:shadow-none"
          >
            开始上传
          </button>
        )}

        {uploading && (
          <div className="flex items-center justify-center gap-2 text-black font-bold py-2">
            <Loader2 className="animate-spin" size={20} />
            正在处理...
          </div>
        )}

        {status === 'success' && (
          <div className="flex items-center gap-2 text-green-600 bg-green-50 p-2 rounded border border-green-200">
            <Check size={18} />
            <span className="text-sm font-bold">{message}</span>
          </div>
        )}

        {status === 'error' && (
          <div className="flex items-center gap-2 text-red-600 bg-red-50 p-2 rounded border border-red-200">
            <AlertCircle size={18} />
            <span className="text-sm font-bold">{message}</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUploader;
