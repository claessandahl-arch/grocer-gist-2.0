import React from 'react';
import { WrappedSlide } from './WrappedSlide';
import { HomeStore } from '@/types/wrapped';

interface StoreLoyaltySlideProps {
    homeStore: HomeStore;
    storesVisitedCount: number;
    loyaltyPercent: number;
}

export function StoreLoyaltySlide({
    homeStore,
    storesVisitedCount,
    loyaltyPercent,
}: StoreLoyaltySlideProps) {
    return (
        <WrappedSlide gradient="orange">
            <div className="space-y-12">
                <h2 className="text-4xl md:text-5xl font-bold text-center">
                    🏪 Dina Butiker
                </h2>

                {/* Home Store */}
                {homeStore && (
                    <div className="text-center space-y-4 bg-white/10 backdrop-blur-sm rounded-3xl p-8">
                        <p className="text-lg opacity-80">Din hemmabutik är</p>
                        <p className="text-4xl md:text-5xl font-bold leading-tight">
                            {homeStore.store_name}
                        </p>
                        <p className="text-xl opacity-90">
                            {homeStore.visit_count} besök
                        </p>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 gap-6">
                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-2 text-center">
                        <p className="text-sm opacity-80">Butiker besökta</p>
                        <p className="text-5xl font-bold">{storesVisitedCount}</p>
                    </div>

                    <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-2 text-center">
                        <p className="text-sm opacity-80">Butikstrohet</p>
                        <p className="text-5xl font-bold">{Math.round(loyaltyPercent)}%</p>
                    </div>
                </div>

                {/* Loyalty Message */}
                <div className="text-center space-y-2">
                    {loyaltyPercent > 70 ? (
                        <p className="text-lg opacity-90">
                            Du är en trogen kund! 💎
                        </p>
                    ) : loyaltyPercent > 50 ? (
                        <p className="text-lg opacity-90">
                            Du gillar variation men har en favorit! 🔄
                        </p>
                    ) : (
                        <p className="text-lg opacity-90">
                            Du älskar att utforska nya butiker! 🗺️
                        </p>
                    )}
                </div>
            </div>
        </WrappedSlide>
    );
}
