import React from "react";
import { useUpload } from "../contexts/UploadContext";
import { useNavigate } from "react-router-dom";

export default function PreviewPage() {
  const { file, text } = useUpload();
  const navigate = useNavigate();

  const fileURL = file ? URL.createObjectURL(file) : null;

  return (
    <div className="page-container">
      <nav className="nav-bar">
        <div className="nav-content">
          <h1 className="nav-title">ClauseIQ</h1>
          <button onClick={() => navigate("/")} className="button-back">
            🔙 Back to Extractor
          </button>
        </div>
      </nav>

      <section className="preview-section">
        <div className="max-w-6xl mx-auto p-6 space-y-8">
          <h2 className="text-3xl font-bold text-gray-800 text-center">📄 Document Preview</h2>

          {file ? (
            <iframe
                src={fileURL}
                title="PDF Preview"
                style={{
                width: "100%",
                height: "90vh",
                border: "1px solid #ccc",
                borderRadius: "8px",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                }}
            />
            ) : text ? (
            <div className="bg-white p-6 border rounded-lg shadow-md text-gray-800 whitespace-pre-wrap">
                {text}
            </div>
            ) : (
            <p className="text-center text-gray-500">No document uploaded yet.</p>
            )}
        </div>
      </section>
    </div>
  );
}
