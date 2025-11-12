
import { useState, useEffect } from 'react';

interface CertificatePreviewProps {
  certificateBlobs: Blob[];
  certificateNames: string[];
}

const CertificatePreview = ({ 
  certificateBlobs, 
  certificateNames 
}: CertificatePreviewProps) => {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [currentPreviewUrl, setCurrentPreviewUrl] = useState<string | null>(null);

  // Create URL for the selected certificate
  useEffect(() => {
    if (certificateBlobs.length === 0) {
      setCurrentPreviewUrl(null);
      return;
    }

    const blob = certificateBlobs[selectedIndex] || certificateBlobs[0];
    const url = URL.createObjectURL(blob);
    setCurrentPreviewUrl(url);

    return () => {
      if (url) URL.revokeObjectURL(url);
    };
  }, [certificateBlobs, selectedIndex]);

  // Reset selected index when blob count changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [certificateBlobs.length]);

  if (certificateBlobs.length === 0) {
    return null;
  }

  return (
    <div className="animate-fade-in space-y-4 w-full">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-medium">Preview Certificates</h3>
        <div className="text-sm text-muted-foreground">
          {selectedIndex + 1} of {certificateBlobs.length}
        </div>
      </div>
      
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        {currentPreviewUrl ? (
          <img 
            src={currentPreviewUrl} 
            alt={`Certificate for ${certificateNames[selectedIndex] || 'Preview'}`}
            className="max-w-full h-auto object-contain"
          />
        ) : (
          <div className="flex items-center justify-center h-48">
            <p className="text-muted-foreground">No certificate preview available</p>
          </div>
        )}
      </div>
      
      {certificateBlobs.length > 1 && (
        <div className="flex gap-2 overflow-x-auto py-2 px-1">
          {certificateBlobs.map((blob, index) => {
            const thumbnailUrl = URL.createObjectURL(blob);
            return (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 relative border-2 rounded overflow-hidden
                          transition-all duration-200 focus:outline-none
                          ${selectedIndex === index 
                            ? 'border-primary shadow-md scale-105 z-10' 
                            : 'border-border hover:border-primary/40'}`}
              >
                <img
                  src={thumbnailUrl}
                  alt={`Thumbnail for ${certificateNames[index] || `Certificate ${index + 1}`}`}
                  className="w-20 h-16 object-cover"
                  onLoad={() => URL.revokeObjectURL(thumbnailUrl)}
                />
                <div className="absolute bottom-0 left-0 right-0 bg-black/50 py-[2px] px-1">
                  <p className="text-[10px] text-white truncate">
                    {certificateNames[index] || `Certificate ${index + 1}`}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default CertificatePreview;
