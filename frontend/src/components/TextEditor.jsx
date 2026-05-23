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
    comments,
    history,
    userCursors,
    userId,
    userColor,
    userName,
    wordCount,
    setWordCount,
    editorRef,
    socketRef
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
            socketRef.current.emit('edit', { content: version.content });
            socketRef.current.emit('save-history', { content: version.content });
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
