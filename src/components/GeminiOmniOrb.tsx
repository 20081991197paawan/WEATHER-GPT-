import React, { useEffect, useRef } from 'react';

interface GeminiOmniOrbProps {
  isThinking?: boolean;
  isSpeaking?: boolean;
  size?: number;
}

export const GeminiOmniOrb: React.FC<GeminiOmniOrbProps> = ({
  isThinking = false,
  isSpeaking = false,
  size = 180,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    const render = () => {
      time += isSpeaking ? 0.045 : isThinking ? 0.035 : 0.02;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cx = canvas.width / 2;
      const cy = canvas.height / 2;
      const baseRadius = size * 0.36;

      // 1. Soft atmospheric back-glow
      const auraGrad = ctx.createRadialGradient(cx, cy, baseRadius * 0.4, cx, cy, baseRadius * 1.5);
      auraGrad.addColorStop(0, 'rgba(138, 180, 248, 0.25)'); // Google Gemini Blue
      auraGrad.addColorStop(0.5, 'rgba(168, 199, 250, 0.1)');
      auraGrad.addColorStop(1, 'rgba(0, 0, 0, 0)');
      ctx.fillStyle = auraGrad;
      ctx.beginPath();
      ctx.arc(cx, cy, baseRadius * 1.5, 0, Math.PI * 2);
      ctx.fill();

      // 2. Liquid Mercury Chrome Morphing Contour
      // Generate organic undulating perimeter using compound sine waves
      const numPoints = 120;
      const points: { x: number; y: number }[] = [];

      for (let i = 0; i < numPoints; i++) {
        const angle = (i / numPoints) * Math.PI * 2;
        // Harmonic morphing formula imitating fluid mercury surface tension
        const morph1 = Math.sin(angle * 3 + time * 1.2) * 8;
        const morph2 = Math.cos(angle * 5 - time * 0.9) * 6;
        const morph3 = Math.sin(angle * 2 + time * 1.8) * (isSpeaking ? 12 : isThinking ? 9 : 4);
        const r = baseRadius + morph1 + morph2 + morph3;

        const x = cx + Math.cos(angle) * r;
        const y = cy + Math.sin(angle) * r;
        points.push({ x, y });
      }

      // Draw outer chrome sphere body
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      for (let i = 1; i < points.length; i++) {
        const xc = (points[i].x + points[(i + 1) % points.length].x) / 2;
        const yc = (points[i].y + points[(i + 1) % points.length].y) / 2;
        ctx.quadraticCurveTo(points[i].x, points[i].y, xc, yc);
      }
      ctx.closePath();

      // Base specular chrome gradient
      const chromeGrad = ctx.createLinearGradient(
        cx - baseRadius,
        cy - baseRadius,
        cx + baseRadius * 1.2,
        cy + baseRadius * 1.2
      );
      chromeGrad.addColorStop(0, '#ffffff');
      chromeGrad.addColorStop(0.18, '#dce3ee');
      chromeGrad.addColorStop(0.35, '#8fa3be');
      chromeGrad.addColorStop(0.55, '#c8d4e4');
      chromeGrad.addColorStop(0.75, '#5c6f84');
      chromeGrad.addColorStop(0.88, '#9fb4cb');
      chromeGrad.addColorStop(1, '#ffffff');

      ctx.fillStyle = chromeGrad;
      ctx.fill();

      // Chrome rim highlight
      ctx.lineWidth = 2.5;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.85)';
      ctx.stroke();

      // 3. Realistic Liquid Reflection Swirls (Internal specular reflections)
      ctx.save();
      ctx.clip(); // Clip to the liquid sphere body

      // Specular sky reflection band (the bright chrome reflection from video)
      const skyGrad = ctx.createLinearGradient(
        cx - baseRadius * 0.8,
        cy - baseRadius * 0.8 + Math.sin(time) * 10,
        cx + baseRadius * 0.8,
        cy + baseRadius * 0.8 + Math.cos(time) * 10
      );
      skyGrad.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      skyGrad.addColorStop(0.3, 'rgba(186, 215, 255, 0.7)');
      skyGrad.addColorStop(0.5, 'rgba(100, 130, 170, 0.4)');
      skyGrad.addColorStop(0.7, 'rgba(255, 255, 255, 0.85)');
      skyGrad.addColorStop(1, 'rgba(70, 90, 120, 0.3)');

      ctx.fillStyle = skyGrad;
      ctx.beginPath();
      // Curved wavy fluid band across the center
      const bandY = cy - 10 + Math.sin(time * 1.4) * 8;
      ctx.ellipse(cx, bandY, baseRadius * 0.85, baseRadius * 0.45, Math.PI / 6, 0, Math.PI * 2);
      ctx.fill();

      // High specular gloss hot-spots
      const spotGrad1 = ctx.createRadialGradient(
        cx - baseRadius * 0.35 + Math.cos(time) * 5,
        cy - baseRadius * 0.4 + Math.sin(time) * 5,
        2,
        cx - baseRadius * 0.35,
        cy - baseRadius * 0.4,
        baseRadius * 0.5
      );
      spotGrad1.addColorStop(0, 'rgba(255, 255, 255, 1)');
      spotGrad1.addColorStop(0.5, 'rgba(255, 255, 255, 0.5)');
      spotGrad1.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = spotGrad1;
      ctx.beginPath();
      ctx.arc(cx - baseRadius * 0.35, cy - baseRadius * 0.4, baseRadius * 0.5, 0, Math.PI * 2);
      ctx.fill();

      // Lower chrome bounce light reflection
      const bounceGrad = ctx.createRadialGradient(
        cx + baseRadius * 0.3,
        cy + baseRadius * 0.4,
        1,
        cx + baseRadius * 0.3,
        cy + baseRadius * 0.4,
        baseRadius * 0.6
      );
      bounceGrad.addColorStop(0, 'rgba(138, 180, 248, 0.6)'); // subtle Gemini blue reflection
      bounceGrad.addColorStop(0.6, 'rgba(255, 255, 255, 0.2)');
      bounceGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = bounceGrad;
      ctx.beginPath();
      ctx.arc(cx + baseRadius * 0.3, cy + baseRadius * 0.4, baseRadius * 0.6, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();

      // 4. Subtle orbital particle glow when thinking or speaking
      if (isThinking || isSpeaking) {
        const ringRadius = baseRadius * 1.25;
        const ringAngle = time * 2;
        const rx = cx + Math.cos(ringAngle) * ringRadius;
        const ry = cy + Math.sin(ringAngle) * (ringRadius * 0.45);

        ctx.fillStyle = '#8ab4f8';
        ctx.shadowColor = '#8ab4f8';
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      animationId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isThinking, isSpeaking, size]);

  return (
    <div className="relative flex items-center justify-center select-none pointer-events-none">
      <canvas
        ref={canvasRef}
        width={size * 1.5}
        height={size * 1.5}
        className="w-full h-full max-w-[220px] max-h-[220px] drop-shadow-[0_12px_32px_rgba(0,0,0,0.5)]"
      />
    </div>
  );
};
