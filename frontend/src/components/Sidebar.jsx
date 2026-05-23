export default function Sidebar({
  userCursors,
  userId,
  reviewed,
  comments,
  history,
  replyingTo,
  replyText,
  setReplyingTo,
  setReplyText,
  onAddReply
}) {
  return (
    <div className="sidebar">
      <div className="section">
        <h3>Active Users ({Object.entries(userCursors).length})</h3>
        {Object.entries(userCursors).length === 0 ? (
          <div className="empty-state">No users</div>
        ) : (
          Object.entries(userCursors).map(([uid, cursorData]) => {
            const isYou = uid === userId;
            return (
              <div key={uid} className="user-item">
                <div
                  className="user-color-badge"
                  style={{ backgroundColor: cursorData.color }}
                />
                <div>
                  <div className="user-name">
                    {cursorData.name} {isYou ? '(You)' : ''}
                  </div>
                  <div className="user-position">pos {cursorData.position}</div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="section">
        <h3>Reviews ({reviewed.length})</h3>
        {reviewed.length === 0 ? (
          <div className="empty-state">No reviews yet</div>
        ) : (
          <div className="empty-state">
            {reviewed.length} section{reviewed.length !== 1 ? 's' : ''} reviewed
          </div>
        )}
      </div>

      <div className="section">
        <h3>Comments ({comments.length})</h3>
        {comments.length === 0 ? (
          <div className="empty-state">No comments yet</div>
        ) : (
          comments.map((comment) => (
            <div key={comment.id} className="comment-thread">
              <div className="comment-main">
                <div className="comment-header">
                  <strong style={{ color: comment.authorColor }}>
                    {comment.author}
                  </strong>
                </div>
                <div className="comment-text">"{comment.selectedText}"</div>
                <p>{comment.text}</p>
                <small>{new Date(comment.timestamp).toLocaleString()}</small>
                <button 
                  className="reply-btn"
                  onClick={() => setReplyingTo(comment.id)}
                >
                  Reply
                </button>
              </div>

              {comment.replies && comment.replies.length > 0 && (
                <div className="replies">
                  {comment.replies.map((reply, idx) => (
                    <div key={idx} className="reply-item">
                      <strong style={{ color: reply.authorColor }}>
                        {reply.author}
                      </strong>
                      <p>{reply.text}</p>
                      <small>{new Date(reply.timestamp).toLocaleString()}</small>
                    </div>
                  ))}
                </div>
              )}

              {replyingTo === comment.id && (
                <div className="reply-box">
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder="Write a reply..."
                    rows="2"
                  />
                  <div className="reply-actions">
                    <button onClick={() => onAddReply(comment.id)}>Reply</button>
                    <button onClick={() => {
                      setReplyingTo(null);
                      setReplyText('');
                    }}>Cancel</button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <div className="section">
        <h3>History ({history.length})</h3>
        {history.length === 0 ? (
          <div className="empty-state">No history</div>
        ) : (
          history.slice(-5).reverse().map((entry, idx) => (
            <div key={idx} className="history-item">
              <small>{new Date(entry.timestamp).toLocaleTimeString()}</small>
              <div className="history-preview">
                {entry.content.substring(0, 50)}...
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
