import { Wallet } from '../domain/entities/Wallet';

/** Credit paid for proving the chapter's knowledge by beating its boss for the first time. */
export const CHAPTER_CLEAR_CREDIT = 60;

/**
 * Awards the one-time chapter clear bonus. Returns the Credit paid (0 on a repeat clear).
 * It is learning-gated: the boss only dies after the finisher question is answered correctly.
 */
export function awardChapterClearUseCase (wallet: Wallet, isFirstTimeClear: boolean): number
{
    if (!isFirstTimeClear)
    {
        return 0;
    }

    wallet.earn(CHAPTER_CLEAR_CREDIT);
    return CHAPTER_CLEAR_CREDIT;
}
