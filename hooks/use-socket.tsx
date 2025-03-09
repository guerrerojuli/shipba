import { DocumentContent } from '@/lib/db/types';
import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

export const useSocket = (fileId: string, initialContent: DocumentContent[], initialName: string) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [content, setContent] = useState<DocumentContent[]>(initialContent);
  const [name, setName] = useState<string>(initialName);

  useEffect(() => {
    const socketIo = io({
      auth: {
        fileId
      }
    });

    socketIo.on('connect', () => {
      setIsConnected(true);
    });

    socketIo.on('disconnect', () => {
      setIsConnected(false);
    });

    socketIo.on('change', (content: DocumentContent[]) => {
      setContent(content);
    });

    socketIo.on('rename', (name: string) => {
      setName(name);
    });

    setSocket(socketIo);

    return () => {
      socketIo.disconnect();
    };
  }, [fileId]);

  const change = (content: DocumentContent[]) => {
    if (socket) {
      socket.emit('change', content);
    }
  };

  const rename = (name: string) => {
    if (socket) {
      socket.emit('rename', name);
    }
  };

  return { isConnected, content, name, change, rename };
};