// HomePage.jsx — Footer now full width, sidebar unchanged
import React, { useState, useRef, useEffect } from "react";
import jsPDF from "jspdf";
import "./HomePage.css";
import { useNavigate } from "react-router-dom";
import Footer from "../components/Footer";

export default function HomePage() {
  const navigate = useNavigate();
  const [file, setFile] = useState(null);
  const [text, setText] = useState("");
  const [clauseTitles, setClauseTitles] = useState([]);
  const [selectedTitles, setSelectedTitles] = useState([]);
  const [allClauses, setAllClauses] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState({});
  const [loading, setLoading] = useState(false);
  const [loadingClauses, setLoadingClauses] = useState(false);
  const [error, setError] = useState(null);
  const [previousTitles, setPreviousTitles] = useState([]);
  const clauseSectionRef = useRef(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleScanForHeadings = async () => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (text) formData.append("raw_text", text);

    try {
      const res = await fetch("http://localhost:8000/extract_clause_titles/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) setError(data.error);
      else setClauseTitles(data.titles || []);
    } catch (err) {
      setError("Failed to scan for clause titles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClauses = async (titles) => {
    setLoadingClauses(true);
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (text) formData.append("raw_text", text);
    formData.append("selected_titles", JSON.stringify(titles));

    try {
      const res = await fetch("http://localhost:8000/extract_selected_clauses/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (!data.error) {
        const valid = (data.clauses || []).filter((c) => c.title && c.text);
        setAllClauses(valid);
      }
    } catch {
      setError("Failed to fetch clauses.");
    } finally {
      setLoadingClauses(false);
    }
  };

  const handleAISuggestions = async (index) => {
    const clause = allClauses[index];
    const res = await fetch("http://localhost:8000/ai_clause_suggestions/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        clause_text: clause?.text || "",
        instructions:
          "Rewrite this clause to be clearer, more professional, and preserve all meaning. Return one rewritten version."
      })
    });
    const data = await res.json();
    const suggestion = data.suggestions?.[0] || "No suggestions available.";
    setAiSuggestions((prev) => ({ ...prev, [index]: suggestion }));
  };

  const handleEdit = (index, field, value) => {
    const updated = [...allClauses];
    updated[index][field] = value;
    setAllClauses(updated);
  };

  const handleSaveChanges = () => alert("Changes saved!");

  const handlePreviewUpdatedContract = () => {
    const selectedClauses = allClauses.filter((c) => selectedTitles.includes(c.title));
    localStorage.setItem("previewClauses", JSON.stringify(selectedClauses));
    navigate("/preview");
  };

  const handlePreviewOriginal = () => {
    if (file) {
      const blob = new Blob([file], { type: file.type });
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    }
  };

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Clause copied to clipboard!");
  };

  const handleDelete = (index) => {
    const titleToRemove = allClauses[index]?.title;
    const updatedTitles = selectedTitles.filter((t) => t !== titleToRemove);
    setSelectedTitles(updatedTitles);
    setAllClauses((prev) => prev.filter((c) => c.title !== titleToRemove));
  };

  const toggleTitleSelection = async (title) => {
    const isAdding = !selectedTitles.includes(title);
    const updated = isAdding
      ? [...selectedTitles, title]
      : selectedTitles.filter((t) => t !== title);
    setPreviousTitles(selectedTitles);
    setSelectedTitles(updated);
    if (isAdding) {
      setLoadingClauses(true);
      await fetchClauses(updated);
    }
  };

  useEffect(() => {
    if (selectedTitles.length > 0) {
      setTimeout(() => {
        clauseSectionRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 500);
    }
  }, [selectedTitles]);

  const displayedClauses = allClauses.filter((c) => selectedTitles.includes(c.title));

  return (
    <>
      <div className="dashboard-container">
        <aside className={`sidebar ${sidebarOpen ? "expanded" : "collapsed"}`}>
          <button className="sidebar-toggle square" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? "←" : "→"}
          </button>
          {sidebarOpen && (
            <>
              <h2 className="logo">ClauseIQ</h2>
              <ul className="nav-list">
                <li className="active">🏠 Home</li>
                <li>📁 Documents</li>
                <li>📊 Insights</li>
                <li>⚙️ Settings</li>
              </ul>
            </>
          )}
        </aside>

        <div className="main-panel">
          <header className="main-header">
            <div className="header-title">📝 Upload & Analyze Contract</div>
            <div className="floating-bar">Coming soon: AI Suggestions | Search | Comments</div>
            {loading && <div className="loading-banner">Scanning for clause titles...</div>}
          </header>

          <section className="upload-section">
            <h3>Upload Contract</h3>
            <input type="file" onChange={(e) => setFile(e.target.files[0])} />
            <textarea
              placeholder="Or paste contract text here..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <div className="button-row wide">
              <button onClick={handleScanForHeadings} disabled={loading}>
                {loading ? "Scanning..." : "Scan Headings"}
              </button>
              <button onClick={handlePreviewOriginal}>📄 Preview File</button>
            </div>
            {error && <p className="error-msg">{error}</p>}
          </section>

          <section className="content-layout" ref={clauseSectionRef}>
            <aside className="clause-sidebar">
              <h4>Clause Titles</h4>
              <div className="clause-list">
                {clauseTitles.map((title, idx) => (
                  <label key={idx}>
                    <input
                      type="checkbox"
                      checked={selectedTitles.includes(title)}
                      onChange={() => toggleTitleSelection(title)}
                    />
                    {title}
                  </label>
                ))}
                {loadingClauses && selectedTitles.length > previousTitles.length && (
                  <p className="loading-text">Loading clause(s)...</p>
                )}
              </div>
            </aside>

            <div className="clause-details">
              {loadingClauses && selectedTitles.length > previousTitles.length && (
                <p className="loading-text">Loading selected clauses...</p>
              )}
              {displayedClauses.map((clause, index) => (
                <div className="clause-block" key={index}>
                  <div className="clause-title-static">{clause.title}</div>
                  <div className="clause-summary-display">
                    <strong>Summary:</strong> {clause.summary}
                  </div>
                  <textarea
                    className="clause-text"
                    value={clause.text}
                    onChange={(e) => handleEdit(index, "text", e.target.value)}
                  />
                  <div className="clause-actions">
                    <button onClick={() => handleCopy(clause.text)}>📋 Copy</button>
                    <button onClick={() => handleDelete(index)}>❌ Delete</button>
                    <button onClick={() => handleAISuggestions(index)}>💡 AI Suggestion</button>
                  </div>
                  {aiSuggestions[index] && (
                    <div className="ai-suggestions-box">
                      <strong>AI Suggestion:</strong>
                      <div className="suggestion-text">{aiSuggestions[index]}</div>
                    </div>
                  )}
                </div>
              ))}

              {displayedClauses.length > 0 && (
                <div className="download-btn">
                  <button onClick={handleSaveChanges}>💾 Save Changes</button>
                  <button onClick={handlePreviewUpdatedContract}>👀 Preview Updated Contract</button>
                </div>
              )}
            </div>
          </section>
        </div>
      </div>
      <Footer />
    </>
  );
}
