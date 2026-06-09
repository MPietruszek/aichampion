import { useState, useEffect } from 'react'
import { Button, Typography, Spin, Dropdown, Input, Tooltip, Avatar } from 'antd'
import {
  PlusOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  DeleteOutlined,
  EditOutlined,
  LoadingOutlined,
  EllipsisOutlined,
  LogoutOutlined,
} from '@ant-design/icons'
import { useChatStore } from '../store/chatStore'
import { useAuthStore } from '../store/authStore'
import { UploadModal } from './UploadModal'
import type { Conversation } from '../types'

const { Text } = Typography

function groupByDate(convs: Conversation[]) {
  const today = new Date().toDateString()
  const yesterday = new Date(Date.now() - 86400000).toDateString()
  const groups: Record<string, Conversation[]> = { Dziś: [], Wcześniej: [] }

  for (const c of convs) {
    const d = new Date(c.created_at).toDateString()
    if (d === today) groups['Dziś'].push(c)
    else if (d === yesterday) groups['Wczoraj'] = [...(groups['Wczoraj'] ?? []), c]
    else groups['Wcześniej'].push(c)
  }

  return Object.entries(groups).filter(([, v]) => v.length > 0)
}

function ConversationItem({ conv }: { conv: Conversation }) {
  const { activeId, setActive, renameConversation, deleteConversation } = useChatStore()
  const [editing, setEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(conv.title)
  const isActive = activeId === conv.id

  const handleRename = () => {
    if (editTitle.trim() && editTitle !== conv.title) {
      renameConversation(conv.id, editTitle.trim())
    }
    setEditing(false)
  }

  return (
    <div
      onClick={() => !editing && setActive(conv.id)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '8px 12px',
        borderRadius: 8,
        cursor: 'pointer',
        background: isActive ? '#e6f4ff' : 'transparent',
        transition: 'background 0.15s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = '#f5f5f5'
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent'
      }}
    >
      {conv.file_type === 'pdf'
        ? <FilePdfOutlined style={{ color: '#ff4d4f', flexShrink: 0 }} />
        : <FileWordOutlined style={{ color: '#1677ff', flexShrink: 0 }} />}

      {editing ? (
        <Input
          size="small"
          value={editTitle}
          autoFocus
          onChange={(e) => setEditTitle(e.target.value)}
          onBlur={handleRename}
          onPressEnter={handleRename}
          onClick={(e) => e.stopPropagation()}
          style={{ flex: 1 }}
        />
      ) : (
        <Text
          ellipsis
          style={{ flex: 1, fontSize: 13, color: isActive ? '#1677ff' : 'inherit' }}
        >
          {conv.title}
          {!conv.indexed && (
            <LoadingOutlined style={{ marginLeft: 6, fontSize: 11, color: '#999' }} />
          )}
        </Text>
      )}

      <Dropdown
        trigger={['click']}
        menu={{
          items: [
            {
              key: 'rename',
              icon: <EditOutlined />,
              label: 'Zmień nazwę',
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation()
                setEditing(true)
              },
            },
            {
              key: 'delete',
              icon: <DeleteOutlined />,
              label: 'Usuń',
              danger: true,
              onClick: ({ domEvent }) => {
                domEvent.stopPropagation()
                deleteConversation(conv.id)
              },
            },
          ],
        }}
      >
        <EllipsisOutlined
          onClick={(e) => e.stopPropagation()}
          style={{ opacity: 0.5, padding: '0 2px' }}
        />
      </Dropdown>
    </div>
  )
}

export function Sidebar() {
  const { conversations, loadConversations, loadingConversations } = useChatStore()
  const { user, logout } = useAuthStore()
  const [uploadOpen, setUploadOpen] = useState(false)

  useEffect(() => { loadConversations() }, [loadConversations])

  return (
    <div
      style={{
        width: 260,
        height: '100vh',
        background: '#fafafa',
        borderRight: '1px solid #f0f0f0',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 8px',
        flexShrink: 0,
      }}
    >
      <div style={{ padding: '0 4px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text strong style={{ fontSize: 15 }}>Czat Umowy</Text>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <Tooltip title={user?.email}>
            <Avatar size={26} style={{ background: '#1677ff', fontSize: 12, cursor: 'default' }}>
              {user?.name?.charAt(0).toUpperCase()}
            </Avatar>
          </Tooltip>
          <Tooltip title="Wyloguj się">
            <Button
              type="text"
              size="small"
              icon={<LogoutOutlined />}
              onClick={logout}
              style={{ color: '#999' }}
            />
          </Tooltip>
        </div>
      </div>

      <Button
        type="primary"
        icon={<PlusOutlined />}
        onClick={() => setUploadOpen(true)}
        block
        style={{ marginBottom: 16 }}
      >
        Nowa rozmowa
      </Button>

      <div style={{ flex: 1, overflowY: 'auto' }}>
        {loadingConversations ? (
          <div style={{ textAlign: 'center', padding: 24 }}>
            <Spin />
          </div>
        ) : conversations.length === 0 ? (
          <Text type="secondary" style={{ fontSize: 12, padding: '0 8px' }}>
            Brak rozmów. Wgraj pierwszy dokument.
          </Text>
        ) : (
          groupByDate(conversations).map(([label, convs]) => (
            <div key={label} style={{ marginBottom: 8 }}>
              <Text
                type="secondary"
                style={{ fontSize: 11, padding: '4px 12px', display: 'block' }}
              >
                {label.toUpperCase()}
              </Text>
              {convs.map((c) => <ConversationItem key={c.id} conv={c} />)}
            </div>
          ))
        )}
      </div>

      <UploadModal open={uploadOpen} onClose={() => setUploadOpen(false)} />
    </div>
  )
}
