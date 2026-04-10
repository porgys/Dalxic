"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPusherClient } from "@/lib/pusher-client";

// ── Purple palette ──
const PURPLE = "#8B6CC7";
const PURPLE_LIGHT = "#A78BDB";
const PURPLE_DEEP = "rgba(20,16,36,0.98)";
const GLASS = "rgba(255,255,255,0.04)";
const GLASS_HOVER = "rgba(255,255,255,0.08)";
const GLASS_ACTIVE = "rgba(255,255,255,0.10)";
const TEXT_PRIMARY = "#F1F5F9";
const TEXT_MUTED = "rgba(255,255,255,0.5)";
const TEXT_DIM = "rgba(255,255,255,0.3)";
const GREEN = "#22C55E";

interface ChatMsg {
  id: string;
  fromModule: string;
  toModule: string | null;
  fromOperatorId: string;
  fromOperatorName: string;
  message: string;
  createdAt: string;
}

interface StaffMember {
  id: string;
  name: string;
  role: string;
  online: boolean;
  lastSeen: string | null;
}

interface Conversation {
  operatorId: string;
  operatorName: string;
  module: string;
  lastMessage: string;
  lastTime: string;
  unread: number;
}

const MODULE_ICONS: Record<string, string> = {
  front_desk: "🏥", waiting_room: "🪑", doctor: "🩺", pharmacy: "💊",
  billing: "💳", lab: "🔬", injection_room: "💉", nurse_station: "👩‍⚕️",
  ct_radiology: "📡", ward_ipd: "🛏️", ultrasound: "🫧", emergency: "🚨",
  icu: "❤️‍🩹", maternity: "🤱", blood_bank: "🩸", bookkeeping: "📊",
  admin: "⚙️", broadcast: "📢",
  // Role names
  pharmacist: "💊", front_desk: "🏥", lab_tech: "🔬",
  nurse: "👩‍⚕️", radiologist: "📡", super_admin: "⚙️",
  accountant: "📊",
};

const MODULE_LABELS: Record<string, string> = {
  front_desk: "Front Desk", waiting_room: "Waiting Room", doctor: "Doctor",
  pharmacy: "Pharmacy", billing: "Billing", lab: "Laboratory",
  injection_room: "Injection Room", nurse_station: "Nursing",
  ct_radiology: "Radiology", ward_ipd: "Ward / IPD", ultrasound: "Ultrasound",
  emergency: "Emergency", icu: "ICU", maternity: "Maternity",
  blood_bank: "Blood Bank", bookkeeping: "Bookkeeping", admin: "Admin",
  broadcast: "All Stations",
  // Role names that don't match module keys
  pharmacist: "Pharmacy", front_desk: "Front Desk",
  lab_tech: "Laboratory", nurse: "Nursing",
  radiologist: "Radiology", super_admin: "Admin",
  accountant: "Bookkeeping",
};

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  if (d.toDateString() === today.toDateString()) return "Today";
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (d.toDateString() === yesterday.toDateString()) return "Yesterday";
  return d.toLocaleDateString([], { day: "numeric", month: "short", year: "numeric" });
}

interface ChatPanelProps {
  hospitalCode: string;
  currentModule: string;
  operatorId: string;
  operatorName: string;
}

