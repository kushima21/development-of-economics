<?php

namespace App\Http\Controllers;

use App\Models\SubProjectCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubProjectCategoryController extends Controller
{
    /**
     * Display the category management page.
     */
    public function index(Request $request): Response
    {
        $search = trim((string) $request->input('search', ''));
        $status = (string) $request->input('status', 'All');

        $query = SubProjectCategory::query();

        if ($search !== '') {
            $query->where(function ($builder) use ($search) {
                $builder
                    ->where('name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('information', 'like', "%{$search}%");
            });
        }

        if (in_array($status, ['Active', 'Inactive'], true)) {
            $query->where('status', $status);
        } else {
            $status = 'All';
        }

        $categories = $query
            ->orderBy('name')
            ->get();

        return Inertia::render('Admin/SubProjectCategory', [
            'categories' => $categories,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'summary' => [
                'total' => SubProjectCategory::count(),
                'active' => SubProjectCategory::where('status', 'Active')->count(),
                'inactive' => SubProjectCategory::where('status', 'Inactive')->count(),
            ],
            'flash' => [
                'success' => session('success'),
                'error' => session('error'),
            ],
        ]);
    }

    /**
     * Store a new category.
     */
    public function store(Request $request): RedirectResponse
    {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                'unique:subproject_category,name',
            ],
            'description' => [
                'required',
                'string',
                'max:5000',
            ],
            'information' => [
                'required',
                'string',
                'max:10000',
            ],
            'status' => [
                'required',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);

        SubProjectCategory::create($validated);

        return redirect()
            ->route('subprojectcategory.index')
            ->with('success', 'Subproject category added successfully.');
    }

    /**
     * Return one category as JSON if requested.
     */
    public function show(SubProjectCategory $subprojectcategory)
    {
        return response()->json([
            'category' => $subprojectcategory,
        ]);
    }

    /**
     * Update an existing category.
     */
    public function update(
        Request $request,
        SubProjectCategory $subprojectcategory
    ): RedirectResponse {
        $validated = $request->validate([
            'name' => [
                'required',
                'string',
                'max:255',
                Rule::unique('subproject_category', 'name')
                    ->ignore($subprojectcategory->id),
            ],
            'description' => [
                'required',
                'string',
                'max:5000',
            ],
            'information' => [
                'required',
                'string',
                'max:10000',
            ],
            'status' => [
                'required',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);

        $subprojectcategory->update($validated);

        return redirect()
            ->route('subprojectcategory.index')
            ->with('success', 'Subproject category updated successfully.');
    }

    /**
     * Delete a category.
     */
    public function destroy(
        SubProjectCategory $subprojectcategory
    ): RedirectResponse {
        $subprojectcategory->delete();

        return redirect()
            ->route('subprojectcategory.index')
            ->with('success', 'Subproject category deleted successfully.');
    }
}