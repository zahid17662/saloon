/**
 * Flat barbershop interior drawn for this project: brick feature walls, a door with an OPEN sign, mirrors,
 * a waiting sofa and two working stations. No outlines, blocks of colour only. Navy and blue with gold and orange.
 * The art is centred, so cropping the sides on a phone (preserveAspectRatio slice) keeps the main action.
 */
const C = {
  wall: "#D6E3F8", brick: "#8FAADB", mortar: "#A9BEE8", floor: "#7F9AD4", tile: "#97AFE0", ceil: "#EAF1FC",
  navy: "#0B1F4B", navy2: "#1E3F8F", mid: "#3B5FB8", glass: "#BDD3F6", glass2: "#D9E7FB",
  gold: "#F5C518", orange: "#F29A4A", orangeD: "#DC8238", white: "#FFFFFF", cream: "#F7F2E8",
  skin: "#E7AD86", skinD: "#CF9068", hair: "#24171A", ginger: "#C8642F", red: "#E4574B", shoe: "#0A1636",
};

function Bricks({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const rows = Math.floor(h / 18);
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} fill={C.brick} />
      {Array.from({ length: rows }, (_, r) => (
        <g key={r}>
          <rect x={x} y={y + r * 18 + 16} width={w} height="2" fill={C.mortar} />
          {Array.from({ length: Math.ceil(w / 40) + 1 }, (_, i) => {
            const vx = x + i * 40 + (r % 2 ? 20 : 0);
            return vx < x + w ? <rect key={i} x={vx} y={y + r * 18} width="2" height="16" fill={C.mortar} /> : null;
          })}
        </g>
      ))}
    </g>
  );
}

function Mirror({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx="5" fill={C.white} />
      <rect x={x + 5} y={y + 5} width={w - 10} height={h - 10} rx="3" fill={C.glass} />
      <path d={`M${x + w * 0.18} ${y + h - 8}L${x + w * 0.7} ${y + 8}H${x + w * 0.88}L${x + w * 0.36} ${y + h - 8}z`} fill={C.glass2} />
      <path d={`M${x + w * 0.5} ${y + h - 8}L${x + w * 0.88} ${y + 36}V${y + 54}L${x + w * 0.68} ${y + h - 8}z`} fill={C.glass2} opacity=".7" />
      <rect x={x - 4} y={y - 10} width={w + 8} height="4" rx="2" fill={C.navy2} />
    </g>
  );
}

function Counter({ x, y, w, flip = false }: { x: number; y: number; w: number; flip?: boolean }) {
  const drawers = Math.floor(w / 62);
  return (
    <g>
      <rect x={x} y={y} width={w} height="10" rx="3" fill={C.orangeD} />
      <rect x={x + 4} y={y + 10} width={w - 8} height="58" fill={C.orange} />
      {Array.from({ length: drawers }, (_, i) => {
        const dx = x + 8 + i * ((w - 16) / drawers);
        const dw = (w - 16) / drawers - 6;
        return (
          <g key={i}>
            <rect x={dx} y={y + 16} width={dw} height="20" rx="2" fill={C.orangeD} opacity=".55" />
            <rect x={dx} y={y + 40} width={dw} height="20" rx="2" fill={C.orangeD} opacity=".55" />
            <rect x={dx + dw / 2 - 7} y={y + 25} width="14" height="3" rx="1.500" fill={C.cream} />
            <rect x={dx + dw / 2 - 7} y={y + 49} width="14" height="3" rx="1.500" fill={C.cream} />
          </g>
        );
      })}
      {/* bottles and a bowl on the top */}
      <g transform={`translate(${x + 14} ${y})`}>
        <rect x="0" y="-26" width="10" height="26" rx="3" fill={C.white} />
        <rect x="2" y="-32" width="6" height="7" rx="1.500" fill={C.navy2} />
        <rect x="18" y="-20" width="9" height="20" rx="3" fill={C.navy2} />
        <rect x="20" y="-24" width="5" height="5" rx="1" fill={C.white} />
        {w > 150 && <path d={flip ? "M44 0a14 9 0 0 0 28 0z" : "M40 0a14 9 0 0 0 28 0z"} fill={C.red} />}
      </g>
      {w > 200 && (
        <g transform={`translate(${x + w - 60} ${y})`}>
          <rect x="0" y="-22" width="10" height="22" rx="3" fill={C.red} />
          <rect x="2" y="-27" width="6" height="6" rx="1.500" fill={C.navy2} />
          <rect x="18" y="-16" width="14" height="16" rx="3" fill={C.white} />
        </g>
      )}
    </g>
  );
}

