import React, { useState } from "react";
import "./App.css";
import Navbar from "./NavBar";
import axios from "axios";
import { CircularProgress } from "@mui/material";
import { FiCopy } from "react-icons/fi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function App() {
  const [emailContent, setEmailContent] = useState("");
  const [tone, setTone] = useState("");
  const [generatedReply, setGeneratedReply] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    setLoading(true);
    setError("");
    setGeneratedReply("");
    try {
      const response = await axios.post(
        "http://localhost:8080/api/email/generate",
        {
          emailContent,
          tone,

        }
      );
      setGeneratedReply(
        typeof response.data === "string"
          ? response.data
          : JSON.stringify(response.data, null, 2)
      );
    } catch (err) {
      setError("Failed to generate message reply. Please try again.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(generatedReply);
      toast.success("Copied to clipboard");
    } catch {
      toast.error("Copy failed");
    }
  };


  return (
    <>
      <Navbar />
      <div className="container">
        <h3 className="title">
          AI Reply generator <span className="brand">TextMate</span>
        </h3>
        <p className="subtitle">
          Paste the original message and choose a tone — AI will draft a reply.
        </p>

        <div className="inputBox">
          <textarea
            value={emailContent}
            onChange={(e) => setEmailContent(e.target.value)}
            placeholder="Paste the original message here..."
            aria-label="Original message content"
          />
        </div>
        <div className="controls">
          <select
            value={tone}
            onChange={(e) => setTone(e.target.value)}
            className="select"
            aria-label="tone"
          >
            <option value="">Tone (optional)</option>
            <option value="professional">Professional</option>
            <option value="casual">Casual</option>
            <option value="friendly">Friendly</option>
          </select>

          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={!emailContent || loading}
            aria-label="Generate reply"
          >
            {loading ? (
              <CircularProgress size={18} thickness={5} />
            ) : (
              "Generate Reply"
            )}
          </button>
        </div>

        {error && <div className="error">{error}</div>}
        {generatedReply && (
          <div className="previewBox">
            <div className="header">
              <h4>Generated Reply</h4>
              <div className="header-actions">
                <button
                  className="icon-btn"
                  onClick={handleCopy}
                  title="Copy to clipboard"
                >
                  <FiCopy />
                </button>
              </div>
            </div>

            <textarea
              className="previewArea"
              readOnly
              value={generatedReply}
              aria-label="generated reply"
            />
          </div>
        )}

        <section className="videosSection" aria-labelledby="videos-heading">
          <h3 id="videos-heading" className="videosHeading">Preview of Browser Extention:</h3>


          <section className="videoSectionSingle" aria-labelledby="gmail-heading">
            <h4 id="gmail-heading" className="videoTitle">Gmail</h4>
            <div className="videoWrap">
              <video
                controls
                playsInline
                preload="metadata"
                aria-label="Gmail output preview"
              >
                <source src="/videos/gmail.mp4" type="video/mp4" />
              </video>
            </div>
          </section>

          <section className="videoSectionSingle" aria-labelledby="slack-heading">
            <h4 id="slack-heading" className="videoTitle">Slack</h4>
            <div className="videoWrap">
              <video
                controls
                playsInline
                preload="metadata"
                aria-label="Slack output preview"
              >
                <source src="/videos/slack.mp4" type="video/mp4" />
              </video>
            </div>
          </section>


          <section className="videoSectionSingle" aria-labelledby="linkedin-heading">
            <h4 id="linkedin-heading" className="videoTitle">Linkedin</h4>
            <div className="videoWrap">
              <video
                controls
                playsInline
                preload="metadata"
                aria-label="LinkedIn output preview"
              >
                <source src="/videos/linkedin.mp4" type="video/mp4" />
              </video>
            </div>
          </section>
        </section>

        <ToastContainer position="bottom-right" />
      </div>
    </>
  );
}

export default App;
