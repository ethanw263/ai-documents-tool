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
  const [expandedSuggestions, setExpandedSuggestions] = useState({});


  const normalize = (str) =>
    str
      ?.trim()
      .toLowerCase()
      .replace(/^section\s+/i, "")
      .replace(/^[ivxlcdm]+[\.\)]?\s*/i, "")
      .replace(/^\(?[a-zA-Z]\)?[\.\)]?\s*/, "")
      .replace(/^\d+[\.\)]?\s*/, "")
      .replace(/[^a-z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .trim();

  const handleScanForHeadings = async () => {
    setLoading(true);
    setError(null);
    const formData = new FormData();
    if (file) formData.append("file", file);
    if (text) formData.append("raw_text", text);

    try {
      const res = await fetch("/api/extract_clause_titles/", {
        method: "POST",
        body: formData
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

  const handlePreviewOriginal = () => {
    if (file) {
      const blob = new Blob([file], { type: file.type });
      const fileURL = URL.createObjectURL(blob);
      window.open(fileURL, "_blank");
    }
  };

  const handlePreviewUpdatedContract = () => {
    const selectedClauses = allClauses.filter((c) =>
      selectedTitles.some((t) => normalize(t) === normalize(c.title))
    );
    localStorage.setItem("previewClauses", JSON.stringify(selectedClauses));
    navigate("/preview");
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
      const res = await fetch("/api/extract_selected_clauses/", {
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

  const toggleSuggestion = (index) => {
    setExpandedSuggestions((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
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

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    alert("Clause copied to clipboard!");
  };

  const handleDelete = (index) => {
    const titleToRemove = allClauses[index]?.title;
    setSelectedTitles((prev) => prev.filter((t) => normalize(t) !== normalize(titleToRemove)));
    setAllClauses((prev) => prev.filter((c) => normalize(c.title) !== normalize(titleToRemove)));
  };

  const handleAISuggestions = async (index) => {
    const clause = allClauses[index];
    try {
      const res = await fetch("/api/ai_clause_suggestions/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clause_text: clause?.text || "" }),
      });
      const data = await res.json();
      console.log("🔍 Raw AI suggestion response:", data);

      if (data?.suggestions?.suggestion) {
        setAiSuggestions((prev) => ({
          ...prev,
          [index]: {
            suggestion: data.suggestions.suggestion,
            tips: data.suggestions.tips || [],
          },
        }));
      } else if (Array.isArray(data?.suggestions)) {
        setAiSuggestions((prev) => ({
          ...prev,
          [index]: {
            suggestion: data.suggestions[0] || "No suggestion returned.",
            tips: [],
          },
        }));
      } else {
        setAiSuggestions((prev) => ({
          ...prev,
          [index]: {
            suggestion: "No suggestion returned.",
            tips: [],
          },
        }));
      }
    } catch (err) {
      console.error("Failed to fetch AI suggestion:", err);
      setAiSuggestions((prev) => ({
        ...prev,
        [index]: {
          suggestion: "Error generating suggestion.",
          tips: [],
        },
      }));
    }
  };

  const applyAISuggestion = (index) => {
    const suggestion = aiSuggestions[index]?.suggestion;
    if (!suggestion) return;
    setAllClauses((prev) =>
      prev.map((c, i) =>
        i === index ? { ...c, text: `${suggestion}`} : c
      )
    );
  };

  const handleSaveChanges = () => alert("Changes saved!");

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
            <div className="header-text-only">
              <div className="header-title">📝 Upload & Analyze Contract</div>
              <div className="floating-bar">Coming soon: Updated AI Suggestions | Create and Save Projects | Return Editable Doc</div>
            </div>
          </header>


          <section className="upload-section">
            <div className={`upload-inner ${sidebarVisible ? "narrow" : "wide"}`}>
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
                <button onClick={handlePreviewUpdatedContract}>👀 Preview Updated Contract</button>
              </div>
              {error && <p className="error-msg">{error}</p>}
            </div>
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
                    value={clause.text.replace(/\n{2,}/g, "\n\n").replace(/\n/g, "\n\n")}
                    onChange={(e) =>
                      setAllClauses((prev) =>
                        prev.map((c, i) =>
                          i === index ? { ...c, text: e.target.value } : c
                        )
                      )
                    }
                  />
                  <div className="clause-actions">
                    <button onClick={() => handleCopy(clause.text)}>📋 Copy</button>
                    <button onClick={() => handleDelete(index)}>❌ Delete</button>
                    <button onClick={() => handleAISuggestions(index)}>💡 AI Suggestion</button>
                    <button onClick={() => applyAISuggestion(index)}>✅ Apply AI</button>
                  </div>
                  {aiSuggestions[index] && (
                  <div className="ai-suggestions-box">
                      <strong>AI Suggestion:</strong>
                      <div className="suggestion-text">
                        {(() => {
                          const full = String(aiSuggestions?.[index]?.suggestion || "");
                          const words = full.trim().split(/\s+/);
                          const hasMore = words.length > 100;
                          const shown =
                            expandedSuggestions[index] || !hasMore
                              ? full
                              : words.slice(0, 100).join(" ") + "…";

                          return shown.split("\n").map((line, i2) => (
                            <p key={`sugg-line-${index}-${i2}`}>{line.trim()}</p>
                          ));
                        })()}

                        {(() => {
                          const full = String(aiSuggestions?.[index]?.suggestion || "");
                          const hasMore = full.trim().split(/\s+/).length > 100;
                          if (!hasMore) return null;
                          return (
                            <button
                              type="button"
                              onClick={() => toggleSuggestion(index)}
                              style={{
                                marginTop: "6px",
                                fontSize: "0.85rem",
                                background: "none",
                                border: "none",
                                color: "#007bff",
                                cursor: "pointer",
                                paddingLeft: "0",
                              }}
                            >
                              {expandedSuggestions[index] ? "Show Less ▲" : "Show More ▼"}
                            </button>
                          );
                        })()}
                      </div>

                      {aiSuggestions[index].tips && (
                        <div className="suggestion-tips">
                          <strong>Tips:</strong>
                          <ul>
                          {Object.entries(aiSuggestions[index].tips).map(([key, tip], i) => (
                            <li key={i}>
                              <strong>{key}:</strong> {tip}
                            </li>
                          ))}

                          </ul>
                        </div>
                      )}
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
