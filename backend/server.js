import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { v4 as uuidv4 } from 'uuid';
import { handleJoinDocument, handleEdit, handleSaveHistory } from './handlers/documentHandler.js';
import { handleCursorMove, handleDisconnect } from './handlers/cursorHandler.js';
import { handleMarkReviewed, handleUnmarkReviewed } from './handlers/reviewHandler.js';
import { handleAddComment, handleAddReply } from './handlers/commentHandler.js';

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
  });

  socket.on('save-history', (data) => {
    handleSaveHistory(io, currentDocId, data, userId, history);
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