function Frame({ x, y, kind }: { x: number; y: number; kind: "scissors" | "razor" }) {
  return (
    <g>
      <rect x={x} y={y} width="62" height="62" fill={C.white} />
      <rect x={x + 5} y={y + 5} width="52" height="52" fill={C.glass2} />
      {kind === "scissors" ? (
        <g transform={`translate(${x + 31} ${y + 31}) rotate(-35)`} fill="none" stroke={C.navy2} strokeWidth="3" strokeLinecap="round">
          <path d="M-8 -14 8 14M8 -14-8 14" />
          <circle cx="-9" cy="17" r="5" /><circle cx="9" cy="17" r="5" />
        </g>
      ) : (
        <g transform={`translate(${x + 31} ${y + 31}) rotate(-40)`}>
          <rect x="-4" y="-20" width="8" height="26" rx="2" fill={C.navy2} />
          <rect x="-3" y="6" width="6" height="16" rx="3" fill={C.red} />
        </g>
      )}
    </g>
  );
}

function Door({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="104" height={270 - y} fill={C.navy2} />
      <rect x={x + 9} y={y + 9} width="86" height="118" fill={C.glass} />
      <path d={`M${x + 14} ${y + 122}L${x + 62} ${y + 12}H${x + 80}L${x + 32} ${y + 122}z`} fill={C.glass2} />
      <path d={`M${x + 50} ${y + 122}L${x + 88} ${y + 36}V${y + 56}L${x + 68} ${y + 122}z`} fill={C.glass2} opacity=".7" />
      <rect x={x + 9} y={y + 126} width="86" height="5" fill={C.navy2} />
      <rect x={x + 9} y={y + 137} width="86" height={270 - y - 146} rx="2" fill="#17306F" />
      <rect x={x + 70} y={y + 128} width="16" height="4" rx="2" fill={C.cream} />
      {/* OPEN sign */}
      <path d={`M${x + 42} ${y + 40}l10 -16 10 16`} fill="none" stroke={C.navy} strokeWidth="1.200" />
      <rect x={x + 28} y={y + 40} width="48" height="22" fill={C.white} stroke={C.red} strokeWidth="2" />
      <text x={x + 52} y={y + 55} textAnchor="middle" fontSize="12" fontWeight="700" fill={C.navy} style={{ fontFamily: "Poppins, Arial, sans-serif" }}>OPEN</text>
    </g>
  );
}

function Window({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <rect x={x} y={y} width="64" height="150" rx="3" fill={C.white} />
      <rect x={x + 5} y={y + 5} width="54" height="140" fill={C.glass} />
      <path d={`M${x + 8} ${y + 140}L${x + 44} ${y + 54}H${x + 58}L${x + 22} ${y + 140}z`} fill={C.glass2} />
      {Array.from({ length: 5 }, (_, i) => <rect key={i} x={x} y={y + i * 9} width="64" height="6" fill={C.white} />)}
    </g>
  );
}

