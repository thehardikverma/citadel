import { generateText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { getTools } from '@/lib/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages, currentSection, masterPassword } = await req.json();

    const result = await generateText({
      model: groq('llama-3.3-70b-versatile'),
      system: `You are Citadel AI, a secure personal assistant inside the user's encrypted vault.
Your job is to help manage passwords, secure notes, and files.

RULES:
1. Use 'addPassword' tool to save passwords.
2. Use 'createNote' tool to save notes.
3. Use 'generateStrongPassword' to generate passwords.
4. Use 'searchVaultMetadata' to search vault titles.
5. Use 'getDashboardStats' to get vault stats.
6. Use 'navigateTo' to navigate the UI.
7. Be concise and helpful.

Current section: ${currentSection}`,
      messages: messages.map((m: { role: string; content: string }) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      tools: getTools(masterPassword),
      maxSteps: 5,
    });

    return Response.json({
      content: result.text,
      toolResults: result.steps?.flatMap(s =>
        s.toolResults?.map(r => ({
          toolName: r.toolName,
          result: r.result,
        })) || []
      ) || [],
    });
  } catch (error: unknown) {
    console.error('Agent error:', error);
    return Response.json(
      { content: 'Sorry, I encountered an error. Please try again.', toolResults: [] },
      { status: 500 }
    );
  }
}
