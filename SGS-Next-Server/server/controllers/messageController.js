import Message from "../models/messageModel.js";
import User from "../models/userModel.js";
import Counselor from "../models/counselorModel.js";

// @desc Get active chat conversations for logged-in user
// @route GET /api/messages/conversations
// @access Private
export const getConversations = async (req, res) => {
    try {
        const currentUserId = req.user.id;

        // Find all messages involving the current user
        const messages = await Message.find({
            $or: [{ sender: currentUserId }, { receiver: currentUserId }]
        }).sort({ createdAt: -1 });

        const partnersMap = new Map();

        for (const msg of messages) {
            const partnerId = msg.sender.toString() === currentUserId ? msg.receiver.toString() : msg.sender.toString();
            if (!partnersMap.has(partnerId)) {
                partnersMap.set(partnerId, {
                    lastMessage: msg.content,
                    lastMessageTime: msg.createdAt,
                    unreadCount: 0
                });
            }
            if (msg.receiver.toString() === currentUserId && !msg.isRead) {
                const partnerData = partnersMap.get(partnerId);
                partnerData.unreadCount += 1;
            }
        }

        // Fetch partner user profiles
        const partnerIds = Array.from(partnersMap.keys());
        const users = await User.find({ _id: { $in: partnerIds } }).select("name email profilePic userType qualification location");

        let conversationList = users.map(u => {
            const partnerMeta = partnersMap.get(u._id.toString());
            return {
                user: u,
                lastMessage: partnerMeta?.lastMessage || "",
                lastMessageTime: partnerMeta?.lastMessageTime,
                unreadCount: partnerMeta?.unreadCount || 0
            };
        });

        // If targetUserId passed in query and not yet in conversationList, prepend them
        const targetUserId = req.query.targetUserId;
        if (targetUserId && targetUserId !== currentUserId && !partnerIds.includes(targetUserId)) {
            const targetUser = await User.findById(targetUserId).select("name email profilePic userType qualification location");
            if (targetUser) {
                conversationList.unshift({
                    user: targetUser,
                    lastMessage: "Start a mentorship conversation...",
                    lastMessageTime: new Date(),
                    unreadCount: 0
                });
            }
        }

        // If user has fewer than 2 conversations, append verified active counselors so they can easily chat
        if (conversationList.length < 2) {
            const activeCounselors = await Counselor.find({ status: "accepted" }).populate("user", "name email profilePic userType qualification location");
            for (const cn of activeCounselors) {
                if (cn.user && cn.user._id.toString() !== currentUserId && !conversationList.some(c => c.user?._id?.toString() === cn.user._id.toString())) {
                    conversationList.push({
                        user: cn.user,
                        lastMessage: "Start a mentorship conversation...",
                        lastMessageTime: cn.createdAt,
                        unreadCount: 0
                    });
                }
            }
        }

        res.status(200).json(conversationList);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

// @desc Get message history between logged-in user and another user
// @route GET /api/messages/:otherUserId
// @access Private
export const getMessageHistory = async (req, res) => {
    try {
        const currentUserId = req.user.id;
        const otherUserId = req.params.otherUserId;

        const messages = await Message.find({
            $or: [
                { sender: currentUserId, receiver: otherUserId },
                { sender: otherUserId, receiver: currentUserId }
            ]
        }).sort({ createdAt: 1 }).populate("sender", "name profilePic").populate("receiver", "name profilePic");

        // Mark incoming messages as read
        await Message.updateMany(
            { sender: otherUserId, receiver: currentUserId, isRead: false },
            { $set: { isRead: true } }
        );

        res.status(200).json(messages);
    } catch (error) {
        res.status(500);
        throw new Error(error.message);
    }
};

const messageController = { getConversations, getMessageHistory };
export default messageController;
