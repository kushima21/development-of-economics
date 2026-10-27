<?php

namespace App\Http\Controllers;

use App\Models\ECOS;
use App\Models\SRC;
use App\Models\RMUC;
use App\Models\Subproject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\DB;

class CostComponentController extends Controller
{
    /**
     * Shared subproject list for the cost components page.
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

    /**
     * Display the cost components page.
     */
public function index(): Response
{
    return Inertia::render('CostComponents/CostComponents', [
        'subprojects' => $this->subprojects(),
        'selectedSubproject' => null,
        'economicCostAnalyses' => [],
        'safeguardCostAnalyses' => [],
        'rmucAnalyses' => [],
    ]);
}

public function show(int $subproject): Response
{
    $selectedSubproject = Subproject::query()
        ->findOrFail($subproject);

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

    // Load saved RMUC records for this specific subproject.
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
    ]);
}

    /**
     * Create or update the economic cost analysis
     * for a particular subproject and evaluation year.
     */
    public function storeEconomicCost(
        Request $request,
        int $subproject
    ): RedirectResponse {
        $selectedSubproject = Subproject::query()
            ->findOrFail($subproject);

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

            'foreign_factor' => ['required', 'numeric', 'min:0'],
            'unskilled_factor' => ['required', 'numeric', 'min:0'],

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

$inputValues = [
    'evaluationYear' => $evaluationYear,
    'materials' => $validated['materials'],
    'equipment' => $validated['equipment'],
    'subtotalLabor' => $validated['subtotalLabor'],
    'ocm' => $validated['ocm'],
    'contractorProfit' => $validated['contractorProfit'],
    'taxes' => $validated['taxes'],
    'preEngineering' => $validated['preEngineering'],
    'engineeringSupervision' => $validated['engineeringSupervision'],
    'safeguardCost' => $validated['safeguardCost'],
];

ECOS::updateOrCreate(
    [
        'subproject_id' => $selectedSubproject->subproject_id,
        'evaluation_year' => $evaluationYear,
    ],
    [
        'input_values' => $inputValues,
        'calculations' => $validated['calculations'],
        'foreign_factor' => $validated['foreign_factor'],
        'unskilled_factor' => $validated['unskilled_factor'],
    ]
);

        return redirect()
            ->back()
            ->with(
                'success',
                'Economic cost analysis saved successfully.'
            );
    }

    
/**
 * Create or update safeguard-related cost analysis
 * for a selected subproject and evaluation year.
 */
public function storeSRC(
    Request $request,
    int $subproject
): RedirectResponse {
    $selectedSubproject = Subproject::query()
        ->findOrFail($subproject);

    $validated = $request->validate([
        'evaluationYear' => [
            'required',
            'integer',
            'min:2000',
            'max:2100',
        ],
        'values' => [
            'required',
            'array',
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

    $evaluationYear = (int) $validated['evaluationYear'];
    $subprojectId = $selectedSubproject->subproject_id;

    $financialCost = (float) $validated['totalFinancialCost'];
    $economicCost = (float) $validated['totalEconomicCost'];

    /*
     * Save SRC for this subproject and evaluation year.
     */
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
     * Find only the ECOS record for the same year.
     * Do not create an ECOS record if it does not exist yet.
     */
    $ecos = ECOS::query()
        ->where('subproject_id', $subprojectId)
        ->where('evaluation_year', $evaluationYear)
        ->first();

    if ($ecos) {
        $inputValues = $ecos->input_values ?? [];
        $calculations = $ecos->calculations ?? [];

        /*
         * Synchronize the financial safeguard cost into ECOS.
         * Preserve all other ECOS inputs.
         */
        $inputValues['safeguardCost'] = $financialCost;

        /*
         * Also retain both SRC totals for reference in ECOS.
         */
        $inputValues['safeguardFinancialCost'] = $financialCost;
        $inputValues['safeguardEconomicCost'] = $economicCost;

        /*
         * Store the SRC totals in the calculations object.
         * Existing financialTotal and economicTotal are preserved here;
         * see the note below about recalculating overall totals.
         */
        $calculations['safeguardFinancialCost'] = $financialCost;
        $calculations['safeguardEconomicCost'] = $economicCost;

        $ecos->input_values = $inputValues;
        $ecos->calculations = $calculations;
        $ecos->save();
    }

    return redirect()
        ->back()
        ->with(
            'success',
            $ecos
                ? 'Safeguard cost saved and synchronized with the matching ECOS evaluation.'
                : 'Safeguard cost saved. Save the ECOS evaluation for this year to synchronize its safeguard cost.'
        );
}

/**
 * Save or update Road Maintenance Unit Cost (RMUC).
 */

/**
 * Save or update Road Maintenance Unit Cost (RMUC).
 */
public function storeRMUC(Request $request, string $subprojectId): RedirectResponse
{
    $subproject = Subproject::where(
        'subproject_id',
        $subprojectId
    )->firstOrFail();

    $validated = $request->validate([
        'evaluation_year' => [
            'required',
            'integer',
            'min:1900',
            'max:9999',
        ],

        'conversion_factors' => ['required', 'array'],
        'conversion_factors.equipment' => ['required', 'numeric', 'gt:0'],
        'conversion_factors.materials' => ['required', 'numeric', 'gt:0'],
        'conversion_factors.skilledLabor' => ['required', 'numeric', 'gt:0'],
        'conversion_factors.unskilledLabor' => ['required', 'numeric', 'gt:0'],

        'activities' => ['required', 'array', 'min:1'],
        'activities.*.title' => ['required', 'string', 'max:255'],
        'activities.*.equipment' => ['required', 'numeric', 'min:0'],
        'activities.*.materials' => ['required', 'numeric', 'min:0'],
        'activities.*.skilledLabor' => ['required', 'numeric', 'min:0'],
        'activities.*.unskilledLabor' => ['required', 'numeric', 'min:0'],

        'totalFinancialCost' => ['required', 'numeric', 'min:0'],
        'totalEconomicCost' => ['required', 'numeric', 'min:0'],
    ]);

    $factors = $validated['conversion_factors'];

    $financialTotal = 0;
    $economicTotal = 0;

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

            $financial = $equipment + $materials
                + $skilledLabor + $unskilledLabor;

            $economicEquipment = $equipment / (float) $factors['equipment'];
            $economicMaterials = $materials / (float) $factors['materials'];
            $economicSkilledLabor = $skilledLabor / (float) $factors['skilledLabor'];
            $economicUnskilledLabor = $unskilledLabor / (float) $factors['unskilledLabor'];

            $economic = $economicEquipment + $economicMaterials
                + $economicSkilledLabor + $economicUnskilledLabor;

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
        $subproject,
        $validated,
        $activities,
        $factors,
        $financialTotal,
        $economicTotal
    ) {
        RMUC::updateOrCreate(
            [
                'subproject_id' => $subproject->subproject_id,
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


/**
 * Return saved RMUC evaluations for a subproject.
 */
public function getRMUC(string $subprojectId)
{
    Subproject::where('subproject_id', $subprojectId)->firstOrFail();

    return RMUC::where('subproject_id', $subprojectId)
        ->orderByDesc('evaluation_year')
        ->get();
}


}
