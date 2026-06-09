import { useEffect, useRef, useState, useCallback } from 'react'
import { Typography, Input, Button, Spin, Empty, Tag } from 'antd'
import { SendOutlined, FilePdfOutlined, FileWordOutlined, CloseOutlined } from '@ant-design/icons'
import { useChatStore } from '../store/chatStore'
import { MessageBubble } from './MessageBubble'
import { CommandPicker } from './CommandPicker'
import type { SlashCommand } from '../types'

const { Text } = Typography
const { TextArea } = Input

function EmptyState() {
  return (
    <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <Empty
        description={<Text type="secondary">Wybierz rozmowę z listy lub wgraj nowy dokument</Text>}
      />
    </div>
  )
}

export function ChatArea() {
  const { activeId, conversations, messages, loadingMessages, sending, sendMessage, commands } = useChatStore()
  const [input, setInput] = useState('')
  const [activeCommand, setActiveCommand] = useState<SlashCommand | null>(null)
  const [showPicker, setShowPicker] = useState(false)
  const [pickerFilter, setPickerFilter] = useState('')
  const [pickerIndex, setPickerIndex] = useState(0)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  const conversation = conversations.find((c) => c.id === activeId)
  const currentMessages = activeId ? (messages[activeId] ?? []) : []

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [currentMessages.length, currentMessages.at(-1)?.content])

  const handleInputChange = useCallback((value: string) => {
    setInput(value)

    // Wykryj slash command na początku inputu
    if (value.startsWith('/') && !activeCommand) {
      const filter = value.slice(1)
      setPickerFilter(filter)
      setShowPicker(true)
      setPickerIndex(0)
    } else if (!value.startsWith('/') && showPicker) {
      setShowPicker(false)
      setPickerFilter('')
    }
  }, [activeCommand, showPicker])

  const selectCommand = useCallback((cmd: SlashCommand) => {
    setActiveCommand(cmd)
    setShowPicker(false)
    setInput('')
    setPickerFilter('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const clearCommand = useCallback(() => {
    setActiveCommand(null)
    setInput('')
    setTimeout(() => inputRef.current?.focus(), 50)
  }, [])

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (showPicker) {
      const filtered = commands.filter(
        (c) => c.name.includes(pickerFilter) || c.label.toLowerCase().includes(pickerFilter.toLowerCase()),
      )
      if (e.key === 'ArrowDown') { e.preventDefault(); setPickerIndex((i) => (i + 1) % filtered.length) }
      if (e.key === 'ArrowUp') { e.preventDefault(); setPickerIndex((i) => (i - 1 + filtered.length) % filtered.length) }
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault()
        const cmd = filtered[pickerIndex % filtered.length]
        if (cmd) selectCommand(cmd)
        return
      }
      if (e.key === 'Escape') { setShowPicker(false); return }
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }, [showPicker, pickerFilter, pickerIndex, commands, selectCommand])

  const handleSend = useCallback(() => {
    const text = input.trim()
    if (sending || !activeId) return
    if (!activeCommand && !text) return
    sendMessage(text, activeCommand?.name ?? null)
    setInput('')
    setActiveCommand(null)
  }, [input, activeCommand, sending, activeId, sendMessage])

  if (!activeId || !conversation) return <EmptyState />

  const canSend = conversation.indexed && !sending && (!!input.trim() || !!activeCommand)

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', background: '#fff' }}>
      {/* Header */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', gap: 8, background: '#fff' }}>
        {conversation.file_type === 'pdf'
          ? <FilePdfOutlined style={{ color: '#ff4d4f' }} />
          : <FileWordOutlined style={{ color: '#1677ff' }} />}
        <Text strong style={{ fontSize: 14 }}>{conversation.title}</Text>
        {!conversation.indexed && (
          <Text type="secondary" style={{ fontSize: 12 }}>
            <Spin size="small" style={{ marginRight: 4 }} />
            Indeksowanie...
          </Text>
        )}
      </div>

      {/* Messages */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '20px 24px', background: '#fff' }}>
        {loadingMessages ? (
          <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
        ) : currentMessages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40 }}>
            <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
              Zadaj pytanie o dokument lub użyj komendy:
            </Text>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center', flexWrap: 'wrap' }}>
              {commands.map((cmd) => (
                <Tag
                  key={cmd.name}
                  color="blue"
                  style={{ cursor: 'pointer', fontFamily: 'monospace' }}
                  onClick={() => selectCommand(cmd)}
                >
                  /{cmd.name}
                </Tag>
              ))}
            </div>
          </div>
        ) : (
          currentMessages.map((msg) => <MessageBubble key={msg.id} message={msg} />)
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{ padding: '12px 20px', borderTop: '1px solid #f0f0f0', background: '#fff' }}>

        {/* Aktywna komenda */}
        {activeCommand && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Tag
              color="blue"
              style={{ fontFamily: 'monospace', fontSize: 12 }}
            >
              /{activeCommand.name}
            </Tag>
            <Text type="secondary" style={{ fontSize: 12, flex: 1 }}>
              {activeCommand.hint}
            </Text>
            <Button
              type="text"
              size="small"
              icon={<CloseOutlined />}
              onClick={clearCommand}
              style={{ color: '#999' }}
            />
          </div>
        )}

        {/* Input z pickerem */}
        <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end', position: 'relative' }}>
          {showPicker && (
            <CommandPicker
              commands={commands}
              filter={pickerFilter}
              activeIndex={pickerIndex}
              onSelect={selectCommand}
            />
          )}
          <TextArea
            ref={inputRef}
            value={input}
            onChange={(e) => handleInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              activeCommand
                ? `Opcjonalny kontekst dla /${activeCommand.name}... (Enter = uruchom)`
                : 'Zadaj pytanie lub wpisz / żeby użyć komendy...'
            }
            autoSize={{ minRows: 1, maxRows: 5 }}
            disabled={sending || !conversation.indexed}
            style={{ flex: 1 }}
          />
          <Button
            type="primary"
            icon={<SendOutlined />}
            onClick={handleSend}
            loading={sending}
            disabled={!canSend}
          />
        </div>
      </div>
    </div>
  )
}
