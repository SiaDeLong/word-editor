# Collaborative Text Editor

A real-time collaborative text editor with support for multiple users, formatting, reviews, comments, and version history.

## Features

- **Real-time Collaboration**: Multiple users can edit the same document simultaneously
- **Formatting Tools**: Bold, italic, text color, and font size controls
- **User Cursors**: See where other users are currently editing
- **Review Functionality**: Mark text as reviewed with visual highlighting
- **Comments**: Add comments to specific text ranges (like Google Docs)
- **Version History**: Track all changes with timestamps
- **Persistent Storage**: Document state is maintained on the server

## Project Structure

```
.
├── backend/                  # Express + Socket.io server
│   ├── server.js
│   └── package.json
├── frontend/                 # React + Vite client
│   ├── src/
│   │   ├── components/
│   │   │   ├── TextEditor.jsx
│   │   │   └── TextEditor.css
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── index.html
│   ├── vite.config.js
│   ├── eslint.config.js
│   └── package.json
├── package.json              # Root package.json
└── README.md
```

## Quick Start

### Prerequisites

- Node.js (v16 or higher)
- npm

### Installation & Running

1. **Install dependencies:**
   ```bash
   npm run install-all
   ```

2. **Start the application:**
   ```bash
   npm run dev
   ```
   Or use the provided batch file on Windows:
   ```bash
   start-dev.bat
   ```

3. **Open in browser:**
   Navigate to `http://localhost:5173`

That's it! The backend runs on `http://localhost:3000` and frontend on `http://localhost:5173`.

### Test Collaboration

Open the application in multiple browser tabs or windows to see real-time collaboration in action.

## Usage

### Formatting
- Select text and use the toolbar buttons to apply formatting:
  - **B**: Make text bold
  - **I**: Make text italic
  - **Color picker**: Change text color
  - **Font Size**: Select from predefined sizes (12px - 20px)

### Reviews
- Select text and click **✓ Review** to mark it as reviewed
- Reviewed text is highlighted in green
- Other users can see which text has been reviewed

### Comments
- Click **💬 Comment** to open the comment box
- Select text and add your comment
- Comments appear in the sidebar with timestamps and user info
- All users can see comments in real-time

### History
- Click **📜 History** to view version history
- The sidebar shows recent changes with timestamps
- Each change is tracked with the user who made it

### Active Users
- The sidebar displays active users and their current cursor positions
- See in real-time where other collaborators are working

## Screenshots

Add screenshots of the running application here:

- **Main Editor View**: [Add screenshot]
- **Collaboration in Action**: [Add screenshot]
- **Comments & Reviews**: [Add screenshot]
- **History Panel**: [Add screenshot]

## Architecture

### Backend (Express + Socket.io)
- `backend/server.js`: Handles real-time communication and document state management
- Manages document content, formatting, reviews, comments, and history
- Broadcasts changes to all connected clients

### Frontend (React + Vite)
- `frontend/src/components/TextEditor.jsx`: Main editor component
- `frontend/src/components/TextEditor.css`: Styling
- Socket.io client for real-time updates

## Development

### Build for Production

```bash
npm run build
```

### Lint Code

```bash
npm run lint --prefix frontend
```

## Notes

- Documents are stored in memory on the server and will be reset when the server restarts
- For production use, consider adding a database for persistent storage
- The application uses a single default document (`default-doc`) for simplicity
