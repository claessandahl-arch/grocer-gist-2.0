import React from 'react';
import { cn } from '@/lib/utils';

interface WrappedSlideProps {
    children: React.ReactNode;
    className?: string;
    gradient?: 'purple' | 'blue' | 'green' | 'orange' | 'pink' | 'default';
}

const gradients = {
    purple: 'bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500',
    blue: 'bg-gradient-to-br from-blue-600 via-cyan-500 to-teal-400',
    green: 'bg-gradient-to-br from-green-600 via-emerald-500 to-lime-400',
    orange: 'bg-gradient-to-br from-orange-600 via-amber-500 to-yellow-400',
    pink: 'bg-gradient-to-br from-pink-600 via-rose-500 to-red-400',
    default: 'bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900',
};

export function WrappedSlide({ children, className, gradient = 'default' }: WrappedSlideProps) {
    return (
        <div
            className={cn(
                'min-h-screen w-full flex flex-col items-center justify-center p-8 text-white',
                gradients[gradient],
                'animate-in fade-in slide-in-from-right-4 duration-500',
                className
            )}
        >
            <div className="max-w-2xl w-full">{children}</div>
        </div>
    );
}
