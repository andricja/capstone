<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateEquipmentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isOwner()
            && $this->route('equipment')->owner_id === $this->user()->id;
    }

    public function rules(): array
    {
        return [
            'name'               => ['sometimes', 'string', 'max:255'],
            'category'           => ['sometimes', 'in:tractor,harvester,planter,irrigation,cultivator,sprayer,trailer,other'],
            'description'        => ['nullable', 'string', 'max:2000'],
            'daily_rate'         => ['sometimes', 'numeric', 'min:0'],
            'transportation_fee' => ['nullable', 'numeric', 'min:0'],
            'location'           => ['sometimes', 'string', 'max:255'],
            'image'              => ['nullable', 'image', 'max:5120'],
        ];
    }
}
