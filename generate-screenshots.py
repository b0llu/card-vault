#!/usr/bin/env python3
"""
Secure Card Vault — Play Store Screenshot Generator
Generates 18 HTML files (6 per device type) in store-screenshots/.
Run: python3 generate-screenshots.py
"""
import os

ROOT = os.path.dirname(os.path.abspath(__file__))

DEVICES = [
    dict(
        folder='phone',
        w=1080, h=1920,
        fw=630, fh=1370, fr=60,
        iw=602, ih=1342, ir=46,
        sc=602/452,
        hs=80, ss=32, bs=21, tp=85,
    ),
    dict(
        folder='tablet-7inch',
        w=1200, h=2133,
        fw=700, fh=1522, fr=58,
        iw=672, ih=1494, ir=44,
        sc=672/452,
        hs=90, ss=36, bs=24, tp=100,
    ),
    dict(
        folder='tablet-10inch',
        w=1620, h=2880,
        fw=930, fh=2062, fr=70,
        iw=902, ih=2034, ir=56,
        sc=902/452,
        hs=120, ss=48, bs=30, tp=135,
    ),
]

# ─── SVG helpers ──────────────────────────────────────────────────────────────
def icon(paths, sz=18, stroke='currentColor', sw=2, fill='none'):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" width="{sz}" height="{sz}" '
            f'viewBox="0 0 24 24" fill="{fill}" stroke="{stroke}" stroke-width="{sw}" '
            f'stroke-linecap="round" stroke-linejoin="round">{paths}</svg>')

SHIELD  = '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
GEAR    = '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06-.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>'
CHEVR   = '<polyline points="9 18 15 12 9 6"/>'
CHEVD   = '<polyline points="6 9 12 15 18 9"/>'
EYE     = '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>'
PLUS    = '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>'
BACK    = '<polyline points="15 18 9 12 15 6"/>'
LOCK_I  = '<rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>'
CAMERA  = '<path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/><circle cx="12" cy="13" r="4"/>'
KEY_I   = '<path d="M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0l3 3L22 7l-3-3m-3.5 3.5L19 4"/>'
UPLOAD  = '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>'
DOWNLOAD= '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'
EDIT_I  = '<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>'
TRASH   = '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>'

# ─── Shared fragments ─────────────────────────────────────────────────────────
SB = '''<div style="height:40px;background:#080808;display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex-shrink:0;">
  <span style="font-size:13px;font-weight:600;color:#F5F5F5;font-family:-apple-system,sans-serif;">9:41</span>
  <div style="display:flex;gap:5px;align-items:center;">
    <svg width="15" height="11" viewBox="0 0 16 12" fill="white"><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/><rect x="13.5" y="1" width="2.5" height="11" rx="1" opacity="0.3"/></svg>
    <svg width="16" height="11" viewBox="0 0 24 16" fill="white"><path d="M12 3C7.5 3 3.6 5.1 1 8.3l1.8 1.9C4.8 7.3 8.2 5.5 12 5.5c3.8 0 7.2 1.8 9.2 4.7L23 8.3C20.4 5.1 16.5 3 12 3z"/><path d="M12 8C9.4 8 7.1 9.1 5.5 10.9l1.9 1.9C8.5 11.4 10.1 10.5 12 10.5c1.9 0 3.5.9 4.6 2.3l1.9-1.9C16.9 9.1 14.6 8 12 8z"/><circle cx="12" cy="15" r="2"/></svg>
    <svg width="24" height="11" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" stroke-opacity="0.35"/><rect x="2" y="2" width="16" height="8" rx="2" fill="white"/><path d="M23 4.5V7.5C23.8 7.2 24.5 6.7 24.5 6 24.5 5.3 23.8 4.8 23 4.5Z" fill="white" opacity="0.4"/></svg>
  </div>
</div>'''

HOME_BAR = '''<div style="height:34px;background:#080808;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
  <div style="width:120px;height:5px;background:rgba(255,255,255,0.26);border-radius:3px;"></div>
</div>'''

CHIP = '''<div style="width:36px;height:28px;border-radius:5px;background:linear-gradient(135deg,#C4A020,#EAC840,#A88018);display:flex;flex-direction:column;justify-content:center;padding:5px 6px;gap:2.5px;">
  <div style="height:1.5px;background:rgba(0,0,0,0.32);border-radius:1px;"></div>
  <div style="height:1.5px;background:rgba(0,0,0,0.20);border-radius:1px;width:68%;"></div>
  <div style="height:1.5px;background:rgba(0,0,0,0.32);border-radius:1px;"></div>
</div>'''


# ─── App screen: HOME — matches actual app layout ──────────────────────────────
def screen_home():
    # Exact colors from app's cardUtils — matches reference screenshot
    def card(bg1, bg2, brand, nick, num, holder, bank):
        return f'''<div style="border-radius:24px;padding:18px 20px;background:linear-gradient(135deg,{bg1},{bg2});border:1px solid rgba(255,255,255,0.08);flex-shrink:0;position:relative;overflow:hidden;">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
            <span style="font-size:11px;font-weight:700;letter-spacing:1.5px;color:rgba(255,255,255,0.56);font-family:-apple-system,sans-serif;">{brand}</span>
            <span style="padding:5px 14px;border-radius:999px;background:rgba(255,255,255,0.14);border:1px solid rgba(255,255,255,0.08);font-size:12px;color:rgba(255,255,255,0.80);font-weight:500;font-family:-apple-system,sans-serif;">{nick}</span>
          </div>
          <div style="font-size:19px;font-weight:600;font-family:Menlo,monospace;color:#FFFFFF;letter-spacing:2px;margin-bottom:14px;">{num}</div>
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <div>
              <div style="font-size:14px;font-weight:700;color:#FFFFFF;font-family:-apple-system,sans-serif;">{holder}</div>
              <div style="font-size:12px;color:rgba(255,255,255,0.46);font-family:-apple-system,sans-serif;margin-top:3px;">{bank}</div>
            </div>
            {icon(CHEVR, 14, 'rgba(255,255,255,0.38)')}
          </div>
        </div>'''

    cards_html = (
        card('#1E2030', '#2A2D3E',
             'VISA', 'Savings',
             '•••• •••• •••• 2832',
             'SARAH MITCHELL', 'Barclays') +
        card('#0D1E3C', '#1C4F84',
             'RUPAY', 'SBI Platinum',
             '•••• •••• •••• 9019',
             'PRIYA SHARMA', 'State Bank of India') +
        card('#0B4040', '#0D6E6E',
             'DISCOVER', 'Cashback Discover',
             '•••• •••• •••• 1117',
             'JAMES HARRISON', 'Discover Bank') +
        card('#5A3820', '#7B5030',
             'AMEX', 'Travel Amex',
             '•••• •••••• 16869',
             'JAMES HARRISON', 'American Express')
    )

    return f'''<div style="width:452px;height:1008px;background:#080808;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;">
  {SB}
  <div style="padding:14px 20px 10px;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;">
    <span style="font-size:26px;font-weight:700;color:#F5F5F5;letter-spacing:-0.3px;">Card Vault</span>
    <div style="display:flex;gap:8px;">
      <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:center;">{icon(SHIELD,18,'rgba(255,255,255,0.72)',1.8)}</div>
      <div style="width:40px;height:40px;border-radius:50%;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;justify-content:center;">{icon(GEAR,18,'rgba(255,255,255,0.72)',1.8)}</div>
    </div>
  </div>
  <div style="padding:0 20px 12px;display:flex;gap:8px;flex-shrink:0;overflow:hidden;">
    <span style="padding:8px 18px;border-radius:999px;background:rgba(255,255,255,0.88);color:#0A0A0A;font-size:13px;font-weight:600;white-space:nowrap;font-family:-apple-system,sans-serif;">None</span>
    <span style="padding:8px 15px;border-radius:999px;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.56);font-size:13px;border:1px solid rgba(255,255,255,0.08);white-space:nowrap;font-family:-apple-system,sans-serif;">Brand</span>
    <span style="padding:8px 15px;border-radius:999px;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.56);font-size:13px;border:1px solid rgba(255,255,255,0.08);white-space:nowrap;font-family:-apple-system,sans-serif;">Bank</span>
    <span style="padding:8px 15px;border-radius:999px;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.56);font-size:13px;border:1px solid rgba(255,255,255,0.08);white-space:nowrap;font-family:-apple-system,sans-serif;">Type</span>
    <span style="padding:8px 15px;border-radius:999px;background:rgba(255,255,255,0.07);color:rgba(255,255,255,0.56);font-size:13px;border:1px solid rgba(255,255,255,0.08);white-space:nowrap;font-family:-apple-system,sans-serif;">Expiry</span>
  </div>
  <div style="flex:1;padding:0 20px;display:flex;flex-direction:column;gap:10px;overflow:hidden;">
    {cards_html}
  </div>
  <div style="padding:14px 20px 16px;flex-shrink:0;">
    <div style="height:52px;background:rgba(255,255,255,0.88);border-radius:16px;display:flex;align-items:center;justify-content:center;gap:8px;">
      <span style="font-size:20px;font-weight:300;color:#0A0A0A;line-height:1;font-family:-apple-system,sans-serif;">+</span>
      <span style="font-size:15px;font-weight:600;color:#0A0A0A;font-family:-apple-system,sans-serif;">Add Card</span>
    </div>
  </div>
  {HOME_BAR}
</div>'''


