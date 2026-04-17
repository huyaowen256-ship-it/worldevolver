'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, saveToken, clearToken, isLoggedIn } from '@/lib/api';

// 境界展示映射
const REALM_LABELS = {
  '凡人': '凡人',
  '蛰渊境初期': '蛰渊境 · 初期',
  '蛰渊境中期': '蛰渊境 · 中期',
  '蛰渊境后期': '蛰渊境 · 后期',
  '蛰渊境巅峰': '蛰渊境 · 巅峰',
  '汲泉境初期': '汲泉境 · 初期',
  '汲泉境中期': '汲泉境 · 中期',
  '汲泉境后期': '汲泉境 · 后期',
  '汲泉境巅峰': '汲泉境 · 巅峰',
};

export default function Dashboard() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const [form, setForm] = useState({ username: '', password: '', characterName: '' });
  const [authError, setAuthError] = useState('');

  const [player, setPlayer] = useState(null);
  const [command, setCommand] = useState('');
  const [supplementary, setSupplementary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

  const [todayCmd, setTodayCmd] = useState(null);
  const [todayResult, setTodayResult] = useState(null);
  const [logs, setLogs] = useState([]);
  const [bulletins, setBulletins] = useState([]);
  const [loadingPlayer, setLoadingPlayer] = useState(false);
  const [worldState, setWorldState] = useState({});

  useEffect(() => {
    if (isLoggedIn()) {
      loadPlayer();
    }
  }, []);

  async function loadPlayer() {
    setLoadingPlayer(true);
    try {
      const data = await api.getMe();
      setPlayer(data);
      setLoggedIn(true);
      await Promise.all([loadTodayCommand(), loadLogs(), loadBulletins(), loadWorldState()]);
    } catch {
      clearToken();
      setLoggedIn(false);
    } finally {
      setLoadingPlayer(false);
    }
  }

  async function loadTodayCommand() {
    try {
      const data = await api.getTodayCommand();
      setTodayCmd(data.command);
      setTodayResult(data.result);
      setSubmitSuccess('');
    } catch {}
  }

  async function loadLogs() {
    try {
      const data = await api.getLogs(10);
      setLogs(data.logs || []);
    } catch {}
  }

  async function loadBulletins() {
    try {
      const data = await api.getBulletins(3);
      setBulletins(data.bulletins || []);
    } catch {}
  }

  async function loadWorldState() {
    try {
      const data = await api.adminGetWorldState();
      setWorldState(data || {});
    } catch {}
  }

  async function handleAuth(e) {
    e.preventDefault();
    setAuthError('');
    try {
      let result;
      if (authMode === 'register') {
        result = await api.register(form);
      } else {
        result = await api.login({ username: form.username, password: form.password });
      }
      saveToken(result.token);
      setPlayer(result.player);
      setLoggedIn(true);
      await Promise.all([loadTodayCommand(), loadLogs(), loadBulletins()]);
    } catch (err) {
      setAuthError(err.message);
    }
  }

  async function handleSubmitCommand(e) {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError('');
    setSubmitSuccess('');
    try {
      await api.submitCommand({ actionText: command, supplementaryIntent: supplementary });
      // 保存录入原文用于展示
      setTodayCmd({ actionText: command, supplementaryIntent: supplementary });
      setSubmitSuccess('心诀已录，待子时裁定');
      setCommand('');
      setSupplementary('');
    } catch (err) {
      setSubmitError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleLogout() {
    clearToken();
    setLoggedIn(false);
    setPlayer(null);
    setTodayCmd(null);
    setTodayResult(null);
    setLogs([]);
  }

  // ── 未登录：入道登记 ─────────────────────────────────
  if (!loggedIn) {
    return (
      <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
        {/* 山门横幅 */}
        <div style={{
          background: 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)',
          borderBottom: '1px solid var(--jade-border)',
          padding: '3rem 0 2rem',
          textAlign: 'center',
        }}>
          <div style={{ letterSpacing: '0.3em', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
            天机宗 · 外门
          </div>
          <h1 style={{
            fontSize: 'clamp(2rem, 6vw, 3rem)',
            fontWeight: 700,
            letterSpacing: '0.2em',
            color: 'var(--gold-primary)',
            textShadow: '0 0 40px rgba(201,168,76,0.3), 0 2px 8px rgba(0,0,0,0.9)',
            marginBottom: '0.75rem',
          }}>
            修炼道场
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            踏入修行之路，书写你的因果
          </p>
        </div>

        <div className="container" style={{ paddingTop: '3rem' }}>
          <div style={{ maxWidth: '560px', margin: '0 auto' }}>

            <Link href="/" style={{ color: 'var(--text-faint)', textDecoration: 'none', fontSize: '0.85rem', display: 'inline-block', marginBottom: '2rem' }}>
              ← 返回山门
            </Link>

            <div className="jade-scroll" style={{ padding: '2rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '2rem' }}>
                {['login', 'register'].map(mode => (
                  <button
                    key={mode}
                    onClick={() => { setAuthMode(mode); setAuthError(''); }}
                    style={{
                      flex: 1,
                      padding: '0.75rem',
                      background: authMode === mode ? 'rgba(201,168,76,0.12)' : 'transparent',
                      border: `1px solid ${authMode === mode ? 'var(--gold-dim)' : 'var(--jade-border)'}`,
                      borderRadius: 'var(--radius-sm)',
                      color: authMode === mode ? 'var(--gold-bright)' : 'var(--text-muted)',
                      cursor: 'pointer',
                      fontFamily: 'inherit',
                      fontSize: '0.9rem',
                      letterSpacing: '0.1em',
                      fontWeight: 600,
                      transition: 'all var(--transition-base)',
                    }}
                  >
                    {mode === 'login' ? '登 录' : '入道登记'}
                  </button>
                ))}
              </div>

              <form onSubmit={handleAuth} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    登录令牌
                  </label>
                  <input
                    type="text"
                    placeholder="请输入用户名"
                    value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                    className="jade-input"
                    required
                    autoComplete="username"
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                    通行符篆
                  </label>
                  <input
                    type="password"
                    placeholder="请输入密码"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    className="jade-input"
                    required
                    autoComplete="current-password"
                  />
                </div>

                {authMode === 'register' && (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
                      法号
                    </label>
                    <input
                      type="text"
                      placeholder="你在天机宗的修行名号"
                      value={form.characterName}
                      onChange={e => setForm(f => ({ ...f, characterName: e.target.value }))}
                      className="jade-input"
                      required
                    />
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '0.4rem' }}>
                      法号一旦录入，不可更改，将刻于弃徒碑上
                    </div>
                  </div>
                )}

                {authError && (
                  <div style={{ color: 'var(--zhusha-bright)', fontSize: '0.85rem', padding: '0.75rem 1rem', background: 'rgba(139,32,32,0.1)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,32,32,0.2)' }}>
                    {authError}
                  </div>
                )}

                <button type="submit" className="seal-btn seal-btn-gold" style={{ marginTop: '0.5rem', width: '100%' }}>
                  {authMode === 'login' ? '叩山门' : '入道受符'}
                </button>
              </form>

              {authMode === 'login' && (
                <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '0.8rem', color: 'var(--text-faint)' }}>
                  尚未入道？{' '}
                  <button
                    onClick={() => { setAuthMode('register'); setAuthError(''); }}
                    style={{ background: 'none', border: 'none', color: 'var(--xuanqing-bright)', cursor: 'pointer', fontFamily: 'inherit', fontSize: '0.8rem', textDecoration: 'underline', textDecorationColor: 'var(--xuanqing)' }}
                  >
                    入道登记
                  </button>
                </div>
              )}
            </div>

            {/* 底部说明 */}
            <div style={{ marginTop: '1.5rem', padding: '1.25rem', border: '1px solid rgba(232,224,208,0.06)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', lineHeight: 1.9, letterSpacing: '0.03em' }}>
                <p>外门弟子每日可提交修炼计划</p>
                <p>子时（00:00）统一裁定，结果写入小说正文</p>
                <p>月末大比排名后五位，将被逐出天机宗</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // ── 已登录：修炼道场 ─────────────────────────────────
  return (
    <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* 山门横幅 */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--jade-border)',
        padding: '2.5rem 0 1.5rem',
      }}>
        <div className="container">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ letterSpacing: '0.3em', color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.5rem' }}>
                天机宗 · 外门
              </div>
              <h1 style={{
                fontSize: 'clamp(1.6rem, 4vw, 2.2rem)',
                fontWeight: 700,
                letterSpacing: '0.2em',
                color: 'var(--gold-primary)',
                textShadow: '0 0 30px rgba(201,168,76,0.25)',
                marginBottom: '0.25rem',
              }}>
                修炼道场
              </h1>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
              <button
                onClick={() => window.history.back()}
                style={{ background: 'none', border: 'none', color: 'var(--text-faint)', textDecoration: 'none', fontSize: '0.8rem', cursor: 'pointer', padding: 0 }}
              >
                山门
              </button>
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
                  transition: 'all var(--transition-fast)',
                }}
              >
                出山门
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem' }}>

        {/* 世界状态横幅 */}
        {(worldState.world_event || worldState.world_day || worldState.protagonist_level) && (
          <div style={{
            marginBottom: '2rem',
            padding: '1rem 1.5rem',
            background: 'rgba(201,168,76,0.04)',
            border: '1px solid rgba(201,168,76,0.12)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            flexWrap: 'wrap',
            gap: '1.5rem',
            alignItems: 'center',
          }}>
            {worldState.world_event && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>大比</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--gold-bright)' }}>{worldState.world_event}</div>
              </div>
            )}
            {worldState.world_day && (
              <div style={{ width: '1px', height: '36px', background: 'rgba(232,224,208,0.08)' }} />
            )}
            {worldState.world_day && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>世界日</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--xuanqing-bright)' }}>{worldState.world_day}</div>
              </div>
            )}
            {worldState.protagonist_level && (
              <div style={{ width: '1px', height: '36px', background: 'rgba(232,224,208,0.08)' }} />
            )}
            {worldState.protagonist_level && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>主角</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--xuanqing-bright)' }}>
                  叶无痕 · {worldState.protagonist_level}
                </div>
              </div>
            )}
            {worldState.protagonist_rank && (
              <div style={{ width: '1px', height: '36px', background: 'rgba(232,224,208,0.08)' }} />
            )}
            {worldState.protagonist_rank && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>排名</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--zhusha-bright)' }}>{worldState.protagonist_rank}</div>
              </div>
            )}
            {worldState.pending_threat && (
              <div style={{ width: '1px', height: '36px', background: 'rgba(232,224,208,0.08)' }} />
            )}
            {worldState.pending_threat && (
              <div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.2rem' }}>当前危机</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--zhusha-bright)' }}>{worldState.pending_threat}</div>
              </div>
            )}
          </div>
        )}

        {/* 宗门快道 */}
        <div style={{ marginBottom: '2rem', display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link href="/ranking" style={{ textDecoration: 'none' }}>
            <div className="jade-scroll" style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-jade)', border: '1px solid var(--jade-border)', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition-fast)' }}>
              <span style={{ color: 'var(--gold-dim)', fontWeight: 700 }}>🏆</span> 外门大比
            </div>
          </Link>
          <Link href="/graveyard" style={{ textDecoration: 'none' }}>
            <div className="jade-scroll" style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-jade)', border: '1px solid var(--jade-border)', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition-fast)' }}>
              <span style={{ color: 'var(--zhusha-dim)' }}>🪦</span> 弃徒碑
            </div>
          </Link>
          <Link href="/" style={{ textDecoration: 'none' }}>
            <div className="jade-scroll" style={{ padding: '0.75rem 1.25rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.88rem', color: 'var(--text-muted)', border: '1px solid rgba(232,224,208,0.06)', borderRadius: 'var(--radius-sm)', transition: 'all var(--transition-fast)' }}>
              山门首页
            </div>
          </Link>
        </div>

        {/* 道心镜 / 天机盘状态 */}
        <div className="tianji-panel" style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '1.25rem', fontWeight: 600 }}>
            道心镜 · 当前状态
          </div>

          {loadingPlayer ? (
            <div style={{ color: 'var(--text-faint)', fontSize: '0.9rem', textAlign: 'center', padding: '1rem' }}>
              正在照见道心...
            </div>
          ) : player ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1.25rem' }}>
              {/* 法号 */}
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--gold-dim)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>法号</div>
                <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--gold-bright)', letterSpacing: '0.05em' }}>
                  {player.characterName || '—'}
                </div>
              </div>

              {/* 境界 */}
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--xuanqing)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>境界</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--xuanqing-bright)' }}>
                  {REALM_LABELS[player.level] || player.level || '凡人'}
                </div>
              </div>

              {/* 灵脉 */}
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--karma)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>灵脉</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--karma-bright)' }}>
                  {player.meridianCount ? `${player.meridianCount}脉天赋` : '—'}
                </div>
              </div>

              {/* 因果等级 */}
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--karma)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>因果等级</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: player.karmaRank > 0 ? 'var(--karma-bright)' : 'var(--text-faint)' }}>
                  {player.karmaRank > 0 ? `⚡ ${player.karmaRank} 级` : '—'}
                </div>
              </div>

              {/* 大比排名 */}
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--gold-dim)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>大比排名</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-jade)' }}>
                  {player.rank ? `第 ${player.rank} 名` : '—'}
                </div>
              </div>

              {/* 所在 */}
              <div style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--xuanqing)' }}>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>所在</div>
                <div style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-jade)' }}>
                  {player.location || '外门地字区'}
                </div>
              </div>
            </div>
          ) : null}

          {player?.inheritedFrom && (
            <div style={{ marginTop: '1rem', padding: '0.75rem 1rem', background: 'rgba(107,79,160,0.08)', border: '1px solid rgba(107,79,160,0.2)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--karma-bright)' }}>
              ⚡ 因果继承者，携前世之力重生 · 继承自：{player.inheritedFrom}
            </div>
          )}
        </div>

        {/* 两栏布局 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

          {/* 左栏：心诀录入 + 裁决结果 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* 裁决结果 */}
            {todayResult ? (
              <div className="tianji-panel tianji-panel-karma">
                <div style={{ fontSize: '0.75rem', color: 'var(--karma-bright)', letterSpacing: '0.15em', marginBottom: '1rem', fontWeight: 600 }}>
                  今晨裁定 · 昨夕心诀已决
                </div>
                <div style={{ padding: '1.25rem', background: 'rgba(0,0,0,0.4)', borderRadius: 'var(--radius-sm)', lineHeight: 1.9, fontSize: '0.9rem', color: 'var(--text-jade)', whiteSpace: 'pre-wrap' }}>
                  {todayResult.resultText}
                </div>
                <div style={{ marginTop: '0.875rem', padding: '0.625rem 0.875rem', background: 'rgba(107,79,160,0.06)', borderRadius: 'var(--radius-sm)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  <span style={{ color: 'var(--karma-dim)' }}>心诀：</span>{todayCmd?.actionText}
                </div>
              </div>
            ) : todayCmd ? (
              <div className="tianji-panel">
                <div style={{ fontSize: '0.75rem', color: 'var(--gold-dim)', letterSpacing: '0.15em', marginBottom: '0.875rem', fontWeight: 600 }}>
                  心诀待裁 · 子时将判
                </div>
                <div style={{ padding: '1rem 1.25rem', background: 'rgba(0,0,0,0.35)', borderRadius: 'var(--radius-sm)', borderLeft: '3px solid var(--gold-dim)' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginBottom: '0.5rem', letterSpacing: '0.05em' }}>已录心诀</div>
                  <div style={{ fontSize: '0.92rem', color: 'var(--text-jade)', lineHeight: 1.7 }}>{todayCmd.actionText}</div>
                  {todayCmd.supplementaryIntent && (
                    <div style={{ marginTop: '0.75rem', fontSize: '0.82rem', color: 'var(--text-muted)', paddingTop: '0.5rem', borderTop: '1px solid rgba(232,224,208,0.05)' }}>
                      备注：{todayCmd.supplementaryIntent}
                    </div>
                  )}
                </div>
                <div style={{ marginTop: '0.875rem', fontSize: '0.8rem', color: 'var(--text-faint)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--gold-dim)', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />
                  等待子时裁定中...
                </div>
              </div>
            ) : null}

            {/* 心诀录入 */}
            {!todayCmd && (
              <div className="tianji-panel tianji-panel-karma">
                <div style={{ fontSize: '0.75rem', color: 'var(--karma-bright)', letterSpacing: '0.15em', marginBottom: '0.5rem', fontWeight: 600 }}>
                  心诀录入
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
                  记录今日修炼计划，午夜裁定后纳入世界演化
                </div>
                <form onSubmit={handleSubmitCommand} style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                      今日心诀
                    </label>
                    <textarea
                      className="jade-input"
                      placeholder="如：清晨于外门静室修炼两个时辰，午后前往荒灵原边缘采集灵草..."
                      value={command}
                      onChange={e => setCommand(e.target.value)}
                      style={{ height: '110px', resize: 'none' }}
                      required
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.78rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                      补充意图（可选）
                    </label>
                    <textarea
                      className="jade-input"
                      placeholder="装备、丹药、特殊条件、风险预期等..."
                      value={supplementary}
                      onChange={e => setSupplementary(e.target.value)}
                      style={{ height: '70px', resize: 'none', fontSize: '0.88rem' }}
                    />
                  </div>

                  {submitError && (
                    <div style={{ color: 'var(--zhusha-bright)', fontSize: '0.82rem', padding: '0.625rem 0.875rem', background: 'rgba(139,32,32,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,32,32,0.15)' }}>
                      {submitError}
                    </div>
                  )}
                  {submitSuccess && (
                    <div style={{ color: 'var(--xuanqing-bright)', fontSize: '0.82rem', padding: '0.625rem 0.875rem', background: 'rgba(61,122,110,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(61,122,110,0.15)' }}>
                      {submitSuccess}
                    </div>
                  )}

                  <button type="submit" className="seal-btn seal-btn-karma" disabled={submitting} style={{ alignSelf: 'flex-start' }}>
                    {submitting ? '录入中...' : '录用心诀'}
                  </button>
                </form>
              </div>
            )}

            {/* 个人修炼日志 */}
            <div className="jade-scroll" style={{ padding: '1.5rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.15em', marginBottom: '1rem', fontWeight: 600 }}>
                修炼日志
              </div>
              {logs.length === 0 ? (
                <div style={{ color: 'var(--text-faint)', fontSize: '0.88rem', textAlign: 'center', padding: '1.5rem' }}>
                  道心尚净，尚无记录
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
                  {logs.map((log, i) => (
                    <div key={log.id || i} style={{ padding: '0.875rem 1rem', background: 'rgba(0,0,0,0.3)', borderRadius: 'var(--radius-sm)', borderLeft: '2px solid var(--jade-border)', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                      {log.content}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* 右栏：宗门公告 */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.15em', fontWeight: 600 }}>
                宗门公告
              </div>
              <Link href="/ranking" style={{ fontSize: '0.75rem', color: 'var(--gold-dim)', textDecoration: 'none', letterSpacing: '0.05em' }}>
                排行榜 →
              </Link>
            </div>
            {bulletins.length === 0 ? (
              <div className="jade-scroll" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-faint)', fontSize: '0.88rem' }}>暂无公告</div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bulletins.map(b => (
                  <div key={b.id} className="jade-scroll bulletin-item" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-jade)', fontSize: '0.92rem' }}>
                      {b.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.82rem', lineHeight: 1.6 }}>
                      {b.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 底部说明 */}
            <div style={{ marginTop: '2rem', padding: '1.25rem', border: '1px solid rgba(232,224,208,0.06)', borderRadius: 'var(--radius-sm)', background: 'rgba(0,0,0,0.2)' }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', lineHeight: 1.9, letterSpacing: '0.03em' }}>
                <p>每日 <strong style={{ color: 'var(--gold-dim)' }}>00:00</strong> 进行批处理裁定</p>
                <p style={{ marginTop: '0.25rem' }}>提交修炼计划后，等待裁定结果</p>
                <p style={{ marginTop: '0.25rem' }}>陨落不意味着终结——因果可被继承</p>
              </div>
            </div>
          </div>

        </div>
      </div>

      <style>{`
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(0.7); }
        }
        @media (max-width: 768px) {
          .container > div[style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </main>
  );
}
