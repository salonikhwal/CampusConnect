import React, { useState, useEffect, useRef } from 'react';

export default function GroupChatView({ groupId, groupName, groupCategory, members, currentUser }) {
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);
  const [codeMode, setCodeMode] = useState(false);
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const fetchMessages = async (silent = false) => {
    try {
      if (!silent) setError(null);
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok) {
        setMessages(data.messages || []);
      } else {
        if (!silent) setError(data.message || 'Failed to load group messages');
      }
    } catch (err) {
      if (!silent) setError('Connection error while fetching messages');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    if (!groupId) return;
    setLoading(true);
    fetchMessages(false);

    // Live polling every 3.5s for real-time chat sync
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(true);
    }, 3500);

    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, [groupId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!inputText.trim() || sending) return;

    const contentToSend = codeMode
      ? `\`\`\`\n${inputText.trim()}\n\`\`\``
      : inputText.trim();

    try {
      setSending(true);
      setError(null);
      const res = await fetch(`/api/groups/${groupId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: contentToSend }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to send message');
      }

      setInputText('');
      setCodeMode(false);
      setMessages((prev) => [...prev, data.message]);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Helper to detect if a message has code
  const renderMessageContent = (content) => {
    const codeBlockMatch = content.match(/```([\s\S]*?)```/);
    if (codeBlockMatch) {
      const code = codeBlockMatch[1];
      const otherText = content.replace(/```[\s\S]*?```/, '').trim();
      return (
        <div className="flex flex-col gap-2">
          {otherText && <p className="font-sans text-body-md whitespace-pre-wrap">{otherText}</p>}
          <div className="rounded-xl overflow-hidden bg-slate-950 text-slate-100 border border-slate-800 text-xs font-mono">
            <div className="bg-slate-900/80 px-3 py-1.5 flex items-center justify-between border-b border-slate-800 text-[11px] text-slate-400">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 inline-block"></span>
                <span>Sphinx Workspace Terminal Snippet</span>
              </span>
              <button
                type="button"
                onClick={() => navigator.clipboard.writeText(code.trim())}
                className="hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="p-3 overflow-x-auto text-[12px] leading-relaxed font-mono">
              <code>{code.trim()}</code>
            </pre>
          </div>
        </div>
      );
    }

    return <p className="font-sans text-body-md whitespace-pre-wrap">{content}</p>;
  };

  return (
    <div className="flex flex-col h-[650px] bg-surface-container-lowest rounded-2xl border border-outline-variant/30 overflow-hidden shadow-xs">
      {/* Sphinx Hackathon Terminal Header Bar */}
      <div className="bg-slate-900 text-slate-200 px-4 py-2.5 flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <span className="font-mono text-xs text-slate-300 font-semibold">
            SPHINX-WORKSPACE // {groupCategory.toUpperCase()} NODE
          </span>
          <span className="text-slate-600 font-mono text-xs">•</span>
          <span className="text-slate-400 font-sans text-xs hidden sm:inline">
            {groupName}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <span className="bg-slate-800 text-slate-300 px-2 py-0.5 rounded text-[11px]">
            {members.length} PEERS CONNECTED
          </span>
          <span className="text-[10px] text-emerald-400 font-mono hidden md:inline">
            ● 200 OK
          </span>
        </div>
      </div>

      {/* Error alert */}
      {error && (
        <div className="p-2.5 bg-error/10 text-error text-xs flex items-center justify-between border-b border-error/20">
          <div className="flex items-center gap-1.5">
            <span className="material-symbols-outlined text-[16px]">error</span>
            <span>{error}</span>
          </div>
          <button onClick={() => fetchMessages(false)} className="underline hover:text-error">
            Retry
          </button>
        </div>
      )}

      {/* Chat Messages Feed */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-surface-container-low/30">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full text-outline gap-2">
            <span className="animate-spin material-symbols-outlined text-[28px] text-primary">
              progress_activity
            </span>
            <p className="font-mono text-xs">Syncing Sphinx workspace messages...</p>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-outline p-6">
            <div className="w-14 h-14 rounded-2xl bg-primary-fixed/30 text-primary flex items-center justify-center mb-3">
              <span className="material-symbols-outlined text-[30px]">terminal</span>
            </div>
            <h4 className="font-heading text-headline-sm font-bold text-on-surface">
              Welcome to {groupName} Workspace
            </h4>
            <p className="font-sans text-body-sm max-w-sm mt-1 text-on-surface-variant">
              This is the live collaboration channel. Coordinate hackathon tracks, share Nachos OS solutions, or post lab questions.
            </p>
            <div className="mt-4 p-3 rounded-xl bg-surface-container text-xs font-mono text-on-surface-variant">
              🔒 Privacy Guaranteed: Only accepted members can read or post.
            </div>
          </div>
        ) : (
          messages.map((msg) => {
            const isMe = msg.senderId === currentUser?.id;
            const isCreator = members.find((m) => m.id === msg.senderId)?.isCreator;

            return (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}
              >
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-primary-fixed text-primary flex items-center justify-center font-heading font-bold text-sm flex-shrink-0 overflow-hidden shadow-2xs">
                  {msg.sender?.avatarUrl ? (
                    <img
                      src={msg.sender.avatarUrl}
                      alt={msg.sender.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    msg.sender?.name?.charAt(0) || 'U'
                  )}
                </div>

                {/* Message Bubble */}
                <div
                  className={`max-w-[82%] sm:max-w-[70%] rounded-2xl p-3.5 shadow-2xs ${
                    isMe
                      ? 'bg-primary text-on-primary rounded-tr-xs'
                      : 'bg-surface-container-lowest text-on-surface border border-outline-variant/30 rounded-tl-xs'
                  }`}
                >
                  <div
                    className={`flex items-center gap-2 mb-1 text-[11px] font-heading ${
                      isMe ? 'text-on-primary/80 justify-end' : 'text-on-surface-variant'
                    }`}
                  >
                    <span className="font-bold">{isMe ? 'You' : msg.sender?.name}</span>
                    <span className="font-mono text-[10px] opacity-75">
                      {msg.sender?.rollNumber}
                    </span>
                    {isCreator && (
                      <span className="bg-amber-400/20 text-amber-600 dark:text-amber-300 font-mono text-[9px] px-1.5 py-0.2 rounded font-bold">
                        CREATOR
                      </span>
                    )}
                    <span className="font-mono text-[10px] opacity-60">
                      {new Date(msg.createdAt).toLocaleTimeString([], {
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>

                  <div className={isMe ? 'text-on-primary' : 'text-on-surface'}>
                    {renderMessageContent(msg.content)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Snippet Bar */}
      <div className="px-4 py-2 bg-surface-container-low/70 border-t border-surface-container/60 flex items-center justify-between text-xs overflow-x-auto gap-2">
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <span className="text-[11px] font-mono text-outline">Sphinx Quick Tags:</span>
          {[
            '// Lab 2 Semaphore WaitQueue',
            '// Go WebSocket Hub',
            '// Prabha Bhawan Meet',
          ].map((tag) => (
            <button
              type="button"
              key={tag}
              onClick={() => setInputText((prev) => (prev ? `${prev}\n${tag}` : tag))}
              className="px-2 py-0.5 rounded-md bg-surface-container hover:bg-surface-container-high text-on-surface-variant font-mono text-[10px] transition-colors"
            >
              {tag}
            </button>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setCodeMode(!codeMode)}
          className={`px-2.5 py-1 rounded-lg font-mono text-[11px] flex items-center gap-1 transition-all ${
            codeMode
              ? 'bg-slate-900 text-emerald-400 font-bold'
              : 'text-outline hover:text-on-surface hover:bg-surface-container'
          }`}
        >
          <span className="material-symbols-outlined text-[14px]">data_object</span>
          <span>{codeMode ? 'Code Mode ON' : 'Code Mode'}</span>
        </button>
      </div>

      {/* Composer Input */}
      <form
        onSubmit={handleSendMessage}
        className="p-3 bg-surface-container-lowest border-t border-outline-variant/30 flex items-end gap-2"
      >
        <div className="flex-1 relative">
          <textarea
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              codeMode
                ? "Paste or type code snippet (press Enter to send)..."
                : "Message #workspace (Enter to send, Shift+Enter for newline)..."
            }
            rows={codeMode ? 3 : 2}
            className={`w-full bg-surface-container-low text-on-surface placeholder:text-outline text-body-sm p-2.5 rounded-xl border border-outline-variant/40 focus:outline-none focus:ring-2 focus:ring-primary focus:bg-surface-container-lowest resize-none transition-all ${
              codeMode ? 'font-mono text-xs bg-slate-950 text-emerald-300 border-slate-800' : 'font-sans'
            }`}
          />
        </div>

        <button
          type="submit"
          disabled={!inputText.trim() || sending}
          className="h-10 px-4 bg-primary hover:bg-primary-container text-on-primary rounded-xl font-heading text-label-md font-semibold flex items-center justify-center gap-1.5 disabled:opacity-40 transition-all shadow-xs flex-shrink-0"
        >
          {sending ? (
            <span className="animate-spin material-symbols-outlined text-[18px]">progress_activity</span>
          ) : (
            <>
              <span>Send</span>
              <span className="material-symbols-outlined text-[16px]">send</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
}
