
import { useState, useRef } from 'react';
import { toast } from 'sonner';

interface TemplateUploaderProps {
  onTemplateSelected: (file: File) => void;
}

const TemplateUploader = ({ onTemplateSelected }: TemplateUploaderProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const validateAndProcessFile = (file: File) => {
    // Check if the file is an image
    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, etc.)');
      return;
    }

    // Create a preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    // Notify parent component
    onTemplateSelected(file);
    toast.success('Template uploaded successfully');
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      validateAndProcessFile(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="animate-fade-in space-y-4 w-full">
      <div 
        className={`
          relative border-2 border-dashed rounded-lg p-6 transition-all
          flex flex-col items-center justify-center
          min-h-[200px] cursor-pointer
          ${isDragging 
            ? 'border-primary bg-primary/5' 
            : 'border-border hover:border-primary/50 hover:bg-secondary/50'
          }
          ${preview ? 'border-primary/40' : ''}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />
        
        {preview ? (
          <div className="relative w-full h-full flex flex-col items-center">
            <div className="absolute inset-0 flex items-center justify-center bg-black/5 rounded-md backdrop-blur-[1px] opacity-0 hover:opacity-100 transition-opacity">
              <span className="text-sm font-medium text-primary px-3 py-1 bg-white/80 rounded-md">
                Change template
              </span>
            </div>
            <img 
              src={preview} 
              alt="Certificate Template Preview" 
              className="max-h-[300px] max-w-full object-contain rounded shadow-sm"
            />
            <p className="mt-3 text-sm text-muted-foreground">
              Template uploaded. Click or drag to change.
            </p>
          </div>
        ) : (
          <>
            <svg
              className="w-12 h-12 text-muted-foreground mb-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="1.5"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
              ></path>
            </svg>
            <p className="text-base font-medium text-foreground">
              Upload Certificate Template
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Drag and drop or click to select
            </p>
            <p className="mt-2 text-xs text-muted-foreground">
              Supports PNG, JPG, JPEG (max 10MB)
            </p>
          </>
        )}
      </div>
    </div>
  );
};

export default TemplateUploader;
