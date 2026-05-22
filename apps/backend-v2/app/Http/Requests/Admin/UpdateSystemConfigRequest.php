<?php

declare(strict_types=1);

namespace App\Http\Requests\Admin;

use App\Support\SystemConfigSchemas;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateSystemConfigRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Phân quyền đã enforce bởi middleware role:admin ở route level.
        return true;
    }

    /**
     * Build validation rules theo schema của key tương ứng.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        $key = (string) $this->route('key');
        $schema = SystemConfigSchemas::for($key);
        $type = $schema['type'] ?? 'auto';

        $rules = ['value' => ['present']];

        switch ($type) {
            case 'number':
                $rules['value'][] = ($schema['integer'] ?? false) ? 'integer' : 'numeric';
                if (isset($schema['min'])) {
                    $rules['value'][] = "min:{$schema['min']}";
                }
                if (isset($schema['max'])) {
                    $rules['value'][] = "max:{$schema['max']}";
                }
                break;

            case 'string':
                $rules['value'][] = 'string';
                break;

            case 'boolean':
                $rules['value'][] = 'boolean';
                break;

            case 'timezone':
                $rules['value'][] = 'string';
                $rules['value'][] = Rule::in(SystemConfigSchemas::timezones());
                break;

            case 'milestones':
                $rules['value'] = ['present', 'array'];
                $rules['value.*'] = ['array:days,coins'];
                $rules['value.*.days'] = ['required', 'integer', 'min:1'];
                $rules['value.*.coins'] = ['required', 'integer', 'min:0'];
                break;

            case 'level_costs':
                $rules['value'] = ['present', 'array'];
                $rules['value.*'] = ['integer', 'min:0'];
                break;

            case 'auto':
            default:
                $rules['value'][] = 'required';
                break;
        }

        return $rules;
    }
}
