<?php

namespace App\Http\Controllers;

use App\Models\ECOS;
use App\Models\SRC;
use App\Models\RMUC;
use App\Models\Subproject;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class CostComponentController extends Controller
{
    /*
    |--------------------------------------------------------------------------
    | SUBPROJECT HELPERS
    |--------------------------------------------------------------------------
    */

    private function subprojects()
    {
        return Subproject::query()
            ->orderBy('subproject_title')
            ->get([
                'subproject_id',
                'subproject_code',
                'subproject_title',
                'subproject_location',
                'subproject_proponent',
                'subject_category',
                'project_scale_dimension',
                'total_project_cost',
                'world_bank_share',
                'gop_share',
                'lgu_share',
                'status',
            ]);
    }

    private function findSubproject(string|int $subproject): Subproject
    {
        return Subproject::query()
            ->where('subproject_id', $subproject)
            ->firstOrFail();
    }

    private function normalizeEvaluationYear(Request $request): void
    {
        $request->merge([
            'evaluationYear' => $request->input('evaluationYear')
                ?? $request->input('evaluation_year'),
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | INDEX
    |--------------------------------------------------------------------------
    */

    public function index(): Response
    {
        return Inertia::render('CostComponents/CostComponents', [
            'subprojects' => $this->subprojects(),
            'selectedSubproject' => null,
            'economicCostAnalyses' => [],
            'safeguardCostAnalyses' => [],
            'rmucAnalyses' => [],
            'annualMaintenanceAnalyses' => [],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | SHOW SELECTED SUBPROJECT
    |--------------------------------------------------------------------------
    */

    public function show(string|int $subproject): Response
    {
        $selectedSubproject = $this->findSubproject($subproject);

        $subprojectId = $selectedSubproject->subproject_id;

        $economicCostAnalyses = ECOS::query()
            ->where('subproject_id', $subprojectId)
            ->orderByDesc('evaluation_year')
            ->orderByDesc('id')
            ->get();

        $safeguardCostAnalyses = SRC::query()
            ->where('subproject_id', $subprojectId)
            ->orderByDesc('evaluation_year')
            ->get();

        $rmucAnalyses = RMUC::query()
            ->where('subproject_id', $subprojectId)
            ->orderByDesc('evaluation_year')
            ->get();

        return Inertia::render('CostComponents/CostComponents', [
            'subprojects' => $this->subprojects(),
            'selectedSubproject' => $selectedSubproject,
            'economicCostAnalyses' => $economicCostAnalyses,
            'safeguardCostAnalyses' => $safeguardCostAnalyses,
            'rmucAnalyses' => $rmucAnalyses,
            'annualMaintenanceAnalyses' => [],
        ]);
    }

    /*
    |--------------------------------------------------------------------------
    | ECONOMIC COST ANALYSIS (ECOS)
    |--------------------------------------------------------------------------
    */

    public function storeEconomicCost(
        Request $request,
        string|int $subproject
    ): RedirectResponse {
        $selectedSubproject = $this->findSubproject($subproject);

        $this->normalizeEvaluationYear($request);

        /*
         * Support both the old safeguardCost field and
         * the newer safeguardFinancialCost field.
         */
        $request->merge([
            'safeguardCost' => $request->input('safeguardCost')
                ?? $request->input('safeguardFinancialCost')
                ?? 0,
        ]);

        $validated = $request->validate([
            'evaluationYear' => [
                'required',
                'integer',
                'min:2000',
                'max:2100',
            ],

            'materials' => ['required', 'numeric', 'min:0'],
            'equipment' => ['required', 'numeric', 'min:0'],
            'subtotalLabor' => ['required', 'numeric', 'min:0'],
            'ocm' => ['required', 'numeric', 'min:0'],
            'contractorProfit' => ['required', 'numeric', 'min:0'],
            'taxes' => ['required', 'numeric', 'min:0'],
            'preEngineering' => ['required', 'numeric', 'min:0'],
            'engineeringSupervision' => ['required', 'numeric', 'min:0'],

            'safeguardCost' => ['required', 'numeric', 'min:0'],

            'safeguardFinancialCost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'safeguardEconomicCost' => [
                'nullable',
                'numeric',
                'min:0',
            ],

            'foreign_factor' => [
                'required',
                'numeric',
                'min:0',
            ],

            'unskilled_factor' => [
                'required',
                'numeric',
                'min:0',
            ],

            'calculations' => ['required', 'array'],

            'calculations.financialTotal' => [
                'required',
                'numeric',
                'min:0',
            ],

            'calculations.economicTotal' => [
                'required',
                'numeric',
                'min:0',
            ],

            'calculations.savings' => [
                'required',
                'numeric',
            ],
        ]);

        $evaluationYear = (int) $validated['evaluationYear'];

        $safeguardFinancialCost = (float) (
            $validated['safeguardFinancialCost']
            ?? $validated['safeguardCost']
        );

        $safeguardEconomicCost = (float) (
            $validated['safeguardEconomicCost'] ?? 0
        );

        /*
         * Store all submitted ECOS inputs in JSON.
         */
        $inputValues = [
            'evaluationYear' => $evaluationYear,

            'materials' => (float) $validated['materials'],
            'equipment' => (float) $validated['equipment'],
            'subtotalLabor' => (float) $validated['subtotalLabor'],

            'ocm' => (float) $validated['ocm'],
            'contractorProfit' => (float) $validated['contractorProfit'],
            'taxes' => (float) $validated['taxes'],

            'preEngineering' => (float) $validated['preEngineering'],
            'engineeringSupervision' => (float) $validated['engineeringSupervision'],

            'safeguardCost' => $safeguardFinancialCost,
            'safeguardFinancialCost' => $safeguardFinancialCost,
            'safeguardEconomicCost' => $safeguardEconomicCost,
        ];

        /*
         * Normalize calculated values before saving.
         */
        $calculations = $validated['calculations'];

        $calculations['financialTotal'] = (float) $calculations['financialTotal'];
        $calculations['economicTotal'] = (float) $calculations['economicTotal'];
        $calculations['savings'] = (float) $calculations['savings'];

        $calculations['safeguardFinancialCost'] = $safeguardFinancialCost;
        $calculations['safeguardEconomicCost'] = $safeguardEconomicCost;

        /*
         * Save or update one ECOS record for each
         * subproject and evaluation year.
         */
        DB::transaction(function () use (
            $selectedSubproject,
            $evaluationYear,
            $inputValues,
            $calculations,
            $validated
        ) {
            ECOS::updateOrCreate(
                [
                    'subproject_id' => $selectedSubproject->subproject_id,
                    'evaluation_year' => $evaluationYear,
                ],
                [
                    'input_values' => $inputValues,
                    'calculations' => $calculations,
                    'foreign_factor' => (float) $validated['foreign_factor'],
                    'unskilled_factor' => (float) $validated['unskilled_factor'],
                ]
            );
        });

        return redirect()
            ->back()
            ->with('success', 'Economic cost analysis saved successfully.');
    }

    /*
    |--------------------------------------------------------------------------
    | SAFEGUARD COST ANALYSIS (SRC)
    |--------------------------------------------------------------------------
    */

    public function storeSRC(
        Request $request,
        string|int $subproject
    ): RedirectResponse {
        $selectedSubproject = $this->findSubproject($subproject);

        $this->normalizeEvaluationYear($request);

        $validated = $request->validate([
            'evaluationYear' => [
                'required',
                'integer',
                'min:2000',
                'max:2100',
            ],

            'values' => ['required', 'array'],

            'totalFinancialCost' => [
                'required',
                'numeric',
                'min:0',
            ],

            'totalEconomicCost' => [
                'required',
                'numeric',
                'min:0',
            ],
        ]);

        $evaluationYear = (int) $validated['evaluationYear'];
        $subprojectId = $selectedSubproject->subproject_id;

        $financialCost = (float) $validated['totalFinancialCost'];
        $economicCost = (float) $validated['totalEconomicCost'];

        DB::transaction(function () use (
            $subprojectId,
            $evaluationYear,
            $validated,
            $financialCost,
            $economicCost
        ) {
            SRC::updateOrCreate(
                [
                    'subproject_id' => $subprojectId,
                    'evaluation_year' => $evaluationYear,
                ],
                [
                    'input_values' => $validated['values'],
                    'total_financial_cost' => $financialCost,
                    'total_economic_cost' => $economicCost,
                ]
            );

            /*
             * Synchronize the existing ECOS record
             * for the same subproject and evaluation year.
             */
            $ecos = ECOS::query()
                ->where('subproject_id', $subprojectId)
                ->where('evaluation_year', $evaluationYear)
                ->first();

            if ($ecos) {
                $inputValues = $ecos->input_values ?? [];
                $calculations = $ecos->calculations ?? [];

                $inputValues['safeguardCost'] = $financialCost;
                $inputValues['safeguardFinancialCost'] = $financialCost;
                $inputValues['safeguardEconomicCost'] = $economicCost;

                $calculations['safeguardFinancialCost'] = $financialCost;
                $calculations['safeguardEconomicCost'] = $economicCost;

                $ecos->update([
                    'input_values' => $inputValues,
                    'calculations' => $calculations,
                ]);
            }
        });

        $ecosExists = ECOS::query()
            ->where('subproject_id', $subprojectId)
            ->where('evaluation_year', $evaluationYear)
            ->exists();

        return redirect()
            ->back()
            ->with(
                'success',
                $ecosExists
                    ? 'Safeguard cost saved and synchronized with the matching ECOS evaluation.'
                    : 'Safeguard cost saved. Save the ECOS evaluation for this year to synchronize its safeguard cost.'
            );
    }

    /*
    |--------------------------------------------------------------------------
    | ROAD MAINTENANCE UNIT COST (RMUC)
    |--------------------------------------------------------------------------
    */

    public function storeRMUC(
        Request $request,
        string|int $subproject
    ): RedirectResponse {
        $selectedSubproject = $this->findSubproject($subproject);

        $validated = $request->validate([
            'evaluation_year' => [
                'required',
                'integer',
                'min:1900',
                'max:9999',
            ],

            'conversion_factors' => ['required', 'array'],

            'conversion_factors.equipment' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'conversion_factors.materials' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'conversion_factors.skilledLabor' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'conversion_factors.unskilledLabor' => [
                'required',
                'numeric',
                'gt:0',
            ],

            'activities' => ['required', 'array', 'min:1'],

            'activities.*.title' => [
                'required',
                'string',
                'max:255',
            ],

            'activities.*.equipment' => [
                'required',
                'numeric',
                'min:0',
            ],

            'activities.*.materials' => [
                'required',
                'numeric',
                'min:0',
            ],

            'activities.*.skilledLabor' => [
                'required',
                'numeric',
                'min:0',
            ],

            'activities.*.unskilledLabor' => [
                'required',
                'numeric',
                'min:0',
            ],

            'totalFinancialCost' => [
                'required',
                'numeric',
                'min:0',
            ],

            'totalEconomicCost' => [
                'required',
                'numeric',
                'min:0',
            ],
        ]);

        $factors = $validated['conversion_factors'];

        $financialTotal = 0;
        $economicTotal = 0;

        /*
         * Calculate the totals on the server.
         * Submitted totals are validated for compatibility,
         * but the calculated totals are what get stored.
         */
        $activities = collect($validated['activities'])
            ->map(function ($activity) use (
                $factors,
                &$financialTotal,
                &$economicTotal
            ) {
                $equipment = (float) $activity['equipment'];
                $materials = (float) $activity['materials'];
                $skilledLabor = (float) $activity['skilledLabor'];
                $unskilledLabor = (float) $activity['unskilledLabor'];

                $financial = $equipment
                    + $materials
                    + $skilledLabor
                    + $unskilledLabor;

                $economicEquipment =
                    $equipment / (float) $factors['equipment'];

                $economicMaterials =
                    $materials / (float) $factors['materials'];

                $economicSkilledLabor =
                    $skilledLabor / (float) $factors['skilledLabor'];

                $economicUnskilledLabor =
                    $unskilledLabor / (float) $factors['unskilledLabor'];

                $economic = $economicEquipment
                    + $economicMaterials
                    + $economicSkilledLabor
                    + $economicUnskilledLabor;

                $financialTotal += $financial;
                $economicTotal += $economic;

                return [
                    'title' => trim($activity['title']),

                    'equipment' => $equipment,
                    'materials' => $materials,
                    'skilledLabor' => $skilledLabor,
                    'unskilledLabor' => $unskilledLabor,

                    'totalFinancialCost' => round($financial, 2),

                    'economicEquipmentCost' => round($economicEquipment, 2),
                    'economicMaterialsCost' => round($economicMaterials, 2),
                    'economicSkilledLaborCost' => round($economicSkilledLabor, 2),
                    'economicUnskilledLaborCost' => round($economicUnskilledLabor, 2),

                    'totalEconomicCost' => round($economic, 2),
                ];
            })
            ->values()
            ->all();

        DB::transaction(function () use (
            $selectedSubproject,
            $validated,
            $activities,
            $factors,
            $financialTotal,
            $economicTotal
        ) {
            RMUC::updateOrCreate(
                [
                    'subproject_id' => $selectedSubproject->subproject_id,
                    'evaluation_year' => (int) $validated['evaluation_year'],
                ],
                [
                    'activities' => $activities,
                    'conversion_factors' => $factors,
                    'total_financial_cost' => round($financialTotal, 2),
                    'total_economic_cost' => round($economicTotal, 2),
                ]
            );
        });

        return redirect()
            ->back()
            ->with('success', 'Road Maintenance Unit Cost saved successfully.');
    }

    /*
    |--------------------------------------------------------------------------
    | GET SAVED RMUC RECORDS
    |--------------------------------------------------------------------------
    */

    public function getRMUC(string|int $subproject)
    {
        $selectedSubproject = $this->findSubproject($subproject);

        return RMUC::query()
            ->where('subproject_id', $selectedSubproject->subproject_id)
            ->orderByDesc('evaluation_year')
            ->get();
    }
}
