// Merge overlapping review ranges into continuous intervals
export const mergeReviewRanges = (ranges) => {
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
