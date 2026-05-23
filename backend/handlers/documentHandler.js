export const handleJoinDocument = (socket, io, docId, userId, userColor, userName, documents, userCursors, comments, history) => {
  const initDocument = (docId) => {
    if (!documents.has(docId)) {
      const demoContent = `<p><strong>[DEMO DOCUMENT - For Interview Purpose]</strong></p>
<p>This is a comprehensive collaborative text editor demonstration document designed to showcase all features including <strong>bold text</strong>, <em>italic formatting</em>, <u>underlined content</u>, and real-time collaboration capabilities.</p>

<p><strong>Text Formatting Examples</strong></p>
<p>Try selecting text and using the toolbar to apply different formatting styles. You can make text <strong>bold for emphasis</strong>, use <em>italics for subtle highlighting</em>, or <u>underline important information</u>. You can also <strong><em>combine multiple formats</em></strong> for greater visual impact.</p>

<p><strong>Color and Font Size</strong></p>
<p>The editor supports custom text colors and adjustable font sizes. Select any text and use the color picker to change its color, or choose from 7 different font sizes ranging from 8px to 36px. This allows you to create visually distinct sections within your document.</p>

<p><strong>Lists and Organization</strong></p>
<p>You can create bullet point lists to organize information hierarchically:</p>
<ul>
<li>First item in the list</li>
<li>Second item with more details</li>
<li>Third item to complete the example</li>
</ul>

<p><strong>Review and Approval Workflow</strong></p>
<p>Select any text and click the Review button to mark it as reviewed. Reviewed sections will be highlighted in green, allowing team members to see which parts have been approved. This is useful for quality assurance and content verification processes.</p>

<p><strong>Comments and Discussions</strong></p>
<p>Select text and click the Comment button to add comments. Comments support threaded replies, allowing team members to have conversations about specific document sections. Each comment shows the author's name and timestamp for full traceability.</p>

<p><strong>Real-Time Collaboration</strong></p>
<p>When multiple users are editing the same document, you'll see their colored cursors in real-time. The sidebar shows all active users and their current cursor positions. Changes made by other users appear instantly in your editor without requiring any manual refresh.</p>

<p><strong>Version History and Restoration</strong></p>
<p>Every significant change to the document is automatically saved to the version history. Click the History button to view all previous versions with timestamps. You can restore any previous version with a single click, and the change will be synced to all collaborators.</p>

<p><strong>Document Statistics</strong></p>
<p>The footer displays real-time word and character counts. This helps you track document length and meet any length requirements for your content.</p>

<p><strong>Local Storage Backup</strong></p>
<p>Use the Save button to backup your document to your browser's local storage. This provides an additional safety net in case of unexpected issues. You can retrieve your saved document later from the same browser.</p>

<p><strong>Collaborative Features Summary</strong></p>
<p>This editor combines essential collaboration features into a single, intuitive interface. Whether you're working on a team project, reviewing content, or managing document versions, all the tools you need are readily available. The real-time synchronization ensures that all team members stay in sync, while the review and comment features facilitate clear communication about document content.</p>

<p><strong>Getting Started</strong></p>
<p>To test the collaborative features, open this document in multiple browser tabs or windows. You'll see changes sync in real-time across all instances. Try selecting text to enable the Review and Comment buttons, and experiment with different formatting options to see how they work.</p>`;

      documents.set(docId, {
        content: demoContent,
        reviewed: []
      });
      comments.set(docId, []);
      history.set(docId, [{ content: demoContent, reviewed: [], timestamp: Date.now() }]);
    }
  };

  initDocument(docId);
  socket.join(docId);

  const doc = documents.get(docId);
  socket.emit('load-document', {
    content: doc.content,
    reviewed: doc.reviewed,
    comments: comments.get(docId),
    history: history.get(docId),
    userId,
    userColor,
    userName
  });

  if (!userCursors.has(docId)) {
    userCursors.set(docId, {});
  }
  userCursors.get(docId)[userId] = {
    position: 0,
    color: userColor,
    name: userName
  };

  io.to(docId).emit('cursor-positions', userCursors.get(docId));
};

export const handleEdit = (socket, io, docId, data, userId, documents, history) => {
  if (!docId) return;

  const doc = documents.get(docId);
  doc.content = data.content;

  socket.to(docId).emit('content-update', {
    content: data.content,
    userId: userId
  });
};

export const handleSaveHistory = (io, docId, data, userId, history, documents) => {
  if (!docId) return;

  const historyArray = history.get(docId);
  const lastEntry = historyArray[historyArray.length - 1];
  const doc = documents.get(docId);

  if (lastEntry.content !== data.content) {
    historyArray.push({
      content: data.content,
      reviewed: data.reviewed || doc.reviewed || [],
      timestamp: Date.now(),
      userId,
      version: historyArray.length
    });

    if (historyArray.length > 50) {
      historyArray.shift();
    }

    io.to(docId).emit('history-update', historyArray);
  }
};
