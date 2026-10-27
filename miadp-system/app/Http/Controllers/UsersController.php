<?php

namespace App\Http\Controllers;

use App\Models\Users;
use App\Models\Municipalities;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Http\RedirectResponse;

class UsersController extends Controller
{
    private const ROLES = ['admin', 'miadp', 'lgu'];

    public function index(Request $request): Response
    {
        $filters = $request->validate([
            'search' => ['nullable', 'string', 'max:100'],
            'municipality_id' => [
                'nullable',
                'integer',
                'exists:municipalities,id',
            ],
            'role' => ['nullable', Rule::in(self::ROLES)],
            'status' => [
                'nullable',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);

        $users = Users::query()
            ->with('municipality:id,municipality')
            ->when($filters['search'] ?? null, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('fullname', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phonenumber', 'like', "%{$search}%");
                });
            })
            ->when(
                $filters['municipality_id'] ?? null,
                fn ($query, $id) => $query->where('municipality_id', $id)
            )
            ->when($filters['role'] ?? null, function ($query, $role) {
                $query->whereJsonContains('roles', $role);
            })
            ->when(
                $filters['status'] ?? null,
                fn ($query, $status) => $query->where('status', $status)
            )
            ->orderBy('fullname')
            ->paginate(10)
            ->withQueryString()
            ->through(fn (Users $user) => [
                'user_id' => $user->user_id,
                'fullname' => $user->fullname,
                'gender' => $user->gender,
                'birthdate' => $user->birthdate?->format('Y-m-d'),
                'municipality_id' => $user->municipality_id,
                'municipality' => $user->municipality?->municipality,
                'phonenumber' => $user->phonenumber,
                'email' => $user->email,
                'roles' => $user->roles ?? [],
                'status' => $user->status,
                'created_at' => $user->created_at?->format('M d, Y'),
            ]);

        $municipalities = Municipalities::query()
            ->where('status', 'Active')
            ->orderBy('municipality')
            ->get(['id', 'municipality'])
            ->map(fn ($municipality) => [
                'id' => $municipality->id,
                'municipality' => $municipality->municipality,
            ]);

        return Inertia::render('Admin/Users', [
            'users' => $users,
            'municipalities' => $municipalities,
            'filters' => [
                'search' => $filters['search'] ?? '',
                'municipality_id' => $filters['municipality_id'] ?? '',
                'role' => $filters['role'] ?? '',
                'status' => $filters['status'] ?? '',
            ],
            'summary' => [
                'total' => Users::count(),
                'active' => Users::where('status', 'Active')->count(),
                'inactive' => Users::where('status', 'Inactive')->count(),
                'administrators' => Users::whereJsonContains(
                    'roles',
                    'admin'
                )->count(),
            ],
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $validated = $this->validateUser($request);

        Users::create($validated);

        return redirect()
            ->route('users.index')
            ->with('success', 'User account created successfully.');
    }

    public function show(Users $user): Response
    {
        $user->load('municipality:id,municipality');

        return Inertia::render('Admin/UserDetails', [
            'user' => [
                'user_id' => $user->user_id,
                'fullname' => $user->fullname,
                'gender' => $user->gender,
                'birthdate' => $user->birthdate?->format('Y-m-d'),
                'municipality_id' => $user->municipality_id,
                'municipality' => $user->municipality?->municipality,
                'phonenumber' => $user->phonenumber,
                'email' => $user->email,
                'roles' => $user->roles ?? [],
                'status' => $user->status,
            ],
        ]);
    }

    public function update(Request $request, Users $user): RedirectResponse
    {
        $validated = $this->validateUser($request, $user);

        // An empty password means retain the existing password.
        if (empty($validated['password'] ?? null)) {
            unset($validated['password']);
        }

        $user->update($validated);

        return redirect()
            ->route('users.index')
            ->with('success', 'User account updated successfully.');
    }

    public function destroy(Users $user): RedirectResponse
    {
        // Prevent accidental deletion of the account being used.
        if ($user->user_id === auth()->id()) {
            return back()->with(
                'error',
                'You cannot delete your own account.'
            );
        }

        $user->delete();

        return redirect()
            ->route('users.index')
            ->with('success', 'User account deleted successfully.');
    }

    private function validateUser(
        Request $request,
        ?Users $user = null
    ): array {
        return $request->validate([
            'fullname' => ['required', 'string', 'max:255'],
            'gender' => ['nullable', Rule::in([
                'Male',
                'Female',
                'Other',
                'Prefer not to say',
            ])],
            'birthdate' => ['nullable', 'date', 'before_or_equal:today'],
            'municipality_id' => [
                'nullable',
                'integer',
                'exists:municipalities,id',
            ],
            'phonenumber' => ['nullable', 'string', 'max:30'],
            'email' => [
                'required',
                'email',
                'max:255',
                Rule::unique('users', 'email')
                    ->ignore($user?->user_id, 'user_id'),
            ],
            'password' => [
                $user ? 'nullable' : 'required',
                'string',
                'min:8',
                'confirmed',
            ],
            'roles' => ['required', 'array', 'min:1'],
            'roles.*' => [
                'required',
                'distinct',
                Rule::in(self::ROLES),
            ],
            'status' => [
                'required',
                Rule::in(['Active', 'Inactive']),
            ],
        ]);
    }
}
