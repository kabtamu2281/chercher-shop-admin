export interface MusicTrack {
  id: string;
  title: string;
  prompt: string;
  source: 'lyria' | 'procedural';
  audioUrl?: string;
  duration?: string;
}

export class MusicService {
  private static instance: MusicService;
  private audioCtx: AudioContext | null = null;
  private currentAudioElement: HTMLAudioElement | null = null;
  private isSynthesizerPlaying = false;
  private synthInterval: any = null;

  public tracks: MusicTrack[] = [
    {
      id: 'track_1',
      title: 'Addis Morning Rush - Ethiopian Masinqo & Beat',
      prompt: 'Upbeat Ethiopian traditional masinqo and modern urban acoustic percussion for a busy building materials shop',
      source: 'procedural',
      duration: 'Loop',
    },
    {
      id: 'track_2',
      title: 'Triumphant Bulk Sale Fanfare',
      prompt: 'Celebratory Ethiopian brass fanfare with traditional Kebero drums for closing a 500-quintal steel rebar contract',
      source: 'procedural',
      duration: 'Fanfare',
    },
    {
      id: 'track_3',
      title: 'Warehouse Evening Calm - Tizita Acoustic',
      prompt: 'Soulful Ethiopian Tizita minor pentatonic acoustic krar and washint flute for evening financial closing',
      source: 'procedural',
      duration: 'Chill',
    },
  ];

  public isPlaying = false;
  public currentTrackTitle = 'Kpax Ambient Store Sound';

  public static getInstance(): MusicService {
    if (!MusicService.instance) {
      MusicService.instance = new MusicService();
    }
    return MusicService.instance;
  }

  public async generateLyriaTrack(
    prompt: string,
    onStatus?: (status: string) => void,
  ): Promise<{ success: boolean; track?: MusicTrack; error?: string }> {
    try {
      onStatus?.('Contacting Gemini Lyria Music Generator...');
      const response = await fetch('/api/generate-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt,
          model: 'lyria-3-clip-preview',
        }),
      });

      const data = await response.json();

      if (data.status === 'success' && data.audioDataUrl) {
        const newTrack: MusicTrack = {
          id: `lyria_${Date.now()}`,
          title: `Lyria: ${prompt.substring(0, 32)}...`,
          prompt,
          source: 'lyria',
          audioUrl: data.audioDataUrl,
          duration: '30s',
        };
        this.tracks.unshift(newTrack);
        this.playLyriaTrack(newTrack);
        return { success: true, track: newTrack };
      } else {
        // Fallback to high-quality procedural Ethiopian pentatonic music
        onStatus?.('Synthesizing procedural Ethiopian rhythm...');
        this.playProceduralTrack(prompt.includes('fanfare') ? 'fanfare' : 'tizita');
        return {
          success: true,
          error: data.message || 'Played via offline synthesizer engine',
        };
      }
    } catch (e: any) {
      console.warn('Lyria API call error, falling back to synthesizer:', e);
      this.playProceduralTrack('tizita');
      return { success: true, error: 'Switched to procedural synth' };
    }
  }

  public playLyriaTrack(track: MusicTrack) {
    this.stop();
    if (!track.audioUrl) return;

    this.currentAudioElement = new Audio(track.audioUrl);
    this.currentAudioElement.volume = 0.6;
    this.currentAudioElement.play().catch((e) => console.warn('Audio play error:', e));
    this.isPlaying = true;
    this.currentTrackTitle = track.title;

    this.currentAudioElement.onended = () => {
      this.isPlaying = false;
    };
  }

  public playProceduralTrack(mode: 'tizita' | 'anchihoye' | 'fanfare' = 'tizita') {
    this.stop();

    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    if (!this.audioCtx) {
      this.audioCtx = new AudioContextClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }

    this.isPlaying = true;
    this.isSynthesizerPlaying = true;
    this.currentTrackTitle =
      mode === 'fanfare'
        ? 'Triumphant Sale Fanfare (Synthesizer)'
        : mode === 'anchihoye'
          ? 'Anchihoye Work Beat (Synthesizer)'
          : 'Tizita Warehouse Calm (Synthesizer)';

    // Ethiopian pentatonic scale frequencies (Tizita minor approx in Hz)
    const tizitaScale = [220.0, 246.94, 261.63, 329.63, 349.23, 440.0, 493.88, 523.25];
    const fanfareNotes = [261.63, 329.63, 392.0, 523.25, 659.25];

    const notes = mode === 'fanfare' ? fanfareNotes : tizitaScale;
    let step = 0;

    const playNote = () => {
      if (!this.isSynthesizerPlaying || !this.audioCtx) return;

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      // Plucked acoustic string / washint flute timbre
      osc.type = mode === 'fanfare' ? 'sawtooth' : 'triangle';
      const noteFreq = notes[step % notes.length];
      osc.frequency.setValueAtTime(noteFreq, this.audioCtx.currentTime);

      // Kebero drum beat simulation on every 4th step
      if (step % 2 === 0) {
        this.playDrumBeat();
      }

      const now = this.audioCtx.currentTime;
      gain.gain.setValueAtTime(0, now);
      gain.gain.linearRampToValueAtTime(0.08, now + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, now + (mode === 'fanfare' ? 0.35 : 0.6));

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start(now);
      osc.stop(now + 0.7);

      step++;
      if (mode === 'fanfare' && step > 12) {
        // Stop fanfare after brief burst
        this.stop();
      }
    };

    this.synthInterval = setInterval(playNote, mode === 'fanfare' ? 220 : 380);
    playNote();
  }

  private playDrumBeat() {
    if (!this.audioCtx) return;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    const now = this.audioCtx.currentTime;
    osc.frequency.setValueAtTime(110, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.15);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.18);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start(now);
    osc.stop(now + 0.2);
  }

  public stop() {
    if (this.currentAudioElement) {
      this.currentAudioElement.pause();
      this.currentAudioElement = null;
    }
    if (this.synthInterval) {
      clearInterval(this.synthInterval);
      this.synthInterval = null;
    }
    this.isSynthesizerPlaying = false;
    this.isPlaying = false;
  }

  public togglePlay() {
    if (this.isPlaying) {
      this.stop();
    } else {
      this.playProceduralTrack('tizita');
    }
  }
}
