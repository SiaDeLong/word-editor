export const handleCursorMove = (io, docId, data, userId, userCursors) => {
  if (!docId) return;

  if (!userCursors.has(docId)) {
    userCursors.set(docId, {});
  }

  userCursors.get(docId)[userId] = {
    position: data.position,
    color: userCursors.get(docId)[userId]?.color,
    name: userCursors.get(docId)[userId]?.name
  };

  io.to(docId).emit('cursor-positions', userCursors.get(docId));
};

export const handleDisconnect = (io, docId, userId, userCursors) => {
  if (docId && userCursors.has(docId)) {
    delete userCursors.get(docId)[userId];
    io.to(docId).emit('cursor-positions', userCursors.get(docId));
  }
};
