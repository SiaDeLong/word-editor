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
      if (editorRef.current) {
        editorRef.current.innerHTML = data.content;
      }
    });

    socketRef.current.on('content-update', (data) => {
      if (data.userId !== userId && editorRef.current) {
        const oldContent = editorRef.current.textContent;
        // Extract text content from HTML to compare properly
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = data.content;
        const newContent = tempDiv.textContent;
        
        // Adjust review ranges based on content change
        const adjustedReviewed = adjustReviewRanges(oldContent, newContent, reviewed);
        if (JSON.stringify(adjustedReviewed) !== JSON.stringify(reviewed)) {
          setReviewed(adjustedReviewed);
          // Emit updated review ranges to all users
          socketRef.current.emit('update-reviewed-ranges', adjustedReviewed);
        }
        
        setContent(data.content);
        editorRef.current.innerHTML = data.content;
      }
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
  };
};
