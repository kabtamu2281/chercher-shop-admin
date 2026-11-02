import jsQR from 'jsqr';
import QRCode from 'qrcode';

export interface ScanResult {
  rawText: string;
  format?: string;
  timestamp: number;
}

export class QrScannerService {
  private static instance: QrScannerService;

  private stream: MediaStream | null = null;
  private videoEl: HTMLVideoElement | null = null;
  private canvas: HTMLCanvasElement;
  private canvasCtx: CanvasRenderingContext2D | null;
  private animationFrameId: number | null = null;
  private isScanning = false;
  private facingMode: 'environment' | 'user' = 'environment';
  private torchEnabled = false;
  private audioCtx: AudioContext | null = null;
  private barcodeDetector: any = null;
  private lastScannedCode = '';
  private lastScannedTime = 0;

  private constructor() {
    this.canvas = document.createElement('canvas');
    this.canvasCtx = this.canvas.getContext('2d', { willReadFrequently: true });

    // Check if BarcodeDetector API is supported natively
    if (typeof window !== 'undefined' && 'BarcodeDetector' in window) {
      try {
        this.barcodeDetector = new (window as any).BarcodeDetector({
          formats: ['qr_code', 'code_128', 'code_39', 'ean_13', 'ean_8', 'upc_a'],
        });
      } catch (e) {
        console.info('Native BarcodeDetector not available, using pure jsQR engine', e);
        this.barcodeDetector = null;
      }
    }
  }

  public static getInstance(): QrScannerService {
    if (!QrScannerService.instance) {
      QrScannerService.instance = new QrScannerService();
    }
    return QrScannerService.instance;
  }

