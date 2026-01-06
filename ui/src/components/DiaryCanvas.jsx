import React, { useState, useRef, useEffect } from 'react';
import { DraggableCore } from 'react-draggable';
import InteractiveCard from './InteractiveCard';

const DiaryCanvas = ({ children, controls }) => {
  const [canvasPos, setCanvasPos] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 4000, height: 4000 });
  const [sizePanelOpen, setSizePanelOpen] = useState(false);
  const [sizeInput, setSizeInput] = useState({ width: 4000, height: 4000 });
  const canvasRef = useRef(null);
  const draggableCanvasRef = useRef(null);

  // 处理画布拖拽
  const handleCanvasDrag = (e, data) => {
    setCanvasPos({
      x: data.x,
      y: data.y
    });
  };

  // 处理画布拖拽开始
  const handleCanvasDragStart = () => {
    setIsDraggingCanvas(true);
  };

  // 处理画布拖拽结束
  const handleCanvasDragStop = () => {
    setIsDraggingCanvas(false);
  };

  const openSizePanel = () => {
    setSizePanelOpen(true);
  };
  const applyCanvasSize = () => {
    const w = Number(sizeInput.width);
    const h = Number(sizeInput.height);
    if (Number.isFinite(w) && Number.isFinite(h) && w > 0 && h > 0) {
      const next = { width: w, height: h };
      setCanvasSize(next);
      try { localStorage.setItem('diaryCanvasSize', JSON.stringify(next)); } catch {}
    }
    setSizePanelOpen(false);
  };
  const cancelSizePanel = () => {
    setSizePanelOpen(false);
  };

  useEffect(() => {
    try {
      const saved = localStorage.getItem('diaryCanvasSize');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed?.width === 'number' && typeof parsed?.height === 'number') {
          setCanvasSize(parsed);
          setSizeInput(parsed);
        }
      }
    } catch {}
  }, []);

  return (
    <div 
      ref={canvasRef}
      className="relative w-full h-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100"
      style={{
        cursor: isDraggingCanvas ? 'grabbing' : 'grab'
      }}
    >
      {/* 无限画布 */}
      <DraggableCore
        nodeRef={draggableCanvasRef}
        onDrag={handleCanvasDrag}
        onStart={handleCanvasDragStart}
        onStop={handleCanvasDragStop}
      >
        <div 
          ref={draggableCanvasRef}
          className="absolute"
          style={{
            width: canvasSize.width,
            height: canvasSize.height,
            left: canvasPos.x,
            top: canvasPos.y,
            transform: 'translate(-50%, -50%)'
          }}
        >
          {/* 画布网格背景 */}
          <div 
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage: `linear-gradient(#ccc 1px, transparent 1px), linear-gradient(90deg, #ccc 1px, transparent 1px)`,
              backgroundSize: '50px 50px'
            }}
          />
          
          {/* 画布内容容器 */}
          <div className="absolute inset-0 flex justify-center items-start p-20">
            {children}
          </div>
        </div>
      </DraggableCore>
      
      {/* 画布控制按钮 */}
      <div className="absolute bottom-4 right-4 flex gap-2">
        <button 
          onClick={() => {
            setCanvasPos({ x: 0, y: 0 });
          }}
          className="px-3 py-1 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          重置视图
        </button>
        <button 
          onClick={openSizePanel}
          className="px-3 py-1 bg-white border border-gray-300 rounded shadow hover:bg-gray-50 transition-colors text-sm font-medium"
        >
          调整大小
        </button>
        {controls && (
          <div className="flex gap-2">
            {controls}
          </div>
        )}
      </div>
      {sizePanelOpen && (
        <div className="absolute bottom-16 right-4 bg-white border border-gray-300 rounded shadow p-3 flex flex-col gap-2 w-56">
          <div className="text-sm font-medium">设置画布尺寸</div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">宽</span>
            <input
              type="number"
              value={sizeInput.width}
              onChange={(e) => setSizeInput(prev => ({ ...prev, width: e.target.value }))}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              min={500}
              step={100}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">高</span>
            <input
              type="number"
              value={sizeInput.height}
              onChange={(e) => setSizeInput(prev => ({ ...prev, height: e.target.value }))}
              className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm"
              min={500}
              step={100}
            />
          </div>
          <div className="flex justify-end gap-2 mt-2">
            <button onClick={cancelSizePanel} className="px-3 py-1 bg-white border border-gray-300 rounded text-sm hover:bg-gray-50">取消</button>
            <button onClick={applyCanvasSize} className="px-3 py-1 bg-black text-white rounded text-sm hover:bg-gray-800">应用</button>
          </div>
        </div>
      )}
    </div>
  );
};

// 可拖拽的卡片组件
const DraggableCard = ({ children, className = '', initialPosition = { x: 0, y: 0 } }) => {
  const [position, setPosition] = useState(initialPosition);
  const [zIndex, setZIndex] = useState(1);
  const nodeRef = useRef(null);

  const handleDrag = (e, data) => {
    setPosition({
      x: data.x,
      y: data.y
    });
  };

  const handleDragStart = () => {
    setZIndex(Date.now());
  };

  return (
    <DraggableCore
      nodeRef={nodeRef}
      onDrag={handleDrag}
      onStart={handleDragStart}
    >
      <div 
        ref={nodeRef}
        className={`absolute transition-all duration-200 ${className}`}
        style={{
          left: position.x,
          top: position.y,
          zIndex: zIndex,
          cursor: 'move'
        }}
      >
        {children}
      </div>
    </DraggableCore>
  );
};

export { DiaryCanvas, DraggableCard };
