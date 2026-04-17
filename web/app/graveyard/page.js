'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, saveToken } from '@/lib/api';

export default function Graveyard() {
  const [deadPlayers, setDeadPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // 转生 Modal
  const [showRebirth, setShowRebirth] = useState(false);
  const [selectedDead, setSelectedDead] = useState(null);
  const [rebirthMode, setRebirthMode] = useState('select'); // 'select' | 'register'
  const [newUsername, setNewUsername] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newCharacterName, setNewCharacterName] = useState('');
  const [rebirthError, setRebirthError] = useState('');
  const [rebirthLoading, setRebirthLoading] = useState(false);

  useEffect(() => {
    api.getGraveyard()
      .then(data => setDeadPlayers(data.deadPlayers || []))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleSelectDead(player) {
    setSelectedDead(player);
    setRebirthMode('register');
    setRebirthError('');
  }

  async function handleRebirthSubmit(e) {
    e.preventDefault();
    if (!selectedDead) return;
    setRebirthLoading(true);
    setRebirthError('');
    try {
      const result = await api.rebirthInherit({
        inheritedPlayerId: selectedDead.id,
        newUsername,
        newPassword,
        newCharacterName,
      });
      saveToken(result.token);
      setShowRebirth(false);
      setSelectedDead(null);
      setNewUsername('');
      setNewPassword('');
      setNewCharacterName('');
      alert(`因果继承成功！${result.player.characterName} 携 ${result.player.karmaRank} 级因果之力重生！`);
      window.location.href = '/dashboard';
    } catch (err) {
      setRebirthError(err.message);
    } finally {
      setRebirthLoading(false);
    }
  }

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* 弃徒碑横幅 */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(139,32,32,0.08) 0%, transparent 100%)',
        borderBottom: '1px solid rgba(139,32,32,0.2)',
        padding: '3rem 0 2rem',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* 装饰线 */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '160px', height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--zhusha), transparent)',
        }} />

        <div style={{ letterSpacing: '0.3em', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          天机宗 · 外门
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3rem)',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--zhusha-bright)',
          textShadow: '0 0 40px rgba(192,57,43,0.4), 0 2px 8px rgba(0,0,0,0.9)',
          marginBottom: '0.75rem',
        }}>
          弃徒碑
        </h1>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: '480px', margin: '0 auto', lineHeight: 1.7 }}>
          法则无情，大道有痕。生前的因果将由后来者继承
        </p>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <Link href="/" style={{ color: 'var(--text-faint)', textDecoration: 'none', fontSize: '0.85rem' }}>
            ← 返回山门
          </Link>
          {deadPlayers.length > 0 && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              共 <strong style={{ color: 'var(--zhusha-bright)' }}>{deadPlayers.length}</strong> 位弟子陨落
            </div>
          )}
        </div>

        {/* 警告条 */}
        <div style={{
          marginBottom: '2rem',
          padding: '1rem 1.5rem',
          background: 'rgba(139,32,32,0.06)',
          border: '1px solid rgba(139,32,32,0.15)',
          borderRadius: 'var(--radius-sm)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          flexWrap: 'wrap',
        }}>
          <div style={{ width: '4px', height: '24px', background: 'var(--zhusha)', borderRadius: '2px', flexShrink: 0 }} />
          <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
            <strong style={{ color: 'var(--zhusha-bright)' }}>因果继承规则：</strong>
            选择一位陨落弟子，继承其因果等级，以新身份转生修行。陨落者之遗泽，将伴你重入道途。
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.9rem', padding: '4rem' }}>
            碑文读取中...
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--zhusha-bright)', fontSize: '0.9rem', padding: '1rem 1.5rem', background: 'rgba(139,32,32,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,32,32,0.15)', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {!loading && deadPlayers.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.3 }}>　</div>
            <div style={{ color: 'var(--text-faint)', fontSize: '1rem', marginBottom: '0.5rem' }}>碑面尚净</div>
            <div style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>天机宗弟子俱在修行途中，无人陨落</div>
          </div>
        )}

        {/* 弃徒碑列表 */}
        {!loading && deadPlayers.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {deadPlayers.map(p => (
              <div
                key={p.id}
                className="jade-scroll"
                style={{
                  padding: '1.5rem',
                  borderLeft: '3px solid var(--zhusha)',
                  background: 'rgba(139,32,32,0.04)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '1rem', flexWrap: 'wrap' }}>

                  {/* 左侧：基本信息 */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                      <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-jade)', letterSpacing: '0.05em' }}>
                        {p.characterName}
                      </div>
                      <span className="badge badge-zhusha">
                        陨落
                      </span>
                      {p.karmaRank > 0 && (
                        <span className="badge badge-karma">
                          ⚡ 因果 {p.karmaRank} 级
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.5rem' }}>
                      <span>境界：<strong style={{ color: 'var(--text-jade)' }}>{p.level || '凡人'}</strong></span>
                      <span>陨落地：<strong style={{ color: 'var(--text-jade)' }}>{p.location || '未知'}</strong></span>
                      {p.rebirthCount > 0 && (
                        <span>轮回：<strong style={{ color: 'var(--karma-bright)' }}>{p.rebirthCount} 次</strong></span>
                      )}
                    </div>

                    {p.deathNote && (
                      <div style={{ fontSize: '0.82rem', color: 'var(--text-faint)', fontStyle: 'italic', marginTop: '0.4rem', paddingLeft: '0.75rem', borderLeft: '2px solid rgba(139,32,32,0.2)' }}>
                        {p.deathNote}
                      </div>
                    )}
                  </div>

                  {/* 右侧：继承按钮 */}
                  {p.karmaRank > 0 && (
                    <div style={{ flexShrink: 0 }}>
                      <button
                        className="seal-btn seal-btn-karma"
                        style={{ fontSize: '0.82rem', padding: '0.5rem 1.25rem', letterSpacing: '0.08em' }}
                        onClick={() => handleSelectDead(p)}
                      >
                        继承此因果
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* 因果继承说明 */}
        <div style={{
          marginTop: '3rem',
          padding: '1.5rem',
          border: '1px solid rgba(107,79,160,0.12)',
          borderRadius: 'var(--radius-sm)',
          background: 'rgba(107,79,160,0.04)',
        }}>
          <div style={{ fontSize: '0.78rem', color: 'var(--karma-bright)', letterSpacing: '0.1em', marginBottom: '1rem', fontWeight: 600 }}>
            因果继承 · 规则说明
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.625rem' }}>
            {[
              { icon: '壹', text: '陨落弟子若留有因果等级，可被新弟子继承' },
              { icon: '贰', text: '继承者将以新账号、新法号重新入道' },
              { icon: '叁', text: '继承后，因果等级从陨落者转移至新角色，不叠加' },
              { icon: '肆', text: '陨落记录永久刻于弃徒碑，不可磨灭' },
            ].map(({ icon, text }) => (
              <div key={icon} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                <span style={{ color: 'var(--karma)', fontWeight: 700, flexShrink: 0, marginTop: '0.05rem' }}>{icon}.</span>
                {text}
              </div>
            ))}
          </div>
        </div>

        {/* 转生入口 */}
        {!showRebirth && deadPlayers.some(p => p.karmaRank > 0) && (
          <div style={{ marginTop: '2rem', textAlign: 'center' }}>
            <button
              className="zhusha-pulse"
              onClick={() => setShowRebirth(true)}
              style={{
                background: 'transparent',
                outline: 'none',
                color: 'var(--zhusha-bright)',
                border: '1px solid var(--zhusha)',
                padding: '0.875rem 2.5rem',
                borderRadius: 'var(--radius-sm)',
                cursor: 'pointer',
                fontFamily: 'inherit',
                fontWeight: 600,
                fontSize: '1rem',
                letterSpacing: '0.15em',
                transition: 'all var(--transition-base)',
              }}
              onMouseEnter={e => {
                e.currentTarget.style.background = 'rgba(139,32,32,0.08)';
                e.currentTarget.style.borderColor = 'var(--zhusha-bright)';
              }}
              onMouseLeave={e => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.borderColor = 'var(--zhusha)';
              }}
            >
              接受因果 · 开启转生
            </button>
          </div>
        )}
      </div>

      {/* ── 转生 Modal ─────────────────────────────────── */}
      {showRebirth && (
        <div style={{
          position: 'fixed', inset: 0,
          background: 'rgba(0,0,0,0.88)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: '1rem',
        }}
          onClick={(e) => { if (e.target === e.currentTarget) { setShowRebirth(false); setSelectedDead(null); setRebirthMode('select'); setRebirthError(''); } }}
        >
          <div style={{
            background: 'var(--bg-scroll)',
            border: '1px solid rgba(107,79,160,0.25)',
            borderRadius: 'var(--radius-lg)',
            padding: '2.5rem',
            maxWidth: '560px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            position: 'relative',
          }}>
            {/* 顶部装饰线 */}
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '80px', height: '2px', background: 'linear-gradient(90deg, transparent, var(--karma), transparent)' }} />

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem', marginTop: '0.5rem' }}>
              <div>
                <div style={{ fontSize: '0.72rem', color: 'var(--karma)', letterSpacing: '0.15em', marginBottom: '0.4rem' }}>因果转生</div>
                <h2 style={{ color: 'var(--karma-bright)', fontSize: '1.6rem', fontWeight: 700, letterSpacing: '0.08em' }}>
                  继承因果 · 重入道途
                </h2>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.82rem', marginTop: '0.4rem', lineHeight: 1.6 }}>
                  继承陨落者之因果，以新身份重返修行路
                </p>
              </div>
              <button
                onClick={() => { setShowRebirth(false); setSelectedDead(null); setRebirthMode('select'); setRebirthError(''); }}
                style={{
                  background: 'transparent', border: 'none', color: 'var(--text-faint)',
                  fontSize: '1.2rem', cursor: 'pointer', padding: '0.25rem', lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>

            {/* Step 1: 选择陨落者 */}
            {rebirthMode === 'select' ? (
              <div>
                {deadPlayers.filter(p => p.karmaRank > 0).length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-faint)', fontSize: '0.88rem' }}>
                    暂无可继承之因果
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '320px', overflowY: 'auto' }}>
                    {deadPlayers.filter(p => p.karmaRank > 0).map(p => (
                      <div
                        key={p.id}
                        onClick={() => handleSelectDead(p)}
                        style={{
                          padding: '1.25rem',
                          background: selectedDead?.id === p.id ? 'rgba(107,79,160,0.12)' : 'rgba(0,0,0,0.3)',
                          border: `1px solid ${selectedDead?.id === p.id ? 'var(--karma)' : 'rgba(107,79,160,0.15)'}`,
                          borderLeft: `3px solid ${selectedDead?.id === p.id ? 'var(--karma-bright)' : 'var(--zhusha)'}`,
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          transition: 'all var(--transition-fast)',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-jade)' }}>{p.characterName}</div>
                          <span className="badge badge-karma" style={{ fontSize: '0.72rem' }}>⚡ 因果 {p.karmaRank} 级</span>
                        </div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem' }}>
                          {p.level || '凡人'} · {p.location || '未知'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              /* Step 2: 登记新角色 */
              <div>
                {/* 已选陨落者 */}
                {selectedDead && (
                  <div style={{
                    padding: '1rem 1.25rem',
                    background: 'rgba(107,79,160,0.08)',
                    border: '1px solid rgba(107,79,160,0.2)',
                    borderRadius: 'var(--radius-sm)',
                    marginBottom: '1.75rem',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--karma)', marginBottom: '0.2rem', letterSpacing: '0.08em' }}>继承对象</div>
                        <div style={{ fontWeight: 600, color: 'var(--text-jade)', fontSize: '1rem' }}>{selectedDead.characterName}</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                          {selectedDead.level || '凡人'} · {selectedDead.location || '未知'}
                          {selectedDead.karmaRank > 0 && (
                            <span style={{ marginLeft: '0.75rem', color: 'var(--karma-bright)' }}>
                              ⚡ 因果 {selectedDead.karmaRank} 级
                            </span>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => { setSelectedDead(null); setRebirthMode('select'); }}
                        style={{
                          background: 'transparent',
                          border: '1px solid var(--jade-border)',
                          color: 'var(--text-muted)',
                          padding: '0.3rem 0.75rem',
                          borderRadius: 'var(--radius-sm)',
                          cursor: 'pointer',
                          fontFamily: 'inherit',
                          fontSize: '0.78rem',
                        }}
                      >
                        重选
                      </button>
                    </div>
                  </div>
                )}

                {/* 登记表单 */}
                <form onSubmit={handleRebirthSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                      新账号 · 登录令牌
                    </label>
                    <input
                      type="text"
                      value={newUsername}
                      onChange={e => setNewUsername(e.target.value)}
                      className="jade-input"
                      placeholder="设置登录用户名"
                      required
                      minLength={2}
                      autoComplete="username"
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                      新法号
                    </label>
                    <input
                      type="text"
                      value={newCharacterName}
                      onChange={e => setNewCharacterName(e.target.value)}
                      className="jade-input"
                      placeholder="你的新修行名号"
                      required
                      minLength={2}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-muted)', letterSpacing: '0.06em', marginBottom: '0.4rem' }}>
                      通行符篆 · 密码
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={e => setNewPassword(e.target.value)}
                      className="jade-input"
                      placeholder="设置密码（至少6位）"
                      required
                      minLength={6}
                      autoComplete="new-password"
                    />
                  </div>

                  {rebirthError && (
                    <div style={{ color: 'var(--zhusha-bright)', fontSize: '0.82rem', padding: '0.75rem 1rem', background: 'rgba(139,32,32,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,32,32,0.15)' }}>
                      {rebirthError}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={rebirthLoading}
                    className="seal-btn seal-btn-karma"
                    style={{ marginTop: '0.5rem', width: '100%', opacity: rebirthLoading ? 0.6 : 1 }}
                  >
                    {rebirthLoading ? '因果传承中...' : '⚡ 确认因果继承，转生'}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
