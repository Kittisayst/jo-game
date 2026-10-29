export interface BookPage
{
    pageNumber: number;
    title: string;
    content: string;
    keyPoints: string[];
    /** Optional SVG diagram path in `public/assets/books/` illustrating the page's concept. */
    illustration?: string;
}

export interface BookDefinition
{
    id: string;
    chapter: number;
    title: string;
    titleEn: string;
    description: string;
    price: number;
    prerequisiteBookId?: string | null;
    requiredCompletedStageId?: string | null;
    unlockedRecipes: string[];
    pages: BookPage[];
}

export interface BookReadProgress
{
    readCount: number;
    totalPages: number;
    percentage: number;
    isComplete: boolean;
}

export interface BookProgressSnapshot
{
    bookId: string;
    unlocked: boolean;
    readPages: number[];
    examPassed: boolean;
    bestScore: number;
    attempts: number;
    /** Date (YYYY-MM-DD) the daily resit reward was last paid. */
    lastResitRewardDate?: string | null;
}

export class BookProgress
{
    public readonly bookId: string;
    private _unlocked: boolean;
    private _readPages: Set<number>;
    private _examPassed: boolean;
    private _bestScore: number;
    private _attempts: number;
    private _lastResitRewardDate: string | null;

    constructor (
        bookId: string,
        unlocked = false,
        readPages: number[] = [],
        examPassed = false,
        bestScore = 0,
        attempts = 0,
        lastResitRewardDate: string | null = null
    )
    {
        this.bookId = bookId;
        this._unlocked = unlocked;
        this._readPages = new Set(readPages);
        this._examPassed = examPassed;
        this._bestScore = Math.max(0, bestScore);
        this._attempts = Math.max(0, attempts);
        this._lastResitRewardDate = lastResitRewardDate;
    }

    get isUnlocked (): boolean
    {
        return this._unlocked;
    }

    get examPassed (): boolean
    {
        return this._examPassed;
    }

    get bestScore (): number
    {
        return this._bestScore;
    }

    get attempts (): number
    {
        return this._attempts;
    }

    get readPages (): number[]
    {
        return Array.from(this._readPages).sort((a, b) => a - b);
    }

    unlock (): void
    {
        this._unlocked = true;
    }

    markPageRead (pageNumber: number): boolean
    {
        if (!this._unlocked || pageNumber <= 0)
        {
            return false;
        }
        const alreadyRead = this._readPages.has(pageNumber);
        this._readPages.add(pageNumber);
        return !alreadyRead;
    }

    hasReadPage (pageNumber: number): boolean
    {
        return this._unlocked && this._readPages.has(pageNumber);
    }

    isFullyRead (totalPages: number): boolean
    {
        if (!this._unlocked) return false;
        if (totalPages <= 0) return true;
        for (let i = 1; i <= totalPages; i++)
        {
            if (!this._readPages.has(i))
            {
                return false;
            }
        }
        return true;
    }

    getReadProgress (totalPages: number): BookReadProgress
    {
        const safeTotal = Math.max(0, Math.floor(totalPages));
        if (!this._unlocked || safeTotal === 0)
        {
            return {
                readCount: 0,
                totalPages: safeTotal,
                percentage: 0,
                isComplete: false,
            };
        }

        let readCount = 0;
        for (let i = 1; i <= safeTotal; i++)
        {
            if (this._readPages.has(i))
            {
                readCount++;
            }
        }

        return {
            readCount,
            totalPages: safeTotal,
            percentage: Math.round((readCount / safeTotal) * 100),
            isComplete: readCount >= safeTotal,
        };
    }

    canTakeExam (totalPages: number): boolean
    {
        return this._unlocked && this.isFullyRead(totalPages);
    }

    /**
     * Records exam completion. Pass threshold is 4/5 (>= 80%).
     * First pass reward: 50 credit.
     * Subsequent pass reward: 5 credit, paid at most once per calendar day (`today`, YYYY-MM-DD).
     * Fail (< 4): 0 credit.
     */
    recordExamResult (score: number, totalQuestions = 5, today = ''): { passed: boolean; firstTime: boolean; creditReward: number }
    {
        this._attempts++;
        if (score > this._bestScore)
        {
            this._bestScore = score;
        }

        const passThreshold = Math.ceil(totalQuestions * 0.8);
        const passed = score >= passThreshold;

        if (!passed)
        {
            return { passed: false, firstTime: false, creditReward: 0 };
        }

        const firstTime = !this._examPassed;
        this._examPassed = true;
        let creditReward = 50;
        if (!firstTime)
        {
            const alreadyPaidToday = today !== '' && this._lastResitRewardDate === today;
            creditReward = alreadyPaidToday ? 0 : 5;
            if (creditReward > 0)
            {
                this._lastResitRewardDate = today || null;
            }
        }

        return { passed: true, firstTime, creditReward };
    }

    toSnapshot (): BookProgressSnapshot
    {
        return {
            bookId: this.bookId,
            unlocked: this._unlocked,
            readPages: this.readPages,
            examPassed: this._examPassed,
            bestScore: this._bestScore,
            attempts: this._attempts,
            lastResitRewardDate: this._lastResitRewardDate,
        };
    }

    static fromSnapshot (snapshot: BookProgressSnapshot): BookProgress
    {
        return new BookProgress(
            snapshot.bookId,
            snapshot.unlocked,
            snapshot.readPages,
            snapshot.examPassed,
            snapshot.bestScore,
            snapshot.attempts,
            snapshot.lastResitRewardDate ?? null
        );
    }
}

