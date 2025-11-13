import { useEffect, useRef, useState } from 'react';
import { BrowserMultiFormatReader, BrowserCodeReader } from '@zxing/browser';
import type { Result } from '@zxing/library';
import { Camera, CameraOff, Loader2, ScanLine } from 'lucide-react';
import { toast } from 'react-hot-toast';

interface BarcodeScannerModalProps {
  onClose: () => void;
  onDetected: (code: string) => void;
}

export function BarcodeScannerModal({
  onClose,
  onDetected,
}: BarcodeScannerModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const [manualCode, setManualCode] = useState('');
  const [isCameraActive, setIsCameraActive] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        const reader = new BrowserMultiFormatReader();
        readerRef.current = reader;

        const videoDevices = await BrowserCodeReader.listVideoInputDevices();
        setDevices(videoDevices);

        if (videoDevices.length === 0) {
          toast.error('No camera devices found');
          setIsLoading(false);
          return;
        }

        const preferredDevice =
          videoDevices.find((device) =>
            device.label.toLowerCase().includes('back')
          ) ?? videoDevices[0];

        setSelectedDeviceId(preferredDevice.deviceId);

        await startDecoding(preferredDevice.deviceId);
      } catch (error) {
        console.error('Failed to initialise scanner', error);
        toast.error(
          'Unable to access camera. Please allow permissions or use manual input.'
        );
        setIsLoading(false);
      }
    };

    init();

    return () => {
      stopDecoding();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startDecoding = async (deviceId: string) => {
    try {
      setIsLoading(true);
      stopDecoding();

      if (!readerRef.current || !videoRef.current) return;

      readerRef.current.decodeFromVideoDevice(
        deviceId,
        videoRef.current,
        (result: Result | undefined) => {
          if (result) {
            const text = result.getText().trim();
            if (text.length === 0) return;

            onDetected(text);
            onClose();
            stopDecoding();
          }
        }
      );

      setIsCameraActive(true);
    } catch (error) {
      console.error('Failed to start camera', error);
      toast.error('Unable to start camera stream.');
    } finally {
      setIsLoading(false);
    }
  };

  const stopDecoding = () => {
    try {
      readerRef.current?.reset();
      if (videoRef.current?.srcObject instanceof MediaStream) {
        videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
        videoRef.current.srcObject = null;
      }
    } catch (error) {
      console.warn('Error stopping decoder', error);
    } finally {
      setIsCameraActive(false);
    }
  };

  const handleManualSubmit = () => {
    const trimmed = manualCode.trim();
    if (!trimmed) {
      toast.error('Enter a barcode first.');
      return;
    }
    onDetected(trimmed);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
      onClick={() => {
        onClose();
      }}
    >
      <div
        className="bg-white rounded-xl shadow-2xl w-full max-w-xl mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="border-b px-6 py-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <ScanLine className="w-5 h-5 text-blue-600" />
            Scan Barcode / QR Code
          </h3>
          <button
            onClick={() => {
              stopDecoding();
              onClose();
            }}
            className="text-gray-400 hover:text-gray-600"
          >
            ×
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center h-48 gap-3">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                <p className="text-sm text-gray-500">
                  Initialising camera – please wait…
                </p>
              </div>
            ) : isCameraActive ? (
              <div className="relative h-64 rounded-lg overflow-hidden">
                <video
                  ref={videoRef}
                  className="absolute inset-0 w-full h-full object-cover"
                  muted
                  autoPlay
                  playsInline
                />
                <div className="absolute inset-0 border-4 border-white/20 pointer-events-none" />
                <div className="absolute inset-0 grid grid-rows-3">
                  <div />
                  <div className="border-y-2 border-blue-500/80" />
                  <div />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-48 gap-3 text-center">
                <CameraOff className="w-10 h-10 text-gray-400" />
                <p className="text-sm text-gray-500">
                  Camera inactive. Use manual entry below or restart preview.
                </p>
              </div>
            )}

            <div className="mt-4 flex items-center gap-3">
              <select
                value={selectedDeviceId}
                onChange={(event) => {
                  const deviceId = event.target.value;
                  setSelectedDeviceId(deviceId);
                  startDecoding(deviceId);
                }}
                className="flex-1 px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              >
                {devices.map((device: MediaDeviceInfo) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.label || `Camera ${device.deviceId}`}
                  </option>
                ))}
              </select>

              <button
                onClick={() =>
                  isCameraActive
                    ? stopDecoding()
                    : selectedDeviceId
                      ? startDecoding(selectedDeviceId)
                      : undefined
                }
                className="inline-flex items-center gap-2 px-4 py-2 rounded-md border border-gray-300 hover:border-gray-400 text-sm font-medium"
              >
                {isCameraActive ? (
                  <>
                    <CameraOff className="w-4 h-4" />
                    Stop
                  </>
                ) : (
                  <>
                    <Camera className="w-4 h-4" />
                    Start
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-sm font-medium text-gray-700">
              Manual Entry (Keyboard Scanner)
            </p>
            <div className="flex gap-2">
              <input
                value={manualCode}
                onChange={(event) => setManualCode(event.target.value)}
                placeholder="Type or paste barcode"
                className="flex-1 px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleManualSubmit}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add
              </button>
            </div>
            <p className="text-xs text-gray-500">
              Tip: Most USB barcode scanners emulate keyboard input. Focus not
              required.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
