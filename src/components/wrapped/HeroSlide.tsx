import React from 'react';
import { WrappedSlide } from './WrappedSlide';

export function HeroSlide({ year }: { year: number }) {
    return (
        <WrappedSlide gradient="purple">
            <div className="text-center space-y-8">
                <div className="space-y-4">
                    <h1 className="text-6xl md:text-8xl font-bold tracking-tight animate-in zoom-in duration-700">
                        Din Mat
                    </h1>
                    <h2 className="text-5xl md:text-7xl font-bold tracking-tight animate-in zoom-in duration-700 delay-150">
                        {year}
                    </h2>
                </div>

                <p className="text-xl md:text-2xl opacity-90 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
                    Ett år av matinköp sammanfattat
                </p>

                <div className="pt-12 animate-in fade-in duration-700 delay-500">
                    <p className="text-sm opacity-70">Tryck eller svep för att fortsätta</p>
                    <div className="mt-4">
                        <div className="inline-block animate-bounce">→</div>
                    </div>
                </div>
            </div>
        </WrappedSlide>
    );
}
