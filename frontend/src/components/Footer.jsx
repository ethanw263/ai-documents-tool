// components/Footer.jsx
import React from "react";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      © {new Date().getFullYear()} ClauseIQ — All rights reserved.
    </footer>
  );
}
