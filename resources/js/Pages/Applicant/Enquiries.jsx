import { Head, Link, router } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function Enquiries({ auth, enquiries }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Enquiries" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">My Property Enquiries</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            {enquiries.length} {enquiries.length === 1 ? 'enquiry' : 'enquiries'} sent
                        </p>
                    </div>

                    {enquiries.length > 0 ? (
                        <div className="space-y-4">
                            {enquiries.map((enquiry) => (
                                <div key={enquiry.id} className="rounded-2xl bg-white p-6 shadow-xl">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-4">
                                                {enquiry.property.images && enquiry.property.images[0] && (
                                                    <img
                                                        src={`/storage/${enquiry.property.images[0].image_path}`}
                                                        alt={enquiry.property.location}
                                                        className="h-20 w-20 rounded-lg object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <Link
                                                        href={`/properties/${enquiry.property.id}`}
                                                        className="text-xl font-bold text-gray-900 hover:text-indigo-600"
                                                    >
                                                        {enquiry.property.location}
                                                    </Link>
                                                    <p className="text-lg font-semibold text-indigo-600">
                                                        £{enquiry.property.price.toLocaleString()}
                                                    </p>
                                                    <p className="text-sm text-gray-600">
                                                        Agent: {enquiry.property.agent.name}
                                                    </p>
                                                </div>
                                            </div>
                                            {enquiry.message && (
                                                <div className="mt-4">
                                                    <p className="text-sm font-medium text-gray-700">Your Message:</p>
                                                    <p className="mt-1 text-gray-600">{enquiry.message}</p>
                                                </div>
                                            )}
                                            {enquiry.preferred_date && (
                                                <p className="mt-2 text-sm text-gray-600">
                                                    <span className="font-medium">Preferred Date:</span>{' '}
                                                    {new Date(enquiry.preferred_date).toLocaleString()}
                                                </p>
                                            )}
                                            {enquiry.contact_phone && (
                                                <p className="mt-1 text-sm text-gray-600">
                                                    <span className="font-medium">Contact:</span> {enquiry.contact_phone}
                                                </p>
                                            )}
                                            <p className="mt-2 text-xs text-gray-500">
                                                Sent on {new Date(enquiry.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => {
                                                if (confirm('Are you sure you want to cancel this enquiry?')) {
                                                    router.delete(`/enquiries/${enquiry.id}`);
                                                }
                                            }}
                                            className="rounded-lg border-2 border-red-300 px-4 py-2 font-semibold text-red-600 transition-colors hover:bg-red-50"
                                        >
                                            Cancel Enquiry
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-white p-12 text-center shadow-xl">
                            <svg
                                className="mx-auto h-16 w-16 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                                />
                            </svg>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">No enquiries yet</h3>
                            <p className="mt-2 text-gray-600">You haven't enquired about any properties</p>
                            <Link
                                href="/search"
                                className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
                            >
                                Search Properties
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
