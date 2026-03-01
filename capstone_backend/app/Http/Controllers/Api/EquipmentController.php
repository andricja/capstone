<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\StoreEquipmentRequest;
use App\Http\Requests\UpdateEquipmentRequest;
use App\Models\Equipment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EquipmentController extends Controller
{
    /* ------------------------------------------------------------------ */
    /*  RENTER – browse approved equipment                                 */
    /* ------------------------------------------------------------------ */

    /**
     * List all approved & available equipment for renters.
     * Supports ?location= and ?category= query filters.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Equipment::with('owner:id,name,email')
            ->approved(); // available, rented, maintenance (not pending/rejected)

        if ($request->filled('location')) {
            $query->byLocation($request->input('location'));
        }

        if ($request->filled('category')) {
            $query->byCategory($request->input('category'));
        }

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        $equipment = $query->latest()->paginate(15);

        return response()->json($equipment);
    }

    /**
     * Show a single equipment item.
     */
    public function show(Equipment $equipment): JsonResponse
    {
        $equipment->load('owner:id,name,email');

        return response()->json($equipment);
    }

    /* ------------------------------------------------------------------ */
    /*  OWNER – manage own equipment                                       */
    /* ------------------------------------------------------------------ */

    /**
     * List equipment belonging to the authenticated owner.
     */
    public function myEquipment(Request $request): JsonResponse
    {
        $equipment = $request->user()
            ->equipment()
            ->latest()
            ->paginate(15);

        return response()->json($equipment);
    }

    /**
     * Store new equipment (enters "pending" status for admin review).
     */
    public function store(StoreEquipmentRequest $request): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('equipment', 'public');
        }

        $data['owner_id'] = $request->user()->id;
        $data['status']   = 'pending';
        $data['transportation_fee'] = $data['transportation_fee'] ?? 0;

        $equipment = Equipment::create($data);

        return response()->json([
            'message'   => 'Equipment submitted for admin review.',
            'equipment' => $equipment,
        ], 201);
    }

    /**
     * Update own equipment.
     */
    public function update(UpdateEquipmentRequest $request, Equipment $equipment): JsonResponse
    {
        $data = $request->validated();

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('equipment', 'public');
        }

        $equipment->update($data);

        return response()->json([
            'message'   => 'Equipment updated.',
            'equipment' => $equipment->fresh(),
        ]);
    }

    /**
     * Delete own equipment (owner only, for rejected or pending items).
     */
    public function destroy(Request $request, Equipment $equipment): JsonResponse
    {
        if ($equipment->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        $equipment->delete();

        return response()->json(['message' => 'Equipment deleted.']);
    }

    /* ------------------------------------------------------------------ */
    /*  OWNER – status toggles                                             */
    /* ------------------------------------------------------------------ */

    /**
     * Set equipment to "maintenance" status (owner only).
     */
    public function setMaintenance(Request $request, Equipment $equipment): JsonResponse
    {
        if ($equipment->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (! in_array($equipment->status, ['available'])) {
            return response()->json([
                'message' => 'Equipment can only be set to maintenance when it is available.',
            ], 422);
        }

        $equipment->update(['status' => 'maintenance']);

        return response()->json([
            'message'   => 'Equipment set to maintenance.',
            'equipment' => $equipment->fresh(),
        ]);
    }

    /**
     * Set equipment back to "available" (owner only, from rented or maintenance).
     */
    public function setAvailable(Request $request, Equipment $equipment): JsonResponse
    {
        if ($equipment->owner_id !== $request->user()->id) {
            return response()->json(['message' => 'Forbidden.'], 403);
        }

        if (! in_array($equipment->status, ['rented', 'maintenance'])) {
            return response()->json([
                'message' => 'Equipment can only be set to available from rented or maintenance status.',
            ], 422);
        }

        $equipment->update(['status' => 'available']);

        return response()->json([
            'message'   => 'Equipment is now available.',
            'equipment' => $equipment->fresh(),
        ]);
    }

    /* ------------------------------------------------------------------ */
    /*  ADMIN – equipment approval                                         */
    /* ------------------------------------------------------------------ */

    /**
     * List all pending equipment for admin review.
     */
    public function pending(): JsonResponse
    {
        $equipment = Equipment::with('owner:id,name,email')
            ->where('status', 'pending')
            ->latest()
            ->paginate(15);

        return response()->json($equipment);
    }

    /**
     * List all equipment for admin with optional status filter.
     */
    public function adminIndex(Request $request): JsonResponse
    {
        $query = Equipment::with('owner:id,name,email');

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->boolean('all')) {
            return response()->json($query->latest()->get());
        }

        $equipment = $query->latest()->paginate(15);

        return response()->json($equipment);
    }

    /**
     * Admin approves equipment → status becomes "available".
     * Accepts optional approval_fee in the request body.
     */
    public function approve(Request $request, Equipment $equipment): JsonResponse
    {
        if ($equipment->status !== 'pending') {
            return response()->json(['message' => 'Only pending equipment can be approved.'], 422);
        }

        $request->validate([
            'approval_fee' => ['required', 'numeric', 'min:0'],
        ]);

        $equipment->update([
            'status'       => 'available',
            'approval_fee' => $request->input('approval_fee'),
            'approved_at'  => now(),
        ]);

        $equipment->load('owner:id,name,email');

        return response()->json([
            'message'   => 'Equipment approved and now available.',
            'equipment' => $equipment,
        ]);
    }

    /**
     * Admin rejects equipment → status becomes "rejected".
     */
    public function reject(Equipment $equipment): JsonResponse
    {
        if ($equipment->status !== 'pending') {
            return response()->json(['message' => 'Only pending equipment can be rejected.'], 422);
        }

        $equipment->update(['status' => 'rejected']);

        return response()->json([
            'message'   => 'Equipment rejected.',
            'equipment' => $equipment->fresh(),
        ]);
    }

    /**
     * Admin creates equipment on behalf of an owner → auto-approved ("available").
     */
    public function adminStore(Request $request, int $ownerId): JsonResponse
    {
        $owner = \App\Models\User::where('id', $ownerId)->where('role', 'owner')->firstOrFail();

        $data = $request->validate([
            'name'               => ['required', 'string', 'max:255'],
            'category'           => ['required', 'in:tractor,harvester,planter,irrigation,cultivator,sprayer,trailer,other'],
            'description'        => ['nullable', 'string', 'max:2000'],
            'daily_rate'         => ['required', 'numeric', 'min:0'],
            'transportation_fee' => ['nullable', 'numeric', 'min:0'],
            'location'           => ['required', 'string', 'max:255'],
            'image'              => ['nullable', 'image', 'max:5120'],
        ]);

        if ($request->hasFile('image')) {
            $data['image'] = $request->file('image')->store('equipment', 'public');
        }

        $data['owner_id']           = $owner->id;
        $data['status']             = 'available'; // admin-added = auto-approved
        $data['transportation_fee'] = $data['transportation_fee'] ?? 0;

        $equipment = Equipment::create($data);

        return response()->json([
            'message'   => 'Equipment added for ' . $owner->name . '.',
            'equipment' => $equipment,
        ], 201);
    }
}
