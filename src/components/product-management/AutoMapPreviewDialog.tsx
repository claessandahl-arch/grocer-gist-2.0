import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Loader2, Check, X, Pencil } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const CATEGORIES = [
    { key: 'frukt_och_gront', label: 'Frukt & Grönt' },
    { key: 'mejeri', label: 'Mejeri' },
    { key: 'kott_fagel_chark', label: 'Kött & Chark' },
    { key: 'fisk_skaldjur', label: 'Fisk & Skaldjur' },
    { key: 'brod_bageri', label: 'Bröd & Bageri' },
    { key: 'skafferi', label: 'Skafferi' },
    { key: 'frysvaror', label: 'Frysvaror' },
    { key: 'drycker', label: 'Drycker' },
    { key: 'sotsaker_snacks', label: 'Sötsaker & Snacks' },
    { key: 'fardigmat', label: 'Färdigmat' },
    { key: 'hushall_hygien', label: 'Hushåll & Hygien' },
    { key: 'delikatess', label: 'Delikatess' },
    { key: 'pant', label: 'Pant' },
    { key: 'other', label: 'Övrigt' },
];

type MappingSuggestion = {
    original_name: string;
    mapped_name: string;
    category: string;
    selected: boolean;
    isEditing: boolean;
};

type AutoMapPreviewDialogProps = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    suggestions: MappingSuggestion[];
    onApply: (mappings: MappingSuggestion[]) => void;
    isApplying: boolean;
};

export function AutoMapPreviewDialog({
    open,
    onOpenChange,
    suggestions: initialSuggestions,
    onApply,
    isApplying,
}: AutoMapPreviewDialogProps) {
    const [suggestions, setSuggestions] = useState<MappingSuggestion[]>(initialSuggestions);

    // Update local state when props change
    useEffect(() => {
        setSuggestions(initialSuggestions);
    }, [initialSuggestions]);

    const toggleSelection = (index: number) => {
        setSuggestions(prev => prev.map((s, i) =>
            i === index ? { ...s, selected: !s.selected } : s
        ));
    };

    const toggleSelectAll = (checked: boolean) => {
        setSuggestions(prev => prev.map(s => ({ ...s, selected: checked })));
    };

    const updateMappedName = (index: number, newName: string) => {
        setSuggestions(prev => prev.map((s, i) =>
            i === index ? { ...s, mapped_name: newName } : s
        ));
    };

    const updateCategory = (index: number, newCategory: string) => {
        setSuggestions(prev => prev.map((s, i) =>
            i === index ? { ...s, category: newCategory } : s
        ));
    };

    const toggleEditing = (index: number) => {
        setSuggestions(prev => prev.map((s, i) =>
            i === index ? { ...s, isEditing: !s.isEditing } : s
        ));
    };

    const selectedCount = suggestions.filter(s => s.selected).length;
    const allSelected = suggestions.length > 0 && selectedCount === suggestions.length;

    const handleApply = () => {
        const selectedMappings = suggestions.filter(s => s.selected);
        if (selectedMappings.length === 0) {
            toast.error("Välj minst en mappning");
            return;
        }
        onApply(selectedMappings);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-4xl max-h-[80vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        AI-mappningsförslag
                        <Badge variant="secondary">{suggestions.length} förslag</Badge>
                    </DialogTitle>
                    <DialogDescription>
                        Granska och justera AI:s förslag innan du tillämpar dem.
                        Klicka på pennan för att redigera gruppnamn.
                    </DialogDescription>
                </DialogHeader>

                <div className="flex items-center gap-2 pb-2 border-b">
                    <Checkbox
                        checked={allSelected}
                        onCheckedChange={toggleSelectAll}
                    />
                    <span className="text-sm text-muted-foreground">
                        Välj alla ({selectedCount}/{suggestions.length})
                    </span>
                </div>

                <ScrollArea className="h-[400px] pr-4">
                    <div className="space-y-2">
                        {suggestions.map((suggestion, index) => (
                            <div
                                key={suggestion.original_name}
                                className={`flex items-center gap-3 p-3 rounded-lg border transition-colors ${suggestion.selected ? 'bg-primary/5 border-primary/20' : 'bg-muted/30'
                                    }`}
                            >
                                <Checkbox
                                    checked={suggestion.selected}
                                    onCheckedChange={() => toggleSelection(index)}
                                />

                                <div className="flex-1 min-w-0 grid grid-cols-[1fr_auto_1fr_auto] gap-2 items-center">
                                    {/* Original name */}
                                    <span className="text-sm truncate font-medium" title={suggestion.original_name}>
                                        {suggestion.original_name}
                                    </span>

                                    {/* Arrow */}
                                    <span className="text-muted-foreground">→</span>

                                    {/* Mapped name (editable) */}
                                    {suggestion.isEditing ? (
                                        <div className="flex gap-1">
                                            <Input
                                                value={suggestion.mapped_name}
                                                onChange={(e) => updateMappedName(index, e.target.value)}
                                                className="h-8 text-sm"
                                                autoFocus
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') toggleEditing(index);
                                                }}
                                            />
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => toggleEditing(index)}
                                                className="h-8 w-8 p-0"
                                            >
                                                <Check className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-1">
                                            <span className="text-sm font-semibold text-primary truncate">
                                                {suggestion.mapped_name}
                                            </span>
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => toggleEditing(index)}
                                                className="h-6 w-6 p-0"
                                            >
                                                <Pencil className="h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}

                                    {/* Category dropdown */}
                                    <Select
                                        value={suggestion.category}
                                        onValueChange={(value) => updateCategory(index, value)}
                                    >
                                        <SelectTrigger className="h-8 w-[140px] text-xs">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {CATEGORIES.map(cat => (
                                                <SelectItem key={cat.key} value={cat.key}>
                                                    {cat.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        ))}
                    </div>
                </ScrollArea>

                <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isApplying}>
                        Avbryt
                    </Button>
                    <Button onClick={handleApply} disabled={selectedCount === 0 || isApplying}>
                        {isApplying ? (
                            <>
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                Sparar...
                            </>
                        ) : (
                            `Tillämpa valda (${selectedCount})`
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
