<?php
namespace App\Http\Controllers;

use App\Http\Controllers\Controller;
use App\Models\Users;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function index(Request $request): Response
    {
        $user = $request->user();

        $statistics = [
            'totalSubprojects' => $this->countTable('subprojects'),
            'municipalities' => $this->countTable('municipalities'),
            'barangays' => $this->countTable('barangays'),
            'registeredUsers' => Users::count(),
        ];

        return Inertia::render('Admin/Dashboard', [
            'auth' => [
                'user' => [
                    'user_id' => $user->user_id,
                    'fullname' => $user->fullname,
                    'email' => $user->email,
                    'roles' => $user->roles,
                    'status' => $user->status,
                ],
            ],
            'statistics' => $statistics,
        ]);
    }

    private function countTable(string $table): int
    {
        try {
            if (!Schema::hasTable($table)) {
                return 0;
            }

            return (int) DB::table($table)->count();
        } catch (\Throwable $exception) {
            report($exception);

            return 0;
        }
    }
}
