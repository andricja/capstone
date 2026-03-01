<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreRentalRequestRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isRenter();
    }

    public function rules(): array
    {
        return [
            'equipment_id'    => ['required', 'exists:equipment,id'],
            'contact_number'  => ['required', 'string', 'max:20'],
            'rental_days'     => ['required', 'integer', 'min:1'],
            'start_date'      => ['required', 'date', 'after_or_equal:today'],
            'end_date'        => ['required', 'date', 'after_or_equal:start_date'],
            'delivery_address'=> ['required', 'string', 'max:500'],
            'latitude'        => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'       => ['nullable', 'numeric', 'between:-180,180'],
        ];
    }
}
