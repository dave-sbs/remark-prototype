'use client'

import Image from 'next/image'
import { MapPin } from 'lucide-react'

interface ExpertMatchingCardProps {
    userName?: string
}

export default function ExpertMatchingCard({ userName }: ExpertMatchingCardProps) {
    const name = userName || 'there'

    return (
        <div className="pb-4 max-w-sm border-b border-gray-200">
            {/* Header */}
            <span className='border-b border-gray-200'></span><p className="text-sm text-gray-700 font-medium mb-4 text-center">
                Matched with Dave B.
            </p><span className='border-b border-gray-200'></span>

            {/* Expert Profile */}
            <div className="flex flex-col items-center mb-4">
                {/* Profile Image */}
                <div className="w-20 h-20 rounded-full bg-gray-200 overflow-hidden mb-3">
                    <Image
                        src="/expert/exp-p.jpeg"
                        alt="Dave"
                        width={80}
                        height={80}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Name */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">Dave</h3>

                {/* Location */}
                <div className="flex items-center gap-1 text-sm text-gray-600 mb-3">
                    <MapPin className="w-4 h-4" />
                    <span>Wyoming, US</span>
                </div>

                {/* Bio */}
                <p className="text-sm text-gray-700 text-center leading-relaxed">
                    Hey {name}, I am Dave's AI Assistant! I'm trained on Dave who is an avid outdoorsman. I am based in Lander, WY, but when I'm not at home I am traveling the world for the perfect chair.
                </p>
            </div>

            {/* View Profile Link */}
            <div className="text-center">
                <button className="text-sm text-blue-600 hover:text-blue-800 font-medium">
                    View full profile
                </button>
            </div>
        </div>
    )
}
