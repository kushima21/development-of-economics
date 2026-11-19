<?php

namespace App\Http\Controllers;

use App\Models\Crops;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class CropsController extends Controller
{
    /**
     * Display crops.
     */
    public function index(Request $request): Response
    {
        $search = $request->input('search');

        $crops = Crops::query()
            ->when($search, function ($query, $search) {
                $query->where('crop', 'like', "%{$search}%")
                    ->orWhere('crop_status', 'like', "%{$search}%");
            })
            ->latest('crop_id')
            ->paginate(10)
            ->withQueryString();

        return Inertia::render('Admin/Crops', [
            'crops' => $crops,
            'filters' => [
                'search' => $search,
            ],
            'summary' => [
                'total' => Crops::count(),
                'active' => Crops::where('crop_status', 'Active')->count(),
                'inactive' => Crops::where('crop_status', 'Inactive')->count(),
            ],
        ]);
    }

    /**
     * Store a new crop.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'crop' => [
                'required',
                'string',
                'max:255',
                'unique:crops,crop',
            ],
            'crop_status' => [
                'required',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);

        Crops::create($validated);

        return redirect()
            ->route('crops.index')
            ->with('success', 'Crop added successfully.');
    }

    /**
     * Update an existing crop.
     */
    public function update(Request $request, $crop_id): RedirectResponse
    {
        $crop = Crops::findOrFail($crop_id);

        $validated = $request->validate([
            'crop' => [
                'required',
                'string',
                'max:255',
                Rule::unique('crops', 'crop')->ignore($crop->crop_id, 'crop_id'),
            ],
            'crop_status' => [
                'required',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);

        $crop->update($validated);

        return redirect()
            ->route('crops.index')
            ->with('success', 'Crop updated successfully.');
    }

    /**
     * Delete a crop.
     */
    public function destroy($crop_id): RedirectResponse
    {
        $crop = Crops::findOrFail($crop_id);

        $crop->delete();

        return redirect()
            ->route('crops.index')
            ->with('success', 'Crop deleted successfully.');
    }
}