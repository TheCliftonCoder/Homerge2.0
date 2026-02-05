import GuestLayout from '@/Layouts/GuestLayout';
import PropertyCard from '@/Components/PropertyCard';
import { Head } from '@inertiajs/react';

export default function Index({ properties }) {
    return (
        <GuestLayout>
            <Head title="Property Listings" />

            <div className="py-12">
                <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">
                            Available Properties
                        </h1>
                        <p className="mt-2 text-gray-600">
                            Browse all property listings
                        </p>
                    </div>

                    {properties.length === 0 ? (
                        <div className="rounded-lg bg-white p-12 text-center shadow-sm">
                            <svg
                                className="mx-auto h-12 w-12 text-gray-400"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                                />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">
                                No properties listed yet
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Check back later for new listings
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-8">
                            {properties.map((property) => (
                                <PropertyCard
                                    key={property.id}
                                    property={property}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </GuestLayout>
    );
}