# ─── App screen: CARD DETAILS ─────────────────────────────────────────────────
def screen_card_details():
    rows = [
        ('Cardholder',  'SARAH MITCHELL', False),
        ('Card Number', '••••  ••••  ••••  2832', True),
        ('Expiry',      '05 / 26', False),
        ('CVV',         '• • •', True),
        ('Bank',        'Barclays', False),
        ('Card Type',   'Debit', False),
        ('Nickname',    'Savings', False),
        ('Card Brand',  'Visa', False),
    ]
    rows_html = ''
    for i, (label, val, mono) in enumerate(rows):
        border = '' if i == len(rows)-1 else 'border-bottom:1px solid rgba(255,255,255,0.06);'
        mono_s = 'font-family:Menlo,monospace;letter-spacing:2px;' if mono else ''
        rows_html += f'''<div style="{border}display:flex;justify-content:space-between;align-items:center;padding:11px 16px;">
          <span style="font-size:12px;color:#555;font-family:-apple-system,sans-serif;">{label}</span>
          <span style="font-size:13px;font-weight:600;color:#EBEBEB;font-family:-apple-system,sans-serif;{mono_s}">{val}</span>
        </div>'''

    return f'''<div style="width:452px;height:1008px;background:#080808;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;">
  {SB}
  <div style="padding:12px 20px 10px;display:flex;align-items:center;gap:10px;flex-shrink:0;">
    {icon(BACK, 20, '#F5F5F5')}
    <span style="font-size:20px;font-weight:700;color:#F5F5F5;">Card Details</span>
  </div>
  <div style="flex:1;padding:0 20px;overflow:hidden;display:flex;flex-direction:column;gap:12px;">
    <div style="border-radius:22px;padding:20px;background:linear-gradient(140deg,#1A0E02,#3C2008,#4E2C0A,#2A1604);border:1px solid rgba(201,164,85,0.22);flex-shrink:0;position:relative;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.65),0 0 40px rgba(120,80,8,0.14);">
      <div style="position:absolute;right:-20px;top:-20px;width:105px;height:105px;border-radius:50%;background:rgba(201,164,85,0.055);pointer-events:none;"></div>
      <div style="position:absolute;left:0;bottom:0;right:0;height:1px;background:linear-gradient(90deg,transparent,rgba(201,164,85,0.20),transparent);"></div>
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <span style="padding:4px 12px;border-radius:999px;background:rgba(255,255,255,0.09);font-size:11px;color:rgba(255,255,255,0.62);font-family:-apple-system,sans-serif;font-weight:500;">Savings</span>
        <span style="font-size:17px;font-weight:800;color:rgba(255,215,140,0.95);letter-spacing:1.5px;font-family:-apple-system,sans-serif;">VISA</span>
      </div>
      <div style="margin-bottom:14px;">{CHIP}</div>
      <div style="font-size:19px;font-weight:400;font-family:Menlo,monospace;color:rgba(255,218,155,0.88);letter-spacing:3px;margin-bottom:14px;">••••  ••••  ••••  2832</div>
      <div style="display:flex;justify-content:space-between;align-items:flex-end;">
        <div>
          <div style="font-size:8px;color:rgba(255,215,140,0.34);letter-spacing:0.8px;margin-bottom:2px;font-family:-apple-system,sans-serif;text-transform:uppercase;">CARDHOLDER</div>
          <div style="font-size:13px;font-weight:600;color:rgba(255,224,166,0.92);font-family:-apple-system,sans-serif;">SARAH MITCHELL</div>
        </div>
        <div style="text-align:right;">
          <div style="font-size:8px;color:rgba(255,215,140,0.34);letter-spacing:0.8px;margin-bottom:2px;font-family:-apple-system,sans-serif;text-transform:uppercase;">EXPIRES</div>
          <div style="font-size:13px;font-weight:600;color:rgba(255,224,166,0.92);font-family:-apple-system,sans-serif;">05 / 26</div>
        </div>
      </div>
    </div>
    <div style="background:#0E0E0E;border-radius:18px;border:1px solid rgba(255,255,255,0.07);flex-shrink:0;">
      {rows_html}
    </div>
    <div style="display:flex;gap:10px;flex-shrink:0;">
      <div style="flex:1;height:52px;background:#0E0E0E;border:1px solid rgba(255,255,255,0.07);border-radius:14px;display:flex;align-items:center;justify-content:center;gap:7px;">
        {icon(EYE, 15, '#555')}
        <span style="font-size:12px;font-weight:600;color:#555;font-family:-apple-system,sans-serif;">Reveal Number</span>
      </div>
      <div style="flex:1;height:52px;background:#0E0E0E;border:1px solid rgba(255,255,255,0.07);border-radius:14px;display:flex;align-items:center;justify-content:center;gap:7px;">
        {icon(EYE, 15, '#555')}
        <span style="font-size:12px;font-weight:600;color:#555;font-family:-apple-system,sans-serif;">Reveal CVV</span>
      </div>
    </div>
  </div>
  <div style="padding:12px 20px 2px;flex-shrink:0;display:flex;gap:10px;border-top:1px solid rgba(255,255,255,0.06);">
    <div style="flex:1;height:52px;background:#0E0E0E;border:1px solid rgba(255,255,255,0.08);border-radius:14px;display:flex;align-items:center;justify-content:center;gap:8px;">
      {icon(EDIT_I, 16, '#B8B8B8')}
      <span style="font-size:14px;font-weight:600;color:#B8B8B8;font-family:-apple-system,sans-serif;">Edit</span>
    </div>
    <div style="flex:1;height:52px;background:rgba(232,112,112,0.07);border:1px solid rgba(232,112,112,0.16);border-radius:14px;display:flex;align-items:center;justify-content:center;gap:8px;">
      {icon(TRASH, 16, '#E87070')}
      <span style="font-size:14px;font-weight:600;color:#E87070;font-family:-apple-system,sans-serif;">Delete</span>
    </div>
  </div>
  {HOME_BAR}
</div>'''


# ─── App screen: SCAN CARD — card is centered INSIDE the scan frame ────────────
def screen_scan():
    card_html = '''<div style="position:absolute;left:50%;top:50%;
        transform:translate(-50%,-50%) perspective(900px) rotateX(3deg) rotateY(-5deg);
        width:272px;height:165px;border-radius:14px;
        background:linear-gradient(140deg,#1A0E02,#3C2008,#4E2C0A,#2A1604);
        border:1px solid rgba(201,164,85,0.18);opacity:0.82;overflow:hidden;">
      <div style="position:absolute;inset:14px;">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:9px;">
          <div style="width:26px;height:20px;border-radius:3px;background:linear-gradient(135deg,#C4A020,#EAC840);"></div>
          <span style="font-size:13px;font-weight:800;color:rgba(255,215,140,0.88);font-family:-apple-system,sans-serif;letter-spacing:1px;">VISA</span>
        </div>
        <div style="font-size:12px;font-family:Menlo,monospace;color:rgba(255,218,155,0.80);letter-spacing:2.5px;margin-bottom:10px;">4242  ••••  ••••  ••••</div>
        <div style="font-size:10px;font-weight:600;color:rgba(255,224,166,0.76);font-family:-apple-system,sans-serif;">SARAH MITCHELL</div>
      </div>
    </div>'''

    return f'''<div style="width:452px;height:1008px;background:#040404;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;position:relative;">
  <div style="position:absolute;inset:0;background-image:radial-gradient(circle,rgba(255,255,255,0.011) 1px,transparent 1px);background-size:5px 5px;pointer-events:none;z-index:0;"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 85% 85% at 50% 50%,transparent 38%,rgba(0,0,0,0.70) 100%);pointer-events:none;z-index:0;"></div>
  <div style="position:absolute;inset:0;background:radial-gradient(ellipse 280px 220px at 50% 36%,rgba(28,20,6,0.22) 0%,transparent 70%);pointer-events:none;z-index:0;"></div>
  <div style="height:40px;background:rgba(0,0,0,0.52);display:flex;align-items:center;justify-content:space-between;padding:0 22px;flex-shrink:0;position:relative;z-index:2;">
    <span style="font-size:13px;font-weight:600;color:#F5F5F5;font-family:-apple-system,sans-serif;">9:41</span>
    <div style="display:flex;gap:5px;align-items:center;">
      <svg width="15" height="11" viewBox="0 0 16 12" fill="white"><rect x="0" y="3" width="3" height="9" rx="1"/><rect x="4.5" y="2" width="3" height="10" rx="1"/><rect x="9" y="0" width="3" height="12" rx="1"/></svg>
      <svg width="24" height="11" viewBox="0 0 25 12" fill="none"><rect x="0.5" y="0.5" width="21" height="11" rx="3.5" stroke="white" stroke-opacity="0.35"/><rect x="2" y="2" width="16" height="8" rx="2" fill="white"/></svg>
    </div>
  </div>
  <div style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;position:relative;z-index:1;gap:0;">
    <!-- Scan frame: position:relative so card is centered inside it -->
    <div style="position:relative;width:320px;height:200px;z-index:3;flex-shrink:0;">
      <!-- Card centered within frame (rendered BEFORE border so border sits on top) -->
      {card_html}
      <!-- Frame border overlay — on top of card -->
      <div style="position:absolute;inset:0;border-radius:18px;border:2px solid rgba(201,164,85,0.78);box-shadow:0 0 26px rgba(201,164,85,0.24),inset 0 0 18px rgba(201,164,85,0.05);pointer-events:none;"></div>
      <!-- Corner accent marks -->
      <div style="position:absolute;left:-2px;top:-2px;width:26px;height:26px;border-left:3px solid #C9A455;border-top:3px solid #C9A455;border-radius:16px 0 0 0;"></div>
      <div style="position:absolute;right:-2px;top:-2px;width:26px;height:26px;border-right:3px solid #C9A455;border-top:3px solid #C9A455;border-radius:0 16px 0 0;"></div>
      <div style="position:absolute;left:-2px;bottom:-2px;width:26px;height:26px;border-left:3px solid #C9A455;border-bottom:3px solid #C9A455;border-radius:0 0 0 16px;"></div>
      <div style="position:absolute;right:-2px;bottom:-2px;width:26px;height:26px;border-right:3px solid #C9A455;border-bottom:3px solid #C9A455;border-radius:0 0 16px 0;"></div>
      <!-- Scan sweep line -->
      <div style="position:absolute;left:8px;right:8px;top:44%;height:1.5px;background:linear-gradient(90deg,transparent 0%,rgba(201,164,85,0.60) 18%,rgba(255,224,100,0.92) 50%,rgba(201,164,85,0.60) 82%,transparent 100%);border-radius:999px;box-shadow:0 0 8px rgba(201,164,85,0.50);"></div>
    </div>
    <div style="margin-top:20px;padding:10px 22px;background:rgba(0,0,0,0.62);border-radius:999px;border:1px solid rgba(255,255,255,0.10);z-index:2;flex-shrink:0;">
      <span style="font-size:14px;color:rgba(255,255,255,0.72);font-family:-apple-system,sans-serif;font-weight:500;">Align the front of your card</span>
    </div>
  </div>
  <div style="height:130px;background:linear-gradient(0deg,rgba(0,0,0,0.88) 0%,rgba(0,0,0,0.42) 100%);display:flex;align-items:center;justify-content:space-between;padding:0 50px;flex-shrink:0;position:relative;z-index:2;">
    <span style="font-size:16px;color:rgba(255,255,255,0.58);font-family:-apple-system,sans-serif;font-weight:500;">Cancel</span>
    <div style="width:72px;height:72px;border-radius:50%;background:rgba(201,164,85,0.13);border:2.5px solid rgba(201,164,85,0.52);display:flex;align-items:center;justify-content:center;box-shadow:0 0 22px rgba(201,164,85,0.20);">
      <div style="width:56px;height:56px;border-radius:50%;background:rgba(201,164,85,0.88);box-shadow:0 0 14px rgba(201,164,85,0.40);"></div>
    </div>
    <span style="font-size:16px;color:rgba(201,164,85,0.82);font-family:-apple-system,sans-serif;font-weight:500;">Gallery</span>
  </div>
</div>'''


