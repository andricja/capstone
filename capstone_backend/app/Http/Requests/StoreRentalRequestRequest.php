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
            'farm_size_sqm'   => ['required', 'numeric', 'min:100'],
            'start_date'      => ['required', 'date', 'after_or_equal:today'],
            'delivery_address'=> ['required', 'string', 'max:500'],
            'latitude'        => ['nullable', 'numeric', 'between:-90,90'],
            'longitude'       => ['nullable', 'numeric', 'between:-180,180'],
            'payment_method'  => ['required', 'in:cod,gcash'],
            'payment_proof'   => ['required_if:payment_method,gcash', 'nullable', 'image', 'max:5120'],
        ];
    }

    public function messages(): array
    {
        return [
            'payment_proof.required_if' => 'GCash payment proof is required when paying via GCash.',
            'payment_proof.image'       => 'Payment proof must be an image file.',
            'payment_proof.max'         => 'Payment proof must not exceed 5 MB.',
        ];
    }
}
