import { useEffect, useState } from 'react';
import { canInstall, onInstallChange, promptInstall } from '../../installPrompt';

/** Whether the game can be installed now, and the function that asks the browser to install it. */
export function useInstallPrompt (): { available: boolean; install: () => Promise<void> }
{
    const [available, setAvailable] = useState(canInstall);

    useEffect(() => onInstallChange(() => setAvailable(canInstall())), []);

    return {
        available,
        install: async () => { await promptInstall(); },
    };
}
