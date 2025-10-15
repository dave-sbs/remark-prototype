'use client'

import Image from 'next/image'
import { ArrowRight } from 'lucide-react'

type ProductCardProps = {
    productName: string
    onNavigate: () => void
}

export default function ProductCard({ productName, onNavigate }: ProductCardProps) {
    // Map product names to images and IDs
    const productMap: Record<string, { id: string, image: string }> = {
        'Aeron Chair': { id: '1', image: '/product_images/landing/aeron.jpg' },
        'Cosm Chair': { id: '2', image: '/product_images/landing/cosm.jpg' },
        'Eames Aluminum Group Chair': { id: '3', image: '/product_images/landing/eames.jpg' },
        'Lino Chair': { id: '4', image: '/product_images/landing/lino.jpg' }
    }

    const product = productMap[productName]

    if (!product) return null

    return (
        <button
            onClick={onNavigate}
            className="group relative w-full max-w-[280px] bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-all hover:border-gray-400"
        >
            {/* Image */}
            <div className="relative bg-[#c5beb3] flex-shrink-0 overflow-hidden">
                <Image
                    src={product.image}
                    alt={productName}
                    width={200}
                    height={80}
                    className="object-cover group-hover:scale-105 transition-transform duration-300 w-full h-full"
                />
            </div>

            {/* Content */}
            <div className="p-4 text-left">
                <h3 className="text-sm font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                    {productName}
                </h3>
                <div className="flex items-center text-xs text-gray-600 group-hover:text-blue-600 transition-colors">
                    <span>View details</span>
                    <ArrowRight className="w-3 h-3 ml-1 group-hover:translate-x-1 transition-transform" />
                </div>
            </div>

            {/* Badge */}
            <div className="absolute top-2 right-2 bg-blue-600 text-white text-xs px-2 py-1 rounded-sm">
                Recommended
            </div>
        </button>
    )
}
