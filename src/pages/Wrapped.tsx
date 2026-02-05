import React, { useState, useEffect, useCallback } from 'react';
import { useWrappedStats } from '@/hooks/useWrappedStats';
import { HeroSlide } from '@/components/wrapped/HeroSlide';
import { SpendingSlide } from '@/components/wrapped/SpendingSlide';
import { TopProductsSlide } from '@/components/wrapped/TopProductsSlide';
import { StoreLoyaltySlide } from '@/components/wrapped/StoreLoyaltySlide';
import { PersonalitySlide } from '@/components/wrapped/PersonalitySlide';
import { SummarySlide } from '@/components/wrapped/SummarySlide';
import { SlideProgress } from '@/components/wrapped/SlideProgress';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function Wrapped() {
    const navigate = useNavigate();
    const [currentSlide, setCurrentSlide] = useState(0);
    const wrappedYear = new Date().getFullYear() - 1; // Always show previous year
    const { data: stats, isLoading, error } = useWrappedStats(wrappedYear);

    // Define slides configuration
    const renderContent = () => {
        if (!stats) return [];

        return [
            <HeroSlide key="hero" year={wrappedYear} />,
            <SpendingSlide
                key="spending"
                overview={stats.overview}
                peakWeek={stats.patterns.peak_week}
            />,
            <TopProductsSlide
                key="products"
                topProducts={stats.products.top_by_quantity}
                categoryBreakdown={stats.products.category_breakdown}
            />,
            <StoreLoyaltySlide
                key="loyalty"
                homeStore={stats.patterns.home_store}
                storesVisitedCount={stats.patterns.stores_visited_count}
                loyaltyPercent={stats.patterns.store_loyalty_percent}
            />,
            <PersonalitySlide key="personality" personality={stats.personality} />,
            <SummarySlide key="summary" stats={stats} />,
            <div key="outro" className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center text-white p-8">
                <div className="text-center space-y-8">
                    <div className="text-8xl">✨</div>
                    <h2 className="text-4xl md:text-5xl font-bold">Tack för att du tittade!</h2>
                    <p className="text-xl opacity-90">Ses nästa år! 👋</p>
                    <Button
                        onClick={(e) => {
                            e.stopPropagation();
                            navigate('/');
                        }}
                        className="mt-8 bg-white text-purple-600 hover:bg-white/90 font-semibold text-lg h-14 px-8"
                    >
                        Tillbaka till Dashboard
                    </Button>
                </div>
            </div>
        ];
    };

    const slides = renderContent();
    const totalSlides = slides.length;

    const nextSlide = useCallback(() => {
        if (currentSlide < totalSlides - 1) {
            setCurrentSlide(currentSlide + 1);
        }
    }, [currentSlide, totalSlides]);

    const prevSlide = useCallback(() => {
        if (currentSlide > 0) {
            setCurrentSlide(currentSlide - 1);
        }
    }, [currentSlide]);

    // Keyboard navigation
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'ArrowRight' || e.key === ' ') {
                e.preventDefault();
                nextSlide();
            } else if (e.key === 'ArrowLeft') {
                e.preventDefault();
                prevSlide();
            } else if (e.key === 'Escape') {
                navigate('/');
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [nextSlide, prevSlide, navigate]);

    // Touch/swipe support
    useEffect(() => {
        let touchStartX = 0;
        let touchEndX = 0;

        const handleTouchStart = (e: TouchEvent) => {
            touchStartX = e.changedTouches[0].screenX;
        };

        const handleTouchEnd = (e: TouchEvent) => {
            touchEndX = e.changedTouches[0].screenX;
            handleSwipe();
        };

        const handleSwipe = () => {
            const swipeThreshold = 50;
            if (touchStartX - touchEndX > swipeThreshold) {
                nextSlide();
            } else if (touchEndX - touchStartX > swipeThreshold) {
                prevSlide();
            }
        };

        window.addEventListener('touchstart', handleTouchStart);
        window.addEventListener('touchend', handleTouchEnd);

        return () => {
            window.removeEventListener('touchstart', handleTouchStart);
            window.removeEventListener('touchend', handleTouchEnd);
        };
    }, [nextSlide, prevSlide]);

    const handleClickNavigation = (e: React.MouseEvent) => {
        const clickX = e.clientX;
        const screenWidth = window.innerWidth;

        if (clickX > screenWidth / 2) {
            nextSlide();
        } else {
            prevSlide();
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center text-white">
                <div className="text-center space-y-4">
                    <div className="text-6xl animate-bounce">🎉</div>
                    <p className="text-2xl font-bold">Förbereder ditt Wrapped...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center text-white p-8">
                <div className="text-center space-y-6 max-w-md">
                    <div className="text-6xl">😔</div>
                    <h2 className="text-3xl font-bold">Något gick fel</h2>
                    <p className="text-lg opacity-80">
                        Vi kunde inte ladda din Wrapped-statistik. Kontrollera att du har kvitton i databasen.
                    </p>
                    <Button
                        onClick={() => navigate('/')}
                        variant="outline"
                        className="mt-6"
                    >
                        Tillbaka till Dashboard
                    </Button>
                </div>
            </div>
        );
    }

    if (!stats) {
        return null;
    }

    // Empty state - no receipts
    if (stats.overview.receipt_count === 0) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-purple-600 via-purple-500 to-pink-500 flex items-center justify-center text-white p-8">
                <div className="text-center space-y-6 max-w-md">
                    <div className="text-6xl">📱</div>
                    <h2 className="text-3xl font-bold">Inget Wrapped än!</h2>
                    <p className="text-lg opacity-90">
                        Ladda upp dina kvitton först så kan vi skapa ditt Wrapped nästa år!
                    </p>
                    <Button
                        onClick={() => navigate('/upload')}
                        className="mt-6 bg-white text-purple-600 hover:bg-white/90"
                    >
                        Ladda upp kvitto
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="relative overflow-hidden cursor-pointer"
            onClick={handleClickNavigation}
        >
            {/* Close Button */}
            <button
                onClick={(e) => {
                    e.stopPropagation();
                    navigate('/');
                }}
                className="fixed top-4 right-4 z-50 bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white rounded-full p-2 transition-colors"
                aria-label="Stäng"
            >
                <X className="h-6 w-6" />
            </button>

            {/* Progress Indicator */}
            <div className="fixed top-8 left-1/2 transform -translate-x-1/2 z-50">
                <SlideProgress currentSlide={currentSlide} totalSlides={totalSlides} />
            </div>

            {/* Navigation Buttons (Desktop) */}
            <div className="hidden md:block">
                {currentSlide > 0 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            prevSlide();
                        }}
                        className="fixed left-4 top-1/2 transform -translate-y-1/2 z-50 bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white rounded-full p-3 transition-colors"
                        aria-label="Föregående"
                    >
                        <ArrowLeft className="h-6 w-6" />
                    </button>
                )}

                {currentSlide < totalSlides - 1 && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            nextSlide();
                        }}
                        className="fixed right-4 top-1/2 transform-translate-y-1/2 z-50 bg-black/20 hover:bg-black/30 backdrop-blur-sm text-white rounded-full p-3 transition-colors"
                        aria-label="Nästa"
                    >
                        <ArrowRight className="h-6 w-6" />
                    </button>
                )}
            </div>

            {/* Slides */}
            <div className="transition-opacity duration-300">
                {slides[currentSlide]}
            </div>
        </div>
    );
}
