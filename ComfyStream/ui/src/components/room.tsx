"use client";

import { PeerConnector } from "@/components/peer";
import { StreamConfig, StreamSettings } from "@/components/settings";
import { Webcam } from "@/components/webcam";
import { usePeerContext } from "@/context/peer-context";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface MediaStreamPlayerProps {
  stream: MediaStream;
}

function MediaStreamPlayer({ stream }: MediaStreamPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted
      className="w-full h-full"
    />
  );
}

interface StageProps {
  connected: boolean;
  onStreamReady: () => void;
}

function Stage({ connected, onStreamReady }: StageProps) {
  const { remoteStream, peerConnection } = usePeerContext();
  const [frameRate, setFrameRate] = useState<number>(0);

  useEffect(() => {
    if (!connected || !remoteStream) return;

    onStreamReady();

    const interval = setInterval(() => {
      if (peerConnection) {
        peerConnection.getStats().then((stats) => {
          stats.forEach((report) => {
            if (report.type === "inbound-rtp" && report.kind === "video") {
              const currentFrameRate = report.framesPerSecond;
              if (currentFrameRate) {
                setFrameRate(Math.round(currentFrameRate));
              }
            }
          });
        });
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [connected, remoteStream, peerConnection, onStreamReady]);

  if (!connected || !remoteStream) {
    return (
      <>
        <video
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
          playsInline
        >
          <source src="/loading.mp4" type="video/mp4" />
        </video>
      </>
    );
  }

  return (
    <div className="relative">
      <MediaStreamPlayer stream={remoteStream} />
      <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-sm">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>{frameRate} FPS</TooltipTrigger>
            <TooltipContent>
              <p>This is the FPS of the output stream.</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}

export function Room() {
  const [connect, setConnect] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isStreamSettingsOpen, setIsStreamSettingsOpen] =
    useState<boolean>(true);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [loadingToastId, setLoadingToastId] = useState<
    string | number | undefined
  >(undefined);

  const [config, setConfig] = useState<StreamConfig>({
    streamUrl: "",
    frameRate: 0,
    selectedDeviceId: "",
    prompt: null,
  });

  const connectingRef = useRef(false);

  const onStreamReady = useCallback((stream: MediaStream) => {
    setLocalStream(stream);
  }, []);

  const onRemoteStreamReady = useCallback(() => {
    toast.success("Started stream!", { id: loadingToastId });
    setLoadingToastId(undefined);
  }, [loadingToastId]);

  const onStreamConfigSave = useCallback((config: StreamConfig) => {
    setConfig(config);
  }, []);

  useEffect(() => {
    if (connectingRef.current) return;

    if (!config.streamUrl) {
      setConnect(false);
    } else {
      setConnect(true);

      const id = toast.loading("Starting stream...");
      setLoadingToastId(id);

      connectingRef.current = true;
    }
  }, [config.streamUrl]);

  const handleConnected = useCallback(() => {
    setIsConnected(true);

    console.debug("Connected!");

    connectingRef.current = false;
  }, []);

  const handleDisconnected = useCallback(() => {
    setIsConnected(false);

    console.debug("Disconnected!");
  }, []);


  const [currentRegion, setCurrentRegion] = useState(config.prompt?.[2]?.inputs?.["text_input"]  || "");
  const [currentPrompt, setCurrentPrompt] = useState(config.prompt?.[6]?.inputs?.["text"]  || "");
  
  const updateNodeValue = async (nodeId: string, inputName: string, newValue: any) => {
    try {
      let prompt: any = config.prompt;
      prompt[nodeId].inputs[inputName] = newValue;

        const response = await fetch("/api/update_node", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt,
                endpoint: config.streamUrl,
            }),
        });

        const result = await response.json();
        if (response.ok) {
            console.log("Node updated:", result);
        } else {
            console.error("Failed to update node:", result.error);
        }
    } catch (error) {
        console.error("Error updating node:", error);
    }
};

useEffect(() => {  

  if (config.prompt) {
    setCurrentRegion(config.prompt?.[2]?.inputs?.["text_input"]  || "")
    setCurrentPrompt(config.prompt?.[6]?.inputs?.["text"]  || "")
  }


 },[config.prompt])


  return (
    <main className="fixed inset-0 overflow-hidden overscroll-none">
      <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no"
      />
      <div className="fixed inset-0 z-[-1] bg-cover bg-[black]">
        <PeerConnector
          url={config.streamUrl}
          prompt={config.prompt}
          connect={connect}
          onConnected={handleConnected}
          onDisconnected={handleDisconnected}
          localStream={localStream}
        >
          <div className="min-h-[100dvh] flex flex-col items-center justify-center">
            <div className="w-full max-h-[100dvh] flex flex-col lg:flex-row landscape:flex-row justify-center items-center lg:space-x-4">
              <div className="landscape:w-full lg:w-1/2 h-[50dvh] lg:h-auto landscape:h-full max-w-[512px] max-h-[512px] aspect-square bg-[black] flex justify-center items-center lg:border-2 lg:rounded-md">
                <Stage
                  connected={isConnected}
                  onStreamReady={onRemoteStreamReady}
                />
              </div>
              <div className="landscape:w-full lg:w-1/2 h-[50dvh] lg:h-auto landscape:h-full max-w-[512px] max-h-[512px] aspect-square flex justify-center items-center lg:border-2 lg:rounded-md">
                <Webcam
                  onStreamReady={onStreamReady}
                  deviceId={config.selectedDeviceId}
                  frameRate={config.frameRate}
                />
              </div>
            </div>

            <StreamSettings
              open={isStreamSettingsOpen}
              onOpenChange={setIsStreamSettingsOpen}
              onSave={onStreamConfigSave}
            />
          </div>
          <div className="absolute bottom-0 left-0 w-full h-fit flex flex-row gap-3 items-center justify-start p-3 bg-black text-white text-sm">
            <div className="relative w-fit h-fit flex flex-col items-start justify-start gap-1 text-left">
              <div className="relative w-full h-fit flex">Update Fill Prompt</div>
              <textarea value={currentPrompt} onChange={(e) => {updateNodeValue("6", "text", e.target.value); setCurrentPrompt(e.target.value)}} className="relative w-60 h-40 flex resize-none overflow-y-scroll p-1 border border-white rounded-md bg-black text-white"></textarea>
              </div>
              <div className="relative w-fit h-fit flex flex-col items-start justify-start gap-1 text-left">
              <div className="relative w-full h-fit flex">Update Clothing region</div>
              <textarea value={currentRegion} onChange={(e) =>{
                 updateNodeValue("2", "text_input", e.target.value)
                 setCurrentRegion(e.target.value)
              }} className="relative w-60 h-40 flex resize-none overflow-y-scroll p-1 border border-white rounded-md bg-black text-white"></textarea>
              </div>
          </div>
        </PeerConnector>
      </div>
    </main>
  );
}
