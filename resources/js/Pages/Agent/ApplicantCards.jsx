import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import ApplicantCard from '@/Components/ApplicantCard';
import { Head, useForm } from '@inertiajs/react';
import { useState } from 'react';
import Modal from '@/Components/Modal';

export default function ApplicantCards({ applicants, agent_properties }) {
    const [selectedApplicant, setSelectedApplicant] = useState(null);
    const { data, setData, post, processing, reset, errors } = useForm({
        recipient_id: '',
        property_id: '',
        body: '',
    });

    const openMessageModal = (applicant) => {
        setSelectedApplicant(applicant);
        setData({
            recipient_id: applicant.id,
            property_id: agent_properties.length > 0 ? agent_properties[0].id : '',
            body: '',
        });
    };

    const closeMessageModal = () => {
        setSelectedApplicant(null);
        reset();
    };

    const submitMessage = (e) => {
        e.preventDefault();
        post(route('messages.store'), {
            onSuccess: () => closeMessageModal(),
        });
    };
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
                                    onMessage={openMessageModal}
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

            <Modal show={selectedApplicant !== null} onClose={closeMessageModal}>
                <form onSubmit={submitMessage} className="p-6">
                    <h2 className="text-lg font-bold text-gray-900 border-b border-gray-100 pb-3 mb-4">
                        Message {selectedApplicant?.name}
                    </h2>

                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Mention a Property
                            </label>
                            <select
                                value={data.property_id}
                                onChange={e => setData('property_id', e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                required
                            >
                                <option value="" disabled>Select one of your properties</option>
                                {agent_properties.map(p => (
                                    <option key={p.id} value={p.id}>{p.name}</option>
                                ))}
                            </select>
                            {errors.property_id && <p className="mt-1 text-xs text-red-600">{errors.property_id}</p>}
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 mb-1">
                                Your Message
                            </label>
                            <textarea
                                value={data.body}
                                onChange={e => setData('body', e.target.value)}
                                className="w-full rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                rows="4"
                                placeholder={`Hi ${selectedApplicant?.name}, I noticed you were looking at properties in this area...`}
                                required
                            ></textarea>
                            {errors.body && <p className="mt-1 text-xs text-red-600">{errors.body}</p>}
                        </div>
                    </div>

                    <div className="mt-6 flex items-center justify-end gap-3 border-t border-gray-100 pt-5">
                        <button
                            type="button"
                            onClick={closeMessageModal}
                            className="rounded-lg border-2 border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 transition hover:bg-gray-50 focus:outline-none"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={processing || !data.property_id || !data.body.trim()}
                            className="rounded-lg bg-indigo-600 px-6 py-2 text-sm font-bold text-white shadow-lg transition hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50"
                        >
                            {processing ? 'Sending...' : 'Send Message Request'}
                        </button>
                    </div>
                </form>
            </Modal>
        </AuthenticatedLayout>
    );
}
