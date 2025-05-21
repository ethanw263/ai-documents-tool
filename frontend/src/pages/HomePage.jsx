import React, { useState, useRef } from "react";
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
  const [loadingTitleMap, setLoadingTitleMap] = useState({});
  const [error, setError] = useState(null);
  const [newlyLoadedTitles, setNewlyLoadedTitles] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const clauseSectionRef = useRef(null);

  const normalize = (str) =>
    str?.trim().toLowerCase().replace(/^[\d\.\s-]+/, "").replace(/\.+$/, "");

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
      else {
        setClauseTitles(data.titles?.map((t) => t.trim()) || []);
        setSelectedTitles([]);
        setAllClauses([]);
        setTimeout(() => {
          clauseSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
        }, 150);
      }
    } catch (err) {
      setError("Failed to scan for clause titles.");
    } finally {
      setLoading(false);
    }
  };

  const fetchClauses = async (titles) => {
    setLoadingClauses(true);
    setError(null);
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (text) formData.append("raw_text", text);
    formData.append("selected_titles", JSON.stringify(titles));

    const loadingMap = { ...loadingTitleMap };
    titles.forEach((title) => (loadingMap[title] = true));
    setLoadingTitleMap(loadingMap);

    try {
      const res = await fetch("http://localhost:8000/extract_selected_clauses/", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      const incoming = (data.clauses || []).map((c) => ({
        title: c.title?.trim() || "Untitled",
        text: c.text || "No content available.",
        summary: c.summary || "",
      }));

      setAllClauses((prev) => {
        const filtered = prev.filter(
          (c) => !titles.some((t) => normalize(t) === normalize(c.title))
        );
        return [...filtered, ...incoming];
      });
      setNewlyLoadedTitles(titles.map((t) => t.trim()));
    } catch (err) {
      console.error("fetchClauses failed:", err);
      setError("Failed to fetch clauses: " + err.message);
    } finally {
      const newMap = { ...loadingTitleMap };
      titles.forEach((title) => delete newMap[title]);
      setLoadingTitleMap(newMap);
      setLoadingClauses(false);
    }
  };

  const toggleTitleSelection = async (title) => {
    const normalizedTitle = title.trim();
    const isAdding = !selectedTitles.includes(normalizedTitle);
    const updated = isAdding
      ? [...selectedTitles, normalizedTitle]
      : selectedTitles.filter((t) => t !== normalizedTitle);
    setSelectedTitles(updated);

    if (isAdding && !allClauses.some((c) => normalize(c.title) === normalize(normalizedTitle))) {
      await fetchClauses([normalizedTitle]);
    }
  };

  const displayedClauses = allClauses.filter((c) =>
    selectedTitles.some((t) => normalize(t) === normalize(c.title))
  );

  const filteredClauseTitles = clauseTitles.filter((t) =>
    normalize(t).includes(normalize(searchQuery))
  );

  return (
    <>
      <div className={`dashboard-container ${sidebarVisible ? "sidebar-open" : "sidebar-closed"}`}>
        <aside className={`sidebar ${!sidebarVisible ? "hidden" : ""}`}>
          <h2 className="logo">ClauseIQ</h2>
          <ul className="nav-list">
            <li className="active">🏠 Home</li>
            <li>📁 Documents</li>
            <li>📊 Insights</li>
            <li>⚙️ Settings</li>
          </ul>
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
            </div>
            {error && <p className="error-msg">{error}</p>}
          </section>

          <section className="content-layout" ref={clauseSectionRef}>
            <aside className="clause-sidebar">
              <h4>Clause Titles</h4>
              <input
                type="text"
                placeholder="Search..."
                className="search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <div className="clause-list">
                {filteredClauseTitles.map((title, idx) => (
                  <label key={idx}>
                    <input
                      type="checkbox"
                      checked={selectedTitles.includes(title.trim())}
                      onChange={() => toggleTitleSelection(title)}
                    />
                    {title}
                    {loadingTitleMap[title] && <span className="spinner">⏳</span>}
                  </label>
                ))}
              </div>
            </aside>

            <div className="clause-details">
              {loadingClauses && <p className="loading-text">Loading selected clauses...</p>}
              {!loadingClauses && displayedClauses.length === 0 && (
                <p className="loading-text">No clauses loaded yet. Try selecting a title.</p>
              )}
              {displayedClauses.map((clause, index) => (
                <div
                  className={`clause-block ${
                    newlyLoadedTitles.includes(clause.title) ? "highlight" : ""
                  }`}
                  key={index}
                >
                  <div className="clause-title-static">{clause.title}</div>
                  <div className="clause-summary-display">
                    <strong>Summary:</strong> {clause.summary}
                  </div>
                  <textarea
                    className="clause-text"
                    value={clause.text}
                    onChange={(e) =>
                      setAllClauses((prev) =>
                        prev.map((c, i) =>
                          i === index ? { ...c, text: e.target.value } : c
                        )
                      )
                    }
                  />
                </div>
              ))}
            </div>
          </section>

          <Footer />
        </div>
      </div>

      <button
        className="floating-sidebar-toggle"
        onClick={() => setSidebarVisible(!sidebarVisible)}
        style={{ left: sidebarVisible ? 246 : 16 }}
      >
        <div></div>
        <div></div>
        <div></div>
      </button>
    </>
  );
}
