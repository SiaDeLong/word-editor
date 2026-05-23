import { v4 as uuidv4 } from 'uuid';

export const handleAddComment = (io, docId, data, comments) => {
  if (!docId) return;

  const comment = {
    id: data.id,
    start: data.start,
    end: data.end,
    text: data.text,
    selectedText: data.selectedText,
    author: data.author,
    authorColor: data.authorColor,
    timestamp: Date.now(),
    replies: []
  };

  comments.get(docId).push(comment);
  io.to(docId).emit('comments-update', comments.get(docId));
};

export const handleAddReply = (io, docId, data, comments) => {
  if (!docId) return;

  const comment = comments.get(docId).find(c => c.id === data.commentId);
  if (comment) {
    if (!comment.replies) {
      comment.replies = [];
    }
    comment.replies.push({
      text: data.text,
      author: data.author,
      authorColor: data.authorColor,
      timestamp: Date.now()
    });
    io.to(docId).emit('comments-update', comments.get(docId));
  }
};
