import { useEffect, useRef, useState } from 'react';
import { IRefPhaserGame, PhaserGame } from './PhaserGame';
import { DomainEvents } from '../../domain/DomainEvents';
import { LEVEL_COMPLETE_EVENT } from '../../application/CompleteLevelUseCase';

function App()
{
    const phaserRef = useRef<IRefPhaserGame | null>(null);
    const [levelComplete, setLevelComplete] = useState(false);

    useEffect(() =>
    {
        const onLevelComplete = () => setLevelComplete(true);

        DomainEvents.on(LEVEL_COMPLETE_EVENT, onLevelComplete);

        return () => DomainEvents.off(LEVEL_COMPLETE_EVENT, onLevelComplete);
    }, []);

    return (
        <div id="app">
            <PhaserGame ref={phaserRef} />
            {levelComplete && <div className="level-complete">Level Complete!</div>}
        </div>
    )
}

export default App