# ─── App screen: SECURITY ─────────────────────────────────────────────────────
def screen_security():
    # Concentric ring diagram built from SVG circles — each ring = a security layer
    rings_svg = '''<svg width="280" height="280" viewBox="0 0 280 280" fill="none" xmlns="http://www.w3.org/2000/svg">
      <!-- outer glow halo -->
      <circle cx="140" cy="140" r="132" stroke="rgba(201,164,85,0.04)" stroke-width="1"/>
      <!-- ring 4 — offline -->
      <circle cx="140" cy="140" r="118" stroke="rgba(201,164,85,0.10)" stroke-width="1" stroke-dasharray="4 6"/>
      <!-- ring 3 — biometric -->
      <circle cx="140" cy="140" r="98" stroke="rgba(201,164,85,0.16)" stroke-width="1" stroke-dasharray="3 5"/>
      <!-- ring 2 — secure enclave -->
      <circle cx="140" cy="140" r="76" stroke="rgba(201,164,85,0.26)" stroke-width="1.5"/>
      <!-- ring 1 — AES core -->
      <circle cx="140" cy="140" r="54" stroke="rgba(201,164,85,0.45)" stroke-width="1.5"/>
      <!-- inner glow fill -->
      <circle cx="140" cy="140" r="50" fill="rgba(201,164,85,0.06)"/>
      <circle cx="140" cy="140" r="38" fill="rgba(201,164,85,0.08)"/>
      <!-- ring labels — top/right/bottom/left -->
      <text x="140" y="14" text-anchor="middle" font-size="8.5" fill="rgba(201,164,85,0.55)" font-family="-apple-system,sans-serif" font-weight="600" letter-spacing="1.2">OFFLINE</text>
      <text x="267" y="144" text-anchor="middle" font-size="8.5" fill="rgba(201,164,85,0.45)" font-family="-apple-system,sans-serif" font-weight="600" letter-spacing="1.2" transform="rotate(90,267,144)">BIOMETRIC</text>
      <text x="140" y="272" text-anchor="middle" font-size="8.5" fill="rgba(201,164,85,0.40)" font-family="-apple-system,sans-serif" font-weight="600" letter-spacing="1.2">SECURE ENCLAVE</text>
      <text x="13" y="144" text-anchor="middle" font-size="8.5" fill="rgba(201,164,85,0.55)" font-family="-apple-system,sans-serif" font-weight="600" letter-spacing="1.2" transform="rotate(-90,13,144)">AES-256</text>
      <!-- tick marks on ring 1 -->
      <line x1="140" y1="86" x2="140" y2="92" stroke="rgba(201,164,85,0.50)" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="194" y1="140" x2="188" y2="140" stroke="rgba(201,164,85,0.50)" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="140" y1="194" x2="140" y2="188" stroke="rgba(201,164,85,0.50)" stroke-width="1.5" stroke-linecap="round"/>
      <line x1="86" y1="140" x2="92" y2="140" stroke="rgba(201,164,85,0.50)" stroke-width="1.5" stroke-linecap="round"/>
      <!-- shield paths in center -->
      <path d="M140 118 c0 0-16-6-16 0v12c0 10 16 18 16 18s16-8 16-18v-12c0-6-16 0-16 0z" stroke="rgba(201,164,85,0.90)" stroke-width="1.6" fill="rgba(201,164,85,0.10)" stroke-linejoin="round"/>
      <path d="M136 133 l3 4 6-8" stroke="rgba(201,164,85,0.90)" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
    </svg>'''

    stat_chip = lambda label, val: (
        f'<div style="display:flex;flex-direction:column;align-items:center;gap:3px;'
        f'padding:10px 18px;border-radius:14px;background:rgba(201,164,85,0.07);'
        f'border:1px solid rgba(201,164,85,0.16);">'
        f'<span style="font-size:15px;font-weight:800;color:#C9A455;'
        f'font-family:-apple-system,sans-serif;letter-spacing:-0.3px;">{val}</span>'
        f'<span style="font-size:10px;color:rgba(201,164,85,0.52);font-weight:600;'
        f'letter-spacing:1px;font-family:-apple-system,sans-serif;text-transform:uppercase;">{label}</span>'
        f'</div>'
    )

    fact_row = lambda ic_paths, title, desc: (
        f'<div style="display:flex;align-items:flex-start;gap:12px;padding:11px 0;'
        f'border-bottom:1px solid rgba(255,255,255,0.05);">'
        f'<div style="width:32px;height:32px;border-radius:10px;background:rgba(201,164,85,0.08);'
        f'border:1px solid rgba(201,164,85,0.14);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
        f'{icon(ic_paths, 15, "#C9A455")}'
        f'</div>'
        f'<div style="flex:1;">'
        f'<div style="font-size:13px;font-weight:700;color:#E8E8E8;font-family:-apple-system,sans-serif;margin-bottom:2px;">{title}</div>'
        f'<div style="font-size:11px;color:#505050;line-height:1.5;font-family:-apple-system,sans-serif;">{desc}</div>'
        f'</div></div>'
    )

    return f'''<div style="width:452px;height:1008px;background:#080808;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;">
  {SB}
  <div style="padding:10px 20px 0;display:flex;align-items:center;gap:10px;flex-shrink:0;">
    {icon(BACK, 20, '#F5F5F5')}
    <span style="font-size:20px;font-weight:700;color:#F5F5F5;">Security</span>
  </div>
  <!-- ring diagram -->
  <div style="display:flex;flex-direction:column;align-items:center;padding:8px 0 4px;flex-shrink:0;position:relative;">
    <div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:200px;height:200px;border-radius:50%;background:radial-gradient(circle,rgba(201,164,85,0.09) 0%,transparent 70%);pointer-events:none;"></div>
    {rings_svg}
    <div style="font-size:10px;font-weight:700;letter-spacing:2px;color:rgba(201,164,85,0.46);margin-top:2px;font-family:-apple-system,sans-serif;text-transform:uppercase;">PROTECTION LAYERS</div>
  </div>
  <!-- stat chips -->
  <div style="display:flex;gap:8px;justify-content:center;padding:8px 20px 4px;flex-shrink:0;">
    {stat_chip("Encryption", "AES-256")}
    {stat_chip("Network", "0 Calls")}
    {stat_chip("Storage", "On-Device")}
  </div>
  <!-- fact rows -->
  <div style="flex:1;padding:4px 20px 0;overflow:hidden;display:flex;flex-direction:column;">
    {fact_row(KEY_I, "Key never leaves your device", "Stored in the secure enclave — unreachable by anyone, including us.")}
    {fact_row(LOCK_I, "Auto-locks in 30 seconds", "PIN or biometric required every time you open the vault.")}
    {fact_row(EYE, "Details hide themselves", "Numbers auto-hide in 5s. Clipboard clears in 20s.")}
    {fact_row(SHIELD, "No accounts. No recovery.", "Zero-knowledge by design — we have nothing to hand over.")}
  </div>
  {HOME_BAR}
</div>'''


