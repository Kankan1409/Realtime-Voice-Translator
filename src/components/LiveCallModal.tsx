import { useState, useRef, useEffect, useCallback } from 'react';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Copy,
  Check,
  Share2,
  MessageSquare,
  Sparkles,
  QrCode,
  X,
  Volume2,
  Send,
  Users,
  Maximize2,
  RefreshCw,
  ExternalLink,
} from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { Language, TranslationRecord } from '../types';
import { speakText, isSpeechRecognitionSupported } from '../utils/audio';

interface LiveCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialRoomId?: string;
  onSaveCallRecords: (records: TranslationRecord[], roomTitle: string) => void;
  onSummarizeAfterCall?: () => void;
}

interface InCallChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  speaker: Language;
  text: string;
  translatedText: string;
  pinyin?: string;
  timestamp: number;
}

interface SubtitlePayload {
  speaker: Language;
  senderName: string;
  originalText: string;
  translatedText: string;
  pinyin?: string;
  timestamp: number;
}

const RTC_CONFIG: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

export function LiveCallModal({
  isOpen,
  onClose,
  initialRoomId,
  onSaveCallRecords,
  onSummarizeAfterCall,
}: LiveCallModalProps) {
  // Room Identification
  const [roomId, setRoomId] = useState<string>(() => {
    return (
      initialRoomId ||
      'CALL-' + Math.floor(1000 + Math.random() * 9000).toString()
    );
  });

  const [callStep, setCallStep] = useState<'setup' | 'connected' | 'ended'>('setup');
  const [userName, setUserName] = useState<string>('ฉัน (ไทย)');
  const [myLang, setMyLang] = useState<Language>('th');
  const [isCopied, setIsCopied] = useState(false);
  const [showQR, setShowQR] = useState(false);

  // Audio/Video Hardware States
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isVideoMuted, setIsVideoMuted] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
  const [remotePeerInfo, setRemotePeerInfo] = useState<{
    peerId: string;
    name: string;
    lang: Language;
    isMuted?: boolean;
    isVideoOff?: boolean;
  } | null>(null);

  // Live Subtitles & Transcripts
  const [currentSubtitle, setCurrentSubtitle] = useState<SubtitlePayload | null>(null);
  const subtitleTimeoutRef = useRef<any>(null);
  const [callRecords, setCallRecords] = useState<TranslationRecord[]>([]);

  // In-Call Chat
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<InCallChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isSendingChat, setIsSendingChat] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);

  // WebRTC & WebSocket References
  const wsRef = useRef<WebSocket | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const speechRecognitionRef = useRef<any>(null);

  const myPeerIdRef = useRef<string>(
    'peer-' + Math.random().toString(36).substring(2, 9)
  );

  // Construct invite link
  const inviteUrl = `${window.location.origin}${window.location.pathname}?room=${roomId}`;

  const copyInviteLink = useCallback(() => {
    const textToCopy = `เข้าร่วมสายวิดีโอคอลแปลภาษาไทย-จีนสด:\n${inviteUrl}`;
    navigator.clipboard.writeText(textToCopy);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }, [inviteUrl]);

  // Share via native Web Share
  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'วิดีโอคอลแปลภาษาไทย-จีนสด (Live Translation Call)',
          text: `เชิญร่วมคุยวิดีโอคอลแปลสดพร้อมซับไตเติลภาษาไทย-จีน รหัสห้อง: ${roomId}`,
          url: inviteUrl,
        });
      } catch (e) {
        copyInviteLink();
      }
    } else {
      copyInviteLink();
    }
  };

  // Setup local media stream
  const setupLocalMedia = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      return stream;
    } catch (err) {
      console.warn('Camera/mic access warning:', err);
      // Fallback to audio only if camera is blocked
      try {
        const audioOnlyStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
        });
        localStreamRef.current = audioOnlyStream;
        setIsVideoMuted(true);
        return audioOnlyStream;
      } catch (audioErr) {
        console.error('Microphone completely blocked:', audioErr);
        return null;
      }
    }
  };

  // Toggle Microphone
  const toggleMic = () => {
    const next = !isMicMuted;
    setIsMicMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((t) => {
        t.enabled = !next;
      });
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'status-update',
          isMuted: next,
          isVideoOff: isVideoMuted,
        })
      );
    }
  };

  // Toggle Video
  const toggleVideo = () => {
    const next = !isVideoMuted;
    setIsVideoMuted(next);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => {
        t.enabled = !next;
      });
    }
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(
        JSON.stringify({
          type: 'status-update',
          isMuted: isMicMuted,
          isVideoOff: next,
        })
      );
    }
  };

  // Flip Camera
  const flipCamera = async () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    if (localStreamRef.current) {
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
    }
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextMode },
        audio: true,
      });
      localStreamRef.current = newStream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = newStream;
      }
      // Replace video track in RTCPeerConnection if active
      if (peerConnectionRef.current) {
        const videoSender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track?.kind === 'video');
        if (videoSender) {
          videoSender.replaceTrack(newStream.getVideoTracks()[0]);
        }
      }
    } catch (e) {
      console.error('Could not switch camera', e);
    }
  };

  // Connect to WebSocket Server and initialize WebRTC
  const startCall = async () => {
    const localStream = await setupLocalMedia();
    setCallStep('connected');

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/ws`;

    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      // Join Room
      ws.send(
        JSON.stringify({
          type: 'join',
          roomId,
          peerId: myPeerIdRef.current,
          name: userName,
          lang: myLang,
        })
      );
    };

    ws.onmessage = async (event) => {
      try {
        const msg = JSON.parse(event.data);

        switch (msg.type) {
          case 'room-joined': {
            // Received existing peers in room
            if (msg.peers && msg.peers.length > 0) {
              const firstPeer = msg.peers[0];
              setRemotePeerInfo(firstPeer);
              // Create WebRTC Offer to connect to existing peer
              await createPeerConnection(firstPeer.peerId, true, localStream);
            }
            break;
          }

          case 'peer-joined': {
            setRemotePeerInfo(msg.peer);
            // Wait for offer from the newly joined peer or initiate connection
            await createPeerConnection(msg.peer.peerId, false, localStream);
            break;
          }

          case 'signal': {
            if (msg.data.sdp) {
              if (!peerConnectionRef.current) {
                await createPeerConnection(msg.fromPeerId, false, localStream);
              }
              const pc = peerConnectionRef.current!;
              await pc.setRemoteDescription(new RTCSessionDescription(msg.data.sdp));

              if (msg.data.sdp.type === 'offer') {
                const answer = await pc.createAnswer();
                await pc.setLocalDescription(answer);
                ws.send(
                  JSON.stringify({
                    type: 'signal',
                    targetPeerId: msg.fromPeerId,
                    data: { sdp: answer },
                  })
                );
              }
            } else if (msg.data.candidate) {
              if (peerConnectionRef.current) {
                try {
                  await peerConnectionRef.current.addIceCandidate(
                    new RTCIceCandidate(msg.data.candidate)
                  );
                } catch (e) {
                  console.warn('Error adding ICE candidate', e);
                }
              }
            }
            break;
          }

          case 'subtitle': {
            // Received real-time subtitle from peer
            const subtitle: SubtitlePayload = {
              speaker: msg.speaker,
              senderName: msg.senderName,
              originalText: msg.originalText,
              translatedText: msg.translatedText,
              pinyin: msg.pinyin,
              timestamp: msg.timestamp || Date.now(),
            };
            setCurrentSubtitle(subtitle);

            // Record in call history
            const newRecord: TranslationRecord = {
              id: msg.recordId || 'call-rec-' + Date.now(),
              timestamp: msg.timestamp || Date.now(),
              speaker: msg.speaker,
              originalText: msg.originalText,
              translatedText: msg.translatedText,
              pinyin: msg.pinyin,
            };
            setCallRecords((prev) => [...prev, newRecord]);

            if (subtitleTimeoutRef.current) clearTimeout(subtitleTimeoutRef.current);
            subtitleTimeoutRef.current = setTimeout(() => {
              setCurrentSubtitle(null);
            }, 6000);
            break;
          }

          case 'chat': {
            setChatMessages((prev) => [...prev, msg]);
            setTimeout(() => {
              if (chatScrollRef.current) {
                chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight;
              }
            }, 50);
            break;
          }

          case 'peer-status': {
            setRemotePeerInfo((prev) => {
              if (!prev) return null;
              return {
                ...prev,
                isMuted: msg.isMuted,
                isVideoOff: msg.isVideoOff,
              };
            });
            break;
          }

          case 'peer-left': {
            setRemotePeerInfo(null);
            if (remoteVideoRef.current) {
              remoteVideoRef.current.srcObject = null;
            }
            break;
          }
        }
      } catch (e) {
        console.error('WS parse error:', e);
      }
    };

    // Start Live Speech Recognition for Subtitles
    startInCallSpeechRecognition();
  };

  // Create WebRTC Peer Connection
  const createPeerConnection = async (
    targetPeerId: string,
    isInitiator: boolean,
    localStream: MediaStream | null
  ) => {
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }

    const pc = new RTCPeerConnection(RTC_CONFIG);
    peerConnectionRef.current = pc;

    // Add local tracks to WebRTC
    if (localStream) {
      localStream.getTracks().forEach((track) => {
        pc.addTrack(track, localStream);
      });
    }

    // Handle remote tracks
    pc.ontrack = (event) => {
      if (event.streams && event.streams[0]) {
        remoteStreamRef.current = event.streams[0];
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      }
    };

    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'signal',
            targetPeerId,
            data: { candidate: event.candidate },
          })
        );
      }
    };

    if (isInitiator) {
      try {
        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);
        if (wsRef.current?.readyState === WebSocket.OPEN) {
          wsRef.current.send(
            JSON.stringify({
              type: 'signal',
              targetPeerId,
              data: { sdp: offer },
            })
          );
        }
      } catch (e) {
        console.error('Failed to create offer', e);
      }
    }
  };

  // In-Call Live Speech Recognition
  const startInCallSpeechRecognition = () => {
    if (!isSpeechRecognitionSupported()) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();

    // Recognize speaker language
    recognition.lang = myLang === 'zh' ? 'zh-CN' : 'th-TH';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = async (event: any) => {
      const lastResultIndex = event.results.length - 1;
      const transcript = event.results[lastResultIndex][0].transcript.trim();

      if (!transcript || transcript.length < 2) return;

      // Translate via server
      try {
        const targetLang: Language = myLang === 'zh' ? 'th' : 'zh';
        const res = await fetch('/api/translate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: transcript,
            targetLang,
            sourceLang: myLang,
          }),
        });
        const data = await res.json();

        if (data.success && data.translation) {
          // Broadcast subtitle to all peers via WebSocket
          if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(
              JSON.stringify({
                type: 'subtitle',
                speaker: myLang,
                senderName: userName,
                originalText: transcript,
                translatedText: data.translation,
                pinyin: data.pinyin,
                recordId: 'call-' + Date.now(),
              })
            );
          }
        }
      } catch (err) {
        console.error('Call translate error:', err);
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error !== 'no-speech') {
        console.warn('Call speech recognition warning:', e);
      }
    };

    recognition.onend = () => {
      // Auto restart if call is still active
      if (callStep === 'connected' && !isMicMuted) {
        try {
          recognition.start();
        } catch (e) {}
      }
    };

    try {
      recognition.start();
      speechRecognitionRef.current = recognition;
    } catch (e) {
      console.warn('Speech recognition start failed', e);
    }
  };

  // Send In-Call Chat Message
  const handleSendChatMessage = async () => {
    if (!chatInput.trim() || isSendingChat) return;
    const text = chatInput.trim();
    setChatInput('');
    setIsSendingChat(true);

    try {
      const targetLang: Language = myLang === 'zh' ? 'th' : 'zh';
      const res = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text,
          targetLang,
          sourceLang: myLang,
        }),
      });
      const data = await res.json();
      const translatedText = data.success ? data.translation : text;
      const pinyin = data.pinyin || '';

      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({
            type: 'chat',
            id: 'msg-' + Date.now(),
            senderName: userName,
            speaker: myLang,
            text,
            translatedText,
            pinyin,
          })
        );
      }
    } catch (e) {
      console.error('Chat translate error:', e);
    } finally {
      setIsSendingChat(false);
    }
  };

  // Hangup and clean up
  const endCall = () => {
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((t) => t.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    if (wsRef.current) {
      wsRef.current.close();
    }
    setCallStep('ended');
  };

  // Save records and finish
  const handleFinishAndSave = () => {
    if (callRecords.length > 0) {
      onSaveCallRecords(
        callRecords,
        `สายวิดีโอคอล ${roomId} (${callRecords.length} ประโยค)`
      );
    }
    onClose();
    if (onSummarizeAfterCall && callRecords.length > 0) {
      setTimeout(() => {
        onSummarizeAfterCall();
      }, 300);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (speechRecognitionRef.current) {
        try {
          speechRecognitionRef.current.stop();
        } catch (e) {}
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((t) => t.stop());
      }
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (subtitleTimeoutRef.current) {
        clearTimeout(subtitleTimeoutRef.current);
      }
    };
  }, []);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col justify-between overflow-hidden select-none animate-fadeIn">
      {/* 1. SETUP / INVITE STEP */}
      {callStep === 'setup' && (
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 max-w-md w-full mx-auto text-white">
          <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <Video className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white leading-tight">
                    วิดีโอคอลแปลสด (Live Call)
                  </h3>
                  <p className="text-xs text-slate-400">
                    โทรคุยพร้อมซับไตเติลแปลไทย-จีนเรียลไทม์
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Room Code & Copy Link Card */}
            <div className="bg-slate-800/80 rounded-2xl p-4 border border-slate-700/60 space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span>รหัสห้อง (Room Code):</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  {roomId}
                </span>
              </div>

              {/* Big Copy Link for Facebook Messenger */}
              <button
                type="button"
                onClick={copyInviteLink}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm shadow-md active:scale-98 transition group"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-300" />
                    <span>คัดลอกลิงก์เรียบร้อยแล้ว!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 group-hover:scale-110 transition" />
                    <span>คัดลอกลิงก์ส่งเข้า Facebook / Messenger</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleNativeShare}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>แชร์แอปอื่น</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowQR(!showQR)}
                  className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-slate-700/70 hover:bg-slate-700 text-slate-200 text-xs font-medium transition"
                >
                  <QrCode className="w-3.5 h-3.5" />
                  <span>{showQR ? 'ซ่อน QR' : 'QR Code'}</span>
                </button>
              </div>

              {showQR && (
                <div className="bg-white p-3 rounded-2xl flex flex-col items-center justify-center gap-2 animate-fadeIn">
                  <QRCodeSVG value={inviteUrl} size={150} />
                  <span className="text-[11px] text-slate-600 text-center font-medium">
                    ให้เพื่อนสแกนด้วยกล้องมือถือ เพื่อเข้าสายได้ทันที
                  </span>
                </div>
              )}
            </div>

            {/* Profile Settings */}
            <div className="space-y-3">
              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  ภาษาที่คุณใช้พูดในสาย:
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMyLang('th');
                      setUserName('ฉัน (ไทย)');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      myLang === 'th'
                        ? 'bg-blue-600/30 text-blue-300 border-blue-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span>🇹🇭 ฉันพูดภาษาไทย</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setMyLang('zh');
                      setUserName('我 (中文)');
                    }}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                      myLang === 'zh'
                        ? 'bg-rose-600/30 text-rose-300 border-rose-500'
                        : 'bg-slate-800 text-slate-400 border-slate-700'
                    }`}
                  >
                    <span>🇨🇳 我讲中文</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 font-medium block mb-1">
                  ชื่อที่แสดงในสาย:
                </label>
                <input
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
                  placeholder="ใส่ชื่อของคุณ"
                />
              </div>
            </div>

            {/* Start Button */}
            <button
              type="button"
              onClick={startCall}
              className="w-full py-3.5 rounded-2xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-extrabold text-sm shadow-lg shadow-emerald-500/20 active:scale-98 transition flex items-center justify-center gap-2"
            >
              <Video className="w-5 h-5" />
              <span>เริ่มเข้าสายวิดีโอคอลทันที</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. ACTIVE CONNECTED CALL STEP */}
      {callStep === 'connected' && (
        <div className="relative flex-1 flex flex-col justify-between overflow-hidden">
          {/* Top Bar: Room info & Actions */}
          <div className="absolute top-0 inset-x-0 z-30 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between text-white">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping" />
              <div className="flex flex-col">
                <span className="text-xs font-bold tracking-tight">
                  {remotePeerInfo ? remotePeerInfo.name : 'กำลังรอคู่สนทนาเข้าห้อง...'}
                </span>
                <span className="text-[10px] text-slate-300">
                  ห้อง: {roomId} {remotePeerInfo && '• เชื่อมต่อแล้ว'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={copyInviteLink}
                className="py-1.5 px-3 rounded-xl bg-white/15 hover:bg-white/25 text-xs font-semibold backdrop-blur-md transition flex items-center gap-1.5"
                title="คัดลอกลิงก์ส่งให้เพื่อนอีกครั้ง"
              >
                {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span className="hidden sm:inline">คัดลอกลิงก์</span>
              </button>

              <button
                type="button"
                onClick={() => setIsChatOpen(!isChatOpen)}
                className={`p-2 rounded-xl backdrop-blur-md transition relative ${
                  isChatOpen ? 'bg-blue-600 text-white' : 'bg-white/15 hover:bg-white/25 text-white'
                }`}
                title="เปิดแชทข้อความ"
              >
                <MessageSquare className="w-5 h-5" />
                {chatMessages.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-rose-500 text-[10px] font-bold flex items-center justify-center">
                    {chatMessages.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Main Video Area: Remote & Local */}
          <div className="flex-1 relative bg-slate-950 flex items-center justify-center overflow-hidden">
            {/* Remote Video / Avatar */}
            {remotePeerInfo ? (
              <div className="w-full h-full flex items-center justify-center relative">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className={`w-full h-full object-cover transition duration-300 ${
                    remotePeerInfo.isVideoOff ? 'hidden' : 'block'
                  }`}
                />
                {remotePeerInfo.isVideoOff && (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-24 h-24 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-3xl font-bold shadow-2xl border-4 border-white/20">
                      {remotePeerInfo.lang === 'zh' ? '🇨🇳' : '🇹🇭'}
                    </div>
                    <span className="text-sm font-semibold text-slate-300">
                      {remotePeerInfo.name} (ปิดกล้อง)
                    </span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-6 text-center space-y-4 max-w-sm">
                <div className="w-20 h-20 rounded-full bg-slate-800/80 border border-slate-700 flex items-center justify-center text-slate-400">
                  <Users className="w-10 h-10 animate-pulse text-emerald-400" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-white mb-1">
                    รอคู่สนทนาแตะลิงก์เข้าร่วม...
                  </h4>
                  <p className="text-xs text-slate-400">
                    ส่งลิงก์ด้านบนเข้าแชท Facebook ให้เพื่อนคนจีน เมื่อเขาแตะลิงก์หน้าจอจะขึ้นทันที
                  </p>
                </div>
                <button
                  type="button"
                  onClick={copyInviteLink}
                  className="py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold flex items-center gap-2 shadow-md transition"
                >
                  {isCopied ? <Check className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>กดคัดลอกลิงก์ส่งแชท Facebook</span>
                </button>
              </div>
            )}

            {/* Local Video PiP (Picture in Picture) */}
            <div className="absolute bottom-28 right-4 w-28 h-40 sm:w-36 sm:h-48 rounded-2xl overflow-hidden shadow-2xl border-2 border-white/20 bg-slate-900 z-20">
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover -scale-x-100 ${
                  isVideoMuted ? 'hidden' : 'block'
                }`}
              />
              {isVideoMuted && (
                <div className="w-full h-full flex flex-col items-center justify-center bg-slate-800 text-slate-400">
                  <VideoOff className="w-6 h-6 mb-1" />
                  <span className="text-[10px]">คุณปิดกล้อง</span>
                </div>
              )}
              <div className="absolute bottom-1 left-2 bg-black/60 px-1.5 py-0.5 rounded text-[10px] text-white font-medium">
                {myLang === 'th' ? '🇹🇭 คุณ' : '🇨🇳 我'}
              </div>
            </div>

            {/* LIVE REAL-TIME SUBTITLES OVERLAY */}
            {currentSubtitle && (
              <div className="absolute bottom-28 left-4 right-36 sm:right-44 z-20 pointer-events-none animate-fadeIn">
                <div className="bg-black/85 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/15 shadow-2xl max-w-xl">
                  <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold">
                    <span
                      className={`px-1.5 py-0.5 rounded ${
                        currentSubtitle.speaker === 'th'
                          ? 'bg-blue-600 text-white'
                          : 'bg-rose-600 text-white'
                      }`}
                    >
                      {currentSubtitle.speaker === 'th' ? '🇹🇭 ไทย' : '🇨🇳 中文'}
                    </span>
                    <span className="text-slate-300">{currentSubtitle.senderName}</span>
                  </div>
                  {/* Original Speech */}
                  <div className="text-xs sm:text-sm text-slate-300 font-normal leading-relaxed">
                    {currentSubtitle.originalText}
                  </div>
                  {/* Translated Text in vibrant bold */}
                  <div className="text-sm sm:text-base text-amber-300 font-extrabold leading-snug mt-1">
                    {currentSubtitle.translatedText}
                  </div>
                  {/* Pinyin if Chinese */}
                  {currentSubtitle.pinyin && (
                    <div className="text-[11px] text-emerald-300 font-mono mt-0.5">
                      {currentSubtitle.pinyin}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* In-Call Chat Drawer (Slide-Over) */}
          {isChatOpen && (
            <div className="absolute top-16 right-4 bottom-28 w-80 max-w-[calc(100vw-2rem)] bg-slate-900/95 backdrop-blur-xl border border-slate-700/80 rounded-2xl shadow-2xl z-30 flex flex-col overflow-hidden animate-fadeIn">
              <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-blue-400" />
                  <span className="text-xs font-bold text-white">แชทในสาย (แปลสด)</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsChatOpen(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Messages */}
              <div ref={chatScrollRef} className="flex-1 p-3 overflow-y-auto space-y-2.5 text-xs">
                {chatMessages.length === 0 ? (
                  <div className="text-center text-slate-500 py-8">
                    ยังไม่มีข้อความ สามารถพิมพ์ตัวเลข ราคา หรือที่อยู่เพื่อแปลให้อัตโนมัติได้
                  </div>
                ) : (
                  chatMessages.map((msg) => {
                    const isMe = msg.speaker === myLang;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <span className="text-[10px] text-slate-400 mb-0.5">{msg.senderName}</span>
                        <div
                          className={`p-2.5 rounded-xl max-w-[85%] ${
                            isMe
                              ? 'bg-blue-600 text-white rounded-tr-none'
                              : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                          }`}
                        >
                          <div className="font-medium text-xs">{msg.text}</div>
                          <div className="text-[11px] text-amber-200 font-semibold border-t border-white/20 pt-1 mt-1">
                            {msg.translatedText}
                          </div>
                          {msg.pinyin && (
                            <div className="text-[9px] text-emerald-200 font-mono mt-0.5">
                              {msg.pinyin}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Chat Input */}
              <div className="p-2 border-t border-slate-700/80 bg-slate-800/40 flex items-center gap-1.5">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendChatMessage()}
                  placeholder={myLang === 'th' ? 'พิมพ์ข้อความ (แปลเป็นจีนอัตโนมัติ)...' : '输入文字 (自动翻译)...'}
                  className="flex-1 bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
                <button
                  type="button"
                  onClick={handleSendChatMessage}
                  disabled={!chatInput.trim() || isSendingChat}
                  className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white transition"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Bottom Floating Controls Bar */}
          <div className="absolute bottom-0 inset-x-0 z-30 p-4 pb-6 bg-gradient-to-t from-black/90 via-black/50 to-transparent flex items-center justify-center gap-3 sm:gap-4">
            {/* Mic Button */}
            <button
              type="button"
              onClick={toggleMic}
              className={`p-3.5 rounded-2xl transition shadow-lg active:scale-95 ${
                isMicMuted
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
              }`}
              title={isMicMuted ? 'เปิดไมค์' : 'ปิดไมค์'}
            >
              {isMicMuted ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
            </button>

            {/* Video Button */}
            <button
              type="button"
              onClick={toggleVideo}
              className={`p-3.5 rounded-2xl transition shadow-lg active:scale-95 ${
                isVideoMuted
                  ? 'bg-rose-600 text-white'
                  : 'bg-white/20 hover:bg-white/30 text-white backdrop-blur-md'
              }`}
              title={isVideoMuted ? 'เปิดกล้อง' : 'ปิดกล้อง'}
            >
              {isVideoMuted ? <VideoOff className="w-6 h-6" /> : <Video className="w-6 h-6" />}
            </button>

            {/* Flip Camera Button */}
            <button
              type="button"
              onClick={flipCamera}
              className="p-3.5 rounded-2xl bg-white/20 hover:bg-white/30 text-white backdrop-blur-md transition shadow-lg active:scale-95"
              title="สลับกล้องหน้า/หลัง"
            >
              <RefreshCw className="w-6 h-6" />
            </button>

            {/* End Call Button */}
            <button
              type="button"
              onClick={endCall}
              className="p-3.5 px-6 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold transition shadow-xl shadow-rose-600/30 active:scale-95 flex items-center gap-2"
              title="วางสาย"
            >
              <PhoneOff className="w-6 h-6" />
              <span className="text-sm font-extrabold hidden sm:inline">วางสาย</span>
            </button>
          </div>
        </div>
      )}

      {/* 3. CALL ENDED SUMMARY STEP */}
      {callStep === 'ended' && (
        <div className="flex-1 flex flex-col justify-center items-center p-4 sm:p-6 max-w-md w-full mx-auto text-white">
          <div className="w-full bg-slate-900/90 border border-slate-700/80 rounded-3xl p-6 shadow-2xl space-y-5 text-center">
            <div className="w-16 h-16 rounded-full bg-slate-800 text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
              <Sparkles className="w-8 h-8" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-white mb-1">
                การสนทนาสิ้นสุดเรียบร้อย
              </h3>
              <p className="text-xs text-slate-400">
                ระบบได้บันทึกประโยคที่พูดคุยในสายไว้ทั้งหมด{' '}
                <span className="text-emerald-400 font-bold">{callRecords.length}</span> ประโยค
              </p>
            </div>

            <div className="space-y-2">
              <button
                type="button"
                onClick={handleFinishAndSave}
                className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-sm shadow-lg shadow-blue-500/25 active:scale-98 transition flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>บันทึกและให้ AI สรุปรายงานการคุย</span>
              </button>

              <button
                type="button"
                onClick={onClose}
                className="w-full py-2.5 rounded-xl text-slate-400 hover:text-white text-xs font-medium transition"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
