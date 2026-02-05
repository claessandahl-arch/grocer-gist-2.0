import React from 'react';
import { WrappedSlide } from './WrappedSlide';
import { WrappedStats } from '@/types/wrapped';
import { Button } from '@/components/ui/button';
import { Share2, Download } from 'lucide-react';
import { toast } from 'sonner';

interface SummarySlideProps {
    stats: WrappedStats;
}

export function SummarySlide({ stats }: SummarySlideProps) {
    const formatCurrency = (amount: number) => {
        return `${Math.round(amount).toLocaleString('sv-SE')} kr`;
    };

    const handleShare = () => {
        const shareText = `Min Grocer Gist 2025 Wrapped 🎉

${stats.personality.emoji} ${stats.personality.title}
💰 ${formatCurrency(stats.overview.total_spending)} totalt
🛒 ${stats.overview.receipt_count} inköp
🏪 ${stats.patterns.home_store?.store_name || 'Flera butiker'}

Kolla in din egen statistik på Grocer Gist!`;

        if (navigator.share) {
            navigator.share({
                title: 'Min Grocery Wrapped',
                text: shareText,
            }).catch(() => {
                // Fallback to clipboard
                navigator.clipboard.writeText(shareText);
                toast.success('Text kopierad till urklipp!');
            });
        } else {
            navigator.clipboard.writeText(shareText);
            toast.success('Text kopierad till urklipp!');
        }
    };

    return (
        <WrappedSlide gradient="purple">
            <div className="space-y-12">
                <h2 className="text-4xl md:text-5xl font-bold text-center">
                    ✨ Sammanfattning
                </h2>

                {/* Summary Card */}
                <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 space-y-6">
                    <div className="text-center space-y-4">
                        <div className="text-6xl">{stats.personality.emoji}</div>
                        <p className="text-3xl font-bold">{stats.personality.title}</p>
                    </div>

                    <div className="space-y-4 border-t border-white/20 pt-6">
                        <div className="flex justify-between">
                            <span className="opacity-80">Totalt handlat</span>
                            <span className="font-bold">{formatCurrency(stats.overview.total_spending)}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-80">Antal inköp</span>
                            <span className="font-bold">{stats.overview.receipt_count}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-80">Unika produkter</span>
                            <span className="font-bold">{stats.overview.unique_products}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="opacity-80">Hemmabutik</span>
                            <span className="font-bold">{stats.patterns.home_store?.store_name || 'N/A'}</span>
                        </div>
                    </div>
                </div>

                {/* Share Button */}
                <div className="space-y-4">
                    <Button
                        onClick={handleShare}
                        className="w-full bg-white text-purple-600 hover:bg-white/90 font-semibold text-lg h-14"
                        size="lg"
                    >
                        <Share2 className="mr-2 h-5 w-5" />
                        Dela ditt Wrapped
                    </Button>

                    <p className="text-center text-sm opacity-70">
                        Tack för att du använder Grocer Gist! 💚
                    </p>
                </div>
            </div>
        </WrappedSlide>
    );
}
