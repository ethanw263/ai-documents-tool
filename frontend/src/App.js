// App.js
import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import HomePage from "./pages/HomePage";
import PreviewPage from "./pages/PreviewPage"; // your original Preview for uploaded docs
import PreviewEdited from "./pages/PreviewEdited"; // new one for edited contract

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/preview" element={<PreviewPage />} /> {/* Preview original upload */}
        <Route path="/preview-edited" element={<PreviewEdited />} /> {/* Preview edited clauses */}
      </Routes>
    </Router>
  );
}