function Sofa({ x, y }: { x: number; y: number }) {
  return (
    <g>
      {/* legs */}
      <rect x={x + 6} y={y + 84} width="7" height="22" fill={C.shoe} />
      <rect x={x + 187} y={y + 84} width="7" height="22" fill={C.shoe} />
      <rect x={x - 4} y={y + 80} width="208" height="6" rx="3" fill={C.shoe} />
      {/* back, seat, arms */}
      <rect x={x + 6} y={y} width="188" height="78" rx="14" fill={C.orange} />
      <rect x={x - 6} y={y + 52} width="212" height="34" rx="10" fill={C.orangeD} />
      <rect x={x - 10} y={y + 20} width="30" height="66" rx="12" fill={C.orange} />
      <rect x={x + 180} y={y + 20} width="30" height="66" rx="12" fill={C.orange} />
      {/* waiting customer */}
      <g transform={`translate(${x + 96} ${y})`}>
        <rect x="-18" y="80" width="62" height="16" rx="8" fill="#E7E0CF" />
        <rect x="18" y="82" width="14" height="30" rx="6" fill="#E7E0CF" />
        <ellipse cx="26" cy="114" rx="11" ry="4.500" fill={C.shoe} />
        <rect x="-30" y="66" width="86" height="18" rx="9" fill={C.white} />
        <rect x="44" y="70" width="15" height="40" rx="6" fill={C.white} />
        <ellipse cx="53" cy="112" rx="12" ry="5" fill={C.navy} />
        <path d="M-22 22c0-12 8-18 18-18h8c10 0 18 6 18 18l4 52h-48z" fill={C.navy2} />
        <path d="M-6 4h16l-8 12z" fill={C.white} />
        <rect x="-6" y="-8" width="12" height="14" rx="4" fill={C.skin} />
        <ellipse cx="0" cy="-18" rx="14" ry="16" fill={C.skin} />
        <path d="M-15 -20c-3-17 8-24 16-24s20 7 15 24c-3-8-9-11-15-11s-13 3-16 11z" fill={C.hair} />
        <circle cx="-5" cy="-17" r="1.800" fill={C.hair} /><circle cx="6" cy="-17" r="1.800" fill={C.hair} />
        <path d="M-4 -9q4 3 9 0" fill="none" stroke={C.hair} strokeWidth="1.800" strokeLinecap="round" />
        {/* arm and phone */}
        <path d="M-18 28l-4 24 24 8" fill="none" stroke={C.navy2} strokeWidth="13" strokeLinecap="round" strokeLinejoin="round" />
        <rect x="0" y="40" width="10" height="17" rx="2" fill={C.navy} />
        <rect x="2" y="42" width="6" height="12" fill={C.glass} />
        <circle cx="2" cy="60" r="6" fill={C.skin} />
      </g>
    </g>
  );
}

