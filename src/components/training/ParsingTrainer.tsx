import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Upload, FileText, Loader2, RefreshCw, Trash2, CheckCircle2, AlertCircle, Zap, Brain, FlaskConical } from "lucide-react";
import * as pdfjsLib from 'pdfjs-dist';
import { categories, categoryNames } from "@/lib/categoryConstants";

type ParserVersion = 'current' | 'experimental' | 'ai_only';

interface ParsedItem {
  name: string;
  price: number;
  quantity: number;
  category: string;
  discount?: number;
}

interface ParseResult {
  store_name: string;
  total_amount: number;
  receipt_date: string;
  items: ParsedItem[];
  _debug?: {
    method: 'structured_parser' | 'ai_parser';
    parserVersion?: ParserVersion;
    debugLog?: string[];
    pdfTextLength?: number;
    parsingTime?: number;
  };
}

interface UploadedFile {
  name: string;
  preview: string;
  blob: Blob;
  originalFile: File;
}

export function ParsingTrainer() {
  const [uploadedFile, setUploadedFile] = useState<UploadedFile | null>(null);
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [parsing, setParsing] = useState(false);
  const [parseResult, setParseResult] = useState<ParseResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parseTime, setParseTime] = useState<number | null>(null);
  const [parserVersion, setParserVersion] = useState<ParserVersion>('current');

  // Initialize PDF.js worker
  useState(() => {
    pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;
  });

  const convertPdfToJpg = async (file: File): Promise<{ blob: Blob; preview: string }> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    
    // Just get first page for training preview
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

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error('Failed to convert canvas to blob'));
        },
        'image/jpeg',
        0.9
      );
    });

    const preview = URL.createObjectURL(blob);
    return { blob, preview };
  };

  const handleFileSelect = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Clear previous results
    setParseResult(null);
    setParseError(null);
    setParseTime(null);

    try {
      if (file.type === 'application/pdf') {
        setPdfFile(file);
        const { blob, preview } = await convertPdfToJpg(file);
        setUploadedFile({
          name: file.name,
          preview,
          blob,
          originalFile: file,
        });
      } else if (file.type.startsWith('image/')) {
        setPdfFile(null);
        const preview = URL.createObjectURL(file);
        setUploadedFile({
          name: file.name,
          preview,
          blob: file,
          originalFile: file,
        });
      } else {
        toast.error('Endast PDF eller bilder stöds');
      }
    } catch (error) {
      console.error('Error processing file:', error);
      toast.error('Kunde inte bearbeta filen');
    }
  }, []);

  const handleDrop = useCallback(async (event: React.DragEvent) => {
    event.preventDefault();
    const file = event.dataTransfer.files[0];
    if (!file) return;

    // Create a fake event to reuse handleFileSelect logic
    const fakeEvent = {
      target: { files: [file] },
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    await handleFileSelect(fakeEvent);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
  }, []);

  const clearFile = useCallback(() => {
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview);
    }
    setUploadedFile(null);
    setPdfFile(null);
    setParseResult(null);
    setParseError(null);
    setParseTime(null);
  }, [uploadedFile]);

  const parseReceipt = useCallback(async () => {
    if (!uploadedFile) return;

    setParsing(true);
    setParseError(null);
    const startTime = Date.now();

    try {
      // Get user session for storage RLS
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) {
        throw new Error('Du måste vara inloggad för att testa tolkning');
      }
      const userId = session.user.id;

      // Upload image temporarily to Supabase storage for the edge function
      // Use user ID in path to comply with RLS policies
      const tempFileName = `${userId}/training-test-${Date.now()}.jpg`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('receipts')
        .upload(tempFileName, uploadedFile.blob, {
          contentType: 'image/jpeg',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('receipts')
        .getPublicUrl(tempFileName);

      const imageUrl = urlData.publicUrl;

      // Also upload the original PDF if available (for PDF text extraction)
      let pdfUrl: string | undefined;
      let pdfFileName: string | undefined;
      if (pdfFile) {
        pdfFileName = `${userId}/training-test-${Date.now()}.pdf`;
        const { error: pdfUploadError } = await supabase.storage
          .from('receipts')
          .upload(pdfFileName, pdfFile, {
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

      // Call the parse-receipt edge function
      const { data, error } = await supabase.functions.invoke('parse-receipt', {
        body: {
          imageUrl,
          pdfUrl,
          originalFilename: uploadedFile.name,
          parserVersion,
        },
      });

      // Clean up temp files
      const filesToRemove = [tempFileName];
      if (pdfFileName) filesToRemove.push(pdfFileName);
      await supabase.storage.from('receipts').remove(filesToRemove);

      const endTime = Date.now();
      setParseTime(endTime - startTime);

      if (error) throw error;

      if (data) {
        setParseResult(data);
        const method = data._debug?.method === 'structured_parser' ? 'strukturerad parser' : 'AI (Gemini)';
        toast.success(`Tolkning klar med ${method}!`);
      }
    } catch (error: any) {
      console.error('Parse error:', error);
      setParseError(error.message || 'Okänt fel vid tolkning');
      toast.error('Kunde inte tolka kvittot');
    } finally {
      setParsing(false);
    }
  }, [uploadedFile, pdfFile, parserVersion]);

  const totalParsedAmount = parseResult?.items?.reduce((sum, item) => sum + item.price, 0) || 0;
  const totalDiscount = parseResult?.items?.reduce((sum, item) => sum + (item.discount || 0), 0) || 0;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Upload Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Ladda upp testkvitto
          </CardTitle>
          <CardDescription>
            Ladda upp ett kvitto för att testa tolkningen. Kvittot sparas <strong>inte</strong> i databasen.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Parser Version Selector */}
          <div className="space-y-2">
            <Label htmlFor="parser-version" className="text-sm font-medium flex items-center gap-2">
              <FlaskConical className="h-4 w-4" />
              Parser-version
            </Label>
            <Select value={parserVersion} onValueChange={(v) => setParserVersion(v as ParserVersion)}>
              <SelectTrigger id="parser-version" className="w-full">
                <SelectValue placeholder="Välj parser-version" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">Produktion</Badge>
                    <span>Current (Standard)</span>
                  </div>
                </SelectItem>
                <SelectItem value="experimental">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">Experimentell</Badge>
                    <span>Experimental (med preprocessing)</span>
                  </div>
                </SelectItem>
                <SelectItem value="ai_only">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">AI Only</Badge>
                    <span>Endast AI (Gemini)</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              {parserVersion === 'current' && 'Använder produktionsversionen av den strukturerade parsern.'}
              {parserVersion === 'experimental' && 'Testar ny parser med förbättrad textbearbetning för ICA-kvitton.'}
              {parserVersion === 'ai_only' && 'Hoppar över strukturerad parsing och använder endast AI.'}
            </p>
          </div>

          <Separator />

          {!uploadedFile ? (
            <div
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onClick={() => document.getElementById('training-file-input')?.click()}
            >
              <FileText className="h-12 w-12 mx-auto text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground mb-2">
                Dra och släpp en PDF eller bild här
              </p>
              <p className="text-sm text-muted-foreground/70">
                eller klicka för att välja fil
              </p>
              <input
                id="training-file-input"
                type="file"
                accept="application/pdf,image/*"
                onChange={handleFileSelect}
                className="hidden"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div className="relative">
                <img
                  src={uploadedFile.preview}
                  alt="Kvitto"
                  className="w-full max-h-96 object-contain border rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2"
                  onClick={clearFile}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                {uploadedFile.name}
                {pdfFile && <Badge variant="outline" className="ml-2">PDF</Badge>}
              </p>
              <div className="flex gap-2">
                <Button
                  onClick={parseReceipt}
                  disabled={parsing}
                  className="flex-1"
                >
                  {parsing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Tolkar...
                    </>
                  ) : (
                    <>
                      <Zap className="mr-2 h-4 w-4" />
                      Testa tolkning
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('training-file-input')?.click()}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <input
                  id="training-file-input"
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Results Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {parseResult ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : parseError ? (
              <AlertCircle className="h-5 w-5 text-red-500" />
            ) : (
              <FileText className="h-5 w-5" />
            )}
            Tolkningsresultat
          </CardTitle>
          <CardDescription>
            {parseResult ? (
              <span className="flex items-center gap-2 flex-wrap">
                Metod:{' '}
                <Badge variant={parseResult._debug?.method === 'structured_parser' ? 'default' : 'secondary'}>
                  {parseResult._debug?.method === 'structured_parser' ? (
                    <>
                      <Zap className="h-3 w-3 mr-1" />
                      Strukturerad parser
                    </>
                  ) : (
                    <>
                      <Brain className="h-3 w-3 mr-1" />
                      AI (Gemini)
                    </>
                  )}
                </Badge>
                {parseResult._debug?.parserVersion && parseResult._debug.parserVersion !== 'current' && (
                  <Badge variant="outline" className={
                    parseResult._debug.parserVersion === 'experimental' 
                      ? 'bg-yellow-50 text-yellow-700 border-yellow-200' 
                      : 'bg-purple-50 text-purple-700 border-purple-200'
                  }>
                    <FlaskConical className="h-3 w-3 mr-1" />
                    {parseResult._debug.parserVersion === 'experimental' ? 'Experimentell' : 'AI Only'}
                  </Badge>
                )}
                {parseTime && (
                  <Badge variant="outline">
                    {(parseTime / 1000).toFixed(1)}s
                  </Badge>
                )}
              </span>
            ) : parseError ? (
              'Fel vid tolkning'
            ) : (
              'Väntar på tolkning...'
            )}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {parseError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-4">
              <p className="text-red-700 dark:text-red-400">{parseError}</p>
            </div>
          )}

          {parseResult && (
            <div className="space-y-4">
              {/* Header info */}
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Butik:</span>
                  <p className="font-medium">{parseResult.store_name || 'Okänd'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Datum:</span>
                  <p className="font-medium">{parseResult.receipt_date || 'Okänt'}</p>
                </div>
                <div>
                  <span className="text-muted-foreground">Total:</span>
                  <p className="font-medium">{parseResult.total_amount?.toFixed(2) || '0.00'} kr</p>
                </div>
              </div>

              <Separator />

              {/* Validation */}
              <div className="flex items-center gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Summerad:</span>
                  <span className={`ml-2 font-medium ${Math.abs(totalParsedAmount - (parseResult.total_amount || 0)) < 1 ? 'text-green-600' : 'text-orange-500'}`}>
                    {totalParsedAmount.toFixed(2)} kr
                  </span>
                </div>
                {totalDiscount > 0 && (
                  <div>
                    <span className="text-muted-foreground">Rabatter:</span>
                    <span className="ml-2 font-medium text-green-600">-{totalDiscount.toFixed(2)} kr</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Antal artiklar:</span>
                  <span className="ml-2 font-medium">{parseResult.items?.length || 0}</span>
                </div>
              </div>

              <Separator />

              {/* Items list */}
              <div className="max-h-80 overflow-y-auto space-y-2">
                {parseResult.items?.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded text-sm"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{item.name}</p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Badge variant="outline" className="text-xs">
                          {categoryNames[item.category] || item.category}
                        </Badge>
                        {item.quantity > 1 && <span>×{item.quantity}</span>}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">{item.price.toFixed(2)} kr</p>
                      {item.discount && item.discount > 0 && (
                        <p className="text-xs text-green-600">-{item.discount.toFixed(2)} kr</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* Debug info */}
              {parseResult._debug?.debugLog && parseResult._debug.debugLog.length > 0 && (
                <>
                  <Separator />
                  <details className="text-xs">
                    <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                      Visa debug-logg ({parseResult._debug.debugLog.length} rader)
                    </summary>
                    <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-x-auto max-h-40 overflow-y-auto">
                      {parseResult._debug.debugLog.join('\n')}
                    </pre>
                  </details>
                </>
              )}
            </div>
          )}

          {!parseResult && !parseError && (
            <p className="text-muted-foreground text-center py-8">
              Ladda upp ett kvitto och klicka på "Testa tolkning" för att se resultatet.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
