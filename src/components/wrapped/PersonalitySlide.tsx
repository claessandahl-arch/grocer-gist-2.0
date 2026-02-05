import React from 'react';
import { WrappedSlide } from './WrappedSlide';
import { ShopperPersonality } from '@/types/wrapped';

interface PersonalitySlideProps {
    personality: ShopperPersonality;
}

export function PersonalitySlide({ personality }: PersonalitySlideProps) {
    return (
        <WrappedSlide gradient="pink">
            <div className="space-y-12">
                <h2 className="text-4xl md:text-5xl font-bold text-center">
                    🎭 Din Shopparprofil
                </h2>

                {/* Personality Reveal */}
                <div className="text-center space-y-6 bg-white/10 backdrop-blur-sm rounded-3xl p-8">
                    <div className="text-8xl animate-bounce">
                        {personality.emoji}
                    </div>

                    <div className="space-y-2">
                        <p className="text-4xl md:text-5xl font-bold">
                            {personality.title}
                        </p>
                        <p className="text-xl opacity-90">
                            {personality.description}
                        </p>
                    </div>
                </div>

                {/* Traits */}
                <div className="space-y-3">
                    <p className="text-sm opacity-80 text-center mb-4">Dina egenskaper</p>
                    {personality.traits.map((trait, index) => (
                        <div
                            key={index}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center"
                        >
                            <span className="font-medium">{trait}</span>
                        </div>
                    ))}
                </div>
            </div>
        </WrappedSlide>
    );
}
