import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { handleJoinDocument, handleEdit, handleSaveHistory } from './handlers/documentHandler.js';
import { handleCursorMove, handleDisconnect } from './handlers/cursorHandler.js';
import { handleMarkReviewed, handleUnmarkReviewed } from './handlers/reviewHandler.js';
import { handleAddComment, handleAddReply } from './handlers/commentHandler.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, 'data');
const docFile = path.join(dataDir, 'documents.json');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Delete documents.json on startup for fresh state
if (fs.existsSync(docFile)) {
  fs.unlinkSync(docFile);
}

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*' }
});

app.use(express.static('dist'));

// Store document state
const documents = new Map();
const userCursors = new Map();
const comments = new Map();
const history = new Map();
const userMap = new Map();
let userCounter = 0;

const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];

// Load documents from file
const loadDocuments = () => {
  try {
    if (fs.existsSync(docFile)) {
      const data = JSON.parse(fs.readFileSync(docFile, 'utf8'));
      Object.entries(data.documents || {}).forEach(([key, value]) => {
        documents.set(key, value);
      });
      Object.entries(data.history || {}).forEach(([key, value]) => {
        history.set(key, value);
      });
    }
  } catch (error) {
    console.error('Error loading documents:', error);
  }
};

// Save documents to file
const saveDocuments = () => {
  try {
    const data = {
      documents: Object.fromEntries(documents),
      history: Object.fromEntries(history)
    };
    fs.writeFileSync(docFile, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('Error saving documents:', error);
  }
};

// Load on startup
loadDocuments();

io.on('connection', (socket) => {
  let currentDocId = null;
  let persistentUserId = null;
  let userId = uuidv4();
  let userColor = null;
  let userName = null;

  socket.on('set-persistent-id', (persistedId) => {
    persistentUserId = persistedId;
    
    if (userMap.has(persistentUserId)) {
      const userData = userMap.get(persistentUserId);
      userColor = userData.color;
      userName = userData.name;
    } else {
      userColor = colors[userCounter % colors.length];
      userName = `User ${userCounter + 1}`;
      userCounter++;
      userMap.set(persistentUserId, { color: userColor, name: userName });
    }
  });

  socket.on('join-document', (docId) => {
    currentDocId = docId;
    handleJoinDocument(socket, io, docId, userId, userColor, userName, documents, userCursors, comments, history);
  });

  socket.on('edit', (data) => {
    handleEdit(socket, io, currentDocId, data, userId, documents, history);
    saveDocuments();
  });

  socket.on('save-history', (data) => {
    handleSaveHistory(io, currentDocId, data, userId, history, documents);
    saveDocuments();
  });

  socket.on('restore-history', (data) => {
    if (!currentDocId) return;
    const doc = documents.get(currentDocId);
    if (doc) {
      doc.content = data.content;
      doc.reviewed = data.reviewed || [];
      io.to(currentDocId).emit('content-update', {
        content: data.content,
        userId: userId
      });
      io.to(currentDocId).emit('reviewed-update', doc.reviewed);
      handleSaveHistory(io, currentDocId, data, userId, history, documents);
      saveDocuments();
    }
  });

  socket.on('cursor-move', (data) => {
    handleCursorMove(io, currentDocId, data, userId, userCursors);
  });

  socket.on('mark-reviewed', (data) => {
    handleMarkReviewed(io, currentDocId, data, documents);
  });

  socket.on('unmark-reviewed', (data) => {
    handleUnmarkReviewed(io, currentDocId, data, documents);
  });

  socket.on('update-reviewed-ranges', (data) => {
    if (!currentDocId) return;
    const doc = documents.get(currentDocId);
    if (doc) {
      // Merge the updated ranges
      const mergeReviewRanges = (ranges) => {
        if (ranges.length === 0) return [];
        const sorted = [...ranges].sort((a, b) => a.start - b.start);
        const merged = [];
        let current = { ...sorted[0] };
        for (let i = 1; i < sorted.length; i++) {
          const next = sorted[i];
          if (next.start <= current.end) {
            current.end = Math.max(current.end, next.end);
          } else {
            merged.push(current);
            current = { ...next };
          }
        }
        merged.push(current);
        return merged;
      };
      
      doc.reviewed = mergeReviewRanges(data);
      io.to(currentDocId).emit('reviewed-update', doc.reviewed);
    }
  });

  socket.on('add-comment', (data) => {
    handleAddComment(io, currentDocId, data, comments);
  });

  socket.on('add-reply', (data) => {
    handleAddReply(io, currentDocId, data, comments);
  });

  socket.on('disconnect', () => {
    handleDisconnect(io, currentDocId, userId, userCursors);
  });
});

httpServer.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
