        <?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Http\Controllers\SubProjectCategoryController;
use App\Http\Controllers\TypeOfSubprojectController;
use App\Http\Controllers\SubProjectController;
use App\Http\Controllers\MunicipalitiesController;
use App\Http\Controllers\BarangayController;
use App\Http\Controllers\ProjectBeneficiariesController;
use App\Http\Controllers\ManagementController;
use App\Http\Controllers\UsersController;
use App\Http\Controllers\LoginController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\CostComponentController;

// Login page
Route::middleware('guest')->group(function () {
    Route::get('/', [LoginController::class, 'showLogin'])
        ->name('login');

    Route::post('/login', [LoginController::class, 'login'])
        ->name('login.submit');
});

// Authenticated pages
Route::middleware('auth')->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])
        ->name('dashboard');

    Route::post('/logout', [LoginController::class, 'logout'])
        ->name('logout');
});

Route::get('/layout', fn () => Inertia::render('Layouts/Layout'));


Route::get('/subprojectcategory', [
    SubProjectCategoryController::class,
    'index',
])->name('subprojectcategory.index');

Route::post('/subprojectcategory', [
    SubProjectCategoryController::class,
    'store',
])->name('subprojectcategory.store');

Route::get('/subprojectcategory/{subprojectcategory}', [
    SubProjectCategoryController::class,
    'show',
])->name('subprojectcategory.show');

Route::put('/subprojectcategory/{subprojectcategory}', [
    SubProjectCategoryController::class,
    'update',
])->name('subprojectcategory.update');

Route::delete('/subprojectcategory/{subprojectcategory}', [
    SubProjectCategoryController::class,
    'destroy',
])->name('subprojectcategory.destroy');


Route::get(
    '/typeofsubproject',
    [TypeOfSubprojectController::class, 'index']
)->name('typeofsubproject.index');

Route::post(
    '/typeofsubproject',
    [TypeOfSubprojectController::class, 'store']
)->name('typeofsubproject.store');

Route::get(
    '/typeofsubproject/{typeofsubproject}',
    [TypeOfSubprojectController::class, 'show']
)->name('typeofsubproject.show');

Route::put(
    '/typeofsubproject/{typeofsubproject}',
    [TypeOfSubprojectController::class, 'update']
)->name('typeofsubproject.update');

Route::delete(
    '/typeofsubproject/{typeofsubproject}',
    [TypeOfSubprojectController::class, 'destroy']
)->name('typeofsubproject.destroy');


Route::resource('subproject', SubProjectController::class)
    ->only(['index', 'store', 'update', 'destroy']);




Route::get('/subproject/{subproject_id}/management', [
    SubprojectController::class,
    'management',
])->name('subproject.management');


Route::resource(
    'municipalities',
    MunicipalitiesController::class
)->except(['create', 'edit']);



Route::resource('barangays', BarangayController::class)
    ->except(['create', 'edit']);


Route::get('/project-beneficiaries', [
    ProjectBeneficiariesController::class,
    'index',
])->name('project-beneficiaries.index');

Route::post('/project-beneficiaries', [
    ProjectBeneficiariesController::class,
    'store',
])->name('project-beneficiaries.store');

Route::put('/project-beneficiaries/{projectBeneficiary}', [
    ProjectBeneficiariesController::class,
    'update',
])->name('project-beneficiaries.update');

Route::delete('/project-beneficiaries/{projectBeneficiary}', [
    ProjectBeneficiariesController::class,
    'destroy',
])->name('project-beneficiaries.destroy');

// Subproject management workspace
Route::get(
    '/management/{subproject}',
    [ManagementController::class, 'show']
)->name('management.show');

Route::get(
    '/management/{subproject}/{section}',
    [ManagementController::class, 'section']
)->where('section', 'beneficiaries|cost-components|economic-benefits|economic-analysis')
  ->name('management.section');


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




 Route::get('/modal', fn () => Inertia::render('AccessRoad/ECOS'));

 Route::get('/modal', fn () => Inertia::render('AccessRoad/SRC'));

 Route::get('/modal', fn () => Inertia::render('AccessRoad/RMUC'));


 Route::get('/modal', fn () => Inertia::render('AccessRoad/AMC'));

 Route::get('/modal', fn () => Inertia::render('AccessRoad/IC'));


 Route::get('/users', fn () => Inertia::render('Admin/Users'));


    Route::get('/users', [UsersController::class, 'index'])
        ->name('users.index');

    Route::post('/users', [UsersController::class, 'store'])
        ->name('users.store');

    Route::get('/users/{user}', [UsersController::class, 'show'])
        ->name('users.show');

    Route::put('/users/{user}', [UsersController::class, 'update'])
        ->name('users.update');

    Route::delete('/users/{user}', [UsersController::class, 'destroy'])
        ->name('users.destroy');


    Route::get('/modal', fn () => Inertia::render('EconomicBenifits/SVOCATab1'));