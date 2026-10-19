import { initializeApp } from 'firebase/app';
import {
  getFirestore,
  doc,
  getDoc,
  getDocFromServer,
  setDoc,
  collection,
  getDocs,
  onSnapshot,
} from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfig from '../firebase-applet-config.json';
import { APP_CONFIG, HER_PHOTO_URL } from './config.ts';

// Initialize Firebase App
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app, firebaseConfig.firestoreDatabaseId || '(default)');

// Track current user
let currentUser: User | null = null;
onAuthStateChanged(auth, (user) => {
  currentUser = user;
});

// Ensure authentication for writes
export async function ensureAuth(): Promise<User> {
  if (currentUser) return currentUser;
  if (auth.currentUser) {
    currentUser = auth.currentUser;
    return currentUser;
  }
  try {
    const cred = await signInAnonymously(auth);
    currentUser = cred.user;
    return cred.user;
  } catch (err) {
    console.warn('Anonymous auth note:', err);
    throw err;
  }
}

// Test connection on boot as mandated by Firebase Skill
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await ensureAuth();
    await getDocFromServer(doc(db, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore offline note: please verify internet connection.');
      return false;
    }
    // Expected if test doc does not exist; server responded
    return true;
  }
}

// Initial default photos to seed into Firestore
export const DEFAULT_DATABASE_PHOTOS: Record<string, { photoId: string; url: string; title: string; target: string }> = {
  krishu_id: {
    photoId: 'krishu_id',
    url: HER_PHOTO_URL || '/images/krishu-id.jpg',
    title: 'Krishu Birthday ID',
    target: 'id_card',
  },
  krishu_polaroid: {
    photoId: 'krishu_polaroid',
    url: '/images/polaroid-krishu.jpg',
    title: 'Lost & Found Polaroid · forever 20',
    target: 'polaroid',
  },
  badmash_profile: {
    photoId: 'badmash_profile',
    url: '/images/him-bw.jpg',
    title: 'Badmash Profile Shot',
    target: 'profile',
  },
};

export const DEFAULT_DATABASE_COVERS: Record<string, { songId: string; coverUrl: string; title: string; artist: string; side: 'her' | 'his' }> = {
  h1: {
    songId: 'h1',
    coverUrl: '/images/her1.jpg',
    title: 'pretty',
    artist: 'JVKE',
    side: 'her',
  },
  h2: {
    songId: 'h2',
    coverUrl: '/images/her2.jpg',
    title: 'Training Season',
    artist: 'Dua Lipa',
    side: 'her',
  },
  h3: {
    songId: 'h3',
    coverUrl: '/images/her3.jpg',
    title: 'Tera Naam Doon',
    artist: 'Atif Aslam',
    side: 'her',
  },
  b1: {
    songId: 'b1',
    coverUrl: '/images/him1.jpg',
    title: 'Warning',
    artist: 'Addi Kalyan',
    side: 'his',
  },
  b2: {
    songId: 'b2',
    coverUrl: '/images/him2.jpg',
    title: 'Bauji',
    artist: 'Mohit Ladotiya',
    side: 'his',
  },
  b3: {
    songId: 'b3',
    coverUrl: '/images/him3.jpg',
    title: 'Hangova',
    artist: 'Anirudh',
    side: 'his',
  },
};

// Seed initial photos & song covers to Firestore if not already seeded
export async function seedInitialDatabase() {
  try {
    await ensureAuth();

    // Check & seed photos
    for (const [key, photo] of Object.entries(DEFAULT_DATABASE_PHOTOS)) {
      const photoRef = doc(db, 'photos', key);
      const snapshot = await getDoc(photoRef);
      if (!snapshot.exists()) {
        await setDoc(photoRef, {
          ...photo,
          updatedAt: new Date().toISOString(),
        });
      }
    }

    // Check & seed song covers (ensure distinct uploaded images are used)
    for (const [key, cover] of Object.entries(DEFAULT_DATABASE_COVERS)) {
      const coverRef = doc(db, 'songCovers', key);
      const snapshot = await getDoc(coverRef);
      if (
        !snapshot.exists() ||
        snapshot.data()?.coverUrl === '/images/her-color.jpg' ||
        snapshot.data()?.coverUrl === '/images/him-bw.jpg'
      ) {
        await setDoc(coverRef, {
          ...cover,
          updatedAt: new Date().toISOString(),
        }, { merge: true });
      }
    }

    // Check & seed music tracks
    const defaultMusic: Record<string, { trackId: string; url: string; title: string; artist: string; volume: number }> = {
      b1: {
        trackId: 'b1',
        url: '/audio/him1.mp3',
        title: 'Warning',
        artist: 'Addi Kalyan',
        volume: 0.85,
      },
      finale: {
        trackId: 'finale',
        url: '/audio/we-fell-in-love-in-october.mp3',
        title: 'we fell in love in october',
        artist: 'girl in red',
        volume: 0.20,
      },
    };

    for (const [key, track] of Object.entries(defaultMusic)) {
      const musicRef = doc(db, 'music', key);
      const snapshot = await getDoc(musicRef);
      if (!snapshot.exists()) {
        await setDoc(musicRef, {
          ...track,
          updatedAt: new Date().toISOString(),
        });
      }
    }
  } catch (err) {
    console.warn('Database seed note:', err);
  }
}

