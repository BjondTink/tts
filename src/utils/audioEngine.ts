import { Mp3Encoder } from '@breezystack/lamejs';

// Manual byte-level Base64 decoder that never relies on window.atob and never throws DOMException
function manualBase64ToArrayBuffer(b64: string): ArrayBuffer {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const lookup = new Uint8Array(256);
  for (let i = 0; i < chars.length; i++) {
    lookup[chars.charCodeAt(i)] = i;
  }

  let bufferLength = b64.length * 0.75;
  if (b64.endsWith('==')) bufferLength -= 2;
  else if (b64.endsWith('=')) bufferLength -= 1;

  const bytes = new Uint8Array(Math.max(0, Math.floor(bufferLength)));
  let p = 0;
  for (let i = 0; i < b64.length; i += 4) {
    const encoded1 = lookup[b64.charCodeAt(i)];
    const encoded2 = lookup[b64.charCodeAt(i + 1)];
    const encoded3 = lookup[b64.charCodeAt(i + 2)];
    const encoded4 = lookup[b64.charCodeAt(i + 3)];

    if (p < bytes.length) bytes[p++] = (encoded1 << 2) | (encoded2 >> 4);
    if (b64[i + 2] !== '=' && p < bytes.length) bytes[p++] = ((encoded2 & 15) << 4) | (encoded3 >> 2);
    if (b64[i + 3] !== '=' && p < bytes.length) bytes[p++] = ((encoded3 & 3) << 6) | (encoded4 & 63);
  }
  return bytes.buffer;
}

// Robust Base64 helper compatible with Safari/iOS, Chrome, Firefox
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  if (!base64 || typeof base64 !== 'string') {
    return new ArrayBuffer(0);
  }

  // Strip Data URI prefix if present (e.g. data:audio/wav;base64,)
  let cleaned = base64;
  const commaIdx = cleaned.indexOf(',');
  if (commaIdx !== -1 && cleaned.slice(0, commaIdx).includes('base64')) {
    cleaned = cleaned.slice(commaIdx + 1);
  }

  // Remove whitespace, line breaks, tabs
  cleaned = cleaned.replace(/[\s\r\n\t]+/g, '');

  // Convert URL-safe base64 to standard base64
  cleaned = cleaned.replace(/-/g, '+').replace(/_/g, '/');

  // Fix padding to multiple of 4
  const mod = cleaned.length % 4;
  if (mod !== 0) {
    cleaned += '='.repeat(4 - mod);
  }

  try {
    const binaryString = window.atob(cleaned);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  } catch {
    // If atob fails on Safari / iOS, fallback to manual binary decoder
    return manualBase64ToArrayBuffer(cleaned);
  }
}

// Convert AudioBuffer to MP3 Blob using Mp3Encoder
export function audioBufferToMp3Blob(audioBuffer: AudioBuffer, kbps = 192): Blob {
  const channels = audioBuffer.numberOfChannels;
  const sampleRate = audioBuffer.sampleRate;
  const length = audioBuffer.length;

  const leftFloat = audioBuffer.getChannelData(0);
  const rightFloat = channels > 1 ? audioBuffer.getChannelData(1) : undefined;

  // Convert Float32 to Int16
  const leftInt16 = new Int16Array(length);
  for (let i = 0; i < length; i++) {
    const s = Math.max(-1, Math.min(1, leftFloat[i]));
    leftInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }

  let rightInt16: Int16Array | undefined;
  if (rightFloat) {
    rightInt16 = new Int16Array(length);
    for (let i = 0; i < length; i++) {
      const s = Math.max(-1, Math.min(1, rightFloat[i]));
      rightInt16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
    }
  }

  const encoder = new Mp3Encoder(channels, sampleRate, kbps);
  const mp3Data: Uint8Array[] = [];
  const blockSize = 1152;

  for (let i = 0; i < length; i += blockSize) {
    const leftChunk = leftInt16.subarray(i, i + blockSize);
    const rightChunk = rightInt16 ? rightInt16.subarray(i, i + blockSize) : undefined;
    const mp3buf = encoder.encodeBuffer(leftChunk, rightChunk);
    if (mp3buf.length > 0) {
      mp3Data.push(new Uint8Array(mp3buf));
    }
  }

  const flushed = encoder.flush();
  if (flushed.length > 0) {
    mp3Data.push(new Uint8Array(flushed));
  }

  return new Blob(mp3Data as unknown as BlobPart[], { type: 'audio/mp3' });
}

// Render AudioBuffer with offline context for customized speed and sound effects
export async function renderProcessedAudio(
  sourceBuffer: AudioBuffer,
  options: {
    speed: number;
    bassBoost: boolean;
    clarity: boolean;
    reverb: boolean;
  }
): Promise<AudioBuffer> {
  const { speed, bassBoost, clarity, reverb } = options;

  // If no modifications, return source buffer directly
  if (speed === 1.0 && !bassBoost && !clarity && !reverb) {
    return sourceBuffer;
  }

  // Calculate new duration based on speed
  const targetSampleRate = sourceBuffer.sampleRate;
  const newDuration = sourceBuffer.duration / speed;
  const newLength = Math.max(1, Math.floor(newDuration * targetSampleRate));

  const offlineCtx = new OfflineAudioContext(
    sourceBuffer.numberOfChannels,
    newLength,
    targetSampleRate
  );

  const sourceNode = offlineCtx.createBufferSource();
  sourceNode.buffer = sourceBuffer;
  sourceNode.playbackRate.value = speed;

  let lastNode: AudioNode = sourceNode;

  // Bass Warmth EQ filter
  if (bassBoost) {
    const bassFilter = offlineCtx.createBiquadFilter();
    bassFilter.type = 'lowshelf';
    bassFilter.frequency.value = 220;
    bassFilter.gain.value = 4.5;
    lastNode.connect(bassFilter);
    lastNode = bassFilter;
  }

  // Clarity High EQ filter
  if (clarity) {
    const trebleFilter = offlineCtx.createBiquadFilter();
    trebleFilter.type = 'highshelf';
    trebleFilter.frequency.value = 3500;
    trebleFilter.gain.value = 3.5;
    lastNode.connect(trebleFilter);
    lastNode = trebleFilter;
  }

  // Subtle Room Reverb
  if (reverb) {
    const convolver = offlineCtx.createConvolver();
    const reverbLength = offlineCtx.sampleRate * 0.4;
    const impulse = offlineCtx.createBuffer(2, reverbLength, offlineCtx.sampleRate);
    const leftImpulse = impulse.getChannelData(0);
    const rightImpulse = impulse.getChannelData(1);

    for (let i = 0; i < reverbLength; i++) {
      const decay = Math.exp(-i / (offlineCtx.sampleRate * 0.08));
      leftImpulse[i] = (Math.random() * 2 - 1) * decay * 0.15;
      rightImpulse[i] = (Math.random() * 2 - 1) * decay * 0.15;
    }
    convolver.buffer = impulse;

    const dryGain = offlineCtx.createGain();
    dryGain.gain.value = 0.85;

    const wetGain = offlineCtx.createGain();
    wetGain.gain.value = 0.25;

    lastNode.connect(dryGain);
    lastNode.connect(convolver);
    convolver.connect(wetGain);

    dryGain.connect(offlineCtx.destination);
    wetGain.connect(offlineCtx.destination);

    sourceNode.start(0);
    return await offlineCtx.startRendering();
  } else {
    lastNode.connect(offlineCtx.destination);
    sourceNode.start(0);
    return await offlineCtx.startRendering();
  }
}
