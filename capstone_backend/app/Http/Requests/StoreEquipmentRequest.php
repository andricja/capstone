<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class StoreEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isOwner();
    }

    public function rules(): array
    {
        return [
            'name'               => ['required', 'string', 'max:255'],
            'category'           => ['required', 'in:tractor,harvester,planter,irrigation,cultivator,sprayer,trailer,other'],
            'description'        => ['nullable', 'string', 'max:2000'],
            'daily_rate'         => ['required', 'numeric', 'min:0'],
            'transportation_fee' => ['nullable', 'numeric', 'min:0'],
            'location'           => ['required', 'string', 'max:255'],
            'image'              => ['nullable', 'image', 'max:5120'], // 5 MB
        ];
    }
}
