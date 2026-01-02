import React, { useState, useRef, useEffect } from 'react';
import { DraggableCore } from 'react-draggable';
import InteractiveCard from './InteractiveCard';

const DiaryCanvas = ({ children, controls }) => {
  const [canvasPos, setCanvasPos] = useState({ x: 0, y: 0 });
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 2000, height: 2000 });
  const canvasRef = useRef(null);
  const dragRef = useRef(null);

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

  // 自动调整画布大小
  const adjustCanvasSize = () => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCanvasSize({
        width: rect.width * 2,
        height: rect.height * 2
      });
    }
  };

  // 监听窗口大小变化，调整画布大小
  useEffect(() => {
    adjustCanvasSize();
    window.addEventListener('resize', adjustCanvasSize);
    return () => window.removeEventListener('resize', adjustCanvasSize);
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
        ref={dragRef}
        onDrag={handleCanvasDrag}
        onStart={handleCanvasDragStart}
        onStop={handleCanvasDragStop}
      >
        <div 
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
          onClick={adjustCanvasSize}
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
    </div>
  );
};

// 可拖拽的卡片组件
const DraggableCard = ({ children, className = '', initialPosition = { x: 0, y: 0 } }) => {
  const [position, setPosition] = useState(initialPosition);
  const [zIndex, setZIndex] = useState(1);

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
      onDrag={handleDrag}
      onStart={handleDragStart}
    >
      <div 
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
