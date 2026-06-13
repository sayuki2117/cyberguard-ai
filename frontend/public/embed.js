// ═══════════════════════════════════════════════════════════════
// CyberGuard AI — Embed Widget Script
// Usage: <script src="https://your-app.vercel.app/embed.js" async></script>
// ═══════════════════════════════════════════════════════════════
(function () {
  'use strict'

  const APP_URL = window.CYBERGUARD_URL || 'https://your-app.vercel.app'
  const WIDGET_ID = 'cyberguard-widget'

  if (document.getElementById(WIDGET_ID)) return

  const style = document.createElement('style')
  style.textContent = `
    #cyberguard-btn {
      position: fixed; bottom: 24px; right: 24px;
      width: 60px; height: 60px; border-radius: 50%;
      background: linear-gradient(135deg, #2563eb, #06b6d4);
      border: none; cursor: pointer; z-index: 999999;
      box-shadow: 0 8px 24px rgba(37,99,235,0.45);
      display: flex; align-items: center; justify-content: center;
      font-size: 24px; transition: transform 0.2s, box-shadow 0.2s;
    }
    #cyberguard-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 12px 32px rgba(37,99,235,0.6);
    }
    #cyberguard-btn::after {
      content: '';
      position: absolute; top: 4px; right: 4px;
      width: 12px; height: 12px;
      background: #22c55e; border-radius: 50%;
      border: 2px solid white;
    }
    #cyberguard-frame {
      position: fixed; bottom: 96px; right: 24px;
      width: 400px; height: 620px;
      border-radius: 20px; border: 1px solid #1e3a5f;
      box-shadow: 0 24px 64px rgba(0,0,0,0.6);
      z-index: 999998; overflow: hidden;
      transform-origin: bottom right;
      transform: scale(0.8) translateY(20px);
      opacity: 0; pointer-events: none;
      transition: all 0.25s cubic-bezier(0.34,1.56,0.64,1);
    }
    #cyberguard-frame.open {
      transform: scale(1) translateY(0);
      opacity: 1; pointer-events: all;
    }
    @media (max-width: 480px) {
      #cyberguard-frame { width: calc(100vw - 16px); right: 8px; }
    }
  `
  document.head.appendChild(style)

  const wrapper = document.createElement('div')
  wrapper.id = WIDGET_ID

  const iframe = document.createElement('iframe')
  iframe.id = 'cyberguard-frame'
  iframe.src = `${APP_URL}/chat`
  iframe.title = 'CyberGuard AI'
  iframe.setAttribute('loading', 'lazy')

  const btn = document.createElement('button')
  btn.id = 'cyberguard-btn'
  btn.innerHTML = '🛡️'
  btn.setAttribute('aria-label', 'Open CyberGuard AI')
  btn.setAttribute('aria-expanded', 'false')

  let isOpen = false
  btn.addEventListener('click', () => {
    isOpen = !isOpen
    iframe.classList.toggle('open', isOpen)
    btn.setAttribute('aria-expanded', String(isOpen))
    btn.innerHTML = isOpen ? '✕' : '🛡️'
  })

  wrapper.appendChild(iframe)
  wrapper.appendChild(btn)
  document.body.appendChild(wrapper)
})()
