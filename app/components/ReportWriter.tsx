"use client";

import React, { useState, useEffect } from "react";
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

const DEFAULT_INPUT = `- Learned and implement react native layout and stack
- Learn about react native expo status bar
- Learn how navigation works in react native with Link component
- Refer convex database documentation
- Learn about ACID database`;

export default function ReportWriter() {
  const [isMounted, setIsMounted] = useState(false);
  const [rawInput, setRawInput] = useState(DEFAULT_INPUT);
  const [templates, setTemplates] = useState<ReportTemplate[]>(DEFAULT_TEMPLATES);
  const [infoValues, setInfoValues] = useState<Record<string, string>>({
    "Ticket ID": "SVMAPP-546",
  });
  const [reportDate, setReportDate] = useState<string>(
    new Date().toISOString().split("T")[0]
  );
  
  // Track manual edits made to generated reports
  const [editedReports, setEditedReports] = useState<Record<string, string>>({});

  // Hydration fix & load from local storage
  useEffect(() => {
    const timer = setTimeout(() => {
      const savedInput = localStorage.getItem("rw_raw_input");
      const savedTemplates = localStorage.getItem("rw_templates");
      const savedInfo = localStorage.getItem("rw_info_values");
      
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
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-b border-card-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="h-6 w-6 rounded-lg bg-linear-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-md">
              ⚡
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight bg-linear-to-r from-foreground via-foreground/90 to-muted bg-clip-text text-transparent">
              Report Writer
            </h1>
          </div>
          <p className="text-xs text-muted">
            Transform status points into ready-to-share updates in seconds.
          </p>
        </div>

        {/* Date Control */}
        <div className="flex items-center gap-3 bg-card-bg border border-card-border rounded-xl px-3.5 py-2 shadow-sm">
          <svg className="h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <div className="flex flex-col">
            <span className="text-3xs uppercase tracking-wider font-bold text-muted">Reporting Date</span>
            <input
              type="date"
              value={reportDate}
              onChange={(e) => {
                setReportDate(e.target.value);
                handleRegenerateAll(); // reset overrides when date changes
              }}
              className="text-xs font-semibold bg-transparent border-none outline-none text-foreground p-0 cursor-pointer"
            />
          </div>
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
              <span className="text-2xs text-muted">{cleanPoints.length} points detected</span>
            </div>
            <Textarea
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
      <section className="mt-4">
        <TemplateEditor templates={templates} onChange={setTemplates} />
      </section>
    </div>
  );
}
