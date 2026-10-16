// The robot from Beep Boop Robot, shared by the robot games.
//   RobotArt.svg({ color, head, eyes, antenna, bottom })
// Each part is wrapped in <g data-part="..."> so games can tell which part was tapped.
(() => {
  function shade(hex, amt) {
    const n = parseInt(hex.slice(1), 16);
    const c = v => Math.max(0, Math.min(255, v + amt));
    return '#' + [c(n >> 16), c((n >> 8) & 255), c(n & 255)].map(v => v.toString(16).padStart(2, '0')).join('');
  }
  function robotSVG(d) {
    const c = d.color, dk = shade(c, -45), lt = shade(c, 40);
    let s = '<svg viewBox="0 0 200 240" xmlns="http://www.w3.org/2000/svg">';
    // antenna
    s += '<g data-part="antenna">';
    if (d.antenna === 'ball') s += '<line x1="100" y1="44" x2="100" y2="14" stroke="#64748b" stroke-width="6" stroke-linecap="round"/><circle class="blinky" cx="100" cy="12" r="11" fill="#ff5c8a" stroke="#be185d" stroke-width="3"/>';
    if (d.antenna === 'double') s += '<line x1="80" y1="44" x2="64" y2="12" stroke="#64748b" stroke-width="6" stroke-linecap="round"/><line x1="120" y1="44" x2="136" y2="12" stroke="#64748b" stroke-width="6" stroke-linecap="round"/><circle class="blinky" cx="64" cy="11" r="9" fill="#fde047" stroke="#ca8a04" stroke-width="3"/><circle cx="136" cy="11" r="9" fill="#fde047" stroke="#ca8a04" stroke-width="3"/>';
    if (d.antenna === 'bolt') s += '<path d="M110 0 L84 30 H100 L88 52 L122 18 H105 Z" fill="#fde047" stroke="#ca8a04" stroke-width="3" stroke-linejoin="round"/>';
    s += '</g>';
    // arms
    s += `<rect x="18" y="128" width="30" height="16" rx="8" fill="#94a3b8"/><rect x="152" y="128" width="30" height="16" rx="8" fill="#94a3b8"/>`;
    s += `<circle cx="16" cy="136" r="13" fill="${c}" stroke="${dk}" stroke-width="4"/><circle cx="184" cy="136" r="13" fill="${c}" stroke="${dk}" stroke-width="4"/>`;
    // bottom
    s += '<g data-part="bottom">';
    if (d.bottom === 'wheels') s += '<circle cx="66" cy="212" r="24" fill="#334155"/><circle cx="66" cy="212" r="10" fill="#cbd5e1"/><circle cx="134" cy="212" r="24" fill="#334155"/><circle cx="134" cy="212" r="10" fill="#cbd5e1"/>';
    if (d.bottom === 'legs') s += `<rect x="66" y="190" width="22" height="36" rx="6" fill="#94a3b8"/><rect x="112" y="190" width="22" height="36" rx="6" fill="#94a3b8"/><ellipse cx="74" cy="228" rx="22" ry="10" fill="${dk}"/><ellipse cx="126" cy="228" rx="22" ry="10" fill="${dk}"/>`;
    if (d.bottom === 'treads') s += '<rect x="34" y="192" width="132" height="44" rx="22" fill="#334155"/>' + [56, 85, 115, 144].map(x => `<circle cx="${x}" cy="214" r="10" fill="#cbd5e1"/>`).join('');
    s += '</g>';
    // body
    s += '<g data-part="color">';
    s += `<rect x="44" y="108" width="112" height="92" rx="20" fill="${c}" stroke="${dk}" stroke-width="5"/>`;
    s += `<rect x="66" y="126" width="68" height="40" rx="10" fill="${lt}" stroke="${dk}" stroke-width="3"/>`;
    s += '<circle class="blinky" cx="82" cy="146" r="7" fill="#ef4444"/><circle cx="100" cy="146" r="7" fill="#facc15"/><circle class="blinky" cx="118" cy="146" r="7" fill="#22c55e" style="animation-delay:.6s"/>';
    s += `<rect x="72" y="176" width="56" height="8" rx="4" fill="${dk}" opacity=".5"/>`;
    s += '</g>';
    // neck + head
    s += '<g data-part="head">';
    s += '<rect x="88" y="96" width="24" height="16" fill="#94a3b8"/>';
    if (d.head === 'square') s += `<rect x="40" y="38" width="120" height="66" rx="16" fill="${c}" stroke="${dk}" stroke-width="5"/>`;
    if (d.head === 'round') s += `<ellipse cx="100" cy="70" rx="66" ry="40" fill="${c}" stroke="${dk}" stroke-width="5"/>`;
    if (d.head === 'dome') s += `<path d="M40 104 V78 A60 52 0 0 1 160 78 V104 Z" fill="${c}" stroke="${dk}" stroke-width="5" stroke-linejoin="round"/>`;
    s += '</g>';
    // eyes
    s += '<g data-part="eyes">';
    const ey = d.head === 'dome' ? 76 : 68;
    if (d.eyes === 'round') s += `<circle cx="74" cy="${ey}" r="15" fill="#fff" stroke="#1e293b" stroke-width="4"/><circle cx="126" cy="${ey}" r="15" fill="#fff" stroke="#1e293b" stroke-width="4"/><circle cx="77" cy="${ey}" r="7" fill="#1e293b"/><circle cx="129" cy="${ey}" r="7" fill="#1e293b"/>`;
    if (d.eyes === 'visor') s += `<rect x="54" y="${ey - 13}" width="92" height="26" rx="13" fill="#22d3ee" stroke="#0e7490" stroke-width="4"/><rect class="blinky" x="66" y="${ey - 6}" width="22" height="8" rx="4" fill="#ecfeff"/>`;
    if (d.eyes === 'cyclops') s += `<circle cx="100" cy="${ey}" r="22" fill="#fff" stroke="#1e293b" stroke-width="4"/><circle cx="103" cy="${ey}" r="10" fill="#1e293b"/><circle cx="106" cy="${ey - 4}" r="3" fill="#fff"/>`;
    s += '</g>';
    // smile
    s += `<path d="M84 ${ey + 22} Q100 ${ey + 32} 116 ${ey + 22}" fill="none" stroke="#1e293b" stroke-width="4" stroke-linecap="round"/>`;
    return s + '</svg>';
  }

  self.RobotArt = {
    svg: robotSVG,
    shade,
    COLORS: ['#60a5fa', '#f87171', '#fbbf24', '#34d399', '#c084fc', '#f472b6', '#94a3b8'],
    OPTIONS: {
      head: ['square', 'round', 'dome'],
      eyes: ['round', 'visor', 'cyclops'],
      antenna: ['ball', 'double', 'bolt', 'none'],
      bottom: ['wheels', 'legs', 'treads'],
    },
  };
})();
