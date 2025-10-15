'use client'

import { useReducer, useCallback, useEffect, useRef } from 'react'
import { saveOnboarding } from '../services/chatApi'
import { UI_TIMING } from '../constants'
import type {
  OnboardingState,
  OnboardingAction,
  UseOnboardingFlowReturn,
} from '../types'

/**
 * Initial onboarding state
 */
const initialState: OnboardingState = {
  currentStep: 'connect_prompt',
  query: '',
  name: '',
  email: '',
  completedSteps: [],
  isActive: false,
}

/**
 * Onboarding state reducer
 * Manages all state transitions for the onboarding flow
 */
function onboardingReducer(
  state: OnboardingState,
  action: OnboardingAction
): OnboardingState {
  switch (action.type) {
    case 'CONNECT_EXPERT':
      return {
        ...state,
        currentStep: 'query_input',
        completedSteps: [...state.completedSteps, 'connect_prompt'],
        isActive: true,
      }

    case 'SUBMIT_QUERY':
      return {
        ...state,
        query: action.payload,
        currentStep: 'name_input',
        completedSteps: [...state.completedSteps, 'query_input'],
      }

    case 'SUBMIT_NAME':
      return {
        ...state,
        name: action.payload,
        currentStep: 'email_input',
        completedSteps: [...state.completedSteps, 'name_input'],
      }

    case 'SKIP_NAME':
      return {
        ...state,
        name: '',
        currentStep: 'email_input',
        completedSteps: [...state.completedSteps, 'name_input'],
      }

    case 'SUBMIT_EMAIL':
      return {
        ...state,
        email: action.payload,
        completedSteps: [...state.completedSteps, 'email_input'],
      }

    case 'SKIP_EMAIL':
      return {
        ...state,
        email: '',
        completedSteps: [...state.completedSteps, 'email_input'],
      }

    case 'START_MATCHING':
      return {
        ...state,
        currentStep: 'expert_matching',
      }

    case 'COMPLETE_ONBOARDING':
      return {
        ...state,
        currentStep: 'complete',
        isActive: false,
      }

    case 'RESET_ONBOARDING':
      return initialState

    default:
      return state
  }
}

/**
 * Onboarding Flow Hook
 *
 * Manages the entire onboarding flow using a reducer pattern.
 * Provides a clean API for handling each step of the onboarding process.
 *
 * Features:
 * - State machine pattern with useReducer
 * - Prevents impossible states
 * - Automatic API integration
 * - Proper timeout cleanup
 * - Memory leak prevention
 */
export function useOnboardingFlow(
  threadId: string,
  onComplete: (query: string) => void
): UseOnboardingFlowReturn {
  const [state, dispatch] = useReducer(onboardingReducer, initialState)
  const timeoutRef = useRef<NodeJS.Timeout | undefined>(undefined)

  /**
   * Clean up timeouts on unmount to prevent memory leaks
   */
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }
    }
  }, [])

  /**
   * Handle expert connection
   */
  const handleConnectExpert = useCallback(() => {
    dispatch({ type: 'CONNECT_EXPERT' })
  }, [])

  /**
   * Handle query submission
   */
  const handleQuerySubmit = useCallback((query: string) => {
    dispatch({ type: 'SUBMIT_QUERY', payload: query })
  }, [])

  /**
   * Handle name submission
   */
  const handleNameSubmit = useCallback((name: string) => {
    dispatch({ type: 'SUBMIT_NAME', payload: name })
  }, [])

  /**
   * Handle name skip
   */
  const handleNameSkip = useCallback(() => {
    dispatch({ type: 'SKIP_NAME' })
  }, [])

  /**
   * Handle email submission
   */
  const handleEmailSubmit = useCallback(
    async (email: string) => {
      dispatch({ type: 'SUBMIT_EMAIL', payload: email })
      await finalizeOnboarding(email)
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [threadId, state.name, state.query]
  )

  /**
   * Handle email skip
   */
  const handleEmailSkip = useCallback(async () => {
    dispatch({ type: 'SKIP_EMAIL' })
    await finalizeOnboarding('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [threadId, state.name, state.query])

  /**
   * Finalize onboarding - save to database and transition to chat
   */
  const finalizeOnboarding = useCallback(
    async (email: string) => {
      // Save onboarding data to database
      try {
        await saveOnboarding({
          threadId,
          name: state.name,
          email,
          query: state.query,
        })
      } catch (error) {
        console.error('[useOnboardingFlow] Failed to save onboarding data:', error)
        // Continue with onboarding completion even if save fails
      }

      // Show expert matching step
      dispatch({ type: 'START_MATCHING' })

      // Clear any existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current)
      }

      // After delay, complete onboarding and trigger AI response
      timeoutRef.current = setTimeout(() => {
        dispatch({ type: 'COMPLETE_ONBOARDING' })
        onComplete(state.query)
      }, UI_TIMING.ONBOARDING_TRANSITION_DELAY)
    },
    [threadId, state.name, state.query, onComplete]
  )

  /**
   * Reset onboarding to initial state
   */
  const resetOnboarding = useCallback(() => {
    // Clear any pending timeouts
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
    dispatch({ type: 'RESET_ONBOARDING' })
  }, [])

  return {
    state,
    handlers: {
      handleConnectExpert,
      handleQuerySubmit,
      handleNameSubmit,
      handleNameSkip,
      handleEmailSubmit,
      handleEmailSkip,
      resetOnboarding,
    },
  }
}
