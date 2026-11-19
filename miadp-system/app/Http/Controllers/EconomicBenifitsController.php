<?php

namespace App\Http\Controllers;

use App\Models\Subproject;
use App\Models\SVOC;
use App\Models\SOH;
use App\Models\SIH;
use App\Models\TTS;
use App\Models\STL;
use App\Models\NGA;
use App\Models\VOC_Benefits;
use App\Models\TTS_Benefits;

use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Validation\ValidationException;

class EconomicBenifitsController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | SHARED HELPERS
    |--------------------------------------------------------------------------
    */

    private function ensureBelongsToSubproject(
        Subproject $subproject,
        SVOC $svoc
    ): void {
        abort_unless(
            (string) $svoc->subproject_id === (string) $subproject->getKey(),
            404,
            'SVOC record not found for this subproject.'
        );
    }

    private function ensureSOHBelongsToSubproject(
        Subproject $subproject,
        SOH $soh
    ): void {
        abort_unless(
            (string) $soh->subproject_id === (string) $subproject->getKey(),
            404,
            'SOH record not found for this subproject.'
        );
    }

    private function ensureSIHBelongsToSubproject(
        Subproject $subproject,
        SIH $sih
    ): void {
        abort_unless(
            (string) $sih->subproject_id === (string) $subproject->getKey(),
            404,
            'SIH record not found for this subproject.'
        );
    }

    private function ensureTTSBelongsToSubproject(
        Subproject $subproject,
        TTS $tts
    ): void {
        abort_unless(
            (string) $tts->subproject_id === (string) $subproject->getKey(),
            404,
            'TTS record not found for this subproject.'
        );
    }

    private function ensureSTLBelongsToSubproject(
        Subproject $subproject,
        STL $stl
    ): void {
        abort_unless(
            (string) $stl->subproject_id === (string) $subproject->getKey(),
            404,
            'STL record not found for this subproject.'
        );
    }

    private function ensureNGABelongsToSubproject(
        Subproject $subproject,
        NGA $nga
    ): void {
        abort_unless(
            (string) $nga->subproject_id === (string) $subproject->getKey(),
            404,
            'NGA record not found for this subproject.'
        );
    }

    /*
    |--------------------------------------------------------------------------
    | SAVINGS IN VEHICLE OPERATING COST (SVOC)
    |--------------------------------------------------------------------------
    | Main worksheet: svocs
    | Yearly records: voc_benefits
    | One worksheet per subproject is not enforced here; the controller
    | supports multiple SVOC records for a subproject.
    |--------------------------------------------------------------------------
    */

    public function svocIndex(Subproject $subproject): JsonResponse
    {
        $records = SVOC::where('subproject_id', $subproject->getKey())
            ->orderByDesc('id')
            ->get();

        $records->transform(function ($record) {
            $record->yearly_savings = VOC_Benefits::where(
                'svoc_id',
                $record->getKey()
            )
                ->orderBy('year')
                ->get();

            return $record;
        });

        return response()->json([
            'success' => true,
            'data' => $records,
        ]);
    }

    public function svocStore(
        Request $request,
        Subproject $subproject
    ): JsonResponse {
        $validated = $this->validateSVOC($request);
        $payload = $validated['data'];

        $yearlySavings = $payload['tab3']['yearlySavings'];

        $annual = round(
            (float) $yearlySavings[0]['total'],
            2
        );

        $twentyYear = round(
            collect($yearlySavings)->sum('total'),
            2
        );

        $record = DB::transaction(function () use (
            $subproject,
            $payload,
            $yearlySavings,
            $annual,
            $twentyYear
        ) {
            $record = SVOC::create([
                'subproject_id' => $subproject->getKey(),
                'barangay' => trim($payload['barangay']),
                'annual_savings' => $annual,
                'twenty_year_savings' => $twentyYear,
                'data' => $payload,
            ]);

            $this->saveVOCYearlyBenefits(
                $subproject->getKey(),
                $record->getKey(),
                $yearlySavings
            );

            return $record;
        });

        return response()->json([
            'success' => true,
            'message' => 'SVOC and its Year 1–20 savings saved successfully.',
            'data' => $record,
        ], 201);
    }

    public function svocShow(
        Subproject $subproject,
        SVOC $svoc
    ): JsonResponse {
        $this->ensureBelongsToSubproject($subproject, $svoc);

        $svoc->yearly_savings = VOC_Benefits::where(
            'svoc_id',
            $svoc->getKey()
        )
            ->orderBy('year')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $svoc,
        ]);
    }

    public function svocUpdate(
        Request $request,
        Subproject $subproject,
        SVOC $svoc
    ): JsonResponse {
        $this->ensureBelongsToSubproject($subproject, $svoc);

        $validated = $this->validateSVOC($request);
        $payload = $validated['data'];

        $yearlySavings = $payload['tab3']['yearlySavings'];

        $annual = round(
            (float) $yearlySavings[0]['total'],
            2
        );

        $twentyYear = round(
            collect($yearlySavings)->sum('total'),
            2
        );

        DB::transaction(function () use (
            $subproject,
            $svoc,
            $payload,
            $yearlySavings,
            $annual,
            $twentyYear
        ) {
            $svoc->update([
                'barangay' => trim($payload['barangay']),
                'annual_savings' => $annual,
                'twenty_year_savings' => $twentyYear,
                'data' => $payload,
            ]);

            VOC_Benefits::where(
                'svoc_id',
                $svoc->getKey()
            )->delete();

            $this->saveVOCYearlyBenefits(
                $subproject->getKey(),
                $svoc->getKey(),
                $yearlySavings
            );
        });

        $svoc->refresh();

        $svoc->yearly_savings = VOC_Benefits::where(
            'svoc_id',
            $svoc->getKey()
        )
            ->orderBy('year')
            ->get();

        return response()->json([
            'success' => true,
            'message' => 'SVOC and its Year 1–20 savings updated successfully.',
            'data' => $svoc,
        ]);
    }

    public function svocDestroy(
        Subproject $subproject,
        SVOC $svoc
    ): JsonResponse {
        $this->ensureBelongsToSubproject($subproject, $svoc);

        DB::transaction(function () use ($svoc) {
            VOC_Benefits::where(
                'svoc_id',
                $svoc->getKey()
            )->delete();

            $svoc->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'SVOC and its 20 yearly records deleted successfully.',
        ]);
    }

    private function saveVOCYearlyBenefits(
        int|string $subprojectId,
        int|string $svocId,
        array $yearlySavings
    ): void {
        if (count($yearlySavings) !== 20) {
            throw ValidationException::withMessages([
                'data.tab3.yearlySavings' =>
                    'Exactly 20 yearly VOC savings records are required.',
            ]);
        }

        $rows = [];

        foreach ($yearlySavings as $index => $yearData) {
            $year = (int) ($yearData['year'] ?? 0);

            if ($year !== $index + 1) {
                throw ValidationException::withMessages([
                    'data.tab3.yearlySavings' =>
                        'VOC projection years must be ordered from Year 1 to Year 20.',
                ]);
            }

            $rows[] = [
                'subproject_id' => $subprojectId,
                'svoc_id' => $svocId,
                'year' => $year,
                'annual_savings' => round(
                    (float) ($yearData['total'] ?? 0),
                    2
                ),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        VOC_Benefits::insert($rows);
    }

    private function validateSVOC(Request $request): array
    {
        return $request->validate([
            'data' => ['required', 'array'],

            'data.barangay' => ['required', 'string', 'max:255'],
            'data.inputDate1' => ['required', 'date'],
            'data.inputDate2' => ['required', 'date'],
            'data.inputDate3' => ['required', 'date'],

            'data.year1' => ['required', 'integer', 'min:1'],
            'data.inputYear' => [
                'required',
                'integer',
                'gte:data.year1',
            ],

            'data.trafficGrowthRate' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.roadLength' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.selectedVehicleIds' => [
                'required',
                'array',
                'min:1',
            ],

            'data.selectedVehicleIds.*' => [
                'required',
                'string',
                Rule::in([
                    'motorcycle',
                    'tricycle',
                    'other_truck',
                    'service_vehicle',
                    'pickup',
                    'truck_6',
                    'truck_10',
                ]),
            ],

            'data.traffic' => ['required', 'array'],
            'data.traffic.*' => ['required', 'array'],
            'data.traffic.*.*' => ['required', 'array'],

            'data.traffic.*.*.day1' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.traffic.*.*.day2' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.traffic.*.*.day3' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.traffic.*.*.tripsPerDay' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.traffic.*.*.operatingDays' => [
                'nullable',
                'numeric',
                'between:0,366',
            ],

            'data.calculations' => ['required', 'array'],
            'data.totals' => ['required', 'array'],

            'data.tab2' => ['required', 'array'],

            'data.tab2.roadLengths' => [
                'required',
                'array',
            ],

            'data.tab2.roadLengths.*' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.tab2.roadSurfaceResults' => [
                'required',
                'array',
                'size:5',
            ],

            'data.tab2.savingsByVehicle' => [
                'required',
                'array',
            ],

            'data.tab2.totalAnnualVOCSavings' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.tab3' => ['required', 'array'],

            'data.tab3.projectionPeriod' => [
                'required',
                'integer',
                'in:20',
            ],

            'data.tab3.years' => [
                'required',
                'array',
                'size:20',
            ],

            'data.tab3.roadSurfaceProjections' => [
                'required',
                'array',
                'size:5',
            ],

            'data.tab3.yearlyTotals' => [
                'required',
                'array',
                'size:20',
            ],

            'data.tab3.yearlyTotals.0.total' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.tab3.totalTwentyYearVOCSavings' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.tab3.totalTenYearVOCSavings' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.tab3.yearlySavings' => [
                'required',
                'array',
                'size:20',
            ],

            'data.tab3.yearlySavings.*.year' => [
                'required',
                'integer',
                'between:1,20',
            ],

            'data.tab3.yearlySavings.*.public' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.tab3.yearlySavings.*.private' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.tab3.yearlySavings.*.total' => [
                'required',
                'numeric',
                'min:0',
            ],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SAVING OUTPUT HAULING (SOH)
    |--------------------------------------------------------------------------
    */

    public function sohIndex(Subproject $subproject): JsonResponse
    {
        $record = SOH::where(
            'subproject_id',
            $subproject->getKey()
        )->first();

        return response()->json([
            'success' => true,
            'data' => $record?->data,
            'soh_id' => $record?->getKey(),
            'annual_savings' => $record?->annual_savings,
            'twenty_year_savings' => $record?->twenty_year_savings,
            'created_at' => $record?->created_at,
            'updated_at' => $record?->updated_at,
        ]);
    }

    public function sohStore(
        Request $request,
        Subproject $subproject
    ): JsonResponse {
        $payload = $this->validateSOH($request)['data'];

        $annual = $this->calculateSOHAnnualSavings($payload);

        $record = DB::transaction(fn () => SOH::updateOrCreate(
            ['subproject_id' => $subproject->getKey()],
            [
                'benefit_category' => 'Saving Output Hauling',
                'annual_savings' => $annual,
                'twenty_year_savings' => round($annual * 20, 2),
                'data' => $payload,
            ]
        ));

        return response()->json([
            'success' => true,
            'message' => 'SOH saved successfully.',
            'data' => $record->fresh(),
        ], 201);
    }

    public function sohShow(
        Subproject $subproject,
        SOH $soh
    ): JsonResponse {
        $this->ensureSOHBelongsToSubproject($subproject, $soh);

        return response()->json([
            'success' => true,
            'data' => $soh,
        ]);
    }

    public function sohUpdate(
        Request $request,
        Subproject $subproject,
        SOH $soh
    ): JsonResponse {
        $this->ensureSOHBelongsToSubproject($subproject, $soh);

        $payload = $this->validateSOH($request)['data'];
        $annual = $this->calculateSOHAnnualSavings($payload);

        DB::transaction(fn () => $soh->update([
            'annual_savings' => $annual,
            'twenty_year_savings' => round($annual * 20, 2),
            'data' => $payload,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'SOH updated successfully.',
            'data' => $soh->fresh(),
        ]);
    }

    public function sohDestroy(Subproject $subproject): JsonResponse
    {
        DB::transaction(function () use ($subproject) {
            SOH::where(
                'subproject_id',
                $subproject->getKey()
            )->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'SOH deleted successfully.',
        ]);
    }

    private function validateSOH(Request $request): array
    {
        return $request->validate([
            'data' => ['required', 'array'],

            'data.benefit_category' => [
                'required',
                'string',
                'in:Saving Output Hauling',
            ],

            'data.barangays' => [
                'required',
                'array',
                'min:1',
            ],

            'data.barangays.*.id' => [
                'nullable',
                'string',
                'max:255',
            ],

            'data.barangays.*.barangay' => [
                'required',
                'string',
                'max:255',
            ],

            'data.barangays.*.crops' => [
                'required',
                'array',
                'min:1',
            ],

            'data.barangays.*.crops.*.id' => [
                'nullable',
                'string',
                'max:255',
            ],

            'data.barangays.*.crops.*.crop' => [
                'required',
                'string',
                'max:255',
            ],

            'data.barangays.*.crops.*.existing_area' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.barangays.*.crops.*.area_intercropped' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.barangays.*.crops.*.intercropped_commodity' => [
                'nullable',
                'string',
                'max:255',
            ],

            'data.haulingData' => ['required', 'array'],

            'data.haulingData.*.unit' => [
                'nullable',
                'string',
                'max:50',
            ],

            'data.haulingData.*.cost_wop_b' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.haulingData.*.cost_wp_c' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.haulingData.*.motorized_wop' => [
                'required',
                'array',
            ],

            'data.haulingData.*.motorized_wp_c' => [
                'required',
                'array',
            ],

            'data.haulingData.*.motorized_wop.*' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.haulingData.*.motorized_wp_c.*' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.productionData' => ['required', 'array'],

            'data.productionData.*.unit' => [
                'nullable',
                'string',
                'max:50',
            ],

            'data.productionData.*.packaging' => [
                'nullable',
                'string',
                'max:255',
            ],

            'data.productionData.*.kg_per_packaging' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.productionData.*.total_packages' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.productionData.*.cropping_per_year' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.productionData.*.percentage_market' => [
                'nullable',
                'numeric',
                'between:0,100',
            ],

            'data.years' => [
                'required',
                'array',
                'size:20',
            ],

            'data.years.*' => [
                'required',
                'integer',
                'between:1,20',
            ],

            'data.annual_savings' => [
                'required',
                'numeric',
            ],

            'data.summary' => ['required', 'array'],
            'data.cropCalculations' => ['required', 'array'],
        ]);
    }

    private function calculateSOHAnnualSavings(array $payload): float
    {
        $areas = [];

        foreach ($payload['barangays'] as $barangay) {
            foreach ($barangay['crops'] as $crop) {
                $key = mb_strtolower(trim($crop['crop']));

                if ($key !== '') {
                    $areas[$key] = ($areas[$key] ?? 0)
                        + (float) ($crop['existing_area'] ?? 0);
                }

                $intercrop = mb_strtolower(
                    trim($crop['intercropped_commodity'] ?? '')
                );

                if ($intercrop !== '') {
                    $areas[$intercrop] = ($areas[$intercrop] ?? 0)
                        + (float) ($crop['area_intercropped'] ?? 0);
                }
            }
        }

        $average = static function ($values): float {
            $entered = array_filter(
                $values ?? [],
                static fn ($value) =>
                    $value !== null &&
                    $value !== '' &&
                    is_numeric($value)
            );

            return count($entered)
                ? array_sum(array_map('floatval', $entered)) / count($entered)
                : 0.0;
        };

        $total = 0.0;

        foreach ($areas as $key => $area) {
            $hauling = $payload['haulingData'][$key] ?? [];
            $production = $payload['productionData'][$key] ?? [];

            $current = (float) ($hauling['cost_wop_b'] ?? 0)
                + $average($hauling['motorized_wop'] ?? []);

            $estimated = (float) ($hauling['cost_wp_c'] ?? 0)
                + $average($hauling['motorized_wp_c'] ?? []);

            $productionPerHectare =
                (float) ($production['total_packages'] ?? 0)
                * (float) ($production['cropping_per_year'] ?? 0);

            $marketed = $productionPerHectare
                * $area
                * (float) ($production['percentage_market'] ?? 0) / 100;

            $total += ($current - $estimated) * $marketed;
        }

        return round($total, 2);
    }

    /*
    |--------------------------------------------------------------------------
    | SAVINGS IN INPUT HAULING (SIH)
    |--------------------------------------------------------------------------
    */

    public function sihIndex(Subproject $subproject): JsonResponse
    {
        $record = SIH::where(
            'subproject_id',
            $subproject->getKey()
        )->first();

        return response()->json([
            'success' => true,
            'data' => $record?->data,
            'sih_id' => $record?->getKey(),
            'annual_savings' => $record?->annual_savings,
            'twenty_year_savings' => $record?->twenty_year_savings,
            'created_at' => $record?->created_at,
            'updated_at' => $record?->updated_at,
        ]);
    }

    public function sihStore(
        Request $request,
        Subproject $subproject
    ): JsonResponse {
        $payload = $this->validateSIH($request);

        [$annual, $twenty] = $this->calculateSIHTotals($payload);

        $record = DB::transaction(fn () => SIH::updateOrCreate(
            ['subproject_id' => $subproject->getKey()],
            [
                'benefit_category' => 'Savings in Input Hauling',
                'annual_savings' => $annual,
                'twenty_year_savings' => $twenty,
                'data' => $payload,
            ]
        ));

        return response()->json([
            'success' => true,
            'message' => 'SIH saved successfully.',
            'data' => $record->fresh(),
        ], 201);
    }

    public function sihShow(
        Subproject $subproject,
        SIH $sih
    ): JsonResponse {
        $this->ensureSIHBelongsToSubproject($subproject, $sih);

        return response()->json([
            'success' => true,
            'data' => $sih,
        ]);
    }

    public function sihUpdate(
        Request $request,
        Subproject $subproject,
        SIH $sih
    ): JsonResponse {
        $this->ensureSIHBelongsToSubproject($subproject, $sih);

        $payload = $this->validateSIH($request);

        [$annual, $twenty] = $this->calculateSIHTotals($payload);

        DB::transaction(fn () => $sih->update([
            'annual_savings' => $annual,
            'twenty_year_savings' => $twenty,
            'data' => $payload,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'SIH updated successfully.',
            'data' => $sih->fresh(),
        ]);
    }

    public function sihDestroy(Subproject $subproject): JsonResponse
    {
        DB::transaction(function () use ($subproject) {
            SIH::where(
                'subproject_id',
                $subproject->getKey()
            )->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'SIH deleted successfully.',
        ]);
    }

    private function validateSIH(Request $request): array
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],

            'data.benefit_category' => [
                'required',
                'in:Savings in Input Hauling',
            ],

            'data.crops' => [
                'required',
                'array',
                'min:1',
            ],

            'data.crops.*.crop' => [
                'required',
                'string',
                'max:255',
            ],

            'data.crops.*.number_of_seeds' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.crops.*.number_of_fertilizer' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.crops.*.cropping_per_year' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.crops.*.area_planted' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.crops.*.current_hauling_cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.crops.*.estimated_hauling_cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.crops.*.yearly' => [
                'required',
                'array',
                'size:20',
            ],

            'data.crops.*.yearly.*.year' => [
                'required',
                'integer',
                'between:1,20',
            ],

            'data.crops.*.yearly.*.annual_savings' => [
                'required',
                'numeric',
            ],

            'data.yearly_benefits' => [
                'required',
                'array',
                'size:20',
            ],

            'data.yearly_benefits.*.year' => [
                'required',
                'integer',
                'between:1,20',
            ],

            'data.yearly_benefits.*.total' => [
                'required',
                'numeric',
            ],

            'data.annual_benefit' => [
                'required',
                'numeric',
            ],
        ]);

        return $validated['data'];
    }

    private function calculateSIHTotals(array $payload): array
    {
        $yearTotals = array_fill(0, 20, 0.0);

        foreach ($payload['crops'] as $crop) {
            foreach ($crop['yearly'] as $index => $year) {
                if ((int) $year['year'] !== $index + 1) {
                    throw ValidationException::withMessages([
                        'data.crops' =>
                            'SIH crop years must be ordered from 1 to 20.',
                    ]);
                }

                $yearTotals[$index] += (float) $year['annual_savings'];
            }
        }

        foreach ($payload['yearly_benefits'] as $index => $year) {
            if (
                (int) $year['year'] !== $index + 1 ||
                abs((float) $year['total'] - $yearTotals[$index]) > 0.05
            ) {
                throw ValidationException::withMessages([
                    'data.yearly_benefits' =>
                        'SIH yearly totals do not match the crop calculations.',
                ]);
            }
        }

        if (
            abs(
                (float) $payload['annual_benefit'] -
                $yearTotals[0]
            ) > 0.05
        ) {
            throw ValidationException::withMessages([
                'data.annual_benefit' =>
                    'Annual benefit must equal Year 1 SIH savings.',
            ]);
        }

        return [
            round($yearTotals[0], 2),
            round(array_sum($yearTotals), 2),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | TRAVEL TIME SAVINGS (TTS)
    |--------------------------------------------------------------------------
    | Main worksheet: tts
    | Yearly records: tts_benefits
    |--------------------------------------------------------------------------
    */

    public function ttsIndex(Subproject $subproject): JsonResponse
    {
        $record = TTS::where(
            'subproject_id',
            $subproject->getKey()
        )->first();

        $yearlySavings = $record
            ? TTS_Benefits::where(
                'tts_id',
                $record->getKey()
            )
                ->orderBy('project_year')
                ->get()
            : collect();

        return response()->json([
            'success' => true,
            'data' => $record?->data,
            'tts_id' => $record?->getKey(),
            'annual_savings' => $record?->annual_savings,
            'twenty_year_savings' => $record?->twenty_year_savings,
            'yearly_savings' => $yearlySavings,
            'created_at' => $record?->created_at,
            'updated_at' => $record?->updated_at,
        ]);
    }

    public function ttsStore(
        Request $request,
        Subproject $subproject
    ): JsonResponse {
        $payload = $this->validateTTS($request);

        [$annual, $twenty] = $this->calculateTTSTotals($payload);

        $record = DB::transaction(function () use (
            $subproject,
            $payload,
            $annual,
            $twenty
        ) {
            $record = TTS::updateOrCreate(
                [
                    'subproject_id' => $subproject->getKey(),
                ],
                [
                    'benefit_category' => 'Travel Time Savings',
                    'annual_savings' => $annual,
                    'twenty_year_savings' => $twenty,
                    'data' => $payload,
                ]
            );

            TTS_Benefits::where(
                'tts_id',
                $record->getKey()
            )->delete();

            $this->saveTTSYearlyBenefits(
                $subproject->getKey(),
                $record->getKey(),
                $payload
            );

            return $record;
        });

        return response()->json([
            'success' => true,
            'message' => 'TTS Year 1–20 benefits saved successfully.',
            'data' => $record->fresh(),
        ], 201);
    }

    public function ttsShow(
        Subproject $subproject,
        TTS $tts
    ): JsonResponse {
        $this->ensureTTSBelongsToSubproject($subproject, $tts);

        $yearlySavings = TTS_Benefits::where(
            'tts_id',
            $tts->getKey()
        )
            ->orderBy('project_year')
            ->get();

        return response()->json([
            'success' => true,
            'data' => $tts,
            'yearly_savings' => $yearlySavings,
        ]);
    }

    public function ttsUpdate(
        Request $request,
        Subproject $subproject,
        TTS $tts
    ): JsonResponse {
        $this->ensureTTSBelongsToSubproject($subproject, $tts);

        $payload = $this->validateTTS($request);

        [$annual, $twenty] = $this->calculateTTSTotals($payload);

        DB::transaction(function () use (
            $subproject,
            $tts,
            $payload,
            $annual,
            $twenty
        ) {
            $tts->update([
                'annual_savings' => $annual,
                'twenty_year_savings' => $twenty,
                'data' => $payload,
            ]);

            TTS_Benefits::where(
                'tts_id',
                $tts->getKey()
            )->delete();

            $this->saveTTSYearlyBenefits(
                $subproject->getKey(),
                $tts->getKey(),
                $payload
            );
        });

        return response()->json([
            'success' => true,
            'message' => 'TTS Year 1–20 benefits updated successfully.',
            'data' => $tts->fresh(),
        ]);
    }

    public function ttsDestroy(Subproject $subproject): JsonResponse
    {
        DB::transaction(function () use ($subproject) {
            $record = TTS::where(
                'subproject_id',
                $subproject->getKey()
            )->first();

            if (!$record) {
                return;
            }

            TTS_Benefits::where(
                'tts_id',
                $record->getKey()
            )->delete();

            $record->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'TTS and its 20 yearly benefits deleted successfully.',
        ]);
    }

    private function saveTTSYearlyBenefits(
        int|string $subprojectId,
        int|string $ttsId,
        array $payload
    ): void {
        $years = $payload['projections']['years'] ?? [];

        if (count($years) !== 20) {
            throw ValidationException::withMessages([
                'data.projections.years' =>
                    'Exactly 20 TTS projection years are required.',
            ]);
        }

        $rows = [];

        foreach ($years as $index => $year) {
            $projectYear = (int) ($year['projectYear'] ?? 0);

            if ($projectYear !== $index + 1) {
                throw ValidationException::withMessages([
                    'data.projections.years' =>
                        'TTS project years must be ordered from Year 1 to Year 20.',
                ]);
            }

            $rows[] = [
                'subproject_id' => $subprojectId,
                'tts_id' => $ttsId,
                'project_year' => $projectYear,
                'calendar_year' => (int) ($year['year'] ?? 0),
                'annual_savings' => round(
                    (float) ($year['value'] ?? 0),
                    2
                ),
                'created_at' => now(),
                'updated_at' => now(),
            ];
        }

        TTS_Benefits::insert($rows);
    }

    private function validateTTS(Request $request): array
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],

            'data.settings' => ['required', 'array'],

            'data.settings.populationYear1' => [
                'required',
                'integer',
                'between:1900,2200',
            ],

            'data.settings.populationYear2' => [
                'required',
                'integer',
                'between:1900,2200',
                'gt:data.settings.populationYear1',
            ],

            'data.settings.startYear' => [
                'required',
                'integer',
                'between:1900,2300',
                'gte:data.settings.populationYear2',
            ],

            'data.settings.years' => [
                'required',
                'integer',
                'in:20',
            ],

            'data.settings.commuterPercent' => [
                'required',
                'numeric',
                'between:0,100',
            ],

            'data.settings.tripsPerDay' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.settings.workingDays' => [
                'required',
                'numeric',
                'between:0,366',
            ],

            'data.settings.productivePercent' => [
                'required',
                'numeric',
                'between:0,100',
            ],

            'data.settings.laborCost' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.settings.economicFactor' => [
                'required',
                'numeric',
                'between:0,100',
            ],

            'data.settings.withSpeed' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'data.barangays' => [
                'required',
                'array',
                'min:1',
            ],

            'data.barangays.*.name' => [
                'required',
                'string',
                'max:255',
            ],

            'data.barangays.*.population2024' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.barangays.*.population2025' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.barangays.*.growth' => [
                'required',
                'numeric',
                'gt:-100',
            ],

            'data.barangays.*.beneficiaryShare' => [
                'required',
                'numeric',
                'between:0,100',
            ],

            'data.barangays.*.activePopulation' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.barangays.*.distance' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.barangays.*.withoutMinutes' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.projections' => ['required', 'array'],

            'data.projections.years' => [
                'required',
                'array',
                'size:20',
            ],

            'data.projections.years.*.projectYear' => [
                'required',
                'integer',
                'between:1,20',
            ],

            'data.projections.years.*.value' => [
                'required',
                'numeric',
            ],

            'data.projections.annualBenefit' => [
                'required',
                'numeric',
            ],

            'data.projections.totalValue' => [
                'required',
                'numeric',
            ],
        ]);

        return $validated['data'];
    }

    private function calculateTTSTotals(array $payload): array
    {
        $settings = $payload['settings'];
        $startYear = (int) $settings['startYear'];
        $baseYear = (int) $settings['populationYear2'];

        $beneficiaries = [];
        $activeTotal = 0.0;

        foreach ($payload['barangays'] as $barangay) {
            $projected = (float) $barangay['population2025']
                * pow(
                    1 + (float) $barangay['growth'] / 100,
                    $startYear - $baseYear
                );

            $direct = $projected
                * (float) $barangay['beneficiaryShare'] / 100;

            $withMinutes = (float) $barangay['distance']
                / (float) $settings['withSpeed'] * 60;

            $beneficiaries[] = [
                'direct' => $direct,
                'growth' => (float) $barangay['growth'],
                'saved' => (float) $barangay['withoutMinutes'] - $withMinutes,
                'population' => (float) $barangay['population2025'],
                'active' => (float) $barangay['activePopulation'],
            ];

            $activeTotal += (float) $barangay['activePopulation'];
        }

        $basePopulation = array_sum(
            array_column($beneficiaries, 'direct')
        );

        $activePercent = 0.0;
        $growthRate = 0.0;
        $weightedSaving = 0.0;

        foreach ($beneficiaries as $row) {
            if ($activeTotal > 0 && $row['population'] > 0) {
                $activePercent += (
                    $row['active'] / $row['population']
                ) * (
                    $row['active'] / $activeTotal
                );
            }

            if ($basePopulation > 0) {
                $growthRate += (
                    $row['direct'] * $row['growth'] / 100
                ) / $basePopulation;

                $weightedSaving += (
                    $row['saved'] * $row['direct']
                ) / $basePopulation;
            }
        }

        $wage = (float) $settings['laborCost']
            * (float) $settings['economicFactor'] / 100;

        $totals = [];

        foreach ($payload['projections']['years'] as $index => $year) {
            if ((int) $year['projectYear'] !== $index + 1) {
                throw ValidationException::withMessages([
                    'data.projections.years' =>
                        'TTS project years must be ordered 1 through 20.',
                ]);
            }

            $population = $basePopulation
                * pow(1 + $growthRate, $index);

            $active = $population * $activePercent;

            $commuters = $active
                * (float) $settings['commuterPercent'] / 100;

            $trips = $commuters
                * (float) $settings['tripsPerDay']
                * (float) $settings['workingDays'];

            $savedDays = $trips * $weightedSaving / 480;

            $productiveDays = $savedDays
                * (float) $settings['productivePercent'] / 100;

            $value = $productiveDays * $wage;

            if (
                !is_finite($value) ||
                abs($value - (float) $year['value']) >
                max(0.05, abs($value) * 0.0000001)
            ) {
                throw ValidationException::withMessages([
                    'data.projections.years' =>
                        'TTS yearly values do not match the input calculations.',
                ]);
            }

            $totals[] = $value;
        }

        $annual = $totals[0];
        $twenty = array_sum($totals);

        if (
            abs(
                (float) $payload['projections']['annualBenefit'] - $annual
            ) > max(0.05, abs($annual) * 0.0000001) ||
            abs(
                (float) $payload['projections']['totalValue'] - $twenty
            ) > max(0.05, abs($twenty) * 0.0000001)
        ) {
            throw ValidationException::withMessages([
                'data.projections' =>
                    'TTS annual or 20-year total does not match the calculations.',
            ]);
        }

        return [
            round($annual, 2),
            round($twenty, 2),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | SAVINGS IN TRANSPORT LOSSES (STL)
    |--------------------------------------------------------------------------
    */

    public function stlIndex(Subproject $subproject): JsonResponse
    {
        $record = STL::where(
            'subproject_id',
            $subproject->getKey()
        )->first();

        return response()->json([
            'success' => true,
            'data' => $record?->data,
            'stl_id' => $record?->getKey(),
            'annual_savings' => $record?->annual_savings,
            'twenty_year_savings' => $record?->twenty_year_savings,
            'created_at' => $record?->created_at,
            'updated_at' => $record?->updated_at,
        ]);
    }

    public function stlStore(
        Request $request,
        Subproject $subproject
    ): JsonResponse {
        $data = $this->validateSTL($request);

        [$annual, $twenty] = $this->calculateSTL($data);

        $record = DB::transaction(fn () => STL::updateOrCreate(
            ['subproject_id' => $subproject->getKey()],
            [
                'benefit_category' => 'Savings in Transport Losses',
                'annual_savings' => $annual,
                'twenty_year_savings' => $twenty,
                'data' => $data,
            ]
        ));

        return response()->json([
            'success' => true,
            'message' => 'STL saved successfully.',
            'data' => $record->fresh(),
        ], 201);
    }

    public function stlShow(
        Subproject $subproject,
        STL $stl
    ): JsonResponse {
        $this->ensureSTLBelongsToSubproject($subproject, $stl);

        return response()->json([
            'success' => true,
            'data' => $stl,
        ]);
    }

    public function stlUpdate(
        Request $request,
        Subproject $subproject,
        STL $stl
    ): JsonResponse {
        $this->ensureSTLBelongsToSubproject($subproject, $stl);

        $data = $this->validateSTL($request);

        [$annual, $twenty] = $this->calculateSTL($data);

        DB::transaction(fn () => $stl->update([
            'annual_savings' => $annual,
            'twenty_year_savings' => $twenty,
            'data' => $data,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'STL updated successfully.',
            'data' => $stl->fresh(),
        ]);
    }

    public function stlDestroy(Subproject $subproject): JsonResponse
    {
        DB::transaction(function () use ($subproject) {
            STL::where(
                'subproject_id',
                $subproject->getKey()
            )->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'STL deleted successfully.',
        ]);
    }

    private function validateSTL(Request $request): array
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],

            'data.benefit_category' => [
                'required',
                'in:Savings in Transport Losses',
            ],

            'data.crops' => [
                'required',
                'array',
                'min:1',
            ],

            'data.crops.*.name' => [
                'required',
                'string',
                'max:255',
            ],

            'data.crops.*.pricePerKg' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.crops.*.kgPerUnit' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'data.crops.*.wop' => [
                'required',
                'numeric',
                'between:0,1',
            ],

            'data.crops.*.wp' => [
                'required',
                'numeric',
                'between:0,1',
            ],

            'data.crops.*.volumes' => [
                'required',
                'array',
                'size:20',
            ],

            'data.crops.*.volumes.*' => [
                'required',
                'numeric',
                'min:0',
            ],

            'data.yearly_totals' => [
                'required',
                'array',
                'size:20',
            ],

            'data.yearly_totals.*' => [
                'required',
                'numeric',
            ],

            'data.annual_benefit' => [
                'required',
                'numeric',
            ],

            'data.twenty_year_savings' => [
                'required',
                'numeric',
            ],
        ]);

        return $validated['data'];
    }

    private function calculateSTL(array $data): array
    {
        $totals = array_fill(0, 20, 0.0);

        foreach ($data['crops'] as $crop) {
            $wop = (float) $crop['wop'];
            $wp = (float) $crop['wp'];

            if ($wp > $wop) {
                throw ValidationException::withMessages([
                    'data.crops' =>
                        'With-project losses cannot exceed without-project losses.',
                ]);
            }

            $unitPrice = (float) $crop['pricePerKg']
                * (float) $crop['kgPerUnit'];

            foreach ($crop['volumes'] as $index => $volume) {
                $totals[$index] += (float) $volume
                    * $unitPrice
                    * ($wop - $wp);
            }
        }

        foreach ($totals as $index => $total) {
            if (
                abs($total - (float) $data['yearly_totals'][$index]) > 0.05
            ) {
                throw ValidationException::withMessages([
                    'data.yearly_totals' =>
                        'STL yearly totals do not match crop calculations.',
                ]);
            }
        }

        $annual = $totals[0];
        $twenty = array_sum($totals);

        if (
            abs($annual - (float) $data['annual_benefit']) > 0.05 ||
            abs($twenty - (float) $data['twenty_year_savings']) > 0.05
        ) {
            throw ValidationException::withMessages([
                'data.annual_benefit' =>
                    'STL annual or 20-year totals do not match calculations.',
            ]);
        }

        return [
            round($annual, 2),
            round($twenty, 2),
        ];
    }

    /*
    |--------------------------------------------------------------------------
    | BENEFITS OF NEWLY CULTIVATED AGRICULTURAL LAND (NGA)
    |--------------------------------------------------------------------------
    */

    public function ngaIndex(Subproject $subproject): JsonResponse
    {
        $record = NGA::where(
            'subproject_id',
            $subproject->getKey()
        )->first();

        return response()->json([
            'success' => true,
            'data' => $record?->data,
            'nga_id' => $record?->getKey(),
            'annual_savings' => $record?->annual_savings,
            'twenty_year_savings' => $record?->twenty_year_savings,
            'created_at' => $record?->created_at,
            'updated_at' => $record?->updated_at,
        ]);
    }

    public function ngaStore(
        Request $request,
        Subproject $subproject
    ): JsonResponse {
        $data = $this->validateNGA($request);

        [$annual, $twenty] = $this->calculateNGA($data);

        $record = DB::transaction(fn () => NGA::updateOrCreate(
            ['subproject_id' => $subproject->getKey()],
            [
                'benefit_category' =>
                    'Benefits of Newly Cultivated Agricultural Land',
                'annual_savings' => $annual,
                'twenty_year_savings' => $twenty,
                'data' => $data,
            ]
        ));

        return response()->json([
            'success' => true,
            'message' => 'NGA saved successfully.',
            'data' => $record->fresh(),
        ], 201);
    }

    public function ngaShow(
        Subproject $subproject,
        NGA $nga
    ): JsonResponse {
        $this->ensureNGABelongsToSubproject($subproject, $nga);

        return response()->json([
            'success' => true,
            'data' => $nga,
        ]);
    }

    public function ngaUpdate(
        Request $request,
        Subproject $subproject,
        NGA $nga
    ): JsonResponse {
        $this->ensureNGABelongsToSubproject($subproject, $nga);

        $data = $this->validateNGA($request);

        [$annual, $twenty] = $this->calculateNGA($data);

        DB::transaction(fn () => $nga->update([
            'annual_savings' => $annual,
            'twenty_year_savings' => $twenty,
            'data' => $data,
        ]));

        return response()->json([
            'success' => true,
            'message' => 'NGA updated successfully.',
            'data' => $nga->fresh(),
        ]);
    }

    public function ngaDestroy(Subproject $subproject): JsonResponse
    {
        DB::transaction(function () use ($subproject) {
            NGA::where(
                'subproject_id',
                $subproject->getKey()
            )->delete();
        });

        return response()->json([
            'success' => true,
            'message' => 'NGA deleted successfully.',
        ]);
    }

    private function validateNGA(Request $request): array
    {
        $validated = $request->validate([
            'data' => ['required', 'array'],

            'data.benefit_category' => [
                'required',
                'in:Benefits of Newly Cultivated Agricultural Land',
            ],

            'data.commodity' => [
                'required',
                'string',
                'max:255',
            ],

            'data.unit' => [
                'required',
                'string',
                'max:50',
            ],

            'data.areaSource' => [
                'nullable',
                'string',
            ],

            'data.years' => [
                'required',
                'array',
                'size:20',
            ],

            'data.years.*.area' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.years.*.yieldPerHa' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.years.*.price' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.years.*.landCost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.years.*.productionCost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.farmgate' => ['required', 'array'],

            'data.farmgate.crop' => [
                'nullable',
                'string',
                'max:255',
            ],

            'data.farmgate.pricePerKg' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.farmgate.kgPerUnit' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.farmgate.source' => [
                'nullable',
                'string',
            ],

            'data.landItems' => [
                'required',
                'array',
            ],

            'data.productionItems' => [
                'required',
                'array',
            ],

            'data.landItems.*.id' => [
                'required',
                'string',
                'max:255',
            ],

            'data.productionItems.*.id' => [
                'required',
                'string',
                'max:255',
            ],

            'data.landItems.*.label' => [
                'nullable',
                'string',
                'max:255',
            ],

            'data.productionItems.*.label' => [
                'nullable',
                'string',
                'max:255',
            ],

            'data.landItems.*.unit' => [
                'nullable',
                'string',
                'max:50',
            ],

            'data.productionItems.*.unit' => [
                'nullable',
                'string',
                'max:50',
            ],

            'data.landItems.*.cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.productionItems.*.cost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.landItems.*.qty' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.productionItems.*.qty' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.landItems.*.factor' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.productionItems.*.factor' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.cycles' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.landSource' => [
                'nullable',
                'string',
            ],

            'data.productionSource' => [
                'nullable',
                'string',
            ],

            'data.marketingCostPerUnit' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.marketingCostOverride' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'data.calculated' => ['required', 'array'],

            'data.calculated.rows' => [
                'required',
                'array',
                'size:20',
            ],

            'data.calculated.annualSavings' => [
                'required',
                'numeric',
            ],

            'data.calculated.twentyYearSavings' => [
                'required',
                'numeric',
            ],
        ]);

        return $validated['data'];
    }

    private function calculateNGAItem(
        array $item,
        string $section
    ): float {
        $financial = (float) ($item['cost'] ?? 0)
            * (float) ($item['qty'] ?? 0);

        $factor = (float) ($item['factor'] ?? 0);

        $economic = $factor > 0
            ? $financial / $factor
            : 0.0;

        $id = (string) ($item['id'] ?? '');

        if (
            $section === 'land' &&
            in_array($id, ['45', '46'], true)
        ) {
            return 0.0;
        }

        if (
            $section === 'production' &&
            in_array($id, ['71', '72'], true)
        ) {
            return $factor > 0
                ? (
                    $financial * 0.4 +
                    $financial * 0.6 * 1.2
                ) / $factor
                : 0.0;
        }

        return $economic;
    }

    private function calculateNGA(array $data): array
    {
        $land = array_reduce(
            $data['landItems'],
            fn ($sum, $item) =>
                $sum + $this->calculateNGAItem($item, 'land'),
            0.0
        );

        $production = array_reduce(
            $data['productionItems'],
            fn ($sum, $item) =>
                $sum + $this->calculateNGAItem($item, 'production'),
            0.0
        );

        $production *= (float) ($data['cycles'] ?? 0);

        $farmgate = (float) ($data['farmgate']['pricePerKg'] ?? 0)
            * (float) ($data['farmgate']['kgPerUnit'] ?? 0);

        $marketingRate = (float) ($data['marketingCostPerUnit'] ?? 0);

        $previousArea = 0.0;
        $previousMarketing = 0.0;
        $totals = [];

        foreach ($data['years'] as $index => $input) {
            $area = (
                $index > 0 &&
                ($input['area'] ?? '') === ''
            )
                ? $previousArea
                : (float) ($input['area'] ?? 0);

            $output = $area * (float) ($input['yieldPerHa'] ?? 0);

            $price = ($input['price'] ?? '') === ''
                ? $farmgate
                : (float) $input['price'];

            $landCost = ($input['landCost'] ?? '') === ''
                ? $land
                : (float) $input['landCost'];

            $productionCost = ($input['productionCost'] ?? '') === ''
                ? $production
                : (float) $input['productionCost'];

            $marketing = $index === 0
                ? (
                    ($data['marketingCostOverride'] ?? '') === ''
                        ? $output * $marketingRate
                        : (float) $data['marketingCostOverride']
                )
                : $previousMarketing;

            $cost = $index === 0
                ? ($productionCost + $landCost) * $area + $marketing
                : ($area - $previousArea) * $landCost
                    + $productionCost * $area
                    + $marketing;

            $net = $output * $price - $cost;

            $submitted = $data['calculated']['rows'][$index] ?? [];

            if (
                !is_finite($net) ||
                !isset($submitted['netBenefit']) ||
                abs($net - (float) $submitted['netBenefit']) >
                max(0.05, abs($net) * 0.0000001)
            ) {
                throw ValidationException::withMessages([
                    'data.calculated.rows' =>
                        'NGA year ' . ($index + 1) .
                        ' does not match the worksheet calculations.',
                ]);
            }

            $totals[] = $net;

            $previousArea = $area;
            $previousMarketing = $marketing;
        }

        $annual = $totals[0];
        $twenty = array_sum($totals);

        if (
            abs(
                $annual - (float) $data['calculated']['annualSavings']
            ) > 0.05 ||
            abs(
                $twenty - (float) $data['calculated']['twentyYearSavings']
            ) > 0.05
        ) {
            throw ValidationException::withMessages([
                'data.calculated' =>
                    'NGA annual or 20-year total does not match the calculated benefits.',
            ]);
        }

        return [
            round($annual, 2),
            round($twenty, 2),
        ];
    }
}
