import { Component, type ReactNode } from 'react';
import type { MessageRenderProps } from './types';
import { shouldHideMessage, isToolResultMessage } from './messageHelpers';
import { UserMessage } from './UserMessage';
import { AssistantMessage } from './AssistantMessage';

/**
 * Error boundary for message rendering
 */
class MessageErrorBoundary extends Component<
  { children: ReactNode; message: any },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: ReactNode; message: any }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('Message rendering error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            backgroundColor: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid #ef4444',
            borderRadius: '8px',
            padding: '12px',
            color: '#ef4444',
            fontSize: '13px',
          }}
        >
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            Failed to render message
          </div>
          <div style={{ fontSize: '12px', fontFamily: 'monospace' }}>
            Role: {this.props.message.role} | UUID: {this.props.message.uuid}
          </div>
          {this.state.error && (
            <div
              style={{
                marginTop: '8px',
                fontSize: '12px',
                fontFamily: 'monospace',
                opacity: 0.8,
              }}
            >
              {this.state.error.message}
            </div>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

/**
 * Message component (Router)
 * Routes messages to appropriate rendering components based on role and content type
 */
export function Message({ message, allMessages }: MessageRenderProps) {
  // Check if message should be hidden
  if (shouldHideMessage(message)) {
    return null;
  }

  // Hide tool result messages since they're paired with assistant messages
  if (isToolResultMessage(message)) {
    return null;
  }

  return (
    <MessageErrorBoundary message={message}>
      {message.role === 'user' && <UserMessage message={message} />}
      {message.role === 'assistant' && (
        <AssistantMessage message={message} allMessages={allMessages} />
      )}
      {message.role === 'system' && <SystemMessage message={message} />}
    </MessageErrorBoundary>
  );
}

/**
 * SystemMessage component
 * Renders system messages (rarely used, but included for completeness)
 */
function SystemMessage({ message }: { message: any }) {
  const content =
    typeof message.content === 'string'
      ? message.content
      : JSON.stringify(message.content);

  return (
    <div className="flex justify-center">
      <div
        style={{
          maxWidth: '80%',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-subtle)',
          borderRadius: '8px',
          padding: '8px 12px',
          fontSize: '12px',
          color: 'var(--text-secondary)',
          fontStyle: 'italic',
        }}
      >
        <span style={{ fontWeight: 600, marginRight: '8px' }}>System:</span>
        {content}
      </div>
    </div>
  );
}
