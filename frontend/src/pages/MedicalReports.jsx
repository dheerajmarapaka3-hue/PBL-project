import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../api/client";

const CATEGORIES = ["All", "Lab Report", "Prescription", "Imaging", "Doctor Note", "Vaccination", "Other"];

export default function MedicalReports() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  // Upload modal state
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadFile, setUploadFile] = useState(null);
  const [uploadTitle, setUploadTitle] = useState("");
  const [uploadCategory, setUploadCategory] = useState("Lab Report");
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split("T")[0]);
  const [uploadNotes, setUploadNotes] = useState("");
  const [uploading, setUploading] = useState(false);

  // Detail / preview modal state
  const [activeDoc, setActiveDoc] = useState(null);
  const [docQuestion, setDocQuestion] = useState("");
  const [questionAnswer, setQuestionAnswer] = useState("");
  const [asking, setAsking] = useState(false);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const res = await api.documents.list();
      setDocuments(res.data);
    } catch (err) {
      console.error("Failed to load documents:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleUploadSubmit = async (e) => {
    e.preventDefault();
    if (!uploadFile) {
      alert("Please select a file (PDF or image).");
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", uploadFile);
      formData.append("title", uploadTitle);
      formData.append("category", uploadCategory);
      formData.append("document_date", uploadDate);
      if (uploadNotes) formData.append("notes", uploadNotes);

      await api.documents.upload(formData);
      setShowUploadModal(false);
      setUploadFile(null);
      setUploadTitle("");
      setUploadNotes("");
      fetchDocuments();
    } catch (err) {
      console.error("Upload error:", err);
      alert(err.response?.data?.detail || "Upload failed. Please check file type and size.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this medical report?")) return;
    try {
      await api.documents.delete(id);
      if (activeDoc && activeDoc.id === id) setActiveDoc(null);
      fetchDocuments();
    } catch (err) {
      console.error(err);
    }
  };

  const [downloading, setDownloading] = useState(false);
  const handleDownload = async (doc) => {
    if (!doc) return;
    setDownloading(true);
    try {
      const res = await api.documents.download(doc.id);
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", doc.file_name || `${doc.title}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download document. Please check your session.");
    } finally {
      setDownloading(false);
    }
  };

  const handleAskQuestion = async (e) => {
    e.preventDefault();
    if (!docQuestion.trim() || !activeDoc) return;
    setAsking(true);
    try {
      const res = await api.documents.askQuestion(activeDoc.id, docQuestion);
      setQuestionAnswer(res.data.answer);
    } catch (err) {
      console.error(err);
      setQuestionAnswer("Could not process question. Please try again.");
    } finally {
      setAsking(false);
    }
  };

  const filteredDocs = documents.filter((d) => {
    const matchesCat = selectedCategory === "All" || d.category === selectedCategory;
    const matchesSearch =
      d.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      d.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="flex flex-col gap-6 animate-fadeIn">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-on-surface">Medical Reports & Prescriptions</h1>
          <p className="text-xs text-on-surface-variant">
            Upload diagnostic lab reports, prescriptions, and scans with AI-assisted plain language interpretation.
          </p>
        </div>

        <button
          onClick={() => setShowUploadModal(true)}
          className="px-5 py-2.5 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold shadow-md active:scale-95 transition-all flex items-center gap-1.5 self-start sm:self-auto"
        >
          <span className="material-symbols-outlined text-[18px]">upload_file</span>
          <span>Upload Document</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Category Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 scrollbar-none">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? "bg-primary text-white shadow-xs"
                  : "bg-white text-on-surface hover:bg-surface-container-low border border-outline-variant/30"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 rounded-full bg-white border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
          />
          <span className="material-symbols-outlined absolute left-3 top-2 text-outline text-[18px]">search</span>
        </div>
      </div>

      {/* Documents Grid */}
      {loading ? (
        <div className="py-16 text-center text-outline flex flex-col items-center justify-center gap-2">
          <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
          <span className="text-xs">Loading secure health vault...</span>
        </div>
      ) : filteredDocs.length === 0 ? (
        <div className="bg-white rounded-3xl p-12 text-center border border-outline-variant/30 flex flex-col items-center justify-center gap-3">
          <div className="w-16 h-16 rounded-3xl bg-surface-container flex items-center justify-center text-outline">
            <span className="material-symbols-outlined text-[36px]">folder_open</span>
          </div>
          <h3 className="text-base font-bold text-on-surface">No Medical Documents Found</h3>
          <p className="text-xs text-on-surface-variant max-w-sm">
            Keep your blood work, doctor prescriptions, and health records securely organized in one place.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-2 px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-sm"
          >
            Upload Your First Report
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredDocs.map((doc) => (
            <div
              key={doc.id}
              className="rounded-3xl p-5 bg-white border border-outline-variant/30 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="px-2.5 py-0.5 rounded-full bg-secondary-container/60 text-on-secondary-container text-[10px] font-bold uppercase">
                    {doc.category}
                  </span>
                  <span className="text-[11px] font-medium text-outline">{doc.document_date}</span>
                </div>

                <h3 className="text-sm font-bold text-on-surface leading-snug line-clamp-2">{doc.title}</h3>
                <p className="text-xs text-outline mt-1 truncate">File: {doc.file_name}</p>
              </div>

              {doc.ai_summary && (
                <div className="p-3 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-xs text-on-surface-variant line-clamp-3">
                  <span className="font-bold text-primary block mb-0.5">AI Summary</span>
                  {doc.ai_summary.slice(0, 140)}...
                </div>
              )}

              <div className="flex items-center justify-between pt-2 border-t border-outline-variant/20">
                <button
                  onClick={() => {
                    setActiveDoc(doc);
                    setQuestionAnswer("");
                    setDocQuestion("");
                  }}
                  className="px-3.5 py-1.5 rounded-full bg-primary text-white text-xs font-bold active:scale-95 transition-all shadow-xs"
                >
                  View Details & AI
                </button>

                <div className="flex items-center gap-1">
                  <a
                    href={api.documents.getDownloadUrl(doc.id)}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-outline hover:text-primary transition-colors"
                    title="Download file"
                  >
                    <span className="material-symbols-outlined text-[18px]">download</span>
                  </a>
                  <button
                    onClick={() => handleDelete(doc.id)}
                    className="p-1.5 text-outline hover:text-error transition-colors"
                    title="Delete document"
                  >
                    <span className="material-symbols-outlined text-[18px]">delete</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Document Detail & AI Review Modal */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 max-h-[88vh] overflow-y-auto flex flex-col gap-4 animate-fadeIn">
            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-secondary-container text-on-secondary-container text-[10px] font-bold uppercase">
                  {activeDoc.category}
                </span>
                <h2 className="text-lg font-bold text-on-surface mt-1">{activeDoc.title}</h2>
                <p className="text-xs text-outline">
                  Date: {activeDoc.document_date} • File: {activeDoc.file_name} (
                  {Math.round(activeDoc.file_size / 1024)} KB)
                </p>
              </div>

              <button onClick={() => setActiveDoc(null)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            {/* AI Summary Block */}
            <div className="p-4 rounded-2xl bg-gradient-to-br from-surface-container-low to-white border border-secondary/20 shadow-xs">
              <div className="flex items-center gap-2 mb-2 text-primary font-bold text-xs uppercase tracking-wider">
                <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                <span>AI Plain Language Interpretation</span>
              </div>
              <div className="text-xs md:text-sm text-on-surface leading-relaxed prose prose-sm max-w-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeDoc.ai_summary}</ReactMarkdown>
              </div>
            </div>

            {/* Extracted Text Excerpt */}
            {activeDoc.extracted_text && (
              <div className="flex flex-col gap-1.5">
                <span className="text-xs font-bold text-on-surface">Extracted Medical Document Text</span>
                <pre className="p-3.5 rounded-2xl bg-surface-container-low border border-outline-variant/20 text-[11px] font-mono text-on-surface-variant max-h-40 overflow-y-auto whitespace-pre-wrap">
                  {activeDoc.extracted_text}
                </pre>
              </div>
            )}

            {/* Ask AI about this document form */}
            <form onSubmit={handleAskQuestion} className="flex flex-col gap-2 pt-2 border-t border-outline-variant/20">
              <label className="text-xs font-bold text-on-surface flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[16px] text-primary">contact_support</span>
                <span>Ask AI Mate a Question About This Report</span>
              </label>

              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="e.g. Is my hemoglobin within normal range? What questions should I ask?"
                  value={docQuestion}
                  onChange={(e) => setDocQuestion(e.target.value)}
                  className="flex-1 px-4 py-2.5 rounded-full bg-surface-container-low border border-outline-variant/30 text-xs focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <button
                  type="submit"
                  disabled={asking || !docQuestion.trim()}
                  className="px-4 py-2.5 rounded-full bg-primary text-white text-xs font-bold disabled:opacity-50 active:scale-95 transition-all shadow-xs"
                >
                  {asking ? "Thinking..." : "Ask"}
                </button>
              </div>

              {questionAnswer && (
                <div className="mt-2 p-3.5 rounded-2xl bg-secondary-container/40 border border-secondary/20 text-xs text-on-surface leading-relaxed">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{questionAnswer}</ReactMarkdown>
                </div>
              )}
            </form>

            <div className="flex items-center justify-between pt-3 border-t border-outline-variant/20">
              <button
                type="button"
                onClick={() => handleDownload(activeDoc)}
                disabled={downloading}
                className="px-4 py-2 rounded-full bg-surface-container hover:bg-surface-container-high text-xs font-bold text-on-surface flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                <span className="material-symbols-outlined text-[16px]">download</span>
                <span>{downloading ? "Downloading..." : "Download Original"}</span>
              </button>

              <button
                onClick={() => handleDelete(activeDoc.id)}
                className="px-3 py-1.5 text-xs text-error font-semibold hover:underline"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-outline-variant/30 animate-fadeIn">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-on-surface">Upload Medical Document</h2>
              <button onClick={() => setShowUploadModal(false)} className="p-1 text-outline hover:text-on-surface">
                <span className="material-symbols-outlined text-[20px]">close</span>
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Document Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Annual Blood Panel, Dr. Sharma Prescription"
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Category</label>
                  <select
                    value={uploadCategory}
                    onChange={(e) => setUploadCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="Lab Report">Lab Report</option>
                    <option value="Prescription">Prescription</option>
                    <option value="Imaging">Imaging (X-ray/MRI)</option>
                    <option value="Doctor Note">Doctor Note</option>
                    <option value="Vaccination">Vaccination</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-on-surface">Document Date</label>
                  <input
                    type="date"
                    required
                    value={uploadDate}
                    onChange={(e) => setUploadDate(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Select File (PDF, PNG, JPG, Max 15MB)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/png,image/jpeg"
                  onChange={(e) => setUploadFile(e.target.files[0])}
                  className="w-full px-3 py-2 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs text-outline file:mr-3 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-bold file:bg-primary file:text-white"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-on-surface">Notes (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Fasting 12 hours prior"
                  value={uploadNotes}
                  onChange={(e) => setUploadNotes(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-surface-container-low border border-outline-variant/40 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div className="flex items-center justify-end gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 rounded-full text-xs font-semibold text-outline hover:text-on-surface"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploading}
                  className="px-5 py-2.5 rounded-full bg-primary text-white text-xs font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
                >
                  {uploading ? "Extracting & Uploading..." : "Upload & Analyze"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
