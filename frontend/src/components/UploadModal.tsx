import { useState } from 'react'
import { Modal, Upload, Typography, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import { useChatStore } from '../store/chatStore'

const { Dragger } = Upload
const { Text } = Typography

interface Props {
  open: boolean
  onClose: () => void
}

export function UploadModal({ open, onClose }: Props) {
  const [uploading, setUploading] = useState(false)
  const createConversation = useChatStore((s) => s.createConversation)

  const handleFile = async (file: File) => {
    const allowed = ['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type)) {
      message.error('Obsługiwane formaty: PDF, DOCX')
      return false
    }
    if (file.size > 50 * 1024 * 1024) {
      message.error('Maksymalny rozmiar pliku: 50 MB')
      return false
    }
    setUploading(true)
    try {
      await createConversation(file)
      onClose()
      message.success('Dokument zaindeksowany. Możesz zadawać pytania.')
    } catch (e) {
      message.error(e instanceof Error ? e.message : 'Nie udało się wgrać pliku')
    } finally {
      setUploading(false)
    }
    return false
  }

  return (
    <Modal
      title="Nowa rozmowa"
      open={open}
      onCancel={onClose}
      footer={null}
      width={480}
    >
      <Dragger
        accept=".pdf,.docx"
        showUploadList={false}
        beforeUpload={handleFile}
        disabled={uploading}
        style={{ padding: '32px 16px' }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined style={{ fontSize: 48, color: '#1677ff' }} />
        </p>
        <p className="ant-upload-text">Przeciągnij plik lub kliknij aby wybrać</p>
        <p className="ant-upload-hint">
          <Text type="secondary">PDF lub DOCX, max 50 MB</Text>
        </p>
      </Dragger>
      {uploading && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Text type="secondary">Analizuję dokument...</Text>
        </div>
      )}
    </Modal>
  )
}
