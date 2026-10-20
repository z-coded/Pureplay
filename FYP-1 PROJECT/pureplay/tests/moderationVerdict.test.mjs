import test from 'node:test'
import assert from 'node:assert/strict'
import { moderationStatus, playbackVerdict } from '../src/lib/moderationVerdict.js'

test('a blocked Modal verdict cannot become approved despite a low visual score', () => {
  const report = { decision: 'BLOCKED_VIOLATION', safety_status: 'REJECTED',
    attribution: { visual_contribution: 0.006 } }
  assert.equal(moderationStatus(report), 'Flagged')
  assert.equal(playbackVerdict(report).canPlay, false)
})
test('missing and legacy score-only reports require review', () => {
  for (const report of [null, {}, { status: 'Approved', overall_nsfw_score: 0.01 }]) {
    assert.equal(moderationStatus(report), 'Pending')
    assert.equal(playbackVerdict(report).canPlay, false)
  }
})
test('restricted and contradictory verdicts cannot play', () => {
  for (const report of [
    { decision: 'RESTRICTED_PIN_REQUIRED' },
    { decision: 'SAFE_TO_STREAM', safety_status: 'REJECTED' },
  ]) assert.equal(playbackVerdict(report).canPlay, false)
})
test('explicit clean and redacted verdicts remain distinguishable', () => {
  assert.equal(moderationStatus({ decision: 'SAFE_TO_STREAM', safety_status: 'APPROVED' }), 'Approved')
  const redacted = { decision: 'CENSOR_AND_STREAM', safety_status: 'REDACTED' }
  assert.equal(moderationStatus(redacted), 'Flagged')
  assert.equal(playbackVerdict(redacted).canPlay, true)
  assert.equal(playbackVerdict(redacted).label, 'Redactions applied')
})

test('filtered output needs guardian approval and successful output verification', () => {
  const result = { decision: 'FILTERED_REVIEW_REQUIRED', verification_passed: true }
  assert.equal(moderationStatus(result), 'Pending')
  assert.equal(playbackVerdict(result).canPlay, true)
  assert.equal(playbackVerdict({ ...result, verification_passed: false }).canPlay, false)
  assert.equal(playbackVerdict({ ...result, safety_status: 'REJECTED' }).canPlay, false)
})
