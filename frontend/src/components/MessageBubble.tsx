import { Typography, Tag, Tooltip } from 'antd'
import { FileTextOutlined } from '@ant-design/icons'
import type { Message } from '../types'

const { Text, Paragraph } = Typography

interface Props {
  message: Message
}

export function MessageBubble({ message }: Props) {
  const isUser = message.role === 'user'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isUser ? 'flex-end' : 'flex-start',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          maxWidth: '75%',
          background: isUser ? '#1677ff' : '#f5f5f5',
          color: isUser ? '#fff' : 'inherit',
          borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
          padding: '10px 14px',
        }}
      >
        <Paragraph
          style={{ margin: 0, color: isUser ? '#fff' : 'inherit', whiteSpace: 'pre-wrap' }}
        >
          {message.content || <span style={{ opacity: 0.4 }}>▍</span>}
        </Paragraph>
      </div>

      {message.sources && message.sources.length > 0 && (
        <div style={{ marginTop: 6, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {message.sources.map((src, i) => (
            <Tooltip key={i} title={src.text} placement="top">
              <Tag icon={<FileTextOutlined />} color="blue" style={{ cursor: 'default' }}>
                {src.paragraph}{src.title ? ` — ${src.title}` : ''}
              </Tag>
            </Tooltip>
          ))}
        </div>
      )}

      <Text
        type="secondary"
        style={{ fontSize: 11, marginTop: 4 }}
      >
        {new Date(message.created_at).toLocaleTimeString('pl-PL', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </div>
  )
}
