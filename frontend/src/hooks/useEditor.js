import { useState, useEffect, useRef } from 'react';
import { io } from 'socket.io-client';

export const useEditor = () => {
  const [content, setContent] = useState('');
  const [reviewed, setReviewed] = useState([]);
  const [comments, setComments] = useState([]);
  const [history, setHistory] = useState([]);
  const [userCursors, setUserCursors] = useState({});
  const [userId, setUserId] = useState('');
  const [userColor, setUserColor] = useState('');
  const [userName, setUserName] = useState('');
  const [wordCount, setWordCount] = useState(0);
  const editorRef = useRef(null);
  const socketRef = useRef(null);
  const lastContentRef = useRef('');
  const versionRef = useRef(0);

  // Merge overlapping review ranges (imported from backend utils)
  const mergeReviewRanges = (ranges) => {
    if (ranges.length === 0) return [];
    const sorted = [...ranges].sort((a, b) => a.start - b.start);
    const merged = [];
    let current = { ...sorted[0] };
    for (let i = 1; i < sorted.length; i++) {
      const next = sorted[i];
      if (next.start <= current.end) {
        current.end = Math.max(current.end, next.end);
      } else {
        merged.push(current);
        current = { ...next };
      }
    }
    merged.push(current);
    return merged;
  };

  // Adjust review ranges when content changes
  const adjustReviewRanges = (oldContent, newContent, currentReviewed) => {
    if (!oldContent || !newContent || currentReviewed.length === 0) {
      return currentReviewed;
    }

    // Find the first difference
    let diffStart = 0;
    while (diffStart < oldContent.length && diffStart < newContent.length && oldContent[diffStart] === newContent[diffStart]) {
      diffStart++;
    }

    // Find the last difference
    let oldEnd = oldContent.length - 1;
    let newEnd = newContent.length - 1;
    while (oldEnd >= diffStart && newEnd >= diffStart && oldContent[oldEnd] === newContent[newEnd]) {
      oldEnd--;
      newEnd--;
    }

    const deletedLength = oldEnd - diffStart + 1;
    const insertedLength = newEnd - diffStart + 1;
    const lengthDiff = insertedLength - deletedLength;
    const changeEnd = diffStart + deletedLength;

    // Adjust review ranges
    const adjustedRanges = [];
    
    currentReviewed.forEach(rev => {
      // If review ends before the change, no adjustment needed
      if (rev.end <= diffStart) {
        adjustedRanges.push(rev);
      }
      // If review starts after the change, shift it
      else if (rev.start >= changeEnd) {
        adjustedRanges.push({
          ...rev,
          start: rev.start + lengthDiff,
          end: rev.end + lengthDiff
        });
      }
      // If review overlaps with change, split it
      else {
        // Keep the part before the change
        if (rev.start < diffStart) {
          adjustedRanges.push({
            ...rev,
            end: diffStart
          });
        }
        // Keep the part after the change (adjusted for length difference)
        if (rev.end > changeEnd) {
          adjustedRanges.push({
            ...rev,
            start: diffStart + insertedLength,
            end: rev.end + lengthDiff
          });
        }
      }
    });

    return adjustedRanges;
  };

  // Apply review highlights
  useEffect(() => {
    if (!editorRef.current || reviewed.length === 0) return;

    try {
      // Save cursor position before modifying DOM
      const selection = window.getSelection();
      let cursorPos = 0;
      let hasCursor = false;
      
      if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
        const range = selection.getRangeAt(0);
        const preCaretRange = range.cloneRange();
        preCaretRange.selectNodeContents(editorRef.current);
        preCaretRange.setEnd(range.endContainer, range.endOffset);
        cursorPos = preCaretRange.toString().length;
        hasCursor = true;
      }

      // First, remove all existing marks
      const existingMarks = editorRef.current.querySelectorAll('mark');
      existingMarks.forEach(mark => {
        const parent = mark.parentNode;
        while (mark.firstChild) {
          parent.insertBefore(mark.firstChild, mark);
        }
        parent.removeChild(mark);
      });

      // Get the full text using toString() method (same as selection)
      const range = document.createRange();
      range.selectNodeContents(editorRef.current);
      const fullText = range.toString();
      
      // Create a map of which characters should be highlighted
      const highlightMap = new Array(fullText.length).fill(false);
      reviewed.forEach(rev => {
        for (let i = rev.start; i < rev.end && i < fullText.length; i++) {
          highlightMap[i] = true;
        }
      });

      // Walk through DOM and apply highlights
      const walker = document.createTreeWalker(
        editorRef.current,
        NodeFilter.SHOW_TEXT,
        null,
        false
      );

      let charIndex = 0;
      let node;
      const nodesToReplace = [];

      while (node = walker.nextNode()) {
        const nodeLength = node.textContent.length;
        const nodeStart = charIndex;
        const nodeEnd = charIndex + nodeLength;
        
        // Check if any part of this node should be highlighted
        let hasHighlight = false;
        for (let i = nodeStart; i < nodeEnd; i++) {
          if (highlightMap[i]) {
            hasHighlight = true;
            break;
          }
        }

        if (hasHighlight) {
          nodesToReplace.push({
            node,
            start: nodeStart,
            end: nodeEnd
          });
        }

        charIndex = nodeEnd;
      }

      // Replace nodes with highlighted versions
      nodesToReplace.forEach(({ node, start, end }) => {
        if (!node.parentNode) return;

        const text = node.textContent;
        const fragment = document.createDocumentFragment();

        for (let i = 0; i < text.length; i++) {
          const charPos = start + i;
          if (highlightMap[charPos]) {
            const mark = document.createElement('mark');
            mark.style.backgroundColor = '#c8e6c9';
            mark.style.padding = '2px 0';
            mark.textContent = text[i];
            fragment.appendChild(mark);
          } else {
            fragment.appendChild(document.createTextNode(text[i]));
          }
        }

        node.parentNode.replaceChild(fragment, node);
      });

      // Restore cursor position after DOM modifications
      if (hasCursor) {
        const newRange = document.createRange();
        const newSelection = window.getSelection();
        let charCount = 0;
        let found = false;

        const traverse = (node) => {
          if (found) return;

          if (node.nodeType === Node.TEXT_NODE) {
            const nodeLength = node.textContent.length;
            if (charCount + nodeLength >= cursorPos) {
              const offset = cursorPos - charCount;
              newRange.setStart(node, Math.min(offset, node.textContent.length));
              newRange.collapse(true);
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
          newSelection.removeAllRanges();
          newSelection.addRange(newRange);
        }
      }
    } catch (error) {
      console.error('Error applying review highlights:', error);
    }
  }, [reviewed]);

  useEffect(() => {
    socketRef.current = io('http://localhost:3000');

    // Get or create persistent user ID for this tab/session
    let persistedUserId = sessionStorage.getItem('editorUserId');
    if (!persistedUserId) {
      persistedUserId = `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      sessionStorage.setItem('editorUserId', persistedUserId);
    }

    // Send persistent ID to server
    socketRef.current.emit('set-persistent-id', persistedUserId);

    socketRef.current.on('load-document', (data) => {
      setContent(data.content);
      setReviewed(data.reviewed || []);
      setComments(data.comments || []);
      setHistory(data.history || []);
      setUserId(data.userId);
      setUserColor(data.userColor);
      setUserName(data.userName);
      versionRef.current = data.version || 0;
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
        lastContentRef.current = data.content;
      }
    });

    socketRef.current.on('edit-accepted', (data) => {
      // Server accepted our edit, update version
      versionRef.current = data.version;
    });

    socketRef.current.on('content-update', (data) => {
      // Only update content from OTHER users
      if (data.userId !== userId && editorRef.current) {
        const oldContent = lastContentRef.current;
        const newContent = data.content;
        
        // Save cursor position before updating content
        const selection = window.getSelection();
        let cursorPos = 0;
        let hasCursor = false;
        
        if (selection.rangeCount > 0 && editorRef.current.contains(selection.anchorNode)) {
          const range = selection.getRangeAt(0);
          const preCaretRange = range.cloneRange();
          preCaretRange.selectNodeContents(editorRef.current);
          preCaretRange.setEnd(range.endContainer, range.endOffset);
          cursorPos = preCaretRange.toString().length;
          hasCursor = true;
        }
        
        // Extract text content to compare for review range adjustment
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = oldContent;
        const oldText = tempDiv.textContent;
        
        const tempDiv2 = document.createElement('div');
        tempDiv2.innerHTML = newContent;
        const newText = tempDiv2.textContent;
        
        // Adjust review ranges based on content change
        const adjustedReviewed = adjustReviewRanges(oldText, newText, reviewed);
        if (JSON.stringify(adjustedReviewed) !== JSON.stringify(reviewed)) {
          setReviewed(adjustedReviewed);
          // Emit updated review ranges to server
          socketRef.current.emit('update-reviewed-ranges', adjustedReviewed);
        }
        
        // Calculate cursor position shift based on content change
        let newCursorPos = cursorPos;
        if (hasCursor && oldText !== newText) {
          // Find where the change occurred
          let diffStart = 0;
          while (diffStart < oldText.length && diffStart < newText.length && oldText[diffStart] === newText[diffStart]) {
            diffStart++;
          }
          
          const oldLength = oldText.length;
          const newLength = newText.length;
          const lengthDiff = newLength - oldLength;
          
          // If cursor is after the change, shift it
          if (cursorPos > diffStart) {
            newCursorPos = Math.max(diffStart, cursorPos + lengthDiff);
          }
        }
        
        setContent(newContent);
        editorRef.current.innerHTML = newContent;
        lastContentRef.current = newContent;
        
        // Restore cursor position
        if (hasCursor) {
          const newRange = document.createRange();
          const newSelection = window.getSelection();
          let charCount = 0;
          let found = false;

          const traverse = (node) => {
            if (found) return;

            if (node.nodeType === Node.TEXT_NODE) {
              const nodeLength = node.textContent.length;
              if (charCount + nodeLength >= newCursorPos) {
                const offset = newCursorPos - charCount;
                newRange.setStart(node, Math.min(offset, node.textContent.length));
                newRange.collapse(true);
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
            newSelection.removeAllRanges();
            newSelection.addRange(newRange);
          }
        }
        
        // Update version from server
        versionRef.current = data.version || versionRef.current + 1;
      }
    });

    socketRef.current.on('conflict-detected', (data) => {
      // Conflict detected - server rejected our edit
      // Sync to server's version
      versionRef.current = data.currentVersion;
      setContent(data.currentContent);
      if (editorRef.current) {
        editorRef.current.innerHTML = data.currentContent;
        lastContentRef.current = data.currentContent;
      }
      alert('Your edit conflicted with another user. Document has been synced to latest version.');
    });

    socketRef.current.on('cursor-positions', (positions) => {
      setUserCursors(positions);
    });

    socketRef.current.on('reviewed-update', (rev) => {
      setReviewed(rev);
    });

    socketRef.current.on('comments-update', (comms) => {
      setComments(comms);
    });

    socketRef.current.on('history-update', (hist) => {
      setHistory(hist);
    });

    socketRef.current.emit('join-document', 'default-doc');

    return () => socketRef.current.disconnect();
  }, []);

  return {
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
    lastContentRef,
    mergeReviewRanges,
    adjustReviewRanges,
    versionRef
  };
};
