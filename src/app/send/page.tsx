'use client';
import { useEffect, useRef, useState } from 'react';

export default function SendPage() {
  const wsRef = useRef<WebSocket | null>(null);
  const peerRef = useRef<RTCPeerConnection | null>(null);
  const dataChannelRef = useRef<RTCDataChannel | null>(null);
  const roomRef = useRef('');
  const [room, setRoom] = useState('');
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    const ws = new WebSocket('wss://airdropbackend-production.up.railway.app');
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('✅ WebSocket connected (sender)');
    };

    ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data);
        console.log('[Sender] Received message:', msg);
      
        if (msg.type === 'peer-joined') {
          console.log('[Sender] Receiver has joined! Creating offer...');
          startConnection(room); // ✅ Now it's safe to start connection
        }
      
        if (msg.type === 'answer') {
          await peerRef.current?.setRemoteDescription(new RTCSessionDescription(msg.answer));
        }
      
        if (msg.type === 'ice-candidate') {
          await peerRef.current?.addIceCandidate(new RTCIceCandidate(msg.candidate));
        }
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // ✅ run once

  const createRoom = () => {
    const roomCode = Math.random().toString(36).substring(2, 8);
    setRoom(roomCode);
  
    const waitForWebSocket = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: 'join', room: roomCode }));
        startConnection(roomCode);
      } else {
        setTimeout(waitForWebSocket, 100); // Check again after 100ms
      }
    };
  
    waitForWebSocket();
  };
  

  const startConnection = async (roomCode: string) => {
    const peer = new RTCPeerConnection({
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }, // STUN (for local IP discovery)
        {
          urls: 'turn:openrelay.metered.ca:80',   // TURN (for relaying over internet)
          username: 'openrelayproject',
          credential: 'openrelayproject',
        },
      ],
    });   
    
    
    peerRef.current = peer;

    const channel = peer.createDataChannel('file');
    dataChannelRef.current = channel;

    peer.onicecandidate = (e) => {
      if (e.candidate) {
        wsRef.current?.send(JSON.stringify({
          type: 'signal',
          room: roomCode,
          data: { type: 'ice-candidate', candidate: e.candidate },
        }));
      }
    };

    channel.onopen = () => {
      console.log('[DataChannel] Open (sender)');
      setConnected(true);
    };

    channel.onerror = (e) => console.error('DataChannel error (sender):', e);

    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);

    wsRef.current?.send(JSON.stringify({
      type: 'signal',
      room: roomRef.current,
      data: { type: 'offer', offer },
    }));
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const dataChannel = dataChannelRef.current;
  
    if (!file || !dataChannel || dataChannel.readyState !== 'open') return;
  
    console.log('📤 Sending file metadata');
    dataChannel.send(JSON.stringify({
      type: 'file-meta',
      name: file.name,
      size: file.size,
      fileType: file.type,
    }));
  
    const CHUNK_SIZE = 64 * 1024; // 64 KB
    const MAX_BUFFER = 16 * 1024 * 1024; // 16 MB
    let offset = 0;
  
    while (offset < file.size) {
      // Wait if buffer is full
      while (dataChannel.bufferedAmount > MAX_BUFFER) {
        await new Promise(res => setTimeout(res, 20));
      }
  
      const slice = file.slice(offset, offset + CHUNK_SIZE);
      const buffer = await slice.arrayBuffer();
      dataChannel.send(new Uint8Array(buffer));
      offset += CHUNK_SIZE;
  
      console.log(`📦 Sent ${((offset / file.size) * 100).toFixed(2)}%`);
    }
  
    console.log('✅ File send complete');
    dataChannel.send(JSON.stringify({ type: 'eof' }));
  };
  

  return (
    <div className="p-6 text-center">
      <h2 className="text-2xl font-bold mb-4">Send File</h2>
      {room ? <p className="mb-2">Room Code: <code>{room}</code></p> : (
        <button onClick={createRoom} className="px-4 py-2 bg-blue-500 text-white rounded-xl">Create Room</button>
      )}
      {connected ? (
        <input type="file" onChange={handleFile} className="block mx-auto mt-6" />
      ) : (
        <p className="text-sm text-gray-500 mt-6">Waiting for connection...</p>
      )}
    </div>
  );
}
