export const handleJoinDocument = (socket, io, docId, userId, userColor, userName, documents, userCursors, comments, history) => {
  const initDocument = (docId) => {
    if (!documents.has(docId)) {
      const demoContent = `<p><strong>[DEMO DOCUMENT - For Interview Purpose]</strong></p>
<p>This is a collaborative text editor demonstration document with multiple paragraphs to showcase all features including formatting, reviews, comments, and real-time collaboration.</p>
<p><strong>Introduction to Collaborative Editing</strong></p>
<p>Collaborative editing has become an essential feature in modern document management systems. It allows multiple users to work on the same document simultaneously, seeing changes in real-time and maintaining version history.</p>`;

      documents.set(docId, {
        content: demoContent,
        reviewed: []
      });
      comments.set(docId, []);
      history.set(docId, [{ content: demoContent, timestamp: Date.now() }]);
    }
  };

  initDocument(docId);
  socket.join(docId);

  const doc = documents.get(docId);
  socket.emit('load-document', {
    content: doc.content,
    reviewed: doc.reviewed,
    comments: comments.get(docId),
    history: history.get(docId),
    userId,
    userColor,
    userName
  });

  if (!userCursors.has(docId)) {
    userCursors.set(docId, {});
  }
  userCursors.get(docId)[userId] = {
    position: 0,
    color: userColor,
    name: userName
  };

  io.to(docId).emit('cursor-positions', userCursors.get(docId));
};

export const handleEdit = (socket, io, docId, data, userId, documents, history) => {
  if (!docId) return;

  const doc = documents.get(docId);
  doc.content = data.content;

  socket.to(docId).emit('content-update', {
    content: data.content,
    userId: userId
  });
};

export const handleSaveHistory = (io, docId, data, userId, history) => {
  if (!docId) return;

  const historyArray = history.get(docId);
  const lastEntry = historyArray[historyArray.length - 1];

  if (lastEntry.content !== data.content) {
    historyArray.push({
      content: data.content,
      timestamp: Date.now(),
      userId,
      version: historyArray.length
    });

    if (historyArray.length > 50) {
      historyArray.shift();
    }

    io.to(docId).emit('history-update', historyArray);
  }
};
