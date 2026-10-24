export async function onRequestGet() {
  const VOICES = [
    // 🇦🇱 Shqip (Albanian)
    {
      id: 'Charon',
      name: 'Charon',
      gender: 'Mashkull',
      language: 'sq',
      languageLabel: 'Shqip',
      flag: '🇦🇱',
      toneDesc: 'Zë i thellë, autoritar, serioz dhe shumë bindës',
      recommendedFor: 'Vila elitare, apartamente premium, video promocionale dhe njoftime shitjesh',
      samplePitch: 'E thellë / Bariton',
      isPrimary: true,
    },
    {
      id: 'Kore',
      name: 'Kore',
      gender: 'Femër',
      language: 'sq',
      languageLabel: 'Shqip',
      flag: '🇦🇱',
      toneDesc: 'E ngrohtë, e qetë, me artikulim kristal të pastër',
      recommendedFor: 'Apartamente luksoze, rezidenca private dhe prezantime të rafinuara',
      samplePitch: 'E mesme / E butë',
    },

    // 🇬🇧 Anglisht (English)
    {
      id: 'Puck',
      name: 'Puck',
      gender: 'Mashkull',
      language: 'en',
      languageLabel: 'English',
      flag: '🇬🇧',
      toneDesc: 'Confident, dynamic, fluent international English delivery',
      recommendedFor: 'Luxury commercial ads, Reels, global buyer presentations',
      samplePitch: 'Mid / Dynamic',
      isPrimary: true,
    },
    {
      id: 'Zephyr',
      name: 'Zephyr',
      gender: 'Femër',
      language: 'en',
      languageLabel: 'English',
      flag: '🇬🇧',
      toneDesc: 'Warm, elegant, clear British & international pronunciation',
      recommendedFor: 'Penthouses, vacation retreats, corporate property listings',
      samplePitch: 'Bright / Polished',
    },

    // 🇮🇹 Italisht (Italian)
    {
      id: 'Orus',
      name: 'Orus',
      gender: 'Mashkull',
      language: 'it',
      languageLabel: 'Italiano',
      flag: '🇮🇹',
      toneDesc: 'Voce maschile calda, autorevole, naturale ed elegante',
      recommendedFor: 'Dimore storiche, ville sul lago/mare, annunci immobiliari di pregio',
      samplePitch: 'Profonda / Calda',
      isPrimary: true,
    },
    {
      id: 'Aoede',
      name: 'Aoede',
      gender: 'Femër',
      language: 'it',
      languageLabel: 'Italiano',
      flag: '🇮🇹',
      toneDesc: 'Voce femminile melodica, raffinata ed espressiva',
      recommendedFor: 'Appartamenti moderni, open space, video tour emozionali',
      samplePitch: 'Media / Espressiva',
    },

    // 🇩🇪 Gjermanisht (German)
    {
      id: 'Fenrir',
      name: 'Fenrir',
      gender: 'Mashkull',
      language: 'de',
      languageLabel: 'Deutsch',
      flag: '🇩🇪',
      toneDesc: 'Souveräne, präzise und vertrauenswürdige Männerstimme',
      recommendedFor: 'Kapitalanlagen, Neubauprojekte, Gewerbe- und Luxusimmobilien',
      samplePitch: 'Kräftig / Souverän',
      isPrimary: true,
    },
    {
      id: 'Leda',
      name: 'Leda',
      gender: 'Femër',
      language: 'de',
      languageLabel: 'Deutsch',
      flag: '🇩🇪',
      toneDesc: 'Freundliche, professionelle und kristallklare Frauenstimme',
      recommendedFor: 'Familienhäuser, Ferienwohnungen, ansprechende Social-Media-Clips',
      samplePitch: 'Mittel / Freundlich',
    },
  ];

  return new Response(JSON.stringify({ voices: VOICES }), {
    headers: { 'Content-Type': 'application/json' },
  });
}
