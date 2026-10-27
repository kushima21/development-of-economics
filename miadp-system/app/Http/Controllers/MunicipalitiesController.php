<?php

namespace App\Http\Controllers;

use App\Models\Municipalities;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class MunicipalitiesController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', 'all');
        $region = $request->input('region', 'all');

        $query = Municipalities::query();

        if (trim($search) !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('municipality', 'like', "%{$search}%")
                    ->orWhere('region', 'like', "%{$search}%")
                    ->orWhere('zipcode', 'like', "%{$search}%");
            });
        }

        if (in_array($status, ['Active', 'Inactive'], true)) {
            $query->where('status', $status);
        }

        if ($region !== 'all' && $region !== '') {
            $query->where('region', $region);
        }

        $municipalities = (clone $query)
            ->orderBy('municipality')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Municipality', [
            'municipalities' => $municipalities,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'region' => $region,
            ],
            'regions' => Municipalities::query()
                ->whereNotNull('region')
                ->where('region', '<>', '')
                ->distinct()
                ->orderBy('region')
                ->pluck('region')
                ->values(),
            'summary' => [
                'total' => Municipalities::count(),
                'active' => Municipalities::where('status', 'Active')->count(),
                'inactive' => Municipalities::where('status', 'Inactive')->count(),
                'regions' => Municipalities::distinct('region')->count('region'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'municipality' => [
                'required',
                'string',
                'max:150',
                'unique:municipalities,municipality',
            ],
            'region' => ['required', 'string', 'max:150'],
            'zipcode' => ['nullable', 'string', 'max:10'],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
        ]);

        Municipalities::create($validated);

        return redirect()
            ->route('municipalities.index')
            ->with('success', 'Municipality created successfully.');
    }

    public function update(Request $request, Municipalities $municipality)
    {
        $validated = $request->validate([
            'municipality' => [
                'required',
                'string',
                'max:150',
                Rule::unique('municipalities', 'municipality')
                    ->ignore($municipality->id),
            ],
            'region' => ['required', 'string', 'max:150'],
            'zipcode' => ['nullable', 'string', 'max:10'],
            'status' => ['required', Rule::in(['Active', 'Inactive'])],
        ]);

        $municipality->update($validated);

        return redirect()
            ->route('municipalities.index')
            ->with('success', 'Municipality updated successfully.');
    }

    public function show(Municipalities $municipality)
    {
        return response()->json([
            'municipality' => $municipality,
        ]);
    }

    public function destroy(Municipalities $municipality)
    {
        $municipality->delete();

        return redirect()
            ->route('municipalities.index')
            ->with('success', 'Municipality deleted successfully.');
    }
}
