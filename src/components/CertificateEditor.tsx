
import { useState, useEffect, useRef } from 'react';
import { toast } from 'sonner';

interface TextPosition {
  x: number;
  y: number;
}

interface TextStyle {
  fontSize: number;
  fontFamily: string;
  color: string;
  textAlign: CanvasTextAlign;
  fontWeight?: string;
  letterSpacing?: number;
  rotation?: number;
  opacity?: number;
  textShadow?: boolean;
}

interface CertificateEditorProps {
  templateFile: File | null;
  sampleName: string;
  onPositionChange: (position: TextPosition) => void;
  onStyleChange: (style: TextStyle) => void;
}

const CertificateEditor = ({ 
  templateFile, 
  sampleName,
  onPositionChange,
  onStyleChange
}: CertificateEditorProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  
  const [position, setPosition] = useState<TextPosition>({ x: 400, y: 300 });
  const [textStyle, setTextStyle] = useState<TextStyle>({
    fontSize: 36,
    fontFamily: 'Playfair Display, serif',
    color: '#000000',
    textAlign: 'center',
    fontWeight: '400',
    letterSpacing: 0,
    rotation: 0,
    opacity: 100,
    textShadow: false
  });
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [scale, setScale] = useState(1);

  // Create image from template file
  useEffect(() => {
    if (!templateFile) return;

    const img = new Image();
    img.onload = () => {
      setImage(img);
      
      // Set initial position to center of image
      setPosition({
        x: img.width / 2,
        y: img.height / 2
      });
      
      // Notify parent components of initial position and style
      onPositionChange({ x: img.width / 2, y: img.height / 2 });
      onStyleChange(textStyle);
    };
    img.src = URL.createObjectURL(templateFile);

    return () => {
      URL.revokeObjectURL(img.src);
    };
  }, [templateFile]);

  // Redraw canvas when image, position, or style changes
  useEffect(() => {
    if (!image || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas dimensions to match image
    canvas.width = image.width;
    canvas.height = image.height;

    // Calculate scale to fit canvas in container
    if (containerRef.current) {
      const containerWidth = containerRef.current.clientWidth;
      const newScale = Math.min(1, containerWidth / image.width);
      setScale(newScale);
      
      // Apply scale for display only (not affecting actual canvas dimensions)
      canvas.style.width = `${image.width * newScale}px`;
      canvas.style.height = `${image.height * newScale}px`;
    }

    // Draw the image
    ctx.drawImage(image, 0, 0);

    // Save context state
    ctx.save();

    // Apply transformations
    ctx.translate(position.x, position.y);
    ctx.rotate(((textStyle.rotation || 0) * Math.PI) / 180);

    // Apply text styles
    ctx.font = `${textStyle.fontWeight || '400'} ${textStyle.fontSize}px ${textStyle.fontFamily}`;
    ctx.fillStyle = textStyle.color;
    ctx.textAlign = textStyle.textAlign;
    ctx.globalAlpha = (textStyle.opacity || 100) / 100;

    // Apply letter spacing by drawing each character
    if ((textStyle.letterSpacing || 0) !== 0) {
      const chars = sampleName.split('');
      let xOffset = 0;
      const letterSpacing = textStyle.letterSpacing || 0;

      if (textStyle.textAlign === 'center') {
        const totalWidth = ctx.measureText(sampleName).width + (letterSpacing * (chars.length - 1));
        xOffset = -totalWidth / 2;
      } else if (textStyle.textAlign === 'right') {
        const totalWidth = ctx.measureText(sampleName).width + (letterSpacing * (chars.length - 1));
        xOffset = -totalWidth;
      }

      // Apply text shadow
      if (textStyle.textShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      chars.forEach((char) => {
        ctx.fillText(char, xOffset, 0);
        xOffset += ctx.measureText(char).width + letterSpacing;
      });
    } else {
      // Apply text shadow
      if (textStyle.textShadow) {
        ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
        ctx.shadowBlur = 4;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
      }

      ctx.fillText(sampleName, 0, 0);
    }

    // Restore context state
    ctx.restore();
    
    // Draw position indicator (crosshair)
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(220, 20, 60, 0.8)';
    ctx.lineWidth = 1;
    
    // Horizontal line
    ctx.moveTo(position.x - 10, position.y);
    ctx.lineTo(position.x + 10, position.y);
    
    // Vertical line
    ctx.moveTo(position.x, position.y - 10);
    ctx.lineTo(position.x, position.y + 10);
    
    ctx.stroke();

  }, [image, position, textStyle, sampleName, scale]);

  // Handle mouse events for dragging
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    isDraggingRef.current = true;
    
    // Get canvas element
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate actual position considering scaling
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    updatePosition(x, y);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingRef.current || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    
    // Calculate actual position considering scaling
    const x = (e.clientX - rect.left) / scale;
    const y = (e.clientY - rect.top) / scale;
    
    updatePosition(x, y);
  };

  const handleMouseUp = () => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      toast.success('Text position updated', { duration: 1500 });
    }
  };

  const updatePosition = (x: number, y: number) => {
    const newPosition = { x, y };
    setPosition(newPosition);
    onPositionChange(newPosition);
  };

  const handleFontSizeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const fontSize = parseInt(e.target.value);
    updateStyle({ fontSize });
  };

  const handleFontFamilyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    updateStyle({ fontFamily: e.target.value });
  };

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateStyle({ color: e.target.value });
  };

  const handleAlignmentChange = (alignment: CanvasTextAlign) => {
    updateStyle({ textAlign: alignment });
  };

  const updateStyle = (newStyleProps: Partial<TextStyle>) => {
    const newStyle = { ...textStyle, ...newStyleProps };
    setTextStyle(newStyle);
    onStyleChange(newStyle);
  };

  if (!templateFile) {
    return (
      <div className="animate-fade-in flex items-center justify-center border rounded-lg bg-muted/20 p-8 w-full min-h-[300px]">
        <p className="text-muted-foreground text-sm">
          Upload a certificate template to begin editing
        </p>
      </div>
    );
  }

  return (
    <div className="animate-fade-in space-y-6 w-full">
      <div className="space-y-4">
        <div className="flex flex-wrap gap-4">
          <div className="space-y-2 min-w-[150px]">
            <label className="text-xs font-medium">Font Size</label>
            <input
              type="range"
              min="12"
              max="100"
              value={textStyle.fontSize}
              onChange={handleFontSizeChange}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>12px</span>
              <span>{textStyle.fontSize}px</span>
              <span>100px</span>
            </div>
          </div>
          
          <div className="space-y-2 min-w-[180px]">
            <label className="text-xs font-medium">Font Family</label>
            <select
              value={textStyle.fontFamily}
              onChange={handleFontFamilyChange}
              className="w-full px-3 py-2 text-sm rounded-md border bg-transparent input-focus"
              style={{ fontFamily: textStyle.fontFamily }}
            >
              <optgroup label="Elegant Serif">
                <option value="Playfair Display, serif" style={{ fontFamily: 'Playfair Display' }}>Playfair Display</option>
                <option value="Cinzel, serif" style={{ fontFamily: 'Cinzel' }}>Cinzel</option>
                <option value="Merriweather, serif" style={{ fontFamily: 'Merriweather' }}>Merriweather</option>
                <option value="EB Garamond, serif" style={{ fontFamily: 'EB Garamond' }}>EB Garamond</option>
                <option value="Cormorant Garamond, serif" style={{ fontFamily: 'Cormorant Garamond' }}>Cormorant Garamond</option>
                <option value="Crimson Text, serif" style={{ fontFamily: 'Crimson Text' }}>Crimson Text</option>
                <option value="Abril Fatface, serif" style={{ fontFamily: 'Abril Fatface' }}>Abril Fatface</option>
              </optgroup>
              <optgroup label="Modern Sans-Serif">
                <option value="Montserrat, sans-serif" style={{ fontFamily: 'Montserrat' }}>Montserrat</option>
                <option value="Poppins, sans-serif" style={{ fontFamily: 'Poppins' }}>Poppins</option>
                <option value="Raleway, sans-serif" style={{ fontFamily: 'Raleway' }}>Raleway</option>
                <option value="Open Sans, sans-serif" style={{ fontFamily: 'Open Sans' }}>Open Sans</option>
                <option value="Lato, sans-serif" style={{ fontFamily: 'Lato' }}>Lato</option>
                <option value="Roboto, sans-serif" style={{ fontFamily: 'Roboto' }}>Roboto</option>
              </optgroup>
              <optgroup label="Bold & Impactful">
                <option value="Bebas Neue, sans-serif" style={{ fontFamily: 'Bebas Neue' }}>Bebas Neue</option>
                <option value="Oswald, sans-serif" style={{ fontFamily: 'Oswald' }}>Oswald</option>
                <option value="Impact, sans-serif" style={{ fontFamily: 'Impact' }}>Impact</option>
              </optgroup>
              <optgroup label="Script & Handwriting">
                <option value="Great Vibes, cursive" style={{ fontFamily: 'Great Vibes' }}>Great Vibes</option>
                <option value="Dancing Script, cursive" style={{ fontFamily: 'Dancing Script' }}>Dancing Script</option>
                <option value="Pacifico, cursive" style={{ fontFamily: 'Pacifico' }}>Pacifico</option>
                <option value="Lobster, cursive" style={{ fontFamily: 'Lobster' }}>Lobster</option>
                <option value="Satisfy, cursive" style={{ fontFamily: 'Satisfy' }}>Satisfy</option>
              </optgroup>
              <optgroup label="Classic">
                <option value="Georgia, serif">Georgia</option>
                <option value="Times New Roman, serif">Times New Roman</option>
                <option value="Arial, sans-serif">Arial</option>
                <option value="Verdana, sans-serif">Verdana</option>
              </optgroup>
            </select>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">Text Color</label>
            <div className="flex items-center space-x-2">
              <input
                type="color"
                value={textStyle.color}
                onChange={handleColorChange}
                className="w-8 h-8 rounded cursor-pointer"
              />
              <input
                type="text"
                value={textStyle.color}
                onChange={(e) => updateStyle({ color: e.target.value })}
                className="w-24 px-2 py-1 text-sm border rounded-md bg-transparent input-focus"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-xs font-medium">Text Alignment</label>
            <div className="flex space-x-1">
              <button
                onClick={() => handleAlignmentChange('left')}
                className={`p-2 rounded-md ${
                  textStyle.textAlign === 'left' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <line x1="3" x2="12" y1="12" y2="12" />
                  <line x1="3" x2="16" y1="18" y2="18" />
                </svg>
              </button>
              <button
                onClick={() => handleAlignmentChange('center')}
                className={`p-2 rounded-md ${
                  textStyle.textAlign === 'center'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <line x1="8" x2="16" y1="12" y2="12" />
                  <line x1="6" x2="18" y1="18" y2="18" />
                </svg>
              </button>
              <button
                onClick={() => handleAlignmentChange('right')}
                className={`p-2 rounded-md ${
                  textStyle.textAlign === 'right'
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
                }`}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="3" x2="21" y1="6" y2="6" />
                  <line x1="12" x2="21" y1="12" y2="12" />
                  <line x1="8" x2="21" y1="18" y2="18" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4 pt-4 border-t">
          <div className="space-y-2 min-w-[150px]">
            <label className="text-xs font-medium">Font Weight</label>
            <select
              value={textStyle.fontWeight || '400'}
              onChange={(e) => updateStyle({ fontWeight: e.target.value })}
              className="w-full px-3 py-1 text-sm rounded-md border bg-transparent input-focus"
            >
              <option value="100">Thin (100)</option>
              <option value="200">Extra Light (200)</option>
              <option value="300">Light (300)</option>
              <option value="400">Regular (400)</option>
              <option value="500">Medium (500)</option>
              <option value="600">Semi Bold (600)</option>
              <option value="700">Bold (700)</option>
              <option value="800">Extra Bold (800)</option>
              <option value="900">Black (900)</option>
            </select>
          </div>

          <div className="space-y-2 min-w-[150px]">
            <label className="text-xs font-medium">Letter Spacing</label>
            <input
              type="range"
              min="-5"
              max="20"
              value={textStyle.letterSpacing || 0}
              onChange={(e) => updateStyle({ letterSpacing: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-5</span>
              <span>{textStyle.letterSpacing || 0}px</span>
              <span>20</span>
            </div>
          </div>

          <div className="space-y-2 min-w-[150px]">
            <label className="text-xs font-medium">Rotation</label>
            <input
              type="range"
              min="-45"
              max="45"
              value={textStyle.rotation || 0}
              onChange={(e) => updateStyle({ rotation: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>-45°</span>
              <span>{textStyle.rotation || 0}°</span>
              <span>45°</span>
            </div>
          </div>

          <div className="space-y-2 min-w-[150px]">
            <label className="text-xs font-medium">Opacity</label>
            <input
              type="range"
              min="10"
              max="100"
              value={textStyle.opacity || 100}
              onChange={(e) => updateStyle({ opacity: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>10%</span>
              <span>{textStyle.opacity || 100}%</span>
              <span>100%</span>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-medium">Text Effects</label>
            <button
              onClick={() => updateStyle({ textShadow: !textStyle.textShadow })}
              className={`px-4 py-2 rounded-md text-sm transition-all ${
                textStyle.textShadow
                  ? 'bg-primary text-primary-foreground shadow-lg'
                  : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
              }`}
            >
              {textStyle.textShadow ? '✓ Shadow On' : 'Shadow Off'}
            </button>
          </div>
        </div>
      </div>
      
      <div className="w-full overflow-hidden rounded-lg border bg-card shadow-sm" ref={containerRef}>
        <div className="relative p-1 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABQAAAAUCAYAAACNiR0NAAAACXBIWXMAAAsTAAALEwEAmpwYAAAAIGNIUk0AAHolAACAgwAA+f8AAIDpAAB1MAAA6mAAADqYAAAXb5JfxUYAAAAmSURBVHjaYvz//z8DLQETA5XBqIGjBo4aOGrgqIGjBg5bAwEghKPl0DEUkwAAAABJRU5ErkJggg==')]">
          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            className="block cursor-crosshair mx-auto"
          />
          <div className="absolute bottom-2 right-2 p-1.5 bg-black/50 text-white text-xs rounded">
            <span>
              x: {Math.round(position.x)}, y: {Math.round(position.y)}
            </span>
          </div>
        </div>
      </div>
      
      <div className="text-xs text-muted-foreground bg-muted/30 p-3 rounded-md">
        <p className="font-medium mb-1">How to position the text:</p>
        <ul className="list-disc pl-5 space-y-1">
          <li>Click or drag anywhere on the certificate to position the text</li>
          <li>Adjust font size, family, color and alignment using the controls above</li>
          <li>The sample name shows how your text will appear on certificates</li>
        </ul>
      </div>
    </div>
  );
};

export default CertificateEditor;