function Barber({ x, y, flip = false, pants = C.navy, apron = C.navy, hair = C.hair, stache = false, beard = false, bun = false, tool = "scissors" }: {
  x: number; y: number; flip?: boolean; pants?: string; apron?: string; hair?: string; stache?: boolean; beard?: boolean; bun?: boolean; tool?: "scissors" | "comb" | "razor";
}) {
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      <rect x="-15" y="-80" width="13" height="76" rx="5" fill={pants} />
      <rect x="2" y="-80" width="13" height="76" rx="5" fill={pants} />
      <ellipse cx="-12" cy="0" rx="12" ry="5" fill={C.shoe} />
      <ellipse cx="9" cy="0" rx="12" ry="5" fill={C.shoe} />
      {/* shirt + apron */}
      <rect x="-22" y="-142" width="44" height="72" rx="12" fill={C.white} />
      <path d="M-16 -112h32v44a4 4 0 0 1-4 4h-24a4 4 0 0 1-4-4z" fill={apron} />
      <path d="M-10 -138h20v28h-20z" fill={apron} />
      <path d="M-10 -138 -16 -144M10 -138 16 -144" stroke={apron} strokeWidth="4" strokeLinecap="round" />
      <rect x="-5" y="-152" width="10" height="12" rx="4" fill={C.skin} />
      {/* head facing left */}
      <ellipse cx="0" cy="-166" rx="14" ry="16" fill={C.skin} />
      <ellipse cx="5" cy="-165" rx="3" ry="4" fill={C.skinD} />
      <ellipse cx="-14" cy="-163" rx="3" ry="3.500" fill={C.skin} />
      <path d="M-14 -170c-2-17 10-24 18-22 10 2 13 12 10 22-3-8-8-11-14-10-5 1-10 4-14 10z" fill={hair} />
      {bun && <circle cx="3" cy="-188" r="6" fill={hair} />}
      <circle cx="-7" cy="-167" r="1.800" fill={C.hair} />
      {beard && <path d="M-13 -164c0 14 6 22 14 22s14-8 14-22c-3 7-8 9-14 9s-11-2-14-9z" fill={hair} />}
      {stache && <path d="M-15 -160c3-3 9-3 12-1-3 4-9 4-12 1z" fill={hair} />}
      <path d="M-9 -157q4 3 8 0" fill="none" stroke={beard ? C.skin : C.hair} strokeWidth="1.600" strokeLinecap="round" />
      {/* working arm */}
      <path d={tool === "comb" ? "M-16 -132 -42 -170" : "M-16 -132 -50 -150"} stroke={C.white} strokeWidth="12" strokeLinecap="round" />
      <circle cx={tool === "comb" ? -45 : -53} cy={tool === "comb" ? -172 : -151} r="6" fill={C.skin} />
      {tool === "scissors" && (
        <g transform="translate(-58 -156) rotate(-30)" fill="none" stroke={C.navy} strokeWidth="2.200" strokeLinecap="round">
          <path d="M0 0-6-15M0 0 6-15" /><circle cx="-3" cy="5" r="3" stroke={C.gold} /><circle cx="3" cy="5" r="3" stroke={C.gold} />
        </g>
      )}
      {tool === "comb" && <rect x="-66" y="-186" width="24" height="7" rx="2" fill={C.gold} />}
      {tool === "razor" && <rect x="-70" y="-157" width="20" height="5" rx="2" fill={C.glass} />}
      {/* resting arm */}
      <path d="M16 -132l8 28-14 2" fill="none" stroke={C.white} strokeWidth="11" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="9" cy="-103" r="5" fill={C.skin} />
    </g>
  );
}

function Seated({ x, y, flip = false, cape = C.navy2, upholstery = C.red, hair = C.hair, beard = false, foam = false, ginger = false, recline = false }: {
  x: number; y: number; flip?: boolean; cape?: string; upholstery?: string; hair?: string; beard?: boolean; foam?: boolean; ginger?: boolean; recline?: boolean;
}) {
  const h = ginger ? C.ginger : hair;
  return (
    <g transform={`translate(${x} ${y}) scale(${flip ? -1 : 1} 1)`}>
      {/* chair */}
      <ellipse cx="0" cy="-3" rx="34" ry="5" fill={C.shoe} />
      <rect x="-4" y="-54" width="8" height="52" fill={C.shoe} />
      <rect x="-30" y="-72" width="62" height="20" rx="9" fill={upholstery} />
      <rect x="-46" y="-156" width="18" height="100" rx="9" fill={upholstery} />
      <rect x="-34" y="-86" width="58" height="8" rx="4" fill={C.shoe} />
      {/* legs under the cape */}
      <rect x="32" y="-40" width="14" height="36" rx="5" fill={C.cream} />
      <ellipse cx="42" cy="0" rx="13" ry="5" fill={C.shoe} />
      {/* cape */}
      <path d="M-28 -128c0-10 8-14 22-14h14c14 0 22 6 22 16l4 40 24 4 4 42h-24l-2-24h-62z" fill={cape} />
      <path d="M-8 -140h16l-8 10z" fill={C.white} />
      <rect x="-6" y="-150" width="12" height="12" rx="4" fill={C.skin} />
      {/* head, profile facing right */}
      <ellipse cx="2" cy="-164" rx="14" ry="16" fill={C.skin} />
      <ellipse cx="-7" cy="-162" rx="3" ry="4" fill={C.skinD} />
      <ellipse cx="16" cy="-162" rx="3" ry="4" fill={C.skin} />
      <path d="M-13 -168c-3-18 8-26 17-24 11 2 14 12 11 22-3-7-9-10-14-9-6 1-10 4-14 11z" fill={h} />
      <circle cx="9" cy="-166" r="1.800" fill={C.hair} />
      {beard && <path d="M-10 -162c0 14 5 22 13 22s14-8 14-22c-3 6-7 8-13 8s-10-2-14-8z" fill={C.hair} />}
      {foam && (
        <g fill={C.white}>
          <circle cx="2" cy="-152" r="6" /><circle cx="10" cy="-152" r="5" /><circle cx="14" cy="-158" r="4" /><circle cx="-4" cy="-156" r="4.500" />
        </g>
      )}
      {recline && null}
    </g>
  );
}

