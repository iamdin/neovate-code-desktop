# WorkspacePanel Rich Message Rendering

**Date:** 2025-11-19

## Context

The current WorkspacePanel.Messages component renders messages as simple JSON strings, lacking proper formatting and visual distinction between different message types. The goal is to implement a rich message rendering system inspired by the Takumi CLI tool (built with Ink), but adapted for the web-based Electron application.

Key requirements:
1. Support different message types (user, assistant, tool use, tool results, thinking)
2. Integrate markdown rendering using `marked` and `marked-react` libraries
3. Implement diff viewing using the `diff` package's `createTwoFilesPatch` function
4. Structure the implementation across multiple focused component files
5. Follow the existing type system defined in `src/renderer/client/types/message.ts`

## Discussion

### Component Organization
Three approaches were considered for file structure:
- **Minimal split:** Just Message.tsx and MessageUtils.tsx
- **Moderate split:** Logical grouping by message category (User, Assistant, Tool, helpers)
- **Fine-grained split:** Each message type in its own file

**Decision:** Moderate split provides the best balance between organization and maintainability.

### Message State Handling
Options for handling message rendering state:
- **Simple:** Render all messages in a flat list
- **Loading states:** Distinguish completed vs in-progress messages
- **Advanced separation:** Maintain completed/pending split like Takumi for performance

**Decision:** Advanced separation with completed/pending split to optimize performance in long conversations and provide clear visual feedback.

### Tool Pairing Strategy
Approaches for displaying tool use and tool results:
- **Auto-pairing:** Automatically match tool_use with corresponding tool_result and display together
- **Simple sequential:** Render messages in order without pairing logic
- **Hybrid:** Auto-pair in pending, separate in completed

**Decision:** Full auto-pairing like Takumi for cleanest UX across all message states.

### DiffViewer Complexity
Options for diff rendering component:
- **Replicate Takumi:** Full line-by-line with line numbers, gap separators, max height
- **Simplified:** Basic diff with colored additions/removals
- **Enhanced for web:** Takumi style plus syntax highlighting and side-by-side view

**Decision:** Simplified version to start - basic diff with green/red coloring and +/- prefixes, no line numbers.

### Architecture Pattern
Three architectural approaches were evaluated:
- **Helper-Driven:** Heavy use of utility functions, "dumb" components
- **Component-Driven:** Smart components with self-contained logic
- **Hybrid Preprocessing:** Two-phase rendering with render tree abstraction

**Decision:** Helper-Driven Architecture for better testability, clear separation of logic and presentation, and reusable utilities.

## Approach

The solution uses a Helper-Driven Architecture where utility functions handle message transformation and pairing logic, while components focus purely on rendering. This provides:

- **Clear separation:** Logic in `messageHelpers.ts`, presentation in component files
- **Testability:** Pure functions easy to unit test
- **Reusability:** Helper functions can be used elsewhere in the application
- **Maintainability:** Component changes don't affect business logic

The completed/pending message split optimizes performance by preventing re-renders of historical messages while allowing dynamic updates for in-progress conversations.

## Architecture

### File Structure

```
src/renderer/components/
├── messages/
│   ├── Message.tsx              # Main orchestrator/router
│   ├── UserMessage.tsx          # User text/image messages
│   ├── AssistantMessage.tsx     # Assistant text/markdown/thinking
│   ├── ToolMessage.tsx          # Tool use + results together
│   ├── DiffViewer.tsx           # Diff rendering
│   ├── messageHelpers.ts        # Core logic functions
│   └── types.ts                 # Local type definitions
└── WorkspacePanel.tsx           # Updated to use new messages
```

### Core Data Flow

```
WorkspacePanel.Messages
  ↓ (gets messages from store)
  ↓ calls splitMessages(messages)
  ↓ receives { completedMessages, pendingMessages }
  ↓
  ├─→ Render completedMessages (no re-render optimization)
  └─→ Render pendingMessages (dynamic updates)
       ↓
       Message.tsx (router)
         ↓
         ├─→ UserMessage
         ├─→ AssistantMessage
         │     ↓ (if has tool_use parts)
         │     └─→ calls pairToolsWithResults()
         │           ↓
         │           └─→ ToolMessage (paired tool + result)
         └─→ ToolMessage (standalone - hidden if paired)
```