# ─── App screen: SETTINGS ─────────────────────────────────────────────────────
def screen_settings():
    toggle_on = ('<div style="width:46px;height:27px;border-radius:14px;background:rgba(201,164,85,0.22);'
                 'border:1px solid rgba(201,164,85,0.40);padding:3px;display:flex;align-items:center;justify-content:flex-end;">'
                 '<div style="width:21px;height:21px;border-radius:50%;background:#C9A455;'
                 'box-shadow:0 0 8px rgba(201,164,85,0.50);"></div></div>')

    def tile(ic_paths, title, sub, accent=False, right=None):
        bg = 'rgba(201,164,85,0.07)' if accent else 'rgba(255,255,255,0.04)'
        border = 'rgba(201,164,85,0.20)' if accent else 'rgba(255,255,255,0.07)'
        ic_col = '#C9A455' if accent else '#888888'
        right_el = right if right else icon(CHEVR, 13, '#303030')
        return (f'<div style="flex:1;min-width:0;background:{bg};border-radius:18px;border:1px solid {border};'
                f'padding:16px 14px 14px;display:flex;flex-direction:column;gap:10px;">'
                f'<div style="width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,0.05);'
                f'border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;">'
                f'{icon(ic_paths, 18, ic_col)}</div>'
                f'<div>'
                f'<div style="font-size:13px;font-weight:700;color:#EEEEEE;font-family:-apple-system,sans-serif;margin-bottom:3px;">{title}</div>'
                f'<div style="font-size:11px;color:#4A4A4A;font-family:-apple-system,sans-serif;line-height:1.45;">{sub}</div>'
                f'</div>'
                f'<div style="margin-top:auto;display:flex;justify-content:flex-end;">{right_el}</div>'
                f'</div>')

    def full_row(ic_paths, title, sub, right=None):
        right_el = right if right else icon(CHEVR, 13, '#303030')
        return (f'<div style="background:rgba(255,255,255,0.04);border-radius:18px;border:1px solid rgba(255,255,255,0.07);'
                f'padding:13px 15px;display:flex;align-items:center;gap:12px;">'
                f'<div style="width:38px;height:38px;border-radius:12px;background:rgba(255,255,255,0.05);'
                f'border:1px solid rgba(255,255,255,0.08);display:flex;align-items:center;justify-content:center;flex-shrink:0;">'
                f'{icon(ic_paths, 18, "#888888")}</div>'
                f'<div style="flex:1;">'
                f'<div style="font-size:13px;font-weight:700;color:#EEEEEE;font-family:-apple-system,sans-serif;">{title}</div>'
                f'<div style="font-size:11px;color:#4A4A4A;font-family:-apple-system,sans-serif;margin-top:2px;">{sub}</div>'
                f'</div>'
                f'{right_el}</div>')

    def section_label(txt):
        return f'<div style="font-size:10px;font-weight:700;letter-spacing:1.4px;color:#343434;font-family:-apple-system,sans-serif;padding:0 2px 7px;">{txt}</div>'

    return f'''<div style="width:452px;height:1008px;background:#080808;display:flex;flex-direction:column;font-family:-apple-system,BlinkMacSystemFont,sans-serif;overflow:hidden;">
  {SB}
  <div style="padding:10px 20px 6px;display:flex;align-items:center;gap:10px;flex-shrink:0;">
    {icon(BACK, 20, '#F5F5F5')}
    <span style="font-size:20px;font-weight:700;color:#F5F5F5;">Settings</span>
  </div>
  <!-- vault identity card -->
  <div style="margin:0 20px 14px;background:linear-gradient(140deg,#141008,#1E1608);border-radius:20px;border:1px solid rgba(201,164,85,0.16);padding:16px 18px;display:flex;align-items:center;gap:14px;flex-shrink:0;">
    <div style="width:48px;height:48px;border-radius:16px;background:rgba(201,164,85,0.10);border:1px solid rgba(201,164,85,0.24);display:flex;align-items:center;justify-content:center;flex-shrink:0;box-shadow:0 0 16px rgba(201,164,85,0.10);">
      {icon(SHIELD, 22, '#C9A455')}
    </div>
    <div style="flex:1;">
      <div style="font-size:15px;font-weight:700;color:#F0ECE4;font-family:-apple-system,sans-serif;">Secure Card Vault</div>
      <div style="font-size:11px;color:rgba(201,164,85,0.55);font-family:-apple-system,sans-serif;margin-top:2px;">4 cards &nbsp;·&nbsp; AES-256 protected</div>
    </div>
    <div style="display:flex;flex-direction:column;align-items:flex-end;gap:4px;">
      <div style="width:8px;height:8px;border-radius:50%;background:#4CAF50;box-shadow:0 0 6px rgba(76,175,80,0.60);"></div>
      <span style="font-size:10px;color:#3A3A3A;font-family:-apple-system,sans-serif;">Secured</span>
    </div>
  </div>
  <div style="flex:1;padding:0 20px;overflow:hidden;display:flex;flex-direction:column;gap:10px;">
    <!-- access section -->
    <div style="flex-shrink:0;">
      {section_label('ACCESS')}
      <div style="display:flex;gap:10px;">
        {tile('<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>', 'Fingerprint', 'Unlock with biometrics', accent=True, right=toggle_on)}
        {tile(KEY_I, 'Change PIN', 'Update your vault PIN')}
      </div>
    </div>
    <!-- backup section -->
    <div style="flex-shrink:0;">
      {section_label('BACKUP & TRANSFER')}
      <div style="display:flex;gap:10px;">
        {tile(UPLOAD, 'Export', 'Password-protected backup')}
        {tile(DOWNLOAD, 'Import', 'Restore from backup')}
      </div>
    </div>
    <!-- more rows -->
    <div style="flex-shrink:0;display:flex;flex-direction:column;gap:8px;">
      {section_label('MORE')}
      {full_row(LOCK_I, 'Lock Now', 'Return to the unlock screen immediately')}
      {full_row(SHIELD, 'Security & Privacy', 'Review how your data is protected')}
    </div>
  </div>
  {HOME_BAR}
</div>'''


