import React, { useEffect, useRef } from 'react';

export default function ForexBackground() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let animationId;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    // Generate initial candles
    const NUM_CANDLES = 40;
    const candles = [];

    const generateCandle = (x) => {
      const open = 100 + Math.random() * 200;
      const change = (Math.random() - 0.5) * 60;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * 30;
      const low = Math.min(open, close) - Math.random() * 30;
      const bullish = close >= open;
      return {
        x,
        open,
        close,
        high,
        low,
        bullish,
        alpha: 0.15 + Math.random() * 0.25,
        speed: 0.3 + Math.random() * 0.5,
        width: 14 + Math.random() * 8,
      };
    };

    const candleSpacing = () => canvas.width / NUM_CANDLES;

    for (let i = 0; i < NUM_CANDLES; i++) {
      candles.push(generateCandle(i * (window.innerWidth / NUM_CANDLES)));
    }

    const scaleY = (value, min, max) => {
      const padding = canvas.height * 0.1;
      return padding + ((max - value) / (max - min)) * (canvas.height - padding * 2);
    };

    let offset = 0;

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Dark gradient background
      const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
      gradient.addColorStop(0, '#090B12');
      gradient.addColorStop(1, '#0D1020');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = 'rgba(42, 47, 58, 0.4)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 10; i++) {
        const y = (canvas.height / 10) * i;
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }
      for (let i = 0; i < 20; i++) {
        const x = (canvas.width / 20) * i;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }

      // Glowing line at the bottom like a chart baseline
      const lineGradient = ctx.createLinearGradient(0, 0, canvas.width, 0);
      lineGradient.addColorStop(0, 'transparent');
      lineGradient.addColorStop(0.5, 'rgba(242, 167, 27, 0.3)');
      lineGradient.addColorStop(1, 'transparent');
      ctx.strokeStyle = lineGradient;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(0, canvas.height * 0.75);
      ctx.lineTo(canvas.width, canvas.height * 0.75);
      ctx.stroke();

      // All values for scale
      const allValues = candles.flatMap((c) => [c.high, c.low]);
      const min = Math.min(...allValues);
      const max = Math.max(...allValues);

      const spacing = canvas.width / NUM_CANDLES;

      // Draw candles
      candles.forEach((candle) => {
        const x = ((candle.x + offset) % (canvas.width + spacing * 2)) - spacing;
        const openY = scaleY(candle.open, min, max);
        const closeY = scaleY(candle.close, min, max);
        const highY = scaleY(candle.high, min, max);
        const lowY = scaleY(candle.low, min, max);
        const bodyTop = Math.min(openY, closeY);
        const bodyHeight = Math.abs(openY - closeY) || 2;

        const color = candle.bullish ? `rgba(34, 197, 94, ${candle.alpha})` : `rgba(239, 68, 68, ${candle.alpha})`;
        const glowColor = candle.bullish ? `rgba(34, 197, 94, ${candle.alpha * 0.5})` : `rgba(239, 68, 68, ${candle.alpha * 0.5})`;

        // Wick
        ctx.strokeStyle = color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x + candle.width / 2, highY);
        ctx.lineTo(x + candle.width / 2, lowY);
        ctx.stroke();

        // Glow effect
        ctx.shadowColor = glowColor;
        ctx.shadowBlur = 8;

        // Body
        ctx.fillStyle = color;
        ctx.fillRect(x, bodyTop, candle.width, bodyHeight);

        ctx.shadowBlur = 0;

        // Move candle
        candle.x += candle.speed;

        // Reset when out of screen
        if ((candle.x + offset) % (canvas.width + spacing * 2) > canvas.width + spacing) {
          candle.open = 100 + Math.random() * 200;
          const change = (Math.random() - 0.5) * 60;
          candle.close = candle.open + change;
          candle.high = Math.max(candle.open, candle.close) + Math.random() * 30;
          candle.low = Math.min(candle.open, candle.close) - Math.random() * 30;
          candle.bullish = candle.close >= candle.open;
          candle.alpha = 0.15 + Math.random() * 0.25;
        }
      });

      // Overlay gradient to darken edges
      const overlay = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, canvas.height * 0.2,
        canvas.width / 2, canvas.height / 2, canvas.width * 0.8
      );
      overlay.addColorStop(0, 'rgba(9, 11, 18, 0)');
      overlay.addColorStop(1, 'rgba(9, 11, 18, 0.7)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      animationId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ zIndex: 0 }}
    />
  );
}