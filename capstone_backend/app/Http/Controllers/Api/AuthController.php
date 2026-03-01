<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Equipment;
use App\Models\RentalRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rules\Password;

class AuthController extends Controller
{
    /**
     * Register a new user (renter or owner).
     */
    public function register(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name'     => ['required', 'string', 'max:255'],
            'email'    => ['required', 'string', 'email', 'max:255', 'unique:users'],
            'password' => ['required', 'confirmed', Password::defaults()],
            'role'     => ['required', 'in:renter,owner'],
        ]);

        $user = User::create([
            'name'     => $validated['name'],
            'email'    => $validated['email'],
            'password' => $validated['password'], // auto-hashed via cast
            'role'     => $validated['role'],
            'points'   => 0,
        ]);

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Registration successful.',
            'user'    => $user,
            'token'   => $token,
        ], 201);
    }

    /**
     * Authenticate user and return token.
     */
    public function login(Request $request): JsonResponse
    {
        $credentials = $request->validate([
            'email'    => ['required', 'string', 'email'],
            'password' => ['required', 'string'],
        ]);

        if (! Auth::attempt($credentials)) {
            return response()->json(['message' => 'Invalid credentials.'], 401);
        }

        /** @var User $user */
        $user  = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => 'Login successful.',
            'user'    => $user,
            'token'   => $token,
        ]);
    }

    /**
     * Revoke current access token (logout).
     */
    public function logout(Request $request): JsonResponse
    {
        $request->user()->currentAccessToken()->delete();

        return response()->json(['message' => 'Logged out successfully.']);
    }

    /**
     * Return the authenticated user.
     */
    public function user(Request $request): JsonResponse
    {
        return response()->json($request->user());
    }

    /**
     * List all users with the owner role (admin only).
     */
    public function owners(Request $request): JsonResponse
    {
        $owners = User::where('role', 'owner')
            ->withCount(['equipment', 'equipment as approved_equipment_count' => function ($q) {
                $q->where('status', '!=', 'rejected');
            }])
            ->orderBy('created_at', 'desc');

        if ($request->boolean('all')) {
            return response()->json($owners->get());
        }

        return response()->json($owners->paginate(15));
    }

    /**
     * Show a single owner with their equipment list.
     */
    public function ownerShow(int $id): JsonResponse
    {
        $owner = User::where('role', 'owner')
            ->withCount(['equipment', 'equipment as approved_equipment_count' => function ($q) {
                $q->where('status', '!=', 'rejected');
            }])
            ->findOrFail($id);

        $equipment = $owner->equipment()
            ->orderByDesc('created_at')
            ->get();

        $totalRentals = \App\Models\RentalRequest::whereIn('equipment_id', $owner->equipment()->pluck('id'))->count();
        $activeRentals = \App\Models\RentalRequest::whereIn('equipment_id', $owner->equipment()->pluck('id'))->where('status', 'approved')->count();
        $totalRevenue = \App\Models\RentalRequest::whereIn('equipment_id', $owner->equipment()->pluck('id'))->where('status', 'approved')->sum('total_cost');

        return response()->json([
            'owner' => $owner,
            'equipment' => $equipment,
            'total_rentals' => $totalRentals,
            'active_rentals' => $activeRentals,
            'total_revenue' => (float) $totalRevenue,
        ]);
    }

    /**
     * Summary statistics for the admin owners page.
     */
    public function ownerStats(): JsonResponse
    {
        $totalOwners  = User::where('role', 'owner')->count();
        $totalRenters = User::where('role', 'renter')->count();
        $totalEquipment = Equipment::count();
        $activeRentals  = RentalRequest::where('status', 'approved')->count();
        $newOwnersThisMonth = User::where('role', 'owner')
            ->where('created_at', '>=', now()->startOfMonth())
            ->count();

        return response()->json([
            'total_owners'          => $totalOwners,
            'total_renters'         => $totalRenters,
            'total_equipment'       => $totalEquipment,
            'active_rentals'        => $activeRentals,
            'new_owners_this_month' => $newOwnersThisMonth,
        ]);
    }

    /**
     * Chart-friendly data for the admin owners page.
     * Accepts ?period=daily|weekly|monthly|yearly (default: yearly).
     */
    public function ownerChartData(Request $request): JsonResponse
    {
        $period = $request->query('period', 'yearly');

        // Determine the date boundary
        $from = match ($period) {
            'daily'   => now()->startOfDay(),
            'weekly'  => now()->subDays(6)->startOfDay(),
            'monthly' => now()->subDays(29)->startOfDay(),
            default   => now()->subMonths(11)->startOfMonth(), // yearly
        };

        // Equipment by category (within period)
        $equipmentByCategory = Equipment::where('created_at', '>=', $from)
            ->select('category', DB::raw('count(*) as count'))
            ->groupBy('category')
            ->orderByDesc('count')
            ->get();

        // Equipment status distribution (within period)
        $equipmentByStatus = Equipment::where('created_at', '>=', $from)
            ->select('status', DB::raw('count(*) as count'))
            ->groupBy('status')
            ->get();

        // Owner registrations over time – grouping adapts to the period
        $ownersQuery = User::where('role', 'owner')->where('created_at', '>=', $from);

        $ownersTrend = match ($period) {
            'daily' => (clone $ownersQuery)
                ->select(DB::raw("DATE_FORMAT(created_at, '%H:00') as label"), DB::raw('count(*) as count'))
                ->groupBy('label')
                ->orderBy('label')
                ->get(),
            'weekly' => (clone $ownersQuery)
                ->select(DB::raw("DATE_FORMAT(created_at, '%m-%d') as label"), DB::raw('count(*) as count'))
                ->groupBy('label')
                ->orderBy('label')
                ->get(),
            'monthly' => (clone $ownersQuery)
                ->select(DB::raw("DATE_FORMAT(created_at, '%m-%d') as label"), DB::raw('count(*) as count'))
                ->groupBy('label')
                ->orderBy('label')
                ->get(),
            default => (clone $ownersQuery)
                ->select(DB::raw("DATE_FORMAT(created_at, '%Y-%m') as label"), DB::raw('count(*) as count'))
                ->groupBy('label')
                ->orderBy('label')
                ->get(),
        };

        // Top 5 owners by equipment count (equipment created within period)
        $topOwners = User::where('role', 'owner')
            ->withCount(['equipment' => fn ($q) => $q->where('created_at', '>=', $from)])
            ->orderByDesc('equipment_count')
            ->get()
            ->filter(fn ($u) => $u->equipment_count > 0)
            ->take(5)
            ->values()
            ->map(fn ($u) => ['name' => $u->name, 'equipment_count' => $u->equipment_count]);

        return response()->json([
            'equipment_by_category' => $equipmentByCategory,
            'equipment_by_status'   => $equipmentByStatus,
            'owners_trend'          => $ownersTrend,
            'top_owners'            => $topOwners,
            'period'                => $period,
        ]);
    }
}
