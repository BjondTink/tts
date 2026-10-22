export async function onRequestGet() {
  const VOICES = [
    {
      id: 'Charon',
      name: 'Charon (Mashkull - Primar)',
      gender: 'Mashkull',
      toneDesc: 'Zë i thellë, autoritar, serioz dhe bindës',
      recommendedFor: 'Vila elitare, apartamente premium, video promocionale dhe njoftime shitjesh',
      samplePitch: 'E thellë / Bariton',
    },
    {
      id: 'Kore',
      name: 'Kore (Femër)',
      gender: 'Femër',
      toneDesc: 'E ngrohtë, e qetë, me artikulim kristal të pastër',
      recommendedFor: 'Apartamente luksoze, rezidenca private dhe prezantime të rafinuara',
      samplePitch: 'E mesme / E butë',
    },
  ];

  return new Response(JSON.stringify({ voices: VOICES }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
