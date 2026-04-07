import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import MessageSidebar from '@/Components/MessageSidebar';
import { Head } from '@inertiajs/react';

export default function Index({ conversations, requests, auth_role }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Messages
                </h2>
            }
        >
            <Head title="Messages" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="flex h-[600px] overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <MessageSidebar 
                            conversations={conversations}
                            requests={requests}
                            auth_role={auth_role}
                        />

                        {/* Detail View (Empty State) */}
                        <div className="flex flex-1 flex-col bg-white">
                            <div className="flex flex-1 flex-col items-center justify-center p-12 text-center text-gray-500">
                                <div className="mb-6 rounded-full bg-gray-50 p-6">
                                    <svg className="h-16 w-16 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                                    </svg>
                                </div>
                                <h4 className="text-xl font-bold text-gray-900">Your Inbox</h4>
                                <p className="mt-2 max-w-xs text-sm">
                                    Select a user and then a property conversation from the sidebar to view messages.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
