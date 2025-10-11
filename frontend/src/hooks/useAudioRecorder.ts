import { useEffect, useRef, useState } from "react";

export function useAudioRecorder() {
  const [recording, setRecording] = useState(false);
  const [permission, setPermission] = useState<"granted"|"denied"|"prompt">("prompt");
  const mediaStream = useRef<MediaStream|null>(null);
  const mediaRec = useRef<MediaRecorder|null>(null);
  const chunks = useRef<BlobPart[]>([]);

  useEffect(() => {
    navigator.permissions?.query({ name: "microphone" as any })
      .then((p) => setPermission(p.state as any))
      .catch(() => {});
  }, []);

  async function start() {
    if (recording) return;
    mediaStream.current = await navigator.mediaDevices.getUserMedia({ audio: true });
    mediaRec.current = new MediaRecorder(mediaStream.current, { mimeType: "audio/webm" });
    chunks.current = [];
    mediaRec.current.ondataavailable = (e) => chunks.current.push(e.data);
    mediaRec.current.onstop = () => {};
    mediaRec.current.start();
    setRecording(true);
  }

  async function stop(): Promise<File|null> {
    if (!recording || !mediaRec.current) return null;
    return new Promise((resolve) => {
      mediaRec.current!.onstop = () => {
        const blob = new Blob(chunks.current, { type: "audio/webm" });
        const file = new File([blob], `audio-${Date.now()}.webm`, { type: "audio/webm" });
        cleanup();
        resolve(file);
      };
      mediaRec.current!.stop();
    });
  }

  function cleanup() {
    mediaRec.current?.stream.getTracks().forEach(t => t.stop());
    mediaRec.current = null;
    mediaStream.current = null;
    setRecording(false);
  }

  return { recording, permission, start, stop, cleanup };
}

