'use client'

import ConnectExpertCard from '../../onboarding/ConnectExpertCard'
import QueryInputCard from '../../onboarding/QueryInputCard'
import NameInputCard from '../../onboarding/NameInputCard'
import EmailInputCard from '../../onboarding/EmailInputCard'
import ExpertMatchingCard from '../../onboarding/ExpertMatchingCard'
import type { OnboardingState } from '../types'

interface OnboardingFlowProps {
  state: OnboardingState
  handlers: {
    handleConnectExpert: () => void
    handleQuerySubmit: (query: string) => void
    handleNameSubmit: (name: string) => void
    handleNameSkip: () => void
    handleEmailSubmit: (email: string) => void
    handleEmailSkip: () => void
  }
}

/**
 * Onboarding Flow Component
 *
 * Renders the progressive onboarding flow based on the current state.
 * Shows completed steps and the current step.
 */
export function OnboardingFlow({ state, handlers }: OnboardingFlowProps) {
  const { currentStep, completedSteps, query, name } = state
  const {
    handleConnectExpert,
    handleQuerySubmit,
    handleNameSubmit,
    handleNameSkip,
    handleEmailSubmit,
    handleEmailSkip,
  } = handlers


  return (
    <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-4 bg-white">
      {/* Step 1: Connect Expert Card - only show when it's the current step */}
      {currentStep === 'connect_prompt' && (
        <ConnectExpertCard onConnect={handleConnectExpert} />
      )}

      {/* Step 2: Query Input */}
      {currentStep === 'query_input' && (
        <QueryInputCard onSubmit={handleQuerySubmit} />
      )}

      {/* Show query as a user message after submission */}
      {completedSteps.includes('query_input') && query && (
        <div className="bg-gray-100 rounded-lg p-3 text-sm text-gray-900 ml-auto max-w-[80%]">
          {query}
        </div>
      )}

      {/* Step 3: Name Input */}
      {currentStep === 'name_input' && (
        <NameInputCard onSubmit={handleNameSubmit} onSkip={handleNameSkip} />
      )}

      {/* Step 4: Email Input */}
      {currentStep === 'email_input' && (
        <EmailInputCard
          userName={name}
          onSubmit={handleEmailSubmit}
          onSkip={handleEmailSkip}
        />
      )}

      {/* Step 5: Expert Matching */}
      {currentStep === 'expert_matching' && (
        <>
          <div className="bg-gray-50 rounded-lg p-3 text-center text-sm text-gray-700">
            Hold on tight {name || 'there'}, connecting you with an expert...
          </div>
          <ExpertMatchingCard userName={name} />
        </>
      )}
    </div>
  )
}
