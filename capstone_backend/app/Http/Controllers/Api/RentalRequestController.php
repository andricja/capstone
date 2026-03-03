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
        $query = $request->user()
            ->rentalRequests()
            ->with('equipment:id,name,category,image,daily_rate,transportation_fee,location,status', 'equipment.owner:id,name,email')
            ->latest();

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Create a new rental request.
     * Renter inputs farm size (sqm) → system auto-calculates hours, days, costs.
     */
    public function store(StoreRentalRequestRequest $request): JsonResponse
    {
        $user = $request->user();

        $equipment = Equipment::findOrFail($request->input('equipment_id'));

        // Equipment must be available
        if (! $equipment->isAvailable()) {
            return response()->json([
                'message' => 'This equipment is not currently available for rental.',
            ], 422);
        }

        $farmSizeSqm = (float) $request->input('farm_size_sqm');

        // ── Coverage rates per category (sqm per hour) ──
        $coverageRates = [
            'tractor'    => 2000,  // 2,000 sqm/hr
            'harvester'  => 1500,  // 1,500 sqm/hr
            'planter'    => 1200,  // 1,200 sqm/hr
            'irrigation' => 2500,  // 2,500 sqm/hr
            'cultivator' => 1000,  // 1,000 sqm/hr
            'sprayer'    => 3000,  // 3,000 sqm/hr
            'trailer'    => 5000,  // 5,000 sqm/hr (hauling capacity)
            'other'      => 1500,
        ];

        $ratePerHour = $coverageRates[$equipment->category] ?? 1500;
        $estimatedHours = ceil(($farmSizeSqm / $ratePerHour) * 10) / 10; // round up to 1 decimal
        $estimatedHours = max($estimatedHours, 1); // minimum 1 hour
        $rentalDays = (int) ceil($estimatedHours / 8); // 8 working hours per day
        $rentalDays = max($rentalDays, 1); // minimum 1 day

        // ── Cost breakdown ──
        $baseCost       = $equipment->daily_rate * $rentalDays;
        $deliveryFee    = (float) $equipment->transportation_fee;
        $serviceCharge  = round($baseCost * 0.05, 2); // 5% service charge
        $totalCost      = $baseCost + $deliveryFee + $serviceCharge;

        // Auto-calculate end date from start date + rental days
        $startDate = \Carbon\Carbon::parse($request->input('start_date'));
        $endDate   = $startDate->copy()->addDays($rentalDays);

        $rentalRequest = RentalRequest::create([
            'renter_id'        => $user->id,
            'equipment_id'     => $equipment->id,
            'contact_number'   => $request->input('contact_number'),
            'farm_size_sqm'    => $farmSizeSqm,
            'estimated_hours'  => $estimatedHours,
            'rental_days'      => $rentalDays,
            'start_date'       => $startDate,
            'end_date'         => $endDate,
            'delivery_address' => $request->input('delivery_address'),
            'latitude'         => $request->input('latitude'),
            'longitude'        => $request->input('longitude'),
            'base_cost'        => $baseCost,
            'delivery_fee'     => $deliveryFee,
            'service_charge'   => $serviceCharge,
            'total_cost'       => $totalCost,
            'status'           => 'forwarded',
            'payment_method'   => $request->input('payment_method'),
            'payment_proof'    => $request->hasFile('payment_proof')
                                    ? $request->file('payment_proof')->store('payment_proofs', 'public')
                                    : null,
        ]);

        $rentalRequest->load('equipment:id,name,category,daily_rate,transportation_fee');

        return response()->json([
            'message'        => 'Rental request submitted and forwarded to the equipment owner.',
            'rental_request' => $rentalRequest,
            'cost_breakdown' => [
                'farm_size_sqm'    => $farmSizeSqm,
                'estimated_hours'  => $estimatedHours,
                'rental_days'      => $rentalDays,
                'daily_rate'       => $equipment->daily_rate,
                'base_cost'        => $baseCost,
                'delivery_fee'     => $deliveryFee,
                'service_charge'   => $serviceCharge,
                'total_cost'       => $totalCost,
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

        $query = RentalRequest::with([
                'renter:id,name,email',
                'equipment:id,name,category,daily_rate,transportation_fee,location',
            ])
            ->whereIn('equipment_id', $equipmentIds)
            ->latest();

        if ($request->boolean('all')) {
            return response()->json($query->get());
        }

        return response()->json($query->paginate(15));
    }

    /**
     * Owner approves a rental request.
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

        // Execute atomically
        DB::transaction(function () use ($equipment, $rentalRequest) {
            // 1) Set equipment to "rented"
            $equipment->update(['status' => 'rented']);

            // 2) Set rental request to "approved"
            $rentalRequest->update(['status' => 'approved']);
        });

        return response()->json([
            'message'        => 'Rental request approved. Equipment marked as rented.',
            'rental_request' => $rentalRequest->fresh()->load('renter:id,name,email', 'equipment:id,name,status'),
        ]);
    }

    /**
     * Owner rejects a rental request (equipment stays available).
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
            'message'        => 'Rental request rejected.',
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
