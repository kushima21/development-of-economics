<?php
namespace App\Http\Controllers;
use App\Models\SubProject;
use App\Models\TypeOfSubproject;
use Illuminate\Http\Request;
use Illuminate\Http\RedirectResponse;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class SubProjectController extends Controller
{
    public function index(Request $request): Response
    {   
        $search = trim((string) $request->input('search', ''));
        $status = $request->input('status', '');

        $subprojects = Subproject::query()
            ->with([
                'typeOfSubproject' => function ($query) {
                    $query->select([
                        'type_of_sp_id',
                        'subproject_id',
                        'subproject_name',
                        'type_subproject_name',
                        'description',
                        'status',
                    ])->with('category');
                },
            ])
            ->when($search !== '', function ($query) use ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('subproject_code', 'like', "%{$search}%")
                        ->orWhere('subproject_title', 'like', "%{$search}%")
                        ->orWhere('subproject_location', 'like', "%{$search}%")
                        ->orWhere('subproject_proponent', 'like', "%{$search}%")
                        ->orWhere('subject_category', 'like', "%{$search}%")
                        ->orWhereHas('typeOfSubproject', function ($typeQuery) use ($search) {
                            $typeQuery
                                ->where('subproject_name', 'like', "%{$search}%")
                                ->orWhere('type_subproject_name', 'like', "%{$search}%");
                        });
                });
            })
            ->when($status !== '', function ($query) use ($status) {
                $query->where('status', $status);
            })
            ->latest('created_at')
            ->paginate(10)
            ->withQueryString();

        $typesOfSubproject = TypeOfSubproject::query()
            ->with('category')
            ->select([
                'type_of_sp_id',
                'subproject_id',
                'subproject_name',
                'type_subproject_name',
                'description',
                'status',
            ])
            ->where(function ($query) {
                $query->whereNull('status')
                    ->orWhere('status', 'Active');
            })
            ->orderBy('subproject_name')
            ->orderBy('type_subproject_name')
            ->get();

        return Inertia::render('Admin/SubProject', [
            'subprojects' => $subprojects,
            'typesOfSubproject' => $typesOfSubproject,
            'filters' => [
                'search' => $search,
                'status' => $status,
            ],
            'summary' => [
                'total' => Subproject::count(),
                'draft' => Subproject::where('status', 'Draft')->count(),
                'submitted' => Subproject::where('status', 'Submitted')->count(),
                'approved' => Subproject::where('status', 'Approved')->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateSubproject($request);

        $this->ensureTypeMatchesCategory(
            $validated['type_of_sp_id'],
            $validated['subproject_category_id']
        );

        // This field is used to validate the selected type's category.
        // It is not a column in the subproject table.
        unset($validated['subproject_category_id']);

        $validated = $this->calculateFunding($validated);

        Subproject::create($validated);

        return redirect()
            ->route('subproject.index')
            ->with('success', 'Subproject created successfully.');
    }

    public function update(
        Request $request,
        Subproject $subproject
    ): RedirectResponse {
        $validated = $this->validateSubproject($request, $subproject);

        $this->ensureTypeMatchesCategory(
            $validated['type_of_sp_id'],
            $validated['subproject_category_id']
        );

        unset($validated['subproject_category_id']);

        $validated = $this->calculateFunding($validated);

        $subproject->update($validated);

        return redirect()
            ->route('subproject.index')
            ->with('success', 'Subproject updated successfully.');
    }

    public function destroy(Subproject $subproject): RedirectResponse
    {
        $subproject->delete();

        return redirect()
            ->route('subproject.index')
            ->with('success', 'Subproject deleted successfully.');
    }

    private function validateSubproject(
        Request $request,
        ?Subproject $subproject = null
    ): array {
        $codeUniqueRule = Rule::unique('subproject', 'subproject_code');

        if ($subproject) {
            $codeUniqueRule->ignore(
                $subproject->getKey(),
                $subproject->getKeyName()
            );
        }

        return $request->validate([
            'subproject_code' => [
                'required',
                'string',
                'max:50',
                $codeUniqueRule,
            ],

            'subproject_title' => [
                'required',
                'string',
                'max:255',
            ],

            'subproject_category_id' => [
                'required',
                'integer',
            ],

            'type_of_sp_id' => [
                'required',
                'integer',
                Rule::exists('type_subproject', 'type_of_sp_id'),
            ],

            'subproject_location' => [
                'required',
                'string',
                'max:255',
            ],

            'subproject_proponent' => [
                'required',
                'string',
                'max:255',
            ],

            'subject_category' => [
                'required',
                'string',
                'max:5000',
            ],

            'project_scale_dimension' => [
                'nullable',
                'string',
                'max:255',
            ],

            'total_project_cost' => [
                'required',
                'numeric',
                'min:0',
                'max:9999999999999.99',
            ],

            'status' => [
                'required',
                Rule::in([
                    'Draft',
                    'Submitted',
                    'Approved',
                    'Rejected',
                ]),
            ],
        ]);
    }

    private function ensureTypeMatchesCategory(
        int|string $typeId,
        int|string $categoryId
    ): void {
        $matches = TypeOfSubproject::query()
            ->where('type_of_sp_id', $typeId)
            ->where('subproject_id', $categoryId)
            ->exists();

        if (!$matches) {
            validator(
                [
                    'type_of_sp_id' => $typeId,
                    'subproject_category_id' => $categoryId,
                ],
                [
                    'type_of_sp_id' => [
                        'required',
                        function ($attribute, $value, $fail) {
                            $fail(
                                'The selected type does not belong to the selected category.'
                            );
                        },
                    ],
                ]
            )->validate();
        }
    }

    private function calculateFunding(array $data): array
    {
        $cost = (float) $data['total_project_cost'];

        $worldBank = round($cost * 0.80, 2);
        $gop = round($cost * 0.10, 2);

        // Assign any rounding remainder to LGU.
        $lgu = round($cost - $worldBank - $gop, 2);

        $data['world_bank_share'] = $worldBank;
        $data['gop_share'] = $gop;
        $data['lgu_share'] = $lgu;

        return $data;
    }

public function management($subproject_id)
{
    $subproject = Subproject::with([
        'typeOfSubproject',
    ])
        ->where('subproject_id', $subproject_id)
        ->firstOrFail();

    return Inertia::render('Manage/Management', [
        'subproject' => $subproject,
    ]);
}
    
}