  /**
   * Plays a crisp high-pitch confirmation beep via Web Audio API
   */
  public playScanBeep() {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtxClass) return;
      if (!this.audioCtx || this.audioCtx.state === 'closed') {
        this.audioCtx = new AudioCtxClass();
      }
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }

      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(1760, this.audioCtx.currentTime); // A6 note
      osc.frequency.exponentialRampToValueAtTime(2349, this.audioCtx.currentTime + 0.08); // D7 note

      gain.gain.setValueAtTime(0.2, this.audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.audioCtx.currentTime + 0.12);

      osc.connect(gain);
      gain.connect(this.audioCtx.destination);

      osc.start();
      osc.stop(this.audioCtx.currentTime + 0.13);
    } catch (e) {
      console.warn('Audio feedback failed:', e);
    }
  }

  /**
   * Starts camera video stream and begins scanning frames
   */
  public async startScanning(
    videoElement: HTMLVideoElement,
    onSuccess: (code: string) => void,
    onError: (err: string) => void,
    options?: { continuous?: boolean; cooldownMs?: number },
  ): Promise<boolean> {
    this.stopScanning();

    this.videoEl = videoElement;
    this.isScanning = true;
    const cooldown = options?.cooldownMs ?? 1800;

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: { ideal: this.facingMode },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      };

      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.videoEl.srcObject = this.stream;
      this.videoEl.setAttribute('playsinline', 'true');
      await this.videoEl.play();

      this.runDetectionLoop(onSuccess, onError, options?.continuous ?? false, cooldown);
      return true;
    } catch (err: any) {
      this.isScanning = false;
      const errorMsg =
        err.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access in your browser settings to scan product barcodes.'
          : err.name === 'NotFoundError'
            ? 'No camera found on this device.'
            : `Unable to access camera: ${err.message || 'Unknown error'}`;
      onError(errorMsg);
      return false;
    }
  }

  /**
   * Continuous loop reading video frames and decoding QR / barcodes
   */
  private runDetectionLoop(
    onSuccess: (code: string) => void,
    onError: (err: string) => void,
    continuous: boolean,
    cooldownMs: number,
  ) {
    const loop = async () => {
      if (!this.isScanning || !this.videoEl) return;

      if (this.videoEl.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        const videoWidth = this.videoEl.videoWidth;
        const videoHeight = this.videoEl.videoHeight;

        if (videoWidth > 0 && videoHeight > 0) {
          let detectedCode: string | null = null;

          // 1. Try Native BarcodeDetector (fast hardware accelerated on Chromium/Android)
          if (this.barcodeDetector) {
            try {
              const barcodes = await this.barcodeDetector.detect(this.videoEl);
              if (barcodes && barcodes.length > 0) {
                detectedCode = barcodes[0].rawValue;
              }
            } catch {
              // BarcodeDetector may fail on frame capture, ignore and fall through
            }
          }

          // 2. Pure JS fallback using jsQR
          if (!detectedCode && this.canvasCtx) {
            this.canvas.width = videoWidth;
            this.canvas.height = videoHeight;
            this.canvasCtx.drawImage(this.videoEl, 0, 0, videoWidth, videoHeight);
            const imageData = this.canvasCtx.getImageData(0, 0, videoWidth, videoHeight);
            const code = jsQR(imageData.data, imageData.width, imageData.height, {
              inversionAttempts: 'dontInvert',
            });
            if (code && code.data) {
              detectedCode = code.data;
            }
          }

          if (detectedCode) {
            const now = Date.now();
            const isDifferent = detectedCode !== this.lastScannedCode;
            const cooldownPassed = now - this.lastScannedTime > cooldownMs;

            if (isDifferent || cooldownPassed) {
              this.lastScannedCode = detectedCode;
              this.lastScannedTime = now;
              this.playScanBeep();

              onSuccess(detectedCode);

              if (!continuous) {
                this.stopScanning();
                return;
              }
            }
          }
        }
      }

      this.animationFrameId = requestAnimationFrame(loop);
    };

    this.animationFrameId = requestAnimationFrame(loop);
  }

  /**
   * Stop scanning and release hardware camera resources
   */
  public stopScanning() {
    this.isScanning = false;

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    if (this.stream) {
      this.stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch {}
      });
      this.stream = null;
    }

    if (this.videoEl) {
      this.videoEl.srcObject = null;
      this.videoEl = null;
    }

    this.torchEnabled = false;
  }

  /**
   * Toggle between back and front camera
   */
  public async toggleCamera(
    videoElement: HTMLVideoElement,
    onSuccess: (code: string) => void,
    onError: (err: string) => void,
  ): Promise<'environment' | 'user'> {
    this.facingMode = this.facingMode === 'environment' ? 'user' : 'environment';
    await this.startScanning(videoElement, onSuccess, onError);
    return this.facingMode;
  }

  /**
   * Toggle flashlight/torch on mobile devices that support it
   */
  public async toggleTorch(): Promise<boolean> {
    if (!this.stream) return false;
    const videoTrack = this.stream.getVideoTracks()[0];
    if (!videoTrack) return false;

    try {
      const capabilities = (videoTrack.getCapabilities && videoTrack.getCapabilities()) as any;
      if (capabilities && capabilities.torch) {
        this.torchEnabled = !this.torchEnabled;
        await (videoTrack as any).applyConstraints({
          advanced: [{ torch: this.torchEnabled }],
        });
        return this.torchEnabled;
      }
    } catch (e) {
      console.warn('Torch control not supported on this track:', e);
    }
    return false;
  }

  public getTorchState(): boolean {
    return this.torchEnabled;
  }

  public getFacingMode(): 'environment' | 'user' {
    return this.facingMode;
  }

  /**
   * Generate a QR Code Data URL string for a given text or product code
   */
  public async generateQrDataUrl(
    data: string,
    options?: { width?: number; margin?: number; colorDark?: string; colorLight?: string },
  ): Promise<string> {
    try {
      return await QRCode.toDataURL(data, {
        width: options?.width ?? 320,
        margin: options?.margin ?? 2,
        color: {
          dark: options?.colorDark ?? '#000000',
          light: options?.colorLight ?? '#ffffff',
        },
        errorCorrectionLevel: 'M',
      });
    } catch (e) {
      console.error('Failed to generate QR code data URL:', e);
      return '';
    }
  }

  /**
   * Parse a scanned text string to extract product identifier.
   * Handles raw SKU, barcode, URL with sku, or JSON payload.
   */
  public parseScannedProductCode(rawText: string): string {
    const trimmed = rawText.trim();

    // 1. If it's a JSON string: { "sku": "CHR-PAI-101", ... }
    if (trimmed.startsWith('{') && trimmed.endsWith('}')) {
      try {
        const obj = JSON.parse(trimmed);
        return obj.sku || obj.code || obj.barcode || obj.id || trimmed;
      } catch {}
    }

    // 2. If it's a URL: https://cherchershop.et/product/CHR-PAI-101
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      try {
        const url = new URL(trimmed);
        const parts = url.pathname.split('/').filter(Boolean);
        if (parts.length > 0) {
          return parts[parts.length - 1];
        }
      } catch {}
    }

    // 3. Raw SKU or barcode
    return trimmed;
  }
}
