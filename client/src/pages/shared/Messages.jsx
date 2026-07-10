import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { chatApi } from '../../api/endpoints.js';
import { Avatar, EmptyState, Spinner } from '../../components/ui.jsx';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSocket } from '../../context/SocketContext.jsx';
import { timeAgo } from '../../utils/format.js';
import { IconMessage, IconArrowLeft, IconSend, IconFile } from '../../components/icons.jsx';

export default function Messages() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const [params, setParams] = useSearchParams();
  const [conversations, setConversations] = useState([]);
  const [active, setActive] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);
  const [typing, setTyping] = useState(false);
  const endRef = useRef(null);
  const activeRef = useRef(null);

  // Load conversation list
  useEffect(() => {
    chatApi.conversations().then((d) => {
      setConversations(d.items);
      const preselect = params.get('c') || d.items[0]?._id;
      if (preselect) openConversation(preselect, d.items);
      setLoadingList(false);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Socket listeners
  useEffect(() => {
    if (!socket) return;
    const onNew = ({ conversationId, message }) => {
      if (conversationId === activeRef.current) {
        setMessages((m) => [...m, message]);
        socket.emit('message:read', { conversationId });
      }
      setConversations((cs) =>
        cs.map((c) =>
          c._id === conversationId
            ? { ...c, lastMessage: message.body || 'Attachment', lastMessageAt: message.createdAt }
            : c
        )
      );
    };
    const onTyping = ({ conversationId, isTyping }) => {
      if (conversationId === activeRef.current) setTyping(isTyping);
    };
    socket.on('message:new', onNew);
    socket.on('typing', onTyping);
    return () => {
      socket.off('message:new', onNew);
      socket.off('typing', onTyping);
    };
  }, [socket]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const openConversation = async (id, list = conversations) => {
    setActive(list.find((c) => c._id === id) || { _id: id });
    activeRef.current = id;
    setParams({ c: id }, { replace: true });
    setLoadingMsgs(true);
    if (socket) socket.emit('conversation:join', id);
    try {
      const { messages, conversation } = await chatApi.messages(id);
      setMessages(messages);
      setActive((a) => ({ ...a, ...conversation }));
      setConversations((cs) => cs.map((c) => (c._id === id ? { ...c, unreadCount: 0 } : c)));
      if (socket) socket.emit('message:read', { conversationId: id });
    } finally {
      setLoadingMsgs(false);
    }
  };

  const send = async (e) => {
    e.preventDefault();
    if (!text.trim() || !active) return;
    const body = text.trim();
    setText('');
    if (socket) {
      socket.emit('message:send', { conversationId: active._id, body }, (res) => {
        if (res?.ok) setMessages((m) => [...m, res.message]);
      });
    } else {
      const { message } = await chatApi.send(active._id, { body });
      setMessages((m) => [...m, message]);
    }
  };

  const onType = (e) => {
    setText(e.target.value);
    if (socket && active) socket.emit('typing', { conversationId: active._id, isTyping: true });
  };
  const stopTyping = () => {
    if (socket && active) socket.emit('typing', { conversationId: active._id, isTyping: false });
  };

  const other = (c) => c.otherParty || c.participants?.find((p) => p._id !== user._id);

  return (
    <div className="grid h-[calc(100vh-9rem)] grid-cols-1 gap-4 md:grid-cols-[320px_1fr]">
      {/* List */}
      <div className={`card flex flex-col overflow-hidden ${active ? 'hidden md:flex' : 'flex'}`}>
        <div className="border-b border-slate-100 px-4 py-3 font-semibold text-slate-800">Messages</div>
        {loadingList ? (
          <div className="flex flex-1 items-center justify-center"><Spinner /></div>
        ) : conversations.length ? (
          <ul className="flex-1 overflow-y-auto">
            {conversations.map((c) => {
              const o = other(c);
              return (
                <li key={c._id}>
                  <button
                    onClick={() => openConversation(c._id)}
                    className={`flex w-full items-center gap-3 border-b border-slate-50 px-4 py-3 text-left hover:bg-slate-50 ${
                      active?._id === c._id ? 'bg-brand-50' : ''
                    }`}
                  >
                    <Avatar name={o?.name} size={40} />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between">
                        <span className="truncate font-medium text-slate-800">{o?.name || 'User'}</span>
                        <span className="text-[10px] text-slate-400">{timeAgo(c.lastMessageAt)}</span>
                      </div>
                      <div className="truncate text-xs text-slate-500">{c.lastMessage || 'Start chatting'}</div>
                    </div>
                    {c.unreadCount > 0 && <span className="badge bg-accent-500 text-white">{c.unreadCount}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <EmptyState icon={IconMessage} title="No conversations" subtitle="Chats appear here once you apply or get an application." />
        )}
      </div>

      {/* Thread */}
      <div className={`card flex flex-col overflow-hidden ${active ? 'flex' : 'hidden md:flex'}`}>
        {active ? (
          <>
            <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3">
              <button className="md:hidden" onClick={() => { setActive(null); activeRef.current = null; }}><IconArrowLeft className="h-5 w-5 text-ink-500" /></button>
              <Avatar name={other(active)?.name} size={36} />
              <div>
                <div className="font-semibold text-slate-800">{other(active)?.name || 'Conversation'}</div>
                {active.campaign?.title && <div className="text-xs text-slate-400">{active.campaign.title}</div>}
              </div>
            </div>

            <div className="flex-1 space-y-2 overflow-y-auto bg-slate-50 p-4">
              {loadingMsgs ? (
                <div className="flex h-full items-center justify-center"><Spinner /></div>
              ) : (
                messages.map((m) => {
                  const mine = String(m.sender?._id || m.sender) === String(user._id);
                  return (
                    <div key={m._id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${mine ? 'bg-brand-600 text-white' : 'bg-white text-slate-700 shadow-sm'}`}>
                        {m.body}
                        <div className={`mt-0.5 text-[10px] ${mine ? 'text-white/60' : 'text-slate-400'}`}>{timeAgo(m.createdAt)}</div>
                      </div>
                    </div>
                  );
                })
              )}
              {typing && <div className="text-xs text-slate-400">typing…</div>}
              <div ref={endRef} />
            </div>

            <form onSubmit={send} className="flex items-center gap-2 border-t border-slate-100 p-3 safe-bottom">
              <input
                className="input flex-1"
                placeholder="Type a message…"
                value={text}
                onChange={onType}
                onBlur={stopTyping}
              />
              <button className="btn-primary" disabled={!text.trim()}><IconSend className="h-4 w-4" /></button>
            </form>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center">
            <EmptyState icon={IconMessage} title="Select a conversation" subtitle="Choose a chat to start messaging." />
          </div>
        )}
      </div>
    </div>
  );
}
