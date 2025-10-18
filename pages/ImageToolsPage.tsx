import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import {
    Minimize2, Expand, Crop, RotateCcw, Droplets, ArrowLeft, Download, Image as ImageIcon
} from 'lucide-react';

// FIX: Specified a more detailed type for the icon to allow passing the 'size' prop.
type Tool = {
    key: string;
    icon: React.ReactElement<{ size?: number | string }>;
};

const allTools: Tool[] = [
    { key: 'compress', icon: <Minimize2 /> },
    { key: 'resize', icon: <Expand /> },
    { key: 'crop', icon: <Crop /> },
    { key: 'rotate', icon: <RotateCcw /> },
    { key: 'watermark', icon: <Droplets /> },
];

const downloadImage = (dataUrl: string, filename: string) => {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

// --- Helper component for interactive cropping ---
const ImageCropper: React.FC<{ file: File, onCrop: (blob: Blob) => void }> = ({ file, onCrop }) => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [crop, setCrop] = useState({ x: 50, y: 50, width: 200, height: 150 });
    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

    useEffect(() => {
        const img = new Image();
        img.src = URL.createObjectURL(file);
        img.onload = () => {
            setImage(img);
        };
        return () => URL.revokeObjectURL(img.src);
    }, [file]);

    useEffect(() => {
        if (!image || !canvasRef.current) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        canvas.width = image.width;
        canvas.height = image.height;
        ctx.drawImage(image, 0, 0);

        // Draw semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw the cropped area as clear
        ctx.clearRect(crop.x, crop.y, crop.width, crop.height);

        // Draw crop box border
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 2;
        ctx.strokeRect(crop.x, crop.y, crop.width, crop.height);
        
    }, [image, crop]);

    const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        if (x > crop.x && x < crop.x + crop.width && y > crop.y && y < crop.y + crop.height) {
            setIsDragging(true);
            setDragStart({ x: x - crop.x, y: y - crop.y });
        }
    };
    
    const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
        if (!isDragging) return;
        const rect = canvasRef.current!.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        setCrop(c => ({ ...c, x: x - dragStart.x, y: y - dragStart.y }));
    };

    const handleMouseUp = () => {
        setIsDragging(false);
    };
    
    const handleCrop = () => {
        if (!image) return;
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = crop.width;
        tempCanvas.height = crop.height;
        const ctx = tempCanvas.getContext('2d');
        if (!ctx) return;
        ctx.drawImage(image, crop.x, crop.y, crop.width, crop.height, 0, 0, crop.width, crop.height);
        tempCanvas.toBlob(blob => {
            if (blob) onCrop(blob);
        }, file.type);
    };

    return (
        <div className="space-y-4">
             <canvas
                ref={canvasRef}
                className="max-w-full h-auto cursor-move mx-auto border"
                onMouseDown={handleMouseDown}
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onMouseLeave={handleMouseUp}
            />
            <button onClick={handleCrop} className="w-full bg-secondary text-white font-bold py-2 px-4 rounded-md hover:opacity-90 transition-opacity">
                Crop Image
            </button>
        </div>
    );
};


