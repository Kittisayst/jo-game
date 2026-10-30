import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './infrastructure/react/App.tsx';
import { entities } from './infrastructure/composition';
import { installGameContent, loadGameContent } from './infrastructure/content/ContentCatalog';

const root = ReactDOM.createRoot(document.getElementById('root')!);

// Game data is loaded and checked once, before anything renders, so screens can read it synchronously.
loadGameContent()
    .then(content =>
    {
        installGameContent(content);
        entities.itemCatalog.load(content.items);
        entities.tutorial.setSteps(content.tutorial);

        root.render(
            <React.StrictMode>
                <App />
            </React.StrictMode>,
        );
    })
    .catch(error =>
    {
        console.error(error);
        root.render(
            <pre role="alert" style={{ color: '#fecaca', background: '#1f2937', padding: 24, whiteSpace: 'pre-wrap' }}>
                {`ໂຫຼດຂໍ້ມູນເກມບໍ່ສຳເລັດ (Game data failed to load)\n\n${error instanceof Error ? error.message : String(error)}`}
            </pre>,
        );
    });
