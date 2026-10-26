import { useState, useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import Navbar from '../components/Navbar';
import Sidebar from '../components/Sidebar';
import ChatBubble from '../components/ChatBubble';
import Button from '../components/Button';
import StatusBadge from '../components/StatusBadge';
import messageService from '../services/messageService';
import { getSocket } from '../services/socketService';

export default function ChatPage() {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState([]);
  const [activePartner, setActivePartner] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  const [loadingHistory, setLoadingHistory] = useState(false);

  const socketRef = useRef(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const targetUserId = location.state?.targetUserId;

  // Auto-scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations
  useEffect(() => {
    if (!user?.token) return;

    let isMounted = true;
    messageService.fetchConversations(user.token, targetUserId)
      .then((data) => {
        if (!isMounted) return;
        setConversations(data);
        if (data.length > 0) {
          const matching = targetUserId ? data.find((c) => c.user?._id === targetUserId) : null;
          setActivePartner(matching ? matching.user : data[0].user);
        }
      })
      .catch((err) => {
        console.error("Failed to load conversations:", err);
      });

    return () => {
      isMounted = false;
    };
  }, [user?.token, targetUserId]);

  // Connect & manage Socket.io singleton lifecycle
  useEffect(() => {
    if (!user?.token) return;

    const socket = getSocket(user.token);
    if (!socket) return;
    socketRef.current = socket;

    const handleUserOnline = ({ userId }) => {
      setOnlineUserIds((prev) => new Set([...prev, userId]));
    };

    const handleUserOffline = ({ userId }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(userId);
        return next;
      });
    };

    const handleReceiveMessage = (incoming) => {
      const incomingPartnerId = incoming.sender === user._id ? incoming.receiver : incoming.sender;

      setActivePartner((currentPartner) => {
        if (currentPartner && currentPartner._id === incomingPartnerId) {
          setMessages((prev) => {
            if (prev.some((m) => m._id === incoming._id)) return prev;
            return [...prev, incoming];
          });
        }
        return currentPartner;
      });

      setConversations((prev) =>
        prev.map((c) => {
          if (c.user?._id === incomingPartnerId) {
            return {
              ...c,
              lastMessage: incoming.content,
              lastMessageTime: incoming.createdAt,
              unreadCount: 0
            };
          }
          return c;
        })
      );
    };

    const handleMessageError = (err) => {
      toast.error(err?.error || "Error sending message");
    };

    socket.on("user_online", handleUserOnline);
    socket.on("user_offline", handleUserOffline);
    socket.on("receive_message", handleReceiveMessage);
    socket.on("message_error", handleMessageError);

    return () => {
      socket.off("user_online", handleUserOnline);
      socket.off("user_offline", handleUserOffline);
      socket.off("receive_message", handleReceiveMessage);
      socket.off("message_error", handleMessageError);
    };
  }, [user?._id, user?.token]);

  // When active partner changes, join room & fetch message history
  useEffect(() => {
    if (!activePartner?._id || !user?._id || !user?.token) return;

    const socket = socketRef.current;
    if (socket) {
      if (socket.connected) {
        socket.emit("join_room", {
          senderId: user._id,
          receiverId: activePartner._id
        });
      } else {
        const onConnect = () => {
          socket.emit("join_room", {
            senderId: user._id,
            receiverId: activePartner._id
          });
          socket.off("connect", onConnect);
        };
        socket.on("connect", onConnect);
      }
    }

    setLoadingHistory(true);
    messageService.fetchMessageHistory(activePartner._id, user.token)
      .then((history) => {
        setMessages(history);
        setLoadingHistory(false);
      })
      .catch((err) => {
        console.error("Failed to load message history:", err);
        setLoadingHistory(false);
      });
  }, [activePartner?._id, user?._id, user?.token]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !activePartner?._id) return;

    const socket = socketRef.current;
    if (!socket || !socket.connected) {
      toast.error("Chat is connecting, please try again in a moment.");
      return;
    }

    socket.emit("send_message", {
      senderId: user._id,
      receiverId: activePartner._id,
      content: newMessage.trim()
    });

    setNewMessage('');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      toast.info(`Attachment "${file.name}" selected. Sharing link via chat!`);
      const socket = socketRef.current;
      if (socket && socket.connected && activePartner?._id) {
        socket.emit("send_message", {
          senderId: user._id,
          receiverId: activePartner._id,
          content: `📎 Shared Document: ${file.name} (uploaded for mentorship session)`
        });
      }
    }
  };

  const filteredConversations = conversations.filter((c) => {
    const nameMatch = c.user?.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const roleMatch = c.user?.qualification?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.user?.userType?.toLowerCase().includes(searchQuery.toLowerCase());
    const lastMsgMatch = c.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase());
    return nameMatch || roleMatch || lastMsgMatch;
  });

  const getInitials = (name) => {
    if (!name) return 'CB';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? '' : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const isPartnerOnline = activePartner?._id && onlineUserIds.has(activePartner._id);
  const effectiveRole = (user?.userType || 'student').toLowerCase();
  const partnerRoleUpper = (activePartner?.userType || '').toUpperCase();
  const partnerRoleLabel = partnerRoleUpper === 'COUNSELOR'
    ? 'Verified Counselor'
    : partnerRoleUpper === 'ADMIN'
      ? 'CareerBridge Admin'
      : 'Student Mentee';

  return (
    <div className="min-h-screen bg-parchment flex flex-col">
      <Navbar activePage="messages" />

      <div className="flex-1 flex">
        <Sidebar activeTab="counselor_messages" role={effectiveRole} />

        <main className="flex-1 p-8 bg-grid-pattern overflow-y-auto flex">
          <div className="w-full bg-parchment-card border-4 border-navy rounded-3xl shadow-pop flex flex-col lg:flex-row overflow-hidden min-h-[650px]">
            {/* Left Chat Sidebar */}
            <div className="w-full lg:w-80 border-b-4 lg:border-b-0 lg:border-r-4 border-navy bg-parchment p-4 flex flex-col justify-between">
              <div>
                <div className="font-grotesk font-extrabold text-lg text-navy mb-3">Messages & Chats</div>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full bg-white border-2 border-navy rounded-xl px-3 py-2 font-body text-xs text-navy shadow-pop-sm mb-4 focus:outline-none"
                />

                <div className="space-y-2 max-h-[460px] overflow-y-auto">
                  {filteredConversations.length === 0 ? (
                    <div className="text-center py-6 text-xs font-mono text-navy-muted">
                      No conversations found.
                    </div>
                  ) : (
                    filteredConversations.map((c) => {
                      const isActive = activePartner?._id === c.user?._id;
                      const partnerName = c.user?.name || 'Career Mentor';
                      const isCn = (c.user?.userType || '').toUpperCase() === 'COUNSELOR';
                      const partnerRole = c.user?.qualification || (isCn ? 'Verified Counselor' : 'Student Peer');
                      const avatarInitials = getInitials(partnerName);

                      return (
                        <div
                          key={c.user?._id || Math.random()}
                          onClick={() => setActivePartner(c.user)}
                          className={`p-3 rounded-2xl border-2 border-navy cursor-pointer transition-all flex items-center justify-between ${
                            isActive ? 'bg-yellow shadow-pop-sm' : 'bg-white hover:bg-parchment-dim'
                          }`}
                        >
                          <div className="flex items-center space-x-3 overflow-hidden">
                            <div className="w-10 h-10 rounded-xl bg-sky border-2 border-navy flex items-center justify-center font-grotesk font-extrabold text-sm text-navy shadow-pop-sm shrink-0">
                              {avatarInitials}
                            </div>
                            <div className="truncate">
                              <div className="font-grotesk font-extrabold text-sm text-navy truncate">{partnerName}</div>
                              <div className="font-mono text-[10px] text-navy-muted truncate">{partnerRole}</div>
                            </div>
                          </div>
                          {c.unreadCount > 0 && (
                            <span className="w-5 h-5 rounded-full bg-rust text-white font-mono text-[10px] font-bold flex items-center justify-center border border-navy shrink-0 ml-2">
                              {c.unreadCount}
                            </span>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              <div className="bg-rust-container border-2 border-navy p-3 rounded-xl mt-4 text-xs font-mono">
                <span className="font-bold text-navy">💡 Quick Tip:</span> Share your GitHub link before every mentorship session.
              </div>
            </div>

            {/* Right Main Chat Window */}
            <div className="flex-1 flex flex-col justify-between bg-parchment-card">
              {/* Chat Window Header */}
              <div className="p-4 border-b-4 border-navy bg-yellow/30 flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-xl bg-sky border-2 border-navy flex items-center justify-center font-grotesk font-extrabold text-sm text-navy">
                    {getInitials(activePartner?.name)}
                  </div>
                  <div>
                    <h2 className="font-grotesk font-extrabold text-base text-navy">
                      {activePartner?.name || 'Select a conversation'}
                    </h2>
                    <p className="font-mono text-[10px] text-navy-muted">
                      {isPartnerOnline ? '🟢 Online' : '⚪ Offline'} • {activePartner?.qualification || partnerRoleLabel}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <StatusBadge
                    text={partnerRoleUpper === 'COUNSELOR' ? "ACTIVE MENTORSHIP" : "STUDENT SESSION"}
                    status="success"
                  />
                  {effectiveRole === 'student' && partnerRoleUpper === 'COUNSELOR' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        toast.info("Opening counselor directory for extended session booking...");
                        navigate('/auth/counselors');
                      }}
                    >
                      Book Extension
                    </Button>
                  )}
                </div>
              </div>

              {/* Chat Messages Log */}
              <div className="p-6 overflow-y-auto space-y-4 max-h-[460px] bg-grid-pattern min-h-[350px]">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <p className="font-mono text-sm text-navy animate-pulse">Loading message history...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-48 text-center">
                    <span className="text-3xl mb-2">💬</span>
                    <p className="font-grotesk font-bold text-navy text-sm">Start your mentorship conversation</p>
                    <p className="font-body text-xs text-navy-muted mt-1">
                      Say hello, share your questions, or drop a project link below!
                    </p>
                  </div>
                ) : (
                  messages.map((msg, index) => {
                    const senderId = msg.sender?._id || msg.sender;
                    const isSelf = senderId === user?._id;
                    const senderName = isSelf ? (user?.name || 'You') : (activePartner?.name || 'Mentor');
                    const timeString = formatTime(msg.createdAt);

                    return (
                      <ChatBubble
                        key={msg._id || index}
                        sender={senderName}
                        time={timeString}
                        message={msg.content}
                        isSelf={isSelf}
                      />
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Chat Input Bar */}
              <div className="p-4 border-t-4 border-navy bg-parchment">
                <form onSubmit={handleSendMessage} className="flex items-center space-x-3">
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    title="Attach document or resume"
                    className="p-2.5 bg-white border-2 border-navy rounded-xl hover:bg-parchment-dim shadow-pop-sm font-mono text-sm transition-all"
                  >
                    📎
                  </button>
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message here..."
                    className="flex-1 bg-white border-3 border-navy rounded-xl px-4 py-2.5 font-body text-sm text-navy shadow-pop-sm focus:outline-none"
                  />
                  <Button variant="primary" size="md" type="submit">
                    Send Message ➔
                  </Button>
                </form>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
