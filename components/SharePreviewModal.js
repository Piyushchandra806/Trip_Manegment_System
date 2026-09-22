import React, { useState, useEffect, useRef } from 'react';
import { toPng } from 'html-to-image';
import ShareCardTemplate from './ShareCardTemplate';
import { X, Share2, Download, Loader2 } from 'lucide-react';

export default function SharePreviewModal({ isOpen, onClose, passenger, familyMembers }) {
  const [imageUrl, setImageUrl] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const cardRef = useRef(null);

  useEffect(() => {
    if (isOpen && passenger) {
      generateImage();
    } else {
      setImageUrl(null);
      setError('');
    }
  }, [isOpen, passenger]);

  const generateImage = async () => {
    setIsGenerating(true);
    setError('');
    setImageUrl(null);
    
    try {
      await new Promise(r => setTimeout(r, 500));
      
      if (!cardRef.current) throw new Error("Template not found");

      const dataUrl = await toPng(cardRef.current, {
        quality: 1.0,
        pixelRatio: 2,
        backgroundColor: '#ffffff'
      });

      setImageUrl(dataUrl);
    } catch (err) {
      console.error("Image generation failed:", err);
      setError(`Error: ${err.message || err.toString()}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleShare = async () => {
    if (!imageUrl) return;
    
    try {
      const blob = await (await fetch(imageUrl)).blob();
      const file = new File([blob], `${passenger.name.replace(/\s+/g, '_')}_trip_details.png`, { type: 'image/png' });

      if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          title: 'My Trip Details',
          files: [file]
        });
      } else {
        handleDownload();
      }
    } catch (err) {
      console.error("Share failed:", err);
      if (err.name !== 'AbortError') {
        alert("Sharing failed. You can download the image instead.");
      }
    }
  };

  const handleDownload = () => {
    if (!imageUrl) return;
    const a = document.createElement('a');
    a.href = imageUrl;
    a.download = `${passenger.name.replace(/\s+/g, '_')}_trip_details.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b border-slate-100 bg-slate-50">
          <h2 className="text-xl font-bold text-slate-800">Preview & Share</h2>
          <button 
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto flex-1 bg-slate-100 flex flex-col items-center justify-center min-h-[300px]">
          {isGenerating ? (
            <div className="flex flex-col items-center gap-4 text-slate-500">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600" />
              <p className="font-medium animate-pulse">Generating your trip card...</p>
            </div>
          ) : error ? (
            <div className="text-red-500 text-center font-medium bg-red-50 px-4 py-3 rounded-xl border border-red-100">
              {error}
            </div>
          ) : imageUrl ? (
            <div className="relative group w-full flex justify-center">
              <img 
                src={imageUrl} 
                alt="Trip Details" 
                className="max-w-full h-auto rounded-xl shadow-lg border border-slate-200 object-contain"
                style={{ maxHeight: '50vh' }}
              />
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        <div className="p-6 border-t border-slate-100 bg-white">
          <div className="flex flex-col gap-3">
            <button
              onClick={handleShare}
              disabled={isGenerating || !imageUrl}
              className="w-full flex items-center justify-center gap-2 bg-green-600 text-white px-6 py-4 rounded-xl font-bold text-lg hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-md shadow-green-600/20">
              <Share2 className="w-5 h-5" />
              Share on WhatsApp
            </button>
            <button
              onClick={handleDownload}
              disabled={isGenerating || !imageUrl}
              className="w-full flex items-center justify-center gap-2 bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-semibold hover:bg-slate-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              <Download className="w-5 h-5" />
              Save Image
            </button>
          </div>
          <p className="text-center text-xs text-slate-400 mt-4">
            If sharing on WhatsApp doesn't work automatically, you can save the image and send it manually.
          </p>
        </div>
      </div>

      {/* Hidden off-screen template for html-to-image */}
      <div 
        className="fixed top-0 left-0 pointer-events-none" 
        style={{ zIndex: -9999, opacity: 0, position: 'absolute', left: '-9999px' }}
      >
        <ShareCardTemplate ref={cardRef} passenger={passenger} familyMembers={familyMembers} />
      </div>
    </div>
  );
}