# ─── Intro screen (full-page, no device frame) ────────────────────────────────
def generate_intro_html(device):
    w, h = device['w'], device['h']

    def s(n):
        return round(n * w / 1080)

    cw = s(510); ch = s(316); cr = s(22)
    cl = (w - cw) // 2 - s(18)
    cs_pt = s(14)
    cs_h  = cs_pt + ch + s(52)
    ba_top = cs_pt + round(ch * 0.25)
    bo_top = cs_pt + round(ch * 0.60)
    bb_top = cs_pt + ch + s(10)
    ghost_dl = s(18); ghost_dt = s(-12)
    hs = s(92); sub = s(27); tsz = s(16); bsz = s(13); psz = s(13); fsz = s(11)
    th = s(128); fh = s(96)
    gap = s(50)

    def pill(emoji, label):
        return (f'<div style="display:flex;align-items:center;gap:{s(6)}px;'
                f'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);'
                f'border-radius:999px;padding:{s(10)}px {s(17)}px;">'
                f'<span style="font-size:{s(14)}px;">{emoji}</span>'
                f'<span style="font-size:{psz}px;color:rgba(255,255,255,0.62);font-weight:500;'
                f"white-space:nowrap;font-family:'DM Sans',sans-serif;\">{label}</span>"
                f'</div>')

    def badge(dot_color, text, side, top):
        edge = f'right:{s(50)}px' if side == 'right' else f'left:{s(48)}px'
        return (f'<div style="position:absolute;{edge};top:{top}px;display:flex;align-items:center;'
                f'gap:{s(7)}px;background:rgba(6,5,3,0.92);border:1px solid rgba(201,164,85,0.14);'
                f'border-radius:999px;padding:{s(8)}px {s(15)}px;">'
                f'<div style="width:{s(7)}px;height:{s(7)}px;border-radius:50%;background:{dot_color};'
                f'flex-shrink:0;box-shadow:0 0 {s(5)}px {dot_color};"></div>'
                f'<span style="font-size:{bsz}px;color:rgba(255,255,255,0.75);white-space:nowrap;'
                f"font-family:'DM Sans',sans-serif;\">{text}</span>"
                f'</div>')

    chip_intro = (f'<div style="width:{s(44)}px;height:{s(34)}px;border-radius:{s(5)}px;'
                  f'background:linear-gradient(135deg,#C4A020,#EAC840,#A88018);position:relative;overflow:hidden;">'
                  f'<div style="position:absolute;inset:0;display:flex;flex-direction:column;justify-content:center;'
                  f'padding:{s(5)}px {s(7)}px;gap:{s(3)}px;">'
                  f'<div style="height:{s(2)}px;background:rgba(0,0,0,0.28);border-radius:1px;"></div>'
                  f'<div style="height:{s(2)}px;background:rgba(0,0,0,0.18);border-radius:1px;width:68%;"></div>'
                  f'<div style="height:{s(2)}px;background:rgba(0,0,0,0.28);border-radius:1px;"></div></div>'
                  f'<div style="position:absolute;top:0;left:50%;transform:translateX(-50%);'
                  f'width:{s(2)}px;height:100%;background:rgba(0,0,0,0.14);"></div></div>')

    return f'''<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:{w}px; height:{h}px; overflow:hidden; }}</style>
</head><body>
<div style="width:{w}px;height:{h}px;
  background-color:#060504;
  background-image:
    radial-gradient(circle,rgba(201,164,85,0.05) 1px,transparent 1px),
    radial-gradient(ellipse {s(900)}px {s(660)}px at 50% 35%,rgba(80,50,6,0.58) 0%,rgba(30,18,2,0.30) 42%,transparent 68%),
    radial-gradient(ellipse {s(480)}px {s(300)}px at 20% 85%,rgba(55,34,4,0.28) 0%,transparent 55%),
    radial-gradient(ellipse {s(380)}px {s(240)}px at 82% 72%,rgba(65,40,5,0.20) 0%,transparent 52%);
  background-size:{s(40)}px {s(40)}px,100% 100%,100% 100%,100% 100%;
  position:relative;display:flex;flex-direction:column;align-items:center;
  overflow:hidden;font-family:'DM Sans',sans-serif;">
  <div style="position:absolute;left:{s(36)}px;top:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-left:1px solid rgba(201,164,85,0.12);border-top:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>
  <div style="position:absolute;right:{s(36)}px;top:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-right:1px solid rgba(201,164,85,0.12);border-top:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>
  <div style="position:absolute;left:{s(36)}px;bottom:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-left:1px solid rgba(201,164,85,0.12);border-bottom:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>
  <div style="position:absolute;right:{s(36)}px;bottom:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-right:1px solid rgba(201,164,85,0.12);border-bottom:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>
  <div style="height:{th}px;width:100%;display:flex;align-items:center;justify-content:center;gap:{s(12)}px;flex-shrink:0;z-index:1;">
    <div style="width:{s(35)}px;height:{s(35)}px;border-radius:{s(9)}px;background:rgba(201,164,85,0.10);border:1px solid rgba(201,164,85,0.22);display:flex;align-items:center;justify-content:center;">
      {icon(LOCK_I, s(16), '#C9A455')}
    </div>
    <span style="font-size:{tsz}px;font-weight:600;letter-spacing:4px;color:rgba(255,255,255,0.65);text-transform:uppercase;">CARD VAULT</span>
  </div>
  <div style="flex:1;"></div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:{gap}px;width:100%;flex-shrink:0;">
    <div style="width:{w}px;height:{cs_h}px;position:relative;flex-shrink:0;">
      <div style="position:absolute;left:{cl - s(55)}px;top:{cs_pt + s(30)}px;width:{cw + s(110)}px;height:{ch}px;background:radial-gradient(ellipse at 50% 50%,rgba(160,100,10,0.34) 0%,transparent 70%);filter:blur({s(40)}px);pointer-events:none;"></div>
      <div style="position:absolute;left:{cl + ghost_dl}px;top:{cs_pt + ghost_dt}px;width:{cw}px;height:{ch}px;border-radius:{cr}px;background:linear-gradient(140deg,#100A02 0%,#201402 40%,#281A04 65%,#140C01 100%);border:1px solid rgba(201,164,85,0.06);opacity:0.55;transform:perspective(1200px) rotateX(10deg) rotateY(-13deg) rotateZ(-2deg);"></div>
      <div style="position:absolute;left:{cl}px;top:{cs_pt}px;width:{cw}px;height:{ch}px;border-radius:{cr}px;background:linear-gradient(140deg,#1E1406 0%,#3A2A0A 38%,#4E3812 62%,#2E1E07 100%);border:1px solid rgba(201,164,85,0.20);box-shadow:0 {s(36)}px {s(82)}px rgba(0,0,0,0.92),0 {s(8)}px {s(20)}px rgba(0,0,0,0.55),0 0 {s(80)}px rgba(120,80,8,0.24),inset 0 1px 0 rgba(255,220,100,0.10);transform:perspective(1200px) rotateX(10deg) rotateY(-13deg) rotateZ(-2deg);overflow:hidden;">
        <div style="position:absolute;right:{s(-28)}px;top:{s(-36)}px;width:{s(195)}px;height:{s(195)}px;border-radius:50%;background:rgba(255,200,80,0.04);"></div>
        <div style="position:absolute;inset:{s(22)}px;">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:{s(20)}px;">
            {chip_intro}
            <span style="font-size:{s(22)}px;font-weight:800;color:rgba(255,232,160,0.95);font-family:-apple-system,sans-serif;letter-spacing:1px;">VISA</span>
          </div>
          <div style="font-size:{s(18)}px;font-weight:400;font-family:Menlo,monospace;color:rgba(255,228,150,0.86);letter-spacing:4px;margin-bottom:{s(18)}px;">•••  •••  •••  4242</div>
          <div style="display:flex;justify-content:space-between;align-items:flex-end;">
            <div>
              <div style="font-size:9px;letter-spacing:1px;color:rgba(255,220,140,0.38);margin-bottom:3px;font-family:-apple-system,sans-serif;text-transform:uppercase;">CARDHOLDER</div>
              <div style="font-size:{s(13)}px;font-weight:600;color:rgba(255,240,200,0.95);font-family:-apple-system,sans-serif;">ALEX MORGAN</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:9px;letter-spacing:1px;color:rgba(255,220,140,0.38);margin-bottom:3px;font-family:-apple-system,sans-serif;text-transform:uppercase;">EXPIRES</div>
              <div style="font-size:{s(13)}px;font-weight:600;color:rgba(255,240,200,0.95);font-family:-apple-system,sans-serif;">08 / 28</div>
            </div>
          </div>
        </div>
      </div>
      {badge('#7EC496', 'AES-256 Encrypted', 'right', ba_top)}
      {badge('#B0B0B0', 'Fully Offline', 'left', bo_top)}
      {badge('#C9A455', 'Biometric Protected', 'right', bb_top)}
    </div>
    <div style="text-align:center;padding:0 {s(64)}px;width:100%;flex-shrink:0;">
      <div style="font-size:{hs}px;font-weight:700;color:#F0ECE4;line-height:1.04;font-family:'Playfair Display',serif;letter-spacing:-1px;">Your cards.</div>
      <div style="font-size:{hs}px;font-weight:700;font-style:italic;color:#C9A455;line-height:1.04;font-family:'Playfair Display',serif;letter-spacing:-1px;margin-bottom:{s(20)}px;">Locked tight.</div>
      <div style="width:{s(44)}px;height:{s(2)}px;background:linear-gradient(90deg,transparent,rgba(201,164,85,0.38),transparent);border-radius:999px;margin:0 auto {s(20)}px;"></div>
      <div style="font-size:{sub}px;color:rgba(255,255,255,0.32);line-height:1.65;font-family:'DM Sans',sans-serif;font-weight:400;">Store every card securely. Access offline.<br>Protected by AES-256 encryption.</div>
    </div>
    <div style="display:flex;gap:{s(10)}px;justify-content:center;flex-wrap:wrap;padding:0 {s(50)}px;width:100%;flex-shrink:0;">
      {pill('🔐','AES-256')}
      {pill('📴','Offline')}
      {pill('👆','Biometric')}
      {pill('📷','Scan Cards')}
    </div>
  </div>
  <div style="flex:1;"></div>
  <div style="height:{fh}px;width:100%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    <span style="font-size:{fsz}px;letter-spacing:3px;color:rgba(255,255,255,0.15);font-weight:500;text-transform:uppercase;font-family:'DM Sans',sans-serif;">NO INTERNET · NO ACCOUNTS · NO TRACKING</span>
  </div>
</div>
</body></html>'''


