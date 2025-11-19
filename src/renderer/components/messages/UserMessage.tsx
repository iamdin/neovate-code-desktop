import type { NormalizedMessage } from '../../client/types/message';
import { getMessageText, extractImageParts } from './messageHelpers';

interface UserMessageProps {
  message: NormalizedMessage;
}

/**
 * UserMessage component
 * Renders user text or image content in a right-aligned blue bubble
 */
export function UserMessage({ message }: UserMessageProps) {
  const textContent = getMessageText(message);
  const imageParts = extractImageParts(message);

  return (
    <div className="flex justify-end">
      <div
        style={{
          maxWidth: '80%',
          backgroundColor: '#0070f3',
          color: 'white',
          borderRadius: '12px',
          padding: '12px 16px',
        }}
      >
        {/* Header with role and timestamp */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginBottom: textContent || imageParts.length > 0 ? '8px' : '0',
            fontSize: '12px',
            fontWeight: 600,
          }}
        >
          <span>You</span>
          <span
            style={{
              marginLeft: '8px',
              opacity: 0.7,
              fontWeight: 400,
            }}
          >
            {new Date(message.timestamp).toLocaleTimeString([], {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </span>
        </div>

        {/* Text content */}
        {textContent && (
          <div
            style={{
              fontSize: '14px',
              lineHeight: '1.5',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-word',
            }}
          >
            {textContent}
          </div>
        )}

        {/* Image content */}
        {imageParts.length > 0 && (
          <div style={{ marginTop: textContent ? '12px' : '0' }}>
            {imageParts.map((imagePart, index) => (
              <div key={index} style={{ marginBottom: '8px' }}>
                <img
                  src={`data:${imagePart.mimeType};base64,${imagePart.data}`}
                  alt={`User uploaded image ${index + 1}`}
                  style={{
                    maxWidth: '100%',
                    borderRadius: '8px',
                    display: 'block',
                  }}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
