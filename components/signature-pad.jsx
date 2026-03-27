'use client';

import { useEffect, useRef } from 'react';

function drawDataUrlToCanvas(canvas, dataUrl) {
  if (!canvas || !dataUrl) {
    return;
  }

  const context = canvas.getContext('2d');
  const image = new Image();
  image.onload = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
  };
  image.src = dataUrl;
}

export default function SignaturePad({
  id,
  label,
  value,
  onChange,
  error,
  helperText,
}) {
  const wrapperRef = useRef(null);
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    const wrapper = wrapperRef.current;
    if (!canvas || !wrapper) {
      return undefined;
    }

    const setupCanvas = () => {
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(wrapper.clientWidth, 280);
      const height = 180;
      canvas.width = width * ratio;
      canvas.height = height * ratio;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      const context = canvas.getContext('2d');
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
      context.fillStyle = '#ffffff';
      context.fillRect(0, 0, width, height);
      context.strokeStyle = '#0f172a';
      context.lineWidth = 2.2;
      context.lineCap = 'round';
      context.lineJoin = 'round';

      if (value) {
        drawDataUrlToCanvas(canvas, value);
      }
    };

    setupCanvas();
    window.addEventListener('resize', setupCanvas);

    return () => {
      window.removeEventListener('resize', setupCanvas);
    };
  }, [value]);

  const getPoint = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  };

  const startDrawing = (event) => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const point = getPoint(event);
    drawingRef.current = true;
    context.beginPath();
    context.moveTo(point.x, point.y);
    context.lineTo(point.x + 0.01, point.y + 0.01);
    context.stroke();
    event.preventDefault();
  };

  const continueDrawing = (event) => {
    if (!drawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    const point = getPoint(event);
    context.lineTo(point.x, point.y);
    context.stroke();
    event.preventDefault();
  };

  const stopDrawing = (event) => {
    if (!drawingRef.current) {
      return;
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    drawingRef.current = false;
    context.closePath();
    onChange(canvas.toDataURL('image/png'));
    event.preventDefault();
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    const context = canvas.getContext('2d');
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);
    onChange('');
  };

  return (
    <div className="signature-field" ref={wrapperRef}>
      <div className="signature-topline">
        <label htmlFor={id}>{label}</label>
        <button className="ghost-button" type="button" onClick={clearSignature}>
          Clear
        </button>
      </div>
      <canvas
        id={id}
        ref={canvasRef}
        className={`signature-canvas ${error ? 'signature-canvas-error' : ''}`}
        onPointerDown={startDrawing}
        onPointerMove={continueDrawing}
        onPointerUp={stopDrawing}
        onPointerLeave={stopDrawing}
        onPointerCancel={stopDrawing}
        aria-label={label}
      />
      <p className="helper-text">{helperText || 'Draw with a mouse, trackpad, or finger.'}</p>
      {error ? <p className="field-error">{error}</p> : null}
    </div>
  );
}
