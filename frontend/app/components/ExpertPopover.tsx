'use client'

import { useState } from 'react'
import { X, ShieldCheck } from 'lucide-react'
import Image from 'next/image'

export default function ExpertPopover() {
    const [isVisible, setIsVisible] = useState(true)

    if (!isVisible) return null

    return (
        <>
            <div className="bg-white rounded-lg shadow-2xl p-4 max-w-2xs md:max-w-xs relative">
                <button
                    onClick={() => setIsVisible(false)}
                    className="absolute -top-2 -left-2 w-6 h-6 flex items-center justify-center bg-white hover:bg-gray-50 rounded-lg transition-colors text-gray-600 hover:text-gray-800 border border-gray-200"
                >
                    <X className="w-4 h-4 text-gray-500" />
                </button>
                {/* Header row: Image, Name+Status, Badge */}
                <div className="flex items-center justify-between gap-1 mb-3 mt-1">
                    {/* Left side: Image + Name + Status */}
                    <div className="flex items-center gap-2">
                        {/* Profile image */}
                        <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                                <Image
                                    src="/expert/exp-p.jpeg"
                                    alt="Expert Popover: Dave"
                                    width={40}
                                    height={40}
                                    className="w-full h-full object-cover"
                                />
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <h3 className="text-sm font-semibold text-gray-900">Dave</h3>
                            <div className="relative w-2 h-2">
                                <div className="absolute inset-0 w-2.5 h-2.5 bg-green-500 rounded-full opacity-60" />
                                <div className="absolute inset-x-0.5 inset-y-0.5 w-1.5 h-1.5 bg-green-500 rounded-full" />
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span className="text-xs font-medium text-gray-700">Vetted Expert</span>
                    </div>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-700 leading-relaxed">
                    <span className="font-semibold">I'm Dave, a Herm & Mills expert</span>. I can help you pick the right chair.
                </p>
            </div>
        </>
    )
}