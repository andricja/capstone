<?php

namespace Database\Seeders;

use App\Models\Equipment;
use App\Models\GcashSetting;
use App\Models\MessageRequest;
use App\Models\PointsRequest;
use App\Models\RentalRequest;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        /* ============================================================== */
        /*  USERS                                                         */
        /* ============================================================== */

        $admin = User::factory()->create([
            'name'   => 'Admin',
            'email'  => 'admin@ferms.com',
            'role'   => 'admin',
            'points' => 0,
        ]);

        // ── Owners ──
        $owner1 = User::factory()->create([
            'name'   => 'Juan Cruz',
            'email'  => 'owner@ferms.com',
            'role'   => 'owner',
            'points' => 0,
        ]);

        $owner2 = User::factory()->create([
            'name'   => 'Pedro Reyes',
            'email'  => 'pedro.reyes@ferms.com',
            'role'   => 'owner',
            'points' => 0,
        ]);

        $owner3 = User::factory()->create([
            'name'   => 'Andres Magsaysay',
            'email'  => 'andres.m@ferms.com',
            'role'   => 'owner',
            'points' => 0,
        ]);

        $owner4 = User::factory()->create([
            'name'   => 'Felipe Garcia',
            'email'  => 'felipe.garcia@ferms.com',
            'role'   => 'owner',
            'points' => 0,
        ]);

        // ── Renters ──
        $renter1 = User::factory()->create([
            'name'   => 'Maria Santos',
            'email'  => 'renter@ferms.com',
            'role'   => 'renter',
            'points' => 500,
        ]);

        $renter2 = User::factory()->create([
            'name'   => 'Ana Dela Cruz',
            'email'  => 'ana.delacruz@ferms.com',
            'role'   => 'renter',
            'points' => 300,
        ]);

        $renter3 = User::factory()->create([
            'name'   => 'Carlos Mendoza',
            'email'  => 'carlos.m@ferms.com',
            'role'   => 'renter',
            'points' => 150,
        ]);

        $renter4 = User::factory()->create([
            'name'   => 'Rosa Villanueva',
            'email'  => 'rosa.v@ferms.com',
            'role'   => 'renter',
            'points' => 0,
        ]);

        $renter5 = User::factory()->create([
            'name'   => 'Jose Bautista',
            'email'  => 'jose.b@ferms.com',
            'role'   => 'renter',
            'points' => 75,
        ]);

        /* ============================================================== */
        /*  GCASH SETTINGS                                                 */
        /* ============================================================== */

        GcashSetting::create([
            'owner_id'       => $owner1->id,
            'account_name'   => 'Juan C. Cruz',
            'account_number' => '09171234567',
        ]);

        GcashSetting::create([
            'owner_id'       => $owner2->id,
            'account_name'   => 'Pedro R. Reyes',
            'account_number' => '09181234568',
        ]);

        GcashSetting::create([
            'owner_id'       => $owner3->id,
            'account_name'   => 'Andres M.',
            'account_number' => '09199876543',
        ]);

        /* ============================================================== */
        /*  EQUIPMENT                                                      */
        /* ============================================================== */

        $locations = [
            'Calapan City', 'Victoria', 'Naujan', 'Socorro', 'Pinamalayan',
            'Gloria', 'Bansud', 'Bongabong', 'Roxas', 'Mansalay',
        ];

        $equipmentData = [
            // owner1
            ['owner_id' => $owner1->id, 'name' => 'Kubota L3408 Tractor',      'category' => 'tractor',     'description' => 'Reliable 34HP compact tractor suitable for rice paddies and vegetable farms.',               'daily_rate' => 2500, 'transportation_fee' => 500,  'location' => $locations[0], 'status' => 'available'],
            ['owner_id' => $owner1->id, 'name' => 'John Deere 5050D Tractor',   'category' => 'tractor',     'description' => '50HP utility tractor with 4WD, perfect for larger farm plots.',                               'daily_rate' => 3500, 'transportation_fee' => 750,  'location' => $locations[1], 'status' => 'available'],
            ['owner_id' => $owner1->id, 'name' => 'Yanmar YR70D Harvester',     'category' => 'harvester',   'description' => 'High-performance rice combine harvester with grain tank.',                                     'daily_rate' => 5000, 'transportation_fee' => 1200, 'location' => $locations[0], 'status' => 'available'],
            ['owner_id' => $owner1->id, 'name' => 'Honda Water Pump WB30XT',    'category' => 'irrigation',  'description' => '3-inch centrifugal pump for irrigation, 1,100 L/min capacity.',                                'daily_rate' => 800,  'transportation_fee' => 200,  'location' => $locations[2], 'status' => 'rented'],

            // owner2
            ['owner_id' => $owner2->id, 'name' => 'Massey Ferguson 241 DI',     'category' => 'tractor',     'description' => '42HP tractor with power steering, ideal for plowing and hauling.',                             'daily_rate' => 2800, 'transportation_fee' => 600,  'location' => $locations[3], 'status' => 'available'],
            ['owner_id' => $owner2->id, 'name' => 'Stihl Mist Blower SR 430',   'category' => 'sprayer',     'description' => 'Backpack mist blower for pesticide and fertilizer application.',                                'daily_rate' => 600,  'transportation_fee' => 0,    'location' => $locations[3], 'status' => 'available'],
            ['owner_id' => $owner2->id, 'name' => 'Crop Tiger 30 Harvester',    'category' => 'harvester',   'description' => 'Versatile combine harvester for rice and corn, with 30HP engine.',                              'daily_rate' => 4500, 'transportation_fee' => 1000, 'location' => $locations[4], 'status' => 'pending'],
            ['owner_id' => $owner2->id, 'name' => 'Farm Trailer 2-Ton',         'category' => 'trailer',     'description' => 'Heavy-duty farm trailer for transporting harvest, feed, and materials.',                       'daily_rate' => 1000, 'transportation_fee' => 300,  'location' => $locations[3], 'status' => 'available'],

            // owner3
            ['owner_id' => $owner3->id, 'name' => 'Rotary Tiller RT-150',       'category' => 'cultivator',  'description' => '150cm rotary tiller attachment for soil preparation.',                                         'daily_rate' => 1500, 'transportation_fee' => 400,  'location' => $locations[5], 'status' => 'available'],
            ['owner_id' => $owner3->id, 'name' => 'Transplanter TP-800',        'category' => 'planter',     'description' => 'Semi-automatic rice transplanter for efficient seedling planting.',                             'daily_rate' => 3000, 'transportation_fee' => 800,  'location' => $locations[6], 'status' => 'available'],
            ['owner_id' => $owner3->id, 'name' => 'Drip Irrigation Kit 1-Acre', 'category' => 'irrigation',  'description' => 'Complete drip irrigation system for 1 acre, with timer and filters.',                           'daily_rate' => 1200, 'transportation_fee' => 350,  'location' => $locations[5], 'status' => 'maintenance'],
            ['owner_id' => $owner3->id, 'name' => 'Boom Sprayer 200L',          'category' => 'sprayer',     'description' => 'Tractor-mounted boom sprayer with 200-liter tank for large-area coverage.',                     'daily_rate' => 1800, 'transportation_fee' => 500,  'location' => $locations[7], 'status' => 'pending'],

            // owner4
            ['owner_id' => $owner4->id, 'name' => 'Mahindra 575 DI Tractor',    'category' => 'tractor',     'description' => '45HP tractor with excellent fuel efficiency, suitable for all farm operations.',                'daily_rate' => 3000, 'transportation_fee' => 650,  'location' => $locations[8], 'status' => 'available'],
            ['owner_id' => $owner4->id, 'name' => 'Corn Planter 4-Row',         'category' => 'planter',     'description' => '4-row precision corn planter with adjustable spacing.',                                         'daily_rate' => 2200, 'transportation_fee' => 550,  'location' => $locations[8], 'status' => 'available'],
            ['owner_id' => $owner4->id, 'name' => 'Brush Cutter BC-520',        'category' => 'cultivator',  'description' => 'Heavy-duty brush cutter for clearing farmland and managing weeds.',                             'daily_rate' => 500,  'transportation_fee' => 0,    'location' => $locations[9], 'status' => 'pending'],
            ['owner_id' => $owner4->id, 'name' => 'Flatbed Trailer 3-Ton',      'category' => 'trailer',     'description' => '3-ton capacity flatbed trailer for hauling heavy farm equipment and produce.',                  'daily_rate' => 1400, 'transportation_fee' => 400,  'location' => $locations[9], 'status' => 'available'],
        ];

        $equipmentModels = [];
        foreach ($equipmentData as $eq) {
            $equipmentModels[] = Equipment::create($eq);
        }

        /* ============================================================== */
        /*  RENTAL REQUESTS                                                */
        /* ============================================================== */

        $renters    = [$renter1, $renter2, $renter3, $renter4, $renter5];
        $addresses  = [
            'Brgy. Parang, Calapan City', 'Brgy. Banus, Victoria',
            'Brgy. San Agustin, Naujan', 'Brgy. Plaridel, Socorro',
            'Brgy. Lumangbayan, Pinamalayan', 'Brgy. Bansud Proper, Bansud',
        ];

        $rentalData = [
            // Approved rentals
            ['renter' => $renter1, 'eq_idx' =>  0, 'days' => 3, 'start' => '2026-02-20', 'status' => 'approved'],
            ['renter' => $renter2, 'eq_idx' =>  4, 'days' => 5, 'start' => '2026-02-18', 'status' => 'approved'],
            ['renter' => $renter3, 'eq_idx' =>  9, 'days' => 2, 'start' => '2026-02-25', 'status' => 'approved'],
            ['renter' => $renter1, 'eq_idx' => 12, 'days' => 4, 'start' => '2026-02-22', 'status' => 'approved'],
            ['renter' => $renter5, 'eq_idx' =>  1, 'days' => 7, 'start' => '2026-02-15', 'status' => 'approved'],

            // Forwarded (pending) rentals
            ['renter' => $renter2, 'eq_idx' =>  2, 'days' => 3, 'start' => '2026-03-05', 'status' => 'forwarded'],
            ['renter' => $renter4, 'eq_idx' =>  8, 'days' => 2, 'start' => '2026-03-10', 'status' => 'forwarded'],
            ['renter' => $renter3, 'eq_idx' => 13, 'days' => 4, 'start' => '2026-03-08', 'status' => 'forwarded'],
            ['renter' => $renter1, 'eq_idx' =>  5, 'days' => 1, 'start' => '2026-03-12', 'status' => 'forwarded'],

            // Rejected
            ['renter' => $renter4, 'eq_idx' =>  0, 'days' => 10, 'start' => '2026-02-10', 'status' => 'rejected'],
            ['renter' => $renter5, 'eq_idx' =>  4, 'days' => 6,  'start' => '2026-02-08', 'status' => 'rejected'],
        ];

        foreach ($rentalData as $i => $r) {
            $eq    = $equipmentModels[$r['eq_idx']];
            $start = Carbon::parse($r['start']);
            $end   = $start->copy()->addDays($r['days']);
            $total = $r['days'] * $eq->daily_rate + $eq->transportation_fee;

            RentalRequest::create([
                'renter_id'        => $r['renter']->id,
                'equipment_id'     => $eq->id,
                'contact_number'   => '0917' . str_pad($i + 1, 7, '0', STR_PAD_LEFT),
                'rental_days'      => $r['days'],
                'start_date'       => $start,
                'end_date'         => $end,
                'delivery_address' => $addresses[$i % count($addresses)],
                'latitude'         => 13.1000 + ($i * 0.01),
                'longitude'        => 121.1000 + ($i * 0.01),
                'total_cost'       => $total,
                'status'           => $r['status'],
            ]);
        }

        /* ============================================================== */
        /*  POINTS REQUESTS                                                */
        /* ============================================================== */

        $pointsData = [
            ['renter' => $renter1, 'amount' => 500,  'points' => 500,  'status' => 'approved'],
            ['renter' => $renter1, 'amount' => 200,  'points' => 200,  'status' => 'approved'],
            ['renter' => $renter2, 'amount' => 300,  'points' => 300,  'status' => 'approved'],
            ['renter' => $renter3, 'amount' => 150,  'points' => 150,  'status' => 'approved'],
            ['renter' => $renter5, 'amount' => 100,  'points' => 100,  'status' => 'approved'],
            ['renter' => $renter4, 'amount' => 250,  'points' => 250,  'status' => 'pending'],
            ['renter' => $renter2, 'amount' => 500,  'points' => 500,  'status' => 'pending'],
            ['renter' => $renter5, 'amount' => 1000, 'points' => 1000, 'status' => 'pending'],
            ['renter' => $renter3, 'amount' => 300,  'points' => 300,  'status' => 'rejected'],
        ];

        foreach ($pointsData as $pr) {
            PointsRequest::create([
                'renter_id'        => $pr['renter']->id,
                'amount_paid'      => $pr['amount'],
                'points_requested' => $pr['points'],
                'payment_proof'    => 'proofs/sample_receipt.jpg',
                'status'           => $pr['status'],
            ]);
        }

        /* ============================================================== */
        /*  MESSAGE REQUESTS                                               */
        /* ============================================================== */

        $messages = [
            ['renter' => $renter1, 'msg' => 'Is the Kubota tractor available for next week? I need it for land preparation in Naujan.',                           'status' => 'pending'],
            ['renter' => $renter2, 'msg' => 'I\'d like to inquire about the rice harvester rental. How many hectares can it cover per day?',                       'status' => 'pending'],
            ['renter' => $renter3, 'msg' => 'Can I get a discount if I rent the transplanter for a full week? I have a 2-hectare rice field.',                     'status' => 'responded'],
            ['renter' => $renter4, 'msg' => 'Do you deliver equipment to Mansalay? I need the corn planter and a trailer.',                                        'status' => 'pending'],
            ['renter' => $renter5, 'msg' => 'The water pump I rented last time was great. Can I reserve it again for the first week of March?',                    'status' => 'responded'],
            ['renter' => $renter1, 'msg' => 'I have an issue with my points purchase. I paid ₱500 via GCash but it hasn\'t been reflected yet.',                   'status' => 'reviewed'],
            ['renter' => $renter2, 'msg' => 'Is there any sprayer equipment available for coconut farm pest control? Preferably the mist blower.',                 'status' => 'pending'],
            ['renter' => $renter3, 'msg' => 'Thank you for the quick response about the rotary tiller! I will proceed with the rental.',                           'status' => 'responded'],
        ];

        foreach ($messages as $i => $m) {
            MessageRequest::create([
                'renter_id'      => $m['renter']->id,
                'name'           => $m['renter']->name,
                'contact_number' => '0917' . str_pad(100 + $i, 7, '0', STR_PAD_LEFT),
                'location'       => $locations[$i % count($locations)],
                'message'        => $m['msg'],
                'status'         => $m['status'],
            ]);
        }
    }
}
