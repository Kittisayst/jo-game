export interface BookPage
{
    pageNumber: number;
    title: string;
    content: string;
    keyPoints: string[];
}

export interface BookDefinition
{
    id: string;
    chapter: number;
    title: string;
    titleEn: string;
    description: string;
    price: number;
    unlockedRecipes: string[];
    pages: BookPage[];
}

export interface BookProgressSnapshot
{
    bookId: string;
    unlocked: boolean;
    readPages: number[];
    examPassed: boolean;
    bestScore: number;
    attempts: number;
}

export class BookProgress
{
    public readonly bookId: string;
    private _unlocked: boolean;
    private _readPages: Set<number>;
    private _examPassed: boolean;
    private _bestScore: number;
    private _attempts: number;

    constructor (
        bookId: string,
        unlocked = false,
        readPages: number[] = [],
        examPassed = false,
        bestScore = 0,
        attempts = 0
    )
    {
        this.bookId = bookId;
        this._unlocked = unlocked;
        this._readPages = new Set(readPages);
        this._examPassed = examPassed;
        this._bestScore = Math.max(0, bestScore);
        this._attempts = Math.max(0, attempts);
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

    markPageRead (pageNumber: number): void
    {
        if (pageNumber > 0)
        {
            this._readPages.add(pageNumber);
        }
    }

    hasReadPage (pageNumber: number): boolean
    {
        return this._readPages.has(pageNumber);
    }

    isFullyRead (totalPages: number): boolean
    {
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

    /**
     * Records exam completion. Pass threshold is 4/5 (>= 80%).
     * First pass reward: 50 credit.
     * Subsequent pass reward: 5 credit.
     * Fail (< 4): 0 credit.
     */
    recordExamResult (score: number, totalQuestions = 5): { passed: boolean; firstTime: boolean; creditReward: number }
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
        const creditReward = firstTime ? 50 : 5;

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
            snapshot.attempts
        );
    }
}

