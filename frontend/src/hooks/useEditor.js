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
