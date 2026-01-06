import React, { useState, useRef, useEffect } from 'react';
import { Bold, Italic, Code, List, Heading2, Link, Eye, EyeOff, Wand2, Type, RotateCcw } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

export default function EnhancedMarkdownEditor({ 
  value, 
  onChange, 
  placeholder = '开始写你的故事...',
  showPreview = true 
}) {
  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [historyStack, setHistoryStack] = useState([value]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const textareaRef = useRef(null);
  const [wordCount, setWordCount] = useState(value.length);
  const [charCount, setCharCount] = useState((value.match(/\n/g) || []).length + 1);

  // 更新字数和行数统计
  useEffect(() => {
    setWordCount(value.length);
    setCharCount((value.match(/\n/g) || []).length + 1);
  }, [value]);

  // 添加到历史记录
  const addToHistory = (newValue) => {
    const newStack = historyStack.slice(0, historyIndex + 1);
    newStack.push(newValue);
    setHistoryStack(newStack);
    setHistoryIndex(newStack.length - 1);
    onChange(newValue);
  };

  // 撤销
  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      onChange(historyStack[newIndex]);
    }
  };

  // 重做
  const redo = () => {
    if (historyIndex < historyStack.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      onChange(historyStack[newIndex]);
    }
  };

  // 获取选中文本
  const getSelectedText = () => {
    const textarea = textareaRef.current;
    if (!textarea) return null;
    return {
      start: textarea.selectionStart,
      end: textarea.selectionEnd,
      text: value.substring(textarea.selectionStart, textarea.selectionEnd)
    };
  };

  // 插入格式
  const insertFormat = (format) => {
    const selection = getSelectedText();
    if (!selection) return;

    const { start, end, text } = selection;
    let newValue = value;

    const formatters = {
      bold: () => `**${text || '粗体'}**`,
      italic: () => `*${text || '斜体'}*`,
      code: () => `\`${text || 'code'}\``,
      codeblock: () => `\`\`\`\n${text || '代码块'}\n\`\`\``,
      heading: () => `## ${text || '标题'}`,
      list: () => `- ${text || '列表项'}\n`,
      link: () => `[${text || '链接文本'}](url)`,
      quote: () => `> ${text || '引用'}`,
      table: () => `| 列1 | 列2 |\n|---|---|\n| 内容1 | 内容2 |`,
    };

    const formatted = formatters[format]();
    newValue = value.substring(0, start) + formatted + value.substring(end);
    addToHistory(newValue);
    
    // 重新聚焦并移动光标
    setTimeout(() => {
      if (textareaRef.current) {
        textareaRef.current.focus();
        const newPos = start + formatted.length;
        textareaRef.current.setSelectionRange(newPos, newPos);
      }
    }, 0);
  };

  // 处理键盘快捷键
  const handleKeyDown = (e) => {
    // Ctrl/Cmd + Z 撤销
    if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
      e.preventDefault();
      undo();
      return;
    }
    // Ctrl/Cmd + Y 重做
    if ((e.ctrlKey || e.metaKey) && e.key === 'y') {
      e.preventDefault();
      redo();
      return;
    }
    // Ctrl/Cmd + B 粗体
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      insertFormat('bold');
      return;
    }
    // Ctrl/Cmd + I 斜体
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      insertFormat('italic');
      return;
    }
    // Tab 自动缩进
    if (e.key === 'Tab') {
      e.preventDefault();
      const textarea = textareaRef.current;
      const start = textarea.selectionStart;
      const newValue = value.substring(0, start) + '  ' + value.substring(start);
      addToHistory(newValue);
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2;
      }, 0);
    }
  };

  // 清空编辑器
  const handleClear = () => {
    if (confirm('确定要清空所有内容吗？')) {
      addToHistory('');
    }
  };

  // 自动完成AI建议
  const handleAISuggest = async () => {
    // 这里可以接入AI补全API
    alert('AI建议功能开发中（需要后端支持）');
  };

  const containerClass = isFullscreen
    ? 'fixed inset-0 z-50 rounded-none'
    : 'relative rounded-lg';

  return (
    <div className={`flex flex-col bg-white border-2 border-black ${containerClass}`}>
      {/* 工具栏 */}
      <div className="border-b-2 border-black p-3 bg-gray-50 flex items-center gap-2 flex-wrap">
        {/* 格式化按钮 */}
        <div className="flex gap-1 border-r-2 border-gray-300 pr-2">
          <ToolButton
            icon={<Bold size={18} />}
            title="粗体 (Ctrl+B)"
            onClick={() => insertFormat('bold')}
          />
          <ToolButton
            icon={<Italic size={18} />}
            title="斜体 (Ctrl+I)"
            onClick={() => insertFormat('italic')}
          />
          <ToolButton
            icon={<Code size={18} />}
            title="代码"
            onClick={() => insertFormat('code')}
          />
          <ToolButton
            icon={<Type size={18} />}
            title="代码块"
            onClick={() => insertFormat('codeblock')}
          />
        </div>

        {/* 结构按钮 */}
        <div className="flex gap-1 border-r-2 border-gray-300 pr-2">
          <ToolButton
            icon={<Heading2 size={18} />}
            title="标题"
            onClick={() => insertFormat('heading')}
          />
          <ToolButton
            icon={<List size={18} />}
            title="列表"
            onClick={() => insertFormat('list')}
          />
          <ToolButton
            icon={<Link size={18} />}
            title="链接"
            onClick={() => insertFormat('link')}
          />
        </div>

        {/* 编辑控制 */}
        <div className="flex gap-1 border-r-2 border-gray-300 pr-2">
          <ToolButton
            icon={<RotateCcw size={18} />}
            title="撤销"
            onClick={undo}
            disabled={historyIndex === 0}
          />
          <ToolButton
            icon={<Wand2 size={18} />}
            title="AI建议"
            onClick={handleAISuggest}
          />
        </div>

        {/* 查看模式 */}
        {showPreview && (
          <button
            onClick={() => setIsPreviewMode(!isPreviewMode)}
            className={`p-2 border-2 rounded transition flex items-center gap-1 font-bold ${
              isPreviewMode
                ? 'border-black bg-blue-200'
                : 'border-gray-300 hover:border-black bg-white'
            }`}
            title={isPreviewMode ? '编辑模式' : '预览模式'}
          >
            {isPreviewMode ? <Eye size={18} /> : <EyeOff size={18} />}
            <span className="text-xs">{isPreviewMode ? '预览' : '编辑'}</span>
          </button>
        )}

        {/* 全屏 */}
        <button
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="px-2 py-1 border-2 border-gray-300 hover:border-black bg-white rounded font-bold text-xs transition"
          title="全屏"
        >
          {isFullscreen ? '退出全屏' : '全屏'}
        </button>

        {/* 清空 */}
        <button
          onClick={handleClear}
          className="px-2 py-1 border-2 border-red-400 bg-white hover:bg-red-50 rounded font-bold text-xs transition text-red-600"
          title="清空内容"
        >
          清空
        </button>

        {/* 统计 */}
        <div className="ml-auto flex gap-3 text-xs font-bold text-gray-600">
          <span title="字符数">📝 {wordCount}</span>
          <span title="行数">📄 {charCount}</span>
        </div>
      </div>

      {/* 编辑/预览区域 */}
      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* 编辑器 */}
        {!isPreviewMode && (
          <textarea
            ref={textareaRef}
            value={value}
            onChange={(e) => addToHistory(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className="flex-1 p-4 font-mono text-sm resize-none focus:outline-none border-none"
            style={{ fontFamily: "'Monaco', 'Menlo', 'Ubuntu Mono', monospace" }}
          />
        )}

        {/* 预览器 */}
        {isPreviewMode && (
          <div className="flex-1 overflow-y-auto p-4 bg-white">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-3xl font-bold mb-4">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl font-bold mb-3">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl font-bold mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                  code: ({ children }) => <code className="bg-gray-100 px-2 py-1 rounded font-mono text-sm">{children}</code>,
                  pre: ({ children }) => <pre className="bg-gray-800 text-white p-3 rounded mb-3 overflow-x-auto">{children}</pre>,
                  ul: ({ children }) => <ul className="list-disc list-inside mb-3">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside mb-3">{children}</ol>,
                  li: ({ children }) => <li className="mb-1">{children}</li>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-gray-400 pl-4 italic mb-3">{children}</blockquote>,
                  a: ({ href = "", children }) => {
                    const safe = (() => {
                      try {
                        const u = new URL(href, window.location.origin);
                        const allowed = ["http:", "https:", "mailto:", "tel:"];
                        return allowed.includes(u.protocol) || href.startsWith("/") || href.startsWith("#");
                      } catch {
                        return false;
                      }
                    })();
                    const safeHref = safe ? href : "#";
                    return <a href={safeHref} className="text-blue-600 underline" rel="noopener noreferrer">{children}</a>;
                  },
                }}
              >
                {value}
              </ReactMarkdown>
            </div>
          </div>
        )}

        {/* 分割线 */}
        {showPreview && !isPreviewMode && (
          <div className="w-1 bg-gray-200" />
        )}

        {/* 实时预览（分屏） */}
        {showPreview && !isPreviewMode && (
          <div className="w-1/2 overflow-y-auto p-4 bg-gray-50 border-l-2 border-gray-300">
            <div className="prose prose-sm max-w-none">
              <ReactMarkdown>{value}</ReactMarkdown>
            </div>
          </div>
        )}
      </div>

      {/* 底部状态栏 */}
      <div className="border-t-2 border-black bg-gray-50 px-4 py-2 text-xs font-bold text-gray-600 flex justify-between">
        <span>✏️ 实时编辑中...</span>
        <span>💾 自动保存已启用</span>
      </div>
    </div>
  );
}

function ToolButton({ icon, title, onClick, disabled = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`p-2 border-2 rounded transition flex items-center ${
        disabled
          ? 'border-gray-300 bg-gray-100 text-gray-400 cursor-not-allowed'
          : 'border-gray-300 bg-white hover:border-black hover:bg-blue-50'
      }`}
      title={title}
    >
      {icon}
    </button>
  );
}
