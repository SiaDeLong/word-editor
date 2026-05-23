export default function HistoryModal({
  history,
  selectedHistoryVersion,
  setSelectedHistoryVersion,
  onRestore,
  onClose
}) {
  return (
    <div className="modal-overlay">
      <div className="modal">
        <div className="modal-header">
          <h2>Version History</h2>
          <button className="close-btn" onClick={onClose}>×</button>
        </div>
        <div className="modal-content">
          <div className="history-list">
            {history.map((entry, idx) => (
              <div key={idx} className="history-entry">
                <div className="history-time">
                  v{entry.version || idx} - {new Date(entry.timestamp).toLocaleString()}
                </div>
                <div className="history-preview">
                  {entry.content.substring(0, 100)}...
                </div>
                <button 
                  onClick={() => {
                    setSelectedHistoryVersion(idx);
                    onRestore(entry);
                  }}
                  className={selectedHistoryVersion === idx ? 'active' : ''}
                >
                  Restore
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
