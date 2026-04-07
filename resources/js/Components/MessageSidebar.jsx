import { Link, usePage } from '@inertiajs/react';
import { useState, useMemo, useEffect } from 'react';

export default function MessageSidebar({ conversations, requests = [], auth_role, activeConversationId = null }) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState('active');
    const [expandedUsers, setExpandedUsers] = useState(new Set());

    // Grouping function: Groups conversations by the ID of the person the auth user is talking to.
    const grouped = useMemo(() => {
        const source = activeTab === 'active' ? conversations : requests;
        const groupAcc = source.reduce((acc, convo) => {
            const otherUser = auth_role === 'agent' ? convo.applicant : convo.agent;
            if (!otherUser) return acc;
            
            const userId = otherUser.id;
            if (!acc[userId]) {
                acc[userId] = {
                    user: otherUser,
                    threads: []
                };
            }
            acc[userId].threads.push(convo);
            return acc;
        }, {});
        
        // Convert to array and sort by the most recent thread update in each group
        return Object.values(groupAcc).sort((a, b) => {
            const aLatest = Math.max(...a.threads.map(t => new Date(t.updated_at).getTime()));
            const bLatest = Math.max(...b.threads.map(t => new Date(t.updated_at).getTime()));
            return bLatest - aLatest;
        });
    }, [conversations, requests, activeTab, auth_role]);

    // Auto-expand the user belonging to the active conversation on mount or change
    useEffect(() => {
        if (activeConversationId) {
            const activeConvo = conversations.find(c => c.id === activeConversationId) || requests.find(c => c.id === activeConversationId);
            if (activeConvo) {
                const otherUser = auth_role === 'agent' ? activeConvo.applicant : activeConvo.agent;
                if (otherUser) {
                    setExpandedUsers(prev => new Set(prev).add(otherUser.id));
                }
            }
        }
    }, [activeConversationId, conversations, requests, auth_role]);

    const toggleUser = (userId) => {
        setExpandedUsers(prev => {
            const next = new Set(prev);
            if (next.has(userId)) next.delete(userId);
            else next.add(userId);
            return next;
        });
    };

    return (
        <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-gray-50 flex flex-col h-full overflow-hidden">
            {/* Tabs (only for applicant role and if there are requests) */}
            {auth_role === 'applicant' && requests.length > 0 && (
                <div className="flex border-b border-gray-200 bg-white">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`flex-1 py-3 text-sm font-bold transition ${
                            activeTab === 'active'
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Active
                    </button>
                    <button
                        onClick={() => setActiveTab('requests')}
                        className={`flex-1 py-3 text-sm font-bold flex items-center justify-center gap-2 transition ${
                            activeTab === 'requests'
                                ? 'bg-white text-indigo-600 border-b-2 border-indigo-600 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                        }`}
                    >
                        Requests
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                            {requests.length}
                        </span>
                    </button>
                </div>
            )}

            {/* Sidebar Header / Context */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center justify-between">
                <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">
                    {activeTab === 'active' ? 'My Conversations' : 'Message Requests'}
                </h3>
                {activeConversationId && (
                   <Link href={route('messages.index')} className="text-[10px] font-bold text-indigo-600 uppercase hover:text-indigo-800 transition">
                       Inbox View
                   </Link>
                )}
            </div>

            {/* Scrollable List */}
            <div className="flex-1 overflow-y-auto">
                {grouped.length === 0 ? (
                    <div className="flex h-full flex-col items-center justify-center p-8 text-center text-gray-400">
                        <svg className="mb-4 h-12 w-12 opacity-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <p className="text-sm font-medium">No {activeTab} threads found.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {grouped.map((group) => {
                            const isExpanded = expandedUsers.has(group.user.id);
                            const totalUnread = group.threads.reduce((sum, t) => {
                                const lastMsg = t.latest_message;
                                return sum + (lastMsg && lastMsg.sender_id !== auth.user.id && !lastMsg.read_at ? 1 : 0);
                            }, 0);

                            return (
                                <div key={group.user.id} className="bg-white">
                                    {/* User Group Header */}
                                    <button 
                                        onClick={() => toggleUser(group.user.id)}
                                        className={`flex w-full items-center justify-between p-4 transition-all duration-200 ${
                                            isExpanded ? 'bg-indigo-50/30' : 'hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold uppercase shadow-sm">
                                                {group.user?.name?.substring(0, 2) || '??'}
                                            </div>
                                            <div className="min-w-0 text-left">
                                                <p className="truncate text-sm font-bold text-gray-900 leading-none mb-1">
                                                    {group.user?.name || 'Unknown User'}
                                                </p>
                                                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-tight">
                                                    {group.threads.length} {group.threads.length === 1 ? 'Message' : 'Messages'} context
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            {totalUnread > 0 && !isExpanded && (
                                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white shadow-sm ring-2 ring-white">
                                                    {totalUnread}
                                                </span>
                                            )}
                                            <svg 
                                                className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                                                fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                                            </svg>
                                        </div>
                                    </button>

                                    {/* Nested Threads */}
                                    {isExpanded && (
                                        <div className="bg-gray-50/50 border-t border-gray-100">
                                            {group.threads.map(convo => {
                                                const isActive = convo.id === activeConversationId;
                                                const lastMsg = convo.latest_message;
                                                const hasUnread = lastMsg && lastMsg.sender_id !== auth.user.id && !lastMsg.read_at;

                                                return (
                                                    <Link
                                                        key={convo.id}
                                                        href={route('messages.show', convo.id)}
                                                        className={`block border-l-4 py-3 pl-8 pr-4 transition-all duration-200 ${
                                                            isActive 
                                                            ? 'border-indigo-600 bg-white shadow-inner translate-x-0' 
                                                            : 'border-transparent hover:bg-white hover:pl-9'
                                                        }`}
                                                        preserveScroll
                                                    >
                                                        <div className="flex items-center justify-between gap-1">
                                                            <p className={`truncate text-xs font-bold leading-tight ${isActive ? 'text-indigo-600' : 'text-gray-600'}`}>
                                                                {convo.general_property?.name || 'Property Suggestion'}
                                                            </p>
                                                            <div className="flex items-center gap-1.5 flex-shrink-0">
                                                                {hasUnread && <div className="h-2 w-2 rounded-full bg-indigo-600 animate-pulse"></div>}
                                                                {lastMsg && (
                                                                    <span className="text-[9px] font-medium text-gray-400">
                                                                        {new Date(lastMsg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </div>
                                                        {lastMsg && (
                                                            <p className="mt-1 truncate text-[11px] text-gray-400 font-medium">
                                                                {lastMsg.sender_id === auth.user.id ? <span className="text-gray-300">You: </span> : ''}
                                                                {lastMsg.body}
                                                            </p>
                                                        )}
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
