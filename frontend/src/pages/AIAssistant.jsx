import React, { useState, useEffect, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { api } from "../api/client";
import { useAuth } from "../context/AuthContext";

const SUGGESTION_PROMPTS = [
  "How can I naturally support healthy blood pressure?",
  "Help me design a 15-minute gentle morning stretch routine.",
  "What questions should I prepare for my doctor visit?",
  "How can I improve restorative sleep without medication?",
  "Give me high-protein dinner ideas for a balanced diet.",
];

export default function AIAssistant() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [activeConvoId, setActiveConvoId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [isEmergency, setIsEmergency] = useState(false);
  const [emergencyText, setEmergencyText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, loading]);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  const loadConversations = async () => {
    try {
      const res = await api.chat.listConversations();
      setConversations(res.data);
      if (res.data.length > 0) {
        selectConversation(res.data[0].id);
      } else {
        createNewChat();
      }
    } catch (err) {
      console.error("Failed to load chat conversations:", err);
    }
  };

  const selectConversation = async (id) => {
    setActiveConvoId(id);
    try {
      const res = await api.chat.getConversation(id);
      setMessages(res.data.messages || []);
      setIsEmergency(false);
    } catch (err) {
      console.error("Failed to load conversation details:", err);
    }
  };

  const createNewChat = async () => {
    try {
      const res = await api.chat.createConversation("Health Consultation");
      setConversations((prev) => [res.data, ...prev.filter((c) => c.id !== res.data.id)]);
      setActiveConvoId(res.data.id);
      setMessages(res.data.messages || []);
      setIsEmergency(false);
    } catch (err) {
      console.error("Failed to create new chat:", err);
    }
  };

  const handleDeleteConversation = async (id, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    try {
      await api.chat.deleteConversation(id);
      setConversations((prev) => {
        const remaining = prev.filter((c) => c.id !== id);
        if (activeConvoId === id) {
          if (remaining.length > 0) {
            selectConversation(remaining[0].id);
          } else {
            setActiveConvoId(null);
            setMessages([]);
            setIsEmergency(false);
          }
        }
        return remaining;
      });
    } catch (err) {
      console.error("Failed to delete conversation:", err);
    }
  };

  const handleSendMessage = async (textToSend) => {
    const query = textToSend || inputText;
    if (!query.trim() || loading) return;

    let targetConvoId = activeConvoId;
    if (!targetConvoId) {
      try {
        const res = await api.chat.createConversation(query.slice(0, 30));
        targetConvoId = res.data.id;
        setActiveConvoId(targetConvoId);
        setConversations((prev) => [res.data, ...prev]);
        setMessages(res.data.messages || []);
      } catch (err) {
        console.error("Failed to create conversation:", err);
        return;
      }
    }

    setInputText("");
    const tempUserMsg = {
      id: Date.now(),
      role: "user",
      content: query,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setLoading(true);

    try {
      const res = await api.chat.sendMessage(targetConvoId, query);
      const { assistant_message, is_emergency, emergency_guidance } = res.data;

      setMessages((prev) => [...prev, assistant_message]);
      if (is_emergency) {
        setIsEmergency(true);
        setEmergencyText(emergency_guidance);
      }
      // Refresh conversation list to pick up updated title
      api.chat.listConversations().then((r) => setConversations(r.data));
    } catch (err) {
      console.error("Message send failed:", err);
      const errorMsg = {
        id: Date.now() + 1,
        role: "assistant",
        content:
          "⚠️ I encountered a temporary connection issue. Please check your network and try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-5 h-[calc(100vh-6.5rem)] animate-fadeIn">
      {/* Left Chat Threads Sidebar */}
      <div className="w-full lg:w-72 bg-white rounded-3xl p-4 shadow-sm border border-outline-variant/30 flex flex-col gap-3 flex-shrink-0 max-h-48 lg:max-h-full overflow-y-auto">
        <button
          onClick={createNewChat}
          className="w-full py-2.5 px-4 rounded-full bg-primary hover:bg-primary-container text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          <span>New Conversation</span>
        </button>

        <span className="text-[10px] font-bold uppercase tracking-wider text-outline px-2 mt-1">
          Recent Consultations
        </span>

        <div className="flex flex-col gap-1.5 flex-1 overflow-y-auto">
          {conversations.map((convo) => (
            <div
              key={convo.id}
              onClick={() => selectConversation(convo.id)}
              className={`p-3 rounded-2xl flex items-center justify-between text-xs font-medium cursor-pointer transition-all ${
                activeConvoId === convo.id
                  ? "bg-secondary-container/50 text-on-secondary-container font-bold border border-secondary/30"
                  : "bg-surface-container-low text-on-surface hover:bg-surface-container"
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <span className="material-symbols-outlined text-[16px] text-primary">chat</span>
                <span className="truncate">{convo.title}</span>
              </div>
              <button
                type="button"
                onClick={(e) => handleDeleteConversation(convo.id, e)}
                className="p-1.5 rounded-lg text-outline hover:text-error hover:bg-error-container/30 transition-all flex items-center justify-center flex-shrink-0"
                title="Delete chat"
                aria-label={`Delete chat ${convo.title}`}
              >
                <span className="material-symbols-outlined text-[16px]">delete</span>
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Main Conversation Window */}
      <div className="flex-1 bg-white rounded-3xl p-4 md:p-6 shadow-sm border border-outline-variant/30 flex flex-col justify-between overflow-hidden relative">
        {/* Top Header */}
        <div className="flex items-center justify-between pb-3 border-b border-outline-variant/20 mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white shadow-xs">
              <span className="material-symbols-outlined text-[22px]">auto_awesome</span>
            </div>
            <div>
              <h2 className="text-base font-bold text-on-surface flex items-center gap-1.5">
                <span>AI Mate</span>
                <span className="px-2 py-0.5 rounded-full bg-primary-fixed text-on-primary-fixed-variant text-[10px] font-bold">
                  Health Companion
                </span>
              </h2>
              <p className="text-[11px] text-outline">
                Informed by your logged vitals and wellness profile
              </p>
            </div>
          </div>

          <a
            href="tel:112"
            className="hidden sm:flex items-center gap-1 px-3 py-1 rounded-full bg-error-container/60 text-error text-[11px] font-bold hover:bg-error hover:text-white transition-all"
          >
            <span className="material-symbols-outlined text-[14px]">emergency</span>
            <span>Emergency 112 / 911</span>
          </a>
        </div>

        {/* Emergency Alert Banner */}
        {isEmergency && (
          <div className="mb-3 p-4 rounded-2xl bg-error text-white shadow-lg flex items-start gap-3 animate-pulse">
            <span className="material-symbols-outlined text-[24px]">crisis_alert</span>
            <div className="flex-1 text-xs">
              <p className="font-bold text-sm mb-1">🚨 URGENT MEDICAL NOTICE DETECTED</p>
              <p className="leading-relaxed">{emergencyText}</p>
              <div className="mt-2 flex items-center gap-2">
                <a
                  href="tel:112"
                  className="px-3.5 py-1.5 rounded-full bg-white text-error font-bold text-xs inline-block shadow-sm"
                >
                  Call 112 (India)
                </a>
                <a
                  href="tel:911"
                  className="px-3.5 py-1.5 rounded-full bg-white text-error font-bold text-xs inline-block shadow-sm"
                >
                  Call 911 (US/Canada)
                </a>
              </div>
            </div>
          </div>
        )}

        {/* Messages List Area */}
        <div className="flex-1 overflow-y-auto pr-2 flex flex-col gap-4 mb-3">
          {messages.length === 0 && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-on-surface-variant">
              <div className="w-14 h-14 rounded-3xl bg-secondary-container/60 text-primary flex items-center justify-center mb-3 shadow-inner">
                <span className="material-symbols-outlined text-[28px]">auto_awesome</span>
              </div>
              <h3 className="font-bold text-base text-on-surface mb-1">Start a Conversation with AI Mate</h3>
              <p className="text-xs text-outline max-w-sm mb-4">
                Ask any question about your vitals, health goals, meal suggestions, or medical report findings.
              </p>
              <button
                type="button"
                onClick={createNewChat}
                className="px-4 py-2 rounded-full bg-primary text-white text-xs font-bold hover:bg-primary-container shadow-sm active:scale-95 transition-all flex items-center gap-1.5"
              >
                <span className="material-symbols-outlined text-[16px]">add</span>
                <span>New Conversation</span>
              </button>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : "flex-row"}`}
            >
              {/* Avatar */}
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-secondary text-white"
                    : "bg-primary text-white shadow-xs"
                }`}
              >
                {msg.role === "user" ? user?.full_name?.[0] || "U" : "AI"}
              </div>

              {/* Message Bubble */}
              <div
                className={`max-w-[85%] md:max-w-[75%] rounded-3xl p-4 text-xs md:text-sm leading-relaxed ${
                  msg.role === "user"
                    ? "bg-primary text-white rounded-tr-none shadow-sm"
                    : "bg-surface-container-low/70 border border-outline-variant/30 text-on-surface rounded-tl-none shadow-xs backdrop-blur-sm"
                }`}
              >
                <div className="prose prose-sm max-w-none prose-p:my-1 prose-headings:my-2 prose-ul:my-1 prose-li:my-0.5 text-inherit">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2.5 text-primary text-xs font-semibold p-3 bg-surface-container-low rounded-2xl w-fit">
              <span className="material-symbols-outlined text-[18px] animate-spin">auto_awesome</span>
              <span>AI Mate is formulating balanced wellness guidance...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Suggested Prompt Chips */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none mb-2">
          {SUGGESTION_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(prompt)}
              className="px-3 py-1.5 rounded-full bg-surface-container-low hover:bg-surface-container border border-outline-variant/30 text-[11px] font-medium text-on-surface whitespace-nowrap active:scale-95 transition-all"
            >
              {prompt}
            </button>
          ))}
        </div>

        {/* Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2 pt-2 border-t border-outline-variant/20"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Ask AI Mate about vitals, routines, nutrition, sleep, reports..."
            className="flex-1 px-4 py-3 rounded-full bg-surface-container-low border border-outline-variant/40 text-xs md:text-sm text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/40 focus:bg-white transition-all"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || loading}
            className="w-11 h-11 rounded-full bg-primary hover:bg-primary-container text-white flex items-center justify-center shadow-md active:scale-95 transition-all disabled:opacity-40 flex-shrink-0"
            aria-label="Send message"
          >
            <span className="material-symbols-outlined text-[20px]">send</span>
          </button>
        </form>
      </div>
    </div>
  );
}
