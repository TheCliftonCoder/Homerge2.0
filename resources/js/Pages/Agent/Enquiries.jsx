import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';

export default function AgentEnquiries({ auth, enquiries }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Enquiries" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">Property Enquiries</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            Enquiries for your properties ({enquiries.length})
                        </p>
                    </div>

                    {enquiries.length > 0 ? (
                        <div className="space-y-4">
                            {enquiries.map((enquiry) => (
                                <div key={enquiry.id} className="rounded-2xl bg-white p-6 shadow-xl">
                                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                                        {/* Property Info */}
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Property</h3>
                                            <div className="mt-2 flex items-center gap-4">
                                                {enquiry.property.images && enquiry.property.images[0] && (
                                                    <img
                                                        src={`/storage/${enquiry.property.images[0].image_path}`}
                                                        alt={enquiry.property.location}
                                                        className="h-16 w-16 rounded-lg object-cover"
                                                    />
                                                )}
                                                <div>
                                                    <Link
                                                        href={`/properties/${enquiry.property.id}`}
                                                        className="text-lg font-bold text-gray-900 hover:text-indigo-600"
                                                    >
                                                        {enquiry.property.location}
                                                    </Link>
                                                    <p className="text-base font-semibold text-indigo-600">
                                                        £{enquiry.property.price.toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Applicant Info */}
                                        <div>
                                            <h3 className="text-sm font-medium text-gray-500">Applicant Details</h3>
                                            <div className="mt-2 space-y-2">
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Name:</p>
                                                    <p className="text-base font-semibold text-gray-900">{enquiry.user.name}</p>
                                                </div>
                                                <div>
                                                    <p className="text-sm font-medium text-gray-700">Email:</p>
                                                    <a
                                                        href={`mailto:${enquiry.user.email}`}
                                                        className="text-base font-semibold text-indigo-600 hover:text-indigo-700"
                                                    >
                                                        {enquiry.user.email}
                                                    </a>
                                                </div>
                                                {enquiry.contact_phone && (
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-700">Phone:</p>
                                                        <a
                                                            href={`tel:${enquiry.contact_phone}`}
                                                            className="text-base font-semibold text-indigo-600 hover:text-indigo-700"
                                                        >
                                                            {enquiry.contact_phone}
                                                        </a>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Message and Preferred Date */}
                                    <div className="mt-6 border-t border-gray-200 pt-4">
                                        {enquiry.message && (
                                            <div className="mb-4">
                                                <p className="text-sm font-medium text-gray-700">Message:</p>
                                                <p className="mt-1 text-gray-900">{enquiry.message}</p>
                                            </div>
                                        )}
                                        <div className="flex items-center justify-between text-sm text-gray-600">
                                            {enquiry.preferred_date && (
                                                <p>
                                                    <span className="font-medium">Preferred Viewing Date:</span>{' '}
                                                    {new Date(enquiry.preferred_date).toLocaleString()}
                                                </p>
                                            )}
                                            <p className="text-xs text-gray-500">
                                                Received on {new Date(enquiry.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
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
                                    d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
                                />
                            </svg>
                            <h3 className="mt-4 text-xl font-semibold text-gray-900">No enquiries yet</h3>
                            <p className="mt-2 text-gray-600">You haven't received any viewing enquiries for your properties</p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
