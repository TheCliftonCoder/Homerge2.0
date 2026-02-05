import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import { Head, router } from '@inertiajs/react';

export default function AdminDashboard({ pendingRequests }) {
    const handleApprove = (id) => {
        if (confirm('Are you sure you want to approve this agent request?')) {
            router.post(route('admin.approve', id));
        }
    };

    const handleDecline = (id) => {
        if (confirm('Are you sure you want to decline this agent request?')) {
            router.post(route('admin.decline', id));
        }
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Admin Dashboard - Pending Agent Requests
                </h2>
            }
        >
            <Head title="Admin Dashboard" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <div className="p-6 text-gray-900">
                            {pendingRequests.length === 0 ? (
                                <p className="text-gray-600">
                                    No pending agent requests.
                                </p>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Name
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Email
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Requested Date
                                                </th>
                                                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200 bg-white">
                                            {pendingRequests.map((request) => (
                                                <tr key={request.id}>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-gray-900">
                                                        {request.name}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                        {request.email}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-500">
                                                        {new Date(
                                                            request.created_at,
                                                        ).toLocaleDateString()}
                                                    </td>
                                                    <td className="whitespace-nowrap px-6 py-4 text-sm font-medium">
                                                        <button
                                                            onClick={() =>
                                                                handleApprove(
                                                                    request.id,
                                                                )
                                                            }
                                                            className="mr-3 rounded bg-green-600 px-4 py-2 text-white hover:bg-green-700"
                                                        >
                                                            Approve
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleDecline(
                                                                    request.id,
                                                                )
                                                            }
                                                            className="rounded bg-red-600 px-4 py-2 text-white hover:bg-red-700"
                                                        >
                                                            Decline
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
