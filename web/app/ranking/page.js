'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { api, isLoggedIn } from '@/lib/api';

const ELIM_ZONE = 10; // 淘汰区：末位10名

// 境界中文标签
const REALM_SHORT = {
  '凡人': '凡人',
  '蛰渊境初期': '蛰初',
  '蛰渊境中期': '蛰中',
  '蛰渊境后期': '蛰后',
  '蛰渊境巅峰': '蛰巅',
  '汲泉境初期': '汲初',
  '汲泉境中期': '汲中',
  '汲泉境后期': '汲后',
  '汲泉境巅峰': '汲巅',
};

export default function Ranking() {
  const [ranking, setRanking] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isPlayer, setIsPlayer] = useState(false);
  const [myRank, setMyRank] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);

  useEffect(() => {
    setIsPlayer(isLoggedIn());
    api.getRanking()
      .then(data => {
        const list = data.ranking || [];
        setRanking(list);
        // 找自己
        const me = list.find(p => p.isMe);
        if (me) setMyRank(me.rank);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  function handleCharacterClick(playerName) {
    setShowModal(true);
    setSelectedCharacter(null);
    setModalLoading(true);
    api.getCharacter(playerName)
      .then(data => setSelectedCharacter(data.character))
      .catch(() => setSelectedCharacter(null))
      .finally(() => setModalLoading(false));
  }

  function closeModal() {
    setShowModal(false);
    setSelectedCharacter(null);
  }

  // Top 3 + normal + eliminated
  const top3 = ranking.filter(p => p.rank <= 3);
  const rest = ranking.filter(p => p.rank > 3);
  const elimZoneStart = Math.max(1, ranking.length - ELIM_ZONE + 1);

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>
      {/* 山门横幅 */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--jade-border)',
        padding: '2.5rem 0 1.5rem',
        textAlign: 'center',
      }}>
        <div style={{ letterSpacing: '0.3em', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '0.75rem' }}>
          天机宗 · 外门
        </div>
        <h1 style={{
          fontSize: 'clamp(1.8rem, 5vw, 2.8rem)',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--gold-primary)',
          textShadow: '0 0 40px rgba(201,168,76,0.35), 0 2px 8px rgba(0,0,0,0.9)',
          marginBottom: '0.5rem',
        }}>
          外门大比
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
          本月榜单公示 · 末位十名将被逐出宗门
        </p>
      </div>

      <div className="container" style={{ paddingTop: '2.5rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <button
            onClick={() => window.history.back()}
            style={{ background: 'none', border: 'none', color: 'var(--text-faint)', textDecoration: 'none', fontSize: '0.85rem', cursor: 'pointer', padding: 0 }}
          >
            ← 返回
          </button>
          {myRank && (
            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
              你当前排名：<strong style={{ color: 'var(--gold-bright)' }}>第 {myRank} 名</strong>
            </div>
          )}
        </div>

        {/* 状态概览 */}
        <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
          <div className="jade-scroll" style={{ padding: '1rem 1.5rem', flex: 1, minWidth: '160px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>在册弟子</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--xuanqing-bright)' }}>{ranking.length}</div>
          </div>
          <div className="jade-scroll" style={{ padding: '1rem 1.5rem', flex: 1, minWidth: '160px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>淘汰区</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: 'var(--zhusha-bright)' }}>后{ELIM_ZONE}名</div>
          </div>
          <div className="jade-scroll" style={{ padding: '1rem 1.5rem', flex: 1, minWidth: '160px', textAlign: 'center' }}>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.4rem' }}>淘汰区起始名</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700, color: elimZoneStart <= (myRank || 999) ? 'var(--zhusha-bright)' : 'var(--text-muted)' }}>
              第{elimZoneStart}名
            </div>
          </div>
        </div>

        {loading && (
          <div style={{ textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.9rem', padding: '4rem' }}>
            榜单读取中...
          </div>
        )}

        {error && (
          <div style={{ color: 'var(--zhusha-bright)', fontSize: '0.9rem', padding: '1rem 1.5rem', background: 'rgba(139,32,32,0.08)', borderRadius: 'var(--radius-sm)', border: '1px solid rgba(139,32,32,0.15)', marginBottom: '1.5rem' }}>
            {error}
          </div>
        )}

        {!loading && !error && ranking.length === 0 && (
          <div className="jade-scroll" style={{ padding: '4rem 2rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-faint)', fontSize: '1rem', marginBottom: '0.5rem' }}>榜单尚无记录</div>
            <div style={{ color: 'var(--text-faint)', fontSize: '0.85rem' }}>弟子尚未入道，榜单空悬</div>
          </div>
        )}

        {!loading && !error && ranking.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

            {/* ── Top 3 烫金榜 ─────────────────────────────── */}
            {top3.length > 0 && (
              <div style={{ marginBottom: '1.5rem' }}>
                {/* 榜头装饰 */}
                <div style={{
                  height: '2px',
                  background: 'linear-gradient(90deg, transparent, var(--gold-dim), transparent)',
                  marginBottom: '0.75rem',
                }} />
                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'stretch', flexWrap: 'wrap' }}>
                  {top3.map(p => (
                    <RankCard key={p.id} player={p} top3={true} />
                  ))}
                </div>
                <div style={{
                  height: '1px',
                  background: 'linear-gradient(90deg, transparent, var(--gold-dim), transparent)',
                  marginTop: '0.75rem',
                }} />
              </div>
            )}

            {/* ── 正常排名 ─────────────────────────────────── */}
            {rest.length > 0 && (
              <div className="jade-scroll" style={{ padding: '0', overflow: 'hidden' }}>
                {rest.map((p, i) => {
                  const inElim = p.rank >= elimZoneStart;
                  return (
                    <div
                      key={p.id}
                      className={`rank-row ${inElim ? 'rank-row-elim' : ''}`}
                      style={{ padding: '1rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', minWidth: 0 }}>
                        {/* 排名 */}
                        <div style={{
                          minWidth: '2.75rem',
                          textAlign: 'center',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          color: inElim ? 'var(--zhusha-bright)' : 'var(--text-muted)',
                        }}>
                          {p.rank}
                        </div>
                        {/* 法号 */}
                        <div style={{ minWidth: 0 }}>
                          <div style={{
                            fontWeight: 600,
                            fontSize: '1rem',
                            color: inElim ? 'var(--zhusha-bright)' : 'var(--text-jade)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                          <span
                            onClick={() => handleCharacterClick(p.characterName)}
                            style={{ color: inElim ? 'var(--zhusha-bright)' : 'var(--text-jade)' }}
                          >
                            {p.characterName}
                          </span>
                            {p.characterName === '叶无痕' && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: 'rgba(61,122,110,0.2)', color: 'var(--xuanqing-bright)', padding: '0.1rem 0.4rem', borderRadius: '2px', fontWeight: 400, border: '1px solid rgba(61,122,110,0.3)' }}>
                                主角
                              </span>
                            )}
                            {p.isMe && (
                              <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: 'rgba(201,168,76,0.15)', color: 'var(--gold-bright)', padding: '0.1rem 0.4rem', borderRadius: '2px', fontWeight: 400 }}>
                                我
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginTop: '0.1rem' }}>
                            {p.location || '外门地字区'}
                          </div>
                        </div>
                      </div>

                      {/* 右侧状态 */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                        <span style={{
                          fontSize: '0.78rem',
                          color: inElim ? 'var(--zhusha-bright)' : 'var(--xuanqing-bright)',
                          fontWeight: 600,
                          letterSpacing: '0.03em',
                        }}>
                          {REALM_SHORT[p.level] || p.level || '凡人'}
                        </span>
                        {inElim && (
                          <span className="badge badge-zhusha" style={{ fontSize: '0.72rem' }}>
                            淘汰区
                          </span>
                        )}
                        {p.rank === 1 && (
                          <span className="badge badge-gold" style={{ fontSize: '0.72rem' }}>
                            天眷
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* 淘汰警告 */}
            <div style={{ marginTop: '1rem', padding: '1rem 1.25rem', background: 'rgba(139,32,32,0.06)', border: '1px solid rgba(139,32,32,0.12)', borderRadius: 'var(--radius-sm)', fontSize: '0.82rem', color: 'var(--text-faint)', textAlign: 'center', letterSpacing: '0.03em' }}>
              月末大比结束后，排名 <strong style={{ color: 'var(--zhusha-dim)' }}>第 {elimZoneStart} 名之后</strong> 的弟子将被逐出天机宗
            </div>

          </div>
        )}

        {!isPlayer && (
          <div style={{ marginTop: '2.5rem', textAlign: 'center' }}>
            <div style={{ color: 'var(--text-faint)', fontSize: '0.88rem', marginBottom: '1rem' }}>
              尚未入道？
            </div>
            <Link href="/dashboard" className="seal-btn seal-btn-gold" style={{ display: 'inline-flex', textDecoration: 'none' }}>
              入道受符
            </Link>
          </div>
        )}
      </div>

      {/* ── 角色详情弹窗 ─────────────────────────────── */}
      {showModal && (
        <CharacterModal character={selectedCharacter} loading={modalLoading} onClose={closeModal} />
      )}
    </main>
  );
}

// ── Top 3 烫金卡片 ──────────────────────────────────────
function RankCard({ player, top3, onCharacterClick }) {
  const rankColors = ['#e8c96a', '#b8a070', '#7a6028'];
  const rankBgs = ['rgba(232,201,106,0.08)', 'rgba(184,160,112,0.06)', 'rgba(122,96,40,0.05)'];
  const idx = Math.min(player.rank - 1, 2);

  return (
    <div style={{
      flex: 1,
      minWidth: '180px',
      padding: '1.5rem 1.25rem',
      background: rankBgs[idx],
      border: `1px solid ${rankColors[idx]}30`,
      borderRadius: 'var(--radius-md)',
      borderTop: `2px solid ${rankColors[idx]}`,
      position: 'relative',
      overflow: 'hidden',
    }}>
      {/* 装饰角 */}
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: '40px', height: '40px',
        borderLeft: `1px solid ${rankColors[idx]}20`,
        borderBottom: `1px solid ${rankColors[idx]}20`,
        transform: 'rotate(45deg) translate(15px, -15px)',
      }} />

      {/* 排名 */}
      <div style={{ fontSize: '2rem', fontWeight: 700, color: rankColors[idx], marginBottom: '0.75rem', textShadow: `0 0 20px ${rankColors[idx]}60`, letterSpacing: '0.05em' }}>
        {player.rank === 1 ? '壹' : player.rank === 2 ? '贰' : '叁'}
      </div>

      {/* 法号 */}
      <div style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-jade)', marginBottom: '0.4rem', letterSpacing: '0.05em' }}>
        <span
          onClick={() => onCharacterClick?.(player.characterName)}
          title="查看角色信息"
        >
          {player.characterName}
        </span>
        {player.characterName === '叶无痕' && (
          <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: 'rgba(61,122,110,0.2)', color: 'var(--xuanqing-bright)', padding: '0.1rem 0.35rem', borderRadius: '2px', fontWeight: 400, border: '1px solid rgba(61,122,110,0.3)' }}>
            主角
          </span>
        )}
        {player.isMe && (
          <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', background: 'rgba(201,168,76,0.15)', color: 'var(--gold-bright)', padding: '0.1rem 0.35rem', borderRadius: '2px', fontWeight: 400 }}>
            我
          </span>
        )}
      </div>

      {/* 位置 */}
      <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)', marginBottom: '0.75rem' }}>
        {player.location || '外门地字区'}
      </div>

      {/* 境界 */}
      <div style={{ fontSize: '0.78rem', color: rankColors[idx], fontWeight: 600, letterSpacing: '0.05em' }}>
        {player.level || '凡人'}
      </div>
    </div>
  );
}

// ── 角色详情弹窗 ──────────────────────────────────────
function CharacterModal({ character, loading, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={onClose}
    >
      {/* 遮罩 */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'rgba(0,0,0,0.7)',
        backdropFilter: 'blur(4px)',
      }} />

      {/* 弹窗内容 */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          maxWidth: '480px',
          maxHeight: '80vh',
          overflowY: 'auto',
          background: 'var(--bg-card)',
          border: '1px solid var(--jade-border)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: '0 24px 64px rgba(0,0,0,0.8)',
        }}
        onClick={e => e.stopPropagation()}
      >
        {loading ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-faint)', fontSize: '0.9rem' }}>
            读取命格中...
          </div>
        ) : !character ? (
          <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--zhusha-bright)', fontSize: '0.9rem' }}>
            命格未现，此人信息尚在天机之外
          </div>
        ) : (
          <>
            {/* 头部 */}
            <div style={{
              padding: '1.5rem 1.75rem 1.25rem',
              borderBottom: '1px solid var(--jade-border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}>
              <div>
                <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-jade)', letterSpacing: '0.05em', marginBottom: '0.35rem' }}>
                  {character.name}
                </div>
                {character.role && (
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-faint)' }}>
                    {character.role}
                  </div>
                )}
              </div>
              <button
                onClick={onClose}
                style={{
                  background: 'none',
                  border: '1px solid var(--jade-border)',
                  color: 'var(--text-faint)',
                  cursor: 'pointer',
                  padding: '0.25rem 0.6rem',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem',
                  flexShrink: 0,
                }}
              >
                ✕
              </button>
            </div>

            {/* 详情 */}
            <div style={{ padding: '1.5rem 1.75rem' }}>
              {character.realm && (
                <InfoRow label="境界" value={character.realm} />
              )}
              {character.rank_position && (
                <InfoRow label="外门排名" value={`第 ${character.rank_position} 名`} />
              )}
              {character.faction && (
                <InfoRow label="势力" value={character.faction} />
              )}
              {character.first_chapter && (
                <InfoRow label="首次登场" value={`第${character.first_chapter}章`} />
              )}
              {character.status && (
                <InfoRow label="存亡状态" value={character.status} />
              )}
              {character.novel_info && (
                <div style={{ marginTop: '1rem' }}>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>
                    命格记载
                  </div>
                  <div style={{
                    fontSize: '0.88rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.7,
                    padding: '0.875rem 1rem',
                    background: 'rgba(61,122,110,0.06)',
                    borderRadius: 'var(--radius-sm)',
                    border: '1px solid rgba(61,122,110,0.12)',
                  }}>
                    {character.novel_info}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div style={{ display: 'flex', gap: '1rem', marginBottom: '0.75rem', alignItems: 'baseline' }}>
      <div style={{ fontSize: '0.72rem', color: 'var(--text-faint)', letterSpacing: '0.1em', minWidth: '4rem', flexShrink: 0 }}>
        {label}
      </div>
      <div style={{ fontSize: '0.88rem', color: 'var(--text-primary)' }}>
        {value}
      </div>
    </div>
  );
}
