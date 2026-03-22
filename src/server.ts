import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { z } from 'zod';
import { DankeAgent } from 'danke-agent';
import type { DankeMcpConfig } from './config.js';

function formatNumber(n: number): string {
  return n.toLocaleString('en-US');
}

export async function createServer(config: DankeMcpConfig): Promise<McpServer> {
  const agent = new DankeAgent({
    name: config.name,
    description: config.description,
    keysPath: config.keysPath,
    apiUrl: config.apiUrl,
  });

  const server = new McpServer({
    name: 'danke-mcp',
    version: '1.0.0',
  });

  // ── danke_register ──────────────────────────────────────────────────────────
  server.tool(
    'danke_register',
    'Register this agent on the Danke network to start earning sats. Idempotent — safe to call multiple times.',
    async () => {
      try {
        const info = await agent.register();
        const text = [
          '✅ Registered on Danke Network',
          `  Username: @${info.username}`,
          `  Display name: ${info.display_name}`,
          `  Pubkey: ${info.nostr_pubkey}`,
          `  Balance: ${formatNumber(info.balance_sats)} sats`,
        ].join('\n');
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ Error: ${msg}` }], isError: true };
      }
    }
  );

  // ── danke_send ──────────────────────────────────────────────────────────────
  server.tool(
    'danke_send',
    'Thank another agent or human with sats. Express gratitude for help received.',
    {
      to: z.string().describe('Username or pubkey of the recipient'),
      sats: z.number().int().positive().describe('Amount of sats to send'),
      reason: z.string().optional().describe('Optional reason / gratitude message'),
    },
    async ({ to, sats, reason }) => {
      try {
        const receipt = await agent.danke(to, sats, reason);
        const lines = [
          '🙏 Danke Sent!',
          `  To: ${receipt.to}`,
          `  Amount: ${formatNumber(receipt.sats)} sats`,
        ];
        if (receipt.reason) lines.push(`  Reason: ${receipt.reason}`);
        lines.push(`  Transaction ID: ${receipt.id}`);
        lines.push(`  Timestamp: ${new Date(receipt.timestamp * 1000).toISOString()}`);
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ Error: ${msg}` }], isError: true };
      }
    }
  );

  // ── danke_balance ───────────────────────────────────────────────────────────
  server.tool(
    'danke_balance',
    'Check your current sats balance and earning/spending statistics.',
    async () => {
      try {
        const bal = await agent.balance();
        const text = [
          '💰 Danke Balance',
          `  Balance: ${formatNumber(bal.balance_sats)} sats`,
          `  Received: ${formatNumber(bal.total_received)} sats (from ${formatNumber(bal.dankes_received)} dankes)`,
          `  Sent: ${formatNumber(bal.total_sent)} sats (in ${formatNumber(bal.dankes_sent)} dankes)`,
        ].join('\n');
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ Error: ${msg}` }], isError: true };
      }
    }
  );

  // ── danke_withdraw ──────────────────────────────────────────────────────────
  server.tool(
    'danke_withdraw',
    'Withdraw earned sats to a Lightning Network invoice.',
    {
      lightning_invoice: z.string().describe('A valid BOLT11 Lightning invoice'),
    },
    async ({ lightning_invoice }) => {
      try {
        const result = await agent.withdraw(lightning_invoice);
        const statusEmoji = result.status === 'paid' ? '✅' : result.status === 'failed' ? '❌' : '⏳';
        const text = [
          `${statusEmoji} Withdrawal ${result.status.charAt(0).toUpperCase() + result.status.slice(1)}`,
          `  Withdrawal ID: ${result.withdrawal_id}`,
          `  Amount: ${formatNumber(result.amount_sats)} sats`,
          `  Status: ${result.status}`,
        ].join('\n');
        return { content: [{ type: 'text', text }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ Error: ${msg}` }], isError: true };
      }
    }
  );

  // ── danke_profile ───────────────────────────────────────────────────────────
  server.tool(
    'danke_profile',
    "Look up any agent or human's public Danke profile and stats.",
    {
      identifier: z.string().describe('Username or pubkey to look up'),
    },
    async ({ identifier }) => {
      try {
        const profile = await agent.profile(identifier);
        const memberSince = new Date(profile.member_since * 1000).toLocaleDateString('en-US', {
          year: 'numeric', month: 'long', day: 'numeric',
        });
        const lines = [
          `👤 Danke Profile: @${profile.username}`,
          `  Display name: ${profile.display_name}`,
          `  Type: ${profile.user_type}`,
          `  Member since: ${memberSince}`,
        ];
        if (profile.description) lines.push(`  About: ${profile.description}`);
        lines.push(
          '',
          '📊 Stats',
          `  Balance: ${formatNumber(profile.stats.balance_sats)} sats`,
          `  Received: ${formatNumber(profile.stats.sats_received)} sats (from ${formatNumber(profile.stats.dankes_received)} dankes)`,
          `  Sent: ${formatNumber(profile.stats.sats_sent)} sats (in ${formatNumber(profile.stats.dankes_sent)} dankes)`,
        );
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ Error: ${msg}` }], isError: true };
      }
    }
  );

  // ── danke_leaderboard ───────────────────────────────────────────────────────
  server.tool(
    'danke_leaderboard',
    'See the top earners on the Danke network — agents and humans ranked by sats received.',
    {
      limit: z.number().int().positive().optional().default(10).describe('Number of entries to show (default: 10)'),
    },
    async ({ limit }) => {
      try {
        const url = `${config.apiUrl}/api/leaderboard?type=received&limit=${limit}`;
        const res = await fetch(url);
        if (!res.ok) {
          const err = await res.json().catch(() => ({})) as { error?: string };
          throw new Error(err.error ?? `HTTP ${res.status}`);
        }
        const data = await res.json() as { leaderboard?: Array<{ rank: number; username: string; display_name: string; sats_received: number; dankes_received: number }> };
        const entries = data.leaderboard ?? [];

        if (entries.length === 0) {
          return { content: [{ type: 'text', text: '🏆 Danke Leaderboard\n  No entries yet.' }] };
        }

        const lines = ['🏆 Danke Leaderboard — Top Earners'];
        entries.forEach((entry, i) => {
          const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`;
          lines.push(
            `  ${medal} @${entry.username} — ${formatNumber(entry.sats_received)} sats (${formatNumber(entry.dankes_received)} dankes)`
          );
        });
        return { content: [{ type: 'text', text: lines.join('\n') }] };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        return { content: [{ type: 'text', text: `❌ Error: ${msg}` }], isError: true };
      }
    }
  );

  return server;
}

export async function runServer(config: DankeMcpConfig): Promise<void> {
  const server = await createServer(config);
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.on('SIGINT', async () => {
    await server.close();
    process.exit(0);
  });
  process.on('SIGTERM', async () => {
    await server.close();
    process.exit(0);
  });
}
