<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Subproject;
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
use App\Http\Controllers\CropsController;
use App\Http\Controllers\EconomicBenifitsController;
use App\Http\Controllers\EconomicAnalysisController;

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

     Route::post('/cost-components/{subproject}/annual-maintenance-cost',
   [CostComponentController::class, 'storeAMC']);

   Route::post('/cost-components/{subproject}/investment-maintenance-cost', [\App\Http\Controllers\CostComponentController::class, 'storeIMC'])->name('cost-components.imc.store');

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
    });

    // ==========================================
// ECONOMIC BENEFITS - SVOC DATABASE API
// ==========================================

Route::prefix('subprojects/{subproject}/economic-benefits/svoc')
    ->name('economic-benefits.svoc.')
    ->group(function () {

        // GET: List all saved SVOC records
        Route::get('/', [
            EconomicBenifitsController::class,
            'svocIndex'
        ])->name('index');

        // POST: Save a new SVOC record
        Route::post('/', [
            EconomicBenifitsController::class,
            'svocStore'
        ])->name('store');

        // GET: View a specific SVOC record
        Route::get('/{svoc}', [
            EconomicBenifitsController::class,
            'svocShow'
        ])->name('show');

        // PUT: Update an existing SVOC record
        Route::put('/{svoc}', [
            EconomicBenifitsController::class,
            'svocUpdate'
        ])->name('update');

        // DELETE: Delete an SVOC record
        Route::delete('/{svoc}', [
            EconomicBenifitsController::class,
            'svocDestroy'
        ])->name('destroy');

    });

    /*
    |--------------------------------------------------------------------------
    | Economic Benefits
    |--------------------------------------------------------------------------
    */

    Route::get('/economic-benefits/svoc', function () {
        return Inertia::render('EconomicBenifits/SVOCATab1');
    })->name('economic-benefits.svoc');



Route::resource('crops', CropsController::class)
    ->only(['index', 'store', 'update', 'destroy']);

});




Route::prefix('subprojects/{subproject}/economic-benefits/soh')
    ->name('economic-benefits.soh.')
    ->group(function () {
        Route::get('/', [EconomicBenifitsController::class, 'sohIndex'])->name('index');
        Route::post('/', [EconomicBenifitsController::class, 'sohStore'])->name('store');
        Route::delete('/', [EconomicBenifitsController::class, 'sohDestroy'])->name('destroy');
        Route::get('/{soh}', [EconomicBenifitsController::class, 'sohShow'])->name('show');
        Route::put('/{soh}', [EconomicBenifitsController::class, 'sohUpdate'])->name('update');
    });

Route::prefix('subprojects/{subproject}/economic-benefits/sih')->group(function () {
    Route::get('/', [EconomicBenifitsController::class, 'sihIndex']);
    Route::post('/', [EconomicBenifitsController::class, 'sihStore']);
    Route::get('/{sih}', [EconomicBenifitsController::class, 'sihShow']);
    Route::put('/{sih}', [EconomicBenifitsController::class, 'sihUpdate']);
    Route::delete('/', [EconomicBenifitsController::class, 'sihDestroy']);
});

Route::prefix('subprojects/{subproject}/economic-benefits/tts')
    ->group(function () {
        Route::get('/', [EconomicBenifitsController::class, 'ttsIndex'])
            ->name('tts.index');

        Route::post('/', [EconomicBenifitsController::class, 'ttsStore'])
            ->name('tts.store');

        Route::get('/{tts}', [EconomicBenifitsController::class, 'ttsShow'])
            ->name('tts.show');

        Route::put('/{tts}', [EconomicBenifitsController::class, 'ttsUpdate'])
            ->name('tts.update');

        Route::delete('/', [EconomicBenifitsController::class, 'ttsDestroy'])
            ->name('tts.destroy');
    });

    Route::get(
    '/subprojects/{subproject}/economic-benefits/stl',
    [EconomicBenifitsController::class, 'stlIndex']
)->name('economic-benefits.stl.index');

Route::post(
    '/subprojects/{subproject}/economic-benefits/stl',
    [EconomicBenifitsController::class, 'stlStore']
)->name('economic-benefits.stl.store');

Route::get(
    '/subprojects/{subproject}/economic-benefits/stl/{stl}',
    [EconomicBenifitsController::class, 'stlShow']
)->name('economic-benefits.stl.show');

Route::put(
    '/subprojects/{subproject}/economic-benefits/stl/{stl}',
    [EconomicBenifitsController::class, 'stlUpdate']
)->name('economic-benefits.stl.update');

Route::delete(
    '/subprojects/{subproject}/economic-benefits/stl',
    [EconomicBenifitsController::class, 'stlDestroy']
)->name('economic-benefits.stl.destroy');

Route::prefix('subprojects/{subproject}/economic-benefits/nga')->group(function () {
    Route::get('/', [EconomicBenifitsController::class, 'ngaIndex'])->name('economic-benefits.nga.index');
    Route::post('/', [EconomicBenifitsController::class, 'ngaStore'])->name('economic-benefits.nga.store');
    Route::get('/{nga}', [EconomicBenifitsController::class, 'ngaShow'])->name('economic-benefits.nga.show');
    Route::put('/{nga}', [EconomicBenifitsController::class, 'ngaUpdate'])->name('economic-benefits.nga.update');
    Route::delete('/', [EconomicBenifitsController::class, 'ngaDestroy'])->name('economic-benefits.nga.destroy');
});

// Economic Analysis: one route only; controller supplies IMC and benefit data.
Route::get('/economic-analysis/{subproject}', [EconomicAnalysisController::class, 'index'])
    ->name('economic-analysis');

