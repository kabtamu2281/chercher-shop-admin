/**
 * InstallAppButton UI Component
 * 
 * Listens for the 'pwa-prompt-available' custom event and standalone display mode,
 * rendering a prominent 'Install App' button in the application's top navigation bar.
 * When clicked, triggers the stored window.deferredPrompt to prompt the user for installation.
 */
export class InstallAppButton {
  private element: HTMLElement;
  public isAvailable: boolean = false;
  public isInstalled: boolean = false;

  constructor(mountContainer?: HTMLElement) {
    this.element = document.createElement('div');
    this.element.className = 'inline-flex items-center';
    this.element.id = 'pwa-install-app-component';

    if (typeof window !== 'undefined') {
      const isStandalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        (navigator as any).standalone === true ||
        document.referrer.includes('android-app://');
      this.isInstalled = isStandalone;
      this.isAvailable = Boolean((window as any).deferredPrompt);

      // Listen for the existing 'pwa-prompt-available' event listener dispatched on window
      window.addEventListener('pwa-prompt-available', () => {
        this.isAvailable = true;
        this.render();
      });

      // Listen for installation completion
      window.addEventListener('pwa-app-installed', () => {
        this.isInstalled = true;
        this.isAvailable = false;
        this.render();
      });

      window.addEventListener('appinstalled', () => {
        this.isInstalled = true;
        this.isAvailable = false;
        this.render();
      });
    }

    this.render();

    if (mountContainer) {
      mountContainer.appendChild(this.element);
    }
  }

  public getElement(): HTMLElement {
    return this.element;
  }

  /**
   * Generates the semantic HTML markup for the top navigation bar.
   */
  public renderHTML(): string {
    if (this.isInstalled) {
      return `
        <div id="btn-top-install-app" class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-bold cursor-default shadow-sm select-none" title="Chercher Building Material Retail Shop is installed on this device">
          <span class="material-symbols-outlined text-base text-emerald-400">check_circle</span>
          <span class="font-bold">Installed</span>
        </div>
      `;
    }

    return `
      <button 
        id="btn-top-install-app" 
        type="button"
        class="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-amber-500/50 bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-500/25 hover:from-amber-500/30 hover:to-amber-500/20 text-amber-200 text-xs transition font-bold shadow-md shadow-amber-500/15 cursor-pointer group animate-pulse" 
        title="Install Chercher Shop directly to your device home screen or desktop (PWA)"
      >
        <span class="material-symbols-outlined text-base text-amber-400 group-hover:scale-110 transition-transform">install_mobile</span>
        <span class="font-extrabold tracking-wide text-amber-100">Install App</span>
        <span class="text-[10px] px-1 py-0.2 rounded bg-amber-500/25 text-amber-300 font-mono font-bold hidden sm:inline">PWA</span>
      </button>
    `;
  }

  /**
   * Triggers the stored deferredPrompt on the window object to initiate native PWA installation.
   */
  public triggerInstall(
    onSuccess?: (platform: string) => void,
    onDismiss?: () => void,
    onFallback?: () => void
  ) {
    const deferred = (window as any).deferredPrompt;

    if (deferred) {
      deferred.prompt();
      deferred.userChoice.then((choiceResult: { outcome: 'accepted' | 'dismissed'; platform: string }) => {
        if (choiceResult.outcome === 'accepted') {
          this.isInstalled = true;
          this.isAvailable = false;
          (window as any).deferredPrompt = null;
          this.render();
          if (onSuccess) {
            onSuccess(choiceResult.platform);
          }
        } else {
          if (onDismiss) {
            onDismiss();
          }
        }
      });
      return;
    }

    // If deferredPrompt is not yet available, trigger appropriate fallback guidance
    if (onFallback) {
      onFallback();
    }
  }

  public render() {
    this.element.innerHTML = this.renderHTML();
    const btn = this.element.querySelector('#btn-top-install-app');
    if (btn && !this.isInstalled) {
      btn.addEventListener('click', () => this.triggerInstall());
    }
  }
}
