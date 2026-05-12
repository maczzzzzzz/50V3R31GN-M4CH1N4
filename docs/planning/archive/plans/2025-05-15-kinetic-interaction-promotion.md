# Kinetic Interaction Promotion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Promote standard UI interactions to high-fidelity Kinetic interactions using the Pretext engine in the Hermes Workspace.

**Architecture:** Replace the standard "New Session" link in the sidebar with a `KineticThoughtStream` component that responds to hover. Add a background `KineticThoughtStream` in the `WorkspaceShell` to render architectural "whispers" at low opacity.

**Tech Stack:** React, Pretext (Canvas-based rendering), Tailwind CSS.

---

### Task 1: Replace "New Chat" button with Kinetic Interaction

**Files:**
- Modify: `dashboard/hermes-workspace/src/screens/chat/components/chat-sidebar.tsx`

- [ ] **Step 1: Import KineticThoughtStream**
Add the following import to `dashboard/hermes-workspace/src/screens/chat/components/chat-sidebar.tsx`:
```tsx
import { KineticThoughtStream } from '@/components/prompt-kit/KineticThoughtStream'
```

- [ ] **Step 2: Replace "New Session" Link content with KineticThoughtStream**
Find the "New Session" button/link and wrap it with hover logic to trigger the "bloom" effect. Since `KineticThoughtStream` renders to canvas, we'll use a state to control the text or presence.

```tsx
// Inside ChatSidebarComponent
const [isNewChatHovered, setIsNewChatHovered] = useState(false);

// ... around line 1050
      {/* ── New Session button ──────────────────────────────────────── */}
      {!isVisuallyCollapsed && (
        <div 
          className="px-2 pb-1"
          onMouseEnter={() => setIsNewChatHovered(true)}
          onMouseLeave={() => setIsNewChatHovered(false)}
        >
          <Link
            to="/chat/$sessionKey"
            params={{ sessionKey: 'new' }}
            onClick={() => {
              onSelectSession?.()
              onCreateSession() // Ensure onCreateSession is called if it's not just navigation
            }}
            className={cn(
              buttonVariants({ variant: 'ghost', size: 'sm' }),
              'w-full justify-start gap-2.5 px-3 py-2 text-primary-900 hover:bg-primary-200 dark:hover:bg-primary-800 relative overflow-hidden',
              isNewSessionActive &&
                'bg-accent-500/10 text-accent-500 hover:bg-accent-50 dark:hover:bg-accent-900/300/15',
            )}
            data-tour="new-session"
          >
            <div className="relative z-10 flex items-center gap-2.5">
              <HugeiconsIcon
                icon={PencilEdit02Icon}
                size={20}
                strokeWidth={1.5}
                className="size-5 shrink-0"
              />
              <span className={cn(isNewChatHovered && "opacity-0")}>New Session</span>
            </div>
            {isNewChatHovered && (
              <div className="absolute inset-0 z-0 flex items-center pl-11">
                <KineticThoughtStream 
                  text="INITIATE_NEW_THOUGHT_STREAM"
                  fontSize={12}
                  className="opacity-80"
                />
              </div>
            )}
          </Link>
        </div>
      )}
```

### Task 2: Materialize persistent Pretext Flow in Shell

**Files:**
- Modify: `dashboard/hermes-workspace/src/components/workspace-shell.tsx`

- [ ] **Step 1: Import KineticThoughtStream**
Add the following import to `dashboard/hermes-workspace/src/components/workspace-shell.tsx`:
```tsx
import { KineticThoughtStream } from '@/components/prompt-kit/KineticThoughtStream'
```

- [ ] **Step 2: Add background whispers**
Insert the `KineticThoughtStream` in the background of `WorkspaceShell`.

```tsx
// Around line 360 in WorkspaceShell.tsx
  return (
    <>
      <div
        className="relative overflow-hidden theme-bg theme-text"
        style={shellStyle}
      >
        <FluidRenderer vorticity={0.4} densityScale={0.8} />
        <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.07] overflow-hidden">
           <KineticThoughtStream 
             text="M4CH1N4_ARTERY_ACTIVE // ZERO_TRUST_LEAD_ARCHITECT // HERMES_CORE_v3 // SYNAPSE_LINK_ESTABLISHED"
             fontSize={14}
             maxWidth={1200}
           />
        </div>
        <PretextHUD 
          nodeStatus={{ 
// ...
```

### Task 3: Verification and Commit

- [ ] **Step 1: Verify build**
Run: `cd dashboard/hermes-workspace && npm run build` (or equivalent if build is complex)
Actually, just check if it compiles: `cd dashboard/hermes-workspace && npx tsc --noEmit`

- [ ] **Step 2: Commit changes**
```bash
git commit -m "feat(visual): promote standard triggers to kinetic interactions"
```
