// Helper function to calculate character position consistently using toString
const getCharacterPosition = (editorRef, range, isEnd = false) => {
  const preCaretRange = range.cloneRange();
  preCaretRange.selectNodeContents(editorRef.current);
  if (isEnd) {
    preCaretRange.setEnd(range.endContainer, range.endOffset);
  } else {
    preCaretRange.setEnd(range.startContainer, range.startOffset);
  }
  return preCaretRange.toString().length;
};

export const handleContentChange = (e, socketRef, setWordCount, reviewed) => {
  const newContent = e.currentTarget.innerHTML;
  socketRef.current.emit('edit', { content: newContent });
  
  const text = e.currentTarget.textContent;
  const words = text.trim().split(/\s+/).filter(word => word.length > 0).length;
  setWordCount(words);

  clearTimeout(window.historyTimeout);
  window.historyTimeout = setTimeout(() => {
    socketRef.current.emit('save-history', { content: newContent, reviewed: reviewed || [] });
  }, 2000);
};

export const handleCursorMove = (editorRef, socketRef) => {
  if (editorRef.current) {
    const selection = window.getSelection();
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0);
      const preCaretRange = range.cloneRange();
      preCaretRange.selectNodeContents(editorRef.current);
      preCaretRange.setEnd(range.endContainer, range.endOffset);
      const pos = preCaretRange.toString().length;
      
      clearTimeout(window.cursorTimeout);
      window.cursorTimeout = setTimeout(() => {
        socketRef.current.emit('cursor-move', { position: pos });
      }, 300);
    }
  }
};

export const applyFormatting = (command, value, editorRef, socketRef) => {
  document.execCommand(command, false, value);
  editorRef.current.focus();
  const newContent = editorRef.current.innerHTML;
  socketRef.current.emit('edit', { content: newContent });
};

export const markAsReviewed = (editorRef, socketRef, reviewed, userName) => {
  const selection = window.getSelection();
  if (selection.toString().length === 0) return;

  const range = selection.getRangeAt(0);
  
  const start = getCharacterPosition(editorRef, range, false);
  const end = getCharacterPosition(editorRef, range, true);

  const alreadyReviewed = reviewed.some(rev => rev.start === start && rev.end === end);

  if (alreadyReviewed) {
    socketRef.current.emit('unmark-reviewed', { start, end });
  } else {
    socketRef.current.emit('mark-reviewed', {
      id: `${Date.now()}-${Math.random()}`,
      start,
      end,
      text: selection.toString(),
      reviewedBy: userName
    });
  }
};

export const handleSelectForComment = (editorRef, setSelectedRange, setShowCommentBox) => {
  const selection = window.getSelection();
  if (selection.toString().length === 0) {
    setShowCommentBox(false);
    return;
  }

  const range = selection.getRangeAt(0);
  
  const start = getCharacterPosition(editorRef, range, false);
  const end = getCharacterPosition(editorRef, range, true);

  setSelectedRange({ start, end, text: selection.toString() });
  setShowCommentBox(true);
};

export const addComment = (selectedRange, commentText, socketRef, userName, userColor, setCommentText, setShowCommentBox, setSelectedRange) => {
  if (!selectedRange || !commentText.trim()) return;

  socketRef.current.emit('add-comment', {
    id: `${Date.now()}-${Math.random()}`,
    start: selectedRange.start,
    end: selectedRange.end,
    text: commentText,
    selectedText: selectedRange.text,
    author: userName,
    authorColor: userColor,
    replies: []
  });

  setCommentText('');
  setShowCommentBox(false);
  setSelectedRange(null);
};

export const addReply = (commentId, replyText, socketRef, userName, userColor, setReplyText, setReplyingTo) => {
  if (!replyText.trim()) return;

  socketRef.current.emit('add-reply', {
    commentId,
    text: replyText,
    author: userName,
    authorColor: userColor
  });

  setReplyText('');
  setReplyingTo(null);
};

export const clearText = (editorRef, socketRef, setWordCount) => {
  if (window.confirm('Are you sure you want to clear all text? This cannot be undone.')) {
    const newContent = '';
    if (editorRef.current) {
      editorRef.current.innerHTML = newContent;
    }
    socketRef.current.emit('edit', { content: newContent });
    setWordCount(0);
  }
};

export const saveToLocalStorage = (content, wordCount) => {
  const saveData = {
    content: content,
    timestamp: new Date().toLocaleString(),
    wordCount: wordCount
  };
  localStorage.setItem('editorSave', JSON.stringify(saveData));
  alert(`Document saved to local storage at ${saveData.timestamp}`);
};

export const calculateCursorPosition = (charIndex, content, editorRef) => {
  if (!editorRef.current) return { top: 0, left: 0 };
  
  const text = editorRef.current.textContent;
  if (charIndex > text.length) charIndex = text.length;
  
  const range = document.createRange();
  const selection = window.getSelection();
  
  try {
    let charCount = 0;
    let found = false;
    
    const traverse = (node) => {
      if (found) return;
      
      if (node.nodeType === Node.TEXT_NODE) {
        const nodeLength = node.textContent.length;
        if (charCount + nodeLength >= charIndex) {
          const offset = charIndex - charCount;
          range.setStart(node, offset);
          range.collapse(true);
          found = true;
          return;
        }
        charCount += nodeLength;
      } else {
        for (let child of node.childNodes) {
          traverse(child);
          if (found) return;
        }
      }
    };
    
    traverse(editorRef.current);
    
    if (found) {
      const rect = range.getBoundingClientRect();
      const editorRect = editorRef.current.getBoundingClientRect();
      return {
        top: rect.top - editorRect.top,
        left: rect.left - editorRect.left
      };
    }
  } catch (e) {
    // Fallback
  }
  
  return { top: 0, left: 0 };
};

export const restoreHistoryVersion = (version, editorRef, socketRef, setShowHistoryModal) => {
  if (editorRef.current) {
    editorRef.current.innerHTML = version.content;
  }
  socketRef.current.emit('edit', { content: version.content });
  socketRef.current.emit('save-history', { content: version.content });
  setShowHistoryModal(false);
};
