import { Head, Link } from '@inertiajs/react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import PropertyCard from '@/Components/PropertyCard';

export default function Favourites({ auth, favourites }) {
    return (
        <AuthenticatedLayout user={auth.user}>
            <Head title="My Favourites" />

            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 py-12">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="mb-8">
                        <h1 className="text-4xl font-bold text-gray-900">My Favourite Properties</h1>
                        <p className="mt-2 text-lg text-gray-600">
                            {favourites.length} {favourites.length === 1 ? 'property' : 'properties'} saved
                        </p>
                    </div>

                    {favourites.length > 0 ? (
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
            </div>
        </AuthenticatedLayout>
    );
}
