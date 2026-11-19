<?php

namespace App\Http\Controllers;

use App\Models\IMC;
use App\Models\SVOC;
use App\Models\SOH;
use App\Models\SIH;
use App\Models\TTS;
use App\Models\NGA;
use App\Models\TTS_Benefits;
use App\Models\STL;
use App\Models\Subproject;
use Illuminate\Database\Eloquent\Collection;
use Inertia\Inertia;
use Inertia\Response;

class EconomicAnalysisController extends Controller
{
    /**
     * Display the economic analysis for a selected subproject.
     */
    public function index(Subproject $subproject): Response
    {
        $subprojectId = $subproject->getKey();

        // ---------------------------------------------
        // ECONOMIC COST RECORD
        // ---------------------------------------------

        $imc = IMC::where('subproject_id', $subprojectId)->first();

        // ---------------------------------------------
        // ECONOMIC BENEFIT RECORDS
        // ---------------------------------------------

        $records = [
            'voc' => SVOC::where('subproject_id', $subprojectId)->get(),
            'soh' => SOH::where('subproject_id', $subprojectId)->get(),
            'sih' => SIH::where('subproject_id', $subprojectId)->get(),
            'tts' => TTS::where('subproject_id', $subprojectId)->get(),
            'nga' => NGA::where('subproject_id', $subprojectId)->get(),
            'stl' => STL::where('subproject_id', $subprojectId)->get(),
        ];

        // ---------------------------------------------
        // AGGREGATE YEAR 1–20 BENEFIT PROJECTIONS
        // ---------------------------------------------

        $benefits = [];

        foreach ($records as $category => $categoryRecords) {
            if ($category === 'tts') {
                $benefits['tts'] = $this->ttsBenefitSeries(
                    $categoryRecords
                );

                continue;
            }

            $benefits[$category] = $this->aggregateBenefitRecords(
                $categoryRecords,
                $category
            );
        }

        // ---------------------------------------------
        // ECONOMIC COST PROJECTIONS
        // ---------------------------------------------

        $costs = $this->costSeries($imc);

        // ---------------------------------------------
        // RETURN DATA TO INERTIA
        // ---------------------------------------------

        return Inertia::render(
            'EconomicAnalysis/EconomicAnalysis',
            [
                'subproject' => $subproject,
                'subproject_id' => $subprojectId,

                'economic_analysis' => [
                    'investment' => $imc
                        ? $this->numericValue(
                            $imc->investment_economic_cost
                        )
                        : null,

                    'maintenance' => $imc
                        ? $this->numericValue(
                            $imc->annual_maintenance_economic_cost
                        )
                        : null,

                    'cropProductionForegone' => null,

                    'investmentYears' => $costs['investment'],
                    'maintenanceYears' => $costs['maintenance'],

                    'benefits' => $benefits,
                ],

                'economic_benefits' => [],
            ]
        );
    }

    /**
     * Create 21 values for Year 0 through Year 20.
     */
    private function costSeries($imc): array
    {
        $investment = array_fill(0, 21, null);
        $maintenance = array_fill(0, 21, null);

        if (!$imc) {
            return [
                'investment' => $investment,
                'maintenance' => $maintenance,
            ];
        }

        // Initial investment is recorded in Year 0.
        $investment[0] = $this->numericValue(
            $imc->investment_economic_cost
        );

        // No annual maintenance in Year 0.
        $maintenance[0] = 0;

        // Default annual maintenance for Years 1–20.
        for ($year = 1; $year <= 20; $year++) {
            $investment[$year] = 0;

            $maintenance[$year] = $this->numericValue(
                $imc->annual_maintenance_economic_cost
            );
        }

        // Optional saved year-by-year cost overrides.
        $yearlyCosts = $this->decodeArray(
            $imc->yearly_costs ?? []
        );

        foreach ($yearlyCosts as $key => $entry) {
            if (!is_array($entry)) {
                continue;
            }

            $year = $entry['year']
                ?? $entry['year_number']
                ?? $entry['yearNo']
                ?? $entry['year_no']
                ?? null;

            if (
                $year === null &&
                preg_match(
                    '/^year_?(\d+)$/i',
                    (string) $key,
                    $matches
                )
            ) {
                $year = $matches[1];
            }

            if ($year === null && is_numeric($key)) {
                $year = $key;
            }

            $year = is_numeric($year) ? (int) $year : -1;

            if ($year < 0 || $year > 20) {
                continue;
            }

            $investmentValue = $this->firstNumericValue($entry, [
                'investment_economic_cost',
                'investment',
                'investment_cost',
                'economic_investment',
                'total_economic_cost',
            ]);

            $maintenanceValue = $this->firstNumericValue($entry, [
                'annual_maintenance_economic_cost',
                'maintenance',
                'maintenance_cost',
                'economic_maintenance',
                'total_maintenance',
            ]);

            if ($investmentValue !== null) {
                $investment[$year] = $investmentValue;
            }

            if ($maintenanceValue !== null) {
                $maintenance[$year] = $maintenanceValue;
            }
        }

        return [
            'investment' => $investment,
            'maintenance' => $maintenance,
        ];
    }