export function ChatPanel({ hospitalCode, currentModule, operatorId, operatorName }: ChatPanelProps) {
  const [open, setOpen] = useState(false);
  const [chatEnabled, setChatEnabled] = useState<boolean | null>(null);
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [activeContact, setActiveContact] = useState<Conversation | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ── Check if hospital has chat module active ──
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`/api/hospitals?code=${hospitalCode}`);
        if (res.ok) {
          const data = await res.json();
          const modules: string[] = data.activeModules || [];
          setChatEnabled(modules.includes("chat"));
        }
      } catch { setChatEnabled(false); }
    })();
  }, [hospitalCode]);

  const loadConversations = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?hospitalCode=${hospitalCode}&module=${currentModule}&view=conversations`);
      if (res.ok) {
        const data = await res.json();
        setConversations(data.conversations);
        const total = data.conversations.reduce((s: number, c: Conversation) => s + c.unread, 0);
        setUnreadTotal(total);
      }
    } catch { /* silent */ }
  }, [hospitalCode, currentModule]);

  const loadStaff = useCallback(async () => {
    try {
      const res = await fetch(`/api/chat?hospitalCode=${hospitalCode}&module=${currentModule}&view=staff`);
      if (res.ok) {
        const data = await res.json();
        setStaff(data.staff);
      }
    } catch { /* silent */ }
  }, [hospitalCode, currentModule]);

  const loadMessages = useCallback(async (contact?: Conversation) => {
    try {
      let url = `/api/chat?hospitalCode=${hospitalCode}&module=${currentModule}&view=messages&limit=80`;
      if (contact && contact.operatorId !== "broadcast") {
        url += `&withOperator=${contact.operatorId}`;
      }
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages);
        setUnreadTotal(data.unread);
      }
    } catch { /* silent */ }
  }, [hospitalCode, currentModule]);

  // Initial load + polling
  useEffect(() => {
    if (!open || !chatEnabled) return;
    loadConversations();
    loadStaff();
    const t = setInterval(() => { loadConversations(); loadStaff(); }, 8000);
    return () => clearInterval(t);
  }, [open, chatEnabled, loadConversations, loadStaff]);

  // Load messages when contact selected
  useEffect(() => {
    if (activeContact) loadMessages(activeContact);
  }, [activeContact, loadMessages]);

  // Poll unread even when closed
  useEffect(() => {
    if (!chatEnabled) return;
    loadConversations();
    const t = setInterval(loadConversations, 12000);
    return () => clearInterval(t);
  }, [chatEnabled, loadConversations]);

  // Pusher real-time
  useEffect(() => {
    if (!chatEnabled) return;
    const pusher = getPusherClient();
    const channel = pusher.subscribe(`private-hospital-${hospitalCode}-chat`);
    channel.bind("new-message", (msg: ChatMsg) => {
      if (msg.toModule === null || msg.toModule === currentModule || msg.fromModule === currentModule) {
        setMessages(prev => [...prev, msg]);
        if (msg.fromModule !== currentModule) {
          setUnreadTotal(u => u + 1);
          try { new Audio("data:audio/wav;base64,UklGRl9vT19teleVmDABAAEARKwAAIhYAQACABAAZGF0YQ==").play().catch(() => {}); } catch { /* silent */ }
        }
        loadConversations();
      }
    });
    return () => { channel.unbind_all(); pusher.unsubscribe(`private-hospital-${hospitalCode}-chat`); };
  }, [hospitalCode, currentModule, chatEnabled, loadConversations]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  // Focus input
  useEffect(() => {
    if (open && activeContact) setTimeout(() => inputRef.current?.focus(), 150);
  }, [open, activeContact]);

  // Mark read
  useEffect(() => {
    if (open && activeContact && activeContact.unread > 0) {
      fetch("/api/chat", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalCode, module: currentModule, fromOperatorId: activeContact.operatorId }),
      }).catch(() => {});
    }
  }, [open, activeContact, hospitalCode, currentModule]);

  const sendMessage = async () => {
    if (!text.trim() || sending) return;
    setSending(true);
    const msgText = text.trim();
    try {
      const toModule = activeContact?.module === "broadcast" ? null : activeContact?.module || null;
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospitalCode, fromModule: currentModule,
          toModule,
          fromOperatorId: operatorId, fromOperatorName: operatorName,
          message: msgText,
        }),
      });
      if (res.ok) {
        const sent = await res.json();
        setMessages(prev => [...prev, {
          id: sent.id,
          fromModule: currentModule,
          toModule: toModule,
          fromOperatorId: operatorId,
          fromOperatorName: operatorName,
          message: msgText,
          createdAt: sent.createdAt || new Date().toISOString(),
        }]);
        setText("");
        loadConversations();
      }
    } catch { /* silent */ }
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const startNewChat = (member: StaffMember) => {
    setActiveContact({
      operatorId: member.id,
      operatorName: member.name,
      module: member.role,
      lastMessage: "",
      lastTime: new Date().toISOString(),
      unread: 0,
    });
  };

  const isMine = (msg: ChatMsg) => msg.fromOperatorId === operatorId;

  // Group messages by date
  const groupedMessages: { date: string; msgs: ChatMsg[] }[] = [];
  messages.forEach(msg => {
    const dateKey = formatDate(msg.createdAt);
    const last = groupedMessages[groupedMessages.length - 1];
    if (last && last.date === dateKey) { last.msgs.push(msg); }
    else { groupedMessages.push({ date: dateKey, msgs: [msg] }); }
  });

  // Don't render if chat not enabled
  if (chatEnabled === false) return null;
  if (chatEnabled === null) return null;

  const onlineStaff = staff.filter(s => s.online);
  const offlineStaff = staff.filter(s => !s.online);

  // Get icon for a module/role
  const icon = (key: string) => MODULE_ICONS[key] || "💬";
  const label = (key: string) => MODULE_LABELS[key] || key.replace(/_/g, " ");

  // Find unread count for a specific staff member
  const unreadFor = (memberId: string) => {
    const conv = conversations.find(c => c.operatorId === memberId);
    return conv?.unread || 0;
  };

  return (
    <>
      {/* ── Floating Chat Button ── */}
      <motion.button
        type="button"
        onClick={() => setOpen(!open)}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.95 }}
        style={{
          position: "fixed", bottom: 28, right: 28, zIndex: 9998,
          width: 64, height: 64, borderRadius: "50%",
          background: `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})`,
          border: "none", cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: `0 6px 32px rgba(139,108,199,0.5)`,
          fontSize: 28, color: "#fff",
        }}
      >
        {open ? "✕" : "💬"}
        {unreadTotal > 0 && !open && (
          <motion.span
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            style={{
              position: "absolute", top: -6, right: -6,
              minWidth: 26, height: 26, borderRadius: 13, padding: "0 6px",
              background: "#EF4444", color: "#fff",
              fontSize: 13, fontWeight: 800,
              display: "flex", alignItems: "center", justifyContent: "center",
              border: `2.5px solid #0A0A0F`,
              animation: "chatPulse 2s ease-in-out infinite",
            }}
          >
            {unreadTotal > 99 ? "99+" : unreadTotal}
          </motion.span>
        )}
      </motion.button>

      <style>{`@keyframes chatPulse { 0%,100%{box-shadow:0 0 0 0 rgba(139,108,199,0.4)} 50%{box-shadow:0 0 0 10px rgba(139,108,199,0)} }`}</style>

      {/* ── Chat Overlay ── */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 30, scale: 0.95 }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: "fixed", bottom: 104, right: 28, zIndex: 9997,
              width: 900, height: 640,
            }}
          >
            {/* ═══ MAIN CONTENT PANEL (sits behind, full width) ═══ */}
            <div style={{
              position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
              background: `linear-gradient(135deg, rgba(45,30,80,0.97) 0%, rgba(25,18,50,0.98) 50%, rgba(35,25,65,0.97) 100%)`,
              backdropFilter: "blur(40px)", WebkitBackdropFilter: "blur(40px)",
              borderRadius: 24, overflow: "hidden",
              border: "1px solid rgba(139,108,199,0.15)",
              boxShadow: "0 20px 80px rgba(0,0,0,0.6), 0 0 0 1px rgba(139,108,199,0.08)",
            }}>
              {/* Seamless gradient stream across the bottom */}
              <div style={{
                position: "absolute", bottom: 0, left: 0, right: 0, height: 200,
                background: "linear-gradient(90deg, rgba(139,108,199,0.22) 0%, rgba(180,130,240,0.15) 18%, rgba(120,170,255,0.13) 35%, rgba(200,120,220,0.14) 52%, rgba(100,180,240,0.12) 68%, rgba(160,110,230,0.16) 85%, rgba(139,108,199,0.2) 100%)",
                pointerEvents: "none", zIndex: 0,
                filter: "blur(50px)",
                borderRadius: "0 0 24px 24px",
              }} />
              {/* Messages area — offset left to make room for sidebar overlay */}
              <div style={{
                position: "absolute", top: 0, left: 232, right: 0, bottom: 0,
                display: "flex", flexDirection: "column",
              }}>
                {activeContact ? (
                  <>
                    {/* Contact Header */}
                    <div style={{
                      padding: "16px 28px",
                      display: "flex", alignItems: "center", justifyContent: "center", gap: 14,
                    }}>
                      <div style={{
                        width: 46, height: 46, borderRadius: 15,
                        background: "linear-gradient(135deg, rgba(139,108,199,0.2) 0%, rgba(167,139,219,0.12) 100%)",
                        border: "1.5px solid rgba(167,139,219,0.25)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: 24,
                        boxShadow: "0 4px 16px rgba(139,108,199,0.15)",
                        flexShrink: 0,
                      }}>
                        {icon(activeContact.module)}
                      </div>
                      <div>
                        <div style={{ fontSize: 20, fontWeight: 800, color: TEXT_PRIMARY, letterSpacing: "-0.01em" }}>
                          {label(activeContact.module)}
                        </div>
                        <div style={{ fontSize: 13, color: PURPLE_LIGHT, fontWeight: 600, marginTop: 2 }}>
                          {activeContact.operatorName}
                        </div>
                      </div>
                    </div>

                    {/* Messages Thread */}
                    <div ref={scrollRef} style={{ flex: 1, overflowY: "auto", padding: "16px 28px" }}>
                      {groupedMessages.length === 0 && (
                        <div style={{
                          textAlign: "center", color: TEXT_DIM, fontSize: 16, marginTop: 100,
                          fontWeight: 600,
                        }}>
                          Start The Conversation
                          <div style={{ fontSize: 13, color: TEXT_DIM, marginTop: 8, fontWeight: 500 }}>
                            Send A Message Below
                          </div>
                        </div>
                      )}
                      {groupedMessages.map((group, gi) => (
                        <div key={gi}>
                          <div style={{
                            textAlign: "center", margin: "24px 0 18px",
                            display: "flex", alignItems: "center", gap: 16,
                          }}>
                            <div style={{ flex: 1, height: 1, background: "rgba(139,108,199,0.12)" }} />
                            <span style={{
                              fontSize: 12, fontWeight: 700, color: PURPLE_LIGHT,
                              padding: "6px 18px", borderRadius: 12,
                              background: "rgba(139,108,199,0.08)", border: "1px solid rgba(139,108,199,0.12)",
                            }}>
                              {group.date}
                            </span>
                            <div style={{ flex: 1, height: 1, background: "rgba(139,108,199,0.12)" }} />
                          </div>

                          {group.msgs.map((msg) => {
                            const mine = isMine(msg);
                            return (
                              <div key={msg.id} style={{
                                display: "flex", gap: 12, marginBottom: 18,
                                flexDirection: mine ? "row-reverse" : "row",
                                alignItems: "flex-end",
                              }}>
                                {!mine && (
                                  <div style={{
                                    width: 38, height: 38, borderRadius: 12, flexShrink: 0,
                                    background: "rgba(139,108,199,0.1)",
                                    border: "1px solid rgba(139,108,199,0.15)",
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                    fontSize: 18,
                                  }}>
                                    {icon(msg.fromModule)}
                                  </div>
                                )}
                                <div style={{ maxWidth: "68%" }}>
                                  {!mine && (
                                    <div style={{
                                      fontSize: 13, fontWeight: 700, color: PURPLE_LIGHT, marginBottom: 5,
                                      display: "flex", alignItems: "center", gap: 8,
                                    }}>
                                      {label(msg.fromModule)}
                                      <span style={{ fontSize: 11, fontWeight: 500, color: TEXT_DIM }}>
                                        {msg.fromOperatorName}
                                      </span>
                                    </div>
                                  )}
                                  <div style={{
                                    padding: "14px 20px",
                                    borderRadius: mine ? "20px 20px 6px 20px" : "20px 20px 20px 6px",
                                    background: mine ? "rgba(139,108,199,0.2)" : "rgba(255,255,255,0.06)",
                                    border: `1px solid ${mine ? "rgba(139,108,199,0.3)" : "rgba(255,255,255,0.08)"}`,
                                    fontSize: 16, color: TEXT_PRIMARY, lineHeight: 1.55, fontWeight: 500,
                                  }}>
                                    {msg.message}
                                  </div>
                                  <div style={{
                                    fontSize: 12, color: TEXT_DIM, marginTop: 6,
                                    textAlign: mine ? "right" : "left",
                                    fontFamily: "var(--font-jetbrains-mono), monospace",
                                  }}>
                                    {formatTime(msg.createdAt)}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ))}
                    </div>

                    {/* Input Bar */}
                    <div style={{
                      padding: "18px 28px",
                      borderTop: "1px solid rgba(139,108,199,0.1)",
                      display: "flex", alignItems: "center", gap: 14,
                    }}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={text}
                        onChange={(e) => setText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder="Write A Message..."
                        style={{
                          flex: 1, fontSize: 16, fontWeight: 500,
                          background: "rgba(139,108,199,0.06)",
                          border: "1px solid rgba(139,108,199,0.15)", borderRadius: 16,
                          padding: "15px 22px", color: "#fff", outline: "none",
                          fontFamily: "inherit",
                          transition: "border-color 0.2s ease",
                        }}
                        onFocus={e => { e.currentTarget.style.borderColor = "rgba(139,108,199,0.4)"; }}
                        onBlur={e => { e.currentTarget.style.borderColor = "rgba(139,108,199,0.15)"; }}
                      />
                      <motion.button
                        type="button"
                        onClick={sendMessage}
                        disabled={!text.trim() || sending}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        style={{
                          width: 52, height: 52, borderRadius: 16,
                          background: text.trim() ? `linear-gradient(135deg, ${PURPLE}, ${PURPLE_LIGHT})` : "rgba(139,108,199,0.08)",
                          border: "none", cursor: text.trim() ? "pointer" : "default",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: 22, color: "#fff",
                          opacity: text.trim() ? 1 : 0.3,
                          transition: "all 0.2s ease",
                          boxShadow: text.trim() ? "0 4px 20px rgba(139,108,199,0.4)" : "none",
                        }}
                      >
                        ↑
                      </motion.button>
                    </div>
                  </>
                ) : (
                  <div style={{
                    flex: 1, display: "flex", flexDirection: "column",
                    alignItems: "center", justifyContent: "center", gap: 20,
                  }}>
                    <div style={{
                      width: 100, height: 100, borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(139,108,199,0.15) 0%, transparent 70%)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: 44,
                    }}>
                      💬
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: TEXT_MUTED }}>
                      Hospital Chat
                    </div>
                    <div style={{
                      fontSize: 15, color: TEXT_DIM, textAlign: "center",
                      maxWidth: 300, lineHeight: 1.6, fontWeight: 500,
                    }}>
                      Select A Station From The Left To Start A Conversation
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* ═══ LEFT SIDEBAR — Separate frosted panel, overlays the main ═══ */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.08 }}
              style={{
                position: "absolute", top: 10, left: -20, bottom: 10,
                width: 250,
                background: "rgba(120,95,180,0.45)",
                backdropFilter: "blur(30px)", WebkitBackdropFilter: "blur(30px)",
                borderRadius: 18,
                border: "1px solid rgba(255,255,255,0.18)",
                boxShadow: "0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.12)",
                display: "flex", flexDirection: "column",
                overflow: "hidden",
                zIndex: 2,
              }}
            >
              {/* Sidebar Header */}
              <div style={{ padding: "22px 20px 16px" }}>
                <div style={{ fontSize: 20, fontWeight: 800, color: "#fff", letterSpacing: "-0.01em" }}>
                  Chat
                </div>
                <div style={{ fontSize: 12, color: PURPLE_LIGHT, fontWeight: 600, marginTop: 3, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  {MODULE_LABELS[currentModule] || currentModule}
                </div>
              </div>

              {/* Staff List */}
              <div style={{ flex: 1, overflowY: "auto", padding: "0 8px 8px" }}>

                {/* Online group */}
                {onlineStaff.length > 0 && (
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "rgba(140,180,140,0.8)",
                    letterSpacing: "1.5px", textTransform: "uppercase",
                    padding: "10px 12px 6px",
                  }}>
                    Online
                  </div>
                )}
                {onlineStaff.map(member => {
                  const isActive = activeContact?.operatorId === member.id;
                  const unread = unreadFor(member.id);
                  return (
                    <button key={member.id} type="button" onClick={() => startNewChat(member)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "10px 12px", borderRadius: 12, border: "none",
                        background: isActive ? "rgba(255,255,255,0.1)" : "transparent",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s ease",
                        marginBottom: 1,
                      }}
                      onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                      onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "transparent"; }}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: "center" }}>
                        {icon(member.role)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 700, color: isActive ? "#fff" : "rgba(255,255,255,0.9)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {label(member.role)}
                        </div>
                        <div style={{
                          fontSize: 12, color: isActive ? PURPLE_LIGHT : TEXT_MUTED,
                          fontWeight: 500, marginTop: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {member.name}
                        </div>
                      </div>
                      {unread > 0 && (
                        <span style={{
                          minWidth: 22, height: 22, borderRadius: 11, padding: "0 5px",
                          background: PURPLE_LIGHT, color: "#fff",
                          fontSize: 11, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}

                {/* Offline group */}
                {offlineStaff.length > 0 && (
                  <div style={{
                    fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,0.25)",
                    letterSpacing: "1.5px", textTransform: "uppercase",
                    padding: "16px 12px 6px",
                  }}>
                    Offline
                  </div>
                )}
                {offlineStaff.map(member => {
                  const isActive = activeContact?.operatorId === member.id;
                  const unread = unreadFor(member.id);
                  return (
                    <button key={member.id} type="button" onClick={() => startNewChat(member)}
                      style={{
                        width: "100%", display: "flex", alignItems: "center", gap: 12,
                        padding: "9px 12px", borderRadius: 12, border: "none",
                        background: isActive ? "rgba(255,255,255,0.08)" : "transparent",
                        cursor: "pointer", textAlign: "left",
                        transition: "all 0.15s ease",
                        marginBottom: 1,
                        opacity: isActive ? 0.9 : 0.5,
                      }}
                      onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = "rgba(255,255,255,0.04)"; e.currentTarget.style.opacity = "0.7"; } }}
                      onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.opacity = isActive ? "0.9" : "0.5"; } }}
                    >
                      <span style={{ fontSize: 20, flexShrink: 0, width: 28, textAlign: "center" }}>
                        {icon(member.role)}
                      </span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{
                          fontSize: 15, fontWeight: 700, color: "rgba(255,255,255,0.6)",
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {label(member.role)}
                        </div>
                        <div style={{
                          fontSize: 12, color: TEXT_DIM, fontWeight: 500, marginTop: 1,
                          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
                        }}>
                          {member.name}
                        </div>
                      </div>
                      {unread > 0 && (
                        <span style={{
                          minWidth: 22, height: 22, borderRadius: 11, padding: "0 5px",
                          background: PURPLE_LIGHT, color: "#fff",
                          fontSize: 11, fontWeight: 800,
                          display: "flex", alignItems: "center", justifyContent: "center",
                          flexShrink: 0,
                        }}>
                          {unread}
                        </span>
                      )}
                    </button>
                  );
                })}

                {staff.length === 0 && (
                  <div style={{ textAlign: "center", color: TEXT_DIM, fontSize: 14, padding: "48px 12px", fontWeight: 600 }}>
                    No Staff Found
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
