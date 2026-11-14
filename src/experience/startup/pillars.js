import { smooth } from "./timeline";

// Square caps and parallel shafts on a rectangular lattice. Small cap-depth
// differences create perspective, without independently rotating any column.
export function pillarField() {
  const tones = [
    [.42,.455,.614], [.34,.372,.512], [.52,.554,.684],
    [.25,.273,.377], [.46,.491,.638], [.155,.17,.235],
  ];
  const pillars = [];
  for (let row=0; row<8; row++) for (let col=0; col<14; col++) {
    if ((col===6 || col===7) && (row===3 || row===4)) continue;
    const hash=row*19+col*11;
    const front=-112-(hash%17)*1.05;
    const depth=26;
    pillars.push({x:(col-6.5)*4.7,y:(3.5-row)*4.7,front,depth,
      width:3.0,color:tones[hash%tones.length],clarity:1});
  }
  // A second, much deeper lattice only fills the empty corners during a roll.
  // It shares the foreground grid axes and the same batched draw call.
  for(let row=0;row<20;row++) for(let col=0;col<20;col++) {
    if(col>=3 && col<=16 && row>=6 && row<=13) continue;
    const hash=row*23+col*17;
    pillars.push({x:(col-9.5)*4.7,y:(9.5-row)*4.7,
      front:-142-(hash%9),depth:5+hash%4,width:2.1,
      color:tones[hash%tones.length],clarity:.42+(hash%3)*.035});
  }
  return pillars;
}
export function startupVisibility(seconds) {
  const blocks=1-smooth(4.02,4.43,seconds);
  return {
    blocks,
    smoke:(.18+.82*smooth(.23,.48,seconds))*blocks,
    pillars:0,
  };
}
