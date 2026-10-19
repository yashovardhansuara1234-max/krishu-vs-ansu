/**
 * Central Data Config for Project Krishu — Minimalist Pastel Edition
 * Easy customization: swap photos, audio links, and personal messages in 2 minutes.
 */

export interface SongItem {
  id: string;
  title: string;
  artist: string;
  cover: string;
  audio: string;
  duration?: string;
  // Tone frequency pattern for seamless WebAudio ambient preview fallback
  synthNotes?: number[];
  colorTheme?: 'pink' | 'lavender';
}

export interface AppConfig {
  birthdayDate: string;
  nickname: string;
  wishText: string;
  vsPhotos: {
    himGangster: string;
    herCute: string;
  };
  finaleSongUrl: string;
  herSongs: SongItem[];
  hisSongs: SongItem[];
  letterContent: {
    salutation: string;
    paragraphs: string[];
    signoff: string;
    author: string;
  };
  heroBirthdayMessage: string;
  lostAndFound: {
    id: string;
    photoUrl: string;
    returnTo: string;
    signature: string;
  };
  rabbitMessages: string[];
  polaroid: {
    image: string;
    caption: string;
    date: string;
  };
}

export function formatGoogleDriveUrl(url: string): string {
  if (!url) return url;
  const match =
    url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/) ||
    url.match(/[?&]id=([a-zA-Z0-9_-]+)/) ||
    url.match(/googleusercontent\.com\/d\/([a-zA-Z0-9_-]+)/);
  if (match && match[1]) {
    return `/api/drive-image?id=${match[1]}`;
  }
  return url;
}

export const HER_PHOTO_URL = "/images/krishu-id.jpg";

export const APP_CONFIG: AppConfig = {
  birthdayDate: "2026-10-20T00:00:00",
  nickname: "krishu",
  wishText: "happy birthday, krishu",
  heroBirthdayMessage: "To the girl who turns ordinary days into the best memories. Happy birthday, Krishu—here is a little soundtrack of us.",
  lostAndFound: {
    id: "20-10",
    photoUrl: "/images/krishu-id.jpg",
    returnTo: "Badmash",
    signature: "krishu ♡",
  },
  rabbitMessages: [
    "hoppy birthday krishu! 🐇",
    "psst... click 'Next Track' ✨",
    "best girl award goes to you ♡",
    "you're officially cooler than him 🌸"
  ],
  vsPhotos: {
    himGangster: "/images/him-bw.jpg",
    herCute: "/images/her-color.jpg",
  },
  finaleSongUrl: "/audio/we-fell-in-love-in-october.mp3",
  herSongs: [
    {
      id: "h1",
      title: "pretty",
      artist: "JVKE",
      cover: "/images/her1.jpg",
      audio: "/audio/her1.mp3",
      duration: "02:37",
      synthNotes: [329.63, 415.30, 493.88, 659.25], // E major bright melody
      colorTheme: 'pink'
    },
    {
      id: "h2",
      title: "Training Season",
      artist: "Dua Lipa",
      cover: "/images/her2.jpg",
      audio: "/audio/her2.mp3",
      duration: "03:29",
      synthNotes: [220.00, 261.63, 329.63, 392.00], // A minor upbeat pop
      colorTheme: 'pink'
    },
    {
      id: "h3",
      title: "Tera Naam Doon",
      artist: "Atif Aslam",
      cover: "/images/her3.jpg",
      audio: "/audio/her3.mp3",
      duration: "04:44",
      synthNotes: [293.66, 369.99, 440.00, 587.33], // D major romantic melody
      colorTheme: 'pink'
    }
  ],
  hisSongs: [
    {
      id: "b1",
      title: "Warning",
      artist: "Addi Kalyan",
      cover: "/images/him1.jpg",
      audio: "/audio/him1.mp3",
      duration: "02:59",
      synthNotes: [164.81, 196.00, 246.94, 329.63], // Heavy bass gangster groove
      colorTheme: 'lavender'
    },
    {
      id: "b2",
      title: "Bauji",
      artist: "Mohit Ladotiya",
      cover: "/images/him2.jpg",
      audio: "/audio/him2.mp3",
      duration: "03:22",
      synthNotes: [174.61, 220.00, 261.63, 349.23], // Raw rhythm and beat
      colorTheme: 'lavender'
    },
    {
      id: "b3",
      title: "Hangova",
      artist: "Anirudh",
      cover: "/images/him3.jpg",
      audio: "/audio/him3.mp3",
      duration: "03:15",
      synthNotes: [293.66, 349.23, 440.00, 523.25], // D minor energetic beat
      colorTheme: 'lavender'
    }
  ],
  letterContent: {
    salutation: "To the most special human,",
    paragraphs: [
      "Another year wiser, more radiant, and indefinitely cooler than everyone else in the room (even if I pretend my playlist is superior). Watching you grow into who you are has been nothing short of a blessing.",
      "Thank you for being my constant sanity check, the person who laughs at my terrible jokes, and the warmth that makes any ordinary day feel like an October song. You bring calm and joy to everyone fortunate enough to know you.",
      "May this year give you all the peace, laughter, late-night car karaoke, and dreams fulfilled that your heart has been longing for."
    ],
    signoff: "Forever your biggest fan,",
    author: "Badmash"
  },
  polaroid: {
    image: "/images/polaroid-krishu.jpg",
    caption: "Lost & Found · forever 20",
    date: "Oct 20, 2026"
  }
};
