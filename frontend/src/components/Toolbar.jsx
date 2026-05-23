import { applyFormatting, markAsReviewed, handleSelectForComment, clearText, saveToLocalStorage } from '../utils/editorUtils';

export default function Toolbar({
  editorRef,
  socketRef,
  reviewed,
  userName,
  userColor,
  setSelectedRange,
  setShowCommentBox,
  setShowHistoryModal,
  content,
  wordCount,
  hasSelection
}) {
  return (
    <div className="toolbar">
      <button onClick={() => applyFormatting('bold', null, editorRef, socketRef)} title="Bold">
        <strong>B</strong>
      </button>
      <button onClick={() => applyFormatting('italic', null, editorRef, socketRef)} title="Italic">
        <em>I</em>
      </button>
      <button onClick={() => applyFormatting('underline', null, editorRef, socketRef)} title="Underline">
        <u>U</u>
      </button>
      <input
        type="color"
        onChange={(e) => applyFormatting('foreColor', e.target.value, editorRef, socketRef)}
        title="Text Color"
      />
      <select onChange={(e) => {
        if (e.target.value) applyFormatting('fontSize', e.target.value, editorRef, socketRef);
      }}>
        <option value="">Font Size</option>
        <option value="1">8px</option>
        <option value="2">10px</option>
        <option value="3">12px</option>
        <option value="4">14px</option>
        <option value="5">18px</option>
        <option value="6">24px</option>
        <option value="7">36px</option>
      </select>
      <button onClick={() => applyFormatting('insertUnorderedList', null, editorRef, socketRef)} title="Bullet List">
        • List
      </button>
      <button onClick={() => applyFormatting('formatBlock', '<p>', editorRef, socketRef)} title="Paragraph">
        ¶ Para
      </button>
      <button 
        onClick={() => markAsReviewed(editorRef, socketRef, reviewed, userName)} 
        title="Mark as Reviewed"
        disabled={!hasSelection}
        className={!hasSelection ? 'disabled' : ''}
      >
        ✓ Review
      </button>
      <button
        onClick={() => handleSelectForComment(editorRef, setSelectedRange, setShowCommentBox)}
        title="Add Comment"
        disabled={!hasSelection}
        className={!hasSelection ? 'disabled' : ''}
      >
        💬 Comment
      </button>
      <button
        onClick={() => setShowHistoryModal(true)}
        title="View History"
      >
        📜 History
      </button>
      <button onClick={() => saveToLocalStorage(content, wordCount)} title="Save to Local Storage">
        💾 Save
      </button>
      <button onClick={() => clearText(editorRef, socketRef, () => {})} title="Clear All Text">
        🗑️ Clear
      </button>
    </div>
  );
}
