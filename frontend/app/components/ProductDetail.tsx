'use client'

import { useState } from 'react'
import Image from 'next/image'
import { X } from 'lucide-react'

export type ProductDetailData = {
    id: string
    number: string
    name: string
    images: string[]
    description: string
    features?: string[]
    specifications: {
        label: string
        value: string
    }[]
    pricing?: {
        label: string
        price: number
    }[]
    specSheetUrl?: string
    contactEmail?: string
}

type ProductDetailProps = {
    product: ProductDetailData
    onClose: () => void
}

export default function ProductDetail({ product, onClose }: ProductDetailProps) {
    const [currentImageIndex, setCurrentImageIndex] = useState(0)

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-y-auto">
            <div className="min-h-screen px-8 py-8">
                <div className="max-w-7xl mx-auto">
                    {/* Close Button */}
                    <button
                        onClick={onClose}
                        className="fixed top-8 right-8 w-12 h-12 flex items-center justify-center hover:bg-black hover:bg-opacity-5 hover:text-white rounded-full transition-colors z-10"
                        aria-label="Close"
                    >
                        <X />
                    </button>

                    {/* Image Gallery */}
                    <div className="mb-8">
                        <div className="flex gap-2 mb-6 overflow-x-auto pb-4">
                            {product.images.map((image, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentImageIndex(index)}
                                    className={`flex-shrink-0 w-28 h-28 relative bg-[#c5beb3] overflow-hidden transition-all ${currentImageIndex === index ? 'border-b-2 border-gray-300 ease-in-out duration-600' : 'opacity-60 hover:opacity-100'
                                        }`}
                                >
                                    <Image
                                        src={image}
                                        alt={`${product.name} - View ${index + 1}`}
                                        fill
                                        className="object-cover"
                                        sizes="112px"
                                    />
                                </button>
                            ))}
                        </div>

                        {/* Main Image */}
                        <div className="relative bg-white overflow-hidden flex-shrink-0 max-w-2xl">
                            <Image
                                src={product.images[currentImageIndex]}
                                alt={product.name}
                                width={600}
                                height={600}
                                className="object-cover w-full h-full"
                                priority
                            />
                        </div>
                    </div>

                    {/* Product Info */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 max-w-6xl border-t border-gray-600 py-8">
                        {/* Left Column - Title and Description */}
                        <div>
                            <div className="mb-6">
                                <p className="text-xs uppercase tracking-wider mb-2 text-gray-600">{product.number}</p>
                                <h1 className="text-4xl font-bold mb-2">{product.name}</h1>
                            </div>

                            <div className="border-t border-black pt-6">
                                <p className="text-lg leading-relaxed mb-6">{product.description}</p>

                                {product.features && product.features.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm uppercase font-bold mb-3 tracking-wide">Features</h3>
                                        <ul className="space-y-2">
                                            {product.features.map((feature, index) => (
                                                <li key={index} className="text-base flex items-start">
                                                    <span className="mr-2">•</span>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Right Column - Specifications and Pricing */}
                        <div>
                            <div className="pt-6">
                                <h3 className="text-sm uppercase font-bold mb-6 tracking-wide">Specifications</h3>

                                <div className="space-y-4 mb-8">
                                    {product.specifications.map((spec, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between items-baseline py-3 border-b border-gray-300"
                                        >
                                            <span className="text-sm font-medium">{spec.label}</span>
                                            <span className="text-lg font-bold">{spec.value}</span>
                                        </div>
                                    ))}
                                </div>

                                {product.pricing && product.pricing.length > 0 && (
                                    <div className="space-y-4 mb-8">
                                        {product.pricing.map((price, index) => (
                                            <div
                                                key={index}
                                                className="flex justify-between items-baseline py-3 border-b border-gray-300"
                                            >
                                                <span className="text-sm font-medium">{price.label}</span>
                                                <span className="text-2xl font-bold">${price.price.toLocaleString()}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}

                                {/* Contact Button */}
                                <button className="w-full border-2 border-black py-4 px-6 text-center font-bold uppercase text-sm tracking-wide hover:bg-black hover:text-white transition-colors mb-6">
                                    Contact for Purchase
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