    /**
     * Aggregate yearly values from multiple records in one category.
     */
    private function aggregateBenefitRecords(
        Collection $records,
        string $category
    ): array {
        $totals = array_fill(0, 21, null);
        $totals[0] = 0;

        foreach ($records as $record) {
            $series = $this->benefitSeries($record, $category);

            for ($year = 1; $year <= 20; $year++) {
                if ($series[$year] === null) {
                    continue;
                }

                if ($totals[$year] === null) {
                    $totals[$year] = 0;
                }

                $totals[$year] += $series[$year];
            }
        }

        return $totals;
    }

    /**
     * Extract yearly savings for an individual benefit record.
     */
    private function benefitSeries($record, string $category): array
    {
        $data = $this->decodeArray($record->data ?? []);

        $series = array_fill(0, 21, null);
        $series[0] = 0;

        $valueFields = [
            'total',
            'annual_savings',
            'annualSavings',
            'total_savings',
            'totalSavings',
            'annual_benefit',
            'annualBenefit',
            'netBenefit',
            'net_benefit',
            'yearly_savings',
            'yearlySavings',
            'yearly_benefits',
            'yearlyBenefits',
            'savings',
            'value',
        ];

        // ==========================================
        // SOH: YEAR 1 TO YEAR 20 ANNUAL SAVINGS
        // ==========================================

        if ($category === 'soh') {
            $containers = [
                $data,
                $this->decodeArray($data['tab1'] ?? []),
                $this->decodeArray($data['tab2'] ?? []),
                $this->decodeArray($data['tab3'] ?? []),
                $this->decodeArray($data['tab4'] ?? []),
                $this->decodeArray($data['projection'] ?? []),
                $this->decodeArray($data['projections'] ?? []),
                $this->decodeArray($data['summary'] ?? []),
            ];

            // IMPORTANT:
            // Do not include "years" here.
            // data.years may contain only [1, 2, 3, ..., 20],
            // which are year labels, not savings amounts.
            $projectionFields = [
                'yearly_savings',
                'yearlySavings',
                'yearly_benefits',
                'yearlyBenefits',
                'yearly_totals',
                'yearlyTotals',
                'annual_projections',
                'annualProjections',
                'annual_benefits',
                'annualBenefits',
                'projections',
            ];

            // 1. First, look for actual saved year-by-year projections.
            foreach ($containers as $container) {
                if (!is_array($container)) {
                    continue;
                }

                foreach ($projectionFields as $field) {
                    if (!array_key_exists($field, $container)) {
                        continue;
                    }

                    $candidate = $this->decodeArray(
                        $container[$field]
                    );

                    if (empty($candidate)) {
                        continue;
                    }

                    $parsed = $this->parseYearlyProjection(
                        $candidate,
                        $valueFields
                    );

                    if ($this->hasYearlyValues($parsed)) {
                        return $parsed;
                    }
                }
            }

            // 2. Read annual savings from the SOH summary.
            $summary = $this->decodeArray(
                $data['summary'] ?? []
            );

            $annualSavings = $this->firstNumericValue($summary, [
                'annualHaulingSaving',
                'annual_hauling_saving',
                'annual_savings',
                'annualSavings',
                'totalAnnualSavings',
                'total_annual_savings',
            ]);

            // 3. Try the root data JSON.
            if ($annualSavings === null) {
                $annualSavings = $this->firstNumericValue($data, [
                    'annual_savings',
                    'annualSavings',
                    'annualHaulingSaving',
                    'annual_hauling_saving',
                    'total_annual_savings',
                    'totalAnnualSavings',
                ]);
            }

            // 4. Try the SOH database annual_savings column.
            if ($annualSavings === null) {
                $annualSavings = $this->numericValue(
                    $record->annual_savings ?? null
                );
            }

            // 5. Last fallback: derive annual savings from
            // the saved 20-year total.
            if ($annualSavings === null) {
                $twentyYearTotal = $this->numericValue(
                    $record->twenty_year_savings ?? null
                );

                if ($twentyYearTotal !== null) {
                    $annualSavings = $twentyYearTotal / 20;
                }
            }

            // 6. Repeat annual savings across Years 1–20.
            if ($annualSavings !== null) {
                for ($year = 1; $year <= 20; $year++) {
                    $series[$year] = $annualSavings;
                }

                return $series;
            }

            return $series;
        }

        // ==========================================
        // SIH: YEARLY ANNUAL SAVINGS
        // ==========================================

        if ($category === 'sih') {
            $yearlyBenefits = $this->decodeArray(
                $data['yearly_benefits'] ?? []
            );

            $parsed = $this->parseYearlyProjection(
                $yearlyBenefits,
                [
                    'total',
                    'annual_savings',
                    'annualSavings',
                    'value',
                ]
            );

            if ($this->hasYearlyValues($parsed)) {
                return $parsed;
            }

            // Fallback: add yearly savings from each crop.
            $crops = $this->decodeArray(
                $data['crops'] ?? []
            );

            foreach ($crops as $crop) {
                if (!is_array($crop)) {
                    continue;
                }

                $cropYears = $this->decodeArray(
                    $crop['yearly']
                    ?? $crop['years']
                    ?? $crop['yearly_savings']
                    ?? $crop['yearlySavings']
                    ?? []
                );

                $cropSeries = $this->parseYearlyProjection(
                    $cropYears,
                    [
                        'annual_savings',
                        'annualSavings',
                        'total',
                        'value',
                    ]
                );

                for ($year = 1; $year <= 20; $year++) {
                    if ($cropSeries[$year] === null) {
                        continue;
                    }

                    $series[$year] = ($series[$year] ?? 0)
                        + $cropSeries[$year];
                }
            }

            return $series;
        }

        // ==========================================
        // OTHER BENEFIT CATEGORIES
        // VOC, NGA, STL
        // ==========================================

        $containers = [
            $data,
            $this->decodeArray($data['tab1'] ?? []),
            $this->decodeArray($data['tab2'] ?? []),
            $this->decodeArray($data['tab3'] ?? []),
            $this->decodeArray($data['tab4'] ?? []),
            $this->decodeArray($data['projection'] ?? []),
            $this->decodeArray($data['projections'] ?? []),
            $this->decodeArray($data['summary'] ?? []),
        ];

        $projectionFields = [
            'yearly_savings',
            'yearlySavings',
            'yearly_totals',
            'yearlyTotals',
            'yearly_benefits',
            'yearlyBenefits',
            'annual_savings',
            'annualSavings',
            'annual_projections',
            'annualProjections',
            'annual_benefits',
            'annualBenefits',
            'calculated_rows',
            'calculatedRows',
            'cropCalculations',
        ];

        // VOC yearly projections may be stored in Tab 3.
        if ($category === 'voc') {
            $containers = array_merge(
                [
                    $this->decodeArray($data['tab3'] ?? []),
                ],
                $containers
            );
        }

        foreach ($containers as $container) {
            if (!is_array($container)) {
                continue;
            }

            foreach ($projectionFields as $field) {
                if (!array_key_exists($field, $container)) {
                    continue;
                }

                $candidate = $this->decodeArray(
                    $container[$field]
                );

                if (empty($candidate)) {
                    continue;
                }

                $parsed = $this->parseYearlyProjection(
                    $candidate,
                    $valueFields
                );

                if ($this->hasYearlyValues($parsed)) {
                    return $parsed;
                }
            }
        }

        // ==========================================
        // FALLBACK: YEAR 1 ANNUAL SAVINGS
        // ==========================================

        $annualSavings = $this->firstNumericValue($data, [
            'annual_savings',
            'annualSavings',
            'total_annual_savings',
            'totalAnnualSavings',
            'annual_benefit',
            'annualBenefit',
            'total_savings',
            'totalSavings',
        ]);

        if ($annualSavings === null) {
            $annualSavings = $this->numericValue(
                $record->annual_savings ?? null
            );
        }

        if ($annualSavings !== null) {
            $series[1] = $annualSavings;
        }

        return $series;
    }

