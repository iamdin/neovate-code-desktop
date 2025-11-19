# WorkspacePanel Auto-Scroll to Latest Message

**Date:** 2025-11-19

## Context

The WorkspacePanel displays chat messages in an AI-based chat application. Currently, when messages are loaded initially or when new messages arrive, there is no automatic scrolling behavior. This leads to poor UX where users may not see the latest messages without manually scrolling down.

The goal is to implement smart auto-scroll behavior that keeps users viewing the latest messages when appropriate, while respecting their ability to scroll up and read message history.

## Discussion

**Scroll Behavior Options:**
Three scroll timing strategies were considered:
- Always scroll to bottom (even when user scrolled up)
- Smart scroll based on user position (selected)
- Only scroll on initial load

The smart scroll approach was chosen to balance automatic scrolling with user control.

**Implementation Approaches:**
Three technical approaches were explored:

1. **useEffect + Ref with Threshold Check** (selected)
   - Use `useRef` for scroll container, `useEffect` to watch messages
   - Check if user is near bottom (within threshold) before scrolling
   - Simple, direct control, ~15 lines of code
   - Low complexity with straightforward React patterns

2. **Intersection Observer API**
   - Use sentinel element and IntersectionObserver
   - More modern API, automatically handles edge cases
   - Higher complexity with cleanup requirements

3. **Scroll Event Listener + State**
   - Track scroll position via event listeners
   - More stateful with potential performance concerns
   - Requires debouncing and state management

The useEffect + Ref approach was selected for its simplicity and direct control.

## Approach

Implement smart auto-scroll in the `WorkspacePanel.Messages` component that:
- Automatically scrolls to bottom on initial message load (0 → N messages)
- Automatically scrolls when user is already near the bottom (within 100px threshold)
- Preserves scroll position when user has scrolled up to read history

This provides optimal UX by keeping users engaged with new messages while respecting their intent to review older messages.

## Architecture

**Component Modified:**
- `WorkspacePanel.Messages` in `src/renderer/components/WorkspacePanel.tsx`

**Implementation Details:**

**Refs:**
- `messagesEndRef = useRef<HTMLDivElement>(null)` - references the scrollable container div
- `prevMessagesLengthRef = useRef(0)` - tracks previous message count for first-load detection

**useEffect Hook:**
Watches the `messages` array and executes scroll logic:
```typescript
useEffect(() => {
  const container = messagesEndRef.current;
  if (!container) return;
  
  const { scrollTop, scrollHeight, clientHeight } = container;
  const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
  const isNearBottom = distanceFromBottom < 100; // 100px threshold
  const isFirstLoad = prevMessagesLengthRef.current === 0 && messages.length > 0;
  
  if (isNearBottom || isFirstLoad) {
    container.scrollTo({ top: scrollHeight, behavior: 'smooth' });
  }
  
  prevMessagesLengthRef.current = messages.length;
}, [messages]);
```

**Key Configuration:**
- **Threshold:** 100px from bottom - allows small scroll-up without breaking auto-scroll
- **Scroll Behavior:** 'smooth' - provides smooth animation (can be changed to 'auto' for instant)
- **Dependency:** `[messages]` - triggers on any message array change

**DOM Changes:**
- Attach `messagesEndRef` to the `<div className="flex-1 overflow-y-auto p-4">` container element

**Edge Cases Handled:**
- First load always scrolls (good UX for initial session open)
- User scrolling up to read history won't be interrupted (distance > 100px)
- Works for both message additions and session switches
- Null check prevents errors if ref isn't attached

**Testing:**
- Manual Test 1: Open a session with messages - should scroll to bottom on load
- Manual Test 2: Scroll up to read old messages, wait for new message - should stay in place
- Manual Test 3: Scroll to near-bottom (within 100px), wait for new message - should auto-scroll
- Manual Test 4: Switch between sessions - each should scroll to bottom on first view

**Performance:**
- No performance concerns - effect only runs on message changes, not on scroll events
- No event listeners needed - uses React's built-in effect system
