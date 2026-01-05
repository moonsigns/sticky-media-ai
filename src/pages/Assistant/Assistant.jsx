// src/pages/Assistant/Assistant.jsx
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import renderMarkdown from "../../utils/renderMarkdown";
import { sendMessage } from "../../api/AssistantApi";

import "./Assistant.css";

export default function Assistant({
  userId,
  email,
}) {
  const { t, i18n } = useTranslation();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);

  /* -------------------- WELCOME MESSAGE -------------------- */
  useEffect(() => {
    setMessages([
      {
        role: "assistant",
        content: t("assistant.welcome")
      }
    ]);
  }, [i18n.language, t]);

  /* -------------------- AUTO SCROLL -------------------- */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  /* -------------------- SEND MESSAGE -------------------- */
  async function handleSend() {
    if (!input.trim() || loading) return;

    const userText = input.trim();

    setMessages(prev => [
      ...prev,
      { role: "user", content: userText }
    ]);

    setInput("");
    setLoading(true);

    try {
      const reply = await sendMessage({
        userId,
        email,
        userMessage: userText
      });

      setMessages(prev => [
        ...prev,
        { role: "assistant", content: reply }
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        {
          role: "assistant",
          content: t("assistant.error")
        }
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="assistant-page">

      {/* Chat */}
      <div className="assistant-chat">
        <div className="assistant-container assistant-chat-inner">
          {messages.map((msg, i) =>
            msg.role === "assistant" ? (
              <div
                key={i}
                className="assistant-bubble assistant"
                dangerouslySetInnerHTML={renderMarkdown(msg.content)}
              />
            ) : (
              <div
                key={i}
                className="assistant-bubble user"
              >
                {msg.content}
              </div>
            )
          )}

          {loading && (
            <div className="assistant-bubble assistant">
              <span className="thinking">
                {t("assistant.thinking")}
              </span>
            </div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="assistant-input-bar">
        <div className="assistant-container assistant-input-inner">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={t("assistant.placeholder")}
            rows={1}
          />
          <button onClick={handleSend} disabled={loading}>
            ↑
          </button>
        </div>
      </div>
    </div>
  );
}
