import { Head, Link, router } from '@inertiajs/react';
import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PropertyCard from '@/Components/PropertyCard';

export default function ApplicantDashboard({ auth, favourites, enquiries }) {
    const [activeTab, setActiveTab] = useState('favourites');

    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Dashboard" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">My Dashboard</h1>
                        <p className="mt-2 text-lg text-gray-600">Manage your favourite properties and viewing enquiries</p>
                    </div>

                    {/* Tab Navigation */}
                    <div className="mb-8 flex gap-4 border-b border-gray-200">
                        <button
                            onClick={() => setActiveTab('favourites')}
                            className={`pb-4 px-6 text-lg font-semibold transition-colors ${activeTab === 'favourites'
                                    ? 'border-b-4 border-indigo-600 text-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Favourites
                            {favourites?.length > 0 && (
                                <span className="ml-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-600">
                                    {favourites.length}
                                </span>
                            )}
                        </button>
                        <button
                            onClick={() => setActiveTab('enquiries')}
                            className={`pb-4 px-6 text-lg font-semibold transition-colors ${activeTab === 'enquiries'
                                    ? 'border-b-4 border-indigo-600 text-indigo-600'
                                    : 'text-gray-600 hover:text-gray-900'
                                }`}
                        >
                            Property Enquiries
                            {enquiries?.length > 0 && (
                                <span className="ml-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-bold text-indigo-600">
                                    {enquiries.length}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* Favourites Tab */}
                    {activeTab === 'favourites' && (
                        <div>
                            {favourites && favourites.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                                    {favourites.map((property) => (
                                        <PropertyCard key={property.id} property={property} isFavourited={true} />
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
                                            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                        />
                                    </svg>
                                    <h3 className="mt-4 text-xl font-semibold text-gray-900">No favourite properties yet</h3>
                                    <p className="mt-2 text-gray-600">Start browsing properties and add them to your favourites</p>
                                    <Link
                                        href="/search"
                                        className="mt-6 inline-block rounded-lg bg-indigo-600 px-6 py-3 font-semibold text-white hover:bg-indigo-700"
                                    >
                                        Search Properties
                                    </Link>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Enquiries Tab */}
                    {activeTab === 'enquiries' && (
                        <div>
                            {enquiries && enquiries.length > 0 ? (
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
                                                            <h3 className="text-xl font-bold text-gray-900">
                                                                {enquiry.property.location}
                                                            </h3>
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
                                                            Preferred Date: {new Date(enquiry.preferred_date).toLocaleString()}
                                                        </p>
                                                    )}
                                                    {enquiry.contact_phone && (
                                                        <p className="mt-1 text-sm text-gray-600">
                                                            Contact: {enquiry.contact_phone}
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
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
