<?php

namespace App\Http\Controllers;

use App\Models\Barangay;
use App\Models\Subproject;
use App\Models\ProjectBeneficiary;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Inertia\Inertia;
use Inertia\Response;

class ProjectBeneficiariesController extends Controller
{
    public function index(Request $request): Response
    {
        $search = trim((string) $request->query('search', ''));

        // The active subproject is supplied through the URL.
        $subprojectId = $request->query('subproject_id');

        $barangayId = $request->query('barangay_id');
        $municipalityId = $request->query('municipality_id');

        $recordsQuery = ProjectBeneficiary::query()
            ->with('barangay');

        if ($subprojectId !== null && $subprojectId !== '') {
            $recordsQuery->where('subproject_id', $subprojectId);
        }

        if ($barangayId !== null && $barangayId !== '') {
            $recordsQuery->where('barangay_id', $barangayId);
        }

        if ($search !== '') {
            $recordsQuery->where(function ($query) use ($search) {
                $query->where('purok', 'like', "%{$search}%")
                    ->orWhere(
                        'barangay_purok_name',
                        'like',
                        "%{$search}%"
                    );
            });
        }

        $records = $recordsQuery
            ->latest()
            ->get()
            ->map(fn (ProjectBeneficiary $record) => [
                'id' => $record->getKey(),
                'subproject_id' => $record->subproject_id,
                'barangay_id' => (string) $record->barangay_id,
                'barangay' => $record->barangay?->barangay_name ?? '',
                'purok' => $record->purok,
                'barangayPurokName' =>
                    $record->barangay_purok_name ?? '',
                'households' => $record->households,
                'ageGroups' => $record->age_groups ?? [],
                'sectors' => $record->sectors ?? [],
            ])
            ->values();

        $barangaysQuery = Barangay::query();

        if ($municipalityId !== null && $municipalityId !== '') {
            $barangaysQuery->where(
                'municipality_id',
                $municipalityId
            );
        }

        $barangays = $barangaysQuery
            ->orderBy('barangay_name')
            ->get()
            ->map(fn (Barangay $barangay) => [
                // Barangay model primary key is id.
                'id' => $barangay->getKey(),
                'name' => $barangay->barangay_name,
                'municipality_id' => $barangay->municipality_id,
            ])
            ->values();
$subprojectId = $request->query('subproject_id');
        return Inertia::render(
            'ProjectBeneficiaries/ProjectBeneficiaries',
            [
                'records' => $records,
                'beneficiaryProfiles' => $records,
                'barangays' => $barangays,

                // No subproject dropdown is needed.
                // React uses this ID as a hidden form value.
                'subprojectId' => $subprojectId,

                'filters' => [
                    'search' => $search,
                    'municipality_id' => $municipalityId,
                    'barangay_id' => $barangayId,
                    'subproject_id' => $subprojectId,
                ],

                'flash' => [
                    'success' => session('success'),
                    'error' => session('error'),
                ],
            ]
        );
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);

        ProjectBeneficiary::create($data);

        return redirect()
            ->route(
                'project-beneficiaries.index',
                $this->returnFilters($request, $data['subproject_id'])
            )
            ->with('success', 'Beneficiary profile added successfully.');
    }

    public function update(
        Request $request,
        ProjectBeneficiary $projectBeneficiary
    ): RedirectResponse {
        $data = $this->validatedData($request);

        $projectBeneficiary->update($data);

        return redirect()
            ->route(
                'project-beneficiaries.index',
                $this->returnFilters($request, $data['subproject_id'])
            )
            ->with('success', 'Beneficiary profile updated successfully.');
    }

    public function destroy(
        Request $request,
        ProjectBeneficiary $projectBeneficiary
    ): RedirectResponse {
        $subprojectId = $projectBeneficiary->subproject_id;

        $projectBeneficiary->delete();

        return redirect()
            ->route(
                'project-beneficiaries.index',
                $this->returnFilters($request, $subprojectId)
            )
            ->with('success', 'Beneficiary profile deleted successfully.');
    }

    private function validatedData(Request $request): array
    {
        /*
         * Read the ID from the submitted form first.
         * If absent, fall back to the URL query parameter.
         */
        $subprojectId = $request->input(
            'subproject_id',
            $request->query('subproject_id')
        );

        $request->merge([
            'subproject_id' => $subprojectId,
        ]);

        $data = $request->validate([
            'subproject_id' => ['nullable', 'integer', 'min:1'],
            'barangay_id' => ['required', 'integer', 'min:1'],
            'barangay' => ['nullable', 'string', 'max:255'],
            'purok' => ['required', 'string', 'max:150'],
            'barangayPurokName' => ['nullable', 'string', 'max:255'],
            'households' => ['nullable', 'integer', 'min:0'],
            'ageGroups' => ['required', 'array'],
            'sectors' => ['required', 'array'],
        ]);

        /*
         * Validate against the actual Subproject primary key:
         * subproject.subproject_id
         */
        if (
            !empty($data['subproject_id']) &&
            !Subproject::query()
                ->where('subproject_id', $data['subproject_id'])
                ->exists()
        ) {
            throw ValidationException::withMessages([
                'subproject_id' => 'The selected subproject does not exist.',
            ]);
        }

        /*
         * Barangay model primary key is id,
         * so whereKey() checks barangays.id.
         */
        $barangayExists = Barangay::query()
            ->whereKey($data['barangay_id'])
            ->exists();

        if (!$barangayExists) {
            throw ValidationException::withMessages([
                'barangay_id' => 'The selected barangay does not exist. Please select a valid barangay.',
            ]);
        }

        return [
            'subproject_id' => $data['subproject_id'] ?: null,
            'barangay_id' => (int) $data['barangay_id'],
            'purok' => trim($data['purok']),
            'barangay_purok_name' => trim(
                $data['barangayPurokName'] ?? ''
            ) ?: null,
            'households' => (int) ($data['households'] ?? 0),
            'age_groups' => $this->validateCountGroups(
                $data['ageGroups'],
                'ageGroups'
            ),
            'sectors' => $this->validateCountGroups(
                $data['sectors'],
                'sectors'
            ),
        ];
    }

    private function validateCountGroups(
        array $groups,
        string $field
    ): array {
        $validated = [];

        foreach ($groups as $key => $row) {
            if (!is_array($row)) {
                throw ValidationException::withMessages([
                    $field => 'Invalid count data was provided.',
                ]);
            }

            foreach (['male', 'female'] as $gender) {
                $value = $row[$gender] ?? '';

                if (
                    $value !== '' &&
                    (
                        !is_numeric($value) ||
                        (int) $value < 0 ||
                        (string) (int) $value !== (string) $value
                    )
                ) {
                    throw ValidationException::withMessages([
                        $field => 'Counts must be non-negative whole numbers.',
                    ]);
                }
            }

            $validated[$key] = [
                'male' => (int) ($row['male'] ?? 0),
                'female' => (int) ($row['female'] ?? 0),
            ];
        }

        return $validated;
    }

    private function returnFilters(
        Request $request,
        $subprojectId = null
    ): array {
        return array_filter([
            'subproject_id' => $subprojectId
                ?? $request->input('subproject_id')
                ?? $request->query('subproject_id'),
            'municipality_id' => $request->input('municipality_id')
                ?? $request->query('municipality_id'),
            'barangay_id' => $request->input('barangay_filter_id')
                ?? $request->query('barangay_id'),
            'search' => $request->input('search')
                ?? $request->query('search'),
        ], fn ($value) => $value !== null && $value !== '');
    }
}
