// Merge overlapping review ranges into continuous intervals
const mergeReviewRanges = (ranges) => {
  if (ranges.length === 0) return [];
  
  // Sort by start position
  const sorted = [...ranges].sort((a, b) => a.start - b.start);
  
  const merged = [];
  let current = { ...sorted[0] };
  
  for (let i = 1; i < sorted.length; i++) {
    const next = sorted[i];
    
    // If ranges overlap or are adjacent, merge them
    if (next.start <= current.end) {
      current.end = Math.max(current.end, next.end);
    } else {
      // No overlap, save current and start new
      merged.push(current);
      current = { ...next };
    }
  }
  
  merged.push(current);
  return merged;
};

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
    
    // Merge overlapping ranges
    doc.reviewed = mergeReviewRanges(doc.reviewed);
  }

  io.to(docId).emit('reviewed-update', doc.reviewed);
};

export const handleUnmarkReviewed = (io, docId, data, documents) => {
  if (!docId) return;

  const doc = documents.get(docId);
  if (Array.isArray(doc.reviewed)) {
    doc.reviewed = doc.reviewed.filter(rev => !(rev.start === data.start && rev.end === data.end));
    
    // Merge remaining ranges in case there are overlaps
    doc.reviewed = mergeReviewRanges(doc.reviewed);
  }

  io.to(docId).emit('reviewed-update', doc.reviewed);
};
