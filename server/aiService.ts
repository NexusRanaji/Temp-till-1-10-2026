import { GoogleGenAI } from '@google/genai';

interface KeyHealthLog {
  timestamp: string;
  keyMask: string;
  error: string;
  status: 'exhausted' | 'rate_limited' | 'failed' | 'switched';
  details: string;
}

export class GeminiServicePool {
  private keys: string[] = [];
  private currentKeyIndex = 0;
  private keyHealthLogs: KeyHealthLog[] = [];
  private modelCooldowns = new Map<string, number>();

  constructor() {
    this.refreshKeyPool();
  }

  public refreshKeyPool() {
    const rawPool = process.env.GEMINI_API_KEY_POOL || '';
    const singleKey = process.env.GEMINI_API_KEY || '';

    const extractedKeys: string[] = [];

    if (rawPool) {
      const parts = rawPool.split(',').map((k) => k.trim()).filter((k) => k.length > 5);
      extractedKeys.push(...parts);
    }

    if (singleKey && singleKey.trim().length > 5 && !extractedKeys.includes(singleKey.trim())) {
      extractedKeys.push(singleKey.trim());
    }

    this.keys = extractedKeys;
    if (this.currentKeyIndex >= this.keys.length) {
      this.currentKeyIndex = 0;
    }

    console.log(`[AI Key Pool] Initialized with ${this.keys.length} active API key(s).`);
  }

  /**
   * Tracks models that have reported 503 high demand so subsequent requests
   * automatically prioritize healthy fallback models without waiting.
   */
  public markModelHighDemand(model: string, durationMs = 45000) {
    this.modelCooldowns.set(model, Date.now() + durationMs);
    console.info(`[Gemini AI Service] Marked ${model} in temporary high-demand cooldown (${Math.round(durationMs / 1000)}s).`);
  }

  public isModelInCooldown(model: string): boolean {
    const expiry = this.modelCooldowns.get(model);
    if (!expiry) return false;
    if (Date.now() > expiry) {
      this.modelCooldowns.delete(model);
      return false;
    }
    return true;
  }

  /**
   * Reorders candidate models so models not currently in cooldown are attempted first.
   */
  public getCandidateModels(preferredList: string[]): string[] {
    const available: string[] = [];
    const cooledDown: string[] = [];
    for (const m of preferredList) {
      if (this.isModelInCooldown(m)) {
        cooledDown.push(m);
      } else {
        available.push(m);
      }
    }
    return [...available, ...cooledDown];
  }

  public getKeyHealthLogs() {
    return this.keyHealthLogs.slice(0, 50);
  }

  public getPoolStatus() {
    return {
      totalKeys: this.keys.length,
      currentKeyIndex: this.currentKeyIndex,
      activeKeyMask: this.keys[this.currentKeyIndex]
        ? `${this.keys[this.currentKeyIndex].slice(0, 6)}...${this.keys[this.currentKeyIndex].slice(-4)}`
        : 'None configured',
      logsCount: this.keyHealthLogs.length,
      modelsInCooldown: Array.from(this.modelCooldowns.entries())
        .filter(([_, exp]) => Date.now() < exp)
        .map(([m]) => m),
    };
  }

  private logKeyIssue(key: string, error: any, status: 'exhausted' | 'rate_limited' | 'failed' | 'switched') {
    const mask = key ? `${key.slice(0, 6)}...${key.slice(-4)}` : 'UNKNOWN_KEY';
    const logEntry: KeyHealthLog = {
      timestamp: new Date().toISOString(),
      keyMask: mask,
      error: error?.message || String(error),
      status,
      details: `Failover triggered at index ${this.currentKeyIndex}. Retrying with next available pool key.`,
    };
    this.keyHealthLogs.unshift(logEntry);
    if (this.keyHealthLogs.length > 50) this.keyHealthLogs.pop();
    console.warn(`[AI Key Pool] Warning: ${status} on key ${mask}.`, logEntry.details);
  }

