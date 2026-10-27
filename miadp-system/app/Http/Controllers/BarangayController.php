<?php

namespace App\Http\Controllers;

use App\Models\Barangay;
use App\Models\Municipalities;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class BarangayController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search', '');
        $status = $request->input('status', 'all');
        $municipalityId = $request->input('municipality_id', 'all');

        $query = Barangay::query()->with('municipality');

        if (trim($search) !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('barangay_name', 'like', "%{$search}%")
                    ->orWhereHas('municipality', function ($municipalityQuery) use ($search) {
                        $municipalityQuery
                            ->where('municipality', 'like', "%{$search}%")
                            ->orWhere('region', 'like', "%{$search}%");
                    });
            });
        }

        if (in_array($status, ['Active', 'Inactive'], true)) {
            $query->where('status', $status);
        }

        if (
            $municipalityId !== 'all'
            && filter_var($municipalityId, FILTER_VALIDATE_INT) !== false
        ) {
            $query->where('municipality_id', $municipalityId);
        }

        $barangays = $query
            ->orderBy('barangay_name')
            ->paginate(10)
            ->withQueryString();

        $municipalities = Municipalities::query()
            ->where('status', 'Active')
            ->orderBy('municipality')
            ->get(['id', 'municipality', 'region']);

        return Inertia::render('Admin/Barangay', [
            'barangays' => $barangays,
            'municipalities' => $municipalities,
            'filters' => [
                'search' => $search,
                'status' => $status,
                'municipality_id' => $municipalityId,
            ],
            'summary' => [
                'total' => Barangay::count(),
                'active' => Barangay::where('status', 'Active')->count(),
                'inactive' => Barangay::where('status', 'Inactive')->count(),
                'municipalities' => Barangay::distinct('municipality_id')
                    ->count('municipality_id'),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'municipality_id' => [
                'required',
                'integer',
                Rule::exists('municipalities', 'id')
                    ->where('status', 'Active'),
            ],
            'barangay_name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('barangays', 'barangay_name')
                    ->where(fn ($query) => $query->where(
                        'municipality_id',
                        $request->input('municipality_id')
                    )),
            ],
            'status' => [
                'required',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);

        Barangay::create($validated);

        return redirect()
            ->route('barangays.index')
            ->with('success', 'Barangay created successfully.');
    }

    public function update(Request $request, Barangay $barangay)
    {
        $validated = $request->validate([
            'municipality_id' => [
                'required',
                'integer',
                Rule::exists('municipalities', 'id')
                    ->where('status', 'Active'),
            ],
            'barangay_name' => [
                'required',
                'string',
                'max:150',
                Rule::unique('barangays', 'barangay_name')
                    ->where(fn ($query) => $query->where(
                        'municipality_id',
                        $request->input('municipality_id')
                    ))
                    ->ignore($barangay->id),
            ],
            'status' => [
                'required',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);

        $barangay->update($validated);

        return redirect()
            ->route('barangays.index')
            ->with('success', 'Barangay updated successfully.');
    }

    public function show(Barangay $barangay)
    {
        return response()->json([
            'barangay' => $barangay->load('municipality'),
        ]);
    }

    public function destroy(Barangay $barangay)
    {
        $barangay->delete();

        return redirect()
            ->route('barangays.index')
            ->with('success', 'Barangay deleted successfully.');
    }
}
