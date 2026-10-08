export interface SongTrack {
  id: string;
  title: string;
  artist: string;
  source: string;
  license: string;
  url: string;
}

export const SONGS: SongTrack[] = [
  {
    id: 'floating-thread',
    title: 'Floating Thread With Bright Weightless Motion',
    artist: 'Alex Morgan',
    source: 'Free Music Archive',
    license: 'CC BY',
    url: '/songs/Alex%20Morgan%20-%20Floating%20Thread%20With%20Bright%20Weightless%20Motion.mp3'
  },
  {
    id: 'retro-phonk-aura',
    title: 'Retro Phonk Aura With Vintage Synths',
    artist: 'Alex Morgan',
    source: 'Free Music Archive',
    license: 'CC BY',
    url: '/songs/Alex%20Morgan%20-%20Retro%20Phonk%20Aura%20With%20Vintage%20Synths.mp3'
  },
  {
    id: 'snapdragon',
    title: 'SnapDragon',
    artist: 'Elijah_K',
    source: 'Free Music Archive',
    license: 'CC BY',
    url: '/songs/Elijah_K%20-%20SnapDragon.mp3'
  },
  {
    id: 'siloe',
    title: 'Siloe',
    artist: 'Elijah_K',
    source: 'Free Music Archive',
    license: 'CC BY',
    url: '/songs/Elijah_K%20-%20Siloe.mp3'
  }
];

const MUSIC_VOLUME = 0.28;

class MusicPlayer {
  private songs: SongTrack[] = SONGS;
  private pool: string[] = [];
  private lastPlayedId: string | null = null;
  private currentSong: SongTrack | null = null;
  private audio: HTMLAudioElement | null = null;
  private isMuted: boolean = false;
  private listeners: Set<(song: SongTrack) => void> = new Set();

  constructor() {
    // Prepare the first song immediately so UI and player are ready
    this.currentSong = this.pickNextSong();
  }

  // Picks a random song from the pool, refilling when empty and preventing back-to-back repeats
  private pickNextSong(): SongTrack {
    if (this.pool.length === 0) {
      this.pool = this.songs.map((s) => s.id);

      // Prevent the last played song from repeating immediately as the first pick in the fresh pool
      if (this.songs.length > 1 && this.lastPlayedId) {
        const eligible = this.pool.filter((id) => id !== this.lastPlayedId);
        const chosenId = eligible[Math.floor(Math.random() * eligible.length)];
        
        // Remove chosenId from pool (lastPlayedId stays in the pool for subsequent picks)
        this.pool = this.pool.filter((id) => id !== chosenId);
        this.lastPlayedId = chosenId;
        return this.songs.find((s) => s.id === chosenId)!;
      }
    }

    // Standard random pick from the active pool
    const index = Math.floor(Math.random() * this.pool.length);
    const chosenId = this.pool[index];
    this.pool.splice(index, 1);
    this.lastPlayedId = chosenId;
    return this.songs.find((s) => s.id === chosenId)!;
  }

  private initAudio() {
    if (this.audio) return;
    this.audio = new Audio();
    this.audio.preload = 'auto';
    this.audio.onended = () => {
      this.playNext();
    };
    this.audio.onerror = (e) => {
      console.warn('Music audio playback error, skipping to next track:', e);
      setTimeout(() => this.playNext(), 1000);
    };
  }

  public start() {
    this.initAudio();

    if (!this.audio!.src || this.audio!.src === '') {
      this.playSong(this.currentSong || this.pickNextSong());
    } else if (this.audio!.paused) {
      this.audio!.play().catch(() => {});
      if (this.currentSong) {
        this.notify(this.currentSong);
      }
    }
  }

  public playSong(song: SongTrack) {
    this.initAudio();
    this.currentSong = song;
    this.audio!.src = song.url;
    this.applyVolume();

    this.audio!.play().catch(() => {
      const resumeOnGesture = () => {
        if (this.audio && this.audio.paused) {
          this.audio.play().catch(() => {});
        }
        window.removeEventListener('click', resumeOnGesture);
        window.removeEventListener('keydown', resumeOnGesture);
        window.removeEventListener('touchstart', resumeOnGesture);
      };
      window.addEventListener('click', resumeOnGesture, { once: true });
      window.addEventListener('keydown', resumeOnGesture, { once: true });
      window.addEventListener('touchstart', resumeOnGesture, { once: true });
    });

    this.notify(song);
  }

  public playNext() {
    const nextSong = this.pickNextSong();
    this.playSong(nextSong);
  }

  public setMute(muted: boolean) {
    this.isMuted = muted;
    this.applyVolume();
  }

  // iOS ignores HTMLMediaElement.volume (it is read-only there), so muting must go through `muted`
  private applyVolume() {
    if (!this.audio) return;
    this.audio.volume = MUSIC_VOLUME;
    this.audio.muted = this.isMuted;
  }

  public stop() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
  }

  public getCurrentSong(): SongTrack | null {
    return this.currentSong;
  }

  public subscribe(listener: (song: SongTrack) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(song: SongTrack) {
    this.listeners.forEach((fn) => fn(song));
  }
}

export const musicPlayer = new MusicPlayer();