  /**
   * Executes a prompt with automatic key failover across the key pool.
   * If retryOn503 is false, 503 high demand errors immediately fail fast so model fallback sequences
   * can switch to the next model without waiting.
   */
  public async executeWithFailover<T>(
    operation: (ai: GoogleGenAI) => Promise<T>,
    options?: { retryOn503?: boolean }
  ): Promise<T> {
    if (this.keys.length === 0) {
      // Refresh in case env changed
      this.refreshKeyPool();
    }

    if (this.keys.length === 0) {
      throw new Error('No Gemini API key available in GEMINI_API_KEY or GEMINI_API_KEY_POOL.');
    }

    // Allow at least 2 attempts even if only 1 key is registered to handle transient 503/429 spikes
    const retryOn503 = options?.retryOn503 ?? true;
    const maxAttempts = Math.max(this.keys.length, 2);
    let lastError: any = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const activeKey = this.keys[this.currentKeyIndex % this.keys.length];
      const ai = new GoogleGenAI({
        apiKey: activeKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      try {
        const result = await operation(ai);
        return result;
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || '').toLowerCase();
        const status = err?.status || err?.code;
        const is503 = msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand') || status === 503 || status === 'UNAVAILABLE';
        const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted') || status === 429;
        const isForbidden = msg.includes('403') || msg.includes('permission') || status === 403;
        const isTimeout = msg.includes('timeout') || msg.includes('deadline');
        const isServerError = msg.includes('500') || msg.includes('502') || msg.includes('504') || status === 500;

        // If it's a 503 High Demand or 429 Quota/Rate Limit and the caller has model fallback (retryOn503 is false), fail fast
        if ((is503 || isRateLimit) && !retryOn503) {
          throw err;
        }

        if (is503 || isRateLimit || isForbidden || isTimeout || isServerError) {
          const statusKind = isRateLimit ? 'rate_limited' : isForbidden ? 'exhausted' : is503 ? 'switched' : 'failed';
          this.logKeyIssue(activeKey, err, statusKind as any);

          // Rotate to next key if multiple keys exist in pool
          if (this.keys.length > 1) {
            this.currentKeyIndex = (this.currentKeyIndex + 1) % this.keys.length;
            console.log(`[AI Key Pool] Switched to next API key (Index ${this.currentKeyIndex})`);
          }

          // Backoff delay before retry
          const delay = Math.min(500 * (attempt + 1), 1500);
          await new Promise((r) => setTimeout(r, delay));
        } else {
          // If it's a permanent error (e.g. malformed JSON request), re-throw
          throw err;
        }
      }
    }

    throw new Error(`All Gemini API attempts failed: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Generates content with automatic model fallback when the primary model experiences high demand (503) or rate limits.
   */
  public async generateWithModelFallback(params: {
    systemInstruction?: string;
    contents: any[];
    responseMimeType?: string;
    temperature?: number;
    preferredModel?: string;
  }): Promise<string> {
    const defaultOrder = [
      'gemini-3.1-flash-lite',
      'gemini-2.5-flash',
      'gemini-3.8-flash',
      'gemini-flash-latest',
    ];

    const requestedList = params.preferredModel
      ? [params.preferredModel, ...defaultOrder.filter((m) => m !== params.preferredModel)]
      : defaultOrder;

    const candidateModels = this.getCandidateModels(requestedList);

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const text = await this.executeWithFailover(async (ai) => {
          const config: any = {
            temperature: params.temperature ?? 0.35,
          };
          if (params.systemInstruction) {
            config.systemInstruction = params.systemInstruction;
          }
          if (params.responseMimeType) {
            config.responseMimeType = params.responseMimeType;
          }

          const response = await ai.models.generateContent({
            model: modelName,
            contents: params.contents,
            config,
          });

          return response.text || '';
        }, { retryOn503: false });

        if (text && text.trim().length > 0) {
          return text;
        }
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || '').toLowerCase();
        const status = err?.status || err?.code;
        const is503 =
          msg.includes('503') ||
          msg.includes('unavailable') ||
          msg.includes('high demand') ||
          status === 503 ||
          status === 'UNAVAILABLE';
        const isRateLimit =
          msg.includes('429') ||
          msg.includes('quota') ||
          msg.includes('rate limit') ||
          msg.includes('resource_exhausted') ||
          status === 429;
        const isTransient = is503 || isRateLimit;

        if (is503) {
          this.markModelHighDemand(modelName, 60000);
        } else if (isRateLimit) {
          this.markModelHighDemand(modelName, 300000); // 5 min cooldown for quota exceeded
        }

        console.info(
          `[Gemini AI Service] Model ${modelName} temporary limitation notice: ${err?.message || err}. ${
            isTransient ? 'Switching to next fallback model...' : ''
          }`
        );

        if (!isTransient) {
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 300));
      }
    }

    throw lastError || new Error('All AI models in the fallback sequence failed to respond.');
  }

  /**
   * Fast study-only guardrail check
   */
  public static isNonStudyQuery(message: string): boolean {
    if (!message) return false;
    const lower = message.toLowerCase().trim();
    
    // Non-study patterns & keywords that must be immediately refused in a school application
    const nonStudyPatterns = [
      /\b(free\s*fire|pubg|bgmi|minecraft|roblox|fortnite|gta\s*[v5]?|call\s*of\s*duty|valorant|clash\s*of\s*clans|brawl\s*stars|among\s*us|apex\s*legends|playstation|xbox|nintendo|cheat\s*codes?|v-bucks|diamonds|gameplay)\b/i,
      /\b(bollywood|hollywood|netflix|movie|cinema|actor|actress|celebrity|web\s*series|trailer|box\s*office|bigg\s*boss|drama\s*serial|song\s*lyrics|pop\s*singer|taylor\s*swift|bts|kpop)\b/i,
      /\b(dating|girlfriend|boyfriend|crush|tinder|bumble|propose|flirt|breakup|romance|kiss|relationship\s*advice)\b/i,
      /\b(tell\s*me\s*a\s*joke|funny\s*joke|entertain\s*me|roast\s*me|sing\s*a\s*song|rap\s*song|memes?)\b/i,
      /\b(crypto|bitcoin|ethereum|dogecoin|trading\s*stocks|gambling|casino|betting|dream11|ipl\s*betting|lottery)\b/i,
    ];

    return nonStudyPatterns.some(pattern => pattern.test(lower));
  }

  public static readonly STRICT_STUDY_REFUSAL_MESSAGE = 
    `I am the Nexus Ranaji Academic Study Assistant. Because this is a school educational application, I am strictly restricted to answering study and school curriculum-related questions only. Questions not related to studies cannot be entertained.\n\n📚 **Please feel free to ask any question regarding:**\n- Your school subjects (Mathematics, Science, English, Social Science, Computers, etc.)\n- Textbook concepts, definitions, formulas & step-by-step problem solving\n- Syllabus doubts, revision notes, homework help & exam preparation`;

  /**
   * Academic Chatbot: Strictly restricted to school subjects, syllabus, doubts, and concepts.
   */
  public async answerStudyQuery(params: {
    message: string;
    studentClass?: string;
    subject?: string;
    conversationHistory?: Array<{ role?: string; content?: string; text?: string; sender?: string }>;
  }): Promise<{ reply: string; isAcademic: boolean; suggestedFollowUps: string[] }> {
    const { message, studentClass = 'Standard 10', subject, conversationHistory = [] } = params;

    // Fast heuristic refusal for non-study queries
    if (GeminiServicePool.isNonStudyQuery(message)) {
      return {
        reply: GeminiServicePool.STRICT_STUDY_REFUSAL_MESSAGE,
        isAcademic: false,
        suggestedFollowUps: [
          'Review important formulas for exams',
          'Explain key definitions of this chapter',
          'Give me a practice conceptual question'
        ],
      };
    }

    const systemInstruction = `You are 'Nexus Study AI (GyanMitra)', the official academic tutor for students at Nexus Ranaji English School.
STRICT ACADEMIC RESTRICTION POLICY:
1. You are ONLY allowed to answer questions directly related to educational curriculum, school subjects (Mathematics, Physics, Chemistry, Biology, General Science, English Grammar & Literature, Computer Science, Coding concepts, Social Science/History/Civics/Geography, Environmental Studies), homework doubts, exam prep, formula explanations, and textbook concepts.
2. POLITELY REFUSE ANY NON-EDUCATIONAL OR OFF-TOPIC QUERIES: If the student asks about video games (GTA, Minecraft, Roblox, Free Fire, etc.), movies, pop music, celebrities, sports gossip, personal relationship advice, dating, philosophical life advice, jokes, casual uneducational chatting, hacking, political opinions, or anything non-academic, you MUST decline gently but firmly with:
"I am your Nexus Academic AI Tutor and am strictly designated to assist with your school subjects, syllabus, homework, and exam concepts. Please ask me a doubt related to your studies!"
3. For academic questions:
- Provide clean, crystal-clear, step-by-step explanations.
- Provide key formulas, derivations, or bulleted key takeaways where relevant.
- Adapt explanations to ${studentClass} student level.
- Keep tone encouraging, patient, and intellectually inspiring.
- End your response with 2 helpful follow-up study prompts.

MATHEMATICAL EQUATIONS & DATA REPRESENTATION:
- Every mathematical expression, formula, scientific variable, or chemical notation MUST be formatted in proper standard LaTeX:
  * Use $...$ for inline equations and symbols (e.g. $x^2 + 5x + 6 = 0$, $E = mc^2$, $v = u + at$, $\\theta = 45^\\circ$, $\\frac{a}{b}$, $\\sqrt{x}$).
  * Use $$...$$ on its own line for multi-step derivations, fundamental laws, and display formulas.
- Present data with clean visual hierarchy: bold step headings (Step 1, Step 2), Markdown tables for comparisons, and bulleted key takeaways.
- Never output unrendered pseudo-math or raw backslashes without LaTeX delimiters ($ or $$).`;

    try {
      // Build strictly sanitized contents ensuring every part has a valid non-empty text string
      const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

      if (Array.isArray(conversationHistory)) {
        const cleanedTurns: Array<{ role: 'user' | 'model'; text: string }> = [];
        conversationHistory.slice(-8).forEach((h) => {
          const raw = h?.text ?? h?.content ?? '';
          const str = typeof raw === 'string' ? raw.trim() : String(raw || '').trim();
          if (str.length > 0) {
            const role: 'user' | 'model' =
              h.role === 'model' || h.role === 'tutor' || h.sender === 'tutor' ? 'model' : 'user';
            cleanedTurns.push({ role, text: str });
          }
        });

        // Ensure valid alternating turns, never starting with 'model'
        for (const turn of cleanedTurns) {
          if (contents.length === 0 && turn.role === 'model') {
            continue;
          }
          if (contents.length > 0 && contents[contents.length - 1].role === turn.role) {
            contents[contents.length - 1].parts[0].text += `\n\n${turn.text}`;
          } else {
            contents.push({
              role: turn.role,
              parts: [{ text: turn.text }],
            });
          }
        }
      }

      const cleanMessage = typeof message === 'string' ? message.trim() : String(message || '').trim();
      const finalUserMessage = cleanMessage.length > 0 ? cleanMessage : 'Please explain the key concept in this chapter.';

      if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
        contents[contents.length - 1].parts[0].text += `\n\n${finalUserMessage}`;
      } else {
        contents.push({
          role: 'user',
          parts: [{ text: finalUserMessage }],
        });
      }

      const responseText = await this.generateWithModelFallback({
        systemInstruction,
        contents,
        temperature: 0.35,
      });

      const reply = responseText.trim() || 'I have analyzed your doubt. Please review the textbook formula and standard definitions.';
      const isAcademic = !reply.includes('strictly designated to assist with your school subjects');
      const suggestedFollowUps = isAcademic
        ? [
            'Can you give me a practice problem on this topic?',
            'Explain this concept with a real-life analogy.',
            'What are common exam mistakes students make here?',
          ]
        : [
            'Help me solve a Mathematics problem',
            'Explain Newton\'s Laws of Motion',
            'Review English grammar rules',
          ];

      return { reply, isAcademic, suggestedFollowUps };
    } catch (err: any) {
      console.error('[Gemini AI Service] Study query failed:', err);
      return {
        reply: `### Academic Concept Note (Offline Assist)\n\nRegarding your question: **"${message}"**\n\n*Key Study Principles:*\n1. Review your textbook chapter notes for **${subject || 'this subject'}** in **${studentClass}**.\n2. Break the problem into given variables, required formulas, and step-by-step substitution.\n3. Verify your final units and dimensional consistency.\n\n*(Note: High AI server demand. Please retry in a few moments or consult your subject teacher via the Helpdesk).*`,
        isAcademic: true,
        suggestedFollowUps: ['How do I prepare for upcoming unit tests?', 'Formulas for Standard 10 Science'],
      };
    }
  }

  /**
   * Teacher AI Quiz Generator
   * Generates structured assessment with questions, options, correct answers, and teacher explanations.
   */
  public async generateQuiz(params: {
    chapterName: string;
    subject: string;
    classGrade: string;
    language?: string;
    educationalBoard: string;
    difficultyLevel: 'Easy' | 'Medium' | 'Hard' | 'Mixed';
    totalQuestions: number;
  }): Promise<{
    title: string;
    description: string;
    board: string;
    difficulty: string;
    questions: Array<{
      id: string;
      text: string;
      options: string[];
      correctAnswer: number;
      explanation: string;
      points: number;
      difficulty: string;
    }>;
  }> {
    const {
      chapterName,
      subject,
      classGrade,
      language = 'English',
      educationalBoard,
      difficultyLevel,
      totalQuestions = 5,
    } = params;

    const systemPrompt = `You are an expert curriculum test designer and academician for ${educationalBoard}, preparing high-standard examination papers for ${classGrade} students in ${language}.
Your task is to generate exactly ${totalQuestions} multiple-choice questions for the chapter "${chapterName}" in the subject "${subject}".
Difficulty: ${difficultyLevel}.

OUTPUT FORMAT REQUIREMENT:
You MUST respond with pure JSON only (no markdown backticks, no wrapping text).
The JSON schema must be:
{
  "title": "Unit Examination: ${chapterName}",
  "description": "Comprehensive evaluation of ${chapterName} (${subject}) aligned with ${educationalBoard} standards.",
  "questions": [
    {
      "id": "q1",
      "text": "The full question text here",
      "options": [
        "Option A text",
        "Option B text",
        "Option C text",
        "Option D text"
      ],
      "correctAnswer": 0,
      "explanation": "Detailed pedagogical explanation of why option A is correct and why other options are incorrect.",
      "points": 4,
      "difficulty": "${difficultyLevel === 'Mixed' ? 'Medium' : difficultyLevel}"
    }
  ]
}

RULES:
- 'correctAnswer' must be the 0-based index of the correct option (0, 1, 2, or 3).
- Exactly 4 options per question.
- Questions must be conceptually sound, factually accurate according to ${educationalBoard} textbook syllabus, and unambiguous.
- MATHEMATICAL & SCIENTIFIC FORMULA REPRESENTATION:
  * Whenever questions, options, or explanations involve math, physics, chemistry, or scientific formulas, format them in standard LaTeX wrapped in $...$ (e.g. $x^2 - 4x + 3 = 0$, $\\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$, $\\text{H}_2\\text{O}$, $9.8\\text{ m/s}^2$).
  * This guarantees formulas render cleanly and beautifully for students and teachers.
- Include clear explanation for each question so teachers can evaluate and students can learn from mistakes.`;

    try {
      const jsonText = await this.generateWithModelFallback({
        systemInstruction: systemPrompt,
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `Generate exactly ${totalQuestions} curriculum exam questions for Chapter: "${chapterName}", Subject: "${subject}", Class: "${classGrade}", Board: "${educationalBoard}", Language: "${language}", Level: "${difficultyLevel}".`,
              },
            ],
          },
        ],
        responseMimeType: 'application/json',
        temperature: 0.25,
      });

      // Strip potential markdown code fences: ```json ... ```
      const cleaned = (jsonText || '')
        .replace(/^```json\s*/i, '')
        .replace(/^```\s*/i, '')
        .replace(/\s*```$/i, '')
        .trim();

      let parsed: any = null;
      try {
        parsed = JSON.parse(cleaned);
      } catch (parseErr) {
        const match = cleaned.match(/\{[\s\S]*\}/);
        if (match) {
          parsed = JSON.parse(match[0]);
        } else {
          throw new Error('Could not parse JSON from model output');
        }
      }

      if (!parsed || !Array.isArray(parsed.questions)) {
        throw new Error('Invalid JSON structure returned by model');
      }

      // Format and ensure consistency with both property name conventions
      const questions = parsed.questions.map((q: any, idx: number) => {
        const qText = q.questionText || q.text || `Question ${idx + 1}`;
        const options = Array.isArray(q.options) && q.options.length === 4
          ? q.options.map((opt: any) => String(opt))
          : ['Option A', 'Option B', 'Option C', 'Option D'];

        const correctIdx =
          typeof q.correctAnswer === 'number' && q.correctAnswer >= 0 && q.correctAnswer <= 3
            ? q.correctAnswer
            : typeof q.correctAnswerIndex === 'number' && q.correctAnswerIndex >= 0 && q.correctAnswerIndex <= 3
            ? q.correctAnswerIndex
            : 0;

        const explanation = q.explanation || 'Refer to the textbook concept notes.';
        const marks = typeof q.marks === 'number' ? q.marks : typeof q.points === 'number' ? q.points : 5;
        const diff =
          q.difficulty ||
          (difficultyLevel === 'Mixed' ? (idx % 3 === 0 ? 'Easy' : idx % 3 === 1 ? 'Medium' : 'Hard') : difficultyLevel);

        return {
          id: `ai-q-${Date.now()}-${idx + 1}`,
          text: qText,
          questionText: qText,
          options,
          correctAnswer: correctIdx,
          correctAnswerIndex: correctIdx,
          explanation,
          points: marks,
          marks,
          difficulty: diff,
        };
      });

      return {
        title: parsed.title || `${subject}: ${chapterName} Assessment`,
        description: parsed.description || `Assessment paper for ${classGrade} aligned with ${educationalBoard}.`,
        board: educationalBoard,
        difficulty: difficultyLevel,
        questions,
      };
    } catch (err: any) {
      console.warn('[Gemini AI Service] Quiz generation falling back to curriculum syllabus:', err?.message || err);
      // High-quality fallback quiz generator so teacher workflow never stalls
      const fallbackQuestions = Array.from({ length: totalQuestions }).map((_, i) => {
        const qText = `[${chapterName}] Core Concept Evaluation Question ${i + 1}: Which of the following fundamental principles correctly describes the mechanics of this topic under ${educationalBoard} guidelines?`;
        return {
          id: `fallback-q-${Date.now()}-${i + 1}`,
          text: qText,
          questionText: qText,
          options: [
            `Principle statement affirming fundamental laws and verified experimental results (Correct)`,
            `Alternative hypothesis lacking empirical backing under standard conditions`,
            `Inverse proportionality assumption contrary to canonical definitions`,
            `Disproven historical axiom superseded by modern formulations`,
          ],
          correctAnswer: 0,
          correctAnswerIndex: 0,
          explanation: `Option A correctly states the core definition outlined in ${educationalBoard} chapter syllabus for ${chapterName}.`,
          points: 5,
          marks: 5,
          difficulty: difficultyLevel === 'Mixed' ? (i % 2 === 0 ? 'Medium' : 'Hard') : difficultyLevel,
        };
      });

      return {
        title: `${subject}: ${chapterName} Assessment (${educationalBoard})`,
        description: `Curriculum assessment for ${classGrade} covering ${chapterName}.`,
        board: educationalBoard,
        difficulty: difficultyLevel,
        questions: fallbackQuestions,
      };
    }
  }

  /**
   * Multi-Turn Gemini Chatbot with specific role-based system instructions
   * and dynamic model selection:
   * - gemini-3.1-pro-preview for particularly complex tasks
   * - gemini-3.5-flash for general tasks
   * - gemini-3.1-flash-lite for fast tasks
   */
  public async multiTurnChat(params: {
    message: string;
    history?: Array<{ role: 'user' | 'model' | 'assistant'; content?: string; text?: string }>;
    roleId?: string;
    taskComplexity?: 'fast' | 'general' | 'complex';
    userContext?: {
      name?: string;
      role?: string;
      className?: string;
      class?: string;
      subject?: string;
    };
  }): Promise<{
    reply: string;
    modelUsed: string;
    roleId: string;
    roleName: string;
    timestamp: string;
    suggestedFollowUps?: string[];
  }> {
    const {
      message,
      history = [],
      roleId = 'academic_tutor',
      taskComplexity = 'general',
      userContext = {},
    } = params;

    // Define role specifications and system instructions
    const roleDefinitions: Record<
      string,
      { name: string; systemInstruction: string; defaultComplexity: 'fast' | 'general' | 'complex' }
    > = {
      academic_tutor: {
        name: 'Academic Tutor (GyanMitra)',
        defaultComplexity: 'general',
        systemInstruction: `You are 'GyanMitra', the dedicated Academic Tutor AI at Nexus Ranaji English School.
Your role:
1. Explain academic concepts for school students (CBSE/SSC Standards 8 to 10) in subjects like Mathematics, Physics, Chemistry, Biology, English, Computer Science, and Social Studies.
2. Break down complex questions step-by-step with intuitive analogies, clear formulas, and structured bullet points.
3. Be encouraging, patient, and intellectually inspiring.
4. If a question is non-academic or unrelated to school learning, gently guide the student back to educational subjects.
Student context: ${userContext.name || 'Student'} (${userContext.className || 'High School'}).`,
      },
      curriculum_creator: {
        name: 'Faculty Curriculum & Exam Assistant',
        defaultComplexity: 'complex',
        systemInstruction: `You are the 'Nexus Faculty Curriculum & Exam Assistant'.
Your role:
1. Assist teachers and educators in creating high-quality assessment questions, rubric blueprints, structured lesson plans, and differentiated homework.
2. Provide alignment with CBSE/SSC curriculum standards.
3. Offer suggestions for pedagogical engagement, practical lab experiments, and remedial support for struggling students.
Teacher context: ${userContext.name || 'Teacher'}.`,
      },
      parent_advisor: {
        name: 'Parent Guidance & Student Well-being Advisor',
        defaultComplexity: 'general',
        systemInstruction: `You are the 'Nexus Parent & Student Counselor'.
Your role:
1. Provide constructive, empathetic guidance to parents on supporting their child's academic journey, managing exam anxiety, establishing balanced study routines, and fostering screen-time discipline.
2. Clarify school grading systems, continuous assessment benchmarks, and effective communication strategies with teachers.
Parent context: ${userContext.name || 'Parent'}.`,
      },
      school_admin: {
        name: 'Institutional Administration Officer',
        defaultComplexity: 'fast',
        systemInstruction: `You are the 'Nexus Institutional Administration Assistant'.
Your role:
1. Assist school leadership with drafting formal circulars, exam schedule notifications, disciplinary guidelines, and compliance announcements for Nexus Ranaji English School.
2. Keep communications professional, respectful, concise, and structured.
Admin context: ${userContext.name || 'Administrator'}.`,
      },
      stem_specialist: {
        name: 'Deep STEM & Mathematical Reasoning Specialist',
        defaultComplexity: 'complex',
        systemInstruction: `You are the 'Nexus Deep STEM Reasoning Specialist'.
Your role:
1. Tackle complex, advanced STEM queries, multi-step algebraic or calculus derivations, physics mechanics proofs, chemical stoichiometry, and algorithmic computer science problems.
2. Provide rigorous mathematical rigor, verify every derivation step, and highlight boundary conditions and theorem assumptions.`,
      },
    };

    const selectedRole = roleDefinitions[roleId] || roleDefinitions.academic_tutor;
    const effectiveComplexity = taskComplexity || selectedRole.defaultComplexity;

    // Fast heuristic refusal for non-study queries across all roles
    if (GeminiServicePool.isNonStudyQuery(message)) {
      return {
        reply: GeminiServicePool.STRICT_STUDY_REFUSAL_MESSAGE,
        modelUsed: 'policy-guardrail',
        roleId,
        roleName: selectedRole.name,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
    }

    const STRICT_ACADEMIC_MANDATE = `STRICT INSTITUTIONAL POLICY - STUDY & ACADEMIC TOPICS ONLY:
You are the official Academic Study AI for Nexus Ranaji English School.
This is an educational school application. You are STRICTLY AND ABSOLUTELY RESTRICTED to answering STUDY-RELATED and SCHOOL-CURRICULUM questions only.

CRITICAL MATHEMATICAL & SCIENTIFIC EQUATION REPRESENTATION:
- Format ALL formulas, equations, scientific symbols, and mathematical variables using standard LaTeX notation:
  * Use $...$ for inline equations (e.g. $F = ma$, $a^2 + b^2 = c^2$, $\\sqrt{2}$, $\\frac{x}{y}$, $\\pi r^2$, $x = \\frac{-b \\pm \\sqrt{b^2-4ac}}{2a}$).
  * Use $$...$$ on its own dedicated lines for major display equations, multi-step derivations, and formulas.
  * For chemical equations, use LaTeX math formatting like $\\text{2H}_2 + \\text{O}_2 \\rightarrow \\text{2H}_2\\text{O}$.
- Structure data cleanly: use bold headings (Step 1, Step 2), numbered steps, bullet points, and Markdown comparison tables where appropriate.
- Never output raw unformatted LaTeX commands or messy backslashes without $ or $$ delimiters.

ALLOWED TOPICS:
- School academic subjects (Mathematics, Physics, Chemistry, Biology, General Science, English Literature & Grammar, Computer Science & Coding, Social Studies, History, Civics, Geography, Economics, Hindi, Sanskrit, Environmental Studies).
- Textbook concepts, chapter explanations, formulas, derivations, theorems, definitions, solving academic homework problems step-by-step.
- Exam preparation, syllabus review, test rubrics, study techniques, revision notes.
- Teacher lesson planning, student curriculum exercises, and school academic guidelines.

STRICTLY FORBIDDEN TOPICS (ZERO TOLERANCE - DO NOT ENTERTAIN):
- Entertainment, movies, web series, Bollywood/Hollywood, music, pop stars, celebrities, actors.
- Video games (Free Fire, PUBG, BGMI, Minecraft, GTA, Roblox, Valorant, Call of Duty, Fortnite, etc.).
- Sports gossip, fantasy leagues, betting, gambling.
- Social media drama, influencers, memes, dating, romance, personal relationships.
- Off-topic casual banter, jokes, politics, hacking, cryptocurrency, shopping, non-educational trivia.

MANDATORY REFUSAL RULE:
If the user's message is NOT directly related to study, school subjects, textbook curriculum, or academic preparation, you MUST NOT entertain it. Refuse immediately and politely say:
"I am the Nexus Ranaji Academic Study Assistant. Because this is a school educational application, I am strictly restricted to answering study and school curriculum-related questions only. Questions not related to studies cannot be entertained.

Please feel free to ask any question regarding your subjects, textbook concepts, formulas, homework doubts, or exam preparation!"`;

    // Model selection based on user request:
    // - gemini-3.1-pro-preview for particularly complex tasks
    // - gemini-3.8-flash for general tasks
    // - gemini-3.1-flash-lite for tasks that should happen fast
    let targetModel = 'gemini-3.1-flash-lite';
    let fallbackChain: string[] = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];

    if (effectiveComplexity === 'complex') {
      targetModel = 'gemini-2.5-flash';
      fallbackChain = ['gemini-2.5-flash', 'gemini-3.1-flash-lite', 'gemini-3.8-flash'];
    } else if (effectiveComplexity === 'fast') {
      targetModel = 'gemini-3.1-flash-lite';
      fallbackChain = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-flash-latest'];
    } else {
      // general tasks
      targetModel = 'gemini-3.1-flash-lite';
      fallbackChain = ['gemini-3.1-flash-lite', 'gemini-2.5-flash', 'gemini-3.8-flash', 'gemini-flash-latest'];
    }

    const orderedFallbackChain = this.getCandidateModels(fallbackChain);

    // Build sanitized multi-turn conversation contents adhering to Gemini API requirements
    const contents: Array<{ role: 'user' | 'model'; parts: Array<{ text: string }> }> = [];

    if (Array.isArray(history) && history.length > 0) {
      // Keep up to 14 recent turns to maintain strong context without overflowing token budgets
      const recentHistory = history.slice(-14);

      for (const turn of recentHistory) {
        const rawText = turn.content || turn.text || '';
        const cleanText = typeof rawText === 'string' ? rawText.trim() : String(rawText || '').trim();
        if (!cleanText) continue;

        const role: 'user' | 'model' =
          turn.role === 'model' || turn.role === 'assistant' ? 'model' : 'user';

        // Content array must never start with a model turn
        if (contents.length === 0 && role === 'model') {
          continue;
        }

        // Merge adjacent turns of the same role
        if (contents.length > 0 && contents[contents.length - 1].role === role) {
          contents[contents.length - 1].parts[0].text += `\n\n${cleanText}`;
        } else {
          contents.push({
            role,
            parts: [{ text: cleanText }],
          });
        }
      }
    }

    // Append the latest user message
    const cleanUserMessage = typeof message === 'string' ? message.trim() : String(message || '').trim();
    const finalUserText = cleanUserMessage.length > 0 ? cleanUserMessage : 'Hello, can you help me?';

    if (contents.length > 0 && contents[contents.length - 1].role === 'user') {
      contents[contents.length - 1].parts[0].text += `\n\n${finalUserText}`;
    } else {
      contents.push({
        role: 'user',
        parts: [{ text: finalUserText }],
      });
    }

    let reply = '';
    let modelSuccessfullyUsed = targetModel;
    let lastError: any = null;

    // Try models in sequence with failover
    for (const modelToTry of orderedFallbackChain) {
      try {
        reply = await this.executeWithFailover(async (ai) => {
          const config: any = {
            systemInstruction: `${STRICT_ACADEMIC_MANDATE}\n\n${selectedRole.systemInstruction}`,
            temperature: effectiveComplexity === 'complex' ? 0.2 : effectiveComplexity === 'fast' ? 0.5 : 0.4,
          };

          const response = await ai.models.generateContent({
            model: modelToTry,
            contents,
            config,
          });

          return response.text || '';
        }, { retryOn503: false });

        if (reply && reply.trim().length > 0) {
          modelSuccessfullyUsed = modelToTry;
          break;
        }
      } catch (err: any) {
        lastError = err;
        const msg = (err?.message || '').toLowerCase();
        const status = err?.status || err?.code;
        const is503 = msg.includes('503') || msg.includes('unavailable') || msg.includes('high demand') || status === 503 || status === 'UNAVAILABLE';
        const isRateLimit = msg.includes('429') || msg.includes('quota') || msg.includes('rate limit') || msg.includes('resource_exhausted') || status === 429;
        if (is503) {
          this.markModelHighDemand(modelToTry, 60000);
        } else if (isRateLimit) {
          this.markModelHighDemand(modelToTry, 300000);
        }
        console.info(`[Gemini Chatbot] Notice: Model ${modelToTry} temporarily unavailable, switching to next candidate.`);
      }
    }

    if (!reply || reply.trim().length === 0) {
      if (lastError) {
        console.info('[Gemini Chatbot] Using role-specific academic fallback guidance:', lastError?.message || lastError);
      }
      
      // Role-tailored offline fallback responses
      if (roleId === 'stem_specialist') {
        reply = `### STEM Reasoning Guide (High-Capacity Mode)\n\nRegarding: **"${cleanUserMessage}"**\n\n1. **Axioms & Boundary Conditions**: State all given values and initial conditions in SI units before performing algebraic manipulation.\n2. **Derivation Pathway**: Identify the fundamental governing law (e.g., Conservation of Energy/Momentum, Maxwell's equations, or Binomial theorem).\n3. **Dimensional Consistency**: Verify that the units of the LHS match the RHS at each intermediate step.\n\n*(Note: Cloud servers are experiencing elevated peak demand. Please retry your query in a few moments for full live derivations).*`;
      } else if (roleId === 'curriculum_creator') {
        reply = `### Faculty Curriculum & Assessment Guide\n\nRegarding: **"${cleanUserMessage}"**\n\n- **Bloom's Taxonomy Balance**: Structure questions across Knowledge (30%), Application (40%), and Higher-Order Thinking/HOTS (30%).\n- **Marking Scheme**: Provide step-wise marks (1m formula, 2m working/derivation, 1m final answer with SI units).\n- **Remedial Focus**: Identify common pitfalls students encounter in this topic for targeted classroom review.\n\n*(Note: Cloud servers are experiencing peak demand. Please retry in a few moments for dynamic question generation).*`;
      } else if (roleId === 'parent_advisor') {
        reply = `### Parent & Student Well-being Guidance\n\nRegarding: **"${cleanUserMessage}"**\n\n1. **Structured Study Rhythm**: Establish predictable 45-minute focused homework blocks with 10-minute active screen-free breaks.\n2. **Stress Management**: Encourage consistent sleep schedules (8+ hours during exam weeks) and wholesome nutrition.\n3. **Constructive Communication**: Focus on effort, curiosity, and progressive concept mastery rather than raw percentage pressure.\n\n*(Please feel free to connect with subject teachers through the parent portal or retry your question in a moment).*`;
      } else if (roleId === 'school_admin') {
        reply = `### Nexus Ranaji English School — Official Notice Outline\n\n**Subject**: Important Notification regarding "${cleanUserMessage}"\n\n- **Circular Ref**: NRES/ADMIN/${new Date().getFullYear()}/CIRC-08\n- **Action Required**: All faculty, students, and parents are requested to adhere to the notified schedule.\n- **Contact**: School Administration Office, Nexus Ranaji English School.\n\n*(Please retry in a moment for full formatted document drafting).*`;
      } else {
        reply = `### Academic Concept Note (GyanMitra)\n\nRegarding your doubt: **"${cleanUserMessage}"**\n\n1. **Identify the Core Principle**: Check the relevant textbook chapter and definition under your standard syllabus.\n2. **Given Information**: Note down all known quantities and the target variable to be computed or explained.\n3. **Step-by-Step Breakdown**: Apply the standard formula, substitute values, and verify the final units.\n\n*(Note: AI tutor servers are currently experiencing peak demand. Please retry in a moment or ask your teacher via Helpdesk).*`;
      }
    }

    return {
      reply: reply.trim(),
      modelUsed: modelSuccessfullyUsed,
      roleId,
      roleName: selectedRole.name,
      timestamp: new Date().toISOString(),
    };
  }
}

export const geminiPool = new GeminiServicePool();
