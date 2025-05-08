// PreviewEdited.jsx - For previewing updated/edited clauses
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import "./PreviewEdited.css";

export default function PreviewEdited() {
  const navigate = useNavigate();
  const [clauses, setClauses] = useState([]);

  useEffect(() => {
    const stored = localStorage.getItem("previewClauses");
    if (stored) setClauses(JSON.parse(stored));
  }, []);

  const handleBack = () => {
    navigate("/");
  };

  return (
    <div className="preview-edited-container">
      <nav className="preview-nav">
        <div className="preview-nav-content">
          <h1 className="preview-title">ClauseIQ</h1>
          <button onClick={handleBack} className="preview-back-button">
            🔙 Back to Edit
          </button>
        </div>
      </nav>

      <section className="preview-body">
        <div className="preview-content">
          <h2 className="preview-heading">📄 Updated Contract</h2>
          {clauses.length === 0 ? (
            <p className="no-clauses">No updated clauses to preview.</p>
          ) : (
            clauses.map((clause, idx) => (
              <div key={idx} className="preview-clause-block">
                <h3 className="clause-block-title">{idx + 1}. {clause.title}</h3>
                <p className="clause-block-summary">{clause.summary}</p>
                <p className="clause-block-text">{clause.text}</p>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  );
}
