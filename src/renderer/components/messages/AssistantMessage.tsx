import { useMemo } from 'react';
import Markdown from 'marked-react';
import type { NormalizedMessage } from '../../client/types/message';
import {
  extractTextParts,
  extractReasoningParts,
  extractToolUseParts,
  pairToolsWithResults,
} from './messageHelpers';
import { ToolMessage } from './ToolMessage';

interface AssistantMessageProps {
  message: NormalizedMessage;
  allMessages: NormalizedMessage[];
}

/**
 * AssistantMessage component
 * Handles text, reasoning (thinking), and tool_use content types
 */
export function AssistantMessage({
  message,
  allMessages,
}: AssistantMessageProps) {
  const textParts = extractTextParts(message);
  const reasoningParts = extractReasoningParts(message);
  const toolUseParts = extractToolUseParts(message);

  // Get subsequent messages for tool pairing
  const messageIndex = allMessages.findIndex((m) => m.uuid === message.uuid);
  const subsequentMessages =
    messageIndex >= 0 ? allMessages.slice(messageIndex + 1) : [];

  // Pair tools with results
  const toolPairs = useMemo(
    () =>
      toolUseParts.length > 0
        ? pairToolsWithResults(message, subsequentMessages)
        : [],
    [message, subsequentMessages, toolUseParts.length],
  );

  return (
    <div className="flex justify-start">
      <div
        style={{
          maxWidth: '80%',
          backgroundColor: 'var(--bg-surface)',
          borderRadius: '12px',
          padding: '12px 16px',
        }}
      >
        {/* Header with role and timestamp */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          <span>Assistant</span>
          <span
            style={{
              marginLeft: '8px',
              color: 'var(--text-secondary)',
              fontWeight: 400,
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Reasoning (thinking) parts */}
        {reasoningParts.length > 0 && (
          <div style={{ marginBottom: textParts.length > 0 ? '12px' : '0' }}>
            {reasoningParts.map((part, index) => (
              <div
                key={`reasoning-${message.uuid}-${index}`}
                style={{
                  fontSize: '13px',
                  color: 'var(--text-secondary)',
                  fontStyle: 'italic',
                  backgroundColor: 'var(--bg-primary)',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  borderLeft: '3px solid var(--border-subtle)',
                  marginBottom: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '11px',
                    fontWeight: 600,
                    textTransform: 'uppercase',
                    marginBottom: '4px',
                    opacity: 0.7,
                  }}
                >
                  Thinking
                </div>
                <div style={{ whiteSpace: 'pre-wrap' }}>{part.text}</div>
              </div>
            ))}
          </div>
        )}

        {/* Text parts with markdown rendering */}
        {textParts.length > 0 && (
          <div>
            {textParts.map((part, index) => (
              <MarkdownContent
                key={`text-${message.uuid}-${index}`}
                content={part.text}
              />
            ))}
          </div>
        )}

        {/* Tool use parts with results */}
        {toolPairs.length > 0 && (
          <div style={{ marginTop: textParts.length > 0 ? '12px' : '0' }}>
            {toolPairs.map((pair, index) => (
              <ToolMessage
                key={`tool-${pair.toolUse.id}-${index}`}
                pair={pair}
              />
            ))}
          </div>
        )}

        {/* Empty message fallback */}
        {textParts.length === 0 &&
          reasoningParts.length === 0 &&
          toolPairs.length === 0 && (
            <div
              style={{
                fontSize: '13px',
                color: 'var(--text-secondary)',
                fontStyle: 'italic',
              }}
            >
              (Empty message)
            </div>
          )}
      </div>
    </div>
  );
}

/**
 * MarkdownContent component
 * Renders markdown text using marked-react
 */
function MarkdownContent({ content }: { content: string }) {
  const rendered = useMemo(() => {
    try {
      return content;
    } catch (error) {
      console.error('Failed to parse markdown:', error);
      return content;
    }
  }, [content]);

  return (
    <div
      style={{
        fontSize: '14px',
        lineHeight: '1.6',
        color: 'var(--text-primary)',
      }}
      className="markdown-content"
    >
      <Markdown value={rendered} />
    </div>
  );
}