# ─── Artistic full-page: SECURITY (SS5) ──────────────────────────────────────
def generate_security_art_html(device):
    w, h = device['w'], device['h']
    def s(n): return round(n * w / 1080)
    hs = s(80); sub_sz = s(24); psz = s(13); tsz = s(16); fsz = s(11)
    th = s(108); bot_h = s(84); gap = s(44)

    # Cipher-wheel tick marks (24 ticks every 15°)
    ticks = ''
    for i in range(24):
        angle = i * 15
        major = (i % 6 == 0)
        med   = (i % 3 == 0) and not major
        y2    = 16 if major else (11 if med else 7)
        op    = '0.65' if major else ('0.40' if med else '0.18')
        sw    = '1.8'  if major else '1.2'
        ticks += (f'<line x1="170" y1="5" x2="170" y2="{y2}" '
                  f'stroke="rgba(201,164,85,{op})" stroke-width="{sw}" '
                  f'stroke-linecap="round" transform="rotate({angle} 170 170)"/>')

    ws = s(340)
    wheel_inner = (
        '<circle cx="170" cy="170" r="163" fill="rgba(201,164,85,0.025)"/>'
        '<circle cx="170" cy="170" r="161" stroke="rgba(201,164,85,0.08)" stroke-width="1"/>'
        + ticks +
        '<defs><path id="arc1" d="M 170,170 m -136,0 a 136,136 0 1,1 272,0 a 136,136 0 1,1 -272,0"/></defs>'
        '<text font-size="9" fill="rgba(201,164,85,0.44)" font-family="-apple-system,sans-serif" font-weight="700" letter-spacing="4">'
        '<textPath href="#arc1">AES-256 ·  SECURE ENCLAVE ·  FULLY OFFLINE ·  BIOMETRIC ·  </textPath></text>'
        '<circle cx="170" cy="170" r="108" stroke="rgba(201,164,85,0.18)" stroke-width="1.5" stroke-dasharray="3 5"/>'
        '<circle cx="170" cy="170" r="87" fill="rgba(201,164,85,0.07)" stroke="rgba(201,164,85,0.30)" stroke-width="1.5"/>'
        '<circle cx="170" cy="170" r="65" fill="rgba(201,164,85,0.10)"/>'
        '<path d="M170 138 c-2-2-26-8-26 4v18c0 16 26 27 26 27s26-11 26-27v-18c0-12-24-6-26-4z" '
        'stroke="rgba(201,164,85,0.88)" stroke-width="2" fill="rgba(201,164,85,0.14)" stroke-linejoin="round" transform="translate(0 7)"/>'
        '<path d="M161 163 l5.5 6.5 10-13.5" stroke="#C9A455" stroke-width="2.5" '
        'stroke-linecap="round" stroke-linejoin="round" transform="translate(0 7)"/>'
    )
    wheel = f'<svg width="{ws}" height="{ws}" viewBox="0 0 340 340" fill="none" xmlns="http://www.w3.org/2000/svg">{wheel_inner}</svg>'

    def pill(emoji, label):
        return (f'<div style="display:flex;align-items:center;gap:{s(6)}px;'
                f'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);'
                f'border-radius:999px;padding:{s(10)}px {s(17)}px;">'
                f'<span style="font-size:{s(14)}px;">{emoji}</span>'
                f'<span style="font-size:{psz}px;color:rgba(255,255,255,0.60);font-weight:500;'
                f"white-space:nowrap;font-family:'DM Sans',sans-serif;\">{label}</span>"
                f'</div>')

    bk  = f'<div style="position:absolute;left:{s(36)}px;top:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-left:1px solid rgba(201,164,85,0.12);border-top:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>'
    bk += f'<div style="position:absolute;right:{s(36)}px;top:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-right:1px solid rgba(201,164,85,0.12);border-top:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>'
    bk += f'<div style="position:absolute;left:{s(36)}px;bottom:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-left:1px solid rgba(201,164,85,0.12);border-bottom:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>'
    bk += f'<div style="position:absolute;right:{s(36)}px;bottom:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-right:1px solid rgba(201,164,85,0.12);border-bottom:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>'

    return f'''<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:{w}px; height:{h}px; overflow:hidden; }}</style>
</head><body>
<div style="width:{w}px;height:{h}px;
  background-color:#060504;
  background-image:
    radial-gradient(circle,rgba(201,164,85,0.05) 1px,transparent 1px),
    radial-gradient(ellipse {s(900)}px {s(660)}px at 50% 38%,rgba(80,50,6,0.54) 0%,rgba(30,18,2,0.28) 42%,transparent 68%),
    radial-gradient(ellipse {s(480)}px {s(300)}px at 18% 82%,rgba(55,34,4,0.26) 0%,transparent 55%),
    radial-gradient(ellipse {s(380)}px {s(240)}px at 84% 70%,rgba(65,40,5,0.20) 0%,transparent 52%);
  background-size:{s(40)}px {s(40)}px,100% 100%,100% 100%,100% 100%;
  position:relative;display:flex;flex-direction:column;align-items:center;
  overflow:hidden;font-family:'DM Sans',sans-serif;">
  {bk}
  <div style="height:{th}px;width:100%;display:flex;align-items:center;justify-content:center;gap:{s(12)}px;flex-shrink:0;z-index:1;">
    <div style="width:{s(35)}px;height:{s(35)}px;border-radius:{s(9)}px;background:rgba(201,164,85,0.10);border:1px solid rgba(201,164,85,0.22);display:flex;align-items:center;justify-content:center;">{icon(LOCK_I, s(16), '#C9A455')}</div>
    <span style="font-size:{tsz}px;font-weight:600;letter-spacing:4px;color:rgba(255,255,255,0.65);text-transform:uppercase;">CARD VAULT</span>
  </div>
  <div style="flex:1;min-height:0;"></div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:{gap}px;width:100%;flex-shrink:0;">
    <div style="position:relative;display:flex;align-items:center;justify-content:center;">
      <div style="position:absolute;width:{s(280)}px;height:{s(280)}px;border-radius:50%;background:radial-gradient(circle,rgba(160,100,8,0.30) 0%,transparent 68%);filter:blur({s(42)}px);pointer-events:none;"></div>
      {wheel}
    </div>
    <div style="text-align:center;padding:0 {s(60)}px;width:100%;">
      <div style="font-size:{hs}px;font-weight:700;color:#F0ECE4;line-height:1.04;font-family:'Playfair Display',serif;letter-spacing:-1px;">Zero.</div>
      <div style="font-size:{hs}px;font-weight:700;font-style:italic;color:#C9A455;line-height:1.04;font-family:'Playfair Display',serif;letter-spacing:-1px;margin-bottom:{s(18)}px;">Compromise.</div>
      <div style="width:{s(44)}px;height:{s(2)}px;background:linear-gradient(90deg,transparent,rgba(201,164,85,0.38),transparent);border-radius:999px;margin:0 auto {s(16)}px;"></div>
      <div style="font-size:{sub_sz}px;color:rgba(255,255,255,0.28);line-height:1.65;font-family:'DM Sans',sans-serif;">Military-grade AES-256 encryption.<br>Your keys never leave your device.</div>
    </div>
    <div style="display:flex;gap:{s(10)}px;justify-content:center;flex-wrap:wrap;padding:0 {s(50)}px;width:100%;">
      {pill('🔐','AES-256')}{pill('📴','Offline')}{pill('🔑','Secure Enclave')}{pill('👆','Biometric')}
    </div>
  </div>
  <div style="flex:1;min-height:0;"></div>
  <div style="height:{bot_h}px;width:100%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    <span style="font-size:{fsz}px;letter-spacing:3px;color:rgba(255,255,255,0.14);font-weight:500;text-transform:uppercase;font-family:'DM Sans',sans-serif;">NO INTERNET · NO SERVERS · NO ACCOUNTS</span>
  </div>
</div>
</body></html>'''


