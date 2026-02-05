import { useState } from 'react';
import AuthenticatedLayout from '@/Layouts/AuthenticatedLayout';
import InputError from '@/Components/InputError';
import InputLabel from '@/Components/InputLabel';
import PrimaryButton from '@/Components/PrimaryButton';
import TextInput from '@/Components/TextInput';
import { Head, useForm, router } from '@inertiajs/react';

export default function Edit({ property }) {
    const { data, setData, put, processing, errors } = useForm({
        name: property.name,
        price: property.price,
        location: property.location,
        size_sqft: property.size_sqft,
        images: [],
    });

    const [imagePreviews, setImagePreviews] = useState([]);
    const [existingImages, setExistingImages] = useState(property.images || []);

    const handleImageChange = (e) => {
        const files = Array.from(e.target.files);

        const totalImages = existingImages.length + files.length;
        if (totalImages > 10) {
            alert(`You can only have a maximum of 10 images. You currently have ${existingImages.length} images.`);
            return;
        }

        setData('images', files);

        // Create preview URLs
        const previews = files.map((file) => URL.createObjectURL(file));
        setImagePreviews(previews);
    };

    const removeNewImage = (index) => {
        const newImages = data.images.filter((_, i) => i !== index);
        const newPreviews = imagePreviews.filter((_, i) => i !== index);

        setData('images', newImages);
        setImagePreviews(newPreviews);
    };

    const deleteExistingImage = (imageId) => {
        if (!confirm('Are you sure you want to delete this image?')) {
            return;
        }

        router.delete(route('properties.images.delete', { propertyId: property.id, imageId }), {
            preserveScroll: true,
            onSuccess: () => {
                setExistingImages(existingImages.filter(img => img.id !== imageId));
            },
        });
    };

    const submit = (e) => {
        e.preventDefault();
        put(route('properties.update', property.id));
    };

    return (
        <AuthenticatedLayout
            header={
                <h2 className="text-xl font-semibold leading-tight text-gray-800">
                    Edit Property
                </h2>
            }
        >
            <Head title="Edit Property" />

            <div className="py-12">
                <div className="mx-auto max-w-2xl sm:px-6 lg:px-8">
                    <div className="overflow-hidden bg-white shadow-sm sm:rounded-lg">
                        <form onSubmit={submit} className="p-6">
                            <div className="space-y-6">
                                <div>
                                    <InputLabel
                                        htmlFor="name"
                                        value="Property Name"
                                    />
                                    <TextInput
                                        id="name"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData('name', e.target.value)
                                        }
                                        required
                                        autoFocus
                                    />
                                    <InputError
                                        message={errors.name}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel htmlFor="price" value="Price" />
                                    <TextInput
                                        id="price"
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        className="mt-1 block w-full"
                                        value={data.price}
                                        onChange={(e) =>
                                            setData('price', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.price}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="location"
                                        value="Location"
                                    />
                                    <TextInput
                                        id="location"
                                        type="text"
                                        className="mt-1 block w-full"
                                        value={data.location}
                                        onChange={(e) =>
                                            setData('location', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.location}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="size_sqft"
                                        value="Size (sqft)"
                                    />
                                    <TextInput
                                        id="size_sqft"
                                        type="number"
                                        min="1"
                                        className="mt-1 block w-full"
                                        value={data.size_sqft}
                                        onChange={(e) =>
                                            setData('size_sqft', e.target.value)
                                        }
                                        required
                                    />
                                    <InputError
                                        message={errors.size_sqft}
                                        className="mt-2"
                                    />
                                </div>

                                <div>
                                    <InputLabel
                                        htmlFor="images"
                                        value={`Property Images (${existingImages.length}/10)`}
                                    />

                                    {/* Existing Images */}
                                    {existingImages.length > 0 && (
                                        <div className="mt-2 mb-4">
                                            <p className="mb-2 text-sm font-medium text-gray-700">
                                                Current Images:
                                            </p>
                                            <div className="grid grid-cols-3 gap-4">
                                                {existingImages.map((image, index) => (
                                                    <div
                                                        key={image.id}
                                                        className="group relative aspect-video overflow-hidden rounded-lg border border-gray-200"
                                                    >
                                                        <img
                                                            src={`/storage/${image.image_path}`}
                                                            alt={`Property image ${index + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                deleteExistingImage(image.id)
                                                            }
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
                                                            {image.order}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    {/* Add New Images */}
                                    {existingImages.length < 10 && (
                                        <>
                                            <input
                                                id="images"
                                                type="file"
                                                multiple
                                                accept="image/jpeg,image/png,image/jpg"
                                                onChange={handleImageChange}
                                                className="mt-1 block w-full rounded-md border-gray-300 text-sm file:mr-4 file:rounded-md file:border-0 file:bg-indigo-50 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-indigo-700 hover:file:bg-indigo-100"
                                            />
                                            <p className="mt-1 text-sm text-gray-500">
                                                Add up to {10 - existingImages.length} more images
                                            </p>
                                        </>
                                    )}

                                    <InputError
                                        message={errors.images}
                                        className="mt-2"
                                    />

                                    {/* New Image Previews */}
                                    {imagePreviews.length > 0 && (
                                        <div className="mt-4">
                                            <p className="mb-2 text-sm font-medium text-gray-700">
                                                New Images to Upload:
                                            </p>
                                            <div className="grid grid-cols-3 gap-4">
                                                {imagePreviews.map((preview, index) => (
                                                    <div
                                                        key={index}
                                                        className="group relative aspect-video overflow-hidden rounded-lg border border-green-200"
                                                    >
                                                        <img
                                                            src={preview}
                                                            alt={`New preview ${index + 1}`}
                                                            className="h-full w-full object-cover"
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                removeNewImage(index)
                                                            }
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
                                                        <div className="absolute bottom-2 left-2 rounded bg-green-500 px-2 py-1 text-xs text-white">
                                                            NEW
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-end gap-4">
                                    <PrimaryButton disabled={processing}>
                                        Update Property
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
