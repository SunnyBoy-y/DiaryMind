import React, { useState } from 'react';
import { Download, Share2, Printer, FileText, Copy, CheckCircle, AlertCircle } from 'lucide-react';

export default function DiaryExportShare({ diaries, selectedDiary, onBack }) {
  const [exportFormat, setExportFormat] = useState('markdown');
  const [shareLink, setShareLink] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');

  // 生成分享链接
  const generateShareLink = () => {
    const baseUrl = window.location.origin;
    const linkId = Math.random().toString(36).substring(7);
    const link = `${baseUrl}/diary/share/${linkId}`;
    setShareLink(link);
    setSuccessMessage('分享链接已生成');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // 复制到剪贴板
  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // 导出为Markdown
  const exportAsMarkdown = () => {
    const content = selectedDiary.content || '日记内容';
    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDiary.filename}.md`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('Markdown 文件已下载');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // 导出为HTML
  const exportAsHTML = () => {
    let htmlContent = selectedDiary.content || '日记内容';
    // 简单的Markdown到HTML转换
    htmlContent = htmlContent
      .replace(/^# (.*)/gm, '<h1>$1</h1>')
      .replace(/^## (.*)/gm, '<h2>$1</h2>')
      .replace(/^### (.*)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br>');

    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${selectedDiary.filename}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto; line-height: 1.6; margin: 40px; color: #333; }
    h1, h2, h3 { margin-top: 20px; margin-bottom: 10px; }
    pre { background: #f5f5f5; padding: 10px; border-radius: 5px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${selectedDiary.filename}</h1>
  <div>${htmlContent}</div>
</body>
</html>
    `;

    const blob = new Blob([html], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDiary.filename}.html`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('HTML 文件已下载');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // 导出为纯文本
  const exportAsText = () => {
    const content = selectedDiary.content || '日记内容';
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedDiary.filename}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    setSuccessMessage('文本文件已下载');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // 打印
  const handlePrint = () => {
    const printWindow = window.open('', '', 'height=400,width=600');
    const htmlContent = selectedDiary.content || '日记内容';
    printWindow.document.write(`
      <html>
      <head>
        <title>${selectedDiary.filename}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 20px; }
          h1 { margin-bottom: 10px; border-bottom: 2px solid #000; padding-bottom: 10px; }
        </style>
      </head>
      <body>
        <h1>${selectedDiary.filename}</h1>
        <pre>${htmlContent}</pre>
      </body>
      </html>
    `);
    printWindow.document.close();
    setTimeout(() => printWindow.print(), 250);
    setSuccessMessage('打印窗口已打开');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  // 导出所有日记为ZIP
  const exportAllAsZip = () => {
    setSuccessMessage('功能开发中，敬请期待！');
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 3000);
  };

  return (
    <div className="flex flex-col gap-6 h-full">
      {/* 头部 */}
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold">📤 导出与分享</h1>
        {onBack && (
          <button
            onClick={onBack}
            className="px-4 py-2 border-2 border-black bg-white hover:bg-gray-100 font-bold"
          >
            返回
          </button>
        )}
      </div>

      {/* 成功提示 */}
      {showSuccess && (
        <div className="p-4 bg-green-100 border-2 border-green-500 rounded-lg flex items-center gap-2 animate-bounce">
          <CheckCircle size={20} className="text-green-600" />
          <p className="font-bold text-green-700">{successMessage}</p>
        </div>
      )}

      <div className="flex-1 overflow-y-auto space-y-6">
        {/* 单篇导出 */}
        <div className="border-2 border-black bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Download size={24} /> 导出当前日记
          </h2>
          
          {selectedDiary ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg">
                <p className="font-bold">📄 {selectedDiary.filename}</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <button
                  onClick={exportAsMarkdown}
                  className="p-4 border-2 border-black bg-white hover:bg-gray-100 rounded-lg font-bold transition text-center"
                  title="导出为 Markdown 格式"
                >
                  <FileText size={24} className="mx-auto mb-2" />
                  <span>Markdown</span>
                </button>

                <button
                  onClick={exportAsHTML}
                  className="p-4 border-2 border-black bg-white hover:bg-gray-100 rounded-lg font-bold transition text-center"
                  title="导出为 HTML 格式"
                >
                  <FileText size={24} className="mx-auto mb-2" />
                  <span>HTML</span>
                </button>

                <button
                  onClick={exportAsText}
                  className="p-4 border-2 border-black bg-white hover:bg-gray-100 rounded-lg font-bold transition text-center"
                  title="导出为纯文本"
                >
                  <FileText size={24} className="mx-auto mb-2" />
                  <span>纯文本</span>
                </button>

                <button
                  onClick={handlePrint}
                  className="p-4 border-2 border-black bg-white hover:bg-gray-100 rounded-lg font-bold transition text-center"
                  title="打印日记"
                >
                  <Printer size={24} className="mx-auto mb-2" />
                  <span>打印</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg text-center">
              <p className="text-gray-600 font-bold">请先选择一篇日记</p>
            </div>
          )}
        </div>

        {/* 分享功能 */}
        <div className="border-2 border-black bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Share2 size={24} /> 生成分享链接
          </h2>

          {selectedDiary ? (
            <div className="space-y-4">
              <p className="text-sm text-gray-600 font-bold">
                生成一个可分享的链接，让朋友查看这篇日记（需要接收方有账号）
              </p>

              {!shareLink ? (
                <button
                  onClick={generateShareLink}
                  className="w-full px-6 py-3 border-2 border-black bg-yellow-200 hover:bg-yellow-300 font-bold rounded-lg transition text-lg flex items-center justify-center gap-2"
                >
                  <Share2 size={20} /> 生成分享链接
                </button>
              ) : (
                <div className="space-y-3">
                  <div className="p-4 bg-blue-50 border-2 border-blue-300 rounded-lg break-all font-mono text-sm">
                    {shareLink}
                  </div>
                  <button
                    onClick={() => copyToClipboard(shareLink)}
                    className={`w-full px-4 py-2 border-2 font-bold rounded-lg transition flex items-center justify-center gap-2 ${
                      copied
                        ? 'border-green-500 bg-green-100'
                        : 'border-black bg-white hover:bg-gray-100'
                    }`}
                  >
                    <Copy size={18} /> {copied ? '已复制！' : '复制链接'}
                  </button>
                </div>
              )}

              <div className="p-4 bg-yellow-50 border-2 border-yellow-300 rounded-lg text-sm font-bold">
                <p>💡 分享链接可在以下方式中使用：</p>
                <ul className="mt-2 space-y-1 list-disc list-inside">
                  <li>直接分享给朋友</li>
                  <li>发送到邮件</li>
                  <li>分享到社交媒体</li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="p-6 bg-gray-100 border-2 border-dashed border-gray-400 rounded-lg text-center">
              <p className="text-gray-600 font-bold">请先选择一篇日记</p>
            </div>
          )}
        </div>

        {/* 批量导出 */}
        <div className="border-2 border-black bg-white rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Download size={24} /> 批量导出
          </h2>

          <div className="space-y-3">
            <button
              onClick={exportAllAsZip}
              className="w-full px-6 py-3 border-2 border-black bg-white hover:bg-gray-100 font-bold rounded-lg transition text-lg flex items-center justify-center gap-2"
            >
              <Download size={20} /> 导出所有日记为 ZIP
            </button>

            <p className="text-sm text-gray-600 font-bold">
              将所有 {diaries.length} 篇日记打包下载（包含所有格式）
            </p>
          </div>
        </div>

        {/* 导出统计 */}
        <div className="border-2 border-black bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-6 shadow-md">
          <h2 className="text-2xl font-bold mb-4">📊 导出统计</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">{diaries.length}</div>
              <div className="text-sm font-bold text-gray-600">总日记数</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {diaries.reduce((sum, d) => sum + (d.filename?.length || 0), 0) / 1024}
              </div>
              <div className="text-sm font-bold text-gray-600">总大小 (KB)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600">4</div>
              <div className="text-sm font-bold text-gray-600">导出格式</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pink-600">♾️</div>
              <div className="text-sm font-bold text-gray-600">分享链接</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
