<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\MessageRequest;
use App\Models\PointsRequest;
use App\Models\RentalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    /**
     * Return role-specific dashboard data for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        return match ($user->role) {
            'renter' => $this->renterDashboard($user),
            'owner'  => $this->ownerDashboard($user),
            'admin'  => $this->adminDashboard(),
            default  => response()->json(['message' => 'Unknown role.'], 403),
        };
    }

    private function renterDashboard($user): JsonResponse
    {
        return response()->json([
            'role'   => 'renter',
            'points' => $user->points,
            'rental_requests' => [
                'total'     => $user->rentalRequests()->count(),
                'forwarded' => $user->rentalRequests()->where('status', 'forwarded')->count(),
                'approved'  => $user->rentalRequests()->where('status', 'approved')->count(),
                'rejected'  => $user->rentalRequests()->where('status', 'rejected')->count(),
            ],
            'points_requests' => [
                'pending'  => $user->pointsRequests()->where('status', 'pending')->count(),
                'approved' => $user->pointsRequests()->where('status', 'approved')->count(),
            ],
            'recent_rentals' => $user->rentalRequests()
                ->with('equipment:id,name,category,image,status')
                ->latest()
                ->take(5)
                ->get(),
        ]);
    }

    private function ownerDashboard($user): JsonResponse
    {
        $equipmentIds = $user->equipment()->pluck('id');

        return response()->json([
            'role' => 'owner',
            'equipment' => [
                'total'       => $user->equipment()->count(),
                'available'   => $user->equipment()->where('status', 'available')->count(),
                'rented'      => $user->equipment()->where('status', 'rented')->count(),
                'maintenance' => $user->equipment()->where('status', 'maintenance')->count(),
                'pending'     => $user->equipment()->where('status', 'pending')->count(),
            ],
            'rental_requests' => [
                'total'     => RentalRequest::whereIn('equipment_id', $equipmentIds)->count(),
                'forwarded' => RentalRequest::whereIn('equipment_id', $equipmentIds)->where('status', 'forwarded')->count(),
                'approved'  => RentalRequest::whereIn('equipment_id', $equipmentIds)->where('status', 'approved')->count(),
                'rejected'  => RentalRequest::whereIn('equipment_id', $equipmentIds)->where('status', 'rejected')->count(),
            ],
            'recent_requests' => RentalRequest::with('renter:id,name,email', 'equipment:id,name')
                ->whereIn('equipment_id', $equipmentIds)
                ->latest()
                ->take(5)
                ->get(),
        ]);
    }

    private function adminDashboard(): JsonResponse
    {
        return response()->json([
            'role' => 'admin',
            'pending_points_requests'    => PointsRequest::where('status', 'pending')->count(),
            'pending_equipment_approvals'=> Equipment::where('status', 'pending')->count(),
            'pending_message_requests'   => MessageRequest::where('status', 'pending')->count(),
            'total_renters'  => \App\Models\User::where('role', 'renter')->count(),
            'total_owners'   => \App\Models\User::where('role', 'owner')->count(),
            'total_equipment'=> Equipment::count(),
            'total_rentals'  => RentalRequest::count(),
            'revenue_this_month' => PointsRequest::where('status', 'approved')
                ->whereMonth('created_at', now()->month)
                ->whereYear('created_at', now()->year)
                ->sum('amount_paid'),
        ]);
    }
}