# ─── Artistic full-page: SETTINGS (SS6) ──────────────────────────────────────
def generate_settings_art_html(device):
    w, h = device['w'], device['h']
    def s(n): return round(n * w / 1080)
    hs = s(76); sub_sz = s(24); psz = s(13); tsz = s(16); fsz = s(11)
    th = s(108); bot_h = s(84); gap = s(30)

    margin   = s(40)
    tile_gap = s(16)
    tile_w   = (w - 2 * margin - tile_gap) // 2
    tile_h   = s(330)

    def pill(emoji, label):
        return (f'<div style="display:flex;align-items:center;gap:{s(6)}px;'
                f'background:rgba(255,255,255,0.05);border:1px solid rgba(255,255,255,0.09);'
                f'border-radius:999px;padding:{s(10)}px {s(17)}px;">'
                f'<span style="font-size:{s(14)}px;">{emoji}</span>'
                f'<span style="font-size:{psz}px;color:rgba(255,255,255,0.60);font-weight:500;'
                f"white-space:nowrap;font-family:'DM Sans',sans-serif;\">{label}</span>"
                f'</div>')

    bk  = f'<div style="position:absolute;left:{s(36)}px;top:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-left:1px solid rgba(201,164,85,0.12);border-top:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>'
    bk += f'<div style="position:absolute;right:{s(36)}px;top:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-right:1px solid rgba(201,164,85,0.12);border-top:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>'
    bk += f'<div style="position:absolute;left:{s(36)}px;bottom:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-left:1px solid rgba(201,164,85,0.12);border-bottom:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>'
    bk += f'<div style="position:absolute;right:{s(36)}px;bottom:{s(36)}px;width:{s(50)}px;height:{s(50)}px;border-right:1px solid rgba(201,164,85,0.12);border-bottom:1px solid rgba(201,164,85,0.12);pointer-events:none;"></div>'

    # ── Tile art SVGs ──────────────────────────────────────────────────────────
    fp_sz = s(110)
    fp_svg = (
        f'<svg width="{fp_sz}" height="{fp_sz}" viewBox="0 0 120 120" fill="none">'
        '<circle cx="60" cy="72" r="6" fill="rgba(201,164,85,0.90)"/>'
        '<path d="M 50,72 a 10,10 0 0,1 20,0" stroke="rgba(201,164,85,0.80)" stroke-width="2.2" stroke-linecap="round" fill="none"/>'
        '<path d="M 42,72 a 18,18 0 0,1 36,0" stroke="rgba(201,164,85,0.66)" stroke-width="2" stroke-linecap="round" fill="none"/>'
        '<path d="M 34,72 a 26,26 0 0,1 52,0" stroke="rgba(201,164,85,0.50)" stroke-width="1.8" stroke-linecap="round" fill="none"/>'
        '<path d="M 26,72 a 34,34 0 0,1 68,0 a 34,34 0 0,1 -10 26" stroke="rgba(201,164,85,0.36)" stroke-width="1.5" stroke-linecap="round" fill="none"/>'
        '<path d="M 18,72 a 42,42 0 0,1 84,0 a 42,42 0 0,1 -14 32" stroke="rgba(201,164,85,0.22)" stroke-width="1.2" stroke-linecap="round" fill="none"/>'
        '<path d="M 10,72 a 50,50 0 0,1 100,0 a 50,50 0 0,1 -18 36" stroke="rgba(201,164,85,0.12)" stroke-width="1.0" stroke-linecap="round" fill="none"/>'
        '</svg>'
    )

    pin_sz_w = s(140); pin_sz_h = s(48)
    pin_svg = (
        f'<svg width="{pin_sz_w}" height="{pin_sz_h}" viewBox="0 0 140 48" fill="none">'
        '<circle cx="17" cy="24" r="13" fill="rgba(201,164,85,0.90)" stroke="rgba(201,164,85,0.50)" stroke-width="1"/>'
        '<circle cx="52" cy="24" r="13" fill="rgba(201,164,85,0.75)" stroke="rgba(201,164,85,0.40)" stroke-width="1"/>'
        '<circle cx="87" cy="24" r="13" fill="rgba(201,164,85,0.55)" stroke="rgba(201,164,85,0.30)" stroke-width="1"/>'
        '<circle cx="122" cy="24" r="13" fill="none" stroke="rgba(201,164,85,0.45)" stroke-width="1.8"/>'
        '</svg>'
    )

    up_sz = s(96)
    up_svg = (
        f'<svg width="{up_sz}" height="{up_sz}" viewBox="0 0 96 96" fill="none">'
        '<line x1="48" y1="76" x2="48" y2="30" stroke="rgba(201,164,85,0.85)" stroke-width="3" stroke-linecap="round"/>'
        '<polyline points="34,44 48,30 62,44" fill="none" stroke="rgba(201,164,85,0.85)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        '<line x1="20" y1="83" x2="76" y2="83" stroke="rgba(201,164,85,0.35)" stroke-width="2" stroke-linecap="round"/>'
        '<circle cx="22" cy="52" r="2.5" fill="rgba(201,164,85,0.38)"/>'
        '<circle cx="74" cy="46" r="2" fill="rgba(201,164,85,0.28)"/>'
        '<circle cx="18" cy="68" r="1.5" fill="rgba(201,164,85,0.20)"/>'
        '<circle cx="80" cy="66" r="2" fill="rgba(201,164,85,0.24)"/>'
        '</svg>'
    )

    dn_sz = s(96)
    dn_svg = (
        f'<svg width="{dn_sz}" height="{dn_sz}" viewBox="0 0 96 96" fill="none">'
        '<path d="M 18,46 a 30,30 0 1,1 60,0" stroke="rgba(201,164,85,0.35)" stroke-width="2" stroke-linecap="round" stroke-dasharray="4 4"/>'
        '<line x1="48" y1="26" x2="48" y2="68" stroke="rgba(201,164,85,0.85)" stroke-width="3" stroke-linecap="round"/>'
        '<polyline points="34,54 48,68 62,54" fill="none" stroke="rgba(201,164,85,0.85)" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>'
        '<line x1="20" y1="83" x2="76" y2="83" stroke="rgba(201,164,85,0.35)" stroke-width="2" stroke-linecap="round"/>'
        '</svg>'
    )

    def tile(art, title, desc, accent=False):
        bg     = 'linear-gradient(145deg,rgba(32,20,4,0.95) 0%,rgba(20,13,3,0.92) 100%)' if accent else 'rgba(255,255,255,0.035)'
        border = 'rgba(201,164,85,0.25)' if accent else 'rgba(255,255,255,0.07)'
        cr     = s(22)
        return (
            f'<div style="width:{tile_w}px;height:{tile_h}px;border-radius:{cr}px;'
            f'background:{bg};border:1px solid {border};'
            f'display:flex;flex-direction:column;align-items:center;padding:{s(28)}px {s(16)}px {s(22)}px;overflow:hidden;">'
            f'<div style="flex:1;display:flex;align-items:center;justify-content:center;">{art}</div>'
            f'<div style="text-align:center;margin-top:{s(16)}px;flex-shrink:0;">'
            f'<div style="font-size:{s(22)}px;font-weight:700;color:#F0ECE4;'
            f"font-family:'Playfair Display',serif;margin-bottom:{s(7)}px;\">{title}</div>"
            f'<div style="font-size:{s(14)}px;color:rgba(255,255,255,0.38);'
            f"font-family:'DM Sans',sans-serif;line-height:1.5;\">{desc}</div>"
            f'</div></div>'
        )

    grid = (
        f'<div style="display:flex;flex-direction:column;gap:{tile_gap}px;">'
        f'<div style="display:flex;gap:{tile_gap}px;">'
        f'{tile(fp_svg, "Fingerprint", "One touch to unlock", accent=True)}'
        f'{tile(pin_svg, "Change PIN", "Update your access code")}'
        f'</div>'
        f'<div style="display:flex;gap:{tile_gap}px;">'
        f'{tile(up_svg, "Backup", "Encrypted &amp; portable")}'
        f'{tile(dn_svg, "Restore", "Recover your vault")}'
        f'</div>'
        f'</div>'
    )

    return f'''<!DOCTYPE html>
<html><head><meta charset="UTF-8">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>* {{ margin:0; padding:0; box-sizing:border-box; }}
html, body {{ width:{w}px; height:{h}px; overflow:hidden; }}</style>
</head><body>
<div style="width:{w}px;height:{h}px;
  background-color:#060504;
  background-image:
    radial-gradient(circle,rgba(201,164,85,0.05) 1px,transparent 1px),
    radial-gradient(ellipse {s(900)}px {s(560)}px at 50% 82%,rgba(75,46,6,0.52) 0%,rgba(28,17,2,0.22) 42%,transparent 68%),
    radial-gradient(ellipse {s(500)}px {s(320)}px at 10% 28%,rgba(55,34,4,0.22) 0%,transparent 55%),
    radial-gradient(ellipse {s(360)}px {s(220)}px at 92% 20%,rgba(60,38,5,0.18) 0%,transparent 52%);
  background-size:{s(40)}px {s(40)}px,100% 100%,100% 100%,100% 100%;
  position:relative;display:flex;flex-direction:column;align-items:center;
  overflow:hidden;font-family:'DM Sans',sans-serif;">
  {bk}
  <div style="height:{th}px;width:100%;display:flex;align-items:center;justify-content:center;gap:{s(12)}px;flex-shrink:0;z-index:1;">
    <div style="width:{s(35)}px;height:{s(35)}px;border-radius:{s(9)}px;background:rgba(201,164,85,0.10);border:1px solid rgba(201,164,85,0.22);display:flex;align-items:center;justify-content:center;">{icon(LOCK_I, s(16), '#C9A455')}</div>
    <span style="font-size:{tsz}px;font-weight:600;letter-spacing:4px;color:rgba(255,255,255,0.65);text-transform:uppercase;">CARD VAULT</span>
  </div>
  <div style="flex:1;min-height:0;"></div>
  <div style="display:flex;flex-direction:column;align-items:center;gap:{gap}px;width:100%;flex-shrink:0;padding:0 {margin}px;">
    {grid}
    <div style="text-align:center;width:100%;">
      <div style="font-size:{hs}px;font-weight:700;color:#F0ECE4;line-height:1.04;font-family:'Playfair Display',serif;letter-spacing:-1px;">Your vault,</div>
      <div style="font-size:{hs}px;font-weight:700;font-style:italic;color:#C9A455;line-height:1.04;font-family:'Playfair Display',serif;letter-spacing:-1px;margin-bottom:{s(16)}px;">your rules.</div>
      <div style="width:{s(44)}px;height:{s(2)}px;background:linear-gradient(90deg,transparent,rgba(201,164,85,0.38),transparent);border-radius:999px;margin:0 auto {s(14)}px;"></div>
      <div style="font-size:{sub_sz}px;color:rgba(255,255,255,0.28);line-height:1.60;font-family:'DM Sans',sans-serif;">Backup, restore, and manage<br>with complete control.</div>
    </div>
    <div style="display:flex;gap:{s(10)}px;justify-content:center;flex-wrap:wrap;width:100%;">
      {pill('🔒','Auto-lock')}{pill('☁️','Backup')}{pill('🔑','PIN Lock')}{pill('👆','Biometric')}
    </div>
  </div>
  <div style="flex:1;min-height:0;"></div>
  <div style="height:{bot_h}px;width:100%;display:flex;align-items:center;justify-content:center;flex-shrink:0;">
    <span style="font-size:{fsz}px;letter-spacing:3px;color:rgba(255,255,255,0.14);font-weight:500;text-transform:uppercase;font-family:'DM Sans',sans-serif;">BACKUP · RESTORE · BIOMETRIC · AUTO-LOCK</span>
  </div>
</div>
</body></html>'''


