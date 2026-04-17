'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { api, isLoggedIn } from '@/lib/api';

export default function Home() {
  const [bulletins, setBulletins] = useState([]);
  const [batchStatus, setBatchStatus] = useState(null);
  const [worldState, setWorldState] = useState({});
  const [loggedIn, setLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    Promise.all([
      api.getBulletins(5).catch(() => ({ bulletins: [] })),
      api.adminGetBatchStatus().catch(() => null),
      api.adminGetWorldState().catch(() => ({})),
    ]).then(([bData, bsData, wsData]) => {
      setBulletins(bData.bulletins || []);
      setBatchStatus(bsData);
      setWorldState(wsData || {});
      setLoading(false);
    });
  }, []);

  const todayStr = '天机宗历 · 第壹年 · 叁月 · 拾陆日';

  return (
    <main style={{ minHeight: '100vh', paddingBottom: '4rem' }}>

      {/* ── 山门横幅 ────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(180deg, rgba(201,168,76,0.06) 0%, transparent 100%)',
        borderBottom: '1px solid var(--jade-border)',
        padding: '3rem 0 2rem',
        textAlign: 'center',
        position: 'relative',
      }}>
        {/* 装饰线 */}
        <div style={{
          position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
          width: '200px', height: '2px',
          background: 'linear-gradient(90deg, transparent, var(--gold-primary), transparent)',
        }} />

        <div style={{ letterSpacing: '0.3em', color: 'var(--text-muted)', fontSize: '0.8rem', marginBottom: '1rem' }}>
          {todayStr}
        </div>

        <h1 style={{
          fontSize: 'clamp(2rem, 6vw, 3.5rem)',
          fontWeight: 700,
          letterSpacing: '0.2em',
          color: 'var(--gold-primary)',
          textShadow: '0 0 40px rgba(201,168,76,0.3), 0 2px 8px rgba(0,0,0,0.9)',
          marginBottom: '0.75rem',
        }}>
          天机宗
        </h1>

        <div style={{
          fontSize: 'clamp(1.2rem, 4vw, 2rem)',
          color: 'var(--text-jade)',
          letterSpacing: '0.25em',
          fontWeight: 600,
          marginBottom: '1.5rem',
        }}>
          <span style={{ color: 'var(--gold-dim)' }}>·</span>
          <span style={{ margin: '0 0.5rem', color: 'var(--text-muted)', fontSize: '0.8em' }}>世界演化者</span>
          <span style={{ color: 'var(--gold-dim)' }}>·</span>
        </div>

        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', maxWidth: '560px', margin: '0 auto', lineHeight: 1.8 }}>
          外门弟子生存互动平台 · 每日行动将影响世界演化走向
        </p>
      </div>

      {/* ── 主内容 ──────────────────────────────────── */}
      <div className="container" style={{ paddingTop: '3rem' }}>

        {/* 世界状态栏 */}
        <div className="jade-scroll" style={{ padding: '1.25rem 1.5rem', marginBottom: '2.5rem', display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center' }}>
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>世界状态</div>
            <div style={{ color: 'var(--xuanqing-bright)', fontWeight: 600 }}>
              {batchStatus?.lastBatchAt ? '已裁定' : '待裁定'}
            </div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--jade-border)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>上次批处理</div>
            <div style={{ color: 'var(--text-jade)', fontSize: '0.9rem' }}>
              {batchStatus?.lastBatchAt
                ? new Date(batchStatus.lastBatchAt).toLocaleString('zh-CN')
                : '尚未开始'}
            </div>
          </div>
          <div style={{ width: '1px', height: '40px', background: 'var(--jade-border)' }} />
          <div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', letterSpacing: '0.1em', marginBottom: '0.25rem' }}>待处理指令</div>
            <div style={{ color: batchStatus?.pendingCommands > 0 ? 'var(--gold-bright)' : 'var(--text-muted)', fontWeight: 600 }}>
              {batchStatus?.pendingCommands ?? '—'}
            </div>
          </div>
          <div style={{ marginLeft: 'auto' }}>
            <Link href="/admin" style={{ color: 'var(--text-faint)', textDecoration: 'none', fontSize: '0.8rem', letterSpacing: '0.05em' }}>
              作者入口 →
            </Link>
          </div>
        </div>

        {/* 两栏布局 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: '2rem', alignItems: 'start' }}>

          {/* 左侧：功能入口 */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>

            {/* 弟子令牌区 */}
            <div className="jade-scroll" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.15em', marginBottom: '1.25rem', fontWeight: 600 }}>
                宗门功能
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>

                <Link href="/dashboard" style={{ textDecoration: 'none' }}>
                  <div className="jade-scroll" style={{ padding: '1.25rem 1.5rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-jade)', marginBottom: '0.25rem' }}>
                          修炼道场
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          {loggedIn ? '查看道心状态，提交修炼计划' : '注册/登录，踏入修行之路'}
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>→</div>
                    </div>
                  </div>
                </Link>

                <Link href="/ranking" style={{ textDecoration: 'none' }}>
                  <div className="jade-scroll" style={{ padding: '1.25rem 1.5rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-jade)', marginBottom: '0.25rem' }}>
                          外门大比
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          本月榜单公示，淘汰区警示
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>→</div>
                    </div>
                  </div>
                </Link>

                <Link href="/graveyard" style={{ textDecoration: 'none' }}>
                  <div className="jade-scroll" style={{ padding: '1.25rem 1.5rem', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--zhusha-bright)', marginBottom: '0.25rem' }}>
                          弃徒碑
                        </div>
                        <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                          陨落弟子名录，因果继承转生
                        </div>
                      </div>
                      <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem' }}>→</div>
                    </div>
                  </div>
                </Link>

              </div>
            </div>

            {/* 宗门介绍 */}
            <div className="jade-scroll" style={{ padding: '1.5rem' }}>
              <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.15em', marginBottom: '1rem', fontWeight: 600 }}>
                宗门概况
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.875rem' }}>
                {[
                  { label: '宗名', value: '天机宗', accent: 'gold' },
                  { label: '外门大比', value: worldState.world_event || '待定', accent: 'karma' },
                  { label: '世界进程', value: worldState.world_day || '—', accent: 'jade' },
                  { label: '当前章节', value: `第${(worldState.completed_chapters || '1-5').split('-')[1] || '5'}章完`, accent: 'jade' },
                  { label: '主角处境', value: worldState.pending_threat || '—', accent: worldState.pending_threat ? 'zhusha' : 'jade' },
                ].map(({ label, value, accent }) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0.5rem 0', borderBottom: '1px solid rgba(232,224,208,0.05)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{label}</span>
                    <span style={{
                      color: accent === 'gold' ? 'var(--gold-bright)' : accent === 'karma' ? 'var(--karma-bright)' : accent === 'zhusha' ? 'var(--zhusha-bright)' : 'var(--text-jade)',
                      fontSize: '0.9rem',
                      fontWeight: 600
                    }}>{value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：宗门公告栏 */}
          <div>
            <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', letterSpacing: '0.15em', marginBottom: '1rem', fontWeight: 600 }}>
              宗门公告
            </div>

            {loading ? (
              <div style={{ color: 'var(--text-faint)', fontSize: '0.9rem', padding: '1.5rem', textAlign: 'center' }}>
                加载中...
              </div>
            ) : bulletins.length === 0 ? (
              <div className="jade-scroll" style={{ padding: '1.5rem', textAlign: 'center' }}>
                <div style={{ color: 'var(--text-faint)', fontSize: '0.9rem' }}>
                  暂无公告
                </div>
                <div style={{ color: 'var(--text-faint)', fontSize: '0.8rem', marginTop: '0.5rem' }}>
                  每日批处理后更新
                </div>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {bulletins.map(b => (
                  <div key={b.id} className="jade-scroll bulletin-item" style={{ padding: '1rem 1.25rem' }}>
                    <div style={{ fontWeight: 600, marginBottom: '0.25rem', color: 'var(--text-jade)', fontSize: '0.95rem' }}>
                      {b.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem', lineHeight: 1.6 }}>
                      {b.content}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* 底部说明 */}
            <div style={{
              marginTop: '2rem',
              padding: '1.25rem',
              border: '1px solid rgba(232,224,208,0.06)',
              borderRadius: 'var(--radius-sm)',
              background: 'rgba(0,0,0,0.2)',
            }}>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-faint)', lineHeight: 1.8, letterSpacing: '0.03em' }}>
                <p>每日 <strong style={{ color: 'var(--gold-dim)' }}>00:00</strong> 进行批处理裁定</p>
                <p style={{ marginTop: '0.25rem' }}>提交修炼计划后，等待裁定结果</p>
                <p style={{ marginTop: '0.25rem' }}>陨落不意味着终结——因果可被继承</p>
              </div>
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}
