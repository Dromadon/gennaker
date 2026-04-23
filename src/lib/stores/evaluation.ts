import { writable } from 'svelte/store'
import type { Evaluation } from '$lib/domain/types'

export const evaluationStore = writable<Evaluation | null>(null)