# ─── HTML generator for screenshots 2–6 ──────────────────────────────────────
def generate_html(device, ss):
    w, h = device['w'], device['h']
    fw, fh, fr = device['fw'], device['fh'], device['fr']
    iw, ih, ir = device['iw'], device['ih'], device['ir']
    sc         = device['sc']
    hs, ss_sz, bs, tp = device['hs'], device['ss'], device['bs'], device['tp']

    app_html = ss['fn']()

    frame_left = (w - fw) // 2
    frame_top  = h - fh - 24
    pad_w = (fw - iw) // 2
    pad_h = (fh - ih) // 2

    # ── Optional floating "Number Revealed" popup (SS3) ─────────────────────
    popup_html = ''
    if ss.get('popup'):
        pw  = round(fw * 0.84)
        pl  = (w - pw) // 2
        pt  = frame_top + fh - round(fh * 0.052)  # overlaps bottom ~5% of device
        pp  = round(fw * 0.048)        # padding
        fz1 = round(fw * 0.050)        # title font
        fz2 = round(fw * 0.036)        # subtitle font
        fz3 = round(fw * 0.042)        # card number font
        isz = round(fw * 0.076)        # icon circle size
        br  = round(fr * 0.55)         # border radius of popup
        ei  = round(isz * 0.48)        # eye icon size inside circle
        popup_html = f'''<div style="position:absolute;left:{pl}px;top:{pt}px;width:{pw}px;
          z-index:6;
          background:linear-gradient(170deg,#0F0D0A 0%,#0C0A07 100%);
          border:1px solid rgba(201,164,85,0.32);
          border-radius:{br}px;
          box-shadow:
            0 {round(fw*0.06)}px {round(fw*0.14)}px rgba(0,0,0,0.98),
            0 0 {round(fw*0.09)}px rgba(120,76,8,0.22),
            inset 0 1px 0 rgba(225,178,78,0.20);
          padding:{pp}px;">
          <div style="width:{round(pw*0.07)}px;height:{round(pw*0.009)}px;background:rgba(255,255,255,0.14);border-radius:999px;margin:0 auto {round(pp*0.55)}px;"></div>
          <div style="display:flex;align-items:center;gap:{round(pp*0.55)}px;margin-bottom:{round(pp*0.55)}px;">
            <div style="width:{isz}px;height:{isz}px;border-radius:50%;background:rgba(201,164,85,0.10);border:1px solid rgba(201,164,85,0.24);display:flex;align-items:center;justify-content:center;flex-shrink:0;">
              <svg xmlns="http://www.w3.org/2000/svg" width="{ei}" height="{ei}" viewBox="0 0 24 24" fill="none" stroke="rgba(201,164,85,0.85)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
            </div>
            <div>
              <div style="font-size:{fz1}px;font-weight:700;color:#F0ECE4;font-family:-apple-system,sans-serif;line-height:1.2;">Number Revealed</div>
              <div style="font-size:{fz2}px;color:rgba(201,164,85,0.65);font-family:-apple-system,sans-serif;margin-top:{round(fz2*0.22)}px;">Auto-hides in 5 seconds</div>
            </div>
          </div>
          <div style="background:rgba(201,164,85,0.07);border:1px solid rgba(201,164,85,0.20);border-radius:{round(br*0.55)}px;padding:{round(pp*0.50)}px {round(pp*0.65)}px;text-align:center;">
            <span style="font-size:{fz3}px;font-family:Menlo,monospace;color:rgba(255,218,155,0.92);letter-spacing:{round(fz3*0.14)}px;font-weight:500;">4242  4242  4242  2832</span>
          </div>
        </div>'''

    return f'''<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width={w},height={h},initial-scale=1">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;1,700&family=DM+Sans:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{{margin:0;padding:0;box-sizing:border-box;}}
html,body{{width:{w}px;height:{h}px;overflow:hidden;}}
.ss{{
  width:{w}px;height:{h}px;
  background-color:#050403;
  background-image:
    radial-gradient(circle,rgba(201,164,85,0.052) 1px,transparent 1px),
    radial-gradient(ellipse {round(w*0.90)}px {round(h*0.44)}px at 50% 0px,
      rgba(168,104,12,0.54) 0%,rgba(95,58,8,0.28) 38%,transparent 64%),
    radial-gradient(ellipse {round(w*0.56)}px {round(h*0.38)}px at {round(w*0.08)}px {h}px,
      rgba(108,66,8,0.32) 0%,transparent 58%),
    radial-gradient(ellipse {round(w*0.44)}px {round(h*0.30)}px at {round(w*0.94)}px {round(h*0.68)}px,
      rgba(136,86,10,0.22) 0%,transparent 56%);
  background-size:{round(w*0.038)}px {round(w*0.038)}px,100% 100%,100% 100%,100% 100%;
  position:relative;overflow:hidden;
}}
.ss::after{{
  content:'';position:absolute;inset:0;
  background:
    radial-gradient(ellipse 32% 55% at 0% 50%,rgba(0,0,0,0.14) 0%,transparent 62%),
    radial-gradient(ellipse 32% 55% at 100% 50%,rgba(0,0,0,0.14) 0%,transparent 62%);
  pointer-events:none;z-index:0;
}}
.headline-section{{
  position:absolute;left:0;right:0;top:{tp}px;
  text-align:center;padding:0 {round(w*0.07)}px;
  z-index:2;
}}
.badge{{
  display:inline-flex;align-items:center;gap:{round(bs*0.45)}px;
  background:rgba(168,104,12,0.13);
  border:1px solid rgba(201,164,85,0.30);
  border-radius:999px;
  padding:{round(bs*0.45)}px {round(bs*1.1)}px;
  margin-bottom:{round(hs*0.48)}px;
  color:rgba(201,164,85,0.80);
  font-size:{bs}px;
  letter-spacing:2px;
  font-family:'DM Sans',sans-serif;
  text-transform:uppercase;
  box-shadow:0 0 {round(bs*1.8)}px rgba(168,104,12,0.16);
}}
.badge-dot{{
  width:{round(bs*0.38)}px;height:{round(bs*0.38)}px;
  border-radius:50%;background:#C9A455;flex-shrink:0;
  box-shadow:0 0 {round(bs*0.55)}px rgba(201,164,85,0.65);
}}
.headline{{
  font-family:'Playfair Display',serif;
  font-size:{hs}px;
  font-weight:700;
  color:#F0ECE4;
  line-height:1.06;
  letter-spacing:{round(-hs*0.018)}px;
  margin-bottom:{round(hs*0.28)}px;
}}
.rule{{
  width:{round(w*0.042)}px;height:2px;
  background:linear-gradient(90deg,transparent,rgba(201,164,85,0.40),transparent);
  border-radius:999px;margin:{round(hs*0.26)}px auto 0;
}}
.sub{{
  font-family:'DM Sans',sans-serif;
  font-size:{ss_sz}px;
  color:#484848;
  letter-spacing:0.3px;
  margin-top:{round(ss_sz*0.5)}px;
}}
/* Ambient glow behind device */
.device-glow{{
  position:absolute;
  left:{frame_left - round(fw*0.14)}px;
  top:{frame_top + round(fh*0.18)}px;
  width:{round(fw*1.28)}px;
  height:{round(fh*0.62)}px;
  background:radial-gradient(ellipse at 50% 50%,rgba(25,16,3,0.32) 0%,transparent 68%);
  pointer-events:none;z-index:1;
  filter:blur({round(fw*0.09)}px);
}}
/* Device wrapper — handles position */
.device-tilt{{
  position:absolute;
  left:{frame_left}px;top:{frame_top}px;
  width:{fw}px;height:{fh}px;
  z-index:3;
}}
/* Outer shell — visual styling, border-radius, overflow clipping */
.frame-outer{{
  position:relative;
  width:{fw}px;height:{fh}px;
  border-radius:{fr}px;
  background:linear-gradient(155deg,#1E1C18 0%,#141210 45%,#100E0C 100%);
  border:1px solid rgba(201,164,85,0.14);
  box-shadow:
    0 0 0 1px rgba(0,0,0,0.98),
    0 80px 300px rgba(0,0,0,0.98),
    0 0 130px rgba(140,90,10,0.16),
    inset 0 1.5px 0 rgba(220,175,75,0.32),
    inset 1px 0 0 rgba(180,120,20,0.11),
    inset -1px 0 0 rgba(100,70,10,0.07);
  overflow:hidden;
}}
/* Left rim warm light streak */
.frame-outer::before{{
  content:'';
  position:absolute;
  left:0;top:{round(fh*0.06)}px;
  width:1px;height:{round(fh*0.48)}px;
  background:linear-gradient(180deg,transparent,rgba(201,164,85,0.30),transparent);
  border-radius:999px;
}}
.frame-inner{{
  position:absolute;
  left:{pad_w}px;top:{pad_h}px;
  width:{iw}px;height:{ih}px;
  border-radius:{ir}px;
  overflow:hidden;
  background:#080808;
}}
.app-wrap{{
  width:452px;height:1008px;
  transform:scale({sc:.4f});
  transform-origin:0 0;
  position:absolute;left:0;top:0;
}}
.btn-right{{
  position:absolute;right:-4px;top:{round(fh*0.20)}px;
  width:4px;height:{round(fh*0.08)}px;
  background:#1C1A16;border-radius:0 3px 3px 0;
}}
.btn-left{{
  position:absolute;left:-4px;top:{round(fh*0.18)}px;
  width:4px;height:{round(fh*0.06)}px;
  background:#1C1A16;border-radius:3px 0 0 3px;
  box-shadow:0 {round(fh*0.09)}px 0 #1C1A16,0 {round(fh*0.17)}px 0 #1C1A16;
}}
.notch{{
  position:absolute;
  left:50%;top:{pad_h + 10}px;
  transform:translateX(-50%);
  width:{round(iw*0.18)}px;height:{round(iw*0.025)}px;
  background:#0C0A08;
  border-radius:999px;
  z-index:4;
}}
</style>
</head>
<body>
<div class="ss">
  <div class="headline-section">
    <div class="badge"><span class="badge-dot"></span>{ss['badge']}</div>
    <div class="headline">{ss['headline']}</div>
    <div class="rule"></div>
    <div class="sub">{ss['sub']}</div>
  </div>
  <div class="device-glow"></div>
  <div class="device-tilt">
    <div class="frame-outer">
      <div class="btn-right"></div>
      <div class="btn-left"></div>
      <div class="frame-inner">
        <div class="app-wrap">
          {app_html}
        </div>
      </div>
      <div class="notch"></div>
    </div>
  </div>
  {popup_html}
</div>
</body>
</html>'''


# ─── Screenshot configs — app flow order ──────────────────────────────────────
SCREENSHOTS = [
    dict(id=1, intro=True),
    dict(id=2, fn=screen_home,
         badge='CARD VAULT',
         headline='All your cards,<br><em style="color:#C9A455;font-style:italic">in one place.</em>',
         sub='Grouped by brand, bank, or expiry.'),
    dict(id=3, fn=screen_card_details,
         badge='CARD DETAILS',
         headline='Reveal, copy,<br><em style="color:#C9A455;font-style:italic">stay private.</em>',
         sub='Numbers auto-hide in 5s. Clipboard clears in 20s.'),
    dict(id=4, fn=screen_scan,
         badge='INSTANT SCAN',
         headline='Scan your card<br><em style="color:#C9A455;font-style:italic">in seconds.</em>',
         sub='On-device OCR — your data never leaves.'),
    dict(id=5, art_fn=generate_security_art_html),
    dict(id=6, art_fn=generate_settings_art_html),
]

# ─── Main ─────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    count = 0
    for device in DEVICES:
        folder = os.path.join(ROOT, 'store-screenshots', device['folder'])
        os.makedirs(folder, exist_ok=True)
        for ss in SCREENSHOTS:
            if ss.get('intro'):
                html = generate_intro_html(device)
            elif ss.get('art_fn'):
                html = ss['art_fn'](device)
            else:
                html = generate_html(device, ss)
            path = os.path.join(folder, f"screenshot-{ss['id']}.html")
            with open(path, 'w', encoding='utf-8') as f:
                f.write(html)
            count += 1
            print(f"  ✓ {device['folder']}/screenshot-{ss['id']}.html")
    print(f"\nGenerated {count} screenshots in store-screenshots/")
