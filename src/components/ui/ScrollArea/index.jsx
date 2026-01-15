// src/components/ui/ScrollArea.jsx
import React, { useRef, useEffect, useState } from 'react';

export const ScrollArea = ({ 
  children, 
  className = '',
  maxHeight,
  ...props 
}) => {
  const [showScrollbar, setShowScrollbar] = useState(false);
  const [scrollPercentage, setScrollPercentage] = useState(0);
  const contentRef = useRef(null);
  const scrollbarRef = useRef(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const scrollStartPercentage = useRef(0);

  useEffect(() => {
    const content = contentRef.current;
    if (!content) return;

    const checkScroll = () => {
      setShowScrollbar(content.scrollHeight > content.clientHeight);
      const percentage = (content.scrollTop / (content.scrollHeight - content.clientHeight)) * 100;
      setScrollPercentage(Math.min(percentage, 100));
    };

    content.addEventListener('scroll', checkScroll);
    window.addEventListener('resize', checkScroll);
    checkScroll();

    return () => {
      content.removeEventListener('scroll', checkScroll);
      window.removeEventListener('resize', checkScroll);
    };
  }, []);

  const handleMouseDown = (e) => {
    isDragging.current = true;
    startY.current = e.clientY;
    scrollStartPercentage.current = scrollPercentage;
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  const handleMouseMove = (e) => {
    if (!isDragging.current || !contentRef.current) return;

    const deltaY = e.clientY - startY.current;
    const scrollableHeight = contentRef.current.clientHeight;
    const movementPercentage = (deltaY / scrollableHeight) * 100;
    const newPercentage = Math.max(0, Math.min(100, scrollStartPercentage.current + movementPercentage));

    const scrollTop = (newPercentage / 100) * (contentRef.current.scrollHeight - contentRef.current.clientHeight);
    contentRef.current.scrollTop = scrollTop;
  };

  const handleMouseUp = () => {
    isDragging.current = false;
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('mouseup', handleMouseUp);
  };

  const baseStyle = `
    relative overflow-hidden
    ${className}
  `;

  const contentStyle = `
    overflow-y-auto scrollbar-hide
    ${maxHeight ? `max-h-[${maxHeight}]` : 'h-full'}
  `;

  return (
    <div className={baseStyle} {...props}>
      <div
        ref={contentRef}
        className={contentStyle}
      >
        {children}
      </div>
      {showScrollbar && (
        <div 
          className="absolute right-0.5 top-0 bottom-0 w-2 transition-opacity"
          style={{ opacity: isDragging.current ? 1 : 0.5 }}
        >
          <div
            ref={scrollbarRef}
            className="absolute right-0 w-1.5 rounded-full bg-gray-300 hover:bg-gray-400 cursor-pointer transition-colors"
            style={{
              height: '20%',
              top: `${scrollPercentage}%`,
              transform: 'translateY(-50%)'
            }}
            onMouseDown={handleMouseDown}
          />
        </div>
      )}
    </div>
  );
};