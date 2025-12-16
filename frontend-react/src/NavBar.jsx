import React, { useState, useRef, useEffect } from "react";
import { FiChevronDown } from "react-icons/fi";

const Navbar = ({ generatedReply }) => {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);
  const openTimer = useRef(null);
  const closeTimer = useRef(null);

  //open and close helpers
  const doOpen = () => {
    clearTimeout(closeTimer.current);
    clearTimeout(openTimer.current);
    setOpen(true);
  };
  const doClose = () => {
    clearTimeout(openTimer.current);
    clearTimeout(closeTimer.current);
    setOpen(false);
  };
  const handleEnter = () => {
    clearTimeout(closeTimer.current);
    openTimer.current = setTimeout(() => setOpen(true), 80);
  };


  const handleLeave = () => {
    clearTimeout(openTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), 170);
  };
  const handleKeyDown = (e) => {
    if (e.key === "Escape") {
      doClose();
      
      if (wrapperRef.current) {
        const btn = wrapperRef.current.querySelector(".try-in-btn");
        btn?.focus();
      }
    }
  };

  useEffect(() => {
    return () => {
      clearTimeout(openTimer.current);
      clearTimeout(closeTimer.current);
    };
  }, []);

  const handleTryIn = (site) => {
    let url = "/";
    if (site === "gmail") url = "https://mail.google.com/";
    else if (site === "linkedin") url = "https://www.linkedin.com/";
    else if (site === "slack") url = "https://slack.com/";
    window.open(url, "_blank", "noopener,noreferrer");
    doClose();
  };

  const handleBlur = (e) => {
    const related = e.relatedTarget;
    if (!related || (wrapperRef.current && !wrapperRef.current.contains(related))) {
      closeTimer.current = setTimeout(() => setOpen(false), 120);
    }
  };

  return (
    <div className="nav flex items-center justify-between px-[40px] h-[70px]">
      <div className="logo">
        <h3 className="brand">TextMate - AI Browser Extention</h3>
      </div>

      <div className="nav-right flex items-center gap-[12px]">
        <div
          ref={wrapperRef}
          className="try-in-wrapper"
          onMouseEnter={handleEnter}
          onMouseLeave={handleLeave}
          onFocus={doOpen}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          tabIndex={0} 
        >
          <button
            className="try-in-btn"
            aria-haspopup="true"
            aria-expanded={open}
            onClick={() => (open ? doClose() : doOpen())}
            title="Try generated reply in external services"
            type="button"
          >
            Try in <FiChevronDown />
          </button>

          {open && (
            <div
              className="try-in-menu"
              role="menu"
              onMouseEnter={handleEnter}
              onMouseLeave={handleLeave}
            >
              <button
                className="try-item"
                role="menuitem"
                onClick={() => handleTryIn("linkedin")}
              >
                LinkedIn
              </button>

              <button
                className="try-item"
                role="menuitem"
                onClick={() => handleTryIn("slack")}
              >
                Slack
              </button>

              <button
                className="try-item"
                role="menuitem"
                onClick={() => handleTryIn("gmail")}
              >
                Gmail
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;
