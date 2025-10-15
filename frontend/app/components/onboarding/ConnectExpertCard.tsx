'use client'

import { ShieldCheck, MessageCircle } from 'lucide-react'
import Image from 'next/image'

interface ConnectExpertCardProps {
    onConnect: () => void
}

export default function ConnectExpertCard({ onConnect }: ConnectExpertCardProps) {
    return (
        <div className="bg-gray-50 rounded-lg p-4 max-w-sm">
            {/* Header row: Image, Name+Status, Badge */}
            <div className="flex items-center justify-between gap-3 mb-3">
                {/* Left side: Image + Name + Status */}
                <div className="flex items-center gap-2.5">
                    {/* Profile image */}
                    <div className="relative flex-shrink-0">
                        <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                            <Image
                                src="/expert/exp-p.jpeg"
                                alt="Expert: Dave"
                                width={48}
                                height={48}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Name and status indicator */}
                    <div className="flex items-center gap-1.5">
                        <h3 className="text-base font-semibold text-gray-900">Dave</h3>
                        {/* Overlapping pulse circles */}
                        <div className="relative w-2.5 h-2.5">
                            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full"></div>
                            <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full animate-ping opacity-75"></div>
                        </div>
                    </div>
                </div>

                {/* Right side: Vetted Expert badge */}
                <div className="flex items-center gap-1.5 flex-shrink-0">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-medium text-gray-700">Vetted Expert</span>
                </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-700 leading-relaxed mb-4">
                I'm Dave, a <span className="font-semibold">Herm & Mills expert</span>. I can help you pick the right chair.
            </p>

            {/* Connect button */}
            <button
                onClick={onConnect}
                className="w-full bg-black text-white rounded-lg py-3 px-4 flex items-center justify-center gap-2 transition-colors text-sm font-medium cursor-pointer"
            >
                <MessageCircle className="w-4 h-4" />
                Connect with an expert
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </button>
        </div>
    )
}
