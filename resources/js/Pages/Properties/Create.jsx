import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm } from '@inertiajs/react';

export default function Create() {
    const { data, setData, post, processing, errors } = useForm({
        // General fields
        name: '',
        price: '',
        location: '',
        size_sqft: '',
        description: '',
        property_category: 'residential',
        transaction_type: 'sale',

        // Residential fields
        bedrooms: '3',
        bathrooms: '1',
        council_tax_band: '',
        parking: 'none',
        garden: false,
        property_type: 'detached',
        access: '',

        // Commercial fields (property_type reused)
        // commercial_property_type: 'retail',

        // Sales fields
        tenure: 'freehold',
        lease_years_remaining: '',
        ground_rent: '',
        service_charge: '',

        // Rental fields
        available_date: '',
        deposit: '',
        min_tenancy_months: '12',
        let_type: 'long_term',
        furnished: 'unfurnished',
        bills_included: false,
        pets_allowed: false,

        images: [],
    });

    const [imagePreviews, setImagePreviews] = useState([]);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        if (files.length > 10) {
            alert('You can only upload a maximum of 10 images');
            return;
        }

        setData('images', files);

        // Create preview URLs
        const previews = files.map((file) => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const removeImage = (index) => {
        const newImages = data.images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);

        setData('images', newImages);
        setImagePreviews(newPreviews);
    };

    const submit = (e) => {
        e.preventDefault();
        post(route('properties.store'));
    };

    const isResidential = data.property_category === 'residential';
    const isSale = data.transaction_type === 'sale';

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    List New Property
                </h2>
            }
        >
            <Head title="List New Property" />

            <div className="py-12">
                <div className="mx-auto max-w-3xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div className="space-y-6">
                                {/* Property Category Selection */}
                                <div className="rounded-lg border-2 border-indigo-200 bg-indigo-50 p-4">
                                    <InputLabel value="Property Category" className="mb-2 text-lg font-bold" />
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="residential"
                                                checked={data.property_category === 'residential'}
                                                onChange={(e) => setData('property_category', e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="font-medium">Residential</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="commercial"
                                                checked={data.property_category === 'commercial'}
                                                onChange={(e) => setData('property_category', e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="font-medium">Commercial</span>
                                        </label>
                                    </div>
                                </div>

                                {/* Transaction Type Selection */}
                                <div className="rounded-lg border-2 border-purple-200 bg-purple-50 p-4">
                                    <InputLabel value="Transaction Type" className="mb-2 text-lg font-bold" />
                                    <div className="flex gap-4">
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="sale"
                                                checked={data.transaction_type === 'sale'}
                                                onChange={(e) => setData('transaction_type', e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="font-medium">For Sale</span>
                                        </label>
                                        <label className="flex items-center">
                                            <input
                                                type="radio"
                                                value="rental"
                                                checked={data.transaction_type === 'rental'}
                                                onChange={(e) => setData('transaction_type', e.target.value)}
                                                className="mr-2"
                                            />
                                            <span className="font-medium">For Rent</span>
                                        </label>
                                    </div>
                                </div>

                                {/* General Property Details */}
                                <div className="space-y-4">
                                    <h3 className="text-lg font-bold text-gray-900">General Details</h3>

                                    <div>
                                        <InputLabel htmlFor="name" value="Property Name" />
                                        <TextInput
                                            id="name"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.name}
                                            onChange={(e) => setData('name', e.target.value)}
                                            required
                                            autoFocus
                                        />
                                        <InputError message={errors.name} className="mt-2" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <InputLabel htmlFor="price" value="Price (£)" />
                                            <TextInput
                                                id="price"
                                                type="number"
                                                step="0.01"
                                                min="0"
                                                className="mt-1 block w-full"
                                                value={data.price}
                                                onChange={(e) => setData('price', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.price} className="mt-2" />
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="size_sqft" value="Size (sqft)" />
                                            <TextInput
                                                id="size_sqft"
                                                type="number"
                                                min="1"
                                                className="mt-1 block w-full"
                                                value={data.size_sqft}
                                                onChange={(e) => setData('size_sqft', e.target.value)}
                                                required
                                            />
                                            <InputError message={errors.size_sqft} className="mt-2" />
                                        </div>
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="location" value="Location" />
                                        <TextInput
                                            id="location"
                                            type="text"
                                            className="mt-1 block w-full"
                                            value={data.location}
                                            onChange={(e) => setData('location', e.target.value)}
                                            required
                                        />
                                        <InputError message={errors.location} className="mt-2" />
                                    </div>

                                    <div>
                                        <InputLabel htmlFor="description" value="Description" />
                                        <textarea
                                            id="description"
                                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                            rows="4"
                                            value={data.description}
                                            onChange={(e) => setData('description', e.target.value)}
                                        />
                                        <InputError message={errors.description} className="mt-2" />
                                    </div>
                                </div>

                                {/* Residential-Specific Fields */}
                                {isResidential && (
                                    <div className="space-y-4 rounded-lg border-2 border-indigo-100 bg-indigo-50 p-4">
                                        <h3 className="text-lg font-bold text-gray-900">Residential Details</h3>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <InputLabel htmlFor="bedrooms" value="Bedrooms" />
                                                <TextInput
                                                    id="bedrooms"
                                                    type="number"
                                                    min="0"
                                                    className="mt-1 block w-full"
                                                    value={data.bedrooms}
                                                    onChange={(e) => setData('bedrooms', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.bedrooms} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="bathrooms" value="Bathrooms" />
                                                <TextInput
                                                    id="bathrooms"
                                                    type="number"
                                                    min="0"
                                                    className="mt-1 block w-full"
                                                    value={data.bathrooms}
                                                    onChange={(e) => setData('bathrooms', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.bathrooms} className="mt-2" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <InputLabel htmlFor="property_type" value="Property Type" />
                                                <select
                                                    id="property_type"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value={data.property_type}
                                                    onChange={(e) => setData('property_type', e.target.value)}
                                                    required
                                                >
                                                    <option value="detached">Detached</option>
                                                    <option value="semi_detached">Semi-Detached</option>
                                                    <option value="terraced">Terraced</option>
                                                    <option value="flat">Flat</option>
                                                    <option value="bungalow">Bungalow</option>
                                                </select>
                                                <InputError message={errors.property_type} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="parking" value="Parking" />
                                                <select
                                                    id="parking"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value={data.parking}
                                                    onChange={(e) => setData('parking', e.target.value)}
                                                    required
                                                >
                                                    <option value="none">None</option>
                                                    <option value="street">Street Parking</option>
                                                    <option value="driveway">Driveway</option>
                                                    <option value="garage">Garage</option>
                                                </select>
                                                <InputError message={errors.parking} className="mt-2" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <InputLabel htmlFor="council_tax_band" value="Council Tax Band (Optional)" />
                                                <TextInput
                                                    id="council_tax_band"
                                                    type="text"
                                                    maxLength="1"
                                                    className="mt-1 block w-full"
                                                    value={data.council_tax_band}
                                                    onChange={(e) => setData('council_tax_band', e.target.value.toUpperCase())}
                                                    placeholder="A-H"
                                                />
                                                <InputError message={errors.council_tax_band} className="mt-2" />
                                            </div>

                                            <div className="flex items-center pt-6">
                                                <label className="flex items-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={data.garden}
                                                        onChange={(e) => setData('garden', e.target.checked)}
                                                        className="mr-2 rounded"
                                                    />
                                                    <span className="font-medium">Has Garden</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <InputLabel htmlFor="access" value="Accessibility Features (Optional)" />
                                            <TextInput
                                                id="access"
                                                type="text"
                                                className="mt-1 block w-full"
                                                value={data.access}
                                                onChange={(e) => setData('access', e.target.value)}
                                                placeholder="e.g., Wheelchair accessible, Ground floor"
                                            />
                                            <InputError message={errors.access} className="mt-2" />
                                        </div>
                                    </div>
                                )}

                                {/* Commercial-Specific Fields */}
                                {!isResidential && (
                                    <div className="space-y-4 rounded-lg border-2 border-indigo-100 bg-indigo-50 p-4">
                                        <h3 className="text-lg font-bold text-gray-900">Commercial Details</h3>

                                        <div>
                                            <InputLabel htmlFor="property_type" value="Property Type" />
                                            <select
                                                id="property_type"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={data.property_type}
                                                onChange={(e) => setData('property_type', e.target.value)}
                                                required
                                            >
                                                <option value="retail">Retail</option>
                                                <option value="leisure">Leisure</option>
                                                <option value="industrial">Industrial</option>
                                                <option value="land_development">Land/Development</option>
                                                <option value="other">Other</option>
                                            </select>
                                            <InputError message={errors.property_type} className="mt-2" />
                                        </div>
                                    </div>
                                )}

                                {/* Sales-Specific Fields */}
                                {isSale && (
                                    <div className="space-y-4 rounded-lg border-2 border-purple-100 bg-purple-50 p-4">
                                        <h3 className="text-lg font-bold text-gray-900">Sales Details</h3>

                                        <div>
                                            <InputLabel htmlFor="tenure" value="Tenure" />
                                            <select
                                                id="tenure"
                                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                value={data.tenure}
                                                onChange={(e) => setData('tenure', e.target.value)}
                                                required
                                            >
                                                <option value="freehold">Freehold</option>
                                                <option value="leasehold">Leasehold</option>
                                                <option value="share_of_freehold">Share of Freehold</option>
                                            </select>
                                            <InputError message={errors.tenure} className="mt-2" />
                                        </div>

                                        {data.tenure === 'leasehold' && (
                                            <div className="grid grid-cols-3 gap-4">
                                                <div>
                                                    <InputLabel htmlFor="lease_years_remaining" value="Lease Years Remaining" />
                                                    <TextInput
                                                        id="lease_years_remaining"
                                                        type="number"
                                                        min="0"
                                                        className="mt-1 block w-full"
                                                        value={data.lease_years_remaining}
                                                        onChange={(e) => setData('lease_years_remaining', e.target.value)}
                                                    />
                                                    <InputError message={errors.lease_years_remaining} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="ground_rent" value="Ground Rent (£/year)" />
                                                    <TextInput
                                                        id="ground_rent"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="mt-1 block w-full"
                                                        value={data.ground_rent}
                                                        onChange={(e) => setData('ground_rent', e.target.value)}
                                                    />
                                                    <InputError message={errors.ground_rent} className="mt-2" />
                                                </div>

                                                <div>
                                                    <InputLabel htmlFor="service_charge" value="Service Charge (£/year)" />
                                                    <TextInput
                                                        id="service_charge"
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        className="mt-1 block w-full"
                                                        value={data.service_charge}
                                                        onChange={(e) => setData('service_charge', e.target.value)}
                                                    />
                                                    <InputError message={errors.service_charge} className="mt-2" />
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Rental-Specific Fields */}
                                {!isSale && (
                                    <div className="space-y-4 rounded-lg border-2 border-purple-100 bg-purple-50 p-4">
                                        <h3 className="text-lg font-bold text-gray-900">Rental Details</h3>

                                        <div className="grid grid-cols-3 gap-4">
                                            <div>
                                                <InputLabel htmlFor="available_date" value="Available From" />
                                                <TextInput
                                                    id="available_date"
                                                    type="date"
                                                    className="mt-1 block w-full"
                                                    value={data.available_date}
                                                    onChange={(e) => setData('available_date', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.available_date} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="deposit" value="Deposit (£)" />
                                                <TextInput
                                                    id="deposit"
                                                    type="number"
                                                    step="0.01"
                                                    min="0"
                                                    className="mt-1 block w-full"
                                                    value={data.deposit}
                                                    onChange={(e) => setData('deposit', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.deposit} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="min_tenancy_months" value="Min Tenancy (months)" />
                                                <TextInput
                                                    id="min_tenancy_months"
                                                    type="number"
                                                    min="1"
                                                    className="mt-1 block w-full"
                                                    value={data.min_tenancy_months}
                                                    onChange={(e) => setData('min_tenancy_months', e.target.value)}
                                                    required
                                                />
                                                <InputError message={errors.min_tenancy_months} className="mt-2" />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 gap-4">
                                            <div>
                                                <InputLabel htmlFor="let_type" value="Let Type" />
                                                <select
                                                    id="let_type"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value={data.let_type}
                                                    onChange={(e) => setData('let_type', e.target.value)}
                                                    required
                                                >
                                                    <option value="long_term">Long Term</option>
                                                    <option value="short_term">Short Term</option>
                                                    <option value="corporate">Corporate</option>
                                                </select>
                                                <InputError message={errors.let_type} className="mt-2" />
                                            </div>

                                            <div>
                                                <InputLabel htmlFor="furnished" value="Furnishing" />
                                                <select
                                                    id="furnished"
                                                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                                                    value={data.furnished}
                                                    onChange={(e) => setData('furnished', e.target.value)}
                                                    required
                                                >
                                                    <option value="unfurnished">Unfurnished</option>
                                                    <option value="part_furnished">Part Furnished</option>
                                                    <option value="furnished">Furnished</option>
                                                </select>
                                                <InputError message={errors.furnished} className="mt-2" />
                                            </div>
                                        </div>

                                        <div className="flex gap-6">
                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={data.bills_included}
                                                    onChange={(e) => setData('bills_included', e.target.checked)}
                                                    className="mr-2 rounded"
                                                />
                                                <span className="font-medium">Bills Included</span>
                                            </label>

                                            <label className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    checked={data.pets_allowed}
                                                    onChange={(e) => setData('pets_allowed', e.target.checked)}
                                                    className="mr-2 rounded"
                                                />
                                                <span className="font-medium">Pets Allowed</span>
                                            </label>
                                        </div>
                                    </div>
                                )}

                                {/* Property Images */}
                                <div>
                                    <InputLabel htmlFor="images" value="Property Images (Max 10)" />
                                    <input
                                        id="images"
                                        type="file"
                                        multiple
                                        accept="image/jpeg,image/png,image/jpg"
                                        onChange={handleImageChange}
                                        className="mt-1 block w-full rounded-md border-gray-300 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                                    />
                                    <p className="mt-1 text-sm text-gray-500">
                                        {data.images.length}/10 images selected
                                    </p>
                                    <InputError message={errors.images} className="mt-2" />

                                    {/* Image Previews */}
                                    {imagePreviews.length > 0 && (
                                        <div className="mt-4 grid grid-cols-3 gap-4">
                                            {imagePreviews.map((preview, index) => (
                                                <div
                                                    key={index}
                                                    className="group relative aspect-video overflow-hidden rounded-lg border border-gray-200"
                                                >
                                                    <img
                                                        src={preview}
                                                        alt={`Preview ${index + 1}`}
                                                        className="h-full w-full object-cover"
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => removeImage(index)}
                                                        className="absolute right-2 top-2 rounded-full bg-red-500 p-1 text-white opacity-0 transition-opacity hover:bg-red-600 group-hover:opacity-100"
                                                    >
                                                        <svg
                                                            className="h-4 w-4"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M6 18L18 6M6 6l12 12"
                                                            />
                                                        </svg>
                                                    </button>
                                                    <div className="absolute bottom-2 left-2 rounded bg-black/50 px-2 py-1 text-xs text-white">
                                                        {index + 1}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-4 pt-4">
                                    <PrimaryButton disabled={processing} className="px-8 py-3">
                                        List Property
                                    </PrimaryButton>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </AuthenticatedLayout>
    );
}
