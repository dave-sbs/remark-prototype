'use client'

import Image from 'next/image'
import { MapPin, ChevronRight } from 'lucide-react'
import { useRef } from 'react'

interface ExpertMatchingCardProps {
    userName?: string
}

export default function ExpertMatchingCard({ userName }: ExpertMatchingCardProps) {
    const name = userName || 'there'
    const scrollContainerRef = useRef<HTMLDivElement>(null)

    const expertImages = [
        '/expert/exp1.png',
        '/expert/exp2.jpeg',
        '/expert/exp3.jpeg',
        '/expert/exp4.jpeg',
    ]

    const scrollRight = () => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: 200,
                behavior: 'smooth'
            })
        }
    }

    return (
        <div className="max-w-sm border-b border-gray-200">
            {/* Header */}
            <div className="flex items-center justify-between gap-2 mb-3">
                <span className='border-b border-gray-200 w-full'></span>
                <p className="text-xs text-gray-700 font-medium w-full whitespace-nowrap">
                    Matched with Dave B.
                </p>
                <span className='border-b border-gray-200 w-full'></span>
            </div>

            {/* Image Gallery */}
            <div className="relative mb-4">
                <div className="flex flex-row items-center gap-3">
                    {/* Profile Image */}
                    <div className='flex items-center flex-shrink-0 w-24 h-24 rounded-full bg-gray-200 overflow-hidden'>
                        <Image
                            src="/expert/exp-p.jpeg"
                            alt="Dave"
                            width={144}
                            height={144}
                            className="w-full h-full object-cover"
                        />
                    </div>
                    {/* Scrollable Image Gallery */}
                    <div
                        ref={scrollContainerRef}
                        className="flex gap-3 overflow-x-auto scrollbar-hide pb-2"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        {expertImages.map((src, index) => (
                            <div
                                key={index}
                                className="flex-shrink-0 w-24 h-24 rounded-2xl bg-gray-200 overflow-hidden"
                            >
                                <Image
                                    src={src}
                                    alt={`Expert activity ${index + 1}`}
                                    width={144}
                                    height={144}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        ))}
                    </div>
                </div>
                {/* Scroll Button */}
                <button
                    onClick={scrollRight}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 bg-white/40 rounded-full shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors cursor-pointer"
                    aria-label="Scroll right"
                >
                    <ChevronRight className="w-2 h-2 text-gray-700" />
                </button>
            </div>

            {/* Expert Profile */}
            <div className="flex flex-col items-start mb-4">
                <div className="flex flex-row justify-between w-full mb-3">
                    {/* Name */}
                    <h3 className="text-md font-semibold text-gray-900">Dave B.</h3>
                    <button className="text-sm text-blue-600 hover:text-blue-800 hover:underline cursor-pointer">
                        View full profile
                    </button>
                </div>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-3 border border-gray-200 rounded-md px-2 py-1">
                    <MapPin className="w-4 h-4" />
                    <span>Waterville, ME</span>
                </div>

                {/* Bio */}
                <p className="text-xs text-gray-600 leading-relaxed">
                    Spend too much time designing my dream houses and rooms on Sims 4. But I promise I know a thing or two about these chairs irl cause of Colby.
                </p>
            </div>
        </div>
    )
}
