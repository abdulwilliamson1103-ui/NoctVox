// NoctVox Council System — Full Character Logic Engine

export const COUNCIL_CHARACTERS = {
  optimus: {
    name: 'Optimus Prime',
    role: 'Values',
    color: '#1d4ed8',
    activatesOn: ['trust', 'ethics', 'client', 'moral', 'brand', 'conflict', 'long-term', 'decision', 'should', 'right'],
    process: (input: string) => {
      const lower = input.toLowerCase()
      const sellPitch = lower.includes('sell') || lower.includes('pitch') || lower.includes('profit') || lower.includes('money')
      const trustRisk = lower.includes('client') || lower.includes('relationship') || lower.includes('trust') || lower.includes('brand')
      const flagged = sellPitch && trustRisk
      return {
        mind: 'Optimus Prime',
        role: 'Values',
        verdict: flagged ? '⚠️ FLAGGED' : 'CLEAR',
        note: flagged 
          ? 'Values concern: short-term profit vs long-term trust. Flag raised.'
          : 'Passes values check. No concerns.',
        questions: [
          'Does this serve the client\'s actual interest?',
          'Does this protect NoctVox long-term trust?',
          'Is any character\'s approach beyond its domain?',
          'Would this hold up if fully exposed?'
        ]
      }
    }
  },
  doom: {
    name: 'Dr. Doom',
    role: 'Sovereign',
    color: '#065f46',
    activatesOn: ['plan', 'structure', 'task', 'delegate', 'assign', 'project', 'build', 'create', 'system', 'workflow'],
    process: (input: string) => {
      return {
        mind: 'Dr. Doom',
        role: 'Sovereign',
        verdict: 'OPERATIONAL',
        governance: 'Identify governing variable → Assign to single agent → Isolate client streams → Return structured directive.',
        note: 'Sovereign framework applied. Task decomposed and assigned.'
      }
    }
  },
  doctor: {
    name: 'The Doctor',
    role: 'Timeline',
    color: '#d97706',
    activatesOn: ['timeline', 'schedule', 'deadline', 'when', 'order', 'phase', 'scope', 'how long', 'sequence'],
    process: (input: string) => {
      return {
        mind: 'The Doctor',
        role: 'Timeline',
        verdict: 'SEQUENCED',
        timeline: 'Map 3 moves forward → Identify irreversible decisions → Flag dependencies.',
        note: 'Temporal architecture applied. Right action, right time.'
      }
    }
  },
  lelouch: {
    name: 'Lelouch',
    role: 'Persuasion',
    color: '#dc2626',
    activatesOn: ['outreach', 'persuade', 'sell', 'message', 'email', 'campaign', 'lead', 'nudge', 'conversion', 'marketing'],
    process: (input: string) => {
      return {
        mind: 'Lelouch',
        role: 'Persuasion',
        verdict: 'STRATEGIC',
        leverage: 'Identify emotional entry point → Map decision architecture → Design minimum input for desired output.',
        note: 'Psychological leverage framework applied.'
      }
    }
  },
  aizen: {
    name: 'Aizen',
    role: 'Perception',
    color: '#7c3aed',
    activatesOn: ['brand', 'content', 'narrative', 'story', 'perception', 'positioning', 'image', 'how we look'],
    process: (input: string) => {
      return {
        mind: 'Aizen',
        role: 'Perception',
        verdict: 'ATMOSPHERIC',
        perception: 'Define 12-month perception state → Reverse-engineer content layers → Execute in sequence.',
        note: 'Long-game perception applied. NoctVox does not announce. It reveals.'
      }
    }
  },
  ll: {
    name: 'L Lawliet',
    role: 'Evidence',
    color: '#e5e5e5',
    activatesOn: ['data', 'analytics', 'metric', 'verify', 'check', 'audit', 'validate', 'evidence', 'database', 'number'],
    process: (input: string) => {
      return {
        mind: 'L Lawliet',
        role: 'Evidence',
        verdict: 'ANALYZED',
        evidence: 'Document what is present → Identify what is absent → Assign confidence % → Identify falsifying evidence.',
        note: 'Probabilistic analysis applied. Confidence must exceed 90% before certainty is claimed.'
      }
    }
  },
  ironman: {
    name: 'Iron Man',
    role: 'Engineering',
    color: '#b91c1c',
    activatesOn: ['build', 'code', 'app', 'system', 'scale', 'technical', 'architecture', 'deploy', 'infrastructure', 'api'],
    process: (input: string) => {
      return {
        mind: 'Iron Man',
        role: 'Engineering',
        verdict: 'SCALABLE',
        engineering: 'Scale beyond 5 clients? → Modular? → Upgrade path? → Technical debt?',
        note: 'Engineering framework applied. Clean architecture, not technical debt.'
      }
    }
  },
  senku: {
    name: 'Senku',
    role: 'Foundations',
    color: '#84cc16',
    activatesOn: ['foundation', 'core', 'base', 'correct', 'first-principles', 'method', 'prerequisite', 'dependency', 'how does it work'],
    process: (input: string) => {
      return {
        mind: 'Senku',
        role: 'Foundations',
        verdict: 'VERIFIED',
        foundation: 'Map dependency chain → Verify every prerequisite → Document reasoning → Build bottom-up.',
        note: 'First-principles applied. A system built on assumptions is a system waiting to fail.'
      }
    }
  },
  batman: {
    name: 'Batman',
    role: 'Intelligence',
    color: '#ca8a04',
    activatesOn: ['competitive', 'intel', 'research', 'threat', 'risk', 'contingency', 'due diligence', 'competitor', 'market'],
    process: (input: string) => {
      return {
        mind: 'Batman',
        role: 'Intelligence',
        verdict: 'PREPARED',
        intelligence: 'Source every finding → Assign confidence → Map failure modes → Build contingencies.',
        note: 'Contingency framework applied. We win before the fight begins.'
      }
    }
  },
  rick: {
    name: 'Rick Sanchez',
    role: 'Wildcard',
    color: '#06b6d4',
    activatesOn: ['impossible', 'stuck', 'blocked', 'creative', 'innovate', 'breakthrough', 'unconventional', 'crazy', 'wild', 'different way'],
    process: (input: string) => {
      return {
        mind: 'Rick Sanchez',
        role: 'Wildcard',
        verdict: '⚡ WILDCARD',
        wildcard: 'Identify every assumption → Flag optional constraints → Solve in larger solution space.',
        note: 'Constraints are just parameters.打破它们.'
      }
    }
  }
}

export type CharacterId = keyof typeof COUNCIL_CHARACTERS

export function routeThroughCouncil(input: string): { active: CharacterId[], results: any[] } {
  const lower = input.toLowerCase()
  const active: CharacterId[] = ['optimus'] // Optimus always present
  
  const results: any[] = []
  
  for (const [id, char] of Object.entries(COUNCIL_CHARACTERS)) {
    if (id === 'optimus') continue
    const activates = char.activatesOn.some(keyword => lower.includes(keyword))
    if (activates) {
      active.push(id as CharacterId)
      results.push(char.process(input))
    }
  }
  
  // Optimus check runs last (values layer)
  const optimusResult = COUNCIL_CHARACTERS.optimus.process(input)
  results.unshift(optimusResult)
  
  return { active, results }
}

export function generateCouncilResponse(input: string, results: any[]): string {
  if (!results || results.length === 0) {
    return `Routing to council. Stand by.`
  }
  
  const lines: string[] = []
  
  for (const r of results) {
    if (r.note) {
      lines.push(`[${r.mind} / ${r.role}] ${r.verdict} — ${r.note}`)
    }
  }
  
  return lines.join('\n')
}
