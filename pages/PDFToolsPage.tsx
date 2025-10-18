import React, { useState, useCallback, useRef, useEffect } from 'react';
import { PDFDocument, rgb, StandardFonts, degrees } from 'pdf-lib';
// FIX: Changed from namespace import to named imports for better type inference with pdfjs-dist.
import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { useLanguage } from '../contexts/LanguageContext';
import {
    Combine, Scissors, Minimize2, RefreshCw, FileText, FileImage, Shield, ShieldOff,
    RotateCcw, PenSquare, Droplets, SortAsc, ArrowLeft, Trash2, Download
} from 'lucide-react';

// FIX: Updated to use GlobalWorkerOptions from named import.
GlobalWorkerOptions.workerSrc = 'pdfjs-dist/build/pdf.worker.mjs';

type Tool = {
    key: string;
    icon: React.ReactElement<{ size?: number | string }>;
    category: 'Organize' | 'Optimize' | 'Convert' | 'Edit' | 'Security';
    isFunctional: boolean;
};

const allTools: Tool[] = [
    { key: 'merge', icon: <Combine />, category: 'Organize', isFunctional: true },
    { key: 'split', icon: <Scissors />, category: 'Organize', isFunctional: true },
    { key: 'organize', icon: <SortAsc />, category: 'Organize', isFunctional: true },
    { key: 'rotate', icon: <RotateCcw />, category: 'Organize', isFunctional: true },
    { key: 'compress', icon: <Minimize2 />, category: 'Optimize', isFunctional: true },
    { key: 'repair', icon: <FileText />, category: 'Optimize', isFunctional: false },
    { key: 'pdfToWord', icon: <RefreshCw />, category: 'Convert', isFunctional: false },
    { key: 'pdfToPowerpoint', icon: <RefreshCw />, category: 'Convert', isFunctional: false },
    { key: 'pdfToExcel', icon: <RefreshCw />, category: 'Convert', isFunctional: false },
    { key: 'wordToPdf', icon: <FileText />, category: 'Convert', isFunctional: false },
    { key: 'powerpointToPdf', icon: <FileImage />, category: 'Convert', isFunctional: false },
    { key: 'excelToPdf', icon: <FileImage />, category: 'Convert', isFunctional: false },
    { key: 'pdfToJpg', icon: <FileImage />, category: 'Convert', isFunctional: true },
    { key: 'jpgToPdf', icon: <FileImage />, category: 'Convert', isFunctional: true },
    { key: 'edit', icon: <PenSquare />, category: 'Edit', isFunctional: false },
    { key: 'sign', icon: <PenSquare />, category: 'Edit', isFunctional: true },
    { key: 'watermark', icon: <Droplets />, category: 'Edit', isFunctional: true },
    { key: 'protect', icon: <Shield />, category: 'Security', isFunctional: true },
    { key: 'unlock', icon: <ShieldOff />, category: 'Security', isFunctional: true },
];

const downloadFile = (blob: Blob, filename: string) => {
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
};