export function BarbershopScene({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 960 360" preserveAspectRatio="xMidYMid slice" role="img" aria-label="সেলুনের ভেতরের দৃশ্য: কাউন্টার, আয়না, অপেক্ষার সোফা আর কাজ করছেন দুজন Hairdresser" className={className}>
      <rect width="960" height="360" fill={C.wall} />
      <rect width="960" height="22" fill={C.ceil} />
      {/* floor */}
      <rect y="270" width="960" height="90" fill={C.floor} />
      {Array.from({ length: 12 }, (_, i) => {
        const x0 = -240 + i * 130;
        return <path key={i} d={`M${x0} 270L${480 + (x0 - 480) * 1.45} 360`} stroke={C.tile} strokeWidth="2" />;
      })}
      {[284, 304, 330, 360].map((yy) => <rect key={yy} y={yy - 1} width="960" height="2" fill={C.tile} />)}

      {/* wall features */}
      <Bricks x={176} y={22} w={170} h={248} />
      <Bricks x={612} y={22} w={170} h={248} />
      <Frame x={46} y={52} kind="razor" />
      <Frame x={14} y={118} kind="scissors" />
      <Door x={210} y={58} />
      <Window x={398} y={46} />
      <Window x={470} y={46} />
      <Mirror x={644} y={72} w={50} h={126} />
      <Mirror x={716} y={72} w={50} h={126} />
      <Frame x={866} y={52} kind="scissors" />


      {/* pendant lamps */}
      {[150, 440, 700, 872].map((lx) => (
        <g key={lx}>
          <rect x={lx - 1} y="22" width="2" height="26" fill={C.navy2} />
          <path d={`M${lx - 16} 66a16 16 0 0 1 32 0z`} fill={C.gold} />
          <rect x={lx - 18} y="66" width="36" height="4" rx="2" fill={C.navy2} />
        </g>
      ))}

      {/* floor shadows */}
      {[[96, 338, 70], [150, 338, 40], [466, 338, 120], [620, 338, 70], [674, 338, 40], [820, 338, 70], [874, 338, 40]].map(([sx, sy, sr]) => (
        <ellipse key={`${sx}-${sy}`} cx={sx} cy={sy} rx={sr} ry="6" fill={C.navy} opacity=".12" />
      ))}
      {/* plant */}
      <g transform="translate(922 266) scale(.95)">
        <path d="M0 0h26l-3 38h-20z" fill={C.navy2} />
        <path d="M13 0C2-22-4-34 6-48 8-30 14-22 13 0zM13 0C24-18 34-26 30-44 20-32 14-20 13 0zM13 0C12-26 16-40 24-52 24-34 20-18 13 0z" fill="#4C9A78" />
      </g>

      {/* furniture and people */}
      <Counter x={8} y={206} w={186} />
      <Counter x={612} y={206} w={216} />
      <Seated x={88} y={336} cape={C.navy2} upholstery={C.mid} foam />
      <Barber x={146} y={334} pants={C.orange} apron={C.orangeD} hair={C.hair} bun tool="razor" />
      <Sofa x={366} y={224} />
      <Seated x={612} y={336} cape={C.orangeD} upholstery={C.navy} beard />
      <Barber x={672} y={332} pants={C.navy} apron={C.navy} hair={C.ginger} beard stache />
      <Seated x={812} y={336} cape={C.navy2} upholstery={C.red} hair="#5A3A2A" />
      <Barber x={878} y={334} pants={C.orange} apron={C.navy} stache tool="comb" />
    </svg>
  );
}
