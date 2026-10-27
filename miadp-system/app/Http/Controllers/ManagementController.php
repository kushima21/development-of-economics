<?php

namespace App\Http\Controllers;

use App\Models\Subproject;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ManagementController extends Controller
{
    /**
     * Display the subproject management workspace.
     */
    public function show(Subproject $subproject): Response
    {
        return Inertia::render('Manage/Management', [
            'subproject' => $subproject,
            'section' => '',
        ]);
    }

    /**
     * Display a specific management section.
     */
    public function section(
    Request $request,
    Subproject $subproject,
    string $section
): Response|RedirectResponse {
    $allowedSections = [
        'beneficiaries',
        'cost-components',
        'economic-benefits',
        'economic-analysis',
    ];

    abort_unless(in_array($section, $allowedSections, true), 404);

    // Beneficiaries has its own dedicated page.
    if ($section === 'beneficiaries') {
        return redirect()->route('project-beneficiaries.index', [
            'subproject_id' => $subproject->getKey(),
        ]);
    }

    // Dedicated Economic Benefits workspace.
    if ($section === 'economic-benefits') {
        return Inertia::render('Manage/ManageBenefits', [
            'subproject' => $subproject,
            'section' => $section,
        ]);
    }

    // Other management sections.
    return Inertia::render('Manage/Management', [
        'subproject' => $subproject,
        'section' => $section,
    ]);
}
}
