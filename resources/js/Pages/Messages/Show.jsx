import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MessageSidebar from '@/Components/MessageSidebar';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';

export default function Show({ conversation, conversations = [], requests = [], auth_role }) {
    const { auth } = usePage().props;
    const [activeTab, setActiveTab] = useState('active');
    const scrollRef = useRef(null);

    const { data, setData, post, processing, reset, errors } = useForm({
        body: '',
        conversation_id: conversation.id,
    });

    const displayConversations = activeTab === 'active' ? (conversations.length > 0 ? conversations : [conversation]) : requests;

    // Scroll to bottom on load or new message
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [conversation.messages]);

    const submit = (e) => {
        e.preventDefault();
        post(route('messages.store'), {
            onSuccess: () => reset('body'),
            preserveScroll: true,
        });
    };

    const acceptRequest = () => {
        post(route('messages.accept', conversation.id), {
            preserveScroll: true,
        });
    };

    const otherUser = auth_role === 'agent' ? conversation.applicant : conversation.agent;
    const isPending = conversation.status === 'pending' && auth_role === 'applicant';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Messages
                </h2>
            }
        >
            <Head title={`Chat with ${otherUser.name}`} />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex h-[600px] overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        
                        <MessageSidebar 
                            conversations={conversations}
                            requests={requests}
                            auth_role={auth_role}
                            activeConversationId={conversation.id}
                        />

                        {/* Chat Area */}
                        <div className="flex flex-1 flex-col bg-white">
                            {/* Chat Header */}
                            <div className="flex items-center justify-between border-b border-gray-200 bg-white p-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-indigo-700 font-bold uppercase">
                                        {otherUser?.name?.substring(0, 2) || '??'}
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-bold text-gray-900">{otherUser?.name || 'Unknown User'}</h3>
                                        <p className="text-xs text-gray-500">
                                            {auth_role === 'agent' ? 'Applicant' : 'Estate Agent'} 
                                            {isPending && <span className="ml-2 font-bold text-amber-500 uppercase tracking-tighter">Pending Approval</span>}
                                        </p>
                                    </div>
                                </div>
                                <div className="hidden sm:block text-right">
                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Subject Property</p>
                                    <Link
                                        href={route('properties.show', conversation.general_property_id)}
                                        className="inline-flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1 text-xs font-bold text-indigo-700 transition hover:bg-indigo-100"
                                    >
                                        <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                                        </svg>
                                        {conversation.general_property.name}
                                    </Link>
                                </div>
                            </div>

                            {/* Messages Container */}
                            <div 
                                ref={scrollRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/30"
                            >
                                {conversation.messages.map((msg) => {
                                    const isMe = msg.sender_id === auth.user.id;
                                    return (
                                        <div 
                                            key={msg.id}
                                            className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                        >
                                            <div className={`max-w-[70%] rounded-2xl px-4 py-2 shadow-sm ${
                                                isMe 
                                                ? 'bg-indigo-600 text-white rounded-tr-none' 
                                                : 'bg-white text-gray-800 rounded-tl-none border border-gray-200'
                                            }`}>
                                                <p className="text-sm leading-relaxed">{msg.body}</p>
                                                <div className={`mt-1 flex items-center justify-end gap-1 text-[10px] ${isMe ? 'text-indigo-100' : 'text-gray-400'}`}>
                                                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    {isMe && msg.read_at && (
                                                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                                                        </svg>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Footer / Input */}
                            <div className="border-t border-gray-200 p-4">
                                {isPending ? (
                                    <div className="rounded-lg bg-amber-50 border-2 border-amber-200 p-4 text-center">
                                        <p className="text-sm font-medium text-amber-800 mb-3">
                                            This agent has sent you a property suggestion. Accept the request to start chatting!
                                        </p>
                                        <button
                                            onClick={acceptRequest}
                                            disabled={processing}
                                            className="inline-flex items-center rounded-md bg-amber-600 px-4 py-2 text-sm font-bold text-white shadow-sm hover:bg-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 transition disabled:opacity-50"
                                        >
                                            Accept Chat Request
                                        </button>
                                    </div>
                                ) : (
                                    <form onSubmit={submit} className="flex gap-4">
                                        <textarea
                                            value={data.body}
                                            onChange={e => setData('body', e.target.value)}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' && !e.shiftKey) {
                                                    e.preventDefault();
                                                    submit(e);
                                                }
                                            }}
                                            placeholder="Write a message..."
                                            className="block w-11/12 resize-none rounded-xl border-gray-200 bg-gray-50 focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                                            rows="2"
                                            disabled={processing}
                                        ></textarea>
                                        <button
                                            type="submit"
                                            disabled={processing || !data.body.trim()}
                                            className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                                        >
                                            <svg className="h-6 w-6 rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                            </svg>
                                        </button>
                                    </form>
                                )}
                                {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