    /**
     * Convert supported projection formats into a 21-value array.
     *
     * 20 sequential values = Years 1–20.
     * 21 sequential values = Years 0–20.
     * Explicit year values take priority.
     */
    private function parseYearlyProjection(
        array $rows,
        array $valueFields = []
    ): array {
        $series = array_fill(0, 21, null);
        $series[0] = 0;

        if (empty($valueFields)) {
            $valueFields = [
                'total',
                'total_savings',
                'totalSavings',
                'total_benefit',
                'totalBenefit',
                'annual_savings',
                'annualSavings',
                'annual_benefit',
                'annualBenefit',
                'yearly_savings',
                'yearlySavings',
                'yearly_benefits',
                'yearlyBenefits',
                'total_value',
                'totalValue',
                'savings',
                'value',
            ];
        }

        $isList = array_is_list($rows);
        $rowCount = count($rows);

        foreach ($rows as $key => $entry) {
            $year = null;
            $value = null;

            if (is_array($entry)) {
                $yearValue = $entry['year']
                    ?? $entry['project_year']
                    ?? $entry['year_number']
                    ?? $entry['yearNo']
                    ?? $entry['year_no']
                    ?? $entry['yearNumber']
                    ?? null;

                $value = $this->firstNumericValue(
                    $entry,
                    $valueFields
                );

                if (
                    $yearValue !== null &&
                    is_numeric($yearValue)
                ) {
                    $year = (int) $yearValue;
                } elseif ($isList && $rowCount === 20) {
                    $year = (int) $key + 1;
                } elseif ($isList && $rowCount === 21) {
                    $year = (int) $key;
                }
            } else {
                $value = $this->numericValue($entry);

                if (is_numeric($key)) {
                    $year = (int) $key;

                    if ($isList && $rowCount === 20) {
                        $year++;
                    }
                } elseif (
                    preg_match(
                        '/^year_?(\d+)$/i',
                        (string) $key,
                        $matches
                    )
                ) {
                    $year = (int) $matches[1];
                }
            }

            if (
                $year !== null &&
                $year >= 1 &&
                $year <= 20 &&
                $value !== null
            ) {
                $series[$year] = $value;
            }
        }

        return $series;
    }

