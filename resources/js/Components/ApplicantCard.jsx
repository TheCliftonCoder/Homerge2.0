import { Link } from '@inertiajs/react';

export default function ApplicantCard({ applicant }) {
    const { favourites_analytics, enquiries_analytics, overall_activity } = applicant;

    const formatPrice = (price) => {
        if (!price) return 'N/A';
        return new Intl.NumberFormat('en-GB', {
            style: 'currency',
            currency: 'GBP',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const formatPropertyType = (type) => {
        if (!type) return 'N/A';
        const types = {
            detached: 'Detached',
            semi_detached: 'Semi-Detached',
            terraced: 'Terraced',
            flat: 'Flat',
            bungalow: 'Bungalow',
            retail: 'Retail',
            leisure: 'Leisure',
            industrial: 'Industrial',
            land_development: 'Land/Development',
            other: 'Other',
        };
        return types[type] || type;
    };

    const formatRelativeTime = (date) => {
        if (!date) return 'Never';
        const now = new Date();
        const then = new Date(date);
        const diffInDays = Math.floor((now - then) / (1000 * 60 * 60 * 24));

        if (diffInDays === 0) return 'Today';
        if (diffInDays === 1) return 'Yesterday';
        if (diffInDays < 7) return `${diffInDays} days ago`;
        if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
        if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
        return `${Math.floor(diffInDays / 365)} years ago`;
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white shadow-xl transition-all duration-300 hover:shadow-2xl hover:-translate-y-1">
            {/* Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4 text-white">
                <div className="flex items-start justify-between">
                    <div>
                        <h3 className="text-xl font-bold">{applicant.name}</h3>
                        <p className="text-sm text-indigo-100">{applicant.email}</p>
                    </div>
                    <div className="rounded-full bg-white/20 px-3 py-1 backdrop-blur-sm">
                        <span className="text-sm font-semibold">{overall_activity.total_count} activities</span>
                    </div>
                </div>
            </div>

            <div className="p-6">
                {/* Favourites Section */}
                <div className="mb-6">
                    <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-red-500" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                        </svg>
                        <h4 className="text-lg font-bold text-gray-900">Favourites</h4>
                        <span className="text-sm text-gray-500">({favourites_analytics.count})</span>
                    </div>

                    {favourites_analytics.count > 0 ? (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-xs font-medium text-gray-600">Price Range</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {formatPrice(favourites_analytics.price_min)} - {formatPrice(favourites_analytics.price_max)}
                                </p>
                                <p className="text-xs text-gray-500">Avg: {formatPrice(favourites_analytics.price_avg)}</p>
                            </div>

                            {favourites_analytics.top_locations.length > 0 && (
                                <div>
                                    <p className="mb-1 text-xs font-medium text-gray-600">Top Locations</p>
                                    <div className="flex flex-wrap gap-1">
                                        {favourites_analytics.top_locations.map((location, index) => (
                                            <span key={index} className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                                                {location.name} ({location.count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {favourites_analytics.top_property_types && favourites_analytics.top_property_types.length > 0 && (
                                <div>
                                    <p className="mb-1 text-xs font-medium text-gray-600">Top Property Types</p>
                                    <div className="flex flex-wrap gap-1">
                                        {favourites_analytics.top_property_types.map((type, index) => (
                                            <span key={index} className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                                                {formatPropertyType(type.name)} ({type.count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {favourites_analytics.bedroom_stats && favourites_analytics.bedroom_stats.modal.length > 0 && (
                                <div>
                                    <p className="mb-1 text-xs font-medium text-gray-600">Bedrooms</p>
                                    <div className="rounded-lg bg-gray-50 p-2">
                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                            <span>Min: <span className="font-semibold text-gray-900">{favourites_analytics.bedroom_stats.min}</span></span>
                                            <span>Max: <span className="font-semibold text-gray-900">{favourites_analytics.bedroom_stats.max}</span></span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {favourites_analytics.bedroom_stats.modal.map((item, index) => (
                                                <span key={index} className="rounded-full bg-indigo-100 px-2 py-1 text-xs font-medium text-indigo-700">
                                                    {item.bedrooms} bed ({item.count})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {favourites_analytics.days_since_last_favourite !== null && (
                                <p className="text-xs text-gray-500">
                                    Last favourited: <span className="font-medium">{favourites_analytics.days_since_last_favourite} {favourites_analytics.days_since_last_favourite === 1 ? 'day' : 'days'} ago</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No favourites yet</p>
                    )}
                </div>

                {/* Enquiries Section */}
                <div className="border-t border-gray-200 pt-6">
                    <div className="mb-3 flex items-center gap-2">
                        <svg className="h-5 w-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                        </svg>
                        <h4 className="text-lg font-bold text-gray-900">Enquiries</h4>
                        <span className="text-sm text-gray-500">({enquiries_analytics.count})</span>
                    </div>

                    {enquiries_analytics.count > 0 ? (
                        <div className="space-y-3">
                            <div className="rounded-lg bg-gray-50 p-3">
                                <p className="text-xs font-medium text-gray-600">Price Range</p>
                                <p className="text-sm font-semibold text-gray-900">
                                    {formatPrice(enquiries_analytics.price_min)} - {formatPrice(enquiries_analytics.price_max)}
                                </p>
                                <p className="text-xs text-gray-500">Avg: {formatPrice(enquiries_analytics.price_avg)}</p>
                            </div>

                            {enquiries_analytics.top_locations.length > 0 && (
                                <div>
                                    <p className="mb-1 text-xs font-medium text-gray-600">Top Locations</p>
                                    <div className="flex flex-wrap gap-1">
                                        {enquiries_analytics.top_locations.map((location, index) => (
                                            <span key={index} className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                {location.name} ({location.count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {enquiries_analytics.top_property_types && enquiries_analytics.top_property_types.length > 0 && (
                                <div>
                                    <p className="mb-1 text-xs font-medium text-gray-600">Top Property Types</p>
                                    <div className="flex flex-wrap gap-1">
                                        {enquiries_analytics.top_property_types.map((type, index) => (
                                            <span key={index} className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                {formatPropertyType(type.name)} ({type.count})
                                            </span>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {enquiries_analytics.bedroom_stats && enquiries_analytics.bedroom_stats.modal.length > 0 && (
                                <div>
                                    <p className="mb-1 text-xs font-medium text-gray-600">Bedrooms</p>
                                    <div className="rounded-lg bg-gray-50 p-2">
                                        <div className="flex items-center justify-between text-xs text-gray-600 mb-1">
                                            <span>Min: <span className="font-semibold text-gray-900">{enquiries_analytics.bedroom_stats.min}</span></span>
                                            <span>Max: <span className="font-semibold text-gray-900">{enquiries_analytics.bedroom_stats.max}</span></span>
                                        </div>
                                        <div className="flex flex-wrap gap-1">
                                            {enquiries_analytics.bedroom_stats.modal.map((item, index) => (
                                                <span key={index} className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-700">
                                                    {item.bedrooms} bed ({item.count})
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            {enquiries_analytics.days_since_last_enquiry !== null && (
                                <p className="text-xs text-gray-500">
                                    Last enquiry: <span className="font-medium">{enquiries_analytics.days_since_last_enquiry} {enquiries_analytics.days_since_last_enquiry === 1 ? 'day' : 'days'} ago</span>
                                </p>
                            )}
                        </div>
                    ) : (
                        <p className="text-sm text-gray-500">No enquiries yet</p>
                    )}
                </div>

                {/* Footer */}
                <div className="mt-6 border-t border-gray-200 pt-4">
                    <div className="flex items-center justify-between text-xs text-gray-500">
                        {favourites_analytics.days_since_last_favourite !== null && (
                            <span>Last favourite: <span className="font-medium">{favourites_analytics.days_since_last_favourite}d ago</span></span>
                        )}
                        {enquiries_analytics.days_since_last_enquiry !== null && (
                            <span>Last enquiry: <span className="font-medium">{enquiries_analytics.days_since_last_enquiry}d ago</span></span>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
