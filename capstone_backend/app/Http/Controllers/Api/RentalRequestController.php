<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreRentalRequestRequest;
use App\Models\Equipment;
use App\Models\RentalRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class RentalRequestController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  RENTER – create and view own requests                              */
    /* ------------------------------------------------------------------ */

    /**
     * List rental requests for the authenticated renter.
     */
    public function myRequests(Request $request): JsonResponse
    {
        $requests = $request->user()
            ->rentalRequests()
            ->with('equipment:id,name,category,image,daily_rate,transportation_fee,location,status', 'equipment.owner:id,name,email')
            ->latest()
            ->paginate(15);

        return response()->json($requests);
    }

    /**
     * Create a new rental request (renter must have >= 1 point, equipment must be available).
     */
    public function store(StoreRentalRequestRequest $request): JsonResponse
    {
        $user = $request->user();

        // Must have at least 1 point
        if ($user->points < 1) {
            return response()->json([
                'message' => 'You need at least 1 point to request a rental. Please purchase points first.',
            ], 422);
        }

        $equipment = Equipment::findOrFail($request->input('equipment_id'));

        // Equipment must be available
        if (! $equipment->isAvailable()) {
            return response()->json([
                'message' => 'This equipment is not currently available for rental.',
            ], 422);
        }

        // Calculate total cost: (daily_rate * rental_days) + transportation_fee
        $rentalDays = $request->input('rental_days');
        $totalCost  = ($equipment->daily_rate * $rentalDays) + $equipment->transportation_fee;

        $rentalRequest = RentalRequest::create([
            'renter_id'        => $user->id,
            'equipment_id'     => $equipment->id,
            'contact_number'   => $request->input('contact_number'),
            'rental_days'      => $rentalDays,
            'start_date'       => $request->input('start_date'),
            'end_date'         => $request->input('end_date'),
            'delivery_address' => $request->input('delivery_address'),
            'latitude'         => $request->input('latitude'),
            'longitude'        => $request->input('longitude'),
            'total_cost'       => $totalCost,
            'status'           => 'forwarded', // "Forwarded to Owner"
        ]);

        $rentalRequest->load('equipment:id,name,category,daily_rate,transportation_fee');

        return response()->json([
            'message'        => 'Rental request submitted and forwarded to the equipment owner.',
            'rental_request' => $rentalRequest,
            'cost_breakdown' => [
                'daily_rate'         => $equipment->daily_rate,
                'rental_days'        => $rentalDays,
                'subtotal'           => $equipment->daily_rate * $rentalDays,
                'transportation_fee' => $equipment->transportation_fee,
                'total_cost'         => $totalCost,
            ],
        ], 201);
    }

    /* ------------------------------------------------------------------ */
    /*  OWNER – view and manage incoming rental requests                   */
    /* ------------------------------------------------------------------ */

    /**
     * List rental requests for equipment owned by the authenticated owner.
     */
    public function ownerRequests(Request $request): JsonResponse
    {
        $equipmentIds = $request->user()->equipment()->pluck('id');

        $requests = RentalRequest::with([
                'renter:id,name,email',
                'equipment:id,name,category,daily_rate,transportation_fee,location',
            ])
            ->whereIn('equipment_id', $equipmentIds)
            ->latest()
            ->paginate(15);

        return response()->json($requests);
    }

    /**
     * Owner approves a rental request.
     * - Deducts exactly 1 point from renter.
     * - Sets equipment status to "rented".
     * - Sets rental status to "approved".
     */
    public function approve(Request $request, RentalRequest $rentalRequest): JsonResponse
    {
        // Ensure owned by this owner
        $equipment = $rentalRequest->equipment;
        if ($equipment->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($rentalRequest->status !== 'forwarded') {
            return response()->json(['message' => 'Only forwarded requests can be approved.'], 422);
        }

        $renter = $rentalRequest->renter;
        if ($renter->points < 1) {
            return response()->json([
                'message' => 'The renter does not have enough points. Cannot approve.',
            ], 422);
        }

        // Execute all three actions atomically
        DB::transaction(function () use ($renter, $equipment, $rentalRequest) {
            // 1) Deduct 1 point from renter
            $renter->decrement('points', 1);

            // 2) Set equipment to "rented"
            $equipment->update(['status' => 'rented']);

            // 3) Set rental request to "approved"
            $rentalRequest->update(['status' => 'approved']);
        });

        return response()->json([
            'message'        => 'Rental request approved. 1 point deducted from renter. Equipment marked as rented.',
            'rental_request' => $rentalRequest->fresh()->load('renter:id,name,email,points', 'equipment:id,name,status'),
        ]);
    }

    /**
     * Owner rejects a rental request (no points deducted, equipment stays available).
     */
    public function reject(Request $request, RentalRequest $rentalRequest): JsonResponse
    {
        $equipment = $rentalRequest->equipment;
        if ($equipment->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if ($rentalRequest->status !== 'forwarded') {
            return response()->json(['message' => 'Only forwarded requests can be rejected.'], 422);
        }

        $rentalRequest->update(['status' => 'rejected']);

        return response()->json([
            'message'        => 'Rental request rejected. No points were deducted.',
            'rental_request' => $rentalRequest->fresh(),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  ADMIN – view all rental requests                                   */
    /* ------------------------------------------------------------------ */

    /**
     * List all rental requests (admin overview).
     */
    public function index(Request $request): JsonResponse
    {
        $query = RentalRequest::with([
                'renter:id,name,email',
                'equipment:id,name,category,location',
                'equipment.owner:id,name,email',
            ]);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->boolean('all')) {
            return response()->json($query->latest()->get());
        }

        $requests = $query->latest()->paginate(15);

        return response()->json($requests);
    }
}