const ImageToolsPage: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { t } = useLanguage();

    // Tool specific options
    const [compressQuality, setCompressQuality] = useState(0.8);
    const [resizeWidth, setResizeWidth] = useState(0);
    const [resizeHeight, setResizeHeight] = useState(0);
    const [maintainAspectRatio, setMaintainAspectRatio] = useState(true);
    const [originalAspectRatio, setOriginalAspectRatio] = useState(1);
    const [rotation, setRotation] = useState(0);
    const [watermarkText, setWatermarkText] = useState('SmartLife Hub');
    const [watermarkColor, setWatermarkColor] = useState('#ffffff');
    const [watermarkSize, setWatermarkSize] = useState(48);
    const [watermarkOpacity, setWatermarkOpacity] = useState(0.7);
    const [watermarkPosition, setWatermarkPosition] = useState('center');

    const resetState = useCallback(() => {
        setFile(null);
        setIsLoading(false);
        setStatus('');
        setError('');
        // Reset options
        setCompressQuality(0.8);
        setResizeWidth(0); setResizeHeight(0);
        setRotation(0);
        setWatermarkText('SmartLife Hub');
    }, []);

    const handleBack = useCallback(() => {
        setActiveTool(null);
        resetState();
    }, [resetState]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];
            setFile(selectedFile);
            setStatus('');
            setError('');
            
            const img = new Image();
            img.src = URL.createObjectURL(selectedFile);
            img.onload = () => {
                setResizeWidth(img.width);
                setResizeHeight(img.height);
                setOriginalAspectRatio(img.width / img.height);
                URL.revokeObjectURL(img.src);
            };
        }
    };
    
    const processImage = async () => {
        if (!file) {
            setError(t('imageTools.errors.noFile'));
            return;
        }
        setIsLoading(true);
        setStatus(t('imageTools.status.processing'));
        setError('');

        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        if (!ctx) {
            setError('Canvas context not available');
            setIsLoading(false);
            return;
        }

        const img = new Image();
        img.src = URL.createObjectURL(file);
        
        img.onload = () => {
            try {
                let targetWidth = img.width;
                let targetHeight = img.height;
                let filename = `${file.name.split('.')[0]}_processed.png`;

                switch (activeTool?.key) {
                    case 'compress':
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        canvas.toBlob(blob => {
                            if (blob) {
                                const originalSize = (file.size / 1024).toFixed(2);
                                const newSize = (blob.size / 1024).toFixed(2);
                                setStatus(t('imageTools.status.compressSuccess', { old: originalSize, new: newSize }));
                                downloadImage(URL.createObjectURL(blob), `${file.name.split('.')[0]}_compressed.jpg`);
                            }
                        }, 'image/jpeg', compressQuality);
                        filename = `${file.name.split('.')[0]}_compressed.jpg`;
                        break;
                    
                    case 'resize':
                        targetWidth = resizeWidth;
                        targetHeight = resizeHeight;
                        canvas.width = targetWidth;
                        canvas.height = targetHeight;
                        ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
                        filename = `${file.name.split('.')[0]}_resized.png`;
                        break;
                    
                    case 'rotate':
                        const angle = (rotation + 90) % 360;
                        setRotation(angle);
                        const rad = angle * Math.PI / 180;
                        if (angle === 90 || angle === 270) {
                            canvas.width = img.height;
                            canvas.height = img.width;
                        } else {
                            canvas.width = img.width;
                            canvas.height = img.height;
                        }
                        ctx.translate(canvas.width / 2, canvas.height / 2);
                        ctx.rotate(rad);
                        ctx.drawImage(img, -img.width / 2, -img.height / 2);
                        filename = `${file.name.split('.')[0]}_rotated.png`;
                        break;
                    
                    case 'watermark':
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0);
                        
                        ctx.font = `bold ${watermarkSize}px sans-serif`;
                        ctx.fillStyle = watermarkColor;
                        ctx.globalAlpha = watermarkOpacity;
                        
                        let x, y;
                        const textMetrics = ctx.measureText(watermarkText);
                        
                        switch(watermarkPosition) {
                            case 'topLeft': x = 20; y = watermarkSize; break;
                            case 'topRight': x = canvas.width - textMetrics.width - 20; y = watermarkSize; break;
                            case 'bottomLeft': x = 20; y = canvas.height - 20; break;
                            case 'bottomRight': x = canvas.width - textMetrics.width - 20; y = canvas.height - 20; break;
                            default: // center
                                x = (canvas.width - textMetrics.width) / 2;
                                y = canvas.height / 2;
                        }
                        ctx.fillText(watermarkText, x, y);
                        filename = `${file.name.split('.')[0]}_watermarked.png`;
                        break;
                    
                    default:
                        setError('Tool not implemented');
                        setIsLoading(false);
                        return;
                }
                
                if (activeTool?.key !== 'compress') {
                     const dataUrl = canvas.toDataURL(file.type);
                     downloadImage(dataUrl, filename);
                     setStatus(t('imageTools.status.success'));
                }
                setTimeout(() => handleBack(), 3000);

            } catch(e: any) {
                 console.error(e);
                 setError(`${t('imageTools.errors.generic')}: ${e.message}`);
            } finally {
                setIsLoading(false);
                URL.revokeObjectURL(img.src);
            }
        };
    };

    const handleCropProcess = (blob: Blob) => {
         const filename = `${file!.name.split('.')[0]}_cropped.png`;
         downloadImage(URL.createObjectURL(blob), filename);
         setStatus(t('imageTools.status.success'));
         setTimeout(() => handleBack(), 3000);
    }

    const renderToolUI = () => {
        if (!activeTool) return null;

        const acceptedFiles = 'image/jpeg,image/png,image/gif';
        
        const renderSpecificOptions = () => {
            switch (activeTool.key) {
                case 'compress':
                    return (
                        <div>
                           <label htmlFor="quality" className="block text-sm font-medium text-gray-700">{t('imageTools.compress.quality')} ({Math.round(compressQuality * 100)}%)</label>
                           <input type="range" id="quality" min="0.1" max="1" step="0.1" value={compressQuality} onChange={e => setCompressQuality(parseFloat(e.target.value))} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer" />
                        </div>
                    );
                case 'resize':
                    return (
                        <div className="space-y-4">
                            <div className="flex items-center gap-4">
                                <div>
                                    <label htmlFor="width" className="block text-sm font-medium text-gray-700">{t('imageTools.resize.width')}</label>
                                    <input type="number" id="width" value={resizeWidth} onChange={e => {
                                        const newWidth = parseInt(e.target.value) || 0;
                                        setResizeWidth(newWidth);
                                        if (maintainAspectRatio) setResizeHeight(Math.round(newWidth / originalAspectRatio));
                                    }} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label htmlFor="height" className="block text-sm font-medium text-gray-700">{t('imageTools.resize.height')}</label>
                                    <input type="number" id="height" value={resizeHeight} onChange={e => {
                                        const newHeight = parseInt(e.target.value) || 0;
                                        setResizeHeight(newHeight);
                                        if (maintainAspectRatio) setResizeWidth(Math.round(newHeight * originalAspectRatio));
                                    }} className="w-full p-2 border rounded" />
                                </div>
                            </div>
                            <div className="flex items-center">
                                <input type="checkbox" id="aspectRatio" checked={maintainAspectRatio} onChange={e => setMaintainAspectRatio(e.target.checked)} className="h-4 w-4 text-primary border-gray-300 rounded focus:ring-primary" />
                                <label htmlFor="aspectRatio" className="ms-2 block text-sm text-gray-900">{t('imageTools.resize.aspectRatio')}</label>
                            </div>
                        </div>
                    );
                case 'crop':
                    return <ImageCropper file={file!} onCrop={handleCropProcess} />;
                case 'watermark':
                    return (
                        <div className="space-y-4">
                             <input type="text" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} placeholder="Watermark text" className="w-full p-2 border rounded" />
                             <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label>Color</label>
                                    <input type="color" value={watermarkColor} onChange={e => setWatermarkColor(e.target.value)} className="w-full h-10 p-1 border rounded" />
                                </div>
                                <div>
                                    <label>Size</label>
                                    <input type="number" value={watermarkSize} onChange={e => setWatermarkSize(parseInt(e.target.value))} className="w-full p-2 border rounded" />
                                </div>
                                <div>
                                    <label>Opacity</label>
                                    <input type="range" min="0.1" max="1" step="0.1" value={watermarkOpacity} onChange={e => setWatermarkOpacity(parseFloat(e.target.value))} className="w-full"/>
                                </div>
                                <div>
                                    <label>Position</label>
                                    <select value={watermarkPosition} onChange={e => setWatermarkPosition(e.target.value)} className="w-full p-2 border rounded">
                                        <option value="center">Center</option>
                                        <option value="topLeft">Top Left</option>
                                        <option value="topRight">Top Right</option>
                                        <option value="bottomLeft">Bottom Left</option>
                                        <option value="bottomRight">Bottom Right</option>
                                    </select>
                                </div>
                             </div>
                        </div>
                    );
                default: return null;
            }
        };

        const showProcessButton = activeTool.key !== 'crop' && activeTool.key !== 'rotate';
        const showSimpleProcessButton = activeTool.key === 'rotate';

        return (
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                <button onClick={handleBack} className="flex items-center gap-2 text-primary hover:underline">
                    <ArrowLeft size={20} /> {t('imageTools.back')}
                </button>
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-dark">{t(`imageTools.tools.${activeTool.key}.title`)}</h2>
                    <p className="text-gray-medium">{t(`imageTools.tools.${activeTool.key}.description`)}</p>
                </div>
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept={acceptedFiles} />
                        <label htmlFor="file-upload" className="cursor-pointer bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors">
                           {t('imageTools.selectImage')}
                        </label>
                        <div className="mt-4 text-sm text-gray-500">
                           {file ? file.name : t('imageTools.dropFiles')}
                        </div>
                    </div>
                     {file && <img src={URL.createObjectURL(file)} alt="Preview" className="max-h-64 mx-auto rounded-md my-4" />}
                    {file && renderSpecificOptions()}
                    {error && <div className="text-red-500 text-center p-2 bg-red-50 rounded-md">{error}</div>}
                    {status && <div className="text-green-600 text-center p-2 bg-green-50 rounded-md">{status}</div>}

                    {showProcessButton && <button onClick={processImage} disabled={isLoading || !file} className="w-full bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                         {isLoading ? t('imageTools.status.processing') : <><Download size={20}/> {t('imageTools.processAndDownload')}</>}
                    </button>}
                    
                     {showSimpleProcessButton && <button onClick={processImage} disabled={isLoading || !file} className="w-full bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                         {t(`imageTools.tools.${activeTool.key}.title`)}
                    </button>}
                </div>
            </div>
        );
    };

    const renderToolGrid = () => (
        <div className="space-y-12">
            <div className="text-center">
                <h1 className="text-4xl font-extrabold text-gray-dark">{t('imageTools.title')}</h1>
                <p className="mt-2 text-lg text-gray-medium max-w-2xl mx-auto">{t('imageTools.description')}</p>
            </div>
            <div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {allTools.map((tool) => (
                        <button
                            key={tool.key}
                            onClick={() => setActiveTool(tool)}
                            className="text-start bg-white rounded-xl shadow-lg p-6 flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1"
                        >
                            <div className="flex items-center gap-4">
                                <div className="text-primary">{React.cloneElement(tool.icon, { size: 28 })}</div>
                                <h3 className="text-xl font-bold text-gray-dark">{t(`imageTools.tools.${tool.key}.title`)}</h3>
                            </div>
                            <p className="text-gray-medium flex-grow">{t(`imageTools.tools.${tool.key}.description`)}</p>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );

    return activeTool ? renderToolUI() : renderToolGrid();
};

export default ImageToolsPage;
