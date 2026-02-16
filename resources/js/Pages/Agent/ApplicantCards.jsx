import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ApplicantCard from '@/Components/ApplicantCard';
import { Head } from '@inertiajs/react';

export default function ApplicantCards({ applicants }) {
    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Applicant Cards
                </h2>
            }
        >
            <Head title="Applicant Cards" />

            <div className="py-12">
                <div className="mx-auto max-w-7xl sm:px-6 lg:px-8">
                    {/* Stats Summary */}
                    <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
                        <div className="rounded-lg bg-white p-6 shadow">
                            <p className="text-sm font-medium text-gray-600">
                                Total Applicants
                            </p>
                            <p className="mt-2 text-3xl font-bold text-gray-900">
                                {applicants.length}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow">
                            <p className="text-sm font-medium text-gray-600">
                                Total Favourites
                            </p>
                            <p className="mt-2 text-3xl font-bold text-red-600">
                                {applicants.reduce(
                                    (sum, a) =>
                                        sum + a.favourites_analytics.count,
                                    0,
                                )}
                            </p>
                        </div>
                        <div className="rounded-lg bg-white p-6 shadow">
                            <p className="text-sm font-medium text-gray-600">
                                Total Enquiries
                            </p>
                            <p className="mt-2 text-3xl font-bold text-green-600">
                                {applicants.reduce(
                                    (sum, a) =>
                                        sum + a.enquiries_analytics.count,
                                    0,
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Applicant Cards Grid */}
                    {applicants.length > 0 ? (
                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {applicants.map((applicant) => (
                                <ApplicantCard
                                    key={applicant.id}
                                    applicant={applicant}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="rounded-lg bg-white p-12 text-center shadow">
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
                                    d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                                />
                            </svg>
                            <h3 className="mt-4 text-lg font-medium text-gray-900">
                                No Active Applicants
                            </h3>
                            <p className="mt-2 text-sm text-gray-500">
                                Applicants who favourite or enquire about
                                properties will appear here.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
