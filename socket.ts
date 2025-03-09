import { createServer } from "http";
import { parse } from "url";
import next from "next";
import { Server, Socket } from "socket.io";
import { DocumentContent } from "@/lib/db/types";
import { getDocumentCached, updateDocument } from "@/lib/db/queries";

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

type FileRoom = {
  sockets: Socket[],
  filename: string,
  content: DocumentContent[],
  timeout: NodeJS.Timeout | null
}

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  });

  const io = new Server(server);
  const fileRooms: Record<string, FileRoom> = {};

  io.on('connection', async (socket) => {
    console.log('new connection');
    const fileId: string = socket.data.fileId;

    if (!fileRooms[fileId]) {
      const document = await getDocumentCached(fileId);
      if (!document) socket.disconnect();
      fileRooms[fileId] = {
        sockets: [socket],
        filename: document[0].name,
        content: document[0].content,
        timeout: null
      }
    } else {
      fileRooms[fileId].sockets.push(socket);
    }

    socket.on('change', async (content: DocumentContent[]) => {
      fileRooms[fileId].content = content;
      fileRooms[fileId].sockets.forEach(s => s !== socket && s.emit('change', content));
      if (fileRooms[fileId].timeout) clearTimeout(fileRooms[fileId].timeout);
      fileRooms[fileId].timeout = setTimeout(async () => {
        await updateDocument(fileId, { content });
      }, 2000);
    })

    socket.on('rename', async (name: string) => {
      fileRooms[fileId].filename = name;
      fileRooms[fileId].sockets.forEach(s => s.emit('rename', name));
      await updateDocument(fileId, { name });
    })

    socket.on('disconnect', () => {
      if (fileRooms[fileId].sockets.length === 1) socket.disconnect();
      else fileRooms[fileId].sockets = fileRooms[fileId].sockets.filter(s => s !== socket);
    });
  });

  server.listen(3000, () => {
    console.log('> Ready on http://localhost:3000');
  });
});