### Helper Functions (messageHelpers.ts)

**splitMessages(messages):**
- Find the last assistant message with tool_use from the end
- Check if all tool_use IDs have corresponding tool_result in subsequent messages
- If all complete: return all as completed
- If incomplete: split at that message (before = completed, from there = pending)
- Returns: `{ completedMessages, pendingMessages }`

**pairToolsWithResults(assistantMsg, subsequentMsgs):**
- Extract all `tool_use` parts from assistant message
- Scan subsequent messages for `tool_result` (supports both `role: 'tool'` and legacy `role: 'user'` formats)
- Build `ToolPair[]` array: `{ toolUse, toolResult? }` (result optional if pending)
- Returns paired structure for rendering

**Additional helpers:**
- `getMessageText(message)` - Extract text content from various message formats
- `isToolResultMessage(message)` - Type guard for tool result messages

### Component Responsibilities

**Message.tsx (Router):**
- Receives: `message: NormalizedMessage`, `allMessages: NormalizedMessage[]`
- Routes based on `message.role` and content type
- Returns appropriate component or null for hidden messages

**UserMessage.tsx:**
- Renders user text or image content
- Right-aligned bubble with blue background
- Uses `getMessageText()` helper for content extraction

**AssistantMessage.tsx:**
- Handles text, reasoning (thinking), and tool_use content types
- **Text parts:** Use `marked` + `marked-react` for markdown rendering
- **Reasoning parts:** Gray italic "thinking" blocks
- **Tool_use parts:** Call `pairToolsWithResults()`, render with ToolMessage
- Left-aligned with "Assistant" label and timestamp

**ToolMessage.tsx:**
- Receives: `ToolPair { toolUse, toolResult? }`
- Renders tool name/description from toolUse
- If toolResult exists, renders result below with indentation
- **Result rendering:**
  - Error: Red error text
  - `diff_viewer` type: Render DiffViewer component
  - Default: Plain text result display
- Uses `createTwoFilesPatch()` for diff generation

**DiffViewer.tsx:**
- Receives: `originalContent`, `newContent`, `filePath`
- Calls `createTwoFilesPatch()` from `diff` package
- Parses diff output into add/remove/context lines
- Simplified view: green for additions (+), red for removals (-), normal for context
- No line numbers initially

### Markdown Integration

```typescript
// In AssistantMessage.tsx
import { Marked } from 'marked';
import { markedReact } from 'marked-react';

const marked = new Marked();
marked.use(markedReact());

const content = marked.parse(textContent);
```

### Special Cases

- **Hidden messages:** Check `message.hidden` flag, return null early
- **Tool messages with role 'tool':** Return null to avoid duplicate rendering (already paired)
- **Empty messages:** Check for empty content, render placeholder
- **Diff content extraction:** Handle both string values and input key references:
  ```typescript
  const value = typeof content === 'string' 
    ? content 
    : input[content.inputKey];
  ```

### Performance & Error Handling

**Performance optimizations:**
- Wrap completed messages in `React.memo()` to prevent re-renders
- Use `useMemo()` for `splitMessages()` and `pairToolsWithResults()` calls
- Cache diff parsing with `useMemo()` based on content
- Use `message.uuid` for stable React keys

**Error handling:**
- Wrap Message components in error boundary
- Fallback UI shows message metadata with "Failed to render" indicator
- Log errors to console for debugging

**Auto-scroll:**
- Preserve existing auto-scroll logic in WorkspacePanel.Messages
- Works with both completed and pending sections
- Smooth scroll for new messages, instant for session switch

**Type safety:**
- Import types from `@/renderer/client/types/message`
- Local types in `messages/types.ts` for ToolPair, RenderProps, etc.
- Strict null checks for optional fields

### Styling Approach

Use inline styles with CSS variables (matching current WorkspacePanel pattern):
- `var(--bg-primary)`, `var(--bg-surface)`, `var(--text-primary)`
- Consistent with existing codebase conventions
- Monospace font for code/diffs
