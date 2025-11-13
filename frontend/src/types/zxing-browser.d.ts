declare module '@zxing/browser' {
  export class BrowserCodeReader {
    static listVideoInputDevices(): Promise<MediaDeviceInfo[]>;
  }

  export class BrowserMultiFormatReader {
    decodeFromVideoDevice(
      deviceId: string | null,
      videoElement: HTMLVideoElement,
      callback: (result: Result | undefined, error?: unknown, controls?: unknown) => void
    ): Promise<void>;
    reset(): void;
  }
}

declare module '@zxing/library' {
  export interface Result {
    getText(): string;
  }
}

