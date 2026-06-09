import { useEffect, useRef } from 'react'
import { Typography, Tag } from 'antd'
import { AuditOutlined, SafetyCertificateOutlined, QuestionCircleOutlined, TeamOutlined, FileSearchOutlined } from '@ant-design/icons'
import type { SlashCommand } from '../types'

const { Text } = Typography

const COMMAND_ICONS: Record<string, React.ReactNode> = {
  'dpa-review': <SafetyCertificateOutlined style={{ color: '#52c41a' }} />,
  'ip-clause-review': <AuditOutlined style={{ color: '#1677ff' }} />,
  'is-this-a-problem': <QuestionCircleOutlined style={{ color: '#faad14' }} />,
  'hiring-review': <TeamOutlined style={{ color: '#722ed1' }} />,
  'reg-gap-analysis': <FileSearchOutlined style={{ color: '#f5222d' }} />,
}

interface Props {
  commands: SlashCommand[]
  filter: string
  activeIndex: number
  onSelect: (command: SlashCommand) => void
}

export function CommandPicker({ commands, filter, activeIndex, onSelect }: Props) {
  const filtered = commands.filter(
    (c) =>
      c.name.includes(filter.toLowerCase()) ||
      c.label.toLowerCase().includes(filter.toLowerCase()),
  )

  const activeRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    activeRef.current?.scrollIntoView({ block: 'nearest' })
  }, [activeIndex])

  if (filtered.length === 0) return null

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '100%',
        left: 0,
        right: 0,
        marginBottom: 4,
        background: '#fff',
        border: '1px solid #e8e8e8',
        borderRadius: 8,
        boxShadow: '0 -4px 16px rgba(0,0,0,0.08)',
        maxHeight: 280,
        overflowY: 'auto',
        zIndex: 100,
      }}
    >
      <div style={{ padding: '6px 12px 4px', borderBottom: '1px solid #f0f0f0' }}>
        <Text type="secondary" style={{ fontSize: 11 }}>KOMENDY PRAWNE</Text>
      </div>

      {filtered.map((cmd, i) => {
        const isActive = i === activeIndex % filtered.length
        return (
          <div
            key={cmd.name}
            ref={isActive ? activeRef : undefined}
            onClick={() => onSelect(cmd)}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: 10,
              padding: '10px 14px',
              cursor: 'pointer',
              background: isActive ? '#f0f7ff' : 'transparent',
              transition: 'background 0.1s',
            }}
            onMouseEnter={(e) => {
              if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#fafafa'
            }}
            onMouseLeave={(e) => {
              if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
            }}
          >
            <div style={{ paddingTop: 2 }}>{COMMAND_ICONS[cmd.name]}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <Tag color="blue" style={{ margin: 0, fontFamily: 'monospace', fontSize: 11 }}>
                  /{cmd.name}
                </Tag>
                <Text strong style={{ fontSize: 13 }}>{cmd.label}</Text>
              </div>
              <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 2 }}>
                {cmd.description}
              </Text>
            </div>
          </div>
        )
      })}
    </div>
  )
}
