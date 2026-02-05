import React from 'react';
import { WrappedSlide } from './WrappedSlide';
import { WrappedProduct, CategoryBreakdown } from '@/types/wrapped';

interface TopProductsSlideProps {
    topProducts: WrappedProduct[];
    categoryBreakdown: CategoryBreakdown[];
}

const categoryNames: Record<string, string> = {
    frukt_gront: 'Frukt & Grönt',
    mejeri: 'Mejeri',
    kott_fisk: 'Kött & Fisk',
    skafferi: 'Skafferi',
    godis_snacks: 'Godis & Snacks',
    dryck: 'Dryck',
    brod_kakor: 'Bröd & Kakor',
    halsa: 'Hälsa',
    other: 'Övrigt',
};

export function TopProductsSlide({ topProducts, categoryBreakdown }: TopProductsSlideProps) {
    const topProduct = topProducts[0];
    const topCategory = categoryBreakdown[0];

    return (
        <WrappedSlide gradient="green">
            <div className="space-y-12">
                <h2 className="text-4xl md:text-5xl font-bold text-center">
                    🛒 Dina Favoriter
                </h2>

                {/* #1 Product */}
                {topProduct && (
                    <div className="text-center space-y-4 bg-white/10 backdrop-blur-sm rounded-3xl p-8">
                        <p className="text-lg opacity-80">Din #1 produkt var</p>
                        <p className="text-4xl md:text-5xl font-bold leading-tight">
                            {topProduct.product_name}
                        </p>
                        <p className="text-xl opacity-90">
                            Köptes {topProduct.purchase_count} gånger
                        </p>
                    </div>
                )}

                {/* Top 5 */}
                <div className="space-y-3">
                    <p className="text-sm opacity-80 text-center mb-4">Topp 5 produkter</p>
                    {topProducts.slice(0, 5).map((product, index) => (
                        <div
                            key={product.product_name}
                            className="bg-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between"
                        >
                            <div className="flex items-center gap-4">
                                <span className="text-2xl font-bold opacity-60">#{index + 1}</span>
                                <span className="font-medium">{product.product_name}</span>
                            </div>
                            <span className="text-sm opacity-80">{product.purchase_count}×</span>
                        </div>
                    ))}
                </div>

                {/* Top Category */}
                {topCategory && (
                    <div className="text-center space-y-2">
                        <p className="text-sm opacity-80">Din favoritkategori</p>
                        <p className="text-2xl font-bold">
                            {categoryNames[topCategory.category] || topCategory.category}
                        </p>
                    </div>
                )}
            </div>
        </WrappedSlide>
    );
}