// Save a photo permanently to Firestore
export async function savePhotoToFirestore(photoId: string, url: string, title: string, target: string) {
  await ensureAuth();
  const photoRef = doc(db, 'photos', photoId);
  const data = {
    photoId,
    url,
    title,
    target,
    updatedAt: new Date().toISOString(),
  };
  await setDoc(photoRef, data, { merge: true });
  return data;
}

// Save a song cover permanently to Firestore
export async function saveSongCoverToFirestore(
  songId: string,
  coverUrl: string,
  title?: string,
  artist?: string,
  side?: 'her' | 'his'
) {
  await ensureAuth();
  const coverRef = doc(db, 'songCovers', songId);
  const data: Record<string, unknown> = {
    songId,
    coverUrl,
    updatedAt: new Date().toISOString(),
  };
  if (title) data.title = title;
  if (artist) data.artist = artist;
  if (side) data.side = side;

  await setDoc(coverRef, data, { merge: true });
  return data;
}

// Fetch all permanent song covers from Firestore
export async function fetchAllSongCovers(): Promise<Record<string, string>> {
  try {
    const colRef = collection(db, 'songCovers');
    const snapshot = await getDocs(colRef);
    const covers: Record<string, string> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.coverUrl) {
        covers[docSnap.id] = data.coverUrl;
      }
    });
    return covers;
  } catch (err) {
    console.warn('Fetch song covers note:', err);
    return {};
  }
}

// Fetch all permanent photos from Firestore
export async function fetchAllPhotos(): Promise<Record<string, string>> {
  try {
    const colRef = collection(db, 'photos');
    const snapshot = await getDocs(colRef);
    const photos: Record<string, string> = {};
    snapshot.forEach((docSnap) => {
      const data = docSnap.data();
      if (data && data.url) {
        photos[docSnap.id] = data.url;
      }
    });
    return photos;
  } catch (err) {
    console.warn('Fetch photos note:', err);
    return {};
  }
}

// Real-time listener for song covers across all devices
export function subscribeToSongCovers(callback: (covers: Record<string, string>) => void): () => void {
  try {
    const colRef = collection(db, 'songCovers');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const covers: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.coverUrl) {
            covers[docSnap.id] = data.coverUrl;
          }
        });
        callback(covers);
      },
      (err) => {
        console.warn('Real-time covers subscription error:', err);
      }
    );
  } catch {
    return () => {};
  }
}

// Real-time listener for photos across all devices
export function subscribeToPhotos(callback: (photos: Record<string, string>) => void): () => void {
  try {
    const colRef = collection(db, 'photos');
    return onSnapshot(
      colRef,
      (snapshot) => {
        const photos: Record<string, string> = {};
        snapshot.forEach((docSnap) => {
          const data = docSnap.data();
          if (data && data.url) {
            photos[docSnap.id] = data.url;
          }
        });
        callback(photos);
      },
      (err) => {
        console.warn('Real-time photos subscription error:', err);
      }
    );
  } catch {
    return () => {};
  }
}

// Save music track permanently to Firestore
export async function saveMusicTrackToFirestore(
  trackId: string,
  url: string,
  title?: string,
  artist?: string,
  volume?: number
) {
  await ensureAuth();
  const musicRef = doc(db, 'music', trackId);
  const data: Record<string, unknown> = {
    trackId,
    url,
    updatedAt: new Date().toISOString(),
  };
  if (title) data.title = title;
  if (artist) data.artist = artist;
  if (typeof volume === 'number') data.volume = volume;

  await setDoc(musicRef, data, { merge: true });
  return data;
}

// Real-time listener for a music track
export function subscribeToMusicTrack(
  trackId: string,
  callback: (track: { url: string; title?: string; volume?: number } | null) => void
): () => void {
  try {
    const musicRef = doc(db, 'music', trackId);
    return onSnapshot(
      musicRef,
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          callback({
            url: data.url,
            title: data.title,
            volume: data.volume,
          });
        } else {
          callback(null);
        }
      },
      (err) => {
        console.warn('Real-time music subscription error:', err);
      }
    );
  } catch {
    return () => {};
  }
}
