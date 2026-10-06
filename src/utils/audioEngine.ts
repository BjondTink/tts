import lamejs from 'lamejs';

// Base64 helper
export function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binaryString = window.atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes.buffer;
}

// Convert AudioBuffer to MP3 Blob using lamejs
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

  const encoder = new lamejs.Mp3Encoder(channels, sampleRate, kbps);
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
