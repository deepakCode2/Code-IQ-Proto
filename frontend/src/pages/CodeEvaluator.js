import React, { useState, useRef, useEffect, useCallback, lazy, Suspense } from "react";
import axios from "axios";
import {
  Button,
  Typography,
  Switch,
  CircularProgress,
  MenuItem,
  Select,
  Snackbar,
  Alert,
} from "@mui/material";
import { FaCode, FaBrain, FaRedoAlt, FaSun, FaMoon } from "react-icons/fa";
import { oneDark } from "@codemirror/theme-one-dark";
import "../styles/CodeEvaluator.css";
import { Tooltip } from "@mui/material";
import { python } from "@codemirror/lang-python";
import { javascript } from "@codemirror/lang-javascript";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";

const CodeMirror = lazy(() => import("@uiw/react-codemirror"));

const API_URL = process.env.REACT_APP_BACKEND_URL || "http://localhost:8000/analyze";

const languageOptions = [
  { label: "Python", value: "python" },
  { label: "JavaScript", value: "javascript" },
  { label: "Java", value: "java" },
  { label: "C++", value: "cpp" },
];

const languageExtensions = {
  python: python(),
  javascript: javascript(),
  java: java(),
  cpp: cpp(),
};

const CodeEvaluator = () => {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem("darkMode") === "true");
  const [language, setLanguage] = useState("");
  const [alertOpen, setAlertOpen] = useState(false);
  const reportRef = useRef(null);

  const handleAnalyze = useCallback(async () => {
    if (!code.trim()) {
      setAlertOpen(true);
      return;
    }
    setLoading(true);
    setAnalysisResult(null);

    try {
      const response = await axios.post(API_URL, { code, language });
      setAnalysisResult(response.data);
    } catch (error) {
      console.error("Error analyzing code:", error);
      setAnalysisResult({ error: "Failed to analyze code." });
    } finally {
      setLoading(false);
    }
  }, [code, language]);

  useEffect(() => {
    if (analysisResult && reportRef.current) {
      reportRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [analysisResult]);

  useEffect(() => {
    document.body.className = darkMode ? "dark-theme" : "light-theme";
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  useEffect(() => {
  const handleKeyDown = (event) => {
    if ((event.ctrlKey || event.metaKey) && event.key === "Enter") {
      event.preventDefault(); // Prevent new line
      event.stopPropagation(); // Stop event from propagating to CodeMirror
      handleAnalyze();
    }
  };

  const editorElement = document.querySelector(".cm-editor"); // Select CodeMirror editor
  if (editorElement) {
    editorElement.addEventListener("keydown", handleKeyDown);
  }

  return () => {
    if (editorElement) {
      editorElement.removeEventListener("keydown", handleKeyDown);
    }
  };
}, [handleAnalyze]);

  const handleReset = () => {
    setCode("");
    setAnalysisResult(null);
  };
<Tooltip title="Shortcut: Cmd + Enter (Mac) / Ctrl + Enter (Windows)" arrow>
  <span>
    <Button className="analyze-button" onClick={handleAnalyze} disabled={loading}>
      {loading ? (
        <CircularProgress size={20} style={{ color: "white" }} />
      ) : (
        <>
          <FaBrain className="reset-icon" />
          <span>Analyze Code</span>
        </>
      )}
    </Button>
  </span>
</Tooltip>
  const handleCodeChange = (value) => {
    if (!language) {
      setAlertOpen(true);
      return;
    }
    setCode(value);
  };

  return (
    <div className={`container ${darkMode ? "dark-theme" : "light-theme"}`}>
      <div className="theme-toggle">
        <FaSun className={`theme-icon ${!darkMode ? "rotate" : ""}`} />
        <Switch checked={darkMode} onChange={() => setDarkMode(!darkMode)} color="default" />
        <FaMoon className={`theme-icon ${darkMode ? "rotate" : ""}`} />
      </div>

      <Typography variant="h5" className="title">
        <FaCode style={{ marginRight: "8px" }} />
        CodeIQ Evaluator
      </Typography>

      <div className="editor-container">
        <div className="language-selector" style={{ position: "absolute", top: "8px", left: "8px", zIndex: 10 }}>
          <Select
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            variant="outlined"
            size="small"
            displayEmpty
            className="language-dropdown"
            style={{
              fontSize: "0.85rem",
              padding: "3px 8px",
              borderRadius: "8px",
              background: darkMode ? "#333" : "white",
              color: darkMode ? "white" : "black",
            }}
          >
            <MenuItem value="" disabled>
              Select Language
            </MenuItem>
            {languageOptions.map((lang) => (
              <MenuItem key={lang.value} value={lang.value}>
                {lang.label}
              </MenuItem>
            ))}
          </Select>
        </div>

        <Suspense fallback={<div>Loading Editor...</div>}>
          <CodeMirror
            value={code}
            extensions={language ? [languageExtensions[language]] : []}
            onChange={handleCodeChange}
            placeholder={language ? "// Write or paste your code here to be analyzed" : "// Select a language first"}
            theme={darkMode ? oneDark : "light"}
            readOnly={!language}
          />
        </Suspense>
      </div>

      <div className="button-container">
        <Button className="reset-button" onClick={handleReset}>
          <FaRedoAlt className="reset-icon" />
          <span>Reset</span>
        </Button>
        
        <Tooltip title="Shortcut: Cmd + Enter (Mac) / Ctrl + Enter (Windows)" arrow>
          <span>
            <Button className="analyze-button" onClick={handleAnalyze} disabled={loading}>
              {loading ? <CircularProgress size={20} style={{ color: "white" }} /> : 
                <>
                  <FaBrain className="reset-icon" />
                  <span>Analyze Code</span>
                </>
              }
            </Button>
          </span>
        </Tooltip>
      </div>


      {analysisResult && (
        <div className="analysis-container" ref={reportRef}>
          <Typography variant="h6">Analysis Report</Typography>
          <pre>{JSON.stringify(analysisResult, null, 2)}</pre>
        </div>
      )}

      <Snackbar open={alertOpen} autoHideDuration={3000} onClose={() => setAlertOpen(false)}>
        <Alert onClose={() => setAlertOpen(false)} severity="warning" sx={{ width: '100%' }}>
          Please select a language first!
        </Alert>
      </Snackbar>
    </div>
  );
};

export default CodeEvaluator;
