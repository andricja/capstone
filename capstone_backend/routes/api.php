<?php

use App\Http\Controllers\Api\AdminReportController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\EquipmentController;
use App\Http\Controllers\Api\GcashSettingController;
use App\Http\Controllers\Api\MessageRequestController;
use App\Http\Controllers\Api\RentalRequestController;
use Illuminate\Support\Facades\Route;

/* ====================================================================== */
/*  PUBLIC (no auth)                                                       */
/* ====================================================================== */

Route::post('/register', [AuthController::class, 'register']);
Route::post('/login',    [AuthController::class, 'login']);

/* ====================================================================== */
/*  AUTHENTICATED (any role)                                               */
/* ====================================================================== */

Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/user',    [AuthController::class, 'user']);

    // Dashboard (role-aware)
    Route::get('/dashboard', [DashboardController::class, 'index']);

    // Browse equipment (all authenticated users)
    Route::get('/equipment',      [EquipmentController::class, 'index']);
    Route::get('/equipment/{equipment}', [EquipmentController::class, 'show']);

    // Get owner GCash info (for renters making payments)
    Route::get('/gcash/{ownerId}', [GcashSettingController::class, 'ownerGcash']);

    /* ------------------------------------------------------------------ */
    /*  RENTER routes                                                      */
    /* ------------------------------------------------------------------ */
    Route::middleware('role:renter')->prefix('renter')->group(function () {

        // Rental requests
        Route::get('/rental-requests',  [RentalRequestController::class, 'myRequests']);
        Route::post('/rental-requests', [RentalRequestController::class, 'store']);

        // Message / inquiries
        Route::get('/messages',  [MessageRequestController::class, 'myMessages']);
        Route::post('/messages', [MessageRequestController::class, 'store']);
    });

    /* ------------------------------------------------------------------ */
    /*  OWNER routes                                                       */
    /* ------------------------------------------------------------------ */
    Route::middleware('role:owner')->prefix('owner')->group(function () {

        // Equipment management
        Route::get('/equipment',               [EquipmentController::class, 'myEquipment']);
        Route::post('/equipment',              [EquipmentController::class, 'store']);
        Route::put('/equipment/{equipment}',   [EquipmentController::class, 'update']);
        Route::delete('/equipment/{equipment}',[EquipmentController::class, 'destroy']);

        // Equipment status toggles
        Route::patch('/equipment/{equipment}/set-maintenance', [EquipmentController::class, 'setMaintenance']);
        Route::patch('/equipment/{equipment}/set-available',   [EquipmentController::class, 'setAvailable']);

        // Rental requests for owner's equipment
        Route::get('/rental-requests',                          [RentalRequestController::class, 'ownerRequests']);
        Route::patch('/rental-requests/{rentalRequest}/approve',[RentalRequestController::class, 'approve']);
        Route::patch('/rental-requests/{rentalRequest}/reject', [RentalRequestController::class, 'reject']);

        // GCash settings
        Route::get('/gcash-settings',  [GcashSettingController::class, 'show']);
        Route::post('/gcash-settings', [GcashSettingController::class, 'store']);
    });

    /* ------------------------------------------------------------------ */
    /*  ADMIN routes                                                       */
    /* ------------------------------------------------------------------ */
    Route::middleware('role:admin')->prefix('admin')->group(function () {

        // Equipment approval
        Route::get('/equipment/pending',               [EquipmentController::class, 'pending']);
        Route::get('/equipment/all',                   [EquipmentController::class, 'adminIndex']);
        Route::patch('/equipment/{equipment}/approve',  [EquipmentController::class, 'approve']);
        Route::patch('/equipment/{equipment}/reject',   [EquipmentController::class, 'reject']);

        // Rental requests overview
        Route::get('/rental-requests', [RentalRequestController::class, 'index']);

        // Message request management
        Route::get('/messages',                              [MessageRequestController::class, 'index']);
        Route::patch('/messages/{messageRequest}/status',    [MessageRequestController::class, 'updateStatus']);
        Route::delete('/messages/{messageRequest}',          [MessageRequestController::class, 'destroy']);

        // Owners management
        Route::get('/owners', [AuthController::class, 'owners']);
        Route::get('/owners/stats', [AuthController::class, 'ownerStats']);
        Route::get('/owners/charts', [AuthController::class, 'ownerChartData']);
        Route::get('/owners/{id}', [AuthController::class, 'ownerShow']);
        Route::patch('/owners/{id}/archive', [AuthController::class, 'archiveOwner']);
        Route::post('/owners/{ownerId}/equipment', [EquipmentController::class, 'adminStore']);

        // Revenue reports
        Route::get('/reports/revenue',    [AdminReportController::class, 'revenue']);
        Route::get('/reports/revenue/csv',[AdminReportController::class, 'exportCsv']);
    });
});
