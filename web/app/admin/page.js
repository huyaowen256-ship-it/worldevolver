'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, saveToken, clearToken } from '@/lib/api';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

const TABS = [
  { id: 'batch', label: '批处理', icon: '玄' },
  { id: 'config', label: '天机规则', icon: '规' },
  { id: 'world', label: '世界态势', icon: '势' },
  { id: 'novel', label: '天机执笔', icon: '笔' },
];

export default function AdminPage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeTab, setActiveTab] = useState('batch');

  const [batchStatus, setBatchStatus] = useState(null);
  const [batchRunning, setBatchRunning] = useState(false);
  const [batchResult, setBatchResult] = useState(null);
  const [commands, setCommands] = useState([]);

  const [configKey, setConfigKey] = useState('worldRules');
  const [configValue, setConfigValue] = useState('');
  const [configSaved, setConfigSaved] = useState(false);
  const [configError, setConfigError] = useState('');

  const [worldState, setWorldState] = useState(null);

  const [chapterPrompt, setChapterPrompt] = useState('');
  const [novelResult, setNovelResult] = useState('');
  const [novelGenerating, setNovelGenerating] = useState(false);
  const [novelError, setNovelError] = useState('');

  const [adminToken, setAdminToken] = useState(null);
  useEffect(() => {
    setAdminToken(localStorage.getItem('token'));
  }, []);

  useEffect(() => {
    if (loggedIn) {
      loadBatchStatus();
      loadCommands();
      loadWorldState();
    }
  }, [loggedIn]);

  useEffect(() => {
    if (activeTab === 'config') loadConfig();
  }, [activeTab, configKey]);

  // ── Auth ─────────────────────────────────────────────────
  async function handleLogin(e) {
    e.preventDefault();
    setLoginError('');
    try {
      const result = await api.adminLogin(password);
      saveToken(result.token);
      setLoggedIn(true);
      loadBatchStatus();
      loadCommands();
      loadWorldState();
    } catch (err) {
      setLoginError(err.message);
    }
  }

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
    setPassword('');
  }

  // ── Batch ─────────────────────────────────────────────────
  async function loadBatchStatus() {
    try {
      const data = await api.adminGetBatchStatus();
      setBatchStatus(data);
    } catch {}
  }

  async function loadCommands() {
    try {
      const data = await api.adminGetCommands();
      setCommands(data.commands || []);
    } catch {}
  }

  async function triggerBatch() {
    if (!confirm('确定手动触发每日批处理？')) return;
    setBatchRunning(true);
    setBatchResult(null);
    try {
      const result = await api.adminTriggerBatch();
      setBatchResult(result.result);
      loadBatchStatus();
      loadCommands();
    } catch (err) {
      setBatchResult({ error: err.message });
    } finally {
      setBatchRunning(false);
    }
  }

  // ── Config ────────────────────────────────────────────────
  async function loadConfig() {
    try {
      const data = await api.adminGetConfig(configKey);
      setConfigValue(data.config?.value ? JSON.stringify(data.config.value, null, 2) : '');
    } catch {
      setConfigValue('');
    }
    setConfigError('');
    setConfigSaved(false);
  }

  async function saveConfig() {
    setConfigError('');
    try {
      const parsed = JSON.parse(configValue);
      await api.adminPutConfig(configKey, parsed);
      setConfigSaved(true);
      setTimeout(() => setConfigSaved(false), 2000);
    } catch (err) {
      setConfigError('JSON 格式错误: ' + err.message);
    }
  }

  // ── World ─────────────────────────────────────────────────
  async function loadWorldState() {
    try {
      const data = await api.adminGetWorldState();
      setWorldState(data.state);
    } catch {}
  }

  // ── Novel ─────────────────────────────────────────────────
  async function generateChapter() {
    if (!chapterPrompt.trim() || !adminToken) return;
    setNovelGenerating(true);
    setNovelError('');
    setNovelResult('');
    try {
      const response = await fetch(`${API_BASE}/api/admin/novel/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${adminToken}`,
        },
        body: JSON.stringify({ prompt: chapterPrompt }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setNovelResult(data.content);
    } catch (err) {
      setNovelError(err.message || '生成失败');
    } finally {
      setNovelGenerating(false);
    }
  }

  // ── Login ─────────────────────────────────────────────────
  if (!loggedIn) {
    return (
      <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
        <div style={{
          background: 'linear-gradient(180deg, rgba(201,168,76,0.05) 0%, transparent 100%)',
          borderBottom: '1px solid var(--jade-border)',
          padding: '3rem 0 2rem',
          textAlign: 'center',
        }}>
          <div style={{ letterSpacing: '0.3em', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            天机宗
          </div>
          <h1 style={{
            fontSize: 'clamp(1.8rem, 5vw, 2.5rem)',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: 'var(--gold-primary)',
            textShadow: '0 0 30px rgba(201,168,76,0.3)',
            marginBottom: '0.5rem',
          }}>
            天机阁
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>作者入口 · 执掌世界演化之机</p>
        </div>

        <div className="container" style={{ paddingTop: '3rem' }}>
          <div style={{ maxWidth: '480px', margin: '0 auto' }}>
            <Link href="/" style={{ color: 'var(--text-faint)', textDecoration: 'none', fontSize: '0.85rem' }}>
              ← 返回山门
            </Link>

            <div className="jade-scroll" style={{ padding: '2rem', marginTop: '1.5rem' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '1.5rem', lineHeight: 1.7 }}>
                此区域仅对执笔者开放。请输入天机令。
              </div>

              <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <input
                  type="password"
                  placeholder="天机令"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="jade-input"
                  required
                  autoComplete="current-password"
                />

                {loginError && (
                  <div style={{ color: 'var(--zhusha-bright)', fontSize: '0.82rem', padding: '0.75rem 1rem', background: 'rgba(139,32,32,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,32,32,0.15)' }}>
                    {loginError}
                  </div>
                )}

                <button type="submit" className="seal-btn seal-btn-gold" style={{ marginTop: '0.5rem', width: '100%' }}>
                  叩天机阁
                </button>
              </form>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── Admin Dashboard ────────────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* 天机阁横幅 */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--jade-border)',
        padding: '2.5rem 0 1.5rem',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ letterSpacing: '0.3em', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                天机宗 · 作者后台
              </div>
              <h1 style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'var(--gold-primary)',
                textShadow: '0 0 30px rgba(201,168,76,0.25)',
                marginBottom: '0.25rem',
              }}>
                天机阁
              </h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem' }}>执掌世界演化之机</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <Link href="/" style={{ color: 'var(--text-faint)', textDecoration: 'none', fontSize: '0.8rem' }}>
                山门
              </Link>
              <button
                onClick={handleLogout}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--jade-border)',
                  color: 'var(--text-muted)',
                  padding: '0.4rem 0.875rem',
                  borderRadius: 'var(--radius-sm)',
                  cursor: 'pointer',
                  fontFamily: 'inherit',
                  fontSize: '0.8rem',
                  letterSpacing: '0.05em',
                }}
              >
                出阁
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2rem' }}>

        {/* Tab 导航 */}
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem', flexWrap: 'wrap' }}>
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: '0.625rem 1.5rem',
                background: activeTab === tab.id ? 'rgba(201,168,76,0.1)' : 'transparent',
                border: `1px solid ${activeTab === tab.id ? 'var(--gold-dim)' : 'var(--jade-border)'}`,
                borderRadius: 'var(--radius-sm)',
                color: activeTab === tab.id ? 'var(--gold-bright)' : 'var(--text-muted)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontSize: '0.88rem',
                fontWeight: 600,
                letterSpacing: '0.08em',
                transition: 'all var(--transition-base)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '20px',
                height: '20px',
                background: activeTab === tab.id ? 'rgba(201,168,76,0.15)' : 'rgba(232,224,208,0.05)',
                border: `1px solid ${activeTab === tab.id ? 'var(--gold-dim)' : 'var(--jade-border)'}`,
                borderRadius: '3px',
                fontSize: '0.72rem',
                color: activeTab === tab.id ? 'var(--gold-bright)' : 'var(--text-faint)',
              }}>
                {tab.icon}
              </span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* ── 批处理 Tab ─────────────────────────────────── */}
        {activeTab === 'batch' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div className="tianji-panel">
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1.25rem', fontWeight: 600 }}>
                每日裁定 · 批处理
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
                {[
                  { label: '上次批处理', value: batchStatus?.lastBatchAt ? new Date(batchStatus.lastBatchAt).toLocaleString('zh-CN') : '从未运行', accent: false },
                  { label: '待处理指令', value: batchStatus?.pendingCommands ?? '—', accent: true },
                  { label: '自动执行', value: '每日 00:00', accent: false },
                ].map(({ label, value, accent }) => (
                  <div key={label} style={{ padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.08em', marginBottom: '0.4rem' }}>{label}</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 600, color: accent ? 'var(--gold-bright)' : 'var(--text-jade)' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', gap: '0.875rem', flexWrap: 'wrap', alignItems: 'center' }}>
                <button
                  onClick={triggerBatch}
                  disabled={batchRunning}
                  className="seal-btn seal-btn-gold"
                  style={{ opacity: batchRunning ? 0.6 : 1 }}
                >
                  {batchRunning ? '裁定运行中...' : '立即触发批处理'}
                </button>
                {batchResult && (
                  <div style={{ padding: '0.75rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {batchResult.error ? (
                      <span style={{ color: 'var(--zhusha-bright)' }}>错误：{batchResult.error}</span>
                    ) : (
                      <span>已裁定 <strong style={{ color: 'var(--gold-bright)' }}>{batchResult.processed}</strong> 条指令</span>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* 指令日志 */}
            <div className="jade-scroll" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem', fontWeight: 600 }}>
                近期弟子指令
              </div>
              {commands.length === 0 ? (
                <div style={{ color: 'var(--text-faint)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem' }}>暂无指令记录</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem', maxHeight: '380px', overflowY: 'auto' }}>
                  {(commands || []).map((item) => {
                    const cmd = item; // item IS the command object from backend
                    const player = item.player;
                    const statusColors = {
                      completed: { bg: 'rgba(61,122,110,0.1)', color: 'var(--xuanqing-bright)', border: 'var(--xuanqing)' },
                      pending: { bg: 'rgba(201,168,76,0.08)', color: 'var(--gold-dim)', border: 'var(--gold-dim)' },
                      failed: { bg: 'rgba(139,32,32,0.08)', color: 'var(--zhusha-bright)', border: 'var(--zhusha)' },
                    };
                    const st = statusColors[cmd?.status] || statusColors.pending;
                    return (
                      <div key={cmd?.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: `2px solid ${st.border}` }}>
                        <div style={{ minWidth: 0 }}>
                          <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-jade)', marginBottom: '0.2rem' }}>
                            {player?.characterName || '未知弟子'}
                          </div>
                          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {cmd?.action_text}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', marginTop: '0.25rem' }}>
                            {cmd?.created_at ? new Date(cmd.created_at).toLocaleString('zh-CN') : ''}
                          </div>
                        </div>
                        <div style={{ padding: '0.2rem 0.625rem', background: st.bg, borderRadius: '2px', fontSize: '0.75rem', color: st.color, fontWeight: 600, whiteSpace: 'nowrap', flexShrink: 0 }}>
                          {cmd.status === 'completed' ? '已裁' : cmd.status === 'pending' ? '待裁' : cmd.status === 'failed' ? '失败' : cmd.status}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 天机规则 Tab ────────────────────────────────── */}
        {activeTab === 'config' && (
          <div className="jade-scroll" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>
              天机规则 · 配置
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              配置项存储于数据库，批处理时 AI 将读取这些规则并执行裁定。修改后下次批处理生效。
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
              {['worldRules', 'mainPlot', 'dungeonConfigs', 'eventThresholds'].map(key => (
                <button
                  key={key}
                  onClick={() => setConfigKey(key)}
                  style={{
                    padding: '0.4rem 1rem',
                    background: configKey === key ? 'rgba(201,168,76,0.1)' : 'transparent',
                    border: `1px solid ${configKey === key ? 'var(--gold-dim)' : 'var(--jade-border)'}`,
                    borderRadius: 'var(--radius-sm)',
                    color: configKey === key ? 'var(--gold-bright)' : 'var(--text-muted)',
                    cursor: 'pointer',
                    fontFamily: 'inherit',
                    fontSize: '0.82rem',
                    fontWeight: configKey === key ? 600 : 400,
                    transition: 'all var(--transition-fast)',
                  }}
                >
                  {key}
                </button>
              ))}
            </div>

            <textarea
              value={configValue}
              onChange={e => { setConfigValue(e.target.value); setConfigError(''); }}
              className="jade-input"
              style={{ height: '280px', fontFamily: "'Courier New', monospace", fontSize: '0.88rem', resize: 'vertical' }}
              placeholder="输入 JSON 配置..."
            />

            <div style={{ display: 'flex', gap: '0.875rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button onClick={saveConfig} className="seal-btn seal-btn-gold" style={{ padding: '0.625rem 1.5rem' }}>
                保存规则
              </button>
              {configSaved && (
                <div style={{ color: 'var(--xuanqing-bright)', fontSize: '0.82rem', padding: '0.4rem 0.875rem', background: 'rgba(61,122,110,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(61,122,110,0.15)' }}>
                  ✓ 规则已保存
                </div>
              )}
              {configError && (
                <div style={{ color: 'var(--zhusha-bright)', fontSize: '0.82rem', padding: '0.4rem 0.875rem', background: 'rgba(139,32,32,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,32,32,0.15)' }}>
                  {configError}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── 世界态势 Tab ───────────────────────────────── */}
        {activeTab === 'world' && (
          <div className="jade-scroll" style={{ padding: '1.5rem' }}>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>
              世界态势 · 快照
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.5rem', lineHeight: 1.7 }}>
              世界态势由 AI 从弟子历史日志自动重建，运行批处理后自动更新。
            </div>
            {worldState && worldState.length > 0 ? (
              <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', lineHeight: 1.9, whiteSpace: 'pre-wrap', fontSize: '0.88rem', color: 'var(--text-muted)', maxHeight: '400px', overflowY: 'auto' }}>
                {worldState.find(s => s.key === 'latest')?.value || JSON.stringify(worldState, null, 2)}
              </div>
            ) : (
              <div style={{ padding: '2rem', background: 'rgba(0,0,0,0.2)', borderRadius: 'var(--radius-sm)', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.88rem' }}>
                暂无世界态势 · 运行一次批处理后生成
              </div>
            )}
          </div>
        )}

        {/* ── 天机执笔 Tab ───────────────────────────────── */}
        {activeTab === 'novel' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            <div className="tianji-panel tianji-panel-karma">
              <div style={{ fontSize: '0.75rem', color: 'var(--karma-bright)', letterSpacing: '0.12em', marginBottom: '0.5rem', fontWeight: 600 }}>
                天机执笔 · AI辅助写作
              </div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem', lineHeight: 1.7 }}>
                基于小说规格与角色状态，使用 AI 生成章节草稿。草稿需审阅后写入{' '}
                <code style={{ color: 'var(--karma-bright)', fontSize: '0.8rem', background: 'rgba(107,79,160,0.08)', padding: '0.1rem 0.4rem', borderRadius: '2px' }}>
                  spec/stories/worldevolver/content/
                </code>
              </div>

              <div style={{ padding: '1rem 1.25rem', background: 'rgba(107,79,160,0.05)', border: '1px solid rgba(107,79,160,0.1)', borderRadius: 'var(--radius-sm)', marginBottom: '1.25rem', fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.7 }}>
                <strong style={{ color: 'var(--karma)' }}>提示：</strong>此工具生成章节草稿。更精细的创作推荐使用{' '}
                <code style={{ color: 'var(--karma-bright)', fontSize: '0.8rem', background: 'rgba(107,79,160,0.08)', padding: '0.1rem 0.35rem', borderRadius: '2px' }}>
                  /novel:write
                </code>
                {' '}命令——它会加载完整的世界观设定与角色状态追踪表，保持风格一致。
              </div>

              <textarea
                value={chapterPrompt}
                onChange={e => setChapterPrompt(e.target.value)}
                className="jade-input"
                style={{ height: '180px', resize: 'vertical', fontSize: '0.9rem' }}
                placeholder={'描述本章要写的内容，如：\n- 叶无痕在外门大比中遭遇林昊，双方展开试探性交锋\n- 揭示荒灵原遗迹入口的线索\n- 穿插天机宗内门弟子的暗中观察...'}
              />

              <div style={{ display: 'flex', gap: '0.875rem', marginTop: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <button
                  onClick={generateChapter}
                  disabled={novelGenerating || !chapterPrompt.trim() || !adminToken}
                  className="seal-btn seal-btn-karma"
                  style={{ opacity: novelGenerating || !adminToken ? 0.6 : 1 }}
                >
                  {novelGenerating ? '执笔中...' : '生成章节草稿'}
                </button>
                {novelError && (
                  <div style={{ color: 'var(--zhusha-bright)', fontSize: '0.82rem' }}>{novelError}</div>
                )}
              </div>

              {novelResult && (
                <div style={{ marginTop: '1.5rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--karma-bright)', letterSpacing: '0.08em', fontWeight: 600 }}>生成结果</div>
                    <button
                      onClick={() => navigator.clipboard.writeText(novelResult)}
                      style={{ background: 'transparent', border: '1px solid var(--jade-border)', color: 'var(--text-muted)', padding: '0.3rem 0.75rem', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.78rem' }}
                    >
                      复制全文
                    </button>
                  </div>
                  <div style={{ padding: '1.5rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', lineHeight: 2, whiteSpace: 'pre-wrap', fontSize: '0.9rem', color: 'var(--text-jade)', border: '1px solid rgba(107,79,160,0.15)' }}>
                    {novelResult}
                  </div>
                </div>
              )}
            </div>

            {/* 参考文件 */}
            <div className="jade-scroll" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.12em', marginBottom: '1rem', fontWeight: 600 }}>
                当前小说文件
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                {[
                  { label: '故事规格', value: 'spec/stories/worldevolver/specification.md' },
                  { label: '创作计划', value: 'spec/stories/worldevolver/creative-plan.md' },
                  { label: '角色状态', value: 'spec/tracking/character-state.json' },
                  { label: '情节追踪', value: 'spec/tracking/plot-tracker.json' },
                  { label: '时间线', value: 'spec/tracking/timeline.json' },
                  { label: '创作宪法', value: '.specify/memory/novel-constitution.md' },
                ].map(({ label, value }) => (
                  <div key={value} style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--jade-border)' }}>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', marginBottom: '0.3rem', letterSpacing: '0.05em' }}>{label}</div>
                    <div style={{ fontSize: '0.78rem', fontFamily: "'Courier New', monospace", color: 'var(--xuanqing-bright)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {value}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
