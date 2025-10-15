'use client'

import { useState } from 'react'

interface NameInputCardProps {
    onSubmit: (name: string) => void
    onSkip: () => void
}

export default function NameInputCard({ onSubmit, onSkip }: NameInputCardProps) {
    const [name, setName] = useState('')
    const [error, setError] = useState('')

    const handleNext = () => {
        if (name.trim().length < 2) {
            setError('Please enter at least 2 characters')
            return
        }

        setError('')
        onSubmit(name.trim())
    }

    const handleSkip = () => {
        setError('')
        onSkip()
    }

    return (
        <div className="bg-white rounded-lg p-4 max-w-sm">
            <div className="mb-4">
                <p className="text-sm text-gray-700 mb-1">
                    👋 What's your name?
                    <span className="text-xs text-gray-500 ml-2">1 of 2</span>
                </p>
            </div>

            <input
                type="text"
                value={name}
                onChange={(e) => {
                    setName(e.target.value)
                    if (error) setError('')
                }}
                placeholder="Name"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-2"
            />

            {error && (
                <p className="text-xs text-red-600 mb-3">{error}</p>
            )}

            <button
                onClick={handleNext}
                className="w-full bg-black text-white rounded-lg py-3 px-4 transition-colors text-sm font-medium mb-3 cursor-pointer"
            >
                Next
            </button>

            <button
                onClick={handleSkip}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                I don't have a first name
            </button>
        </div>
    )
}
