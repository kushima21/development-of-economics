<?php

namespace App\Http\Controllers;

use App\Models\{IMC, SVOC, SOH, SIH, TTS, NGA, STL, Subproject};
use Illuminate\Support\Collection;
use Inertia\Inertia;
use Inertia\Response;

class EconomicAnalysisController extends Controller
{
    public function index(Subproject $subproject): Response
    {
        $id = $subproject->getKey();
        $imc = IMC::where('subproject_id', $id)->first();
        $groups = [
            'voc' => SVOC::where('subproject_id', $id)->get(),
            'soh' => SOH::where('subproject_id', $id)->get(),
            'sih' => SIH::where('subproject_id', $id)->get(),
            'tts' => TTS::where('subproject_id', $id)->get(),
            'nga' => NGA::where('subproject_id', $id)->get(),
            'stl' => STL::where('subproject_id', $id)->get(),
        ];
        $benefits = [];
        foreach ($groups as $key => $records) {
            $benefits[$key] = $this->aggregate($records);
        }
        $costs = $this->costSeries($imc);

        return Inertia::render('EconomicAnalysis/EconomicAnalysis', [
            'subproject' => $subproject,
            'subproject_id' => $id,
            'economic_analysis' => [
                'investment' => $imc ? (float) $imc->investment_economic_cost : null,
                'maintenance' => $imc ? (float) $imc->annual_maintenance_economic_cost : null,
                // No dis-benefit record/model is available; no amount is assumed.
                'cropProductionForegone' => null,
                'investmentYears' => $costs['investment'],
                'maintenanceYears' => $costs['maintenance'],
                'benefits' => $benefits,
            ],
        ]);
    }

    private function costSeries(?IMC $imc): array
    {
        $investment = array_fill(0, 21, null);
        $maintenance = array_fill(0, 21, null);
        if (!$imc) return compact('investment', 'maintenance');

        $investment[0] = (float) $imc->investment_economic_cost;
        $maintenance[0] = 0;
        for ($year = 1; $year <= 20; $year++) {
            $investment[$year] = 0;
            $maintenance[$year] = (float) $imc->annual_maintenance_economic_cost;
        }
        foreach (($imc->yearly_costs ?? []) as $key => $entry) {
            if (!is_array($entry)) continue;
            $year = isset($entry['year']) ? (int) $entry['year'] : (is_numeric($key) ? (int) $key : -1);
            if ($year < 0 || $year > 20) continue;
            foreach (['investment_economic_cost', 'investment', 'investment_cost'] as $field) {
                if (isset($entry[$field]) && is_numeric($entry[$field])) {
                    $investment[$year] = (float) $entry[$field];
                    break;
                }
            }
            foreach (['annual_maintenance_economic_cost', 'maintenance', 'maintenance_cost'] as $field) {
                if (isset($entry[$field]) && is_numeric($entry[$field])) {
                    $maintenance[$year] = (float) $entry[$field];
                    break;
                }
            }
        }
        return compact('investment', 'maintenance');
    }

    private function aggregate(Collection $records): array
    {
        if ($records->isEmpty()) return array_fill(0, 21, 0);
        $total = array_fill(0, 21, 0);
        foreach ($records as $record) {
            $series = $this->benefitSeries($record);
            for ($year = 0; $year <= 20; $year++) {
                if ($series[$year] === null) $total[$year] = null;
                elseif ($total[$year] !== null) $total[$year] += $series[$year];
            }
        }
        return $total;
    }

    private function benefitSeries($record): array
    {
        $data = $record->data ?? [];
        if (!is_array($data)) $data = [];
        $series = array_fill(0, 21, null);
        $series[0] = 0;
        $candidates = [
            $data['yearly_savings'] ?? null,
            $data['annual_projections'] ?? null,
            $data['projections'] ?? null,
            $data['yearlyData'] ?? null,
            $data['yearlySavings'] ?? null,
            $data['years'] ?? null,
        ];
        foreach ($candidates as $candidate) {
            if (!is_array($candidate) || !$candidate) continue;
            $found = false;
            foreach ($candidate as $key => $entry) {
                if (is_array($entry)) {
                    $year = $entry['year'] ?? $entry['year_number'] ?? null;
                    $value = $entry['total_savings'] ?? $entry['totalSavings'] ?? $entry['annual_savings'] ?? $entry['savings'] ?? $entry['value'] ?? null;
                } else {
                    $year = is_numeric($key) ? (int) $key : null;
                    $value = $entry;
                }
                if ($year === null || !is_numeric($year) || (int) $year < 0 || (int) $year > 20 || !is_numeric($value)) continue;
                $series[(int) $year] = (float) $value;
                $found = true;
            }
            if ($found) return $series;
        }
        $series[1] = $record->annual_savings !== null ? (float) $record->annual_savings : null;
        return $series;
    }
}
