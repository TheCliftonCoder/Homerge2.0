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

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class , 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class , 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class , 'destroy'])->name('profile.destroy');

    // Admin routes
    Route::get('/admin/dashboard', [\App\Http\Controllers\AdminController::class , 'index'])->name('admin.dashboard');
    Route::post('/admin/approve/{id}', [\App\Http\Controllers\AdminController::class , 'approveAgent'])->name('admin.approve');
    Route::post('/admin/decline/{id}', [\App\Http\Controllers\AdminController::class , 'declineAgent'])->name('admin.decline');
});

require __DIR__ . '/auth.php';