const PDFToolsPage: React.FC = () => {
    const [activeTool, setActiveTool] = useState<Tool | null>(null);
    const [files, setFiles] = useState<File[]>([]);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [status, setStatus] = useState<string>('');
    const [error, setError] = useState<string>('');
    const { t } = useLanguage();

    const [splitRange, setSplitRange] = useState('');
    const [password, setPassword] = useState('');
    const [watermarkText, setWatermarkText] = useState('CONFIDENTIAL');
    const [rotation, setRotation] = useState(90);
    const [pages, setPages] = useState<{ id: number, dataUrl: string }[]>([]);
    const dragItem = useRef<number | null>(null);
    const dragOverItem = useRef<number | null>(null);
    const sigCanvasRef = useRef<HTMLCanvasElement>(null);
    const [sigPad, setSigPad] = useState<any>(null);
    const isSigningRef = useRef(false);


    const resetState = useCallback(() => {
        setFiles([]);
        setIsLoading(false);
        setStatus('');
        setError('');
        setSplitRange('');
        setPassword('');
        setWatermarkText('CONFIDENTIAL');
        setRotation(90);
        setPages([]);
        if (sigPad) sigPad.clear();
    }, [sigPad]);

    const handleBack = useCallback(() => {
        setActiveTool(null);
        resetState();
    }, [resetState]);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            setFiles(Array.from(e.target.files));
            setStatus('');
            setError('');
        }
    };

    const loadPdf = async (file: File, filePassword?: string): Promise<PDFDocument | null> => {
        const arrayBuffer = await file.arrayBuffer();
        try {
            return await PDFDocument.load(arrayBuffer, { password: filePassword } as any);
        } catch (e: any) {
            if (e.message.includes('encrypted')) {
                 if (activeTool?.key !== 'unlock') {
                    setError(t('pdf.errors.isProtected'));
                 } else {
                     setError(t('pdf.errors.wrongPassword'));
                 }
            } else {
                 setError(t('pdf.errors.loadFailed', { name: file.name }));
            }
            return null;
        }
    };
    
    const renderPdfPreviews = useCallback(async (file: File) => {
        if (file.type !== 'application/pdf') return;
        setIsLoading(true);
        setStatus(t('pdf.status.genPreviews'));
        try {
            const arrayBuffer = await file.arrayBuffer();
            // FIX: Using getDocument from named import.
            const pdf = await getDocument(arrayBuffer).promise;
            const newPages = [];
            for (let i = 1; i <= pdf.numPages; i++) {
                const page = await pdf.getPage(i);
                const viewport = page.getViewport({ scale: 0.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                if (context) {
                    await page.render({ canvasContext: context, viewport: viewport }).promise;
                    newPages.push({ id: i, dataUrl: canvas.toDataURL() });
                }
            }
            setPages(newPages);
        } catch (e) {
            setError(t('pdf.errors.previewError'));
        } finally {
            setIsLoading(false);
            setStatus('');
        }
    }, [t]);

    useEffect(() => {
        if (activeTool?.key === 'organize' && files.length > 0) {
            renderPdfPreviews(files[0]);
        }
    }, [files, activeTool, renderPdfPreviews]);


    const processTool = async () => {
        if (files.length === 0) {
            setError(t('pdf.errors.noFile'));
            return;
        }
        setIsLoading(true);
        setStatus(t('pdf.status.processing'));
        setError('');

        try {
            let result: { blob: Blob, name: string }[] = [];

            switch (activeTool?.key) {
                case 'merge':
                    const mergedPdf = await PDFDocument.create();
                    for (const file of files) {
                        const pdf = await loadPdf(file);
                        if (!pdf) return;
                        const copiedPages = await mergedPdf.copyPages(pdf, pdf.getPageIndices());
                        copiedPages.forEach((page) => mergedPdf.addPage(page));
                    }
                    const mergedBytes = await mergedPdf.save();
                    result.push({ blob: new Blob([mergedBytes], { type: 'application/pdf' }), name: 'merged.pdf' });
                    break;

                case 'split':
                    if (!splitRange) { setError(t('pdf.errors.noRange')); return; }
                    const pdfToSplit = await loadPdf(files[0]);
                    if (!pdfToSplit) return;
                    const splitPdf = await PDFDocument.create();
                    const indices = splitRange.split(',').flatMap(range => {
                        if (range.includes('-')) {
                            const [start, end] = range.split('-').map(Number);
                            return Array.from({ length: end - start + 1 }, (_, i) => start + i - 1);
                        }
                        return [Number(range) - 1];
                    }).filter(index => index >= 0 && index < pdfToSplit.getPageCount());
                    const copiedPages = await splitPdf.copyPages(pdfToSplit, indices);
                    copiedPages.forEach(page => splitPdf.addPage(page));
                    const splitBytes = await splitPdf.save();
                    result.push({ blob: new Blob([splitBytes], { type: 'application/pdf' }), name: 'split.pdf' });
                    break;
                
                case 'organize':
                    const docToOrganize = await loadPdf(files[0]);
                    if (!docToOrganize) return;
                    const newDoc = await PDFDocument.create();
                    const pageIndices = pages.map(p => p.id - 1);
                    const organizedPages = await newDoc.copyPages(docToOrganize, pageIndices);
                    organizedPages.forEach(page => newDoc.addPage(page));
                    const organizedBytes = await newDoc.save();
                    result.push({ blob: new Blob([organizedBytes], { type: 'application/pdf' }), name: 'organized.pdf' });
                    break;

                case 'rotate':
                    const pdfToRotate = await loadPdf(files[0]);
                    if (!pdfToRotate) return;
                    pdfToRotate.getPages().forEach(page => page.setRotation(degrees(rotation)));
                    const rotatedBytes = await pdfToRotate.save();
                    result.push({ blob: new Blob([rotatedBytes], { type: 'application/pdf' }), name: 'rotated.pdf' });
                    break;
                
                case 'compress':
                    setStatus(t('pdf.status.compressNote'));
                    const pdfToCompress = await loadPdf(files[0]);
                    if (!pdfToCompress) return;
                    const compressedBytes = await pdfToCompress.save({ useObjectStreams: false });
                    result.push({ blob: new Blob([compressedBytes], { type: 'application/pdf' }), name: 'compressed.pdf' });
                    break;

                case 'pdfToJpg':
                    const arrayBuffer = await files[0].arrayBuffer();
                    // FIX: Using getDocument from named import.
                    const pdf = await getDocument(arrayBuffer).promise;
                    for (let i = 1; i <= pdf.numPages; i++) {
                        const page = await pdf.getPage(i);
                        const viewport = page.getViewport({ scale: 2.0 });
                        const canvas = document.createElement('canvas');
                        const context = canvas.getContext('2d');
                        canvas.height = viewport.height;
                        canvas.width = viewport.width;
                        if(context){
                            await page.render({ canvasContext: context, viewport }).promise;
                            const blob: Blob | null = await new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
                            if(blob) result.push({ blob, name: `page_${i}.jpg` });
                        }
                    }
                    setStatus(t('pdf.status.jpgSuccess', { count: pdf.numPages }));
                    break;

                case 'jpgToPdf':
                    const jpgPdf = await PDFDocument.create();
                    for(const file of files) {
                        const jpgBytes = await file.arrayBuffer();
                        const jpgImage = await jpgPdf.embedJpg(jpgBytes);
                        const page = jpgPdf.addPage([jpgImage.width, jpgImage.height]);
                        page.drawImage(jpgImage, { x: 0, y: 0, width: jpgImage.width, height: jpgImage.height });
                    }
                    const jpgPdfBytes = await jpgPdf.save();
                    result.push({ blob: new Blob([jpgPdfBytes], { type: 'application/pdf' }), name: 'converted.pdf' });
                    break;

                case 'watermark':
                    const pdfToWatermark = await loadPdf(files[0]);
                    if (!pdfToWatermark) return;
                    const font = await pdfToWatermark.embedFont(StandardFonts.Helvetica);
                    for(const page of pdfToWatermark.getPages()) {
                        const { width, height } = page.getSize();
                        page.drawText(watermarkText, {
                            x: width / 2 - 150, y: height / 2, font, size: 50,
                            color: rgb(0.75, 0.75, 0.75), opacity: 0.5, rotate: degrees(45),
                        });
                    }
                    const watermarkedBytes = await pdfToWatermark.save();
                    result.push({ blob: new Blob([watermarkedBytes], { type: 'application/pdf' }), name: 'watermarked.pdf' });
                    break;
                
                 case 'sign':
                    if (!sigCanvasRef.current || sigCanvasRef.current.toDataURL() === sigCanvasRef.current.dataset.blank) { 
                        setError(t('pdf.errors.noSignature')); return; 
                    }
                    const pdfToSign = await loadPdf(files[0]);
                    if (!pdfToSign) return;
                    const signatureImageBytes = await fetch(sigCanvasRef.current.toDataURL()).then(res => res.arrayBuffer());
                    const signatureImage = await pdfToSign.embedPng(signatureImageBytes);
                    const lastPage = pdfToSign.getPage(pdfToSign.getPageCount() - 1);
                    const { width } = lastPage.getSize();
                    lastPage.drawImage(signatureImage, { x: width - 170, y: 50, width: 150, height: 75 });
                    const signedBytes = await pdfToSign.save();
                    result.push({ blob: new Blob([signedBytes], { type: 'application/pdf' }), name: 'signed.pdf' });
                    break;

                case 'protect':
                    if (!password) { setError(t('pdf.errors.noPassword')); return; }
                    const pdfToProtect = await loadPdf(files[0]);
                    if (!pdfToProtect) return;
                    const protectOptions: any = { userPassword: password, ownerPassword: password };
                    const protectedBytes = await pdfToProtect.save(protectOptions);
                    result.push({ blob: new Blob([protectedBytes], { type: 'application/pdf' }), name: 'protected.pdf' });
                    break;

                case 'unlock':
                    if (!password) { setError(t('pdf.errors.noPassword')); return; }
                    const pdfToUnlock = await loadPdf(files[0], password);
                    if (!pdfToUnlock) return;
                    const unlockedBytes = await pdfToUnlock.save();
                    result.push({ blob: new Blob([unlockedBytes], { type: 'application/pdf' }), name: 'unlocked.pdf' });
                    break;

                default:
                    setError('Tool not implemented');
                    setIsLoading(false);
                    return;
            }

            if (result.length > 0) {
                result.forEach(file => downloadFile(file.blob, file.name));
                if (!status.startsWith('Successfully converted')) {
                    setStatus(t('pdf.status.success'));
                }
            } else if (!error && !status) {
                setStatus(t('pdf.status.noFileGenerated'));
            }

            setTimeout(() => handleBack(), 3000);

        } catch (e: any) {
            console.error(e);
            setError(`${t('pdf.errors.generic')}: ${e.message}`);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSort = () => {
        if (dragItem.current === null || dragOverItem.current === null) return;
        const newPages = [...pages];
        const dragItemContent = newPages.splice(dragItem.current, 1)[0];
        newPages.splice(dragOverItem.current, 0, dragItemContent);
        dragItem.current = null;
        dragOverItem.current = null;
        setPages(newPages);
    };

    useEffect(() => {
        if (activeTool?.key !== 'sign' || !sigCanvasRef.current) return;
        
        const canvas = sigCanvasRef.current;
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width;
        canvas.height = rect.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.strokeStyle = '#000000';
        ctx.lineWidth = 2;
        ctx.lineCap = 'round';

        canvas.dataset.blank = canvas.toDataURL();

        const getMousePos = (e: MouseEvent | TouchEvent) => {
            const rect = canvas.getBoundingClientRect();
            const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
            const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
            return {
                x: clientX - rect.left,
                y: clientY - rect.top
            };
        };

        const startSigning = (e: MouseEvent | TouchEvent) => {
            e.preventDefault();
            isSigningRef.current = true;
            const pos = getMousePos(e);
            ctx.beginPath();
            ctx.moveTo(pos.x, pos.y);
        };

        const draw = (e: MouseEvent | TouchEvent) => {
            if (!isSigningRef.current) return;
            e.preventDefault();
            const pos = getMousePos(e);
            ctx.lineTo(pos.x, pos.y);
            ctx.stroke();
        };
        
        const stopSigning = () => {
            if (isSigningRef.current) {
                ctx.closePath();
                isSigningRef.current = false;
            }
        };
        
        canvas.addEventListener('mousedown', startSigning);
        canvas.addEventListener('mousemove', draw);
        canvas.addEventListener('mouseup', stopSigning);
        canvas.addEventListener('mouseleave', stopSigning);

        canvas.addEventListener('touchstart', startSigning, { passive: false });
        canvas.addEventListener('touchmove', draw, { passive: false });
        canvas.addEventListener('touchend', stopSigning);

        const sigPadInstance = {
           clear: () => {
              ctx.clearRect(0, 0, canvas.width, canvas.height);
           }
        };
        setSigPad(sigPadInstance);
        
        return () => {
            canvas.removeEventListener('mousedown', startSigning);
            canvas.removeEventListener('mousemove', draw);
            canvas.removeEventListener('mouseup', stopSigning);
            canvas.removeEventListener('mouseleave', stopSigning);
            canvas.removeEventListener('touchstart', startSigning);
            canvas.removeEventListener('touchmove', draw);
            canvas.removeEventListener('touchend', stopSigning);
        };

    }, [activeTool?.key]);


    const renderToolUI = () => {
        if (!activeTool) return null;

        const acceptedFiles = activeTool.key === 'jpgToPdf' ? 'image/jpeg,image/jpg' : 'application/pdf';
        const multipleFiles = ['merge', 'jpgToPdf'].includes(activeTool.key);

        const renderSpecificOptions = () => {
            switch (activeTool.key) {
                case 'split':
                    return <input type="text" value={splitRange} onChange={e => setSplitRange(e.target.value)} placeholder={t('pdf.placeholders.split')} className="w-full p-2 border rounded" />;
                case 'rotate':
                    return (
                        <select value={rotation} onChange={e => setRotation(Number(e.target.value))} className="w-full p-2 border rounded">
                            <option value={90}>{t('pdf.rotate.90')}</option>
                            <option value={180}>{t('pdf.rotate.180')}</option>
                            <option value={270}>{t('pdf.rotate.270')}</option>
                        </select>
                    );
                case 'watermark':
                    return <input type="text" value={watermarkText} onChange={e => setWatermarkText(e.target.value)} className="w-full p-2 border rounded" />;
                case 'protect':
                case 'unlock':
                    return <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder={t('pdf.placeholders.password')} className="w-full p-2 border rounded" />;
                case 'organize':
                    return (
                         <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                            {pages.map((page, index) => (
                                <div key={page.id} draggable onDragStart={() => dragItem.current = index} onDragEnter={() => dragOverItem.current = index} onDragEnd={handleSort} onDragOver={(e) => e.preventDefault()} className="relative cursor-move border-2 border-transparent hover:border-primary">
                                    <img src={page.dataUrl} alt={`Page ${page.id}`} className="w-full h-auto rounded" />
                                    <div className="absolute top-1 start-1 bg-primary text-white rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold">{page.id}</div>
                                    <button onClick={() => setPages(p => p.filter(p_ => p_.id !== page.id))} className="absolute top-1 end-1 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center">
                                        <Trash2 size={14}/>
                                    </button>
                                </div>
                            ))}
                        </div>
                    );
                case 'sign':
                     return (
                        <div className="space-y-2">
                           <p className="text-center text-sm text-gray-500">{t('pdf.sign.instruction')}</p>
                           <canvas ref={sigCanvasRef} className="w-full h-48 bg-gray-100 border rounded-md cursor-crosshair touch-none"></canvas>
                           <button onClick={() => sigPad?.clear()} className="text-sm text-primary hover:underline">{t('pdf.sign.clear')}</button>
                        </div>
                     );
                default: return null;
            }
        };

        return (
            <div className="bg-white rounded-xl shadow-lg p-8 space-y-6">
                <button onClick={handleBack} className="flex items-center gap-2 text-primary hover:underline">
                    <ArrowLeft size={20} /> {t('pdf.back')}
                </button>
                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-dark">{t(`pdf.tools.${activeTool.key}.title`)}</h2>
                    <p className="text-gray-medium">{t(`pdf.tools.${activeTool.key}.description`)}</p>
                </div>
                <div className="space-y-4">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                        <input type="file" id="file-upload" className="hidden" onChange={handleFileChange} accept={acceptedFiles} multiple={multipleFiles} />
                        <label htmlFor="file-upload" className="cursor-pointer bg-primary text-white font-bold py-2 px-6 rounded-lg hover:bg-primary-dark transition-colors">
                            {acceptedFiles.startsWith('image') ? t('pdf.selectImages') : t('pdf.selectFiles')}
                        </label>
                        <div className="mt-4 text-sm text-gray-500">
                           {files.length > 0 ? `${files.length} file(s) selected` : t('pdf.dropFiles')}
                        </div>
                    </div>
                    {files.length > 0 && renderSpecificOptions()}
                    {error && <div className="text-red-500 text-center p-2 bg-red-50 rounded-md">{error}</div>}
                    {status && <div className="text-green-600 text-center p-2 bg-green-50 rounded-md">{status}</div>}

                    <button onClick={processTool} disabled={isLoading || files.length === 0} className="w-full bg-secondary text-white font-bold py-3 px-6 rounded-lg hover:opacity-90 transition-opacity disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                         {isLoading ? t('pdf.status.processing') : <><Download size={20}/> {t('pdf.processAndDownload')}</>}
                    </button>
                </div>
            </div>
        );
    };

    const renderToolGrid = () => {
        const categories = ['Organize', 'Optimize', 'Convert', 'Edit', 'Security'];
        return (
            <div className="space-y-12">
                <div className="text-center">
                    <h1 className="text-4xl font-extrabold text-gray-dark">{t('pdf.title')}</h1>
                    <p className="mt-2 text-lg text-gray-medium max-w-2xl mx-auto">{t('pdf.description')}</p>
                </div>
                {categories.map(category => (
                    <div key={category}>
                        <h2 className="text-2xl font-bold text-gray-dark mb-4">{t(`pdf.category.${category.toLowerCase()}`)}</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {allTools.filter(t => t.category === category).map((tool) => (
                                <button
                                    key={tool.key}
                                    onClick={() => tool.isFunctional && setActiveTool(tool)}
                                    disabled={!tool.isFunctional}
                                    className="text-start bg-white rounded-xl shadow-lg p-6 flex flex-col items-start gap-4 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="text-primary">{React.cloneElement(tool.icon, { size: 28 })}</div>
                                        <h3 className="text-xl font-bold text-gray-dark">{t(`pdf.tools.${tool.key}.title`)}</h3>
                                    </div>
                                    <p className="text-gray-medium flex-grow">{t(`pdf.tools.${tool.key}.description`)}</p>
                                    {!tool.isFunctional && (
                                        <div className="text-xs font-bold text-primary-dark bg-blue-100 px-2 py-1 rounded-full self-end">{t('pdf.comingSoon')}</div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        );
    };

    return activeTool ? renderToolUI() : renderToolGrid();
};

export default PDFToolsPage;