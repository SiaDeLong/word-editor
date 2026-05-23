export const handleMarkReviewed = (io, docId, data, documents) => {
  if (!docId) return;

  const doc = documents.get(docId);
  if (!Array.isArray(doc.reviewed)) {
    doc.reviewed = [];
  }

  const exists = doc.reviewed.some(rev => rev.start === data.start && rev.end === data.end);
  if (!exists) {
    doc.reviewed.push({
      id: data.id,
      start: data.start,
      end: data.end,
      text: data.text,
      reviewedBy: data.reviewedBy,
      timestamp: Date.now()
    });
  }

  io.to(docId).emit('reviewed-update', doc.reviewed);
};

export const handleUnmarkReviewed = (io, docId, data, documents) => {
  if (!docId) return;

  const doc = documents.get(docId);
  if (Array.isArray(doc.reviewed)) {
    doc.reviewed = doc.reviewed.filter(rev => !(rev.start === data.start && rev.end === data.end));
  }

  io.to(docId).emit('reviewed-update', doc.reviewed);
};
