import { CliffhangerService } from '../services/cliffhanger.service';

/**
 * Analyze a chapter for cliffhangers
 * This can be triggered manually or via event emitter when a chapter is created/updated
 */
export async function analyzeChapterCliffhanger(chapterId: string) {
    try {
        console.log(`[Cliffhanger Analysis] Analyzing chapter ${chapterId}...`);

        const analysis = await CliffhangerService.analyzeCliffhanger(chapterId);

        console.log(`[Cliffhanger Analysis] Score: ${analysis.score}/100 - ${analysis.hasCliffhanger ? 'HAS CLIFFHANGER' : 'NO CLIFFHANGER'
            }`);

        if (analysis.cliffhangerText) {
            console.log(`[Cliffhanger Analysis] Text: "${analysis.cliffhangerText.substring(0, 100)}..."`);
        }

        return analysis;
    } catch (error) {
        console.error(`[Cliffhanger Analysis] Error analyzing chapter ${chapterId}:`, error);
        throw error;
    }
}

/**
 * Batch analyze all chapters in a biography
 */
export async function analyzeBiographyCliffhangers(biographyId: string) {
    try {
        console.log(`[Cliffhanger Analysis] Analyzing all chapters in biography ${biographyId}...`);

        await CliffhangerService.analyzeAllChapters(biographyId);

        console.log(`[Cliffhanger Analysis] Biography analysis complete`);
    } catch (error) {
        console.error(`[Cliffhanger Analysis] Error analyzing biography ${biographyId}:`, error);
        throw error;
    }
}
