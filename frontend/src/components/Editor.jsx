import { handleContentChange, handleCursorMove, calculateCursorPosition } from '../utils/editorUtils';

export default function Editor({
  editorRef,
  socketRef,
  userCursors,
  userId,
  setWordCount,
  onSelectionChange,
  reviewed,
  onContentChange
}) {
  return (
    <div className="editor-area">
      <div
        ref={editorRef}
        contentEditable
        onInput={(e) => {
          handleContentChange(e, socketRef, setWordCount, reviewed);
          onContentChange?.(e.currentTarget.innerHTML);
        }}
        onMouseUp={() => {
          handleCursorMove(editorRef, socketRef);
          onSelectionChange?.();
        }}
        onKeyUp={() => onSelectionChange?.()}
        className="editor"
        suppressContentEditableWarning
      />
      <div className="cursors-container">
        {Object.entries(userCursors).map(([uid, cursorData]) => {
          if (uid === userId) return null;
          const pos = calculateCursorPosition(cursorData.position, '', editorRef);
          return (
            <div
              key={uid}
              className="remote-cursor"
              style={{
                top: `${pos.top}px`,
                left: `${pos.left}px`,
                borderLeftColor: cursorData.color
              }}
            >
              <div
                className="cursor-label"
                style={{ backgroundColor: cursorData.color }}
              >
                {cursorData.name}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
