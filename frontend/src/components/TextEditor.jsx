import { useState } from 'react';
import { useEditor } from '../hooks/useEditor';
import { addComment, addReply } from '../utils/editorUtils';
import Toolbar from './Toolbar';
import Editor from './Editor';
import Sidebar from './Sidebar';
import CommentBox from './CommentBox';
import HistoryModal from './HistoryModal';
import Footer from './Footer';
import './TextEditor.css';

export default function TextEditor() {
  const {
    content,
    reviewed,
    setReviewed,
    comments,
    history,
    userCursors,
    userId,
    userColor,
    userName,
    wordCount,
    setWordCount,
    editorRef,
    socketRef,
    adjustReviewRanges,
    lastContentRef
  } = useEditor();

  const [commentText, setCommentText] = useState('');
  const [showCommentBox, setShowCommentBox] = useState(false);
  const [selectedRange, setSelectedRange] = useState(null);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [selectedHistoryVersion, setSelectedHistoryVersion] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [hasSelection, setHasSelection] = useState(false);

  const handleSelectionChange = () => {
    const selection = window.getSelection();
    setHasSelection(selection.toString().length > 0);
  };

  const handleAddComment = () => {
    addComment(
      selectedRange,
      commentText,
      socketRef,
      userName,
      userColor,
      setCommentText,
      setShowCommentBox,
      setSelectedRange
    );
  };

  const handleAddReply = (commentId) => {
    addReply(
      commentId,
      replyText,
      socketRef,
      userName,
      userColor,
      setReplyText,
      setReplyingTo
    );
  };

  return (
    <div className="editor-container">
      <Toolbar
        editorRef={editorRef}
        socketRef={socketRef}
        reviewed={reviewed}
        userName={userName}
        userColor={userColor}
        setSelectedRange={setSelectedRange}
        setShowCommentBox={setShowCommentBox}
        setShowHistoryModal={setShowHistoryModal}
        content={content}
        wordCount={wordCount}
        hasSelection={hasSelection}
      />

      {showCommentBox && selectedRange && (
        <CommentBox
          selectedRange={selectedRange}
          commentText={commentText}
          setCommentText={setCommentText}
          onAddComment={handleAddComment}
          onCancel={() => {
            setShowCommentBox(false);
            setSelectedRange(null);
            setCommentText('');
          }}
        />
      )}

      {showHistoryModal && (
        <HistoryModal
          history={history}
          selectedHistoryVersion={selectedHistoryVersion}
          setSelectedHistoryVersion={setSelectedHistoryVersion}
          onRestore={(version) => {
            if (editorRef.current) {
              editorRef.current.innerHTML = version.content;
            }
            socketRef.current.emit('restore-history', { 
              content: version.content,
              reviewed: version.reviewed || []
            });
            setShowHistoryModal(false);
          }}
          onClose={() => setShowHistoryModal(false)}
        />
      )}

      <div className="editor-wrapper">
        <Editor
          editorRef={editorRef}
          socketRef={socketRef}
          userCursors={userCursors}
          userId={userId}
          setWordCount={setWordCount}
          onSelectionChange={handleSelectionChange}
          reviewed={reviewed}
          onContentChange={(newContent) => {
            const oldContent = lastContentRef.current;
            if (oldContent && oldContent !== newContent) {
              const tempDiv = document.createElement('div');
              tempDiv.innerHTML = newContent;
              const newText = tempDiv.textContent;
              
              const tempDiv2 = document.createElement('div');
              tempDiv2.innerHTML = oldContent;
              const oldText = tempDiv2.textContent;
              
              const adjustedReviewed = adjustReviewRanges(oldText, newText, reviewed);
              if (JSON.stringify(adjustedReviewed) !== JSON.stringify(reviewed)) {
                setReviewed(adjustedReviewed);
                socketRef.current.emit('update-reviewed-ranges', adjustedReviewed);
              }
            }
            lastContentRef.current = newContent;
          }}
        />

        <Sidebar
          userCursors={userCursors}
          userId={userId}
          reviewed={reviewed}
          comments={comments}
          history={history}
          replyingTo={replyingTo}
          replyText={replyText}
          setReplyingTo={setReplyingTo}
          setReplyText={setReplyText}
          onAddReply={handleAddReply}
        />
      </div>

      <Footer wordCount={wordCount} content={content} />
    </div>
  );
}
