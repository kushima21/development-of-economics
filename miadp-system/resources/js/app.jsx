
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';

createInertiaApp({
    title: (title) => `${title} - MIADP System`,

    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.jsx', {
            eager: true,
        });

        const page = pages[`./Pages/${name}.jsx`];

        if (!page) {
            throw new Error(`Page not found: ${name}`);
        }

        return page;
    },

    setup({ el, App, props }) {
        createRoot(el).render(<App {...props} />);
    },
});
