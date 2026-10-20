// Only explicit server verdicts can approve a newly analyzed video.
export function moderationStatus(analysis) {
  const verdict = analysis?.guardrail_verdict || analysis
  if (verdict?.decision === 'FILTERED_REVIEW_REQUIRED') return 'Pending'
  if (['BLOCKED_VIOLATION', 'RESTRICTED_PIN_REQUIRED'].includes(verdict?.decision) ||
      verdict?.safety_status === 'REJECTED') return 'Flagged'
  if (verdict?.decision === 'CENSOR_AND_STREAM' || verdict?.safety_status === 'REDACTED') return 'Flagged'
  if (verdict?.decision === 'SAFE_TO_STREAM' && verdict?.safety_status === 'APPROVED') return 'Approved'
  return 'Pending'
}

export function playbackVerdict(analysis) {
  const verdict = analysis?.guardrail_verdict || analysis
  const status = moderationStatus(verdict)
  const blocked = ['BLOCKED_VIOLATION', 'RESTRICTED_PIN_REQUIRED'].includes(verdict?.decision) ||
    verdict?.safety_status === 'REJECTED'
  return {
    canPlay: status === 'Approved' || (!blocked && (verdict?.decision === 'CENSOR_AND_STREAM' ||
      (verdict?.decision === 'FILTERED_REVIEW_REQUIRED' && verdict?.verification_passed === true))),
    label: blocked ? 'Playback blocked' : status === 'Approved' ? 'No violations detected' :
      verdict?.decision === 'CENSOR_AND_STREAM' ? 'Redactions applied' :
        verdict?.decision === 'FILTERED_REVIEW_REQUIRED' ? 'Filtered · guardian review' : 'Review required',
    reason: verdict?.policy_reason || 'No verifiable analysis is stored. Re-upload this video for analysis.',
  }
}
