# PRISM — Tools, MCPs, and Plugins Setup
# Add these to Cursor and Claude Code before the PRISM build starts.
# Last updated: March 2026

---

## CURSOR: TOOLS & MCP — ADD THESE

Go to Cursor Settings → Tools & MCP → paste into the JSON config.
Add these alongside your existing GitHub MCP:

```jsonc
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "YOUR_TOKEN"
      }
    },
    "shadcn": {
      "url": "https://mcp.shadcn.com"
    },
    "magicui": {
      "url": "https://mcp.magicui.design"
    },
    "playwright": {
      "command": "npx",
      "args": ["@playwright/mcp"]
    }
  }
}
```

What each does for PRISM:
- shadcn: Background Agent uses ShadCN components automatically — cards, buttons, inputs,
  dialogs, all pre-styled. Prevents the agent from writing generic UI from scratch.
- magicui: Adds transitions, animations, and motion on top of ShadCN. This is what makes
  PRISM feel alive — animated map pins, smooth card transitions, story ring animations.
- playwright: Lets the agent screenshot prismreason.vercel.app, see what it built,
  and iterate on its own without you being present. Closes the build-test-fix loop.

---

## CLAUDE CODE: PLUGIN — INSTALL THIS FIRST

everything-claude-code by affaan-m — won the Anthropic x Cerebral Valley hackathon Feb 2026.
Battle-tested across 10+ months, 1282 tests, 98% coverage. Includes memory persistence,
token optimization, security scanning, and production-ready hooks/skills/commands.

Install in Claude Code terminal:
```bash
/plugin marketplace add affaan-m/everything-claude-code
/plugin install everything-claude-code@everything-claude-code
```

Or add to settings.json:
```json
{
  "extraKnownMarketplaces": {
    "everything-claude-code": {
      "source": {
        "source": "github",
        "repo": "affaan-m/everything-claude-code"
      }
    }
  },
  "enabledPlugins": {
    "everything-claude-code@everything-claude-code": true
  }
}
```

Run security scan after install:
```bash
npx ecc-agentshield scan
```
This audits CLAUDE.md, MCP configs, hooks, and agent definitions for vulnerabilities.

IMPORTANT: Do not enable all MCPs at once after installing — each tool description
consumes tokens from the 200k context window, potentially reducing it to ~70k.
Enable only what you need per session.

---

## GITHUB REPOS TO REFERENCE (from transcripts)

These are open source repos worth knowing for the PRISM build. Do not blindly install all —
evaluate each and copy what's relevant into your .cursor/ or .claude/ config:

1. **superpowers** (~28k stars)
   Forces brainstorming, planning, TDD, and code review into every Claude Code session.
   Zero config — just drop the CLAUDE.md additions into your project.
   Search: "superpowers claude code github"

2. **CloudMem / claude-mem** (~20k stars)
   Persistent memory for Claude Code. Captures everything from every session and
   automatically injects it into new sessions. Solves the "lost context between sessions"
   problem for the PRISM long-running build.
   Search: "cloudmem persistent memory claude code github"

3. **awesome-claude-code** (~20k stars)
   Master directory of every Claude Code skill, tool, hook, and plugin worth knowing.
   Use as a reference — don't install everything.
   Search: "awesome-claude-code github"

4. **UI UX Pro Max skill** (~16k stars)
   50 professional design systems injected directly into Claude Code.
   Useful for making PRISM's UI look production-grade, not AI-generated.
   Search: "ui ux pro max skill claude code github"

---

## DESIGN RESOURCES FOR PRISM UI

**21st.dev**
Library of copy-paste UI components for stunning interfaces.
Use when ShadCN + MagicUI don't have what you need.
Especially useful for: globe animations, 3D scroll effects, Apple-style motion.
URL: 21st.dev

Workflow for PRISM landing page (prismreason.vercel.app):
1. Find a component on 21st.dev you want
2. Copy the prompt it provides
3. Paste that prompt to Claude Code → it builds it into the page

**Banana (image gen for landing page design)**
Generate a mockup image of what you want the landing page to look like.
Iterate on the image until it looks right.
Then give the image to Claude Code / Cursor as a design reference.
The agent builds toward the image rather than guessing.

**screenshot-to-code (GitHub repo)**
If you find a website design you want to reference:
1. Screenshot it
2. Run through screenshot-to-code
3. Get a code base to customize from
Search: "screenshot to code github"

---

## POSTHOG SETUP FOR PRISM

PostHog is free and takes 20 minutes to set up.
Install on prismreason.vercel.app BEFORE the full rebuild goes live.

Install:
```bash
cd /web
npm install posthog-js
```

Add to Next.js layout:
```typescript
// /web/app/providers.tsx
'use client'
import posthog from 'posthog-js'
import { PostHogProvider } from 'posthog-js/react'
import { useEffect } from 'react'

export function PHProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      capture_pageview: false
    })
  }, [])
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>
}
```

Once PostHog is live, you can ask Claude in a Cowork session:
"Go to my PostHog dashboard and tell me where people are leaving the PRISM landing page"
"Which version of the landing page is performing better?"

And eventually set up a Cowork scheduled task:
"Every Monday, review PRISM's PostHog analytics and update the landing page based on
where users are dropping off. Use the design spec in /docs/PRISM_DESIGN_SPEC.md."

---

## BORIS CHERNY (CLAUDE CODE CREATOR) TIPS — APPLY THESE

From the thread by @bcherny (creator of Claude Code):

1. Run 3-5 Claude Code sessions in parallel via git worktrees once scaffold is done.
   One session per feature area: web/mobile/supabase/tests/docs

2. Start every complex task in plan mode. Invest in the plan so Claude 1-shots the build.
   Have one Claude write the plan, spin up a second Claude to review it as a staff engineer.

3. After every correction, end with:
   "Update your CLAUDE.md so you don't make that mistake again."
   Claude writes rules for itself. Error rate measurably drops over time.

4. Build a /techdebt slash command and run at end of every session to find duplicated code.

5. Append "use subagents" to any complex request where you want more compute thrown at it.

6. Enable Explanatory output in /config so Claude explains the WHY behind its changes.
   You learn the codebase while it builds.

7. Use voice dictation for prompts — you speak 3x faster, prompts get more detailed.

---

## CLAUDE MAX — WHAT YOU NOW HAVE ACCESS TO

With Claude Max $100/month:
- Cowork: desktop scheduled tasks, Apify integration, file access, browser automation
- Claude Code: full quota, Agent Teams (parallel builds), Remote Control via phone
- Opus 4.6: available for complex architecture decisions (use manually, not as default)
- Claude in Chrome: browser agent using your logged-in sessions

Default model for routine tasks: claude-sonnet-4-6 (fast, capable, cost-efficient)
Use Opus 4.6 only for: architecture decisions, complex debugging, high-stakes prompts

---
