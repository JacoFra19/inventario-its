

"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    BarcodeDetector?: new (options?: { formats?: string[] }) => {
      detect: (source: HTMLVideoElement) => Promise<Array<{ rawValue: string }>>;
    };
  }
}

function extractInventoryCode(value: string) {
  const match = value.match(/ITST-[A-Z0-9]+-\d{4}/i);
  return match ? match[0].toUpperCase() : value.trim();
}

export default function ScanPage() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scanningRef = useRef(false);

  const [manualCode, setManualCode] = useState("");
  const [status, setStatus] = useState("Scanner pronto.");
  const [cameraActive, setCameraActive] = useState(false);
  const [scannerSupported, setScannerSupported] = useState(true);

  function openAsset(codeOrUrl: string) {
    const code = extractInventoryCode(codeOrUrl);

    if (!code) {
      setStatus("Codice non valido.");
      return;
    }

    window.location.href = `/assets/${code}`;
  }

  async function startCamera() {
    if (!window.BarcodeDetector) {
      setScannerSupported(false);
      setStatus("Scanner fotocamera non supportato da questo browser. Usa il campo manuale.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      setCameraActive(true);
      setStatus("Inquadra il QR dell'asset.");
      scanLoop();
    } catch (error) {
      console.error(error);
      setStatus("Impossibile avviare la fotocamera. Controlla i permessi del browser.");
    }
  }

  function stopCamera() {
    scanningRef.current = false;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setCameraActive(false);
    setStatus("Scanner fermato.");
  }

  async function scanLoop() {
    if (!window.BarcodeDetector || !videoRef.current) return;

    const detector = new window.BarcodeDetector({ formats: ["qr_code"] });
    scanningRef.current = true;

    while (scanningRef.current) {
      try {
        const codes = await detector.detect(videoRef.current);

        if (codes.length > 0) {
          const value = codes[0].rawValue;
          stopCamera();
          openAsset(value);
          return;
        }
      } catch (error) {
        console.error(error);
        setStatus("Errore durante la scansione. Riprova o usa il campo manuale.");
      }

      await new Promise((resolve) => setTimeout(resolve, 400));
    }
  }

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, []);

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <Link href="/" className="text-blue-600 hover:underline">
        ← Dashboard
      </Link>

      <section className="mt-6 rounded-3xl bg-gray-900 p-8 text-white shadow">
        <p className="text-sm uppercase tracking-[0.3em] text-gray-300">
          Scanner QR
        </p>
        <h1 className="mt-3 text-4xl font-bold">Scansiona asset</h1>
        <p className="mt-3 max-w-2xl text-gray-300">
          Inquadra il QR code presente sull&apos;etichetta inventariale oppure inserisci manualmente il codice asset.
        </p>
      </section>

      <section className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Fotocamera</h2>
          <p className="mt-2 text-sm text-gray-500">{status}</p>

          <div className="mt-5 overflow-hidden rounded-2xl border bg-black">
            <video
              ref={videoRef}
              className="aspect-video w-full object-cover"
              muted
              playsInline
            />
          </div>

          <div className="mt-5 flex gap-3">
            <button
              onClick={startCamera}
              disabled={cameraActive}
              className="rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              Avvia scanner
            </button>

            <button
              onClick={stopCamera}
              disabled={!cameraActive}
              className="rounded-xl border px-5 py-3 font-semibold hover:bg-gray-50 disabled:opacity-50"
            >
              Ferma
            </button>
          </div>

          {!scannerSupported && (
            <p className="mt-4 rounded-xl bg-yellow-50 p-3 text-sm text-yellow-800">
              Questo browser non supporta la scansione QR nativa. Usa l&apos;inserimento manuale oppure prova Chrome/Edge.
            </p>
          )}
        </div>

        <div className="rounded-2xl bg-white p-6 shadow">
          <h2 className="text-xl font-bold">Inserimento manuale</h2>
          <p className="mt-2 text-sm text-gray-500">
            Utile se la fotocamera non è disponibile o se vuoi aprire rapidamente un codice.
          </p>

          <div className="mt-5 flex flex-col gap-3">
            <input
              className="rounded-xl border p-3 font-mono"
              placeholder="Es. ITST-LE1-0001"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") openAsset(manualCode);
              }}
            />

            <button
              onClick={() => openAsset(manualCode)}
              disabled={!manualCode.trim()}
              className="rounded-xl bg-gray-900 px-5 py-3 font-semibold text-white hover:bg-black disabled:opacity-50"
            >
              Apri asset
            </button>
          </div>
        </div>
      </section>
    </main>
  );
}
