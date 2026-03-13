import { useEffect, useRef, useState } from "react";
import { io } from "socket.io-client";
import {
  getConversationByProject,
  getMessages,
  sendMessage,
} from "../../services/chatService";
import SingleMessage from "./SingleMessage";

const SOCKET_URL = "http://localhost:5000";
const POLL_INTERVAL = 5000; // fallback polling every 5s

export default function ChatWindow({ projectId }) {
  const [conversation, setConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [file, setFile] = useState(null);
  const [replyTo, setReplyTo] = useState(null); // ✅ Fixed: was undefined
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [socketConnected, setSocketConnected] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const pollRef = useRef(null);
  const convoRef = useRef(null); // keep latest convo in ref for socket handler

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Load conversation + messages
  useEffect(() => {
    if (!projectId || projectId === "undefined") {
      setError("Invalid project ID.");
      setLoading(false);
      return;
    }

    let cancelled = false;

    async function loadChat() {
      try {
        setLoading(true);
        setError("");

        const convoRes = await getConversationByProject(projectId);
        if (cancelled) return;

        const convo = convoRes.data;
        setConversation(convo);
        convoRef.current = convo;

        const msgRes = await getMessages(convo._id);
        if (cancelled) return;

        setMessages(msgRes.data);
      } catch (err) {
        if (!cancelled)
          setError(
            err?.response?.data?.message ||
              "Failed to load chat. Please try again."
          );
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadChat();
    return () => {
      cancelled = true;
    };
  }, [projectId]);

  // Socket.IO real-time + polling fallback
  useEffect(() => {
    if (!conversation?._id) return;

    const conversationId = conversation._id;

    // --- Socket.IO ---
    const socket = io(SOCKET_URL, { transports: ["websocket", "polling"] });
    socketRef.current = socket;

    socket.on("connect", () => {
      setSocketConnected(true);
      socket.emit("joinRoom", conversationId);
      // Clear polling if socket connects
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    });

    socket.on("disconnect", () => {
      setSocketConnected(false);
      // Start polling fallback when socket drops
      startPolling(conversationId);
    });

    socket.on("newMessage", (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on("connect_error", () => {
      setSocketConnected(false);
      startPolling(conversationId);
    });

    // --- Polling fallback (if socket doesn't connect quickly) ---
    const socketTimeout = setTimeout(() => {
      if (!socket.connected) startPolling(conversationId);
    }, 3000);

    return () => {
      socket.disconnect();
      clearTimeout(socketTimeout);
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [conversation?._id]);

  function startPolling(conversationId) {
    if (pollRef.current) return; // already polling
    pollRef.current = setInterval(async () => {
      try {
        const res = await getMessages(conversationId);
        setMessages(res.data);
      } catch {}
    }, POLL_INTERVAL);
  }

  const handleSend = async (e) => {
    e.preventDefault();
    if (!text.trim() && !file) return;
    if (!conversation?._id) {
      setError("Conversation not loaded yet.");
      return;
    }

    const formData = new FormData();
    if (text.trim()) formData.append("content", text.trim());
    if (file) formData.append("file", file);
    if (replyTo?._id) formData.append("replyTo", replyTo._id);

    try {
      setSending(true);
      const res = await sendMessage(conversation._id, formData);
      // Optimistically add if socket didn't already deliver it
      setMessages((prev) => {
        if (prev.some((m) => m._id === res.data._id)) return prev;
        return [...prev, res.data];
      });
      setText("");
      setFile(null);
      setReplyTo(null);
    } catch (err) {
      alert(
        "Failed to send message: " +
          (err?.response?.data?.message || err.message)
      );
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="chat-loading">
        <div className="spinner" />
        <p>Loading conversation...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="chat-error">
        <p>⚠️ {error}</p>
      </div>
    );
  }

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <span className="chat-status">
          <span
            className={`status-dot ${socketConnected ? "online" : "offline"}`}
          />
          {socketConnected ? "Live" : "Polling"}
        </span>
        <span className="msg-count">{messages.length} messages</span>
      </div>

      {/* Messages */}
      <div className="messages">
        {messages.length === 0 && (
          <p className="no-messages">No messages yet. Start the conversation!</p>
        )}
        {messages.map((msg) => (
          <SingleMessage
            key={msg._id}
            message={msg}
            onReply={setReplyTo} // ✅ Fixed: now properly passed
          />
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Reply preview */}
      {replyTo && (
        <div className="reply-preview">
          <span>↩ Replying to: <em>{replyTo.content || "📎 File"}</em></span>
          <button className="cancel-reply" onClick={() => setReplyTo(null)}>
            ✕
          </button>
        </div>
      )}

      {/* Input */}
      <form className="chat-input" onSubmit={handleSend}>
        <input
          type="text"
          placeholder="Type your message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          disabled={sending}
        />

        <label className="file-upload-label" title="Attach file">
          📎
          <input
            type="file"
            accept="image/*,.pdf,.doc,.docx,.zip,.txt"
            onChange={(e) => setFile(e.target.files[0])}
            disabled={sending}
          />
        </label>

        {file && (
          <span className="file-name">
            {file.name}
            <button
              type="button"
              className="cancel-reply"
              onClick={() => setFile(null)}
            >
              ✕
            </button>
          </span>
        )}

        <button type="submit" disabled={sending || (!text.trim() && !file)}>
          {sending ? "..." : "Send"}
        </button>
      </form>
    </div>
  );
}

