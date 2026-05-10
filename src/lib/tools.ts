import { tool } from 'ai';
import { z } from 'zod';
import { createClient } from './supabase/server';
import { encryptData, generatePassword } from './crypto';

// Server-side tools need a way to get the master password from the client
// for operations that require encryption. We pass it via headers.

export const getTools = (masterPassword: string | null) => ({
  // === CORE VAULT TOOLS ===
  
  addPassword: tool({
    description: 'Add a new login/password to the vault',
    parameters: z.object({
      title: z.string().describe("Name of the service (e.g. 'Bank of America')"),
      username: z.string().describe("Username or email"),
      password: z.string().describe("Password (if empty, generates one)"),
      url: z.string().optional().describe("URL of the service"),
    }),
    execute: async ({ title, username, password, url }) => {
      if (!masterPassword) return 'Error: Master password required for encryption. Please unlock the vault first.';
      
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'Error: Not authenticated';

      const finalPassword = password || generatePassword(16);
      
      const payload = JSON.stringify({ username, password: finalPassword });
      const { ciphertext, iv, salt } = await encryptData(payload, masterPassword);

      const { error } = await supabase.from('vault_items').insert({
        user_id: user.id,
        type: 'login',
        title,
        encrypted_data: ciphertext,
        iv,
        salt,
        metadata: { url }
      });

      if (error) return `Error saving password: ${error.message}`;
      
      await supabase.from('activity_log').insert({
        user_id: user.id, action: 'AI added password', item_type: 'login', item_title: title
      });

      return `Successfully added password for "${title}".`;
    },
  }),

  createNote: tool({
    description: 'Create a new secure note',
    parameters: z.object({
      title: z.string().describe("Title of the note"),
      content: z.string().describe("Content of the note (supports markdown)"),
    }),
    execute: async ({ title, content }) => {
      if (!masterPassword) return 'Error: Master password required for encryption.';

      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'Error: Not authenticated';

      const { ciphertext, iv, salt } = await encryptData(content, masterPassword);

      const { error } = await supabase.from('vault_items').insert({
        user_id: user.id,
        type: 'note',
        title,
        encrypted_data: ciphertext,
        iv,
        salt,
      });

      if (error) return `Error saving note: ${error.message}`;
      
      await supabase.from('activity_log').insert({
        user_id: user.id, action: 'AI created note', item_type: 'note', item_title: title
      });

      return `Successfully created note "${title}".`;
    },
  }),

  getDashboardStats: tool({
    description: 'Get a quick overview of the vault statistics (number of passwords, notes, files)',
    parameters: z.object({}),
    execute: async () => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'Error: Not authenticated';

      const [passwords, notes, files] = await Promise.all([
        supabase.from('vault_items').select('id', { count: 'exact' }).eq('user_id', user.id).eq('type', 'login'),
        supabase.from('vault_items').select('id', { count: 'exact' }).eq('user_id', user.id).eq('type', 'note'),
        supabase.from('vault_items').select('id', { count: 'exact' }).eq('user_id', user.id).eq('type', 'file'),
      ]);

      return `Vault Stats:
      - Passwords: ${passwords.count || 0}
      - Secure Notes: ${notes.count || 0}
      - Files: ${files.count || 0}`;
    },
  }),

  searchVaultMetadata: tool({
    description: 'Search the vault for item titles (does not decrypt content, only searches titles)',
    parameters: z.object({
      query: z.string().describe("The search term"),
      type: z.enum(['all', 'login', 'note', 'file']).optional().describe("Filter by type"),
    }),
    execute: async ({ query, type }) => {
      const supabase = await createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return 'Error: Not authenticated';

      let queryBuilder = supabase
        .from('vault_items')
        .select('id, title, type, created_at')
        .eq('user_id', user.id)
        .ilike('title', `%${query}%`);

      if (type && type !== 'all') {
        queryBuilder = queryBuilder.eq('type', type);
      }

      const { data, error } = await queryBuilder.limit(10);
      if (error) return `Error searching: ${error.message}`;
      
      if (!data || data.length === 0) return `No items found matching "${query}".`;

      const results = data.map(item => `- ${item.title} (${item.type})`).join('\n');
      return `Found ${data.length} items:\n${results}`;
    },
  }),

  // === HELPER TOOLS ===
  
  generateStrongPassword: tool({
    description: 'Generate a strong random password for the user',
    parameters: z.object({
      length: z.number().optional().describe("Length of password (default 16)"),
    }),
    execute: async ({ length = 16 }) => {
      return `Generated password: ${generatePassword(length)}`;
    },
  }),

  // === UI CONTROL TOOLS (These return instructions for the frontend to handle) ===
  
  navigateTo: tool({
    description: 'Navigate the user to a specific section of the dashboard',
    parameters: z.object({
      section: z.enum(['dashboard', 'passwords', 'notes', 'files', 'settings']),
    }),
    execute: async ({ section }) => {
      return `ACTION_NAVIGATE:${section}`;
    },
  }),

});
