<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

use App\Http\Controllers\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\UsersController;

use App\Http\Controllers\SubProjectCategoryController;
use App\Http\Controllers\TypeOfSubprojectController;
use App\Http\Controllers\SubProjectController;
use App\Http\Controllers\MunicipalitiesController;
use App\Http\Controllers\BarangayController;
use App\Http\Controllers\ProjectBeneficiariesController;
use App\Http\Controllers\ManagementController;
use App\Http\Controllers\CostComponentController;

/*
|--------------------------------------------------------------------------
| Authentication Routes
|--------------------------------------------------------------------------
*/

// Guests only: login page and login submission
Route::middleware('guest')->group(function () {
    Route::get('/', [LoginController::class, 'showLogin'])
        ->name('login');

    Route::post('/login', [LoginController::class, 'login'])
        ->name('login.submit');
});

/*
|--------------------------------------------------------------------------
| Authenticated Routes
|--------------------------------------------------------------------------
|
| All system pages and data-management operations require authentication.
|
*/

Route::middleware('auth')->group(function () {

    /*
    |--------------------------------------------------------------------------
    | Dashboard
    |--------------------------------------------------------------------------
    */

    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    /*
    |--------------------------------------------------------------------------
    | Logout
    |--------------------------------------------------------------------------
    */

    Route::post('/logout', [LoginController::class, 'logout'])
        ->name('logout');

    /*
    |--------------------------------------------------------------------------
    | Subject Category Management
    |--------------------------------------------------------------------------
    */

    Route::resource(
        'subprojectcategory',
        SubProjectCategoryController::class
    )->parameters([
        'subprojectcategory' => 'subprojectcategory',
    ])->only([
        'index',
        'store',
        'show',
        'update',
        'destroy',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Type of Subproject Management
    |--------------------------------------------------------------------------
    */

    Route::resource(
        'typeofsubproject',
        TypeOfSubprojectController::class
    )->parameters([
        'typeofsubproject' => 'typeofsubproject',
    ])->only([
        'index',
        'store',
        'show',
        'update',
        'destroy',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Subproject Management
    |--------------------------------------------------------------------------
    */

    Route::resource('subproject', SubProjectController::class)
        ->only([
            'index',
            'store',
            'update',
            'destroy',
        ]);

    Route::get(
        '/subproject/{subproject_id}/management',
        [SubProjectController::class, 'management']
    )->name('subproject.management');

    /*
    |--------------------------------------------------------------------------
    | Municipality Management
    |--------------------------------------------------------------------------
    */

    Route::resource(
        'municipalities',
        MunicipalitiesController::class
    )->except([
        'create',
        'edit',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Barangay Management
    |--------------------------------------------------------------------------
    */

    Route::resource(
        'barangays',
        BarangayController::class
    )->except([
        'create',
        'edit',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Project Beneficiaries
    |--------------------------------------------------------------------------
    */

    Route::resource(
        'project-beneficiaries',
        ProjectBeneficiariesController::class
    )->only([
        'index',
        'store',
        'update',
        'destroy',
    ]);

    /*
    |--------------------------------------------------------------------------
    | Subproject Management Workspace
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/management/{subproject}',
        [ManagementController::class, 'show']
    )->name('management.show');

    Route::get(
        '/management/{subproject}/{section}',
        [ManagementController::class, 'section']
    )->where(
        'section',
        'beneficiaries|cost-components|economic-benefits|economic-analysis'
    )->name('management.section');

    /*
    |--------------------------------------------------------------------------
    | Cost Components
    |--------------------------------------------------------------------------
    */

    Route::get(
        '/cost-components',
        [CostComponentController::class, 'index']
    )->name('cost-components.index');

    Route::get(
        '/cost-components/{subproject}',
        [CostComponentController::class, 'show']
    )->name('cost-components.show');

    Route::post(
        '/cost-components/{subproject}/economic-cost',
        [CostComponentController::class, 'storeEconomicCost']
    )->name('cost-components.economic-cost.store');

    Route::post(
        '/cost-components/{subproject}/safeguard-cost',
        [CostComponentController::class, 'storeSRC']
    )->name('cost-components.safeguard-cost.store');

    Route::post(
        '/cost-components/{subproject}/road-maintenance-cost',
        [CostComponentController::class, 'storeRMUC']
    )->name('cost-components.rmuc.store');

    Route::get(
        '/cost-components/{subproject}/road-maintenance-cost',
        [CostComponentController::class, 'getRMUC']
    )->name('cost-components.rmuc.index');

    /*
    |--------------------------------------------------------------------------
    | User Management
    |--------------------------------------------------------------------------
    */

    Route::resource('users', UsersController::class)
        ->only([
            'index',
            'store',
            'show',
            'update',
            'destroy',
        ]);

    /*
    |--------------------------------------------------------------------------
    | Access Road Cost Component Pages
    |--------------------------------------------------------------------------
    |
    | Each page has its own URL. Do not reuse /modal for every component.
    | These routes render React pages directly.
    |
    */

    Route::prefix('cost-components/forms')->name('cost-components.forms.')->group(function () {

        Route::get('/economic-cost', function () {
            return Inertia::render('AccessRoad/ECOS');
        })->name('economic-cost');

        Route::get('/safeguard-cost', function () {
            return Inertia::render('AccessRoad/SRC');
        })->name('safeguard-cost');

        Route::get('/road-maintenance-cost', function () {
            return Inertia::render('AccessRoad/RMUC');
        })->name('road-maintenance-cost');

        Route::get('/annual-maintenance-cost', function () {
            return Inertia::render('AccessRoad/AMC');
        })->name('annual-maintenance-cost');

        Route::get('/investment-cost', function () {
            return Inertia::render('AccessRoad/IC');
        })->name('investment-cost');

    });

    /*
    |--------------------------------------------------------------------------
    | Economic Benefits
    |--------------------------------------------------------------------------
    */

    Route::get('/economic-benefits/svoc', function () {
        return Inertia::render('EconomicBenifits/SVOCATab1');
    })->name('economic-benefits.svoc');

});
