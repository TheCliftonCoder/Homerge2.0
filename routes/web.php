<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('Welcome', [
    'canLogin' => Route::has('login'),
    'canRegister' => Route::has('register'),
    'laravelVersion' => Application::VERSION,
    'phpVersion' => PHP_VERSION,
    ]);
});

Route::get('/dashboard', function () {
    return Inertia::render('Dashboard');
})->middleware(['auth', 'verified'])->name('dashboard');

// Public properties listing (no auth required)
Route::get('/properties', [\App\Http\Controllers\PropertyController::class , 'index'])->name('properties.index');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class , 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class , 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class , 'destroy'])->name('profile.destroy');

    // Admin routes
    Route::get('/admin/dashboard', [\App\Http\Controllers\AdminController::class , 'index'])->name('admin.dashboard');
    Route::post('/admin/approve/{id}', [\App\Http\Controllers\AdminController::class , 'approveAgent'])->name('admin.approve');
    Route::post('/admin/decline/{id}', [\App\Http\Controllers\AdminController::class , 'declineAgent'])->name('admin.decline');

    // Property routes (agent only)
    Route::get('/properties/create', [\App\Http\Controllers\PropertyController::class , 'create'])->name('properties.create');
    Route::post('/properties', [\App\Http\Controllers\PropertyController::class , 'store'])->name('properties.store');
    Route::get('/my-properties', [\App\Http\Controllers\PropertyController::class , 'myProperties'])->name('properties.my');
    Route::get('/properties/{id}/edit', [\App\Http\Controllers\PropertyController::class , 'edit'])->name('properties.edit');
    Route::put('/properties/{id}', [\App\Http\Controllers\PropertyController::class , 'update'])->name('properties.update');
    Route::delete('/properties/{id}', [\App\Http\Controllers\PropertyController::class , 'destroy'])->name('properties.destroy');
    Route::delete('/properties/{propertyId}/images/{imageId}', [\App\Http\Controllers\PropertyController::class , 'deleteImage'])->name('properties.images.delete');
});

require __DIR__ . '/auth.php';
