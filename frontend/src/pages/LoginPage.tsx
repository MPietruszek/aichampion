import { useState } from 'react'
import { Form, Input, Button, Typography, Tabs, Alert, Divider } from 'antd'
import { LockOutlined, UserOutlined, FileProtectOutlined } from '@ant-design/icons'
import { useAuthStore } from '../store/authStore'

const { Title, Text } = Typography

export function LoginPage() {
  const { login, register, loading, error } = useAuthStore()
  const [tab, setTab] = useState<'login' | 'register'>('login')

  const handleLogin = async (values: { email: string; password: string }) => {
    try {
      await login(values.email, values.password)
    } catch { /* error w store */ }
  }

  const handleRegister = async (values: { email: string; name: string; password: string }) => {
    try {
      await register(values.email, values.name, values.password)
    } catch { /* error w store */ }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(135deg, #f0f7ff 0%, #e8f4ff 100%)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: '#fff',
        borderRadius: 16,
        padding: '40px 36px',
        boxShadow: '0 8px 40px rgba(0,0,0,0.08)',
      }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <FileProtectOutlined style={{ fontSize: 40, color: '#1677ff', marginBottom: 8 }} />
          <Title level={3} style={{ margin: 0 }}>Czat Umowy</Title>
          <Text type="secondary" style={{ fontSize: 13 }}>
            Analiza dokumentów prawnych z AI
          </Text>
        </div>

        {error && (
          <Alert message={error} type="error" showIcon style={{ marginBottom: 20 }} />
        )}

        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as 'login' | 'register')}
          centered
          items={[
            { key: 'login', label: 'Logowanie' },
            { key: 'register', label: 'Rejestracja' },
          ]}
          style={{ marginBottom: 24 }}
        />

        {tab === 'login' ? (
          <Form layout="vertical" onFinish={handleLogin} requiredMark={false}>
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Podaj login' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="Login" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Podaj hasło' }]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="Hasło" size="large" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                Zaloguj się
              </Button>
            </Form.Item>
          </Form>
        ) : (
          <Form layout="vertical" onFinish={handleRegister} requiredMark={false}>
            <Form.Item
              name="name"
              rules={[{ required: true, message: 'Podaj imię i nazwisko' }]}
            >
              <Input prefix={<UserOutlined style={{ color: '#bbb' }} />} placeholder="Imię i nazwisko" size="large" />
            </Form.Item>
            <Form.Item
              name="email"
              rules={[{ required: true, message: 'Podaj adres e-mail' }, { type: 'email', message: 'Nieprawidłowy e-mail' }]}
            >
              <Input prefix={<MailOutlined style={{ color: '#bbb' }} />} placeholder="Adres e-mail" size="large" />
            </Form.Item>
            <Form.Item
              name="password"
              rules={[
                { required: true, message: 'Podaj hasło' },
                { min: 8, message: 'Hasło musi mieć co najmniej 8 znaków' },
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="Hasło (min. 8 znaków)" size="large" />
            </Form.Item>
            <Form.Item
              name="confirm"
              dependencies={['password']}
              rules={[
                { required: true, message: 'Potwierdź hasło' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) return Promise.resolve()
                    return Promise.reject('Hasła nie są zgodne')
                  },
                }),
              ]}
            >
              <Input.Password prefix={<LockOutlined style={{ color: '#bbb' }} />} placeholder="Powtórz hasło" size="large" />
            </Form.Item>
            <Form.Item style={{ marginBottom: 0 }}>
              <Button type="primary" htmlType="submit" size="large" block loading={loading}>
                Zarejestruj się
              </Button>
            </Form.Item>
          </Form>
        )}

        <Divider />
        <Text type="secondary" style={{ fontSize: 12, display: 'block', textAlign: 'center' }}>
          Wewnętrzne narzędzie — tylko dla pracowników firmy
        </Text>
      </div>
    </div>
  )
}
