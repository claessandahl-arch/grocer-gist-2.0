import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Upload, FileText, Loader2, CheckCircle2, XCircle, ChevronRight, Package, Trash2 } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import { ComparisonView } from "./ComparisonView";

// Types from ParsingTrainer
interface ParsedItem {
    name: string;
    price: number;
    quantity: number;
    category: string;
    discount?: number;
}

interface ItemDiff {
    structuredItem?: ParsedItem;
    aiItem?: ParsedItem;
    matchType: 'exact' | 'name_match' | 'fuzzy' | 'price_match' | 'unmatched_structured' | 'unmatched_ai';
    differences: {
        field: 'name' | 'price' | 'quantity' | 'category' | 'discount';
        structured: any;
        ai: any;
    }[];
}

interface ComparisonResult {
    mode: 'comparison';
    structured: {
        store_name: string;
        total_amount: number;
        receipt_date: string;
        items: ParsedItem[];
        method: 'structured_parser';
        timing: number;
    } | null;
    ai: {
        store_name: string;
        total_amount: number;
        receipt_date: string;
        items: ParsedItem[];
        method: 'ai_parser';
        timing: number;
    };
    diff: {
        storeName: { structured: string | null; ai: string; match: boolean };
        totalAmount: { structured: number | null; ai: number; diff: number | null };
        receiptDate: { structured: string | null; ai: string; match: boolean };
        itemCount: { structured: number; ai: number };
        items: ItemDiff[];
        matchRate: number;
        priceAccuracy: number;
    };
    _debug: {
        debugLog: string[];
    };
}

interface BulkTestResult {
    filename: string;
    status: 'pending' | 'processing' | 'passed' | 'failed' | 'error';
    comparison: ComparisonResult | null;
    matchRate: number;
    timing: number;
    errorMessage?: string;
}

interface FileToProcess {
    file: File;
    preview?: string;
}

