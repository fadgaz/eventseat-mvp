'use client';

import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';

interface QRCodeGeneratorProps {
  eventUrl: string;
  eventName: string;
}

export default function QRCodeGenerator({ eventUrl, eventName }: QRCodeGeneratorProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQRCode();
  }, [eventUrl]);

  const generateQRCode = async () => {
    try {
      const canvas = canvasRef.current;
      if (canvas) {
        await QRCode.toCanvas(canvas, eventUrl, {
          width: 200,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF'
          }
        });

        // Also generate data URL for download
        const dataUrl = await QRCode.toDataURL(eventUrl, {
          width: 400,
          margin: 2,
        });
        setQrCodeDataUrl(dataUrl);
      }
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const downloadQRCode = () => {
    if (qrCodeDataUrl) {
      const link = document.createElement('a');
      link.download = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_qr_code.png`;
      link.href = qrCodeDataUrl;
      link.click();
    }
  };

  const downloadPoster = () => {
    // Create a poster with QR code and event info
    const posterCanvas = document.createElement('canvas');
    const ctx = posterCanvas.getContext('2d');
    
    if (!ctx) return;

    // Set poster dimensions (8.5 x 11 inches at 150 DPI)
    posterCanvas.width = 1275;
    posterCanvas.height = 1650;

    // White background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, posterCanvas.width, posterCanvas.height);

    // Event title
    ctx.fillStyle = '#1F2937';
    ctx.font = 'bold 48px Arial';
    ctx.textAlign = 'center';
    const titleY = 150;
    ctx.fillText(eventName, posterCanvas.width / 2, titleY);

    // Instructions
    ctx.font = '32px Arial';
    ctx.fillStyle = '#6B7280';
    const instructionY = titleY + 100;
    ctx.fillText('Scan to Find Your Seat', posterCanvas.width / 2, instructionY);

    // QR Code
    if (canvasRef.current) {
      const qrSize = 400;
      const qrX = (posterCanvas.width - qrSize) / 2;
      const qrY = instructionY + 80;
      
      ctx.drawImage(canvasRef.current, qrX, qrY, qrSize, qrSize);
    }

    // Footer instructions
    ctx.font = '24px Arial';
    ctx.fillStyle = '#9CA3AF';
    const footerY = posterCanvas.height - 200;
    ctx.fillText('Use your phone camera to scan the QR code', posterCanvas.width / 2, footerY);
    ctx.fillText('or visit the link to find your table and seat', posterCanvas.width / 2, footerY + 40);

    // URL text (smaller)
    ctx.font = '18px Arial';
    ctx.fillText(eventUrl, posterCanvas.width / 2, footerY + 100);

    // Download the poster
    const link = document.createElement('a');
    link.download = `${eventName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_poster.png`;
    link.href = posterCanvas.toDataURL();
    link.click();
  };

  return (
    <div className="text-center">
      <div className="mb-4">
        <canvas ref={canvasRef} className="border border-gray-200 rounded-lg mx-auto" />
      </div>
      
      <div className="space-y-3">
        <p className="text-sm text-gray-600 mb-4">
          Share this QR code with your guests. They can scan it to find their seats.
        </p>
        
        <div className="space-y-2">
          <button
            onClick={downloadQRCode}
            className="w-full bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition-colors text-sm"
          >
            Download QR Code
          </button>
          
          <button
            onClick={downloadPoster}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors text-sm"
          >
            Download Event Poster
          </button>
        </div>
        
        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
          <p className="text-xs text-gray-500 mb-1">Direct Link:</p>
          <p className="text-xs text-gray-700 break-all font-mono">{eventUrl}</p>
        </div>
      </div>
    </div>
  );
} 