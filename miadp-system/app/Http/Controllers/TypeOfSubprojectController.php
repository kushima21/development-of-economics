<?php

namespace App\Http\Controllers;

use App\Models\SubProjectCategory;
use App\Models\TypeOfSubproject;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;

class TypeOfSubprojectController extends Controller
{
    /**
     * Display, search, and filter subproject types.
     */
    public function index(Request $request)
    {
        $search = trim($request->input('search', ''));
        $status = $request->input('status', 'All');
        $categoryId = $request->input('category_id', 'All');

        $query = TypeOfSubproject::query()
            ->with('category');

        if ($search !== '') {
            $query->where(function ($q) use ($search) {
                $q->where('type_subproject_name', 'like', "%{$search}%")
                    ->orWhere('description', 'like', "%{$search}%")
                    ->orWhere('information', 'like', "%{$search}%")
                    ->orWhereHas('category', function ($categoryQuery) use ($search) {
                        $categoryQuery->where('name', 'like', "%{$search}%");
                    });
            });
        }

        if (in_array($status, ['Active', 'Inactive'], true)) {
            $query->where('status', $status);
        } else {
            $status = 'All';
        }

        if (
            $categoryId !== 'All'
            && filter_var($categoryId, FILTER_VALIDATE_INT) !== false
        ) {
            $query->where('subproject_id', $categoryId);
        } else {
            $categoryId = 'All';
        }

        $types = $query
            ->orderByDesc('created_at')
            ->get();

        // Include active categories for the modal and filter dropdown.
        $categories = SubProjectCategory::query()
            ->where('status', 'Active')
            ->orderBy('name')
            ->get(['id', 'name']);

        return Inertia::render('Admin/TypeOfSubproject', [
            'types' => $types,
            'categories' => $categories,

            'filters' => [
                'search' => $search,
                'status' => $status,
                'category_id' => (string) $categoryId,
            ],

            'summary' => [
                'total' => TypeOfSubproject::count(),
                'active' => TypeOfSubproject::where('status', 'Active')->count(),
                'inactive' => TypeOfSubproject::where('status', 'Inactive')->count(),
            ],
        ]);
    }


/**
 * Create a subproject type.
 */
public function store(Request $request)
{
    $validated = $request->validate([
        'subproject_id' => [
            'required',
            'integer',
            Rule::exists('subproject_category', 'id')
                ->where('status', 'Active'),
        ],
        'type_subproject_name' => [
            'required',
            'string',
            'max:255',
        ],
        'description' => [
            'required',
            'string',
            'max:5000',
        ],
        'information' => [
            'nullable',
            'string',
            'max:20000',
        ],
        'status' => [
            'required',
            Rule::in(['Active', 'Inactive']),
        ],
    ]);

    // Get the selected category.
    $category = SubProjectCategory::findOrFail(
        $validated['subproject_id']
    );

    // Prevent duplicate type names within the same category.
    $exists = TypeOfSubproject::where(
        'subproject_id',
        $validated['subproject_id']
    )
        ->where(
            'type_subproject_name',
            $validated['type_subproject_name']
        )
        ->exists();

    if ($exists) {
        return back()
            ->withErrors([
                'type_subproject_name' =>
                    'This subproject type already exists in the selected category.',
            ])
            ->withInput();
    }

    // Automatically populate the required subproject_name.
    $validated['subproject_name'] = $category->name;

    TypeOfSubproject::create($validated);

    return redirect()
        ->route('typeofsubproject.index')
        ->with('success', 'Subproject type created successfully.');
}

/**
 * Update a subproject type.
 */
public function update(Request $request, $id)
{
    $type = TypeOfSubproject::findOrFail($id);

    $validated = $request->validate([
        'subproject_id' => [
            'required',
            'integer',
            Rule::exists('subproject_category', 'id')
                ->where('status', 'Active'),
        ],
        'type_subproject_name' => [
            'required',
            'string',
            'max:255',
        ],
        'description' => [
            'required',
            'string',
            'max:5000',
        ],
        'information' => [
            'nullable',
            'string',
            'max:20000',
        ],
        'status' => [
            'required',
            Rule::in(['Active', 'Inactive']),
        ],
    ]);

    $category = SubProjectCategory::findOrFail(
        $validated['subproject_id']
    );

    $exists = TypeOfSubproject::where(
        'subproject_id',
        $validated['subproject_id']
    )
        ->where(
            'type_subproject_name',
            $validated['type_subproject_name']
        )
        ->where('type_of_sp_id', '!=', $type->type_of_sp_id)
        ->exists();

    if ($exists) {
        return back()
            ->withErrors([
                'type_subproject_name' =>
                    'This subproject type already exists in the selected category.',
            ])
            ->withInput();
    }

    // Keep the category name synchronized with the selected category.
    $validated['subproject_name'] = $category->name;

    $type->update($validated);

    return redirect()
        ->route('typeofsubproject.index')
        ->with('success', 'Subproject type updated successfully.');
}

    /**
     * Delete a subproject type.
     */
    public function destroy($id)
    {
        $type = TypeOfSubproject::findOrFail($id);
        $type->delete();

        return redirect()
            ->route('typeofsubproject.index')
            ->with('success', 'Subproject type deleted successfully.');
    }
}