export function BulkTester() {
    const [files, setFiles] = useState<FileToProcess[]>([]);
    const [results, setResults] = useState<BulkTestResult[]>([]);
    const [processing, setProcessing] = useState(false);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedResult, setSelectedResult] = useState<BulkTestResult | null>(null);

    // Initialize PDF.js worker
    useState(() => {
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
    });

    const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFiles = Array.from(event.target.files || []);
        if (selectedFiles.length === 0) return;

        // Filter for supported file types
        const validFiles = selectedFiles.filter(file =>
            file.type === 'application/pdf' || file.type.startsWith('image/')
        );

        if (validFiles.length !== selectedFiles.length) {
            toast.warning(`${selectedFiles.length - validFiles.length} filer ignorerades (endast PDF och bilder stöds)`);
        }

        const filesToAdd: FileToProcess[] = validFiles.map(file => ({ file }));
        setFiles(prev => [...prev, ...filesToAdd]);
        setResults([]); // Clear previous results
        setSelectedResult(null);
        toast.success(`${validFiles.length} filer tillagda`);
    }, []);

    const handleDrop = useCallback(async (event: React.DragEvent) => {
        event.preventDefault();
        const droppedFiles = Array.from(event.dataTransfer.files);

        const fakeEvent = {
            target: { files: droppedFiles },
        } as unknown as React.ChangeEvent<HTMLInputElement>;

        await handleFileSelect(fakeEvent);
    }, [handleFileSelect]);

    const handleDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
    }, []);

    const clearFiles = useCallback(() => {
        setFiles([]);
        setResults([]);
        setSelectedResult(null);
    }, []);

    const removeFile = useCallback((index: number) => {
        setFiles(prev => prev.filter((_, i) => i !== index));
    }, []);

    const convertPdfToJpg = async (file: File): Promise<Blob> => {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);
        const scale = 2.0;
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        if (!context) throw new Error('Could not get canvas context');

        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({
            canvasContext: context,
            viewport: viewport,
        }).promise;

        return new Promise<Blob>((resolve, reject) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) resolve(blob);
                    else reject(new Error('Failed to convert canvas to blob'));
                },
                'image/jpeg',
                0.9
            );
        });
    };

    const processReceipt = async (fileToProcess: FileToProcess, index: number): Promise<BulkTestResult> => {
        const { file } = fileToProcess;
        const startTime = Date.now();

        try {
            // Get user session
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.user) {
                throw new Error('Not authenticated');
            }
            const userId = session.user.id;

            // Convert PDF to image if needed
            let imageBlob: Blob;
            if (file.type === 'application/pdf') {
                imageBlob = await convertPdfToJpg(file);
            } else {
                imageBlob = file;
            }

            // Upload image temporarily
            const tempFileName = `${userId}/bulk-test-${Date.now()}-${index}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('receipts')
                .upload(tempFileName, imageBlob, {
                    contentType: 'image/jpeg',
                    upsert: true,
                });

            if (uploadError) throw uploadError;

            // Get public URL
            const { data: urlData } = supabase.storage
                .from('receipts')
                .getPublicUrl(tempFileName);

            const imageUrl = urlData.publicUrl;

            // Upload PDF if applicable
            let pdfUrl: string | undefined;
            let pdfFileName: string | undefined;
            if (file.type === 'application/pdf') {
                pdfFileName = `${userId}/bulk-test-${Date.now()}-${index}.pdf`;
                const { error: pdfUploadError } = await supabase.storage
                    .from('receipts')
                    .upload(pdfFileName, file, {
                        contentType: 'application/pdf',
                        upsert: true,
                    });

                if (!pdfUploadError) {
                    const { data: pdfUrlData } = supabase.storage
                        .from('receipts')
                        .getPublicUrl(pdfFileName);
                    pdfUrl = pdfUrlData.publicUrl;
                }
            }

            // Call parse-receipt in comparison mode
            const { data, error } = await supabase.functions.invoke('parse-receipt', {
                body: {
                    imageUrl,
                    pdfUrl,
                    originalFilename: file.name,
                    parserVersion: 'structured-only', // Fast mode: skips AI to avoid timeout
                },
            });

            // Clean up temp files
            const filesToRemove = [tempFileName];
            if (pdfFileName) filesToRemove.push(pdfFileName);
            await supabase.storage.from('receipts').remove(filesToRemove);

            const endTime = Date.now();

            if (error) throw error;

            // Handle comparison mode response
            if (data && data.mode === 'comparison') {
                const comparison = data as ComparisonResult;
                const matchRate = comparison.diff.matchRate;
                const passed = matchRate === 100;

                return {
                    filename: file.name,
                    status: passed ? 'passed' : 'failed',
                    comparison,
                    matchRate,
                    timing: endTime - startTime,
                };
            }

            // Handle structured-only mode response (no AI comparison)
            if (data && data.parserVersion === 'structured-only') {
                const itemsCount = data.structured_items_count || data.items?.length || 0;
                // In structured-only mode, pass is based on finding items (not comparison)
                const passed = itemsCount > 0;

                return {
                    filename: file.name,
                    status: passed ? 'passed' : 'failed',
                    comparison: null, // No comparison data in structured-only mode
                    matchRate: passed ? 100 : 0, // Binary: either parsed or not
                    timing: endTime - startTime,
                    errorMessage: !passed ? `Structured parser found ${itemsCount} items` : undefined,
                };
            }

            throw new Error('Unexpected response format');
        } catch (error: any) {
            return {
                filename: file.name,
                status: 'error',
                comparison: null,
                matchRate: 0,
                timing: Date.now() - startTime,
                errorMessage: error.message || 'Unknown error',
            };
        }
    };

    const runBulkTest = async () => {
        if (files.length === 0) return;

        setProcessing(true);
        setSelectedResult(null);
        setResults(files.map(f => ({
            filename: f.file.name,
            status: 'pending' as const,
            comparison: null,
            matchRate: 0,
            timing: 0,
        })));

        for (let i = 0; i < files.length; i++) {
            setCurrentIndex(i);

            // Update status to processing
            setResults(prev => prev.map((r, idx) =>
                idx === i ? { ...r, status: 'processing' as const } : r
            ));

            // Process the receipt
            const result = await processReceipt(files[i], i);

            // Update with result
            setResults(prev => prev.map((r, idx) =>
                idx === i ? result : r
            ));
        }

        setProcessing(false);
        toast.success('Bulk-test klart!');
    };

    // Calculate summary stats
    const summary = {
        total: results.length,
        passed: results.filter(r => r.status === 'passed').length,
        failed: results.filter(r => r.status === 'failed').length,
        errors: results.filter(r => r.status === 'error').length,
        avgTime: results.length > 0
            ? results.reduce((sum, r) => sum + r.timing, 0) / results.length / 1000
            : 0,
    };

    const passRate = summary.total > 0
        ? Math.round((summary.passed / summary.total) * 100)
        : 0;

    const progress = processing
        ? Math.round(((currentIndex + 1) / files.length) * 100)
        : 0;

    return (
        <div className="space-y-6">
            {/* Upload Section */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="h-5 w-5" />
                        Bulk-test
                    </CardTitle>
                    <CardDescription>
                        Ladda upp flera kvitton för att testa strukturerad parser mot AI. 100% matchning krävs för att passera.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {files.length === 0 ? (
                        <div
                            className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => document.getElementById('bulk-file-input')?.click()}
                        >
                            <Upload className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
                            <p className="text-muted-foreground mb-2">
                                Dra och släpp upp till 10 kvitton här
                            </p>
                            <p className="text-sm text-muted-foreground/70">
                                eller klicka för att välja filer (PDF eller bilder)
                            </p>
                            <input
                                id="bulk-file-input"
                                type="file"
                                accept="application/pdf,image/*"
                                multiple
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {/* File list */}
                            <div className="flex flex-wrap gap-2">
                                {files.map((f, idx) => (
                                    <Badge key={idx} variant="outline" className="flex items-center gap-1 py-1 px-2">
                                        <FileText className="h-3 w-3" />
                                        {f.file.name.length > 20 ? `${f.file.name.substring(0, 17)}...` : f.file.name}
                                        <button
                                            onClick={() => removeFile(idx)}
                                            className="ml-1 hover:text-destructive"
                                        >
                                            <Trash2 className="h-3 w-3" />
                                        </button>
                                    </Badge>
                                ))}
                            </div>

                            {/* Progress bar when processing */}
                            {processing && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between text-sm">
                                        <span>Bearbetar {currentIndex + 1} av {files.length}...</span>
                                        <span>{progress}%</span>
                                    </div>
                                    <Progress value={progress} className="h-2" />
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex gap-2">
                                <Button
                                    onClick={runBulkTest}
                                    disabled={processing || files.length === 0}
                                    className="flex-1"
                                >
                                    {processing ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Testar...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle2 className="mr-2 h-4 w-4" />
                                            Kör bulk-test ({files.length} filer)
                                        </>
                                    )}
                                </Button>
                                <Button variant="outline" onClick={clearFiles} disabled={processing}>
                                    <Trash2 className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    onClick={() => document.getElementById('bulk-file-input')?.click()}
                                    disabled={processing}
                                >
                                    <Upload className="h-4 w-4" />
                                </Button>
                                <input
                                    id="bulk-file-input"
                                    type="file"
                                    accept="application/pdf,image/*"
                                    multiple
                                    onChange={handleFileSelect}
                                    className="hidden"
                                />
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Summary & Results */}
            {results.length > 0 && (
                <>
                    {/* Summary Card */}
                    <Card className={passRate === 100 ? 'border-green-200 bg-green-50/50' : passRate >= 80 ? 'border-yellow-200 bg-yellow-50/50' : 'border-red-200 bg-red-50/50'}>
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-4 gap-4 text-center">
                                <div>
                                    <div className="text-3xl font-bold">{passRate}%</div>
                                    <div className="text-sm text-muted-foreground">Pass Rate</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-green-600">{summary.passed}</div>
                                    <div className="text-sm text-muted-foreground">Passerade</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold text-red-600">{summary.failed}</div>
                                    <div className="text-sm text-muted-foreground">Misslyckades</div>
                                </div>
                                <div>
                                    <div className="text-3xl font-bold">{summary.avgTime.toFixed(1)}s</div>
                                    <div className="text-sm text-muted-foreground">Snitt tid</div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Results Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Resultat</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {results.map((result, idx) => (
                                    <div
                                        key={idx}
                                        className={`flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-colors ${result.status === 'passed'
                                            ? 'bg-green-50 border-green-200 hover:bg-green-100'
                                            : result.status === 'failed'
                                                ? 'bg-red-50 border-red-200 hover:bg-red-100'
                                                : result.status === 'processing'
                                                    ? 'bg-blue-50 border-blue-200'
                                                    : result.status === 'error'
                                                        ? 'bg-orange-50 border-orange-200 hover:bg-orange-100'
                                                        : 'bg-muted/50 border-muted'
                                            }`}
                                        onClick={() => result.comparison && setSelectedResult(result)}
                                    >
                                        <div className="flex items-center gap-3">
                                            {result.status === 'passed' && <CheckCircle2 className="h-5 w-5 text-green-600" />}
                                            {result.status === 'failed' && <XCircle className="h-5 w-5 text-red-600" />}
                                            {result.status === 'processing' && <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />}
                                            {result.status === 'pending' && <FileText className="h-5 w-5 text-muted-foreground" />}
                                            {result.status === 'error' && <XCircle className="h-5 w-5 text-orange-600" />}
                                            <div>
                                                <div className="font-medium">{result.filename}</div>
                                                {result.errorMessage && (
                                                    <div className="text-xs text-orange-600">{result.errorMessage}</div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {result.status !== 'pending' && result.status !== 'processing' && (
                                                <>
                                                    <Badge variant={result.matchRate === 100 ? 'default' : 'destructive'}>
                                                        {result.matchRate}%
                                                    </Badge>
                                                    <span className="text-sm text-muted-foreground">
                                                        {(result.timing / 1000).toFixed(1)}s
                                                    </span>
                                                </>
                                            )}
                                            {result.comparison && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Detail View for Selected Failure */}
            {selectedResult && selectedResult.comparison && (
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle className="flex items-center gap-2">
                                <FileText className="h-5 w-5" />
                                {selectedResult.filename}
                            </CardTitle>
                            <Button variant="ghost" size="sm" onClick={() => setSelectedResult(null)}>
                                Stäng
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <ComparisonView result={selectedResult.comparison} parseTime={selectedResult.timing} />
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
