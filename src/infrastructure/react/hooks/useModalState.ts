import { useRef, useState } from 'react';
import type { GateRequirements } from '../../../application/RepairBrokenGateUseCase';
import type { TextbookModalMode } from '../components/TextbookModal';

/**
 * Open/closed state of every modal and screen laid over the game, with the small bits of
 * data some of them need when they open (which book, which gate, which waypoint).
 * `closeTopModal` closes the one that was opened last, which is what Esc should do.
 */
export function useModalState ()
{
    const [isLibraryOpen, setIsLibraryOpen] = useState(false);
    const [textbookModalMode, setTextbookModalMode] = useState<TextbookModalMode>('reader');
    const [activeReaderBookId, setActiveReaderBookId] = useState<string | undefined>(undefined);
    const [activeReaderPageNumber, setActiveReaderPageNumber] = useState<number | undefined>(undefined);
    const [isAcademyOpen, setIsAcademyOpen] = useState(false);
    const [activeExamBookId, setActiveExamBookId] = useState('book-ch1');
    const [isWorkshopOpen, setIsWorkshopOpen] = useState(false);
    const [isForgeOpen, setIsForgeOpen] = useState(false);
    const [isBackpackOpen, setIsBackpackOpen] = useState(false);
    const [isGateRepairOpen, setIsGateRepairOpen] = useState(false);
    const [activeGateId, setActiveGateId] = useState('gate-ch1');
    const [activeGateRequirements, setActiveGateRequirements] = useState<GateRequirements | undefined>(undefined);
    const [isWaypointOpen, setIsWaypointOpen] = useState(false);
    const [waypointName, setWaypointName] = useState('ຈຸດວາບປອດໄພ');
    const [isQuizFinisherOpen, setIsQuizFinisherOpen] = useState(false);
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [isStageSelectOpen, setIsStageSelectOpen] = useState(false);
    const [isStageMapOpen, setIsStageMapOpen] = useState(false);

    // Newest state for `closeTopModal`, which key handlers may call from an older render
    const open = {
        library: isLibraryOpen,
        academy: isAcademyOpen,
        workshop: isWorkshopOpen,
        forge: isForgeOpen,
        backpack: isBackpackOpen,
        gateRepair: isGateRepairOpen,
        waypoint: isWaypointOpen,
        quizFinisher: isQuizFinisherOpen,
        settings: isSettingsOpen,
        stageSelect: isStageSelectOpen,
        stageMap: isStageMapOpen,
    };
    const openRef = useRef(open);
    openRef.current = open;

    /** Closes the topmost modal. Returns false when none was open. */
    const closeTopModal = (): boolean =>
    {
        const now = openRef.current;
        if (now.library) { setIsLibraryOpen(false); return true; }
        if (now.academy) { setIsAcademyOpen(false); return true; }
        if (now.workshop) { setIsWorkshopOpen(false); return true; }
        if (now.forge) { setIsForgeOpen(false); return true; }
        if (now.backpack) { setIsBackpackOpen(false); return true; }
        if (now.gateRepair) { setIsGateRepairOpen(false); return true; }
        if (now.waypoint) { setIsWaypointOpen(false); return true; }
        if (now.quizFinisher) { setIsQuizFinisherOpen(false); return true; }
        if (now.settings) { setIsSettingsOpen(false); return true; }
        if (now.stageSelect) { setIsStageSelectOpen(false); return true; }
        if (now.stageMap) { setIsStageMapOpen(false); return true; }
        return false;
    };

    const isAnyModalOpen = Object.values(open).some(Boolean);

    return {
        isLibraryOpen, setIsLibraryOpen,
        textbookModalMode, setTextbookModalMode,
        activeReaderBookId, setActiveReaderBookId,
        activeReaderPageNumber, setActiveReaderPageNumber,
        isAcademyOpen, setIsAcademyOpen,
        activeExamBookId, setActiveExamBookId,
        isWorkshopOpen, setIsWorkshopOpen,
        isForgeOpen, setIsForgeOpen,
        isBackpackOpen, setIsBackpackOpen,
        isGateRepairOpen, setIsGateRepairOpen,
        activeGateId, setActiveGateId,
        activeGateRequirements, setActiveGateRequirements,
        isWaypointOpen, setIsWaypointOpen,
        waypointName, setWaypointName,
        isQuizFinisherOpen, setIsQuizFinisherOpen,
        isSettingsOpen, setIsSettingsOpen,
        isStageSelectOpen, setIsStageSelectOpen,
        isStageMapOpen, setIsStageMapOpen,
        closeTopModal,
        isAnyModalOpen,
    };
}
