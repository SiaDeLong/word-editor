export default function CommentBox({
  selectedRange,
  commentText,
  setCommentText,
  onAddComment,
  onCancel
}) {
  return (
    <div className="comment-box">
      <div className="comment-selected-text">
        Selected: "{selectedRange.text}"
      </div>
      <textarea
        value={commentText}
        onChange={(e) => setCommentText(e.target.value)}
        placeholder="Add a comment..."
        autoFocus
      />
      <button onClick={onAddComment}>Add Comment</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  );
}
