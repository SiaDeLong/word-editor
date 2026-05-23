export default function Footer({ wordCount, content }) {
  return (
    <footer className="editor-footer">
      <div className="footer-content">
        <span>Words: {wordCount}</span>
        <span>Characters: {content.replace(/<[^>]*>/g, '').length}</span>
      </div>
    </footer>
  );
}
