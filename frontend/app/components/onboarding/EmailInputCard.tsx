'use client'

import { useState } from 'react'

interface EmailInputCardProps {
    userName: string
    onSubmit: (email: string) => void
    onSkip: () => void
}

export default function EmailInputCard({ userName, onSubmit, onSkip }: EmailInputCardProps) {
    const [email, setEmail] = useState('')
    const [error, setError] = useState('')

    const validateEmail = (email: string) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    }

    const handleSubmit = () => {
        if (!validateEmail(email.trim())) {
            setError('Please enter a valid email address')
            return
        }

        setError('')
        onSubmit(email.trim())
    }

    const handleSkip = () => {
        setError('')
        onSkip()
    }

    const greeting = userName ? `Hi ${userName}! What's your email?` : "What's your email?"

    return (
        <div className="bg-white rounded-lg p-4 max-w-sm">
            <div className="mb-4">
                <p className="text-sm text-gray-700 mb-1">
                    📧 {greeting}
                    <span className="text-xs text-gray-500 ml-2">2 of 2</span>
                </p>
            </div>

            <input
                type="email"
                value={email}
                onChange={(e) => {
                    setEmail(e.target.value)
                    if (error) setError('')
                }}
                placeholder="Email"
                className="w-full p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm mb-2"
            />

            {error && (
                <p className="text-xs text-red-600 mb-3">{error}</p>
            )}

            <button
                onClick={handleSubmit}
                className="w-full bg-black text-white rounded-lg py-3 px-4 hover:bg-gray-800 transition-colors text-sm font-medium mb-3"
            >
                Let's get chatting
            </button>

            <button
                onClick={handleSkip}
                className="w-full text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
                Continue without an email
            </button>
        </div>
    )
}