    /**
     * Check whether at least one value exists in Years 1–20.
     */
    private function hasYearlyValues(array $series): bool
    {
        for ($year = 1; $year <= 20; $year++) {
            if (
                array_key_exists($year, $series) &&
                $series[$year] !== null
            ) {
                return true;
            }
        }

        return false;
    }

    /**
     * Decode JSON strings and normalize values to arrays.
     */
    private function decodeArray($value): array
    {
        if (is_string($value)) {
            $decoded = json_decode($value, true);

            return is_array($decoded) ? $decoded : [];
        }

        return is_array($value) ? $value : [];
    }

    /**
     * Return the first valid numeric value from a list of fields.
     */
    private function firstNumericValue(
        array $data,
        array $fields
    ): ?float {
        foreach ($fields as $field) {
            if (
                array_key_exists($field, $data) &&
                $data[$field] !== null &&
                $data[$field] !== '' &&
                is_numeric($data[$field])
            ) {
                return (float) $data[$field];
            }
        }

        return null;
    }

    /**
     * Convert a numeric value to float while preserving null values.
     */
    private function numericValue($value): ?float
    {
        if (
            $value === null ||
            $value === '' ||
            !is_numeric($value)
        ) {
            return null;
        }

        return (float) $value;
    }

    /**
     * Get TTS Year 1–20 from the tts_benefits table.
     */
    private function ttsBenefitSeries(
        Collection $ttsRecords
    ): array {
        $totals = array_fill(0, 21, null);
        $totals[0] = 0;

        // Use each TTS model's actual primary key.
        $ttsIds = $ttsRecords
            ->map(fn ($record) => $record->getKey())
            ->filter()
            ->values();

        if ($ttsIds->isEmpty()) {
            return $totals;
        }

        $yearlyRecords = TTS_Benefits::whereIn(
            'tts_id',
            $ttsIds
        )
            ->orderBy('project_year')
            ->get();

        foreach ($yearlyRecords as $yearlyRecord) {
            $year = (int) $yearlyRecord->project_year;

            if ($year < 1 || $year > 20) {
                continue;
            }

            $amount = $this->numericValue(
                $yearlyRecord->annual_savings
            );

            if ($amount === null) {
                continue;
            }

            if ($totals[$year] === null) {
                $totals[$year] = 0;
            }

            $totals[$year] += $amount;
        }

        return $totals;
    }
}
