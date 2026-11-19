
<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">

    <meta name="viewport" content="width=device-width, initial-scale=1">

    <!-- Laravel CSRF Protection -->
    <meta name="csrf-token" content="{{ csrf_token() }}">

    <!-- Application Title -->
    <title inertia>{{ config('app.name', 'MIADP System') }}</title>

    <!-- Vite and React -->
    @viteReactRefresh
    @vite('resources/js/app.jsx')

    <!-- Inertia Head -->
    @inertiaHead
</head>

<body class="antialiased">
    @inertia
</body>
</html>
