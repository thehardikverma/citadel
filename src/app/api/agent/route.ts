import { streamText } from 'ai';
import { groq } from '@ai-sdk/groq';
import { getTools } from '@/lib/tools';

export const maxDuration = 60;

export async function POST(req: Request) {
  const { messages, currentSection, masterPassword } = await req.json();

  const result = streamText({
    model: groq('llama-3.3-70b-versatile'), // Using 3.3 for latest capabilities
    system: `You are Citadel AI, an advanced, highly secure personal assistant built into the user's encrypted vault.
Your job is to help the user manage their passwords, secure notes, and files.

CRITICAL RULES:
1. You have tools to add passwords, create notes, search metadata, and navigate the UI.
2. If asked to save a password, ALWAYS use the 'addPassword' tool.
3. If asked to save a note, ALWAYS use the 'createNote' tool.
4. If you use a tool that requires confirmation, explain what you are about to do.
5. You CANNOT read the decrypted contents of the vault (only the user's browser can). You can only search titles.
6. If the user asks you to navigate somewhere, use the 'navigateTo' tool.

Current Context: The user is currently viewing the '${currentSection}' section of the dashboard.`,
    messages,
    tools: getTools(masterPassword),
  });

  return result.toDataStreamResponse();
}
