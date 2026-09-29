import { describe, expect, it } from 'vitest'
import { arrayBufferToBase64 } from './binary'

describe('arrayBufferToBase64', () => {
  it('encodes bytes to a base64 string that round-trips via atob', () => {
    const bytes = new Uint8Array([72, 101, 108, 108, 111]) // "Hello"
    const base64 = arrayBufferToBase64(bytes.buffer)
    expect(atob(base64)).toBe('Hello')
  })

  it('encodes an empty buffer to an empty string', () => {
    expect(arrayBufferToBase64(new ArrayBuffer(0))).toBe('')
  })
})
