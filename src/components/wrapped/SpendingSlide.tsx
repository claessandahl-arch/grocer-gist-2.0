import React from 'react';
import { WrappedSlide } from './WrappedSlide';
import { WrappedOverview, PeakWeek } from '@/types/wrapped';
import { format } from 'date-fns';
import { sv } from 'date-fns/locale';

interface SpendingSlideProps {
    overview: WrappedOverview;
    peakWeek: PeakWeek;
}

export function SpendingSlide({ overview, peakWeek }: SpendingSlideProps) {
    const formatCurrency = (amount: number) => {
        return `${Math.round(amount).toLocaleString('sv-SE')} kr`;
    };

    return (
        <WrappedSlide gradient="blue">
            <div className="space-y-12">
                <h2 className="text-4xl md:text-5xl font-bold text-center">
                    📊 Dina Utgifter
                </h2>

                <div className="space-y-8">
                    {/* Total Spending - Big Number */}
                    <div className="text-center space-y-2">
                        <p className="text-lg opacity-80">Du handlade för</p>
                        <p className="text-6xl md:text-7xl font-bold">
                            {formatCurrency(overview.total_spending)}
                        </p>
                        <p className="text-sm opacity-70">under året</p>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-6">
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-2">
                            <p className="text-sm opacity-80">Genomsnitt per besök</p>
                            <p className="text-3xl font-bold">{formatCurrency(overview.avg_per_receipt)}</p>
                        </div>

                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-2">
                            <p className="text-sm opacity-80">Antal inköp</p>
                            <p className="text-3xl font-bold">{overview.receipt_count}</p>
                        </div>
                    </div>

                    {/* Peak Week */}
                    {peakWeek && (
                        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-2">
                            <p className="text-sm opacity-80">Din största shoppingvecka</p>
                            <p className="text-2xl font-bold">
                                {format(new Date(peakWeek.week_start), 'd MMMM', { locale: sv })}
                            </p>
                            <p className="text-lg opacity-90">{formatCurrency(peakWeek.total_spent)}</p>
                        </div>
                    )}
                </div>
            </div>
        </WrappedSlide>
    );
}
