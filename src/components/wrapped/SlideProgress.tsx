import React from 'react';
import { cn } from '@/lib/utils';

interface SlideProgressProps {
    currentSlide: number;
    totalSlides: number;
    className?: string;
}

export function SlideProgress({ currentSlide, totalSlides, className }: SlideProgressProps) {
    return (
        <div className={cn('flex gap-2 justify-center', className)}>
            {Array.from({ length: totalSlides }).map((_, index) => (
                <div
                    key={index}
                    className={cn(
                        'h-1.5 rounded-full transition-all duration-300',
                        index === currentSlide
                            ? 'w-8 bg-white'
                            : 'w-1.5 bg-white/30'
                    )}
                />
            ))}
        </div>
    );
}
