"use client";

import { useState, useEffect, useRef } from "react";
import TemplateEditor, { ReportTemplate } from "./TemplateEditor";
import OutputReport from "./OutputReport";
import Button from "./Button";
import Textarea from "./Textarea";
import { parseUpdatePoints, scanInfoPlaceholders, generateReport } from "../utils/reportParser";

const DEFAULT_TEMPLATES: ReportTemplate[] = [
  {
    id: "client-chat",
    name: "Client Chat Update",
    templateText: "Today’s Work Summary ({{date:DD MMM YYYY}})\n\n{{info:Ticket ID}}\n\n{{points:➤}}\n\nSigning off for the Day!",
    bulletPrefix: "➤",
    isActive: true,
  },
  {
    id: "pm-timesheet",
    name: "PM Timesheet / Jira",
    templateText: "{{info:Ticket ID}}\n\n{{points:-}}",
    bulletPrefix: "-",
    isActive: true,
  }
];

const DEFAULT_INPUT = `- Completed implementation of the user onboarding flow
- Fixed UI layout alignments on the settings dashboard
- Participated in the team sync meeting to discuss sprint goals
- Researched performance optimizations for databases
- Documented API endpoints for the new services`;

export default function ReportWriter() {
  const [isMounted, setIsMounted] = useState(false);
  const [rawInput, setRawInput] = useState(DEFAULT_INPUT);
  const [templates, setTemplates] = useState<ReportTemplate[]>(DEFAULT_TEMPLATES);
  const [infoValues, setInfoValues] = useState<Record<string, string>>({
    "Ticket ID": "JIRA-123",
  });
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  // Custom points numbering settings
  const [listStyle, setListStyle] = useState<"bullet" | "numbered">("bullet");
  const [numberBaseInput, setNumberBaseInput] = useState<string>("10");
  const [numberBase, setNumberBase] = useState<number>(10);
  const [baseError, setBaseError] = useState<string | null>(null);

  // Track manual edits made to generated reports
  const [editedReports, setEditedReports] = useState<Record<string, string>>({});

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Navigation states
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const handleClearInput = () => {
    setRawInput("");
    handleRegenerateAll();
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  // Input Validation Logic
  const validateInput = (value: string): { isValid: boolean; errorType: "empty" | "not_a_number" | "out_of_range" | null } => {
    const trimmed = value.trim();
    if (!trimmed) {
      return { isValid: false, errorType: "empty" };
    }
    const baseNum = Number(trimmed);
    if (isNaN(baseNum)) {
      return { isValid: false, errorType: "not_a_number" };
    }
    if (!Number.isInteger(baseNum) || baseNum < 2 || baseNum > 36) {
      return { isValid: false, errorType: "out_of_range" };
    }
    return { isValid: true, errorType: null };
  };

  const handleBaseChange = (value: string) => {
    setNumberBaseInput(value);
    const validation = validateInput(value);
    
    if (validation.isValid) {
      setBaseError(null);
      setNumberBase(Number(value.trim()));
      handleRegenerateAll(); // reset overrides
    } else {
      if (validation.errorType === "empty") {
        setBaseError("Base cannot be empty. Please enter an integer between 2 and 36.");
      } else if (validation.errorType === "not_a_number") {
        setBaseError("Base must be a valid integer numeric value.");
      } else if (validation.errorType === "out_of_range") {
        setBaseError("Base must be a whole integer between 2 and 36.");
      }
    }
  };

  // Hydration fix & load from local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedInput = localStorage.getItem("rw_raw_input");
      const savedTemplates = localStorage.getItem("rw_templates");
      const savedInfo = localStorage.getItem("rw_info_values");
      const savedListStyle = localStorage.getItem("rw_list_style");
      const savedNumberBase = localStorage.getItem("rw_number_base");
      
      if (savedInput) setRawInput(savedInput);
      if (savedTemplates) {
        try {
          setTemplates(JSON.parse(savedTemplates));
        } catch (e) {
          console.error("Error parsing saved templates", e);
        }
      }
      if (savedInfo) {
        try {
          setInfoValues(JSON.parse(savedInfo));
        } catch (e) {
          console.error("Error parsing saved info values", e);
        }
      }
      if (savedListStyle === "bullet" || savedListStyle === "numbered") {
        setListStyle(savedListStyle as "bullet" | "numbered");
      }
      if (savedNumberBase) {
        setNumberBaseInput(savedNumberBase);
        const baseNum = Number(savedNumberBase);
        if (!isNaN(baseNum) && Number.isInteger(baseNum) && baseNum >= 2 && baseNum <= 36) {
          setNumberBase(baseNum);
        }
      }
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Save changes to localStorage
  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("rw_raw_input", rawInput);
  }, [rawInput, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("rw_templates", JSON.stringify(templates));
  }, [templates, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("rw_info_values", JSON.stringify(infoValues));
  }, [infoValues, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("rw_list_style", listStyle);
  }, [listStyle, isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    localStorage.setItem("rw_number_base", numberBaseInput);
  }, [numberBaseInput, isMounted]);

  // Clean points from raw text
  const cleanPoints = parseUpdatePoints(rawInput);

  // Scan all active templates for info placeholders
  const activeTemplates = templates.filter((t) => t.isActive);
  const detectedInfoKeys = Array.from(
    new Set(
      activeTemplates.flatMap((t) => scanInfoPlaceholders(t.templateText))
    )
  );

  // Handle updates to info keys
  const handleInfoChange = (key: string, value: string) => {
    setInfoValues((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  // Convert HTML input date to Date object
  const dateObj = reportDate ? new Date(reportDate + "T12:00:00") : new Date();

  // Generate output texts
  const reports: Record<string, string> = {};
  activeTemplates.forEach((t) => {
    // If the user modified the report output text manually, use that text,
    // otherwise generate it dynamically.
    if (editedReports[t.id] !== undefined) {
      reports[t.id] = editedReports[t.id];
    } else {
      reports[t.id] = generateReport({
        templateStr: t.templateText,
        points: cleanPoints,
        infoValues,
        bulletPrefix: t.bulletPrefix,
        dateObj,
        listStyle,
        numberBase,
      });
    }
  });

  // Regenerate all reports (clearing manual overrides)
  const handleRegenerateAll = () => {
    setEditedReports({});
  };

  if (!isMounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-muted">
        <div className="flex flex-col items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm font-medium">Loading workspace...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 py-8 md:py-12 flex flex-col gap-8">
      {/* Premium Header */}
      <header className="flex items-center justify-between border-b border-card-border pb-6">
        {/* Logo & App Title */}
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-sm shadow-md transition-transform hover:scale-105 duration-200">
            ⚡
          </div>
          <div className="flex flex-col">
            <h1 className="text-xl font-extrabold tracking-tight bg-linear-to-r from-foreground via-foreground/90 to-muted bg-clip-text text-transparent sm:text-2xl">
              Report Writer
            </h1>
            <p className="hidden sm:block text-3xs text-muted font-medium mt-0.5">
              Transform status points into ready-to-share updates in seconds.
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-6">
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="text-xs font-semibold text-foreground/80 hover:text-accent transition-colors duration-200 cursor-pointer relative after:absolute after:bottom-[-22px] after:left-0 after:right-0 after:h-[2px] after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
          >
            Writer
          </button>
          <button
            onClick={() => document.getElementById("templates-section")?.scrollIntoView({ behavior: "smooth" })}
            className="text-xs font-semibold text-foreground/80 hover:text-accent transition-colors duration-200 cursor-pointer relative after:absolute after:bottom-[-22px] after:left-0 after:right-0 after:h-[2px] after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
          >
            Templates
          </button>
          <button
            onClick={() => setIsHelpOpen(true)}
            className="text-xs font-semibold text-foreground/80 hover:text-accent transition-colors duration-200 cursor-pointer relative after:absolute after:bottom-[-22px] after:left-0 after:right-0 after:h-[2px] after:bg-accent after:scale-x-0 hover:after:scale-x-100 after:transition-transform after:duration-200"
          >
            User Guide
          </button>
        </nav>

        {/* Controls Container */}
        <div className="flex items-center gap-2.5">
          {/* Date Control */}
          <div className="flex items-center gap-2 bg-card-bg border border-card-border rounded-xl px-3 py-1.5 shadow-xs">
            <svg className="h-3.5 w-3.5 text-muted shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-muted leading-tight">Date</span>
              <input
                type="date"
                value={reportDate}
                onChange={(e) => {
                  setReportDate(e.target.value);
                  handleRegenerateAll(); // reset overrides when date changes
                }}
                className="text-[11px] font-bold bg-transparent border-none outline-none text-foreground p-0 cursor-pointer w-24"
              />
            </div>
          </div>

          {/* Hamburger Menu Button (mobile only) */}
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="flex md:hidden items-center justify-center p-2 rounded-xl border border-card-border bg-card-bg text-foreground hover:bg-muted-bg transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-accent/20"
            aria-label="Open navigation menu"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Section: Inputs & Metadata */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Raw Points Editor */}
          <div className="rounded-2xl border border-card-border bg-card-bg p-5 shadow-sm">
            <div className="flex items-center justify-between mb-3 border-b border-card-border/50 pb-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">Update Points Input</span>
              <div className="flex items-center gap-2.5">
                <span className="text-2xs text-muted">{cleanPoints.length} points detected</span>
                {rawInput && (
                  <>
                    <span className="h-3 w-px bg-card-border/50" />
                    <Button
                      onClick={handleClearInput}
                      className="text-xs font-medium text-muted hover:text-red-400 transition-colors flex items-center gap-1 focus:outline-none cursor-pointer"
                      title="Clear points and focus textarea"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Clear
                    </Button>
                  </>
                )}
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              value={rawInput}
              onChange={(e) => {
                setRawInput(e.target.value);
                handleRegenerateAll(); // reset manual edits when points list changes
              }}
              className="h-64"
              placeholder="Enter your points here..."
            />
            <div className="mt-2 text-3xs text-muted flex items-center gap-1">
              <span>💡 Bullets and lists are automatically formatted based on active templates.</span>
            </div>
          </div>

          {/* List Formatting Options Panel */}
          <div className="rounded-2xl border border-card-border bg-card-bg p-5 shadow-sm transition-all duration-300">
            <div className="flex items-center justify-between mb-3 border-b border-card-border/50 pb-2">
              <span className="text-sm font-semibold tracking-tight text-foreground">List Formatting Options</span>
            </div>
            <div className="flex flex-col gap-4">
              {/* Toggle Style */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-foreground/80">List Style</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setListStyle("bullet");
                      handleRegenerateAll();
                    }}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer transition-all duration-200 ${
                      listStyle === "bullet"
                        ? "bg-accent/10 border-accent/30 text-accent font-bold"
                        : "bg-background border-card-border text-muted hover:text-foreground"
                    }`}
                  >
                    Bullet Points
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setListStyle("numbered");
                      handleRegenerateAll();
                    }}
                    className={`flex-1 py-2 px-3 text-xs font-semibold rounded-lg border cursor-pointer transition-all duration-200 ${
                      listStyle === "numbered"
                        ? "bg-accent/10 border-accent/30 text-accent font-bold"
                        : "bg-background border-card-border text-muted hover:text-foreground"
                    }`}
                  >
                    Numbered List
                  </button>
                </div>
              </div>

              {/* Number Base Selector */}
              <div className="flex flex-col gap-1.5">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground/80">Number Base</label>
                  {listStyle !== "numbered" && (
                    <span className="text-3xs text-muted font-normal">(Enable Numbered List to apply)</span>
                  )}
                </div>
                <input
                  type="text"
                  value={numberBaseInput}
                  onChange={(e) => handleBaseChange(e.target.value)}
                  placeholder="e.g. 10 (decimal), 16 (hex), 2 (binary)"
                  disabled={listStyle !== "numbered"}
                  className={`w-full rounded-lg border px-3.5 py-2 text-sm outline-none transition-all duration-200 ${
                    listStyle !== "numbered"
                      ? "border-card-border/50 bg-background/50 text-muted/60 cursor-not-allowed"
                      : baseError
                        ? "border-red-500/80 bg-red-500/5 focus:border-red-500 text-foreground"
                        : "border-card-border bg-background focus:border-accent text-foreground"
                  }`}
                />
                
                {/* Conditional User-facing Error Feedback */}
                {listStyle === "numbered" && baseError && (
                  <div className="flex items-start gap-1.5 text-2xs text-red-500 font-medium mt-1 transition-all duration-300">
                    <svg className="h-3.5 w-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span>{baseError}</span>
                  </div>
                )}
                
                {listStyle === "numbered" && !baseError && (
                  <span className="text-3xs text-muted mt-1 leading-normal transition-all duration-200">
                    Preview numbering: {
                      cleanPoints.length > 0
                        ? Array.from({ length: Math.min(cleanPoints.length, 3) })
                            .map((_, i) => `${(i + 1).toString(numberBase)}.`)
                            .join(", ") + (cleanPoints.length > 3 ? ", ..." : "")
                        : `1. (base ${numberBase})`
                    }
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Dynamic Placeholders / Metadata Panel */}
          {detectedInfoKeys.length > 0 && (
            <div className="rounded-2xl border border-card-border bg-card-bg p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3 border-b border-card-border/50 pb-2">
                <span className="text-sm font-semibold tracking-tight text-foreground">Add Additional Information</span>
              </div>
              <div className="flex flex-col gap-4">
                {detectedInfoKeys.map((key) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-foreground/80">{key}</label>
                    <input
                      type="text"
                      value={infoValues[key] || ""}
                      onChange={(e) => {
                        handleInfoChange(key, e.target.value);
                        handleRegenerateAll(); // reset overrides
                      }}
                      placeholder={`Enter ${key}`}
                      className="w-full rounded-lg border border-card-border bg-background px-3.5 py-2 text-sm outline-none focus:border-accent"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Section: Generated Outputs */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted">Generated Reports</h3>
            {Object.keys(editedReports).length > 0 && (
              <Button
                onClick={handleRegenerateAll}
                className="text-xs font-semibold text-accent hover:underline flex items-center gap-1"
              >
                <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18" />
                </svg>
                Reset Custom Edits
              </Button>
            )}
          </div>

          {activeTemplates.length > 0 ? (
            <div className="grid grid-cols-1 gap-6">
              {activeTemplates.map((t) => (
                <OutputReport
                  key={t.id}
                  title={t.name}
                  generatedText={reports[t.id] || ""}
                  onTextChange={(newText) => {
                    setEditedReports((prev) => ({
                      ...prev,
                      [t.id]: newText,
                    }));
                  }}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-card-border rounded-2xl text-center bg-card-bg/50">
              <svg className="h-10 w-10 text-muted mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <h4 className="text-sm font-semibold mb-1">No Active Templates</h4>
              <p className="text-xs text-muted max-w-xs">
                Activate templates in the section below to generate reports.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Template Management (Bottom section) */}
      <section id="templates-section" className="mt-4 scroll-mt-8">
        <TemplateEditor templates={templates} onChange={setTemplates} />
      </section>

      {/* Mobile Glassmorphic Navigation Menu Drawer */}
      <div 
        className={`fixed inset-0 z-50 transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Backdrop overlay */}
        <div 
          className="absolute inset-0 bg-black/60 backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
        
        {/* Sliding menu panel */}
        <div 
          className={`absolute top-0 right-0 bottom-0 w-72 max-w-[80vw] bg-card-bg/85 backdrop-blur-lg border-l border-card-border p-6 shadow-2xl flex flex-col gap-6 transition-transform duration-300 transform ${
            isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-card-border/50">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-sm">
                ⚡
              </div>
              <span className="font-extrabold text-sm tracking-tight text-foreground">Menu</span>
            </div>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer focus:outline-none"
              aria-label="Close menu"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          {/* Navigation Links */}
          <nav className="flex flex-col gap-2">
            <button
              onClick={() => {
                window.scrollTo({ top: 0, behavior: "smooth" });
                setIsMobileMenuOpen(false);
              }}
              className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:text-accent hover:bg-accent/5 transition-all duration-200 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
              Writer Dashboard
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setTimeout(() => {
                  document.getElementById("templates-section")?.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }}
              className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:text-accent hover:bg-accent/5 transition-all duration-200 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              Report Templates
            </button>
            <button
              onClick={() => {
                setIsMobileMenuOpen(false);
                setIsHelpOpen(true);
              }}
              className="flex items-center gap-3 w-full text-left px-3.5 py-2.5 rounded-xl text-sm font-semibold text-foreground/80 hover:text-accent hover:bg-accent/5 transition-all duration-200 cursor-pointer"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
              User Guide
            </button>
          </nav>
          
          {/* Footer Info inside Menu */}
          <div className="mt-auto pt-4 border-t border-card-border/50">
            <div className="text-3xs text-muted flex flex-col gap-1">
              <span>Report Writer v0.1.0</span>
              <span>Fast & clean status reporting.</span>
            </div>
          </div>
        </div>
      </div>

      {/* Glassmorphic User Guide Help Modal */}
      {isHelpOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop-fade">
          {/* Backdrop overlay */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-xs cursor-pointer"
            onClick={() => setIsHelpOpen(false)}
          />
          
          {/* Modal box */}
          <div className="relative w-full max-w-xl transform overflow-hidden rounded-2xl border border-card-border bg-card-bg/95 backdrop-blur-md p-6 shadow-2xl animate-modal-scale-up max-h-[85vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-card-border mb-5">
              <div className="flex items-center gap-2.5">
                <div className="h-8 w-8 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-bold text-sm">
                  📚
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-foreground">User Guide & Reference</h3>
                  <p className="text-3xs text-muted font-medium">How to make the most of Report Writer</p>
                </div>
              </div>
              <button
                onClick={() => setIsHelpOpen(false)}
                className="p-1.5 rounded-lg text-muted hover:text-foreground hover:bg-muted-bg transition-colors cursor-pointer"
                aria-label="Close manual"
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Content */}
            <div className="flex flex-col gap-6 text-xs text-foreground/90">
              
              {/* Dynamic Placeholders */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">1. Dynamic Placeholders</h4>
                <p className="text-muted mb-3 leading-relaxed">
                  Use placeholders in your templates to automatically fill in date, custom strings, or parsed list items.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="border border-card-border/60 bg-background/50 rounded-xl p-3 flex flex-col gap-1">
                    <code className="text-accent font-bold text-2xs">{"{{points}}"}</code>
                    <span className="font-bold text-3xs text-muted">BULLETS PLACEHOLDER</span>
                    <span className="text-3xs text-muted-foreground leading-normal">
                      Inserts the cleaned update points. You can also specify an inline prefix like <code className="bg-muted-bg px-0.5 rounded text-[10px]">{"{{points:➤}}"}</code>.
                    </span>
                  </div>
                  <div className="border border-card-border/60 bg-background/50 rounded-xl p-3 flex flex-col gap-1">
                    <code className="text-accent font-bold text-2xs">{"{{date:FORMAT}}"}</code>
                    <span className="font-bold text-3xs text-muted">DATE FORMATTER</span>
                    <span className="text-3xs text-muted-foreground leading-normal">
                      Formats the reporting date. Supports <code className="bg-muted-bg px-0.5 rounded text-[10px]">YYYY</code>, <code className="bg-muted-bg px-0.5 rounded text-[10px]">MM</code>, <code className="bg-muted-bg px-0.5 rounded text-[10px]">DD</code>, <code className="bg-muted-bg px-0.5 rounded text-[10px]">MMM</code>.
                    </span>
                  </div>
                  <div className="border border-card-border/60 bg-background/50 rounded-xl p-3 flex flex-col gap-1">
                    <code className="text-accent font-bold text-2xs">{"{{info:Label}}"}</code>
                    <span className="font-bold text-3xs text-muted">DYNAMIC FIELDS</span>
                    <span className="text-3xs text-muted-foreground leading-normal">
                      Generates a dynamic text input field. E.g., <code className="bg-muted-bg px-0.5 rounded text-[10px]">{"{{info:Ticket ID}}"}</code> asks for Jira details.
                    </span>
                  </div>
                </div>
              </div>

              {/* Number Base lists */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">2. Advanced Number Bases</h4>
                <p className="text-muted leading-relaxed mb-2.5">
                  When choosing the <strong>Numbered List</strong> style, you can configure numbers in any integer base between <strong>2 and 36</strong>:
                </p>
                <table className="w-full text-left border-collapse border border-card-border rounded-lg overflow-hidden">
                  <thead>
                    <tr className="bg-muted-bg text-3xs uppercase tracking-wider text-muted font-bold">
                      <th className="p-2 border-b border-card-border">Base</th>
                      <th className="p-2 border-b border-card-border">System</th>
                      <th className="p-2 border-b border-card-border">Sample Output</th>
                    </tr>
                  </thead>
                  <tbody className="text-3xs">
                    <tr>
                      <td className="p-2 border-b border-card-border font-mono">10</td>
                      <td className="p-2 border-b border-card-border">Decimal</td>
                      <td className="p-2 border-b border-card-border font-mono text-muted">1. 2. 3. ... 10. 11.</td>
                    </tr>
                    <tr className="bg-muted-bg/30">
                      <td className="p-2 border-b border-card-border font-mono">16</td>
                      <td className="p-2 border-b border-card-border">Hexadecimal</td>
                      <td className="p-2 border-b border-card-border font-mono text-muted">1. ... 9. a. b. ... f. 10. 11.</td>
                    </tr>
                    <tr>
                      <td className="p-2 border-b border-card-border font-mono">2</td>
                      <td className="p-2 border-b border-card-border">Binary</td>
                      <td className="p-2 border-b border-card-border font-mono text-muted">1. 10. 11. 100. 101.</td>
                    </tr>
                    <tr className="bg-muted-bg/30">
                      <td className="p-2 border-b border-card-border font-mono">8</td>
                      <td className="p-2 border-b border-card-border">Octal</td>
                      <td className="p-2 border-b border-card-border font-mono text-muted">1. 2. ... 7. 10. 11.</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* Editing & Saving */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-accent mb-2">3. Pro Tips</h4>
                <ul className="list-disc pl-4 flex flex-col gap-1 text-3xs text-muted-foreground leading-normal">
                  <li><strong>Manual Editing:</strong> You can edit any generated output directly in its card! Click <em>Reset Custom Edits</em> to discard overrides.</li>
                  <li><strong>Local Storage:</strong> Your templates, text inputs, date, base settings, and fields are automatically saved in your browser and restored on reload.</li>
                  <li><strong>Custom Bullet Prefixes:</strong> You can configure template-specific prefixes (like <code className="font-mono bg-muted-bg px-0.5 rounded">-</code>, <code className="font-mono bg-muted-bg px-0.5 rounded">➤</code>, <code className="font-mono bg-muted-bg px-0.5 rounded">•</code>) in the Template Editor.</li>
                </ul>
              </div>

            </div>
            
            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-card-border flex justify-end">
              <Button
                onClick={() => setIsHelpOpen(false)}
                className="bg-accent text-accent-foreground px-4 py-2 rounded-xl text-xs font-semibold hover:opacity-90 shadow-sm cursor-pointer"
              >
                Got it, thanks!
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
