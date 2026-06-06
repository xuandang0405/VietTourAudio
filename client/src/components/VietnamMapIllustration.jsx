function IslandCluster({ x, y, label, dots }) {
  return (
    <g className="island-cluster" transform={`translate(${x} ${y})`}>
      {dots.map(([cx, cy, r], index) => (
        <circle key={`${label}-${index}`} cx={cx} cy={cy} r={r} />
      ))}
      <text x="18" y="6">{label}</text>
    </g>
  );
}

function VietnamMapIllustration({ variant = 'splash' }) {
  return (
    <svg
      className={`vietnam-map-illustration ${variant}`}
      viewBox="0 0 280 420"
      role="img"
      aria-label="Bản đồ Việt Nam có hiển thị Hoàng Sa và Trường Sa"
    >
      <defs>
        <linearGradient id="vta-map-gradient" x1="0%" x2="100%" y1="0%" y2="100%">
          <stop offset="0%" stopColor="#0f766e" />
          <stop offset="100%" stopColor="#38bdf8" />
        </linearGradient>
        <filter id="vta-map-shadow" x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="14" stdDeviation="12" floodColor="#0f766e" floodOpacity="0.18" />
        </filter>
      </defs>

      <path className="sea-grid-line" d="M22 68 C92 40 178 46 252 78" />
      <path className="sea-grid-line" d="M20 158 C90 132 188 142 258 178" />
      <path className="sea-grid-line" d="M18 256 C94 232 176 246 262 284" />
      <path className="sea-grid-line" d="M24 350 C96 328 182 336 256 378" />

      <path
        className="vietnam-shape"
        filter="url(#vta-map-shadow)"
        d="M116 22
          C96 38 88 58 96 78
          C104 98 102 116 88 130
          C70 148 72 174 96 186
          C116 196 121 210 106 226
          C88 246 88 270 108 288
          C128 306 131 326 116 344
          C100 363 107 385 132 397
          C155 407 178 397 182 374
          C186 350 169 334 151 318
          C132 300 130 282 150 264
          C169 247 171 225 154 210
          C134 192 136 174 160 156
          C182 140 184 112 166 94
          C148 78 149 58 169 42
          C151 30 134 22 116 22 Z"
      />

      <path
        className="coast-highlight"
        d="M142 47 C130 73 136 92 155 112 C170 128 168 143 148 160 C129 178 132 195 151 213 C167 229 164 247 145 265 C127 283 130 303 150 322 C166 337 170 356 160 380"
      />

      <IslandCluster
        x={188}
        y={138}
        label="Hoàng Sa"
        dots={[
          [0, 0, 3.6],
          [12, 7, 2.8],
          [7, -9, 2.4],
          [23, -2, 2.2],
          [28, 11, 1.9]
        ]}
      />
      <IslandCluster
        x={178}
        y={262}
        label="Trường Sa"
        dots={[
          [0, 0, 3.4],
          [14, 10, 2.7],
          [28, 2, 2.2],
          [39, 15, 2],
          [18, -12, 2.4],
          [52, 3, 1.8]
        ]}
      />

      <g className="map-city-points">
        <circle cx="126" cy="112" r="4" />
        <circle cx="150" cy="198" r="4" />
        <circle cx="142" cy="306" r="4" />
      </g>
    </svg>
  );
}

export default VietnamMapIllustration;
