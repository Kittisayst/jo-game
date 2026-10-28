export interface QuestionData
{
    id: string;
    bookId: string;
    pageNumber: number;
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
}

export interface QuestionStats
{
    questionId: string;
    timesSeen: number;
    timesCorrect: number;
    timesIncorrect: number;
    lastAnsweredAt: number;
}

export interface ExamAnswerResult
{
    questionId: string;
    question: string;
    selectedOption: number;
    correctOption: number;
    isCorrect: boolean;
    explanation: string;
    pageNumber: number;
    options: string[];
    /** 1-based position in the exam, for showing "ຂໍ້ 2". */
    questionNumber: number;
}

export class QuizExamSession
{
    public readonly questions: QuestionData[];
    private _answers: Map<number, number>; // index -> selectedOption

    constructor (questions: QuestionData[])
    {
        this.questions = questions;
        this._answers = new Map();
    }

    get totalQuestions (): number
    {
        return this.questions.length;
    }

    get answeredCount (): number
    {
        return this._answers.size;
    }

    get isComplete (): boolean
    {
        return this._answers.size === this.questions.length;
    }

    answerQuestion (index: number, selectedOption: number): void
    {
        if (index < 0 || index >= this.questions.length)
        {
            throw new Error(`Invalid question index ${index}`);
        }
        this._answers.set(index, selectedOption);
    }

    getSelectedAnswer (index: number): number | undefined
    {
        return this._answers.get(index);
    }

    get score (): number
    {
        let correct = 0;
        for (let i = 0; i < this.questions.length; i++)
        {
            const selected = this._answers.get(i);
            if (selected !== undefined && selected === this.questions[i].correctIndex)
            {
                correct++;
            }
        }
        return correct;
    }

    get passThreshold (): number
    {
        return Math.ceil(this.questions.length * 0.8); // 4 out of 5
    }

    get hasPassed (): boolean
    {
        return this.score >= this.passThreshold;
    }

    getResults (): ExamAnswerResult[]
    {
        return this.questions.map((q, index) =>
        {
            const selected = this._answers.get(index) ?? -1;
            return {
                questionId: q.id,
                question: q.question,
                selectedOption: selected,
                correctOption: q.correctIndex,
                isCorrect: selected === q.correctIndex,
                explanation: q.explanation,
                pageNumber: q.pageNumber,
                options: q.options,
                questionNumber: index + 1,
            };
        });
    }

    /** Questions answered wrongly or left blank, so the player can review them in the textbook. */
    getMissedResults (): ExamAnswerResult[]
    {
        return this.getResults().filter(r => !r.isCorrect);
    }
}

export interface DailyPracticeProgressSnapshot
{
    lastPracticeDate: string; // YYYY-MM-DD
    practiceCountToday: number;
    questionStats: Record<string, QuestionStats>;
}

export class SpacedRepetitionSystem
{
    private _stats: Map<string, QuestionStats>;
    private _lastPracticeDate: string;
    private _practiceCountToday: number;

    constructor (
        stats: Record<string, QuestionStats> = {},
        lastPracticeDate = '',
        practiceCountToday = 0
    )
    {
        this._stats = new Map(Object.entries(stats));
        this._lastPracticeDate = lastPracticeDate;
        this._practiceCountToday = practiceCountToday;
    }

    get lastPracticeDate (): string
    {
        return this._lastPracticeDate;
    }

    get practiceCountToday (): number
    {
        return this._practiceCountToday;
    }

    getQuestionStats (questionId: string): QuestionStats
    {
        return this._stats.get(questionId) ?? {
            questionId,
            timesSeen: 0,
            timesCorrect: 0,
            timesIncorrect: 0,
            lastAnsweredAt: 0,
        };
    }

    recordAnswer (questionId: string, isCorrect: boolean, timestamp = Date.now()): void
    {
        const current = this.getQuestionStats(questionId);
        current.timesSeen++;
        if (isCorrect)
        {
            current.timesCorrect++;
        }
        else
        {
            current.timesIncorrect++;
        }
        current.lastAnsweredAt = timestamp;
        this._stats.set(questionId, current);
    }

    calculateWeight (questionId: string): number
    {
        const stats = this._stats.get(questionId);
        if (!stats || stats.timesSeen === 0)
        {
            return 25; // High priority for unvisited questions
        }

        // Higher weight for questions missed frequently
        const mistakeWeight = stats.timesIncorrect * 15;
        // Lower weight for questions mastered
        const masteryReduction = stats.timesCorrect * 4;

        return Math.max(2, 10 + mistakeWeight - masteryReduction);
    }

    /**
     * Selects N questions using weighted random sampling without duplicates.
     */
    selectQuestions (pool: QuestionData[], count = 3): QuestionData[]
    {
        if (pool.length <= count)
        {
            return [...pool];
        }

        const remaining = [...pool];
        const selected: QuestionData[] = [];

        while (selected.length < count && remaining.length > 0)
        {
            const weights = remaining.map(q => this.calculateWeight(q.id));
            const totalWeight = weights.reduce((sum, w) => sum + w, 0);

            let randomVal = Math.random() * totalWeight;
            let pickedIndex = 0;

            for (let i = 0; i < remaining.length; i++)
            {
                randomVal -= weights[i];
                if (randomVal <= 0)
                {
                    pickedIndex = i;
                    break;
                }
            }

            selected.push(remaining[pickedIndex]);
            remaining.splice(pickedIndex, 1);
        }

        return selected;
    }

    canPracticeToday (todayDate: string): boolean
    {
        if (this._lastPracticeDate !== todayDate)
        {
            return true;
        }
        return this._practiceCountToday < 3;
    }

    completeDailySession (todayDate: string, sessionCount = 1): void
    {
        if (this._lastPracticeDate !== todayDate)
        {
            this._lastPracticeDate = todayDate;
            this._practiceCountToday = sessionCount;
        }
        else
        {
            this._practiceCountToday += sessionCount;
        }
    }

    toSnapshot (): DailyPracticeProgressSnapshot
    {
        const statsObj: Record<string, QuestionStats> = {};
        for (const [key, val] of this._stats.entries())
        {
            statsObj[key] = { ...val };
        }
        return {
            lastPracticeDate: this._lastPracticeDate,
            practiceCountToday: this._practiceCountToday,
            questionStats: statsObj,
        };
    }

    static fromSnapshot (snapshot: DailyPracticeProgressSnapshot): SpacedRepetitionSystem
    {
        return new SpacedRepetitionSystem(
            snapshot.questionStats || {},
            snapshot.lastPracticeDate || '',
            snapshot.practiceCountToday || 0
        );
    }
}

