import ApplicationLogo from '@/Components/ApplicationLogo';
import { Link } from '@inertiajs/react';
import { useState } from 'react';

export default function PublicLayout({ children }) {
    const [mobileOpen, setMobileOpen] = useState(false);

    return (
        <div className="min-h-screen bg-gray-100">
            <nav className="border-b border-gray-100 bg-white">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex h-16 justify-between">

                        {/* Logo + nav links */}
                        <div className="flex">
                            <div className="flex shrink-0 items-center">
                                <Link href="/">
                                    <ApplicationLogo className="block h-9 w-auto fill-current text-gray-800" />
                                </Link>
                            </div>

                            <div className="hidden space-x-8 sm:-my-px sm:ms-10 sm:flex sm:items-center">
                                <Link
                                    href={route('properties.search')}
                                    className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 transition duration-150 ease-in-out hover:border-gray-300 hover:text-gray-700"
                                >
                                    Search Properties
                                </Link>
                            </div>
                        </div>

                        {/* Desktop: Login / Register CTAs */}
                        <div className="hidden sm:flex sm:items-center sm:gap-4">
                            <Link
                                href={route('login')}
                                className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
                            >
                                Log in
                            </Link>
                            <Link
                                href={route('register')}
                                className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-700 transition"
                            >
                                Register
                            </Link>
                        </div>

                        {/* Mobile hamburger */}
                        <div className="-me-2 flex items-center sm:hidden">
                            <button
                                onClick={() => setMobileOpen(prev => !prev)}
                                className="inline-flex items-center justify-center rounded-md p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" stroke="currentColor" fill="none" viewBox="0 0 24 24">
                                    <path
                                        className={!mobileOpen ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M4 6h16M4 12h16M4 18h16"
                                    />
                                    <path
                                        className={mobileOpen ? 'inline-flex' : 'hidden'}
                                        strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>

                {/* Mobile menu */}
                <div className={(mobileOpen ? 'block' : 'hidden') + ' sm:hidden'}>
                    <div className="space-y-1 pb-3 pt-2">
                        <Link
                            href={route('properties.search')}
                            className="block border-l-4 border-transparent py-2 pe-4 ps-3 text-base font-medium text-gray-600 hover:border-gray-300 hover:bg-gray-50 hover:text-gray-800 transition"
                        >
                            Search Properties
                        </Link>
                    </div>
                    <div className="border-t border-gray-200 pb-3 pt-4 px-4 flex flex-col gap-2">
                        <Link
                            href={route('login')}
                            className="block text-base font-medium text-gray-600 hover:text-gray-900"
                        >
                            Log in
                        </Link>
                        <Link
                            href={route('register')}
                            className="block rounded-md bg-indigo-600 px-4 py-2 text-center text-base font-semibold text-white hover:bg-indigo-700 transition"
                        >
                            Register
                        </Link>
                    </div>
                </div>
            </nav>

            <main>{children}</main>
        </div>
    );
}
